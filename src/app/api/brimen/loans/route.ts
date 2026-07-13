import { NextResponse } from "next/server";
import { newId, normalizeLoan, nowIso, openBrimenDb, type BrimenLoanRow } from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loanSelect = `
  select
    file_loans.id,
    file_loans.customer_id,
    file_loans.borrower_name,
    file_loans.borrower_username,
    file_loans.loan_date,
    file_loans.returned_date,
    file_loans.status,
    file_loans.purpose,
    file_loans.created_at,
    file_loans.updated_at,
    customers.account_number,
    customers.name as customer_name,
    customers.plafond,
    customers.mantri,
    customers.brimen_berkas,
    customers.brimen_jaminan,
    customers.guarantee
  from file_loans
  inner join customers on file_loans.customer_id = customers.id
`;

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get("history") === "1";
  const db = openBrimenDb(true);
  const clauses = [includeHistory ? null : "file_loans.status = 'Dipinjam'", guard.session.user.role === "SuperAdmin" ? null : "customers.branch_code = ?"].filter(Boolean);
  const rows = db.prepare(
    `${loanSelect} ${clauses.length ? `where ${clauses.join(" and ")}` : ""} order by file_loans.updated_at desc`,
  ).all(...(guard.session.user.role === "SuperAdmin" ? [] : [guard.session.user.branchCode])) as BrimenLoanRow[];
  db.close();
  return NextResponse.json({ ok: true, data: rows.map(normalizeLoan) });
}

export async function POST(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  try {
    const body = await request.json();
    if (!body.customerId) {
      return NextResponse.json({ ok: false, message: "Data nasabah wajib dipilih." }, { status: 400 });
    }
    if (!body.borrowerName?.trim() || !body.borrowerUsername?.trim()) {
      return NextResponse.json({ ok: false, message: "Nama peminjam dan username wajib diisi." }, { status: 400 });
    }

    const db = openBrimenDb(false);
    const customer = db.prepare("select id, branch_code from customers where id = ?").get(body.customerId) as { id: string; branch_code: string } | undefined;
    if (!customer) {
      db.close();
      return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
    }
    if (guard.session.user.role !== "SuperAdmin" && customer.branch_code !== guard.session.user.branchCode) {
      db.close();
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }

    const now = nowIso();
    const loan = {
      id: newId("loan"),
      customer_id: customer.id,
      borrower_name: body.borrowerName.trim(),
      borrower_username: body.borrowerUsername.trim(),
      loan_date: body.loanDate || now,
      returned_date: null,
      status: "Dipinjam",
      purpose: body.purpose ?? "",
      created_at: now,
      updated_at: now,
    };

    db.prepare(
      `insert into file_loans (
        id, customer_id, borrower_name, borrower_username, loan_date, returned_date,
        status, purpose, created_at, updated_at
      ) values (
        @id, @customer_id, @borrower_name, @borrower_username, @loan_date, @returned_date,
        @status, @purpose, @created_at, @updated_at
      )`,
    ).run(loan);
    db.prepare("update customers set status = 'Dipinjam', updated_at = ? where id = ?").run(now, customer.id);
    db.prepare("insert into file_loan_logs (id, loan_id, actor, message, created_at) values (?, ?, ?, ?, ?)").run(
      newId("log"),
      loan.id,
      loan.borrower_username,
      "Peminjam mengkonfirmasi berkas diterima. Status berkas menjadi Dipinjam.",
      now,
    );
    db.close();

    return NextResponse.json({ ok: true, data: loan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal membuat peminjaman berkas.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
