import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { depositRecords, loanRecords, uploadRecords } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const url = new URL(request.url);
  const ownBranch = guard.session.user.branchCode ?? "8014";
  const requestedBranch = String(url.searchParams.get("branch") ?? ownBranch);
  const branchCode = guard.session.user.role === "SuperAdmin" && /^\d{4}$/.test(requestedBranch) ? requestedBranch : ownBranch;

  const rows = await db.select().from(loanRecords).where(eq(loanRecords.branchCode, branchCode)).orderBy(loanRecords.period, loanRecords.accountNumber);
  const deposits = await db.select().from(depositRecords).where(eq(depositRecords.branchCode, branchCode)).orderBy(depositRecords.period, depositRecords.loanAccountNumber);
  const latestUploads = await db.select({
    id: uploadRecords.id,
    sourceKey: uploadRecords.sourceKey,
    sourceName: uploadRecords.sourceName,
    fileName: uploadRecords.fileName,
    rowCount: uploadRecords.rowCount,
    createdAt: uploadRecords.createdAt,
  }).from(uploadRecords).where(and(eq(uploadRecords.branchCode, branchCode), eq(uploadRecords.status, "Berhasil"))).orderBy(desc(uploadRecords.createdAt)).limit(20);

  const periods = [...new Set(rows.map((item) => item.period))].sort();
  return NextResponse.json({
    ok: true,
    source: rows.length ? "upload" : "mock",
    branchCode,
    periods,
    latestPeriod: periods.at(-1) ?? null,
    data: rows.map((item) => ({
      month: item.period,
      accountNumber: item.accountNumber,
      debtorName: item.debtorName,
      nextPaymentDate: item.nextPaymentDate,
      outstanding: item.outstanding,
      plafond: item.plafond,
      rawCollectibility: item.collectibility,
      flagRestruk: item.restructureFlag,
      mantri: item.mantri,
      pnPengelolaSinglePn: item.pnPengelola,
      description: item.description,
      realizedDate: item.realizedDate,
      realizedAmount: item.realizedAmount,
    })),
    di319: deposits.map((item) => ({
      period: item.period,
      loanAccountNumber: item.loanAccountNumber,
      debtorName: item.debtorName,
      mantri: item.mantri,
      savingsAccount: item.savingsAccount,
      blockedAtStart: item.blockedAtStart,
      currentBlocked: item.currentBlocked,
      installmentFromBlocked: item.installmentFromBlocked,
      mutationDate: item.mutationDate,
      status: item.status,
    })),
    uploads: latestUploads,
  });
}
