import { databaseUrl, sql } from "@/db";
import { storageBackend } from "@/lib/object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sql`select 1`;
    const databaseHost = (() => {
      try { return new URL(databaseUrl).hostname; } catch { return "unknown"; }
    })();
    const localHosts = new Set(["127.0.0.1", "localhost", "::1", "database"]);
    return Response.json({
      ok: true,
      service: "bri-tool",
      database: localHosts.has(databaseHost) ? "local" : "remote",
      storage: storageBackend(),
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ ok: false, service: "bri-tool" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
