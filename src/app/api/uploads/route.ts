import path from "path";
import fs from "fs/promises";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, uploadRecords } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedExtensions: Record<string, string[]> = {
  "lw321-terbaru": [".csv"],
  "lw321-bulan-lalu": [".csv"],
  "lw321-tahun-lalu": [".csv"],
  "lw321-dua-bulan": [".csv"],
  brimen: [".csv", ".xlsx", ".xls"],
  "nominatif-rekening": [".csv"],
  di319: [".csv"],
  almafact: [".png", ".pdf"],
  "branch-pl": [".xlsx", ".xls"],
  "kpi-rka": [".xlsx", ".xls"],
};

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const query = db.select().from(uploadRecords);
  const rows = authResult.session.user.role === "SuperAdmin"
    ? await query.orderBy(desc(uploadRecords.createdAt)).limit(100)
    : await query.where(eq(uploadRecords.branchCode, branchCode)).orderBy(desc(uploadRecords.createdAt)).limit(100);
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const formData = await request.formData();
  const file = formData.get("file");
  const sourceKey = String(formData.get("sourceKey") ?? "");
  const sourceName = String(formData.get("sourceName") ?? sourceKey);
  const rowCount = Number(formData.get("rowCount") ?? 0) || 0;
  if (!(file instanceof File) || !allowedExtensions[sourceKey]) {
    return NextResponse.json({ ok: false, message: "File atau sumber upload tidak valid." }, { status: 400 });
  }
  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions[sourceKey].includes(extension)) {
    return NextResponse.json({ ok: false, message: `Format ${extension || "file"} tidak diizinkan untuk ${sourceName}.` }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "Ukuran file maksimal 25 MB." }, { status: 400 });
  }

  const uploadRoot = path.join(process.cwd(), "data", "uploads", branchCode, sourceKey);
  await fs.mkdir(uploadRoot, { recursive: true });
  const previousFiles = await fs.readdir(uploadRoot);
  await Promise.all(previousFiles.map((item) => fs.unlink(path.join(uploadRoot, item))));
  const safeBaseName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${safeBaseName}`;
  await fs.writeFile(path.join(uploadRoot, storedName), Buffer.from(await file.arrayBuffer()));

  const now = new Date();
  const record = {
    id: crypto.randomUUID(),
    sourceKey,
    sourceName,
    fileName: file.name,
    format: extension.slice(1).toUpperCase(),
    rowCount,
    status: "Berhasil",
    branchCode,
    uploadedBy: authResult.session.user.id,
    createdAt: now,
  };
  await db.insert(uploadRecords).values(record);
  await db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: authResult.session.user.id, action: "UPLOAD_DATA", entity: "upload_record", entityId: record.id, detail: `${sourceName} | ${file.name}`, branchCode, createdAt: now });
  return NextResponse.json({ ok: true, data: record }, { status: 201 });
}
