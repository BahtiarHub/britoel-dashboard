import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export type ImportedLoanRow = {
  cif: string;
  loanType: string;
  accountNumber: string;
  debtorName: string;
  nextPaymentDate: string;
  outstanding: number;
  plafond: number;
  collectibility: "Lancar" | "DPK" | "KL" | "Diragukan" | "Macet";
  restructureFlag: "N" | "Y";
  mantri: string;
  pnPengelola: string;
  description: string;
  realizedDate: string;
  realizedAmount: number;
  principalArrears: number;
  interestArrears: number;
};

export type ImportedDepositRow = {
  cif: string;
  loanAccountNumber: string;
  debtorName: string;
  mantri: string;
  savingsAccount: string;
  balance: number;
  availableBalance: number;
  blockedAtStart: number;
  currentBlocked: number;
  installmentFromBlocked: number;
  mutationDate: string;
  status: "Tidak Ada Blokiran" | "Setor dari Blokiran" | "Blokiran Aktif";
};

export type ImportedNominativeCkpnRow = {
  accountNumber: string;
  debtorName: string;
  outstanding: number;
  collectibility: string;
  formedCkpn: number;
};

export type ImportedBrimenRow = {
  accountNumber: string;
  name: string;
  plafond: number;
  realizationDate: string;
  address: string;
  mantri: string;
  brimenBerkas: string;
  brimenJaminan: string;
  guarantee: string;
  status: "Disimpan" | "Dipinjam" | "Diambil" | "Lunas";
};

type RawRow = Record<string, unknown>;

const aliases = {
  cif: ["cif", "cifno", "cif_no", "ciff_no", "ciffno", "no_cif", "nomor_cif", "no_cif_nasabah", "cif_number", "customer_information_file"],
  loanType: ["ln_type", "loan_type", "tipe_kredit", "kode_produk_pinjaman"],
  accountNumber: ["no_rekening", "nomor_rekening", "nomor_rekening1", "no_rekening1", "no_rek", "norek", "rekening", "account_number", "account_no", "acctno", "no_rekening_nasabah"],
  debtorName: ["nama_debitur", "nama_nasabah", "nama_debitur_single", "debitur", "customer_name", "short_name", "nama"],
  nextPaymentDate: ["next_payment_date", "next_pmt_date", "nextpaymentdate", "tanggal_jatuh_tempo", "tgl_jatuh_tempo", "jatuh_tempo", "npd"],
  outstanding: ["outstanding", "total_outstanding", "jumlah_outstanding", "baki_debet", "total_baki_debet", "jumlah_baki_debet", "bakidebet", "os", "total_os", "jumlah_os", "saldo", "saldo_pokok", "saldo_pinjaman", "sisa_pinjaman", "cur_bal", "current_balance", "baki_debet_posisi"],
  plafond: ["plafond", "plafon", "loan_amount", "jumlah_plafond"],
  collectibility: ["kolektibilitas", "kolektabilitas", "kolektibilitas_terbaru", "kolek", "kolek_terbaru", "kol", "collectibility", "collectibility_code", "credit_status", "kualitas"],
  restructureFlag: ["flag_restruk", "flag_restrukturisasi", "flaf_restruk", "restruk", "restructure_flag"],
  mantri: ["pn_pengelola_singlepn", "pn_pengelola", "mantri", "nama_mantri", "pengelola"],
  description: ["description", "deskripsi", "tipe_pinjaman", "jenis_pinjaman", "produk", "product_description"],
  realizedDate: ["tanggal_realisasi", "tgl_realisasi", "realized_date", "realisasi_date", "date_realisasi"],
  realizedAmount: ["jumlah_realisasi", "nominal_realisasi", "realized_amount", "realisasi", "plafond_realisasi"],
  principalArrears: ["tunggakan_pokok", "pokok_tunggakan", "tunggakan_pkk", "tunggakan_principal", "principal_arrears", "past_due_principal", "principal_past_due", "arrears_principal"],
  interestArrears: ["tunggakan_bunga", "bunga_tunggakan", "tunggakan_bng", "tunggakan_interest", "interest_arrears", "past_due_interest", "interest_past_due", "arrears_interest"],
  period: ["periode", "period", "bulan_data", "posisi_data", "snapshot_date", "tanggal_data", "report_date"],
} as const;

