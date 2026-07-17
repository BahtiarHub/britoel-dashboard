import fs from "node:fs";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { loanRecords, uploadRecords } from "../src/db/schema";
import { inferPeriod, mapLoanRows, parseTabularFile } from "../src/lib/import-data";

async function main() {
  const uploads = (await db.select().from(uploadRecords).where(eq(uploadRecords.status, "Berhasil")).orderBy(desc(uploadRecords.createdAt)))
    .filter((item) => item.sourceKey.startsWith("lw321-"));
  const latestByBranchAndSource = new Map<string, (typeof uploads)[number]>();
  for (const upload of uploads) {
    const key = `${upload.branchCode}:${upload.sourceKey}`;
    if (!latestByBranchAndSource.has(key)) latestByBranchAndSource.set(key, upload);
  }

  let totalUpdated = 0;
  for (const upload of latestByBranchAndSource.values()) {
    const directory = path.join(process.cwd(), "data", "uploads", upload.branchCode, upload.sourceKey);
    if (!fs.existsSync(directory)) continue;
    const storedFile = fs.readdirSync(directory).filter((name) => !name.startsWith(".pending-")).sort().at(-1);
    if (!storedFile) continue;

    const rawRows = parseTabularFile(upload.fileName, fs.readFileSync(path.join(directory, storedFile)));
    const period = inferPeriod(upload.sourceKey, upload.fileName, rawRows);
    const imported = mapLoanRows(rawRows, period);
    const existingRows = await db.select({
      id: loanRecords.id,
      accountNumber: loanRecords.accountNumber,
      outstanding: loanRecords.outstanding,
      collectibility: loanRecords.collectibility,
    }).from(loanRecords).where(and(eq(loanRecords.branchCode, upload.branchCode), eq(loanRecords.period, period)));
    const existingByAccount = new Map(existingRows.map((item) => [item.accountNumber, item]));
    const changed = imported.rows.flatMap((item) => {
      const existing = existingByAccount.get(item.accountNumber);
      if (!existing || (existing.outstanding === item.outstanding && existing.collectibility === item.collectibility)) return [];
      return [{ id: existing.id, outstanding: item.outstanding, collectibility: item.collectibility }];
    });

    await db.transaction(async (tx) => {
      for (const item of changed) {
        await tx.update(loanRecords).set({ outstanding: item.outstanding, collectibility: item.collectibility }).where(eq(loanRecords.id, item.id));
      }
    });
    totalUpdated += changed.length;
    console.log(`${upload.branchCode} | ${period} | ${changed.length} rekening dikoreksi`);
  }
  console.log(`Selesai. Total ${totalUpdated} rekening dikoreksi.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => sql.end());
