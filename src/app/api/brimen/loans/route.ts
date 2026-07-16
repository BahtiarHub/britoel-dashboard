import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { brimenCustomers, brimenFileLoanLogs, brimenFileLoans } from "@/db/schema";
import { newId, normalizeLoan, type BrimenLoanRow } from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loanColumns = {
  id: brimenFileLoans.id,
  customerId: brimenFileLoans.customerId,
  borrowerName: brimenFileLoans.borrowerName,
  borrowerUsername: brimenFileLoans.borrowerUsername,
  loanDate: brimenFileLoans.loanDate,
  returnedDate: brimenFileLoans.returnedDate,
  status: brimenFileLoans.status,
  purpose: brimenFileLoans.purpose,
  createdAt: brimenFileLoans.createdAt,
  updatedAt: brimenFileLoans.updatedAt,
  accountNumber: brimenCustomers.accountNumber,
  customerName: brimenCustomers.name,
  plafond: brimenCustomers.plafond,
  mantri: brimenCustomers.mantri,
  brimenBerkas: brimenCustomers.brimenBerkas,
  brimenJaminan: brimenCustomers.brimenJaminan,
  guarantee: brimenCustomers.guarantee,
};

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const includeHistory = new URL(request.url).searchParams.get("history") === "1";
  const conditions = [];
  if (!includeHistory) conditions.push(eq(brimenFileLoans.status, "Dipinjam"));
  if (guard.session.user.role !== "SuperAdmin") conditions.push(eq(brimenCustomers.branchCode, guard.session.user.branchCode ?? "8014"));

  const rows = await db.select(loanColumns)
    .from(brimenFileLoans)
    .innerJoin(brimenCustomers, eq(brimenFileLoans.customerId, brimenCustomers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(brimenFileLoans.updatedAt));

  return NextResponse.json({ ok: true, data: rows.map((row) => normalizeLoan(row as BrimenLoanRow)) });
}

export async function POST(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  try {
    const body = await request.json();
    if (!body.customerId) return NextResponse.json({ ok: false, message: "Data nasabah wajib dipilih." }, { status: 400 });
    if (!body.borrowerName?.trim() || !body.borrowerUsername?.trim()) {
      return NextResponse.json({ ok: false, message: "Nama peminjam dan username wajib diisi." }, { status: 400 });
    }

    const customer = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, body.customerId)).limit(1))[0];
    if (!customer) return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
    if (guard.session.user.role !== "SuperAdmin" && customer.branchCode !== guard.session.user.branchCode) {
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }

    const now = new Date();
    const loan = {
      id: newId("loan"),
      customerId: customer.id,
      borrowerName: String(body.borrowerName).trim(),
      borrowerUsername: String(body.borrowerUsername).trim(),
      loanDate: body.loanDate || now.toISOString().slice(0, 10),
      returnedDate: null,
      status: "Dipinjam",
      purpose: body.purpose ?? "",
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction(async (tx) => {
      await tx.insert(brimenFileLoans).values(loan);
      await tx.update(brimenCustomers).set({ status: "Dipinjam", updatedAt: now }).where(eq(brimenCustomers.id, customer.id));
      await tx.insert(brimenFileLoanLogs).values({
        id: newId("log"),
        loanId: loan.id,
        actor: loan.borrowerUsername,
        message: "Peminjam mengkonfirmasi berkas diterima. Status berkas menjadi Dipinjam.",
        createdAt: now,
      });
    });

    return NextResponse.json({ ok: true, data: loan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal membuat peminjaman berkas.", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
