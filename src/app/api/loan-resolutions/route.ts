import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, missingLoanResolutions } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;

  const body = await request.json().catch(() => ({}));
  const accountNumber = String(body.accountNumber ?? "").trim();
  const period = String(body.period ?? "").trim();
  const status = String(body.status ?? "").trim();
  if (!accountNumber || !/^\d{4}-\d{2}$/.test(period) || !["PH", "Lunas"].includes(status)) {
    return NextResponse.json({ ok: false, message: "Rekening, periode, atau status PH/Lunas tidak valid." }, { status: 400 });
  }

  const branchCode = authResult.session.user.branchCode ?? "8014";
  const now = new Date();
  const existing = await db.select({ id: missingLoanResolutions.id })
    .from(missingLoanResolutions)
    .where(and(
      eq(missingLoanResolutions.branchCode, branchCode),
      eq(missingLoanResolutions.period, period),
      eq(missingLoanResolutions.accountNumber, accountNumber),
    ))
    .limit(1);

  const record = {
    id: existing[0]?.id ?? crypto.randomUUID(),
    branchCode,
    period,
    accountNumber,
    status,
    updatedBy: authResult.session.user.id,
    updatedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.insert(missingLoanResolutions).values(record).onConflictDoUpdate({
      target: [missingLoanResolutions.branchCode, missingLoanResolutions.period, missingLoanResolutions.accountNumber],
      set: { status, updatedBy: authResult.session.user.id, updatedAt: now },
    });
    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: authResult.session.user.id,
      action: "SET_STATUS_REKENING_HILANG",
      entity: "missing_loan_resolution",
      entityId: record.id,
      detail: `${accountNumber} | ${period} | ${status}`,
      branchCode,
      createdAt: now,
    });
  });

  return NextResponse.json({ ok: true, data: { period, accountNumber, status } });
}
