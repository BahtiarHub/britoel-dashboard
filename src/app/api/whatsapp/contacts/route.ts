import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, whatsappContacts } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeAccount(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return `62${digits}`;
}

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const rows = await db.select().from(whatsappContacts).where(eq(whatsappContacts.branchCode, branchCode)).orderBy(desc(whatsappContacts.updatedAt));
  return NextResponse.json({
    ok: true,
    data: rows.map((item) => ({ account_number: item.accountNumber, phone: item.phone, updated_at: item.updatedAt.toISOString() })),
  });
}

export async function PUT(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const body = await request.json();
  const accountNumber = normalizeAccount(body.accountNumber);
  const phone = normalizePhone(body.phone);
  if (!/^\d{15}$/.test(accountNumber)) {
    return NextResponse.json({ ok: false, message: "Nomor rekening wajib 15 angka." }, { status: 400 });
  }
  if (phone && !/^62\d{8,13}$/.test(phone)) {
    return NextResponse.json({ ok: false, message: "Nomor HP tidak valid. Gunakan format 08 atau 62." }, { status: 400 });
  }

  const now = new Date();
  if (!phone) {
    await db.delete(whatsappContacts).where(and(eq(whatsappContacts.accountNumber, accountNumber), eq(whatsappContacts.branchCode, branchCode)));
  } else {
    await db.insert(whatsappContacts).values({ accountNumber, phone, branchCode, updatedBy: authResult.session.user.id, updatedAt: now }).onConflictDoUpdate({
      target: [whatsappContacts.branchCode, whatsappContacts.accountNumber],
      set: { phone, updatedBy: authResult.session.user.id, updatedAt: now },
    });
  }
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorId: authResult.session.user.id,
    action: phone ? "UPDATE_WHATSAPP_CONTACT" : "DELETE_WHATSAPP_CONTACT",
    entity: "whatsapp_contact",
    entityId: accountNumber,
    detail: phone ? "Nomor WhatsApp diperbarui." : "Nomor WhatsApp dihapus.",
    branchCode,
    createdAt: now,
  });
  return NextResponse.json({ ok: true, data: { accountNumber, phone } });
}
