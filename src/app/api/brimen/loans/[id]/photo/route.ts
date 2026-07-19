import path from "node:path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { brimenCustomers, brimenFileLoans } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { getStoredObject, storageKey } from "@/lib/object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  const kind = new URL(request.url).searchParams.get("kind") === "return" ? "return" : "handover";

  const row = (await db.select({
    branchCode: brimenCustomers.branchCode,
    handoverPhoto: brimenFileLoans.handoverPhoto,
    returnPhoto: brimenFileLoans.returnPhoto,
  }).from(brimenFileLoans).innerJoin(brimenCustomers, eq(brimenFileLoans.customerId, brimenCustomers.id)).where(eq(brimenFileLoans.id, id)).limit(1))[0];
  if (!row) return NextResponse.json({ ok: false, message: "Bukti photo tidak ditemukan." }, { status: 404 });
  if (row.branchCode !== guard.session.user.branchCode) return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });

  const fileName = kind === "return" ? row.returnPhoto : row.handoverPhoto;
  if (!fileName || path.basename(fileName) !== fileName) return NextResponse.json({ ok: false, message: "Bukti photo belum tersedia." }, { status: 404 });
  try {
    const bytes = await getStoredObject(storageKey(row.branchCode, "brimen-loans", id, fileName));
    const extension = path.extname(fileName).toLowerCase();
    const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
    return new Response(bytes, { headers: { "Content-Type": contentType, "Cache-Control": "private, no-store", "Content-Disposition": `inline; filename="${fileName}"` } });
  } catch {
    return NextResponse.json({ ok: false, message: "File bukti photo tidak tersedia." }, { status: 404 });
  }
}
