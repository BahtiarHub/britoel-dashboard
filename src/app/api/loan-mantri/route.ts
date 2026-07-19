import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, loanMantriAssignments, loanRecords } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { hasLoanMantri } from "@/lib/loan-mantri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => ({}));
  const accountNumber = String(body.accountNumber ?? "").replace(/\D/g, "");
  const mantri = String(body.mantri ?? "").trim();
  if (!/^\d{15}$/.test(accountNumber)) {
    return NextResponse.json({ ok: false, message: "No rekening harus terdiri dari 15 angka." }, { status: 400 });
  }

  const branchCode = guard.session.user.branchCode ?? "8014";
  const latestLoan = (await db.select({ mantri: loanRecords.mantri })
    .from(loanRecords)
    .where(and(eq(loanRecords.branchCode, branchCode), eq(loanRecords.accountNumber, accountNumber)))
    .orderBy(desc(loanRecords.period))
    .limit(1))[0];
  if (!latestLoan) {
    return NextResponse.json({ ok: false, message: "Rekening tidak ditemukan pada data pinjaman unit kerja." }, { status: 404 });
  }
  if (hasLoanMantri(latestLoan.mantri)) {
    return NextResponse.json({ ok: false, message: "PN pengelola sudah tersedia dari file LW321 dan tidak dapat ditimpa manual." }, { status: 409 });
  }

  if (mantri) {
    const registeredMantri = await db.select({ accountNumber: loanRecords.accountNumber })
      .from(loanRecords)
      .where(and(eq(loanRecords.branchCode, branchCode), eq(loanRecords.mantri, mantri)))
      .limit(1);
    if (!registeredMantri.length) {
      return NextResponse.json({ ok: false, message: "Mantri tidak terdaftar pada data LW321 unit kerja." }, { status: 400 });
    }
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    if (mantri) {
      await tx.insert(loanMantriAssignments).values({
        id: crypto.randomUUID(),
        branchCode,
        accountNumber,
        mantri,
        updatedBy: guard.session.user.id,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: [loanMantriAssignments.branchCode, loanMantriAssignments.accountNumber],
        set: { mantri, updatedBy: guard.session.user.id, updatedAt: now },
      });
    } else {
      await tx.delete(loanMantriAssignments).where(and(
        eq(loanMantriAssignments.branchCode, branchCode),
        eq(loanMantriAssignments.accountNumber, accountNumber),
      ));
    }
    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: guard.session.user.id,
      action: mantri ? "ASSIGN_LOAN_MANTRI" : "CLEAR_LOAN_MANTRI_ASSIGNMENT",
      entity: "loan_mantri_assignment",
      entityId: `${branchCode}:${accountNumber}`,
      detail: `${accountNumber} | ${mantri || "Penugasan dikosongkan"}`,
      branchCode,
      createdAt: now,
    });
  });

  return NextResponse.json({ ok: true, data: { accountNumber, mantri } });
}
