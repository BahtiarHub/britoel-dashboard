export type MonthKey = string;

export type RawCollectibility = "Lancar" | "DPK" | "KL" | "Diragukan" | "Macet";
export type QualityBucket =
  | "Lancar"
  | "LR"
  | "SML1"
  | "SML2"
  | "SML3"
  | "KL"
  | "Diragukan"
  | "Macet";
export type ProductType = "PUMK" | "Kupedes" | "Kupedes Rakyat" | "KUR Mikro" | "Lainnya";
export type MissingLoanStatus = "PH" | "Lunas";
export type MissingLoanDisplayStatus = MissingLoanStatus | "Perlu Konfirmasi";
export type PrognosaCollectibility = "Lancar" | "LR" | "SML1" | "SML2" | "SML3" | "KL/D" | "Macet" | "Lunas" | "PH";

export interface NominativeCkpnRecord {
  period: MonthKey;
  accountNumber: string;
  debtorName: string;
  outstanding: number;
  collectibility: string;
  formedCkpn: number;
}

export interface MissingLoanResolution {
  period: MonthKey;
  accountNumber: string;
  status: MissingLoanStatus;
}

export interface CkpnForecast {
  period: MonthKey;
  accountNumber: string;
  targetCollectibility: PrognosaCollectibility;
}
export type MenuKey =
  | "dashboard"
  | "mantri"
  | "brimen"
  | "unggah"
  | "users";

export interface LoanSnapshot {
  month: MonthKey;
  cif?: string;
  loanType?: string;
  accountNumber: string;
  debtorName: string;
  nextPaymentDate: string;
  outstanding: number;
  plafond: number;
  rawCollectibility: RawCollectibility;
  flagRestruk: "N" | "Y";
  mantri: string;
  pnPengelolaSinglePn: string;
  description: string;
  realizedDate: string;
  realizedAmount: number;
  principalArrears?: number;
  interestArrears?: number;
}

export interface UploadHistory {
  fileName: string;
  status: "Berhasil" | "Diproses" | "Gagal";
  uploadedAt: string;
  uploadedBy: string;
  rows: number;
}

const mockMonths: { value: MonthKey; label: string }[] = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "Mei 2026" },
  { value: "2026-06", label: "Juni 2026" },
];

