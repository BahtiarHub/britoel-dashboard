import fs from "fs/promises";
import path from "path";
import { and, desc, eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { branchProfiles, uploadRecords } from "../src/db/schema";
import { extractBranchIdentity, parseTabularFile } from "../src/lib/import-data";

async function main() {
  const uploadsRoot = path.join(process.cwd(), "data", "uploads");
  const branchDirectories = await fs.readdir(uploadsRoot, { withFileTypes: true }).catch(() => []);
  let updated = 0;

  for (const branchDirectory of branchDirectories) {
    if (!branchDirectory.isDirectory()) continue;
    const branchCode = branchDirectory.name;
    const latestDirectory = path.join(uploadsRoot, branchCode, "lw321-terbaru");
    const files = await fs.readdir(latestDirectory, { withFileTypes: true }).catch(() => []);
    const candidates = await Promise.all(files.filter((item) => item.isFile()).map(async (item) => {
      const filePath = path.join(latestDirectory, item.name);
      return { filePath, fileName: item.name, stats: await fs.stat(filePath) };
    }));
    const latestFile = candidates.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)[0];
    if (!latestFile) continue;

    const identity = extractBranchIdentity(parseTabularFile(latestFile.fileName, await fs.readFile(latestFile.filePath)));
    if (!identity.name || (identity.code && identity.code !== branchCode)) continue;
    const latestUpload = (await db.select({ id: uploadRecords.id }).from(uploadRecords).where(and(
      eq(uploadRecords.branchCode, branchCode),
      eq(uploadRecords.sourceKey, "lw321-terbaru"),
    )).orderBy(desc(uploadRecords.createdAt)).limit(1))[0];
    const now = new Date();
    await db.insert(branchProfiles).values({
      branchCode,
      branchName: identity.name,
      sourceUploadId: latestUpload?.id ?? null,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: branchProfiles.branchCode,
      set: { branchName: identity.name, sourceUploadId: latestUpload?.id ?? null, updatedAt: now },
    });
    updated += 1;
    console.log(`${branchCode}: ${identity.name}`);
  }

  console.log(`${updated} profil uker diperbarui.`);
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exitCode = 1;
});