const branchAliases = {
  code: ["kode_uker", "uker_code", "branch_code", "kode_unit", "unit_code"],
  name: ["uker", "nama_uker", "uker_name", "branch_name", "nama_unit", "unit_name"],
} as const;

const qualityAmountAliases = {
  Lancar: ["lancar", "os_lancar", "baki_debet_lancar", "kolek_1", "kol_1", "kolektibilitas_1"],
  DPK: ["dpk", "sml", "dpk_1", "dpk_2", "dpk_3", "sml_1", "sml_2", "sml_3", "sml1", "sml2", "sml3", "os_dpk", "os_sml", "baki_debet_dpk", "baki_debet_sml", "kolek_2", "kol_2", "kolektibilitas_2"],
  KL: ["kl", "kurang_lancar", "os_kl", "baki_debet_kl", "kolek_3", "kol_3", "kolektibilitas_3"],
  Diragukan: ["diragukan", "os_diragukan", "baki_debet_diragukan", "kolek_4", "kol_4", "kolektibilitas_4"],
  Macet: ["macet", "os_macet", "baki_debet_macet", "kolek_5", "kol_5", "kolektibilitas_5"],
} as const;

const depositAliases = {
  cif: aliases.cif,
  loanAccountNumber: ["no_rekening_pinjaman", "nomor_rekening_pinjaman", "rekening_pinjaman", "loan_account_number", "no_rekening_kredit"],
  debtorName: aliases.debtorName,
  mantri: aliases.mantri,
  savingsAccount: ["no_rekening_simpanan", "nomor_rekening_simpanan", "rekening_simpanan", "savings_account", "saving_account", "rekening_blokiran", "no_rekening", "nomor_rekening", "rekening", "account_number", "account_no"],
  blockedAtStart: ["blokiran_awal", "saldo_blokir_awal", "saldo_blokiran_awal", "nominal_blokir_awal", "blokir_awal"],
  currentBlocked: ["blokiran_saat_ini", "saldo_blokir", "saldo_blokiran", "nominal_blokir", "current_blocked"],
  balance: ["balance", "saldo", "ledger_balance", "current_balance"],
  availableBalance: ["available_balance", "saldo_tersedia", "available_bal", "avail_balance"],
  installmentFromBlocked: ["setoran_dari_blokiran", "setor_dari_blokiran", "debet_blokiran", "nominal_setoran_blokir", "installment_from_blocked"],
  mutationDate: ["tanggal_mutasi", "tgl_mutasi", "mutation_date", "tanggal_transaksi", "tgl_transaksi"],
  status: ["status_di319", "status_blokiran", "status"],
} as const;

const brimenAliases = {
  accountNumber: aliases.accountNumber,
  name: aliases.debtorName,
  plafond: aliases.plafond,
  realizationDate: aliases.realizedDate,
  address: ["alamat", "alamat_debitur", "alamat_nasabah", "address"],
  mantri: aliases.mantri,
  brimenBerkas: ["no_brimen_berkas", "nomor_brimen_berkas", "brimen_berkas", "lokasi_berkas"],
  brimenJaminan: ["no_brimen_jaminan", "nomor_brimen_jaminan", "brimen_jaminan", "lokasi_jaminan"],
  guarantee: ["jaminan", "detail_jaminan", "jenis_jaminan", "guarantee"],
  status: ["status", "status_berkas", "status_brimen"],
} as const;

const nominativeCkpnAliases = {
  accountNumber: aliases.accountNumber,
  debtorName: aliases.debtorName,
  outstanding: aliases.outstanding,
  collectibility: aliases.collectibility,
  formedCkpn: [
    "ckpn",
    "ckpn_terbentuk",
    "ckpn_dibentuk",
    "biaya_ckpn",
    "nominal_ckpn",
    "jumlah_ckpn",
    "cadangan_ckpn",
    "cadangan_kerugian_penurunan_nilai",
    "impairment",
    "impairment_amount",
  ],
} as const;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRow(row: RawRow) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
}

