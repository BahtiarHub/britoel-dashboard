import { and, desc, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, brimenCustomers, brimenFileLoanLogs, brimenFileLoans } from "@/db/schema";
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
  handoverPhoto: brimenFileLoans.handoverPhoto,
  handoverBy: brimenFileLoans.handoverBy,
  handoverAt: brimenFileLoans.handoverAt,
  receivedAt: brimenFileLoans.receivedAt,
  returnReason: brimenFileLoans.returnReason,
  returnPhoto: brimenFileLoans.returnPhoto,
  returnRequestedAt: brimenFileLoans.returnRequestedAt,
  returnConfirmedBy: brimenFileLoans.returnConfirmedBy,
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
  if (!includeHistory) conditions.push(ne(brimenFileLoans.status, "Sudah Dikembalikan"));
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
    if (guard.session.user.role !== "Mantri") {
      return NextResponse.json({ ok: false, message: "Pengajuan peminjaman berkas hanya dapat dilakukan oleh Mantri." }, { status: 403 });
    }
    const body = await request.json();
    if (!body.customerId) return NextResponse.json({ ok: false, message: "Data nasabah wajib dipilih." }, { status: 400 });

    const customer = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, body.customerId)).limit(1))[0];
    if (!customer) return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
    if (customer.branchCode !== guard.session.user.branchCode) {
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }
    if (!customer.brimenBerkas.trim()) {
      return NextResponse.json({ ok: false, message: "Berkas belum memiliki No BRIMEN dan belum dapat dipinjam." }, { status: 400 });
    }
    const activeLoan = (await db.select({ id: brimenFileLoans.id, status: brimenFileLoans.status }).from(brimenFileLoans)
      .where(and(eq(brimenFileLoans.customerId, customer.id), ne(brimenFileLoans.status, "Sudah Dikembalikan"))).limit(1))[0];
    if (activeLoan) {
      return NextResponse.json({ ok: false, message: `Berkas masih memiliki proses aktif: ${activeLoan.status}.` }, { status: 409 });
    }

    const now = new Date();
    const borrowerName = guard.session.user.name;
    const borrowerUsername = guard.session.user.displayUsername ?? guard.session.user.username ?? guard.session.user.name;
    const loan = {
      id: newId("loan"),
      customerId: customer.id,
      borrowerName,
      borrowerUsername,
      loanDate: body.loanDate || now.toISOString().slice(0, 10),
      returnedDate: null,
      status: "Pengajuan Pinjam Berkas",
      purpose: String(body.purpose ?? "Keperluan operasional Mantri").trim(),
      handoverPhoto: "",
      handoverBy: "",
      handoverAt: null,
      receivedAt: null,
      returnReason: "",
      returnPhoto: "",
      returnRequestedAt: null,
      returnConfirmedBy: "",
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction(async (tx) => {
      await tx.insert(brimenFileLoans).values(loan);
      await tx.insert(brimenFileLoanLogs).values({
        id: newId("log"),
        loanId: loan.id,
        actor: loan.borrowerUsername,
        message: "Mantri mengajukan peminjaman berkas. Menunggu konfirmasi penyerahan oleh CS.",
        createdAt: now,
      });
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(), actorId: guard.session.user.id, action: "BRIMEN_LOAN_REQUEST", entity: "brimen_file_loan", entityId: loan.id,
        detail: `${customer.accountNumber} | ${customer.name} | Pengajuan Pinjam Berkas`, branchCode: customer.branchCode, createdAt: now,
      });
    });

    return NextResponse.json({ ok: true, data: loan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal membuat peminjaman berkas.", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
