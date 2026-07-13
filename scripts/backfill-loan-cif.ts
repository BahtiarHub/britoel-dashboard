import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { inferPeriod, mapLoanRows, parseTabularFile } from "../src/lib/import-data";

const databasePath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "britoel.db");
const uploadRoot = path.join(process.cwd(), "data", "uploads");

if (!fs.existsSync(uploadRoot)) {
  console.log("Tidak ada folder upload untuk diproses.");
  process.exit(0);
}

const database = new Database(databasePath);
const updateCif = database.prepare(`
  update loan_records
  set cif = ?
  where branch_code = ? and period = ? and account_number = ?
`);
let updated = 0;

const run = database.transaction(() => {
  for (const branchCode of fs.readdirSync(uploadRoot)) {
    const branchPath = path.join(uploadRoot, branchCode);
    if (!fs.statSync(branchPath).isDirectory()) continue;
    for (const sourceKey of fs.readdirSync(branchPath).filter((item) => item.startsWith("lw321-"))) {
      const sourcePath = path.join(branchPath, sourceKey);
      const fileName = fs.readdirSync(sourcePath).find((item) => item.toLowerCase().endsWith(".csv"));
      if (!fileName) continue;
      const fullPath = path.join(sourcePath, fileName);
      const rawRows = parseTabularFile(fileName, fs.readFileSync(fullPath));
      const period = inferPeriod(sourceKey, fileName, rawRows);
      const imported = mapLoanRows(rawRows, period);
      for (const row of imported.rows) {
        if (row.cif) updated += updateCif.run(row.cif, branchCode, period, row.accountNumber).changes;
      }
    }
  }
});

try {
  run();
  console.log(`${updated} data pinjaman berhasil dilengkapi dengan No CIF.`);
} finally {
  database.close();
}