const mockLoanSnapshots: LoanSnapshot[] = [
  {
    month: "2026-04",
    accountNumber: "3210-01-000123-53-2",
    debtorName: "Siti Aminah",
    nextPaymentDate: "2026-05-10",
    outstanding: 46000000,
    plafond: 100000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "Kupedes Modal Kerja",
    realizedDate: "2026-04-04",
    realizedAmount: 100000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000123-53-2",
    debtorName: "Siti Aminah",
    nextPaymentDate: "2026-06-10",
    outstanding: 43000000,
    plafond: 100000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "Kupedes Modal Kerja",
    realizedDate: "2026-04-04",
    realizedAmount: 100000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000123-53-2",
    debtorName: "Siti Aminah",
    nextPaymentDate: "2026-07-10",
    outstanding: 39800000,
    plafond: 100000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "Kupedes Modal Kerja",
    realizedDate: "2026-04-04",
    realizedAmount: 100000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000187-53-1",
    debtorName: "Ahmad Fauzi",
    nextPaymentDate: "2026-05-18",
    outstanding: 72000000,
    plafond: 90000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "KUR Mikro Investasi",
    realizedDate: "2026-05-06",
    realizedAmount: 90000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000187-53-1",
    debtorName: "Ahmad Fauzi",
    nextPaymentDate: "2026-05-18",
    outstanding: 70500000,
    plafond: 90000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "KUR Mikro Investasi",
    realizedDate: "2026-05-06",
    realizedAmount: 90000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000187-53-1",
    debtorName: "Ahmad Fauzi",
    nextPaymentDate: "2026-05-18",
    outstanding: 69500000,
    plafond: 90000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "KUR Mikro Investasi",
    realizedDate: "2026-05-06",
    realizedAmount: 90000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000231-53-9",
    debtorName: "Maya Lestari",
    nextPaymentDate: "2026-04-11",
    outstanding: 61000000,
    plafond: 80000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Sari Wulandari",
    pnPengelolaSinglePn: "Sari Wulandari",
    description: "Kupedes Rakyat Perdagangan",
    realizedDate: "2026-06-11",
    realizedAmount: 80000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000231-53-9",
    debtorName: "Maya Lestari",
    nextPaymentDate: "2026-04-11",
    outstanding: 59500000,
    plafond: 80000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Sari Wulandari",
    pnPengelolaSinglePn: "Sari Wulandari",
    description: "Kupedes Rakyat Perdagangan",
    realizedDate: "2026-06-11",
    realizedAmount: 80000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000231-53-9",
    debtorName: "Maya Lestari",
    nextPaymentDate: "2026-04-11",
    outstanding: 58000000,
    plafond: 80000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Sari Wulandari",
    pnPengelolaSinglePn: "Sari Wulandari",
    description: "Kupedes Rakyat Perdagangan",
    realizedDate: "2026-06-11",
    realizedAmount: 80000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000305-53-8",
    debtorName: "Dedi Kurniawan",
    nextPaymentDate: "2026-03-08",
    outstanding: 119000000,
    plafond: 130000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "Kupedes Usaha Tani",
    realizedDate: "2026-03-21",
    realizedAmount: 130000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000305-53-8",
    debtorName: "Dedi Kurniawan",
    nextPaymentDate: "2026-03-08",
    outstanding: 118000000,
    plafond: 130000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "Kupedes Usaha Tani",
    realizedDate: "2026-03-21",
    realizedAmount: 130000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000305-53-8",
    debtorName: "Dedi Kurniawan",
    nextPaymentDate: "2026-03-08",
    outstanding: 116500000,
    plafond: 130000000,
    rawCollectibility: "KL",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "Kupedes Usaha Tani",
    realizedDate: "2026-03-21",
    realizedAmount: 130000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000411-53-6",
    debtorName: "Nur Halimah",
    nextPaymentDate: "2026-04-23",
    outstanding: 54500000,
    plafond: 70000000,
    rawCollectibility: "DPK",
    flagRestruk: "Y",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "KUR Mikro Modal Kerja",
    realizedDate: "2026-02-12",
    realizedAmount: 70000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000411-53-6",
    debtorName: "Nur Halimah",
    nextPaymentDate: "2026-06-23",
    outstanding: 52700000,
    plafond: 70000000,
    rawCollectibility: "Lancar",
    flagRestruk: "Y",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "KUR Mikro Modal Kerja",
    realizedDate: "2026-02-12",
    realizedAmount: 70000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000411-53-6",
    debtorName: "Nur Halimah",
    nextPaymentDate: "2026-07-23",
    outstanding: 51000000,
    plafond: 70000000,
    rawCollectibility: "Lancar",
    flagRestruk: "Y",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "KUR Mikro Modal Kerja",
    realizedDate: "2026-02-12",
    realizedAmount: 70000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000508-53-7",
    debtorName: "Tono Wijaya",
    nextPaymentDate: "2026-02-14",
    outstanding: 91000000,
    plafond: 120000000,
    rawCollectibility: "KL",
    flagRestruk: "Y",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "Kupedes Rakyat Perdagangan",
    realizedDate: "2026-01-19",
    realizedAmount: 120000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000508-53-7",
    debtorName: "Tono Wijaya",
    nextPaymentDate: "2026-02-14",
    outstanding: 90000000,
    plafond: 120000000,
    rawCollectibility: "Diragukan",
    flagRestruk: "Y",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "Kupedes Rakyat Perdagangan",
    realizedDate: "2026-01-19",
    realizedAmount: 120000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000508-53-7",
    debtorName: "Tono Wijaya",
    nextPaymentDate: "2026-02-14",
    outstanding: 88500000,
    plafond: 120000000,
    rawCollectibility: "KL",
    flagRestruk: "Y",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "Kupedes Rakyat Perdagangan",
    realizedDate: "2026-01-19",
    realizedAmount: 120000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000616-53-5",
    debtorName: "Rudi Hartono",
    nextPaymentDate: "2026-05-02",
    outstanding: 42000000,
    plafond: 110000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "Kupedes Rakyat Pertanian",
    realizedDate: "2026-06-18",
    realizedAmount: 110000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000616-53-5",
    debtorName: "Rudi Hartono",
    nextPaymentDate: "2026-06-02",
    outstanding: 39000000,
    plafond: 110000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "Kupedes Rakyat Pertanian",
    realizedDate: "2026-06-18",
    realizedAmount: 110000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000616-53-5",
    debtorName: "Rudi Hartono",
    nextPaymentDate: "2026-07-02",
    outstanding: 36500000,
    plafond: 110000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "Kupedes Rakyat Pertanian",
    realizedDate: "2026-06-18",
    realizedAmount: 110000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000719-53-4",
    debtorName: "Yanti Safitri",
    nextPaymentDate: "2026-05-15",
    outstanding: 58000000,
    plafond: 105000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Sari Wulandari",
    pnPengelolaSinglePn: "Sari Wulandari",
    description: "Kupedes Perdagangan",
    realizedDate: "2026-05-20",
    realizedAmount: 105000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000719-53-4",
    debtorName: "Yanti Safitri",
    nextPaymentDate: "2026-06-15",
    outstanding: 49500000,
    plafond: 105000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Sari Wulandari",
    pnPengelolaSinglePn: "Sari Wulandari",
    description: "Kupedes Perdagangan",
    realizedDate: "2026-05-20",
    realizedAmount: 105000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000719-53-4",
    debtorName: "Yanti Safitri",
    nextPaymentDate: "2026-07-15",
    outstanding: 47200000,
    plafond: 105000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Sari Wulandari",
    pnPengelolaSinglePn: "Sari Wulandari",
    description: "Kupedes Perdagangan",
    realizedDate: "2026-05-20",
    realizedAmount: 105000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000822-53-0",
    debtorName: "Eka Saputra",
    nextPaymentDate: "2026-05-09",
    outstanding: 30000000,
    plafond: 75000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "BRIGuna Mikro",
    realizedDate: "2026-06-04",
    realizedAmount: 75000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000822-53-0",
    debtorName: "Eka Saputra",
    nextPaymentDate: "2026-06-09",
    outstanding: 29200000,
    plafond: 75000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "BRIGuna Mikro",
    realizedDate: "2026-06-04",
    realizedAmount: 75000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000822-53-0",
    debtorName: "Eka Saputra",
    nextPaymentDate: "2026-07-09",
    outstanding: 28400000,
    plafond: 75000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Rina Puspita",
    pnPengelolaSinglePn: "Rina Puspita",
    description: "BRIGuna Mikro",
    realizedDate: "2026-06-04",
    realizedAmount: 75000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-000933-53-2",
    debtorName: "Lina Marlina",
    nextPaymentDate: "2026-05-22",
    outstanding: 79000000,
    plafond: 95000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "KUR Mikro Modal Kerja",
    realizedDate: "2026-04-26",
    realizedAmount: 95000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-000933-53-2",
    debtorName: "Lina Marlina",
    nextPaymentDate: "2026-05-22",
    outstanding: 77500000,
    plafond: 95000000,
    rawCollectibility: "Lancar",
    flagRestruk: "N",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "KUR Mikro Modal Kerja",
    realizedDate: "2026-04-26",
    realizedAmount: 95000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-000933-53-2",
    debtorName: "Lina Marlina",
    nextPaymentDate: "2026-05-22",
    outstanding: 76000000,
    plafond: 95000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Budi Santoso",
    pnPengelolaSinglePn: "Budi Santoso",
    description: "KUR Mikro Modal Kerja",
    realizedDate: "2026-04-26",
    realizedAmount: 95000000,
  },
  {
    month: "2026-04",
    accountNumber: "3210-01-001042-53-6",
    debtorName: "Hendra Kusuma",
    nextPaymentDate: "2026-03-05",
    outstanding: 101000000,
    plafond: 125000000,
    rawCollectibility: "DPK",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "KUR Mikro Ternak",
    realizedDate: "2026-01-10",
    realizedAmount: 125000000,
  },
  {
    month: "2026-05",
    accountNumber: "3210-01-001042-53-6",
    debtorName: "Hendra Kusuma",
    nextPaymentDate: "2026-03-05",
    outstanding: 99200000,
    plafond: 125000000,
    rawCollectibility: "KL",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "KUR Mikro Ternak",
    realizedDate: "2026-01-10",
    realizedAmount: 125000000,
  },
  {
    month: "2026-06",
    accountNumber: "3210-01-001042-53-6",
    debtorName: "Hendra Kusuma",
    nextPaymentDate: "2026-03-05",
    outstanding: 97400000,
    plafond: 125000000,
    rawCollectibility: "Diragukan",
    flagRestruk: "N",
    mantri: "Andi Pratama",
    pnPengelolaSinglePn: "Andi Pratama",
    description: "KUR Mikro Ternak",
    realizedDate: "2026-01-10",
    realizedAmount: 125000000,
  },
];

