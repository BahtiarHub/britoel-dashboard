import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { loanRecords } from "../src/db/schema";
import { inferPeriod, mapLoanRows, parseTabularFile } from "../src/lib/import-data";

const uploadRoot = path.join(process.cwd(), "data", "uploads");

async function main() {
  if (!fs.existsSync(uploadRoot)) {
    console.log("Tidak ada folder upload untuk diproses.");
    return;
  }

  let updated = 0;
  await db.transaction(async (tx) => {
    for (const branchCode of fs.readdirSync(uploadRoot)) {
      const branchPath = path.join(uploadRoot, branchCode);
      if (!fs.statSync(branchPath).isDirectory()) continue;
      for (const sourceKey of fs.readdirSync(branchPath).filter((item) => item.startsWith("lw321-"))) {
        const sourcePath = path.join(branchPath, sourceKey);
        const storedFile = fs.readdirSync(sourcePath).find((item) => item.toLowerCase().endsWith(".csv"));
        if (!storedFile) continue;
        const rawRows = parseTabularFile(storedFile, fs.readFileSync(path.join(sourcePath, storedFile)));
        const period = inferPeriod(sourceKey, storedFile, rawRows);
        const imported = mapLoanRows(rawRows, period);
        for (const row of imported.rows) {
          const result = await tx.update(loanRecords).set({ cif: row.cif, loanType: row.loanType }).where(and(
            eq(loanRecords.branchCode, branchCode),
            eq(loanRecords.period, period),
            eq(loanRecords.accountNumber, row.accountNumber),
          )).returning({ id: loanRecords.id });
          updated += result.length;
        }
      }
    }
  });
  console.log(`${updated} data pinjaman berhasil dilengkapi dengan No CIF dan Loan Type.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => sql.end());
