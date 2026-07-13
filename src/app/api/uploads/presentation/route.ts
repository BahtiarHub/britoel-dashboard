import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { parseTabularFile } from "@/lib/import-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredUpload = {
  fileName: string;
  originalFileName: string;
  fullPath: string;
  updatedAt: string;
};

async function getLatestUpload(branchCode: string, sourceKey: "almafact" | "branch-pl"): Promise<StoredUpload | undefined> {
  const directory = path.join(process.cwd(), "data", "uploads", branchCode, sourceKey);
  const names = await fs.readdir(directory).catch(() => []);
  const files = await Promise.all(names.filter((name) => !name.startsWith(".pending-")).map(async (fileName) => {
    const fullPath = path.join(directory, fileName);
    const stat = await fs.stat(fullPath).catch(() => undefined);
    if (!stat?.isFile()) return undefined;
    return {
      fileName,
      originalFileName: fileName.replace(/^\d+-/, ""),
      fullPath,
      updatedAt: stat.mtime.toISOString(),
      modifiedAt: stat.mtimeMs,
    };
  }));
  const latest = files.filter((item): item is NonNullable<typeof item> => Boolean(item)).sort((a, b) => b.modifiedAt - a.modifiedAt)[0];
  if (!latest) return undefined;
  return {
    fileName: latest.fileName,
    originalFileName: latest.originalFileName,
    fullPath: latest.fullPath,
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
    return new Response(await fs.readFile(almafact.fullPath), {
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
    const rawRows = parseTabularFile(branchPl.originalFileName, await fs.readFile(branchPl.fullPath));
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
