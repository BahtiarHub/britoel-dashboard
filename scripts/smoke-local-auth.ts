import { and, eq } from "drizzle-orm";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.BETTER_AUTH_ALLOW_SIGNUP = "true";

function cookieHeader(response: Response) {
  const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [response.headers.get("set-cookie") ?? ""];
  return values.map((value) => value.split(";", 1)[0]).filter(Boolean).join("; ");
}

async function main() {
  const branchCode = "9998";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const username = `${branchCode}-AUDIT_${suffix}`;
  const email = `audit-${suffix}@bri-tool.local`;
  const password = `Audit-${suffix}-2026!`;
  const baseUrl = (process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const { auth } = await import("../src/lib/auth");
  const { db } = await import("../src/db");
  const { auditLogs, quickCountResults, user } = await import("../src/db/schema");
  let userId = "";

  try {
    const signup = await auth.api.signUpEmail({
      body: { name: "Audit Branch Isolation", email, password, username },
    });
    userId = signup.user.id;
    await db.update(user).set({
      username,
      displayUsername: username,
      branchCode,
      role: "Admin",
      active: true,
      updatedAt: new Date(),
    }).where(eq(user.id, userId));

    const login = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ email, password }),
      redirect: "manual",
    });
    if (!login.ok) throw new Error(`Login gagal (${login.status}): ${await login.text()}`);
    const cookie = cookieHeader(login);
    if (!cookie) throw new Error("Cookie session tidak diterima.");
    const headers = { Cookie: cookie };

    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, { headers });
    const session = await sessionResponse.json();
    if (!sessionResponse.ok || session?.user?.branchCode !== branchCode) throw new Error("Better Auth session atau branch akun uji tidak valid.");

    const dashboardResponse = await fetch(`${baseUrl}/api/dashboard-data?branch=8014`, { headers });
    const dashboard = await dashboardResponse.json();
    if (!dashboardResponse.ok || dashboard.branchCode !== branchCode) throw new Error("Isolasi branch dashboard gagal.");

    const period = "2026-07";
    const workDate = new Date().toISOString().slice(0, 10);
    const saveResponse = await fetch(`${baseUrl}/api/quick-count`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        period,
        workDate,
        rows: [{ accountNumber: "999800000000001", name: "Data Uji", quality: "SML1", billing: 100000, actToday: 25000, remaining: 75000, address: "Data uji" }],
        forecasts: { "999800000000001": "Lancar" },
      }),
    });
    const saved = await saveResponse.json();
    if (!saveResponse.ok || !saved.ok) throw new Error(`Penyimpanan Quick Count gagal: ${saved.message ?? saveResponse.status}`);

    const readResponse = await fetch(`${baseUrl}/api/quick-count?period=${period}&date=${workDate}&branch=8014`, { headers });
    const read = await readResponse.json();
    if (!readResponse.ok || read.branchCode !== branchCode || read.data?.length !== 1) throw new Error("Isolasi atau sinkronisasi Quick Count gagal.");

    console.log("Better Auth login dan session lulus.");
    console.log("Isolasi dashboard dan Quick Count per branch lulus.");
    console.log("Quick Count PostgreSQL baca/tulis lulus.");
  } finally {
    await db.delete(quickCountResults).where(eq(quickCountResults.branchCode, branchCode));
    await db.delete(auditLogs).where(and(eq(auditLogs.branchCode, branchCode), eq(auditLogs.action, "QUICK_COUNT_SAVE")));
    if (userId) await db.delete(user).where(eq(user.id, userId));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
