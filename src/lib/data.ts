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
export type ProductType = "Kupedes" | "Kupedes Rakyat" | "KUR Mikro" | "Lainnya";
export type MenuKey =
  | "dashboard"
  | "mantri"
  | "brimen"
  | "unggah"
  | "users";

export interface LoanSnapshot {
  month: MonthKey;
  cif?: string;
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

export function applyUploadedLoanData(rows: LoanSnapshot[], periods: string[]) {
  loanSnapshots = rows;
  months = periods.sort().map((value) => {
    const [year, month] = value.split("-").map(Number);
    const label = Number.isFinite(year) && Number.isFinite(month)
      ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
      : value;
    return { value, label };
  });
}

export function restoreMockLoanData() {
  loanSnapshots = [...mockLoanSnapshots];
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

export function getMonthDate(month: MonthKey) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0);
}

export function getSnapshots(month: MonthKey) {
  return loanSnapshots.filter((item) => item.month === month);
}

export function getProductType(description: string): ProductType {
  const value = description.toLowerCase();
  if (value.includes("kur mikro")) return "KUR Mikro";
  if (value.includes("kupedes rakyat")) return "Kupedes Rakyat";
  if (value.includes("kupedes")) return "Kupedes";
  return "Lainnya";
}

export function classifyQuality(item: LoanSnapshot, month: MonthKey): QualityBucket {
  if (item.rawCollectibility === "KL") return "KL";
  if (item.rawCollectibility === "Diragukan") return "Diragukan";
  if (item.rawCollectibility === "Macet") return "Macet";
  if (item.rawCollectibility === "Lancar") return "Lancar";

  const asOf = getMonthDate(month);
  const nextPayment = new Date(`${item.nextPaymentDate}T00:00:00`);
  if (nextPayment > asOf) return "SML1";

  const monthDiff =
    (asOf.getFullYear() - nextPayment.getFullYear()) * 12 +
    (asOf.getMonth() - nextPayment.getMonth());

  if (monthDiff <= 1) return "SML1";
  if (monthDiff === 2) return "SML2";
  return "SML3";
}

export function getCkpnBucket(item: LoanSnapshot, month: MonthKey): QualityBucket | "KL/D" {
  const bucket = classifyQuality(item, month);
  if (bucket === "Lancar" && item.flagRestruk === "Y") return "LR";
  if (bucket === "KL" || bucket === "Diragukan") return "KL/D";
  return bucket;
}

export function isSml(bucket: QualityBucket) {
  return bucket === "SML1" || bucket === "SML2" || bucket === "SML3";
}

export function isNpl(bucket: QualityBucket) {
  return bucket === "KL" || bucket === "Diragukan" || bucket === "Macet";
}

export function isPl(bucket: QualityBucket) {
  return bucket === "Lancar" || bucket === "LR" || isSml(bucket);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
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
  const productType = getProductType(item.description);
  const group = getCkpnGroup(productType);
  if (!group) return undefined;

  const bucket = getCkpnBucket(item, month);
  return ckpnLossRates[group][bucket as keyof (typeof ckpnLossRates)[typeof group]];
}

export function getCompareSnapshot(month: MonthKey, accountNumber: string) {
  return getSnapshots(month).find((item) => item.accountNumber === accountNumber);
}

export function getCkpnRows(month: MonthKey) {
  const previousMonth = getPreviousMonth(month);
  if (!previousMonth) return [];

  return getSnapshots(month)
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
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function getNewRows(month: MonthKey, target: "SML" | "NPL") {
  const previousTwoMonth = getPreviousMonth(month, 2);
  if (!previousTwoMonth) return [];

  return getSnapshots(month).filter((latest) => {
    const previous = getCompareSnapshot(previousTwoMonth, latest.accountNumber);
    if (!previous) return false;
    const previousBucket = classifyQuality(previous, previousTwoMonth);
    const latestBucket = classifyQuality(latest, month);
    if (previousBucket !== "Lancar") return false;
    return target === "SML" ? isSml(latestBucket) : isNpl(latestBucket);
  });
}

export function getPipelineRows(month: MonthKey) {
  const previousMonth = getPreviousMonth(month);
  const sourceMonth = previousMonth ?? month;
  return getSnapshots(sourceMonth)
    .filter((item) => {
      const productType = getProductType(item.description);
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
      productType: getProductType(item.description),
      ratio: item.outstanding / item.plafond,
      remainingPlafond: item.plafond - item.outstanding,
    }));
}

export function getRealisasiRows(month: MonthKey) {
  const rows = getSnapshots(month).filter((item) => item.realizedDate.startsWith(month));
  const map = new Map<string, { mantri: string; total: number; count: number }>();
  for (const item of rows) {
    const current = map.get(item.mantri) ?? { mantri: item.mantri, total: 0, count: 0 };
    current.total += item.realizedAmount;
    current.count += 1;
    map.set(item.mantri, current);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function getMantriRecap(month: MonthKey) {
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

  for (const item of getSnapshots(month)) {
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
}

export function getSummary(month: MonthKey) {
  const rows = getSnapshots(month);
  const totalOs = rows.reduce((total, item) => total + item.outstanding, 0);
  const smlOs = rows.reduce((total, item) => {
    return total + (isSml(classifyQuality(item, month)) ? item.outstanding : 0);
  }, 0);
  const nplOs = rows.reduce((total, item) => {
    return total + (isNpl(classifyQuality(item, month)) ? item.outstanding : 0);
  }, 0);
  const ckpnRows = getCkpnRows(month);
  const totalCkpn = ckpnRows.reduce((total, item) => total + item.ckpnImpact, 0);

  return {
    totalOs,
    smlOs,
    nplOs,
    smlPercent: totalOs ? (smlOs / totalOs) * 100 : 0,
    nplPercent: totalOs ? (nplOs / totalOs) * 100 : 0,
    newSml: getNewRows(month, "SML"),
    newNpl: getNewRows(month, "NPL"),
    totalCkpn,
  };
}

export function getQualityDistribution(month: MonthKey) {
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
    const rows = getSnapshots(month).filter((item) => classifyQuality(item, month) === bucket);
    return {
      name: bucket,
      os: rows.reduce((total, item) => total + item.outstanding, 0),
      count: rows.length,
    };
  });
}
