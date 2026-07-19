import { eq } from "drizzle-orm";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.BETTER_AUTH_ALLOW_SIGNUP = "true";

function cookieHeader(response: Response) {
  const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [response.headers.get("set-cookie") ?? ""];
  return values.map((value) => value.split(";", 1)[0]).filter(Boolean).join("; ");
}

async function main() {
  const branchCode = "9997";
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-11).padStart(11, "0");
  const oldAccount = `${branchCode}${suffix}`;
  const newAccount = `${branchCode}${String(Number(suffix) + 1).padStart(11, "0").slice(-11)}`;
  const identity = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const username = `${branchCode}-AUDIT_${identity}`;
  const email = `suplesi-${identity}@bri-tool.local`;
  const password = `Audit-${identity}-2026!`;
  const baseUrl = (process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const { auth } = await import("../src/lib/auth");
  const { db } = await import("../src/db");
  const { auditLogs, brimenCustomers, covenanceRecords, user } = await import("../src/db/schema");
  let userId = "";

  try {
    const signup = await auth.api.signUpEmail({ body: { name: "Audit Suplesi BRIMEN", email, password, username } });
    userId = signup.user.id;
    await db.update(user).set({ username, displayUsername: username, branchCode, role: "Admin", active: true, updatedAt: new Date() }).where(eq(user.id, userId));

    const login = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ email, password }),
      redirect: "manual",
    });
    if (!login.ok) throw new Error(`Login gagal (${login.status}): ${await login.text()}`);
    const cookie = cookieHeader(login);
    if (!cookie) throw new Error("Cookie session tidak diterima.");
    const headers = { Cookie: cookie, "Content-Type": "application/json" };

    const createResponse = await fetch(`${baseUrl}/api/brimen`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        accountNumber: oldAccount,
        name: "Nasabah Audit Suplesi",
        plafond: 25_000_000,
        realizationDate: "2026-06-10",
        brimenBerkas: "I.A.1.1",
        status: "Disimpan",
      }),
    });
    const created = await createResponse.json();
    if (!createResponse.ok || !created.ok) throw new Error(`Tambah BRIMEN gagal: ${created.message ?? createResponse.status}`);

    const patchResponse = await fetch(`${baseUrl}/api/brimen/${created.data.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        ...created.data,
        accountNumber: newAccount,
        plafond: 35_000_000,
        realizationDate: "2026-07-19",
        sphNumber: "SPH-TEST-001",
        creditApplicationNumber: "SPK-TEST-001",
        ktpNumber: "3215000000000001",
        kkNumber: "3215000000000002",
        skuNibNumber: "NIB-TEST-001",
        slikOjk: "010000000000001",
      }),
    });
    const patched = await patchResponse.json();
    if (!patchResponse.ok || !patched.ok || !patched.covenanceSaved || patched.data.accountNumber !== newAccount) {
      throw new Error(`Suplesi gagal: ${patched.message ?? patchResponse.status}`);
    }

    const covenanceResponse = await fetch(`${baseUrl}/api/covenance`, { headers: { Cookie: cookie } });
    const covenance = await covenanceResponse.json();
    const savedDocument = covenance.data?.find((row: { accountNumber: string; realizedDate: string }) => row.accountNumber === newAccount && row.realizedDate === "2026-07-19");
    if (!covenanceResponse.ok || !savedDocument || savedDocument.sphNumber !== "SPH-TEST-001") {
      throw new Error("Dokumen Covenance hasil Suplesi tidak dapat dibaca kembali.");
    }

    console.log("Perubahan No Rekening pada Suplesi lulus.");
    console.log("Penyimpanan dan pembacaan Covenance Day dari Suplesi lulus.");
  } finally {
    await db.delete(covenanceRecords).where(eq(covenanceRecords.branchCode, branchCode));
    await db.delete(auditLogs).where(eq(auditLogs.branchCode, branchCode));
    await db.delete(brimenCustomers).where(eq(brimenCustomers.branchCode, branchCode));
    if (userId) await db.delete(user).where(eq(user.id, userId));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
