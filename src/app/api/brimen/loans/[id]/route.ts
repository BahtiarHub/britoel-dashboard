import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, brimenCustomers, brimenFileLoanLogs, brimenFileLoans } from "@/db/schema";
import { newId } from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };
type WorkflowAction = "confirm-handover" | "confirm-received" | "request-return" | "confirm-return";

const allowedImageTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function sessionUsername(sessionUser: { displayUsername?: string | null; username?: string | null; name: string }) {
  return sessionUser.displayUsername ?? sessionUser.username ?? sessionUser.name;
}

async function saveEvidencePhoto(file: File, branchCode: string, loanId: string, kind: "handover" | "return") {
  const extension = allowedImageTypes[file.type];
  if (!extension) throw new Error("Bukti photo harus berformat JPG, PNG, atau WEBP.");
  if (file.size <= 0 || file.size > 8 * 1024 * 1024) throw new Error("Ukuran bukti photo maksimal 8 MB.");
  const directory = path.join(process.cwd(), "data", "uploads", branchCode, "brimen-loans", loanId);
  await fs.mkdir(directory, { recursive: true });
  const fileName = `${kind}-${Date.now()}${extension}`;
  await fs.writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
  return fileName;
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;

  try {
    const existing = (await db.select().from(brimenFileLoans).where(eq(brimenFileLoans.id, id)).limit(1))[0];
    if (!existing) return NextResponse.json({ ok: false, message: "Data peminjaman tidak ditemukan." }, { status: 404 });

    const customer = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, existing.customerId)).limit(1))[0];
    if (!customer || customer.branchCode !== guard.session.user.branchCode) {
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let action = "" as WorkflowAction | "";
    let returnReason = "";
    let photo: File | undefined;
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      action = String(formData.get("action") ?? "") as WorkflowAction;
      returnReason = String(formData.get("returnReason") ?? "");
      const photoValue = formData.get("photo");
      if (photoValue instanceof File && photoValue.size > 0) photo = photoValue;
    } else {
      const body = await request.json();
      action = String(body.action ?? "") as WorkflowAction;
      returnReason = String(body.returnReason ?? "");
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const actorUsername = sessionUsername(guard.session.user);
    let changes: Partial<typeof brimenFileLoans.$inferInsert> = { updatedAt: now };
    let logMessage = "";
    let customerStatus: "Disimpan" | "Dipinjam" | undefined;

    if (action === "confirm-handover") {
      if (guard.session.user.role !== "CS") return NextResponse.json({ ok: false, message: "Penyerahan berkas hanya dapat dikonfirmasi oleh CS." }, { status: 403 });
      if (existing.status !== "Pengajuan Pinjam Berkas") return NextResponse.json({ ok: false, message: `Status saat ini ${existing.status}, bukan pengajuan baru.` }, { status: 409 });
      if (!photo) return NextResponse.json({ ok: false, message: "Bukti photo penyerahan oleh CS wajib diambil." }, { status: 400 });
      const handoverPhoto = await saveEvidencePhoto(photo, customer.branchCode, id, "handover");
      changes = { ...changes, status: "Menunggu Konfirmasi Mantri", handoverPhoto, handoverBy: actorUsername, handoverAt: today };
      logMessage = `CS ${actorUsername} menyerahkan berkas dengan bukti photo. Menunggu konfirmasi penerimaan Mantri.`;
    } else if (action === "confirm-received") {
      if (guard.session.user.role !== "Mantri") return NextResponse.json({ ok: false, message: "Konfirmasi penerimaan hanya dapat dilakukan oleh Mantri." }, { status: 403 });
      if (actorUsername.toLowerCase() !== existing.borrowerUsername.toLowerCase()) return NextResponse.json({ ok: false, message: "Hanya Mantri pemohon yang dapat mengonfirmasi penerimaan." }, { status: 403 });
      if (existing.status !== "Menunggu Konfirmasi Mantri") return NextResponse.json({ ok: false, message: `Berkas belum siap dikonfirmasi. Status saat ini ${existing.status}.` }, { status: 409 });
      changes = { ...changes, status: "Dipinjam", receivedAt: today };
      customerStatus = "Dipinjam";
      logMessage = `Mantri ${actorUsername} mengonfirmasi berkas telah diterima. Status berkas menjadi Dipinjam.`;
    } else if (action === "request-return") {
      if (guard.session.user.role !== "Mantri") return NextResponse.json({ ok: false, message: "Pengembalian berkas hanya dapat diajukan oleh Mantri peminjam." }, { status: 403 });
      if (actorUsername.toLowerCase() !== existing.borrowerUsername.toLowerCase()) return NextResponse.json({ ok: false, message: "Hanya Mantri peminjam yang dapat mengembalikan berkas." }, { status: 403 });
      if (existing.status !== "Dipinjam") return NextResponse.json({ ok: false, message: `Berkas tidak berada pada status Dipinjam. Status saat ini ${existing.status}.` }, { status: 409 });
      const allowedReasons = ["Pengembalian Biasa", "Suplesi", "Restrukturisasi"];
      if (!allowedReasons.includes(returnReason)) return NextResponse.json({ ok: false, message: "Alasan pengembalian belum dipilih." }, { status: 400 });
      if (returnReason === "Pengembalian Biasa" && !photo) return NextResponse.json({ ok: false, message: "Photo pengembalian oleh Mantri wajib diambil." }, { status: 400 });
      const returnPhoto = photo ? await saveEvidencePhoto(photo, customer.branchCode, id, "return") : "";
      changes = { ...changes, status: "Pengajuan Pengembalian", returnReason, returnPhoto, returnRequestedAt: today };
      logMessage = returnReason === "Pengembalian Biasa"
        ? `Mantri ${actorUsername} mengajukan pengembalian berkas dengan bukti photo.`
        : `Mantri ${actorUsername} mengajukan pengembalian berkas untuk proses ${returnReason} tanpa kewajiban photo.`;
    } else if (action === "confirm-return") {
      if (guard.session.user.role !== "CS") return NextResponse.json({ ok: false, message: "Penerimaan kembali berkas hanya dapat dikonfirmasi oleh CS." }, { status: 403 });
      if (existing.status !== "Pengajuan Pengembalian") return NextResponse.json({ ok: false, message: `Belum ada pengajuan pengembalian. Status saat ini ${existing.status}.` }, { status: 409 });
      changes = { ...changes, status: "Sudah Dikembalikan", returnedDate: today, returnConfirmedBy: actorUsername };
      customerStatus = "Disimpan";
      logMessage = `CS ${actorUsername} mengonfirmasi berkas telah diterima kembali dan disimpan.`;
    } else {
      return NextResponse.json({ ok: false, message: "Tahap workflow tidak dikenal." }, { status: 400 });
    }

    const updated = await db.transaction(async (tx) => {
      const result = (await tx.update(brimenFileLoans).set(changes).where(eq(brimenFileLoans.id, id)).returning())[0];
      if (customerStatus) await tx.update(brimenCustomers).set({ status: customerStatus, updatedAt: now }).where(eq(brimenCustomers.id, existing.customerId));
      await tx.insert(brimenFileLoanLogs).values({ id: newId("log"), loanId: id, actor: actorUsername, message: logMessage, createdAt: now });
      const auditAction = {
        "confirm-handover": "BRIMEN_LOAN_HANDOVER",
        "confirm-received": "BRIMEN_LOAN_RECEIVED",
        "request-return": "BRIMEN_LOAN_RETURN_REQUEST",
        "confirm-return": "BRIMEN_LOAN_RETURN_CONFIRMED",
      }[action];
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(), actorId: guard.session.user.id, action: auditAction, entity: "brimen_file_loan", entityId: id,
        detail: `${customer.accountNumber} | ${customer.name} | ${logMessage}`, branchCode: customer.branchCode, createdAt: now,
      });
      return result;
    });

    return NextResponse.json({ ok: true, data: updated, message: logMessage });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Gagal memperbarui workflow peminjaman berkas." }, { status: 500 });
  }
}
