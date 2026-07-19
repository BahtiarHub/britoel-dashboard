import path from "path";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { parseTabularFile } from "@/lib/import-data";
import { getStoredObject, listStoredObjects, storageKey } from "@/lib/object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredUpload = {
  fileName: string;
  originalFileName: string;
  objectKey: string;
  updatedAt: string;
};

async function getLatestUpload(branchCode: string, sourceKey: "almafact" | "branch-pl"): Promise<StoredUpload | undefined> {
  const files = await listStoredObjects(storageKey(branchCode, sourceKey));
  const latest = files.filter((item) => !item.name.startsWith(".pending-")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!latest) return undefined;
  return {
    fileName: latest.name,
    originalFileName: latest.name.replace(/^\d+-/, ""),
    objectKey: latest.key,
    updatedAt: latest.updatedAt,
  };
}

function serializeCell(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return value;
  return String(value ?? "");
}

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;

  const branchCode = authResult.session.user.branchCode ?? "8014";
  const url = new URL(request.url);
  const source = url.searchParams.get("source");
  const almafact = await getLatestUpload(branchCode, "almafact");

  if (source === "almafact") {
    if (!almafact) return NextResponse.json({ ok: false, message: "File Almafact belum tersedia." }, { status: 404 });
    const extension = path.extname(almafact.originalFileName).toLowerCase();
    const contentType = extension === ".pdf" ? "application/pdf" : "image/png";
    return new Response(await getStoredObject(almafact.objectKey), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${almafact.originalFileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const branchPl = await getLatestUpload(branchCode, "branch-pl");
  let branchPreview: {
    fileName: string;
    format: string;
    updatedAt: string;
    headers: string[];
    rows: (string | number)[][];
    totalRows: number;
  } | undefined;

  if (branchPl) {
    const rawRows = parseTabularFile(branchPl.originalFileName, await getStoredObject(branchPl.objectKey));
    const headers = Object.keys(rawRows[0] ?? {}).slice(0, 10);
    branchPreview = {
      fileName: branchPl.originalFileName,
      format: path.extname(branchPl.originalFileName).slice(1).toUpperCase(),
      updatedAt: branchPl.updatedAt,
      headers,
      rows: rawRows.slice(0, 20).map((row) => headers.map((header) => serializeCell(row[header]))),
      totalRows: rawRows.length,
    };
  }

  return NextResponse.json({
    ok: true,
    almafact: almafact ? {
      fileName: almafact.originalFileName,
      format: path.extname(almafact.originalFileName).slice(1).toUpperCase(),
      updatedAt: almafact.updatedAt,
      url: "/api/uploads/presentation?source=almafact",
    } : null,
    branchPl: branchPreview ?? null,
  });
}
