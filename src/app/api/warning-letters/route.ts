import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, warningLetters } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedLevels = new Set(["SP1", "SP2", "SP3"]);

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const period = new URL(request.url).searchParams.get("period") ?? "";
  const rows = period
    ? await db.select().from(warningLetters).where(and(eq(warningLetters.branchCode, branchCode), eq(warningLetters.period, period))).orderBy(desc(warningLetters.createdAt))
    : await db.select().from(warningLetters).where(eq(warningLetters.branchCode, branchCode)).orderBy(desc(warningLetters.createdAt)).limit(500);
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const body = await request.json().catch(() => ({}));
  const period = String(body.period ?? "").trim();
  const accountNumber = String(body.accountNumber ?? "").trim();
  const debtorName = String(body.debtorName ?? "").trim();
  const level = String(body.level ?? "").trim();
  const letterNumber = String(body.letterNumber ?? "").trim();
  const issuedAt = String(body.issuedAt ?? "").trim();
  const dueDate = String(body.dueDate ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(period) || !accountNumber || !debtorName || !allowedLevels.has(level) || !letterNumber || !/^\d{4}-\d{2}-\d{2}$/.test(issuedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json({ ok: false, message: "Data surat peringatan belum lengkap atau tidak valid." }, { status: 400 });
  }

  const branchCode = authResult.session.user.branchCode ?? "8014";
  const existing = await db.select({ id: warningLetters.id }).from(warningLetters).where(and(
    eq(warningLetters.branchCode, branchCode),
    eq(warningLetters.period, period),
    eq(warningLetters.accountNumber, accountNumber),
    eq(warningLetters.level, level),
  )).limit(1);
  const now = new Date();
  const record = {
    id: existing[0]?.id ?? crypto.randomUUID(),
    branchCode,
    period,
    accountNumber,
    debtorName,
    level,
    letterNumber,
    issuedAt,
    dueDate,
    recipientAddress: "di Tempat",
    penalty: Math.max(0, Math.round(Number(body.penalty) || 0)),
    signerName: String(body.signerName ?? "").trim(),
    signerTitle: String(body.signerTitle ?? "Kepala Unit").trim() || "Kepala Unit",
    status: body.status === "Dikirim" ? "Dikirim" : "Dibuat",
    createdBy: authResult.session.user.id,
    createdAt: now,
  };

  db.transaction((tx) => {
    tx.insert(warningLetters).values(record).onConflictDoUpdate({
      target: [warningLetters.branchCode, warningLetters.period, warningLetters.accountNumber, warningLetters.level],
      set: {
        letterNumber: record.letterNumber,
        issuedAt: record.issuedAt,
        dueDate: record.dueDate,
        recipientAddress: record.recipientAddress,
        penalty: record.penalty,
        signerName: record.signerName,
        signerTitle: record.signerTitle,
        status: record.status,
        createdBy: record.createdBy,
        createdAt: now,
      },
    }).run();
    tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: authResult.session.user.id,
      action: "BUAT_SURAT_PERINGATAN",
      entity: "warning_letter",
      entityId: record.id,
      detail: `${level} | ${accountNumber} | ${letterNumber}`,
      branchCode,
      createdAt: now,
    }).run();
  });

  return NextResponse.json({ ok: true, data: record }, { status: existing.length ? 200 : 201 });
}
