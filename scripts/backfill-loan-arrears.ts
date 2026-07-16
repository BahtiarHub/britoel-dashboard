import fs from "node:fs";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { loanRecords, uploadRecords } from "../src/db/schema";
import { inferPeriod, mapLoanRows, parseTabularFile } from "../src/lib/import-data";

async function main() {
  const uploads = await db.select({ branchCode: uploadRecords.branchCode, fileName: uploadRecords.fileName })
    .from(uploadRecords)
    .where(and(eq(uploadRecords.sourceKey, "lw321-terbaru"), eq(uploadRecords.status, "Berhasil")))
    .orderBy(desc(uploadRecords.createdAt));
  const latestByBranch = new Map<string, (typeof uploads)[number]>();
  for (const upload of uploads) if (!latestByBranch.has(upload.branchCode)) latestByBranch.set(upload.branchCode, upload);

  let totalUpdated = 0;
  for (const upload of latestByBranch.values()) {
    const directory = path.join(process.cwd(), "data", "uploads", upload.branchCode, "lw321-terbaru");
    if (!fs.existsSync(directory)) continue;
    const storedFile = fs.readdirSync(directory).find((name) => !name.startsWith(".pending-"));
    if (!storedFile) continue;

    const rawRows = parseTabularFile(upload.fileName, fs.readFileSync(path.join(directory, storedFile)));
    const period = inferPeriod("lw321-terbaru", upload.fileName, rawRows);
    const imported = mapLoanRows(rawRows, period);
    let updated = 0;
    await db.transaction(async (tx) => {
      for (const row of imported.rows) {
        const result = await tx.update(loanRecords).set({
          principalArrears: row.principalArrears,
          interestArrears: row.interestArrears,
        }).where(and(
          eq(loanRecords.branchCode, upload.branchCode),
          eq(loanRecords.period, period),
          eq(loanRecords.accountNumber, row.accountNumber),
        )).returning({ id: loanRecords.id });
        updated += result.length;
      }
    });
    totalUpdated += updated;
    console.log(`${upload.branchCode} | ${period} | ${updated} rekening diperbarui dari ${upload.fileName}`);
  }
  console.log(`Selesai. Total ${totalUpdated} rekening diperbarui.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => sql.end());
