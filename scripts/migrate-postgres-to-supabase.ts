import postgres from "postgres";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();

const tables = [
  "user",
  "verification",
  "session",
  "account",
  "upload_records",
  "branch_profiles",
  "loan_records",
  "loan_mantri_assignments",
  "nominative_ckpn_records",
  "missing_loan_resolutions",
  "ckpn_forecasts",
  "deposit_records",
  "quick_count_results",
  "whatsapp_contacts",
  "whatsapp_campaigns",
  "whatsapp_campaign_recipients",
  "warning_letters",
  "covenance_records",
  "audit_logs",
  "brimen_customers",
  "brimen_file_loans",
  "brimen_file_loan_logs",
] as const;

async function tableExists(sql: ReturnType<typeof postgres>, table: string) {
  const rows = await sql<{ exists: boolean }[]>`select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = ${table}) as exists`;
  return Boolean(rows[0]?.exists);
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
  const destinationUrl = process.env.DIRECT_DATABASE_URL;
  if (!sourceUrl || !destinationUrl) throw new Error("SOURCE_DATABASE_URL/DATABASE_URL dan DIRECT_DATABASE_URL wajib diisi.");
  if (sourceUrl === destinationUrl) throw new Error("Database sumber dan tujuan tidak boleh sama.");
  const source = postgres(sourceUrl, { max: 1, prepare: false });
  const destination = postgres(destinationUrl, { max: 1, prepare: false });
  try {
    for (const table of tables) {
      if (!await tableExists(source, table)) {
        console.log(`- ${table}: tidak ada di sumber, dilewati.`);
        continue;
      }
      if (!await tableExists(destination, table)) throw new Error(`Tabel ${table} belum ada di tujuan. Jalankan db:migrate lebih dahulu.`);
      const rows = await source<Record<string, unknown>[]>`select * from ${source(table)}`;
      if (!rows.length) {
        console.log(`- ${table}: 0 baris.`);
        continue;
      }
      const columns = Object.keys(rows[0]);
      for (let index = 0; index < rows.length; index += 500) {
        const batch = rows.slice(index, index + 500);
        await destination`insert into ${destination(table)} ${destination(batch, ...columns)} on conflict do nothing`;
      }
      const totals = await destination<{ total: number }[]>`select count(*)::int as total from ${destination(table)}`;
      console.log(`- ${table}: ${rows.length} sumber, ${totals[0]?.total ?? 0} tujuan.`);
    }
    console.log("Migrasi PostgreSQL ke Supabase selesai.");
  } finally {
    await source.end();
    await destination.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
