import { NextResponse } from "next/server";
import { newId, nowIso, openBrimenDb } from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  try {
    const body = await request.json();
    const db = openBrimenDb(false);
    const existing = db.prepare("select * from file_loans where id = ?").get(id) as
      | { id: string; customer_id: string; borrower_username: string; status: string }
      | undefined;

    if (!existing) {
      db.close();
      return NextResponse.json({ ok: false, message: "Data peminjaman tidak ditemukan." }, { status: 404 });
    }
    const customer = db.prepare("select branch_code from customers where id = ?").get(existing.customer_id) as { branch_code: string } | undefined;
    if (!customer || (guard.session.user.role !== "SuperAdmin" && customer.branch_code !== guard.session.user.branchCode)) {
      db.close();
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }

    const now = nowIso();
    const returningFile = body.status === "Sudah Dikembalikan";
    db.prepare(
      `update file_loans set
        borrower_name = coalesce(?, borrower_name),
        borrower_username = coalesce(?, borrower_username),
        purpose = coalesce(?, purpose),
        loan_date = coalesce(?, loan_date),
        returned_date = ?,
        status = coalesce(?, status),
        updated_at = ?
      where id = ?`,
    ).run(
      body.borrowerName ?? null,
      body.borrowerUsername ?? null,
      body.purpose ?? null,
      body.loanDate ?? null,
      returningFile ? body.returnedDate || now : null,
      body.status ?? null,
      now,
      id,
    );

    if (returningFile) {
      db.prepare("update customers set status = 'Disimpan', updated_at = ? where id = ?").run(now, existing.customer_id);
    }

    db.prepare("insert into file_loan_logs (id, loan_id, actor, message, created_at) values (?, ?, ?, ?, ?)").run(
      newId("log"),
      id,
      body.actor || body.borrowerUsername || existing.borrower_username,
      body.note || (returningFile ? "CS mengkonfirmasi berkas telah diterima kembali." : "Data peminjaman diperbarui."),
      now,
    );

    const updated = db.prepare("select * from file_loans where id = ?").get(id);
    db.close();
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui peminjaman berkas.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
