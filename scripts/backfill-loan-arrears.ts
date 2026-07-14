import fs from "fs";
import path from "path";
import { sqlite } from "../src/db";
import { inferPeriod, mapLoanRows, parseTabularFile } from "../src/lib/import-data";

type LatestUpload = {
  branchCode: string;
  fileName: string;
};

const uploads = sqlite.prepare(`
  select branch_code as branchCode, file_name as fileName
  from upload_records
  where source_key = 'lw321-terbaru' and status = 'Berhasil'
  order by created_at desc
`).all() as LatestUpload[];

const latestByBranch = new Map<string, LatestUpload>();
for (const upload of uploads) {
  if (!latestByBranch.has(upload.branchCode)) latestByBranch.set(upload.branchCode, upload);
}

const update = sqlite.prepare(`
  update loan_records
  set principal_arrears = ?, interest_arrears = ?
  where branch_code = ? and period = ? and account_number = ?
`);

let totalUpdated = 0;
for (const upload of latestByBranch.values()) {
  const directory = path.join(process.cwd(), "data", "uploads", upload.branchCode, "lw321-terbaru");
  const storedFile = fs.readdirSync(directory).find((name) => !name.startsWith(".pending-"));
  if (!storedFile) continue;

  const buffer = fs.readFileSync(path.join(directory, storedFile));
  const rawRows = parseTabularFile(upload.fileName, buffer);
  const period = inferPeriod("lw321-terbaru", upload.fileName, rawRows);
  const imported = mapLoanRows(rawRows, period);

  const updateBranch = sqlite.transaction(() => {
    let updated = 0;
    for (const row of imported.rows) {
      updated += update.run(
        row.principalArrears,
        row.interestArrears,
        upload.branchCode,
        period,
        row.accountNumber,
      ).changes;
    }
    return updated;
  });

  const updated = updateBranch();
  totalUpdated += updated;
  console.log(`${upload.branchCode} | ${period} | ${updated} rekening diperbarui dari ${upload.fileName}`);
}

console.log(`Selesai. Total ${totalUpdated} rekening diperbarui.`);
