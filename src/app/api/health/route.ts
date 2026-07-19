import { sql } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sql`select 1`;
    return Response.json({ ok: true, service: "bri-tool" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ ok: false, service: "bri-tool" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
