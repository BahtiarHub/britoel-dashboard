import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export type ImportedLoanRow = {
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
};

export type ImportedDepositRow = {
  loanAccountNumber: string;
  debtorName: string;
  mantri: string;
  savingsAccount: string;
  blockedAtStart: number;
  currentBlocked: number;
  installmentFromBlocked: number;
  mutationDate: string;
  status: "Tidak Ada Blokiran" | "Setor dari Blokiran" | "Blokiran Aktif";
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
  accountNumber: ["no_rekening", "nomor_rekening", "no_rek", "norek", "rekening", "account_number", "account_no", "acctno", "no_rekening_nasabah"],
  debtorName: ["nama_debitur", "nama_nasabah", "nama_debitur_single", "debitur", "customer_name", "nama"],
  nextPaymentDate: ["next_payment_date", "next_pmt_date", "nextpaymentdate", "tanggal_jatuh_tempo", "tgl_jatuh_tempo", "jatuh_tempo", "npd"],
  outstanding: ["outstanding", "baki_debet", "bakidebet", "os", "saldo_pinjaman", "sisa_pinjaman"],
  plafond: ["plafond", "plafon", "loan_amount", "jumlah_plafond"],
  collectibility: ["kolektibilitas", "kolektibilitas_terbaru", "kolek", "kol", "collectibility", "credit_status", "kualitas"],
  restructureFlag: ["flag_restruk", "flag_restrukturisasi", "flaf_restruk", "restruk", "restructure_flag"],
  mantri: ["pn_pengelola_singlepn", "pn_pengelola", "mantri", "nama_mantri", "pengelola"],
  description: ["description", "deskripsi", "tipe_pinjaman", "jenis_pinjaman", "produk", "product_description"],
  realizedDate: ["tanggal_realisasi", "tgl_realisasi", "realized_date", "realisasi_date", "date_realisasi"],
  realizedAmount: ["jumlah_realisasi", "nominal_realisasi", "realized_amount", "realisasi", "plafond_realisasi"],
  period: ["periode", "period", "bulan_data", "posisi_data", "snapshot_date", "tanggal_data", "report_date"],
} as const;

const depositAliases = {
  loanAccountNumber: ["no_rekening_pinjaman", "nomor_rekening_pinjaman", "rekening_pinjaman", "loan_account_number", "no_rekening_kredit", "no_rekening"],
  debtorName: aliases.debtorName,
  mantri: aliases.mantri,
  savingsAccount: ["no_rekening_simpanan", "nomor_rekening_simpanan", "rekening_simpanan", "savings_account", "saving_account", "rekening_blokiran"],
  blockedAtStart: ["blokiran_awal", "saldo_blokir_awal", "saldo_blokiran_awal", "nominal_blokir_awal", "blokir_awal"],
  currentBlocked: ["blokiran_saat_ini", "saldo_blokir", "saldo_blokiran", "nominal_blokir", "current_blocked"],
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
  if (["2", "dpk", "dalam_perhatian_khusus", "sml", "sml1", "sml2", "sml3"].includes(text)) return "DPK";
  if (["3", "kl", "kurang_lancar"].includes(text)) return "KL";
  if (["4", "d", "diragukan"].includes(text)) return "Diragukan";
  if (["5", "m", "macet"].includes(text)) return "Macet";
  return undefined;
}

function parseCsv(buffer: Buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", ",", "\t", "|"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true, delimiter }) as RawRow[];
}

export function parseTabularFile(fileName: string, buffer: Buffer) {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "csv") return parseCsv(buffer);
  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: true });
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
  if (sourceKey === "lw321-tahun-lalu") return `${now.getFullYear() - 1}-12`;
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

export function mapLoanRows(rawRows: RawRow[], period: string) {
  if (!rawRows.length) throw new Error("File tidak memiliki baris data.");
  const normalizedRows = rawRows.map(normalizeRow);
  const headers = new Set(Object.keys(normalizedRows[0]));
  const required = [
    ["No Rekening", aliases.accountNumber], ["Nama Debitur", aliases.debtorName], ["Outstanding/Baki Debet", aliases.outstanding],
    ["Kolektibilitas", aliases.collectibility], ["Mantri/PN_PENGELOLA_SINGLEPN", aliases.mantri],
  ] as const;
  const missing = required.filter(([, keys]) => !keys.some((key) => headers.has(key))).map(([label]) => label);
  if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);

  let rejected = 0;
  const issues: string[] = [];
  const unique = new Map<string, ImportedLoanRow>();
  normalizedRows.forEach((row, index) => {
    const accountNumber = String(pick(row, aliases.accountNumber)).trim();
    const debtorName = String(pick(row, aliases.debtorName)).trim();
    const collectibility = parseCollectibility(pick(row, aliases.collectibility));
    const mantri = String(pick(row, aliases.mantri)).trim();
    if (!accountNumber || !debtorName || !collectibility || !mantri) {
      rejected += 1;
      if (issues.length < 5) issues.push(`Baris ${index + 2}: rekening, nama, kolektibilitas, atau mantri tidak valid.`);
      return;
    }
    const plafond = parseMoney(pick(row, aliases.plafond));
    const outstanding = parseMoney(pick(row, aliases.outstanding));
    const realizedAmount = parseMoney(pick(row, aliases.realizedAmount)) || plafond;
    const pnPengelola = String(pick(row, aliases.mantri)).trim();
    const flagText = normalizeHeader(String(pick(row, aliases.restructureFlag)));
    unique.set(accountNumber, {
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
    });
  });
  if (!unique.size) throw new Error("Tidak ada baris pinjaman yang valid untuk disimpan.");
  return { rows: [...unique.values()], rejected, duplicates: normalizedRows.length - rejected - unique.size, issues };
}

export function mapDepositRows(rawRows: RawRow[], period: string) {
  if (!rawRows.length) throw new Error("File DI319 tidak memiliki baris data.");
  const normalizedRows = rawRows.map(normalizeRow);
  const headers = new Set(Object.keys(normalizedRows[0]));
  if (!depositAliases.loanAccountNumber.some((key) => headers.has(key))) {
    throw new Error("Kolom No Rekening Pinjaman tidak ditemukan pada file DI319.");
  }
  let rejected = 0;
  const issues: string[] = [];
  const unique = new Map<string, ImportedDepositRow>();
  normalizedRows.forEach((row, index) => {
    const loanAccountNumber = String(pick(row, depositAliases.loanAccountNumber)).replace(/\D/g, "");
    if (!loanAccountNumber) {
      rejected += 1;
      if (issues.length < 5) issues.push(`Baris ${index + 2}: No Rekening Pinjaman kosong.`);
      return;
    }
    const blockedAtStart = parseMoney(pick(row, depositAliases.blockedAtStart));
    const currentBlocked = parseMoney(pick(row, depositAliases.currentBlocked));
    const installmentFromBlocked = parseMoney(pick(row, depositAliases.installmentFromBlocked));
    const rawStatus = normalizeHeader(String(pick(row, depositAliases.status)));
    const status: ImportedDepositRow["status"] = rawStatus.includes("setor") || installmentFromBlocked > 0
      ? "Setor dari Blokiran"
      : rawStatus.includes("aktif") || currentBlocked > 0
        ? "Blokiran Aktif"
        : "Tidak Ada Blokiran";
    unique.set(loanAccountNumber, {
      loanAccountNumber,
      debtorName: String(pick(row, depositAliases.debtorName)).trim(),
      mantri: String(pick(row, depositAliases.mantri)).trim(),
      savingsAccount: String(pick(row, depositAliases.savingsAccount)).replace(/\D/g, ""),
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
