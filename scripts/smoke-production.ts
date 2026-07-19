import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();

function cookieHeader(response: Response) {
  const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [response.headers.get("set-cookie") ?? ""];
  return values.map((value) => value.split(";", 1)[0]).filter(Boolean).join("; ");
}

async function main() {
  const baseUrl = (process.env.SMOKE_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");
  const email = process.env.SMOKE_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SMOKE_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
  if (!baseUrl || !email || !password) throw new Error("SMOKE_BASE_URL, SMOKE_ADMIN_EMAIL, dan SMOKE_ADMIN_PASSWORD wajib diisi.");

  const login = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  if (!login.ok) throw new Error(`Login gagal (${login.status}): ${await login.text()}`);
  const cookie = cookieHeader(login);
  if (!cookie) throw new Error("Cookie sesi tidak diterima setelah login.");
  const headers = { Cookie: cookie };

  const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, { headers });
  const session = await sessionResponse.json();
  if (!sessionResponse.ok || !session?.user?.branchCode) throw new Error("Session Better Auth tidak valid.");

  const dashboardResponse = await fetch(`${baseUrl}/api/dashboard-data?branch=9999`, { headers });
  const dashboard = await dashboardResponse.json();
  if (!dashboardResponse.ok || !dashboard.ok) throw new Error(`Dashboard API gagal: ${dashboard.message ?? dashboardResponse.status}`);
  if (session.user.role !== "SuperAdmin" && dashboard.branchCode !== session.user.branchCode) {
    throw new Error("Isolasi branch gagal: user dapat meminta data branch lain.");
  }

  const now = new Date();
  const period = dashboard.latestPeriod ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const workDate = now.toISOString().slice(0, 10);
  const quickCountResponse = await fetch(`${baseUrl}/api/quick-count?period=${encodeURIComponent(period)}&date=${workDate}`, { headers });
  const quickCount = await quickCountResponse.json();
  if (!quickCountResponse.ok || !quickCount.ok) throw new Error(`Quick Count API gagal: ${quickCount.message ?? quickCountResponse.status}`);

  console.log(`Login dan session lulus: ${session.user.username ?? session.user.email}`);
  console.log(`Isolasi branch lulus: ${dashboard.branchCode}`);
  console.log(`Dashboard dan Quick Count API lulus.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
