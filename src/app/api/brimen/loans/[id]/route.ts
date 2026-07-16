import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { brimenCustomers, brimenFileLoanLogs, brimenFileLoans } from "@/db/schema";
import { newId } from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = (await db.select().from(brimenFileLoans).where(eq(brimenFileLoans.id, id)).limit(1))[0];
    if (!existing) return NextResponse.json({ ok: false, message: "Data peminjaman tidak ditemukan." }, { status: 404 });

    const customer = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, existing.customerId)).limit(1))[0];
    if (!customer || (guard.session.user.role !== "SuperAdmin" && customer.branchCode !== guard.session.user.branchCode)) {
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }

    const now = new Date();
    const returningFile = body.status === "Sudah Dikembalikan";
    const changes = {
      borrowerName: body.borrowerName ?? existing.borrowerName,
      borrowerUsername: body.borrowerUsername ?? existing.borrowerUsername,
      purpose: body.purpose ?? existing.purpose,
      loanDate: body.loanDate ?? existing.loanDate,
      returnedDate: returningFile ? body.returnedDate || now.toISOString().slice(0, 10) : existing.returnedDate,
      status: body.status ?? existing.status,
      updatedAt: now,
    };

    const updated = await db.transaction(async (tx) => {
      const result = (await tx.update(brimenFileLoans).set(changes).where(eq(brimenFileLoans.id, id)).returning())[0];
      if (returningFile) {
        await tx.update(brimenCustomers).set({ status: "Disimpan", updatedAt: now }).where(eq(brimenCustomers.id, existing.customerId));
      }
      await tx.insert(brimenFileLoanLogs).values({
        id: newId("log"),
        loanId: id,
        actor: body.actor || body.borrowerUsername || existing.borrowerUsername,
        message: body.note || (returningFile ? "CS mengkonfirmasi berkas telah diterima kembali." : "Data peminjaman diperbarui."),
        createdAt: now,
      });
      return result;
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal memperbarui peminjaman berkas.", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