export let months: { value: MonthKey; label: string }[] = [...mockMonths];
export let loanSnapshots: LoanSnapshot[] = [...mockLoanSnapshots];
let snapshotsByMonth = new Map<MonthKey, LoanSnapshot[]>();
let snapshotsByMonthAndAccount = new Map<MonthKey, Map<string, LoanSnapshot>>();
let nominativeCkpnByPeriodAndAccount = new Map<MonthKey, Map<string, NominativeCkpnRecord>>();
let missingLoanResolutionByPeriodAndAccount = new Map<MonthKey, Map<string, MissingLoanStatus>>();
let ckpnForecastByPeriodAndAccount = new Map<MonthKey, Map<string, PrognosaCollectibility>>();
const analysisCache = new Map<string, unknown>();
const qualityClassificationCache = new Map<string, QualityBucket>();

function clearAnalysisCache() {
  analysisCache.clear();
  qualityClassificationCache.clear();
}

function getCachedAnalysis<T>(key: string, calculate: () => T): T {
  if (analysisCache.has(key)) return analysisCache.get(key) as T;
  const value = calculate();
  analysisCache.set(key, value);
  return value;
}

function normalizeAccountKey(value: string) {
  return value.replace(/\D/g, "") || value.trim().toUpperCase();
}

function rebuildLoanIndexes() {
  snapshotsByMonth = new Map();
  snapshotsByMonthAndAccount = new Map();
  for (const item of loanSnapshots) {
    const monthRows = snapshotsByMonth.get(item.month) ?? [];
    monthRows.push(item);
    snapshotsByMonth.set(item.month, monthRows);

    const accountRows = snapshotsByMonthAndAccount.get(item.month) ?? new Map<string, LoanSnapshot>();
    accountRows.set(item.accountNumber, item);
    snapshotsByMonthAndAccount.set(item.month, accountRows);
  }
  clearAnalysisCache();
}

