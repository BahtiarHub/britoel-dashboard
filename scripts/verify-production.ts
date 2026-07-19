import postgres from "postgres";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();

const requiredIndexes = [
  "loan_records_branch_period_account_unique",
  "loan_records_branch_period_collectibility_idx",
  "loan_records_branch_period_npd_idx",
  "loan_records_branch_period_cif_idx",
  "loan_records_branch_period_mantri_idx",
  "deposit_records_branch_period_cif_idx",
  "quick_count_branch_period_date_account_unique",
];

async function main() {
  const issues: string[] = [];
  const warnings: string[] = [];
  const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!process.env.DIRECT_DATABASE_URL) issues.push("DIRECT_DATABASE_URL wajib diisi untuk migrasi produksi.");
  if (!process.env.DATABASE_URL) issues.push("DATABASE_URL pooler wajib diisi untuk runtime produksi.");
  if (!databaseUrl) throw new Error("DIRECT_DATABASE_URL atau DATABASE_URL belum diisi.");
  if (!process.env.BETTER_AUTH_URL?.startsWith("https://")) issues.push("BETTER_AUTH_URL produksi harus menggunakan HTTPS.");
  const secret = process.env.BETTER_AUTH_SECRET ?? "";
  if (secret.length < 32 || secret.includes("local-development") || secret.includes("ganti-")) issues.push("BETTER_AUTH_SECRET belum aman atau kurang dari 32 karakter.");
  if (process.env.BETTER_AUTH_ALLOW_SIGNUP !== "false") issues.push("BETTER_AUTH_ALLOW_SIGNUP harus false pada produksi.");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) warnings.push("Supabase Storage belum dikonfigurasi; file masih menggunakan disk lokal.");

  const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 10 });
  try {
    const database = await sql<{ database: string; version: string }[]>`select current_database() as database, version() as version`;
    const tables = await sql<{ table_name: string }[]>`select table_name from information_schema.tables where table_schema = 'public'`;
    const tableNames = new Set(tables.map((row) => row.table_name));
    const protectedTables = ["user", "session", "loan_records", "deposit_records", "brimen_customers", "quick_count_results"];
    for (const table of protectedTables) {
      if (!tableNames.has(table)) issues.push(`Tabel ${table} belum tersedia.`);
    }
    const rlsRows = await sql<{ table_name: string; enabled: boolean }[]>`
      select c.relname as table_name, c.relrowsecurity as enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    `;
    const rlsState = new Map(rlsRows.map((row) => [row.table_name, row.enabled]));
    for (const table of protectedTables) if (tableNames.has(table) && !rlsState.get(table)) issues.push(`RLS tabel ${table} belum aktif.`);
    const publicGrants = await sql<{ total: number }[]>`
      select count(*)::int as total
      from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated')
    `;
    if ((publicGrants[0]?.total ?? 0) > 0) issues.push("Role anon/authenticated masih memiliki privilege langsung pada tabel public.");
    const indexes = await sql<{ indexname: string }[]>`select indexname from pg_indexes where schemaname = 'public'`;
    const indexNames = new Set(indexes.map((row) => row.indexname));
    for (const indexName of requiredIndexes) if (!indexNames.has(indexName)) issues.push(`Index ${indexName} belum tersedia.`);
    const invalidBranches = tableNames.has("loan_records")
      ? await sql<{ total: number }[]>`select count(*)::int as total from loan_records where branch_code !~ '^\\d{4}$'`
      : [{ total: 0 }];
    if ((invalidBranches[0]?.total ?? 0) > 0) warnings.push(`${invalidBranches[0].total} loan record memiliki branch_code tidak standar.`);
    console.log(`Database terhubung: ${database[0]?.database}`);
    console.log(`PostgreSQL: ${database[0]?.version.split(" ").slice(0, 2).join(" ")}`);
  } finally {
    await sql.end();
  }

  warnings.forEach((warning) => console.warn(`PERINGATAN: ${warning}`));
  if (issues.length) {
    issues.forEach((issue) => console.error(`GAGAL: ${issue}`));
    process.exitCode = 1;
    return;
  }
  console.log("Verifikasi produksi lulus.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
