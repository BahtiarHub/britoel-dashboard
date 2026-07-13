import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, ckpnForecasts } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTargets = new Set(["Lancar", "LR", "SML1", "SML2", "SML3", "KL/D", "Macet", "Lunas", "PH"]);

export async function PATCH(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;

  const body = await request.json().catch(() => ({}));
  const accountNumber = String(body.accountNumber ?? "").trim();
  const period = String(body.period ?? "").trim();
  const targetCollectibility = String(body.targetCollectibility ?? "").trim();
  if (!accountNumber || !/^\d{4}-\d{2}$/.test(period) || !allowedTargets.has(targetCollectibility)) {
    return NextResponse.json({ ok: false, message: "Rekening, periode, atau kolektibilitas prognosa tidak valid." }, { status: 400 });
  }

  const branchCode = authResult.session.user.branchCode ?? "8014";
  const now = new Date();
  const existing = await db.select({ id: ckpnForecasts.id })
    .from(ckpnForecasts)
    .where(and(
      eq(ckpnForecasts.branchCode, branchCode),
      eq(ckpnForecasts.period, period),
      eq(ckpnForecasts.accountNumber, accountNumber),
    ))
    .limit(1);

  const record = {
    id: existing[0]?.id ?? crypto.randomUUID(),
    branchCode,
    period,
    accountNumber,
    targetCollectibility,
    updatedBy: authResult.session.user.id,
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.insert(ckpnForecasts).values(record).onConflictDoUpdate({
      target: [ckpnForecasts.branchCode, ckpnForecasts.period, ckpnForecasts.accountNumber],
      set: { targetCollectibility, updatedBy: authResult.session.user.id, updatedAt: now },
    }).run();
    tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: authResult.session.user.id,
      action: "SET_PROGNOSA_CKPN",
      entity: "ckpn_forecast",
      entityId: record.id,
      detail: `${accountNumber} | ${period} | ${targetCollectibility}`,
      branchCode,
      createdAt: now,
    }).run();
  });

  return NextResponse.json({ ok: true, data: { period, accountNumber, targetCollectibility } });
}