rebuildLoanIndexes();

export function applyUploadedLoanData(rows: LoanSnapshot[], periods: string[]) {
  loanSnapshots = rows;
  rebuildLoanIndexes();
  months = periods.sort().map((value) => {
    const [year, month] = value.split("-").map(Number);
    const label = Number.isFinite(year) && Number.isFinite(month)
      ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
      : value;
    return { value, label };
  });
}

export function applySupplementalCkpnData(records: NominativeCkpnRecord[], resolutions: MissingLoanResolution[], forecasts: CkpnForecast[] = []) {
  clearAnalysisCache();
  nominativeCkpnByPeriodAndAccount = new Map();
  missingLoanResolutionByPeriodAndAccount = new Map();
  ckpnForecastByPeriodAndAccount = new Map();
  for (const item of records) {
    const periodRows = nominativeCkpnByPeriodAndAccount.get(item.period) ?? new Map<string, NominativeCkpnRecord>();
    periodRows.set(normalizeAccountKey(item.accountNumber), item);
    nominativeCkpnByPeriodAndAccount.set(item.period, periodRows);
  }
  for (const item of resolutions) {
    const periodRows = missingLoanResolutionByPeriodAndAccount.get(item.period) ?? new Map<string, MissingLoanStatus>();
    periodRows.set(normalizeAccountKey(item.accountNumber), item.status);
    missingLoanResolutionByPeriodAndAccount.set(item.period, periodRows);
  }
  for (const item of forecasts) {
    const periodRows = ckpnForecastByPeriodAndAccount.get(item.period) ?? new Map<string, PrognosaCollectibility>();
    periodRows.set(normalizeAccountKey(item.accountNumber), item.targetCollectibility);
    ckpnForecastByPeriodAndAccount.set(item.period, periodRows);
  }
}

export function setMissingLoanResolution(period: MonthKey, accountNumber: string, status: MissingLoanStatus) {
  clearAnalysisCache();
  const periodRows = missingLoanResolutionByPeriodAndAccount.get(period) ?? new Map<string, MissingLoanStatus>();
  periodRows.set(normalizeAccountKey(accountNumber), status);
  missingLoanResolutionByPeriodAndAccount.set(period, periodRows);
}

export function setCkpnForecast(period: MonthKey, accountNumber: string, targetCollectibility: PrognosaCollectibility) {
  clearAnalysisCache();
  const periodRows = ckpnForecastByPeriodAndAccount.get(period) ?? new Map<string, PrognosaCollectibility>();
  periodRows.set(normalizeAccountKey(accountNumber), targetCollectibility);
  ckpnForecastByPeriodAndAccount.set(period, periodRows);
}

export function getMissingLoanDisplayStatus(period: MonthKey, previous: LoanSnapshot): MissingLoanDisplayStatus {
  const saved = missingLoanResolutionByPeriodAndAccount.get(period)?.get(normalizeAccountKey(previous.accountNumber));
  if (saved) return saved;
  return classifyQuality(previous, getPreviousMonth(period) ?? period) === "Macet" ? "Perlu Konfirmasi" : "Lunas";
}

export function restoreMockLoanData() {
  loanSnapshots = [...mockLoanSnapshots];
  rebuildLoanIndexes();
  applySupplementalCkpnData([], []);
  months = [...mockMonths];
}

export const uploadHistory: UploadHistory[] = [
  {
    fileName: "LW321_Juni_2026.csv",
    status: "Berhasil",
    uploadedAt: "2026-06-30 16:42",
    uploadedBy: "Supervisor Unit",
    rows: 3208,
  },
  {
    fileName: "LW321_Mei_2026.csv",
    status: "Berhasil",
    uploadedAt: "2026-05-31 17:05",
    uploadedBy: "Supervisor Unit",
    rows: 3174,
  },
  {
    fileName: "LW321_April_2026.csv",
    status: "Berhasil",
    uploadedAt: "2026-04-30 16:12",
    uploadedBy: "Supervisor Unit",
    rows: 3151,
  },
];

export function getMonthLabel(month: MonthKey) {
  return months.find((item) => item.value === month)?.label ?? month;
}

