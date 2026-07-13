import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const branchCode = guard.session.user.branchCode ?? "8014";

  const query = db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      detail: auditLogs.detail,
      branchCode: auditLogs.branchCode,
      createdAt: auditLogs.createdAt,
      actor: user.name,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id));
  const rows = guard.session.user.role === "SuperAdmin"
    ? await query.orderBy(desc(auditLogs.createdAt)).limit(100)
    : await query.where(eq(auditLogs.branchCode, branchCode)).orderBy(desc(auditLogs.createdAt)).limit(100);

  return NextResponse.json({ ok: true, data: rows });
}
