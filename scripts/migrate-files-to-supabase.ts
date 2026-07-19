import fs from "node:fs/promises";
import path from "node:path";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const rows = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return rows.flat();
}

function contentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return ({
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
    ".pdf": "application/pdf", ".csv": "text/csv", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
  } as Record<string, string>)[extension] ?? "application/octet-stream";
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");
  const root = path.resolve(process.cwd(), "data", "uploads");
  const files = await walk(root);
  const { putStoredObject, storageKey, usesSupabaseStorage } = await import("../src/lib/object-storage");
  if (!usesSupabaseStorage()) throw new Error("Supabase Storage belum aktif.");
  for (let index = 0; index < files.length; index += 1) {
    const filePath = files[index];
    const key = storageKey(path.relative(root, filePath).replace(/\\/g, "/"));
    await putStoredObject(key, await fs.readFile(filePath), contentType(filePath));
    console.log(`[${index + 1}/${files.length}] ${key}`);
  }
  console.log(`${files.length} file berhasil dipindahkan ke Supabase Storage.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