export function getPreviousMonth(month: MonthKey, offset = 1): MonthKey | undefined {
  const index = months.findIndex((item) => item.value === month);
  return months[index - offset]?.value;
}

export function getYearEndComparisonMonth(month: MonthKey): MonthKey {
  const selectedYear = Number(month.slice(0, 4));
  const exactYearEnd = `${selectedYear - 1}-12`;
  if (months.some((item) => item.value === exactYearEnd)) return exactYearEnd;
  const priorPeriods = months.map((item) => item.value).filter((value) => value < `${selectedYear}-01`).sort();
  return priorPeriods.at(-1) ?? months[0]?.value ?? month;
}

export function getMonthDate(month: MonthKey) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0);
}

export function getSnapshots(month: MonthKey) {
  return snapshotsByMonth.get(month) ?? [];
}

export function isPumk(item: Pick<LoanSnapshot, "loanType">) {
  return item.loanType?.trim().toUpperCase() === "5G";
}

export function getCreditSnapshots(month: MonthKey) {
  return getCachedAnalysis(`credit:${month}`, () => getSnapshots(month).filter((item) => !isPumk(item)));
}

export function getProductType(description: string, loanType?: string): ProductType {
  if (loanType?.trim().toUpperCase() === "5G") return "PUMK";
  const value = description.toLowerCase();
  if (value.includes("kur mikro")) return "KUR Mikro";
  if (value.includes("kupedes rakyat")) return "Kupedes Rakyat";
  if (value.includes("kupedes")) return "Kupedes";
  return "Lainnya";
}

export function classifyQuality(item: LoanSnapshot, month: MonthKey): QualityBucket {
  const cacheKey = `${month}:${normalizeAccountKey(item.accountNumber)}`;
  const cached = qualityClassificationCache.get(cacheKey);
  if (cached) return cached;
  if (item.rawCollectibility === "KL" || item.rawCollectibility === "Diragukan" || item.rawCollectibility === "Macet" || item.rawCollectibility === "Lancar") {
    qualityClassificationCache.set(cacheKey, item.rawCollectibility);
    return item.rawCollectibility;
  }

  const asOf = getMonthDate(month);
  const nextPayment = new Date(`${item.nextPaymentDate}T00:00:00`);
  if (nextPayment > asOf) {
    qualityClassificationCache.set(cacheKey, "SML1");
    return "SML1";
  }

  const monthDiff =
    (asOf.getFullYear() - nextPayment.getFullYear()) * 12 +
    (asOf.getMonth() - nextPayment.getMonth());

  // Umur tunggakan dihitung inklusif: bulan NPD adalah bulan tunggakan pertama.
  const bucket = monthDiff <= 0 ? "SML1" : monthDiff === 1 ? "SML2" : "SML3";
  qualityClassificationCache.set(cacheKey, bucket);
  return bucket;
}

export function getCkpnBucket(item: LoanSnapshot, month: MonthKey): QualityBucket | "KL/D" {
  const bucket = classifyQuality(item, month);
  if (bucket === "Lancar" && item.flagRestruk === "Y") return "LR";
  if (bucket === "KL" || bucket === "Diragukan") return "KL/D";
  return bucket;
}

export function isSml(bucket: QualityBucket | string) {
  return bucket === "SML1" || bucket === "SML2" || bucket === "SML3";
}

export function isNpl(bucket: QualityBucket | string) {
  return bucket === "KL" || bucket === "Diragukan" || bucket === "Macet";
}

