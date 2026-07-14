import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, covenanceRecords } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const period = new URL(request.url).searchParams.get("period")?.trim();
  const rows = period
    ? await db.select().from(covenanceRecords).where(and(eq(covenanceRecords.branchCode, branchCode), eq(covenanceRecords.period, period))).orderBy(desc(covenanceRecords.updatedAt))
    : await db.select().from(covenanceRecords).where(eq(covenanceRecords.branchCode, branchCode)).orderBy(desc(covenanceRecords.updatedAt)).limit(5000);
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const body = await request.json().catch(() => ({}));
  const period = String(body.period ?? "").trim();
  const accountNumber = String(body.accountNumber ?? "").replace(/\D/g, "");
  const debtorName = String(body.debtorName ?? "").trim();
  const realizedDate = String(body.realizedDate ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(period) || !accountNumber || !debtorName || !/^\d{4}-\d{2}-\d{2}$/.test(realizedDate)) {
    return NextResponse.json({ ok: false, message: "Identitas data Covenance belum lengkap atau tidak valid." }, { status: 400 });
  }

  const branchCode = authResult.session.user.branchCode ?? "8014";
  const existing = await db.select({ id: covenanceRecords.id }).from(covenanceRecords).where(and(
    eq(covenanceRecords.branchCode, branchCode),
    eq(covenanceRecords.accountNumber, accountNumber),
    eq(covenanceRecords.realizedDate, realizedDate),
  )).limit(1);
  const now = new Date();
  const record = {
    id: existing[0]?.id ?? crypto.randomUUID(),
    branchCode,
    period,
    accountNumber,
    debtorName,
    realizedDate,
    sphNumber: String(body.sphNumber ?? "").trim(),
    creditApplicationNumber: String(body.creditApplicationNumber ?? "").trim(),
    ktpNumber: String(body.ktpNumber ?? "").replace(/\s/g, ""),
    kkNumber: String(body.kkNumber ?? "").replace(/\s/g, ""),
    skuNibNumber: String(body.skuNibNumber ?? "").trim(),
    slikOjk: String(body.slikOjk ?? "").trim(),
    updatedBy: authResult.session.user.id,
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.insert(covenanceRecords).values(record).onConflictDoUpdate({
      target: [covenanceRecords.branchCode, covenanceRecords.accountNumber, covenanceRecords.realizedDate],
      set: {
        period: record.period,
        debtorName: record.debtorName,
        sphNumber: record.sphNumber,
        creditApplicationNumber: record.creditApplicationNumber,
        ktpNumber: record.ktpNumber,
        kkNumber: record.kkNumber,
        skuNibNumber: record.skuNibNumber,
        slikOjk: record.slikOjk,
        updatedBy: record.updatedBy,
        updatedAt: now,
      },
    }).run();
    tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: authResult.session.user.id,
      action: existing.length ? "UPDATE_COVENANCE" : "ISI_COVENANCE",
      entity: "covenance_record",
      entityId: record.id,
      detail: `${accountNumber} | ${realizedDate}`,
      branchCode,
      createdAt: now,
    }).run();
  });

  return NextResponse.json({ ok: true, data: record }, { status: existing.length ? 200 : 201 });
}
