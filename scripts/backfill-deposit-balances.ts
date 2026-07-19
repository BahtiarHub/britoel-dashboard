import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db, sql } from "../src/db";
import { depositRecords } from "../src/db/schema";
import { inferPeriod, mapDepositRows, parseTabularFile } from "../src/lib/import-data";

async function main() {
  const uploadRoot = path.join(process.cwd(), "data", "uploads");
  if (!fs.existsSync(uploadRoot)) return;

  let updated = 0;
  for (const branchCode of fs.readdirSync(uploadRoot)) {
    const sourcePath = path.join(uploadRoot, branchCode, "di319");
    if (!fs.existsSync(sourcePath)) continue;

    for (const storedFile of fs.readdirSync(sourcePath).filter((file) => !file.startsWith(".pending-"))) {
      const filePath = path.join(sourcePath, storedFile);
      const rawRows = parseTabularFile(storedFile, fs.readFileSync(filePath));
      const period = inferPeriod("di319", storedFile, rawRows);
      const imported = mapDepositRows(rawRows, period);

      for (const row of imported.rows) {
        const result = await db.update(depositRecords).set({
          balance: row.balance,
          availableBalance: row.availableBalance,
          mutationDate: row.mutationDate,
        }).where(and(
          eq(depositRecords.branchCode, branchCode),
          eq(depositRecords.period, period),
          eq(depositRecords.cif, row.cif),
          eq(depositRecords.savingsAccount, row.savingsAccount),
        )).returning({ id: depositRecords.id });
        updated += result.length;
      }
    }
  }

  console.log(`Saldo simpanan DI319 diperbarui pada ${updated} rekening.`);
}

main().finally(() => sql.end());