export function isPl(bucket: QualityBucket | string) {
  return bucket === "Lancar" || bucket === "LR" || isSml(bucket);
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("id-ID");
const percentFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

export function getCollectibilityRank(bucket: QualityBucket | "KL/D") {
  const rank: Record<QualityBucket | "KL/D", number> = {
    Lancar: 1,
    LR: 1.5,
    SML1: 2,
    SML2: 3,
    SML3: 4,
    KL: 5,
    Diragukan: 6,
    "KL/D": 6,
    Macet: 7,
  };
  return rank[bucket];
}

export const ckpnLossRates = {
  Kupedes: {
    Lancar: 0.0176,
    LR: 0.0684,
    SML1: 0.1241,
    SML2: 0.2097,
    SML3: 0.3116,
    "KL/D": 0.5618,
    Macet: 1,
  },
  "KUR Mikro": {
    Lancar: 0.0314,
    LR: 0.1096,
    SML1: 0.2129,
    SML2: 0.3282,
    SML3: 0.4264,
    "KL/D": 0.6508,
    Macet: 1,
  },
} as const;

export function getCkpnGroup(productType: ProductType): keyof typeof ckpnLossRates | undefined {
  if (productType === "Kupedes" || productType === "Kupedes Rakyat") return "Kupedes";
  if (productType === "KUR Mikro") return "KUR Mikro";
  return undefined;
}

export function getLossRate(item: LoanSnapshot, month: MonthKey) {
  const productType = getProductType(item.description, item.loanType);
  const group = getCkpnGroup(productType);
  if (!group) return undefined;

  const bucket = getCkpnBucket(item, month);
  return ckpnLossRates[group][bucket as keyof (typeof ckpnLossRates)[typeof group]];
}

export function getCompareSnapshot(month: MonthKey, accountNumber: string) {
  return snapshotsByMonthAndAccount.get(month)?.get(accountNumber);
}

export function getCkpnRows(month: MonthKey) {
  return getCachedAnalysis(`ckpn:${month}`, () => {
    const previousMonth = getPreviousMonth(month);
    if (!previousMonth) return [];

  const activeRows = getCreditSnapshots(month)
    .map((latest) => {
      const previous = getCompareSnapshot(previousMonth, latest.accountNumber);
      if (!previous) return undefined;

      const productType = getProductType(latest.description);
      const group = getCkpnGroup(productType);
      if (!group) return undefined;

      const previousBucket = getCkpnBucket(previous, previousMonth);
      const latestBucket = getCkpnBucket(latest, month);
      if (previousBucket === latestBucket) return undefined;

      const previousRate = getLossRate(previous, previousMonth);
      const latestRate = getLossRate(latest, month);
      if (previousRate === undefined || latestRate === undefined) return undefined;

      const rateDelta = latestRate - previousRate;
      const ckpnImpact = latest.outstanding * rateDelta;
      return {
        ...latest,
        productType,
        previousBucket,
        latestBucket,
        previousRate,
        latestRate,
        rateDelta,
        ckpnImpact,
        movement:
          getCollectibilityRank(latestBucket) > getCollectibilityRank(previousBucket)
            ? "Memburuk"
            : "Membaik",
        missingLatest: false as const,
        resolutionStatus: undefined,
        formedCkpn: undefined,
        ckpnBasisSource: "Loss rate internal" as const,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const latestAccounts = new Set(getCreditSnapshots(month).map((item) => normalizeAccountKey(item.accountNumber)));
  const missingRows = getCreditSnapshots(previousMonth)
    .filter((previous) => !latestAccounts.has(normalizeAccountKey(previous.accountNumber)))
    .map((previous) => {
      const productType = getProductType(previous.description, previous.loanType);
      const group = getCkpnGroup(productType);
      if (!group) return undefined;

      const previousBucket = getCkpnBucket(previous, previousMonth);
      const previousRate = getLossRate(previous, previousMonth);
      if (previousRate === undefined) return undefined;

      const nominative = nominativeCkpnByPeriodAndAccount.get(previousMonth)?.get(normalizeAccountKey(previous.accountNumber));
      const formedCkpn = nominative?.formedCkpn ?? previous.outstanding * previousRate;
      const savedResolution = missingLoanResolutionByPeriodAndAccount.get(month)?.get(normalizeAccountKey(previous.accountNumber));
      const resolutionStatus: MissingLoanStatus | undefined = savedResolution ?? (previousBucket === "Macet" ? undefined : "Lunas");
      const latestBucket: MissingLoanDisplayStatus = resolutionStatus ?? "Perlu Konfirmasi";
      const latestRate = resolutionStatus === "PH" ? 1 : resolutionStatus === "Lunas" ? 0 : previousRate;
      const ckpnImpact = resolutionStatus === "PH"
        ? previous.outstanding - formedCkpn
        : resolutionStatus === "Lunas"
          ? -formedCkpn
          : 0;

      return {
        ...previous,
        month,
        productType,
        previousBucket,
        latestBucket,
        previousRate,
        latestRate,
        rateDelta: latestRate - previousRate,
        ckpnImpact,
        movement: resolutionStatus === "PH" ? "Memburuk" as const : resolutionStatus === "Lunas" ? "Membaik" as const : "Perlu Konfirmasi" as const,
        missingLatest: true as const,
        resolutionStatus,
        formedCkpn,
        ckpnBasisSource: nominative ? "Nominatif Per Rekening" as const : "Estimasi loss rate internal" as const,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return [...activeRows, ...missingRows];
  });
}

export function getPrognosaCkpnRows(month: MonthKey) {
  return getCachedAnalysis(`prognosa:${month}`, () => {
    const previousMonth = getPreviousMonth(month);
    if (!previousMonth) return [];

    return getCreditSnapshots(previousMonth)
    .map((item) => {
      const productType = getProductType(item.description, item.loanType);
      const group = getCkpnGroup(productType);
      if (!group) return undefined;

      const previousBucket = getCkpnBucket(item, previousMonth);
      const previousRate = getLossRate(item, previousMonth);
      if (previousRate === undefined) return undefined;

      const targetCollectibility = ckpnForecastByPeriodAndAccount.get(month)?.get(normalizeAccountKey(item.accountNumber));
      const nominative = nominativeCkpnByPeriodAndAccount.get(previousMonth)?.get(normalizeAccountKey(item.accountNumber));
      const formedCkpn = nominative?.formedCkpn ?? item.outstanding * previousRate;
      const latestRate = targetCollectibility === "PH"
        ? 1
        : targetCollectibility === "Lunas"
          ? 0
          : targetCollectibility
            ? ckpnLossRates[group][targetCollectibility as keyof (typeof ckpnLossRates)[typeof group]]
            : undefined;
      const ckpnImpact = latestRate === undefined ? 0 : item.outstanding * latestRate - formedCkpn;
      const movement = !targetCollectibility
        ? "Belum Diisi" as const
        : targetCollectibility === "PH"
          ? "Memburuk" as const
          : targetCollectibility === "Lunas"
            ? "Membaik" as const
            : getCollectibilityRank(targetCollectibility) > getCollectibilityRank(previousBucket)
              ? "Memburuk" as const
              : getCollectibilityRank(targetCollectibility) < getCollectibilityRank(previousBucket)
                ? "Membaik" as const
                : "Tetap" as const;

      return {
        ...item,
        month,
        productType,
        previousBucket,
        targetCollectibility,
        previousRate,
        latestRate,
        formedCkpn,
        ckpnImpact,
        movement,
        ckpnBasisSource: nominative ? "Nominatif Per Rekening" as const : "Estimasi loss rate internal" as const,
      };
    })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  });
}

export function getNewRows(month: MonthKey, target: "SML" | "NPL") {
  return getCachedAnalysis(`new:${month}:${target}`, () => {
    const sourceMonth = getPreviousMonth(month, 2);
    const targetMonth = getPreviousMonth(month);
    if (!sourceMonth || !targetMonth) return [];

    return getCreditSnapshots(targetMonth)
    .map((targetRow) => {
      const sourceRow = getCompareSnapshot(sourceMonth, targetRow.accountNumber);
      if (!sourceRow) return undefined;
      const sourceBucket = classifyQuality(sourceRow, sourceMonth);
      const targetBucket = classifyQuality(targetRow, targetMonth);
      const matches = target === "SML"
        ? sourceBucket === "Lancar" && targetBucket === "SML1"
        : sourceBucket === "SML3" && targetBucket === "KL";
      if (!matches) return undefined;
      return { ...targetRow, sourceMonth, targetMonth, sourceBucket, targetBucket };
    })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  });
}

export function getPipelineRows(month: MonthKey) {
  return getCachedAnalysis(`pipeline:${month}`, () => {
    const previousMonth = getPreviousMonth(month);
    const sourceMonth = previousMonth ?? month;
    return getCreditSnapshots(sourceMonth)
    .filter((item) => {
      const productType = getProductType(item.description, item.loanType);
      const ratio = item.outstanding / item.plafond;
      return (
        classifyQuality(item, sourceMonth) === "Lancar" &&
        item.flagRestruk === "N" &&
        ratio < 0.5 &&
        (productType === "Kupedes" || productType === "Kupedes Rakyat")
      );
    })
    .map((item) => ({
      ...item,
      sourceMonth,
      productType: getProductType(item.description, item.loanType),
      ratio: item.outstanding / item.plafond,
      remainingPlafond: item.plafond - item.outstanding,
      }));
  });
}

export function getArrearsRows(month: MonthKey) {
  return getCachedAnalysis(`arrears:${month}`, () => getSnapshots(month)
    .map((item) => ({
      ...item,
      principalArrears: item.principalArrears ?? 0,
      interestArrears: item.interestArrears ?? 0,
      totalArrears: (item.principalArrears ?? 0) + (item.interestArrears ?? 0),
    }))
    .filter((item) => item.totalArrears > 0)
    .sort((a, b) => b.totalArrears - a.totalArrears));
}

export function getRealisasiRows(month: MonthKey) {
  return getCachedAnalysis(`realisasi:${month}`, () => {
    const rows = getCreditSnapshots(month).filter((item) => item.realizedDate.startsWith(month));
    const previousMonth = getPreviousMonth(month);
    const previousOsByCif = new Map<string, number>();
    if (previousMonth) {
      for (const item of getCreditSnapshots(previousMonth)) {
        const cif = item.cif?.trim().toUpperCase();
        if (!cif) continue;
        previousOsByCif.set(cif, (previousOsByCif.get(cif) ?? 0) + item.outstanding);
      }
    }
    const appliedPreviousCifs = new Set<string>();
    const map = new Map<string, { mantri: string; total: number; netDisbursement: number; count: number; existingCount: number; newCount: number }>();
    for (const item of rows) {
      const current = map.get(item.mantri) ?? { mantri: item.mantri, total: 0, netDisbursement: 0, count: 0, existingCount: 0, newCount: 0 };
      const cif = item.cif?.trim().toUpperCase() ?? "";
      const hasPreviousCif = Boolean(cif && previousOsByCif.has(cif));
      const previousOs = hasPreviousCif && !appliedPreviousCifs.has(cif) ? previousOsByCif.get(cif) ?? 0 : 0;
      current.total += item.realizedAmount;
      current.netDisbursement += item.plafond - previousOs;
      current.count += 1;
      current.existingCount += hasPreviousCif ? 1 : 0;
      current.newCount += hasPreviousCif ? 0 : 1;
      if (hasPreviousCif) appliedPreviousCifs.add(cif);
      map.set(item.mantri, current);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  });
}

export function getMonthlyCkpnDeltaByMantri(month: MonthKey) {
  return getCachedAnalysis(`monthly-ckpn-delta-mantri:${month}`, () => {
    const totals = new Map<string, { amount: number; accountCount: number }>();
    for (const item of getCkpnRows(month)) {
      if (Math.abs(item.ckpnImpact) < 1) continue;
      const current = totals.get(item.mantri) ?? { amount: 0, accountCount: 0 };
      current.amount += item.ckpnImpact;
      current.accountCount += 1;
      totals.set(item.mantri, current);
    }
    return totals;
  });
}

export function getMantriRecap(month: MonthKey) {
  return getCachedAnalysis(`mantri:${month}`, () => {
    const buckets: QualityBucket[] = [
      "Lancar",
      "SML1",
      "SML2",
      "SML3",
      "KL",
      "Diragukan",
      "Macet",
    ];
    const map = new Map<
      string,
      { mantri: string; totalOs: number } & Record<QualityBucket, { os: number; count: number }>
    >();

    for (const item of getCreditSnapshots(month)) {
      const row =
        map.get(item.mantri) ??
        ({
          mantri: item.mantri,
          totalOs: 0,
          Lancar: { os: 0, count: 0 },
          LR: { os: 0, count: 0 },
          SML1: { os: 0, count: 0 },
          SML2: { os: 0, count: 0 },
          SML3: { os: 0, count: 0 },
          KL: { os: 0, count: 0 },
          Diragukan: { os: 0, count: 0 },
          Macet: { os: 0, count: 0 },
        } as { mantri: string; totalOs: number } & Record<
          QualityBucket,
          { os: number; count: number }
        >);

      const bucket = classifyQuality(item, month);
      row.totalOs += item.outstanding;
      row[bucket].os += item.outstanding;
      row[bucket].count += 1;
      map.set(item.mantri, row);
    }

    return [...map.values()].sort((a, b) => b.totalOs - a.totalOs).map((row) => ({
      ...row,
      buckets,
    }));
  });
}

export function getSummary(month: MonthKey) {
  return getCachedAnalysis(`summary:${month}`, () => {
    const rows = getCreditSnapshots(month);
    const pumkRows = getSnapshots(month).filter(isPumk);
    const smlRows = rows.filter((item) => isSml(classifyQuality(item, month)));
    const nplRows = rows.filter((item) => isNpl(classifyQuality(item, month)));
    const countDebtors = (items: LoanSnapshot[]) => new Set(
      items.map((item) => item.cif?.trim() || item.debtorName.trim().toUpperCase() || item.accountNumber),
    ).size;
    const totalOs = rows.reduce((total, item) => total + item.outstanding, 0);
    const smlOs = smlRows.reduce((total, item) => total + item.outstanding, 0);
    const nplOs = nplRows.reduce((total, item) => total + item.outstanding, 0);
    const ckpnRows = getCkpnRows(month);
    const totalCkpn = ckpnRows.reduce((total, item) => total + item.ckpnImpact, 0);

    return {
      totalOs,
      smlOs,
      nplOs,
      totalDebtorCount: countDebtors(rows),
      smlPercent: totalOs ? (smlOs / totalOs) * 100 : 0,
      nplPercent: totalOs ? (nplOs / totalOs) * 100 : 0,
      smlDebtorCount: countDebtors(smlRows),
      nplDebtorCount: countDebtors(nplRows),
      newSml: getNewRows(month, "SML"),
      newNpl: getNewRows(month, "NPL"),
      totalCkpn,
      pumkCount: pumkRows.length,
      pumkOs: pumkRows.reduce((total, item) => total + item.outstanding, 0),
    };
  });
}

export function getQualityDistribution(month: MonthKey) {
  return getCachedAnalysis(`quality-distribution:${month}`, () => {
    const buckets: QualityBucket[] = [
    "Lancar",
    "SML1",
    "SML2",
    "SML3",
    "KL",
    "Diragukan",
    "Macet",
  ];
    return buckets.map((bucket) => {
      const rows = getCreditSnapshots(month).filter((item) => classifyQuality(item, month) === bucket);
      return {
        name: bucket,
        os: rows.reduce((total, item) => total + item.outstanding, 0),
        count: rows.length,
      };
    });
  });
}