function pick(row: RawRow, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function headerMatchesAlias(header: string, alias: string) {
  if (header === alias) return true;
  if (alias.length <= 1) return false;
  if (header.startsWith(alias) && /^\d+$/.test(header.slice(alias.length))) return true;
  if (!alias.includes("_")) return header.split("_").includes(alias);
  return header.startsWith(`${alias}_`) || header.endsWith(`_${alias}`) || header.includes(`_${alias}_`);
}

function findMatchingHeaders(headers: Set<string>, names: readonly string[]) {
  return [...headers].filter((header) => names.some((name) => headerMatchesAlias(header, name)));
}

function findPreferredHeader(headers: Set<string>, names: readonly string[], excluded = new Set<string>()) {
  for (const name of names) {
    if (headers.has(name) && !excluded.has(name)) return name;
  }
  return findMatchingHeaders(headers, names).find((header) => !excluded.has(header));
}

function parseMoney(value: unknown) {
  if (typeof value === "number") return Math.round(value);
  let text = String(value ?? "").trim().replace(/\s/g, "").replace(/rp/gi, "");
  if (!text) return 0;
  const comma = text.lastIndexOf(",");
  const dot = text.lastIndexOf(".");
  if (comma > dot) text = text.replace(/\./g, "").replace(",", ".");
  else if (dot > comma && /^-?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  else text = text.replace(/,/g, "");
  const parsed = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function normalizeCif(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

function toIsoDate(value: unknown) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function parseCollectibility(value: unknown): ImportedLoanRow["collectibility"] | undefined {
  const text = normalizeHeader(String(value ?? ""));
  if (["1", "l", "lancar", "current"].includes(text)) return "Lancar";
  if (["2", "2a", "2b", "2c", "dpk", "dalam_perhatian_khusus", "sml", "sml1", "sml2", "sml3"].includes(text)) return "DPK";
  if (["3", "kl", "kurang_lancar"].includes(text)) return "KL";
  if (["4", "d", "diragukan"].includes(text)) return "Diragukan";
  if (["5", "m", "macet"].includes(text)) return "Macet";
  return undefined;
}

type QualityName = keyof typeof qualityAmountAliases;
type QualityHeaderMap = Record<QualityName, string[]>;

function resolveQualityHeaders(headers: Set<string>): QualityHeaderMap {
  const result: QualityHeaderMap = { Lancar: [], DPK: [], KL: [], Diragukan: [], Macet: [] };
  const used = new Set<string>();
  const priority: QualityName[] = ["Macet", "Diragukan", "KL", "DPK", "Lancar"];
  priority.forEach((quality) => {
    result[quality] = findMatchingHeaders(headers, qualityAmountAliases[quality]).filter((header) => {
      if (used.has(header)) return false;
      used.add(header);
      return true;
    });
  });
  return result;
}

function getQualityAmounts(row: RawRow, qualityHeaders: QualityHeaderMap) {
  return {
    Lancar: qualityHeaders.Lancar.reduce((total, key) => total + parseMoney(row[key]), 0),
    DPK: qualityHeaders.DPK.reduce((total, key) => total + parseMoney(row[key]), 0),
    KL: qualityHeaders.KL.reduce((total, key) => total + parseMoney(row[key]), 0),
    Diragukan: qualityHeaders.Diragukan.reduce((total, key) => total + parseMoney(row[key]), 0),
    Macet: qualityHeaders.Macet.reduce((total, key) => total + parseMoney(row[key]), 0),
  };
}

function deriveCollectibility(amounts: ReturnType<typeof getQualityAmounts>): ImportedLoanRow["collectibility"] | undefined {
  if (amounts.Macet > 0) return "Macet";
  if (amounts.Diragukan > 0) return "Diragukan";
  if (amounts.KL > 0) return "KL";
  if (amounts.DPK > 0) return "DPK";
  if (amounts.Lancar > 0) return "Lancar";
  return undefined;
}

const knownCsvHeaderAliases: string[] = [
  ...Object.values(aliases).flat(),
  ...Object.values(qualityAmountAliases).flat(),
  ...Object.values(depositAliases).flat(),
  ...Object.values(brimenAliases).flat(),
  ...Object.values(nominativeCkpnAliases).flat(),
];

function csvHeaderScore(row: unknown[]) {
  return row.reduce<number>((score, value) => {
    const header = normalizeHeader(String(value ?? ""));
    if (knownCsvHeaderAliases.includes(header)) return score + 4;
    return score + (knownCsvHeaderAliases.some((alias) => headerMatchesAlias(header, alias)) ? 1 : 0);
  }, 0);
}

function parseCsv(buffer: Buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const candidates = [";", ",", "\t", "|"]
    .map((delimiter) => {
      try {
        const matrix = parse(content, { columns: false, skip_empty_lines: true, relax_column_count: true, trim: true, delimiter }) as unknown[][];
        const inspected = matrix.slice(0, 25);
        const headerIndex = inspected.reduce((bestIndex, row, index) => (
          csvHeaderScore(row) > csvHeaderScore(inspected[bestIndex] ?? []) ? index : bestIndex
        ), 0);
        return {
          delimiter,
          matrix,
          headerIndex,
          score: csvHeaderScore(matrix[headerIndex] ?? []),
          width: Math.max(0, ...inspected.map((row) => row.length)),
        };
      } catch {
        return { delimiter, matrix: [] as unknown[][], headerIndex: 0, score: -1, width: 0 };
      }
    })
    .sort((a, b) => b.score - a.score || b.width - a.width);
  const selected = candidates[0];
  const rawHeaders = selected.matrix[selected.headerIndex] ?? [];
  const headers = rawHeaders.map((value, index) => String(value ?? "").trim() || `Kolom ${index + 1}`);
  return selected.matrix.slice(selected.headerIndex + 1).map((row) => Object.fromEntries(
    headers.map((header, index) => [header, row[index] ?? ""]),
  )) as RawRow[];
}

function parseWorksheet(sheet: XLSX.WorkSheet) {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
  const inspected = matrix.slice(0, 30);
  const headerIndex = inspected.reduce((bestIndex, row, index) => (
    csvHeaderScore(row) > csvHeaderScore(inspected[bestIndex] ?? []) ? index : bestIndex
  ), 0);
  const rawHeaders = matrix[headerIndex] ?? [];
  const headers = rawHeaders.map((value, index) => String(value ?? "").trim() || `Kolom ${index + 1}`);
  return matrix.slice(headerIndex + 1).map((row) => Object.fromEntries(
    headers.map((header, index) => [header, row[index] ?? ""]),
  )) as RawRow[];
}

export function parseTabularFile(fileName: string, buffer: Buffer) {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "csv") return parseCsv(buffer);
  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("File Excel tidak memiliki sheet yang dapat dibaca.");
    return parseWorksheet(sheet);
  }
  throw new Error("Format tabel belum didukung.");
}

const monthNames: Record<string, number> = {
  januari: 1, january: 1, februari: 2, february: 2, maret: 3, march: 3, april: 4, mei: 5, may: 5, juni: 6, june: 6,
  juli: 7, july: 7, agustus: 8, august: 8, september: 9, oktober: 10, october: 10, november: 11, desember: 12, december: 12,
};

export function inferPeriod(sourceKey: string, fileName: string, rows: RawRow[], now = new Date()) {
  const first = rows[0] ? normalizeRow(rows[0]) : {};
  const rowDate = toIsoDate(pick(first, aliases.period));
  if (rowDate) return rowDate.slice(0, 7);
  const isoMatch = fileName.match(/(20\d{2})[-_. ](0?[1-9]|1[0-2])/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}`;
  const lowered = fileName.toLowerCase();
  for (const [name, month] of Object.entries(monthNames)) {
    const match = lowered.match(new RegExp(`${name}[^0-9]*(20\\d{2})`));
    if (match) return `${match[1]}-${String(month).padStart(2, "0")}`;
  }
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  if (sourceKey === "lw321-bulan-lalu") base.setMonth(base.getMonth() - 1);
  if (sourceKey === "lw321-dua-bulan") base.setMonth(base.getMonth() - 2);
  if (sourceKey === "di319") base.setMonth(base.getMonth() - 1);
  if (sourceKey === "nominatif-rekening") base.setMonth(base.getMonth() - 1);
  if (sourceKey === "lw321-tahun-lalu") return `${now.getFullYear() - 1}-12`;
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

export function extractBranchIdentity(rows: RawRow[]) {
  for (const rawRow of rows.slice(0, 25)) {
    const row = normalizeRow(rawRow);
    const code = String(pick(row, branchAliases.code)).replace(/\D/g, "").trim();
    const name = String(pick(row, branchAliases.name)).replace(/\s+/g, " ").trim();
    if (code || name) return { code, name };
  }
  return { code: "", name: "" };
}

export function mapLoanRows(rawRows: RawRow[], period: string) {
  if (!rawRows.length) throw new Error("File tidak memiliki baris data.");
  const normalizedRows = rawRows.map(normalizeRow);
  const headers = new Set(Object.keys(normalizedRows[0]));
  const accountHeader = findPreferredHeader(headers, aliases.accountNumber);
  const debtorHeader = findPreferredHeader(headers, aliases.debtorName);
  const mantriHeader = findPreferredHeader(headers, aliases.mantri);
  const required = [
    ["No Rekening", accountHeader], ["Nama Debitur", debtorHeader], ["Mantri/PN_PENGELOLA_SINGLEPN", mantriHeader],
  ] as const;
  const missing = required.filter(([, header]) => !header).map(([label]) => label);
  if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
  const qualityHeaders = resolveQualityHeaders(headers);
  const qualityHeaderSet = new Set(Object.values(qualityHeaders).flat());
  const outstandingHeader = findPreferredHeader(headers, aliases.outstanding, qualityHeaderSet);
  const collectibilityHeader = findPreferredHeader(headers, aliases.collectibility, qualityHeaderSet);
  const hasQualityAmountColumns = qualityHeaderSet.size > 0;
  if (!outstandingHeader && !hasQualityAmountColumns) {
    throw new Error(`Outstanding tidak dapat dihitung. Header yang terbaca: ${[...headers].slice(0, 15).join(", ")}.`);
  }
  if (!collectibilityHeader && !hasQualityAmountColumns) {
    throw new Error("Kolektibilitas tidak dapat ditentukan. Tambahkan kolom Kolektibilitas atau kolom nominal kualitas Lancar sampai Macet.");
  }

  let rejected = 0;
  const issues: string[] = [];
  const unique = new Map<string, ImportedLoanRow>();
  normalizedRows.forEach((row, index) => {
    const accountNumber = String(row[accountHeader!]).trim();
    const debtorName = String(row[debtorHeader!]).trim();
    const qualityAmounts = getQualityAmounts(row, qualityHeaders);
    const derivedCollectibility = deriveCollectibility(qualityAmounts);
    const collectibility = hasQualityAmountColumns
      ? derivedCollectibility ?? parseCollectibility(collectibilityHeader ? row[collectibilityHeader] : "")
      : parseCollectibility(collectibilityHeader ? row[collectibilityHeader] : "");
    const mantri = String(row[mantriHeader!]).trim();
    if (!accountNumber || !debtorName || !collectibility || !mantri) {
      rejected += 1;
      if (issues.length < 5) issues.push(`Baris ${index + 2}: rekening, nama, kolektibilitas, atau mantri tidak valid.`);
      return;
    }
    const plafond = parseMoney(pick(row, aliases.plafond));
    const outstanding = hasQualityAmountColumns
      ? Object.values(qualityAmounts).reduce((total, value) => total + value, 0)
      : parseMoney(row[outstandingHeader!]);
    const realizedAmount = parseMoney(pick(row, aliases.realizedAmount)) || plafond;
    const pnPengelola = mantri;
    const flagText = normalizeHeader(String(pick(row, aliases.restructureFlag)));
    unique.set(accountNumber, {
      cif: normalizeCif(pick(row, aliases.cif)),
      loanType: String(pick(row, aliases.loanType)).trim().toUpperCase(),
      accountNumber,
      debtorName,
      nextPaymentDate: toIsoDate(pick(row, aliases.nextPaymentDate)) || `${period}-01`,
      outstanding,
      plafond,
      collectibility,
      restructureFlag: ["y", "ya", "yes", "1", "pernah"].includes(flagText) ? "Y" : "N",
      mantri,
      pnPengelola,
      description: String(pick(row, aliases.description)).trim() || "Lainnya",
      realizedDate: toIsoDate(pick(row, aliases.realizedDate)),
      realizedAmount,
      principalArrears: parseMoney(pick(row, aliases.principalArrears)),
      interestArrears: parseMoney(pick(row, aliases.interestArrears)),
    });
  });
  if (!unique.size) throw new Error("Tidak ada baris pinjaman yang valid untuk disimpan.");
  return { rows: [...unique.values()], rejected, duplicates: normalizedRows.length - rejected - unique.size, issues };
}

export function mapDepositRows(rawRows: RawRow[], period: string) {
  if (!rawRows.length) throw new Error("File DI319 tidak memiliki baris data.");
  const normalizedRows = rawRows.map(normalizeRow);
  const headers = new Set(Object.keys(normalizedRows[0]));
  const cifHeader = findPreferredHeader(headers, depositAliases.cif);
  const savingsHeader = findPreferredHeader(headers, depositAliases.savingsAccount);
  const loanHeader = findPreferredHeader(headers, depositAliases.loanAccountNumber);
  if (!cifHeader) throw new Error(`Kolom No CIF/CIFNO tidak ditemukan pada file DI319. Header yang terbaca: ${[...headers].slice(0, 15).join(", ") || "tidak ada"}.`);
  if (!savingsHeader) throw new Error("Kolom No Rekening Simpanan tidak ditemukan pada file DI319.");
  let rejected = 0;
  const issues: string[] = [];
  const unique = new Map<string, ImportedDepositRow>();
  normalizedRows.forEach((row, index) => {
    const cif = normalizeCif(row[cifHeader]);
    const savingsAccount = String(row[savingsHeader]).replace(/\D/g, "");
    const loanAccountNumber = loanHeader ? String(row[loanHeader]).replace(/\D/g, "") : "";
    if (!cif || !savingsAccount) {
      rejected += 1;
      if (issues.length < 5) issues.push(`Baris ${index + 2}: No CIF atau No Rekening Simpanan kosong.`);
      return;
    }
    const rawBlockedAtStart = pick(row, depositAliases.blockedAtStart);
    const rawCurrentBlocked = pick(row, depositAliases.currentBlocked);
    const balance = parseMoney(pick(row, depositAliases.balance));
    const availableBalance = parseMoney(pick(row, depositAliases.availableBalance));
    const derivedBlocked = Math.max(0, balance - availableBalance);
    const blockedAtStart = String(rawBlockedAtStart).trim() ? parseMoney(rawBlockedAtStart) : derivedBlocked;
    const currentBlocked = String(rawCurrentBlocked).trim() ? parseMoney(rawCurrentBlocked) : derivedBlocked;
    const installmentFromBlocked = parseMoney(pick(row, depositAliases.installmentFromBlocked));
    const rawStatus = normalizeHeader(String(pick(row, depositAliases.status)));
    const status: ImportedDepositRow["status"] = rawStatus.includes("setor") || installmentFromBlocked > 0
      ? "Setor dari Blokiran"
      : rawStatus.includes("aktif") || currentBlocked > 0
        ? "Blokiran Aktif"
        : "Tidak Ada Blokiran";
    unique.set(`${cif}|${savingsAccount}`, {
      cif,
      loanAccountNumber,
      debtorName: String(pick(row, depositAliases.debtorName)).trim(),
      mantri: String(pick(row, depositAliases.mantri)).trim(),
      savingsAccount,
      balance,
      availableBalance,
      blockedAtStart,
      currentBlocked,
      installmentFromBlocked,
      mutationDate: toIsoDate(pick(row, depositAliases.mutationDate)) || `${period}-01`,
      status,
    });
  });
  if (!unique.size) throw new Error("Tidak ada baris DI319 yang valid untuk disimpan.");
  return { rows: [...unique.values()], rejected, duplicates: normalizedRows.length - rejected - unique.size, issues };
}

export function mapNominativeCkpnRows(rawRows: RawRow[]) {
  if (!rawRows.length) throw new Error("File Nominatif Per Rekening tidak memiliki baris data.");
  const normalizedRows = rawRows.map(normalizeRow);
  const headers = new Set(Object.keys(normalizedRows[0]));
  const accountHeader = findPreferredHeader(headers, nominativeCkpnAliases.accountNumber);
  const formedCkpnHeader = findPreferredHeader(headers, nominativeCkpnAliases.formedCkpn);
  if (!accountHeader) throw new Error(`Kolom No Rekening tidak ditemukan pada file Nominatif Per Rekening. Header yang terbaca: ${[...headers].slice(0, 15).join(", ") || "tidak ada"}.`);
  if (!formedCkpnHeader) throw new Error("Kolom CKPN/CKPN Terbentuk tidak ditemukan pada file Nominatif Per Rekening.");

  let rejected = 0;
  const issues: string[] = [];
  const unique = new Map<string, ImportedNominativeCkpnRow>();
  normalizedRows.forEach((row, index) => {
    const accountNumber = String(row[accountHeader]).trim().replace(/\s+/g, "");
    const formedCkpn = parseMoney(row[formedCkpnHeader]);
    if (!accountNumber) {
      rejected += 1;
      if (issues.length < 5) issues.push(`Baris ${index + 2}: No Rekening kosong.`);
      return;
    }
    unique.set(accountNumber, {
      accountNumber,
      debtorName: String(pick(row, nominativeCkpnAliases.debtorName)).trim(),
      outstanding: parseMoney(pick(row, nominativeCkpnAliases.outstanding)),
      collectibility: parseCollectibility(pick(row, nominativeCkpnAliases.collectibility)) ?? String(pick(row, nominativeCkpnAliases.collectibility)).trim(),
      formedCkpn,
    });
  });
  if (!unique.size) throw new Error("Tidak ada baris Nominatif Per Rekening yang valid untuk disimpan.");
  return { rows: [...unique.values()], rejected, duplicates: normalizedRows.length - rejected - unique.size, issues };
}

export function mapBrimenRows(rawRows: RawRow[]) {
  if (!rawRows.length) throw new Error("File Data BRIMEN tidak memiliki baris data.");
  const normalizedRows = rawRows.map(normalizeRow);
  const headers = new Set(Object.keys(normalizedRows[0]));
  const missing = [
    ["No Rekening", brimenAliases.accountNumber],
    ["Nama Nasabah", brimenAliases.name],
  ] as const;
  const missingLabels = missing.filter(([, keys]) => !keys.some((key) => headers.has(key))).map(([label]) => label);
  if (missingLabels.length) throw new Error(`Kolom wajib Data BRIMEN tidak ditemukan: ${missingLabels.join(", ")}.`);
  let rejected = 0;
  const issues: string[] = [];
  const unique = new Map<string, ImportedBrimenRow>();
  normalizedRows.forEach((row, index) => {
    const accountNumber = String(pick(row, brimenAliases.accountNumber)).replace(/\D/g, "");
    const name = String(pick(row, brimenAliases.name)).trim();
    if (!/^\d{15}$/.test(accountNumber) || !name) {
      rejected += 1;
      if (issues.length < 5) issues.push(`Baris ${index + 2}: No Rekening harus 15 angka dan nama wajib diisi.`);
      return;
    }
    const statusText = normalizeHeader(String(pick(row, brimenAliases.status)));
    const status: ImportedBrimenRow["status"] = statusText.includes("pinjam")
      ? "Dipinjam"
      : statusText.includes("ambil")
        ? "Diambil"
        : statusText.includes("lunas")
          ? "Lunas"
          : "Disimpan";
    unique.set(accountNumber, {
      accountNumber,
      name,
      plafond: parseMoney(pick(row, brimenAliases.plafond)),
      realizationDate: toIsoDate(pick(row, brimenAliases.realizationDate)),
      address: String(pick(row, brimenAliases.address)).trim(),
      mantri: String(pick(row, brimenAliases.mantri)).trim(),
      brimenBerkas: String(pick(row, brimenAliases.brimenBerkas)).trim().replace(/\s+/g, "."),
      brimenJaminan: String(pick(row, brimenAliases.brimenJaminan)).trim().replace(/\s+/g, "."),
      guarantee: String(pick(row, brimenAliases.guarantee)).trim(),
      status,
    });
  });
  if (!unique.size) throw new Error("Tidak ada baris Data BRIMEN yang valid untuk disimpan.");
  return { rows: [...unique.values()], rejected, duplicates: normalizedRows.length - rejected - unique.size, issues };
}
