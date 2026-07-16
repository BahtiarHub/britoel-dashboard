import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import postgres from "postgres";

for (const fileName of [".env", ".env.local"]) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) continue;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

type SourceDatabase = InstanceType<typeof Database>;
type SourceRow = Record<string, unknown>;

const mainTables = [
  "user",
  "session",
  "account",
  "verification",
  "whatsapp_contacts",
  "upload_records",
  "loan_records",
  "nominative_ckpn_records",
  "missing_loan_resolutions",
  "ckpn_forecasts",
  "deposit_records",
  "whatsapp_campaigns",
  "whatsapp_campaign_recipients",
  "warning_letters",
  "covenance_records",
  "audit_logs",
] as const;

const brimenTables = [
  { source: "customers", destination: "brimen_customers" },
  { source: "file_loans", destination: "brimen_file_loans" },
  { source: "file_loan_logs", destination: "brimen_file_loan_logs" },
] as const;

const booleanColumns = new Set(["email_verified", "active"]);

function sourcePath(value: string | undefined, fallback: string) {
  return path.resolve(process.cwd(), value || fallback);
}

function isTimestamp(column: string) {
  return column.endsWith("_at") || column.endsWith("_expires_at") || column === "expires_at";
}

function toDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value < 1_000_000_000_000 ? value * 1000 : value);
  const numeric = Number(value);
  if (Number.isFinite(numeric) && /^\d+$/.test(String(value))) {
    return new Date(numeric < 1_000_000_000_000 ? numeric * 1000 : numeric);
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new Error(`Timestamp tidak valid: ${String(value)}`);
  return parsed;
}

function normalizeRow(row: SourceRow) {
  return Object.fromEntries(Object.entries(row).map(([column, value]) => {
    if (booleanColumns.has(column)) return [column, Boolean(value)];
    if (isTimestamp(column)) return [column, toDate(value)];
    return [column, value];
  }));
}

function tableExists(database: SourceDatabase, table: string) {
  return Boolean(database.prepare("select 1 from sqlite_master where type = 'table' and name = ?").get(table));
}

async function copyTable(
  source: SourceDatabase,
  destination: ReturnType<typeof postgres>,
  sourceTable: string,
  destinationTable = sourceTable,
) {
  if (!tableExists(source, sourceTable)) {
    console.log(`- ${sourceTable}: dilewati karena tabel sumber tidak ada.`);
    return;
  }

  const sourceRows = source.prepare(`select * from "${sourceTable}"`).all() as SourceRow[];
  if (!sourceRows.length) {
    console.log(`- ${sourceTable}: 0 baris.`);
    return;
  }

  const rows = sourceRows.map(normalizeRow);
  const columns = Object.keys(rows[0]);
  for (let index = 0; index < rows.length; index += 500) {
    const batch = rows.slice(index, index + 500);
    await destination`insert into ${destination(destinationTable)} ${destination(batch, ...columns)} on conflict do nothing`;
  }

  const result = await destination<{ total: number }[]>`select count(*)::int as total from ${destination(destinationTable)}`;
  console.log(`- ${sourceTable} -> ${destinationTable}: ${rows.length} sumber, ${result[0]?.total ?? 0} PostgreSQL.`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL wajib diisi sebelum migrasi dijalankan.");

  const mainPath = sourcePath(process.env.SQLITE_SOURCE_PATH, "./data/britoel.db");
  const brimenPath = sourcePath(process.env.BRIMEN_DB_PATH, "../DATA BRIMEN/data/brimen.db");
  if (!fs.existsSync(mainPath)) throw new Error(`Database SQLite utama tidak ditemukan: ${mainPath}`);

  const destination = postgres(databaseUrl, { max: 1, prepare: false });
  const mainSource = new Database(mainPath, { readonly: true, fileMustExist: true });
  const brimenSource = fs.existsSync(brimenPath) ? new Database(brimenPath, { readonly: true, fileMustExist: true }) : null;

  try {
    console.log(`Migrasi database utama: ${mainPath}`);
    for (const table of mainTables) await copyTable(mainSource, destination, table);

    if (brimenSource) {
      console.log(`Migrasi database BRIMEN: ${brimenPath}`);
      for (const table of brimenTables) await copyTable(brimenSource, destination, table.source, table.destination);
    } else {
      console.log(`Database BRIMEN tidak ditemukan, dilewati: ${brimenPath}`);
    }
    console.log("Migrasi SQLite ke PostgreSQL selesai.");
  } finally {
    mainSource.close();
    brimenSource?.close();
    await destination.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
