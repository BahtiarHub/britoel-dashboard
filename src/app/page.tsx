"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardList,
  Command,
  Database,
  Download,
  Eye,
  FilePlus2,
  FileText,
  FileSpreadsheet,
  FilterX,
  FolderArchive,
  Gauge,
  GitCompare,
  History,
  Layers3,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LockKeyhole,
  LogOut,
  Maximize2,
  Menu,
  MessageCircle,
  PieChart as PieChartIcon,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Shield,
  Star,
  TrendingUp,
  Upload,
  UserRound,
  UserCog,
  UsersRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line as RechartsLine,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  applyUploadedLoanData,
  applySupplementalCkpnData,
  classifyQuality,
  formatCurrency,
  formatNumber,
  formatPercent,
  getArrearsRows,
  getCkpnRows,
  getCompareSnapshot,
  getCreditSnapshots,
  getMantriRecap,
  getMonthlyCkpnDeltaByMantri,
  getMissingLoanDisplayStatus,
  getMonthLabel,
  getPipelineRows,
  getPreviousMonth,
  getPrognosaCkpnRows,
  getProductType,
  getQualityDistribution,
  getRealisasiRows,
  getSnapshots,
  getSummary,
  getYearEndComparisonMonth,
  isNpl,
  isPl,
  isSml,
  loanSnapshots,
  months,
  restoreMockLoanData,
  setCkpnForecast,
  setMissingLoanResolution,
  type MenuKey,
  type LoanSnapshot,
  type MonthKey,
  type PrognosaCollectibility,
  type QualityBucket,
  uploadHistory,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

const sidebarItems: {
  key: MenuKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "mantri", label: "Dashboard Pinjaman", icon: UsersRound },
  { key: "brimen", label: "Dashboard Operasional", icon: FolderArchive },
  { key: "unggah", label: "Upload Data", icon: Upload },
  { key: "users", label: "Manajemen User", icon: UserCog },
];

const qualityOptions = ["Semua", "Lancar", "SML1", "SML2", "SML3", "KL", "Diragukan", "Macet", "PL", "NPL"];
const currentBrimenUser = {
  name: "User Login Non CS",
  username: "USER_NON_CS",
};

type MantriViewKey =
  | "ringkasan"
  | "nominatif"
  | "kualitas"
  | "rekap"
  | "realisasi"
  | "tunggakan"
  | "ckpn"
  | "di319"
  | "wa";

const mantriTabs: { key: MantriViewKey; label: string; icon: React.ElementType }[] = [
  { key: "ringkasan", label: "Ringkasan Kredit", icon: LayoutDashboard },
  { key: "nominatif", label: "Nominatif Nasabah", icon: ClipboardList },
  { key: "kualitas", label: "Nominatif Kualitas", icon: Layers3 },
  { key: "rekap", label: "Rekap Mantri", icon: BarChart3 },
  { key: "realisasi", label: "Realisasi", icon: TrendingUp },
  { key: "tunggakan", label: "Tunggakan", icon: AlertTriangle },
  { key: "ckpn", label: "Prognosa CKPN", icon: PieChartIcon },
  { key: "di319", label: "Monitoring Simpanan", icon: Banknote },
  { key: "wa", label: "WA Blast", icon: MessageCircle },
];

const mantriTabTones: Record<MantriViewKey, string> = {
  ringkasan: "bg-[#00529c] text-white border-[#00529c]/20 shadow-[0_10px_18px_rgba(0,82,156,0.22)]",
  nominatif: "bg-[#f37021] text-white border-[#f37021]/20 shadow-[0_10px_18px_rgba(243,112,33,0.22)]",
  kualitas: "bg-emerald-600 text-white border-emerald-600/20 shadow-[0_10px_18px_rgba(5,150,105,0.20)]",
  rekap: "bg-sky-600 text-white border-sky-600/20 shadow-[0_10px_18px_rgba(2,132,199,0.20)]",
  realisasi: "bg-teal-600 text-white border-teal-600/20 shadow-[0_10px_18px_rgba(13,148,136,0.20)]",
  tunggakan: "bg-amber-500 text-white border-amber-500/20 shadow-[0_10px_18px_rgba(245,158,11,0.20)]",
  ckpn: "bg-rose-600 text-white border-rose-600/20 shadow-[0_10px_18px_rgba(225,29,72,0.20)]",
  di319: "bg-indigo-600 text-white border-indigo-600/20 shadow-[0_10px_18px_rgba(79,70,229,0.20)]",
  wa: "bg-emerald-600 text-white border-emerald-600/20 shadow-[0_10px_18px_rgba(5,150,105,0.20)]",
};

const operationalTabTones: Record<string, string> = {
  orange: "bg-[#f37021] text-white border-[#f37021]/20 shadow-[0_10px_18px_rgba(243,112,33,0.20)]",
  blue: "bg-[#00529c] text-white border-[#00529c]/20 shadow-[0_10px_18px_rgba(0,82,156,0.20)]",
  navy: "bg-sky-700 text-white border-sky-700/20 shadow-[0_10px_18px_rgba(3,105,161,0.20)]",
  red: "bg-rose-600 text-white border-rose-600/20 shadow-[0_10px_18px_rgba(225,29,72,0.20)]",
  green: "bg-emerald-600 text-white border-emerald-600/20 shadow-[0_10px_18px_rgba(5,150,105,0.20)]",
};

type BrimenCustomer = {
  id: string;
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
  branchCode: string;
  updatedAt: string;
  isLatestLw321?: boolean;
  persistedInBrimen?: boolean;
  dataSource?: "BRIMEN" | "LW321" | "Gabungan";
};

type BrimenSummary = {
  total: number;
  brimenTotal?: number;
  withGuarantee: number;
  withoutGuarantee: number;
  withoutArchive: number;
  borrowed: number;
  latestLw321?: number;
  brimenOnly?: number;
  byStatus: { status: string; count: number }[];
};

type BrimenLoan = {
  id: string;
  customerId: string;
  borrowerName: string;
  borrowerUsername: string;
  loanDate: string;
  returnedDate: string | null;
  status: "Dipinjam" | "Sudah Dikembalikan";
  purpose: string;
  accountNumber?: string;
  customerName?: string;
  plafond?: number;
  mantri?: string;
  brimenBerkas?: string;
  brimenJaminan?: string;
  guarantee?: string;
};

type BorrowedFileRow = {
  id: string;
  customerId: string;
  accountNumber?: string;
  customerName?: string;
  plafond?: number;
  brimenBerkas?: string;
  brimenJaminan?: string;
  guarantee?: string;
  borrowerName: string;
  borrowerUsername: string;
  loan?: BrimenLoan;
};

type CovenanceRecord = {
  id: string;
  period: string;
  accountNumber: string;
  debtorName: string;
  realizedDate: string;
  sphNumber: string;
  creditApplicationNumber: string;
  ktpNumber: string;
  kkNumber: string;
  skuNibNumber: string;
  slikOjk: string;
  updatedAt?: string;
};

type CovenanceFormState = Pick<CovenanceRecord, "sphNumber" | "creditApplicationNumber" | "ktpNumber" | "kkNumber" | "skuNibNumber" | "slikOjk">;

const emptyCovenanceForm: CovenanceFormState = {
  sphNumber: "",
  creditApplicationNumber: "",
  ktpNumber: "",
  kkNumber: "",
  skuNibNumber: "",
  slikOjk: "",
};

type BrimenFormState = {
  id?: string;
  accountNumber: string;
  name: string;
  plafond: string;
  realizationDate: string;
  address: string;
  mantri: string;
  brimenBerkas: string;
  brimenJaminan: string;
  guarantee: string;
  status: BrimenCustomer["status"];
  branchCode: string;
  sphNumber: string;
  creditApplicationNumber: string;
  ktpNumber: string;
  kkNumber: string;
  skuNibNumber: string;
  slikOjk: string;
};

type BrimenFormMode = "none" | "add-choice" | "add" | "detail" | "process" | "edit" | "archive";

type BrimenOperationType = "Suplesi" | "Pelunasan" | "Pergantian Jaminan" | "Edit Data" | "Peminjaman Berkas";

type BrimenProcessFormState = {
  operationType: BrimenOperationType;
  processDate: string;
  newPlafond: string;
  newBrimenBerkas: string;
  newBrimenJaminan: string;
  newGuarantee: string;
  useExistingGuarantee: "Y" | "N";
  guaranteeAction: "none" | "ambil" | "ganti" | "tambah";
  collateralPickupName: string;
  collateralPickupDate: string;
  collateralPickupPhotoName: string;
  pickupRelationship: string;
  pickupSupportFileName: string;
  note: string;
};

const emptyBrimenForm: BrimenFormState = {
  accountNumber: "",
  name: "",
  plafond: "",
  realizationDate: "",
  address: "",
  mantri: "",
  brimenBerkas: "",
  brimenJaminan: "",
  guarantee: "",
  status: "Disimpan",
  branchCode: "8014",
  sphNumber: "",
  creditApplicationNumber: "",
  ktpNumber: "",
  kkNumber: "",
  skuNibNumber: "",
  slikOjk: "",
};

const emptyBrimenProcessForm: BrimenProcessFormState = {
  operationType: "Suplesi",
  processDate: "",
  newPlafond: "",
  newBrimenBerkas: "",
  newBrimenJaminan: "",
  newGuarantee: "",
  useExistingGuarantee: "Y",
  guaranteeAction: "none",
  collateralPickupName: "",
  collateralPickupDate: "",
  collateralPickupPhotoName: "",
  pickupRelationship: "Pemilik Jaminan",
  pickupSupportFileName: "",
  note: "",
};

const emptySuplesiCustomer: BrimenCustomer = {
  id: "",
  accountNumber: "",
  name: "Pilih debitur suplesi",
  plafond: 0,
  realizationDate: "",
  address: "",
  mantri: "",
  brimenBerkas: "",
  brimenJaminan: "",
  guarantee: "",
  status: "Disimpan",
  branchCode: "8014",
  updatedAt: "",
};

function customerToForm(row: BrimenCustomer): BrimenFormState {
  return {
    id: row.persistedInBrimen === false ? undefined : row.id,
    accountNumber: formatAccountNumber(row.accountNumber),
    name: row.name,
    plafond: String(row.plafond),
    realizationDate: row.realizationDate,
    address: row.address,
    mantri: row.mantri,
    brimenBerkas: row.brimenBerkas,
    brimenJaminan: row.brimenJaminan,
    guarantee: row.guarantee,
    status: row.status,
    branchCode: row.branchCode,
    sphNumber: "",
    creditApplicationNumber: "",
    ktpNumber: "",
    kkNumber: "",
    skuNibNumber: "",
    slikOjk: "",
  };
}

function normalizeAccount(value: string) {
  return value.replace(/\D/g, "");
}

function formatAccountNumber(value?: string) {
  return normalizeAccount(value ?? "").slice(0, 15);
}

function formatRupiahInput(value: string | number) {
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^\d]/g, ""));
  if (!numeric) return "";
  return `Rp ${numeric.toLocaleString("id-ID")}`;
}

function formatBrimenStorageInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9.\s]+/g, "")
    .trimStart()
    .replace(/\s+/g, ".")
    .replace(/\.{2,}/g, ".");
}

function formatTodayLabel() {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function QualityBadge({ bucket }: { bucket: QualityBucket | "KL/D" | string }) {
  const variant =
    bucket === "Lancar" || bucket === "Lunas"
      ? "success"
      : bucket === "SML1" || bucket === "SML2" || bucket === "SML3" || bucket === "LR"
        ? "warning"
        : bucket === "KL" || bucket === "Diragukan" || bucket === "KL/D" || bucket === "Macet" || bucket === "PH"
          ? "danger"
          : bucket === "Perlu Konfirmasi" ? "warning" : "outline";

  return <Badge variant={variant}>{bucket}</Badge>;
}

function BrimenStatusBadge({
  status,
  row,
}: {
  status?: BrimenCustomer["status"];
  row?: Pick<BrimenCustomer, "brimenBerkas" | "brimenJaminan" | "guarantee">;
}) {
  if (!status) return <Badge variant="outline">Belum ada BRIMEN</Badge>;
  if (status === "Dipinjam") return <Badge variant="warning">Dipinjam</Badge>;
  if (status === "Disimpan" && row && !row.brimenBerkas?.trim()) return <Badge variant="danger">Belum Disimpan</Badge>;
  if (status === "Disimpan") {
    return <Badge variant="success">{getBrimenStatusLabel(status, row)}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function getBrimenStatusLabel(status?: BrimenCustomer["status"], row?: Pick<BrimenCustomer, "brimenBerkas" | "brimenJaminan" | "guarantee">) {
  if (!status) return "Belum ada BRIMEN";
  if (status === "Dipinjam") return "Dipinjam";
  if (status === "Disimpan" && row && !row.brimenBerkas?.trim()) return "Belum Disimpan";
  if (status === "Disimpan") return row && hasBrimenGuarantee(row) ? "Disimpan dengan Jaminan" : "Disimpan Tanpa Jaminan";
  return status;
}

function hasBrimenGuarantee(row: Pick<BrimenCustomer, "brimenJaminan" | "guarantee">) {
  return [row.brimenJaminan, row.guarantee].some((value) => Boolean(value && value.trim() && value.trim() !== "-"));
}

function needsBrimenCompletion(row: BrimenCustomer) {
  return !row.address?.trim() || !row.brimenBerkas?.trim() || (hasBrimenGuarantee(row) && !row.brimenJaminan?.trim());
}

function getBrimenRowTone(row: BrimenCustomer) {
  if (row.status === "Dipinjam") return "border-l-4 border-l-[#f37021] bg-[#fff7ed]/65";
  if (row.status === "Lunas") return "border-l-4 border-l-sky-500 bg-sky-50/60";
  if (!row.brimenBerkas?.trim()) return "border-l-4 border-l-rose-500 bg-rose-50/70";
  return "border-l-4 border-l-[#00529c] bg-[#f7fbff]/55";
}

function BrimenDocumentBadges({ row }: { row: BrimenCustomer }) {
  const hasGuarantee = hasBrimenGuarantee(row);
  const incomplete = needsBrimenCompletion(row);

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <Badge variant={incomplete ? "warning" : "success"}>{incomplete ? "Belum Lengkap" : "Lengkap"}</Badge>
      <Badge variant={row.brimenBerkas?.trim() ? "secondary" : "danger"}>
        {row.brimenBerkas?.trim() ? "Sudah Arsip" : "Belum Arsip"}
      </Badge>
      <Badge variant={hasGuarantee ? "outline" : "secondary"}>{hasGuarantee ? "Ada Jaminan" : "Tanpa Jaminan"}</Badge>
    </div>
  );
}

function shortText(value: string, fallback = "-") {
  return value?.trim() ? value : fallback;
}

function safeDateLabel(value: string) {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateLabel(value);
}

function exportBrimenCsv(rows: BrimenCustomer[]) {
  const headers = [
    "No Rekening",
    "Nama Nasabah",
    "Plafond",
    "Tanggal Realisasi",
    "Officer / Mantri",
    "Alamat Nasabah",
    "Detail Jaminan",
    "No Brimen Berkas",
    "No Brimen Jaminan",
    "Status",
    "Branch Code",
    "Update Terakhir",
  ];
  const escape = (value: string | number) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      [
        row.accountNumber,
        row.name,
        row.plafond,
        row.realizationDate,
        row.mantri,
        row.address,
        row.guarantee,
        row.brimenBerkas,
        row.brimenJaminan,
        getBrimenStatusLabel(row.status, row),
        row.branchCode,
        row.updatedAt,
      ].map(escape).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "data-brimen-dashboard.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportRowsCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escape = (value: string | number | undefined | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportRowsXls(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeHtml = (value: string | number | undefined | null) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const html = `
    <html><head><meta charset="utf-8" /></head><body><table border="1">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function NewBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-[#f37021] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
      Baru
    </span>
  );
}

type ColumnOption = { key: string; label: string };

function usePersistentColumns(storageKey: string, columns: ColumnOption[]) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((column) => column.key));

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      const valid = parsed.filter((key) => columns.some((column) => column.key === key));
      if (valid.length) setVisibleColumns(valid);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [columns, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
  }, [storageKey, visibleColumns]);

  function toggleColumn(key: string) {
    setVisibleColumns((current) => {
      if (current.includes(key)) {
        return current.length === 1 ? current : current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  }

  return { visibleColumns, toggleColumn };
}

function useTablePagination<T>(rows: T[], resetKey: string, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [resetKey, pageSize]);

  return { page: safePage, pageSize, pagedRows, setPage, setPageSize };
}

function TableTools({
  columns,
  visibleColumns,
  onToggleColumn,
  onExportCsv,
  onExportXls,
}: {
  columns: ColumnOption[];
  visibleColumns: string[];
  onToggleColumn: (key: string) => void;
  onExportCsv: () => void;
  onExportXls: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <details className="relative">
        <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-[#d7e3ef] bg-white px-3 text-sm font-semibold text-[#00529c] hover:bg-[#f7fbff]">
          <Settings2 className="h-4 w-4" />
          Atur Kolom
        </summary>
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-lg border border-[#d7e3ef] bg-white p-2 shadow-xl">
          <p className="px-2 py-1 text-xs font-black uppercase text-muted-foreground">Kolom Ditampilkan</p>
          {columns.map((column) => (
            <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[#f5f9fd]">
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.key)}
                onChange={() => onToggleColumn(column.key)}
                className="h-4 w-4 accent-[#00529c]"
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
      </details>
      <Button type="button" variant="outline" size="sm" onClick={onExportCsv}>
        <Download className="mr-2 h-4 w-4" />CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onExportXls}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
      </Button>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="page-heading flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="page-heading-icon grid h-11 w-11 shrink-0 place-items-center rounded-md text-white">
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-[#f37021]">BRI Tool Workspace</p>
          <h1 className="mt-0.5 text-xl font-black tracking-normal text-[#004077] sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground sm:leading-6">{description}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "warning" | "danger" | "success";
  icon: React.ElementType;
}) {
  const toneClass = {
    default: "bg-[#00529c]/10 text-[#00529c]",
    warning: "bg-[#f37021]/10 text-[#b54b00]",
    danger: "bg-rose-50 text-rose-700",
    success: "bg-emerald-50 text-emerald-700",
  }[tone];
  const stripClass = {
    default: "bg-[#00529c]",
    warning: "bg-[#f37021]",
    danger: "bg-rose-600",
    success: "bg-emerald-600",
  }[tone];

  return (
    <Card className="metric-card bri-card group min-h-[126px] overflow-hidden border-[#d7e3ef] transition hover:-translate-y-0.5 hover:border-[#00529c]/35 sm:min-h-[138px]">
      <div className={cn("h-1 w-full", stripClass)} />
      <CardContent className="flex min-h-[122px] items-stretch p-3.5 sm:h-[134px] sm:p-4">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
            <p className="metric-value mt-2 break-words text-lg font-black leading-tight text-[#0f2942] sm:text-xl">{value}</p>
            {helper ? <p className="mt-auto pt-2 text-xs font-medium text-muted-foreground">{helper}</p> : null}
          </div>
          <div className={cn("metric-card-icon grid h-10 w-10 shrink-0 place-items-center rounded-md transition group-hover:scale-105", toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableShell({
  children,
  minWidth = "wide-table",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="table-scroll bri-card relative isolate z-0 max-h-[68vh] overflow-auto rounded-lg border border-[#bfd2e2] bg-card">
      <div className="mobile-table-hint sticky left-0 top-0 z-20 border-b border-[#d7e3ef] bg-[#f8fbfe] px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground sm:hidden">
        Geser tabel untuk melihat semua kolom
      </div>
      <table className={cn("w-full border-collapse text-sm", minWidth)}>{children}</table>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon = ClipboardList,
}: {
  title: string;
  description: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="bri-card rounded-lg border border-dashed border-[#d7e3ef] bg-white px-4 py-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#00529c]/10 text-[#00529c]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-black text-[#00529c]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky top-0 z-10 whitespace-nowrap border-b border-[#c9dbea] bg-[#eaf3fb] px-3 py-3.5 text-left text-[11px] font-black uppercase text-[#004077] shadow-[inset_0_-1px_0_#c9dbea]">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap border-b border-[#e3edf6] px-3 py-3.5 align-middle text-[13px]", className)}>{children}</td>;
}

type GlobalSearchResult = {
  id: string;
  kind: "Pinjaman" | "BRIMEN";
  accountNumber: string;
  name: string;
  meta: string;
};

type UserRole = "SuperAdmin" | "Admin" | "Kaunit / SPV" | "CS" | "Mantri" | "User";
type ControlPanelKey = "none" | "notifications" | "commands" | "audit" | "presentation";

type PresentationUploads = {
  almafact: null | { fileName: string; format: string; updatedAt: string; url: string };
  branchPl: null | { fileName: string; format: string; updatedAt: string; headers: string[]; rows: (string | number)[][]; totalRows: number };
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "danger" | "success";
  actionLabel: string;
  action: () => void;
};

type AuditEntry = {
  id: string;
  time: string;
  actor: string;
  action: string;
  detail: string;
  category: "Kredit" | "BRIMEN" | "Upload";
  branchCode?: string;
};

type CommandItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
};

type DashboardSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    username?: string | null;
    displayUsername?: string | null;
    branchCode?: string | null;
    active?: boolean | null;
  };
};

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <AuthLoading />;
  if (!session) return <LoginView />;
  if (session.user.active === false) return <AccountInactive />;

  return <AccessGate session={session as DashboardSession} />;
}

function AccessGate({ session }: { session: DashboardSession }) {
  const [access, setAccess] = useState<"checking" | "allowed" | "blocked">("checking");

  useEffect(() => {
    fetch("/api/access", { cache: "no-store" })
      .then((response) => setAccess(response.ok ? "allowed" : "blocked"))
      .catch(() => setAccess("blocked"));
  }, []);

  if (access === "checking") return <AuthLoading />;
  if (access === "blocked") return <AccountInactive />;
  if (session.user.role === "SuperAdmin") return <SuperAdminApp session={session} />;
  return <DashboardApp session={session} />;
}

function SuperAdminApp({ session }: { session: DashboardSession }) {
  return (
    <main className="min-h-screen bg-[#f3f7fb] text-slate-800">
      <div className="h-1.5 bg-gradient-to-r from-[#00529c] via-[#0077c8] to-[#f37021]" />
      <div className="flex min-h-[calc(100vh-6px)]">
        <aside className="hidden w-72 shrink-0 border-r border-[#cbddeb] bg-white lg:flex lg:flex-col">
          <div className="sidebar-brand-panel p-5 text-white">
            <div className="britoel-mark" aria-label="BRI Tool"><span className="britoel-mark__bri">BRI</span><span className="britoel-mark__toel">Tool</span><span className="britoel-mark__spark" /></div>
            <p className="mt-4 text-xs font-black uppercase text-[#ffb077]">Portal Pemilik Aplikasi</p>
            <h1 className="mt-1 text-lg font-black">SuperAdmin</h1>
          </div>
          <nav className="p-3">
            <div className="flex items-center gap-3 rounded-md bg-[#00529c] px-3 py-3 text-sm font-bold text-white shadow-sm">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-white/15"><Shield className="h-4 w-4" /></span>
              Pengawasan Uker
            </div>
          </nav>
          <div className="mt-auto border-t border-[#d7e3ef] p-4 text-xs leading-5 text-slate-500">
            <p className="font-black text-[#004077]">Akses baca saja</p>
            <p>Pengolahan data dilakukan oleh Admin pada masing-masing unit kerja.</p>
          </div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#cbddeb] bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6">
            <div className="min-w-0"><p className="text-xs font-black uppercase text-[#f37021]">Pengawasan Global</p><h2 className="truncate text-lg font-black text-[#004077]">Aktivitas Admin dan Unit Kerja</h2></div>
            <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-black text-slate-800">{session.user.name}</p><p className="text-xs text-slate-500">{session.user.displayUsername ?? session.user.username}</p></div><Button type="button" variant="outline" size="icon" aria-label="Keluar" onClick={async () => { await authClient.signOut(); window.location.reload(); }}><LogOut className="h-4 w-4" /></Button></div>
          </header>
          <div className="mx-auto max-w-[1680px] p-3 sm:p-5 lg:p-6"><UserManagementView session={session} /></div>
        </section>
      </div>
    </main>
  );
}

function OverviewMetricCard({
  label,
  value,
  detail,
  indicator,
  tone = "blue",
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  indicator?: string;
  tone?: "blue" | "orange" | "red" | "green";
  icon: React.ElementType;
}) {
  const tones = {
    blue: { accent: "bg-[#00529c]", icon: "bg-[#e7f2fb] text-[#00529c]", indicator: "bg-[#e7f2fb] text-[#00529c]" },
    orange: { accent: "bg-[#f37021]", icon: "bg-[#fff0e6] text-[#c4520c]", indicator: "bg-[#fff0e6] text-[#a94408]" },
    red: { accent: "bg-rose-600", icon: "bg-rose-50 text-rose-700", indicator: "bg-rose-50 text-rose-700" },
    green: { accent: "bg-emerald-600", icon: "bg-emerald-50 text-emerald-700", indicator: "bg-emerald-50 text-emerald-700" },
  }[tone];

  return (
    <div className="overview-metric-card bri-card relative min-h-[146px] overflow-hidden rounded-lg border border-[#d7e3ef] bg-white p-4">
      <span className={cn("absolute inset-y-0 left-0 w-1", tones.accent)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase text-slate-500">{label}</p>
          <p className="metric-value mt-2 break-words text-xl font-black leading-tight text-[#0b355a] sm:text-2xl">{value}</p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", tones.icon)}><Icon className="h-5 w-5" /></span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#e4edf5] pt-3">
        <p className="text-xs font-semibold leading-5 text-slate-500">{detail}</p>
        {indicator ? <span className={cn("shrink-0 rounded-md px-2 py-1 text-[10px] font-black", tones.indicator)}>{indicator}</span> : null}
      </div>
    </div>
  );
}

function AccountInactive() {
  return <main className="grid min-h-screen place-items-center bg-[#eef5fb] px-5"><div className="max-w-md rounded-lg border border-rose-200 bg-white p-7 text-center shadow-lg"><span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-rose-50 text-rose-600"><Shield className="h-6 w-6" /></span><h1 className="mt-4 text-xl font-black text-[#004077]">Akun Dinonaktifkan</h1><p className="mt-2 text-sm text-slate-500">Hubungi Admin unit kerja atau SuperAdmin untuk mengaktifkan kembali akun Anda.</p><Button className="mt-5 bg-[#00529c]" onClick={async () => { await authClient.signOut(); window.location.reload(); }}>Kembali ke Login</Button></div></main>;
}

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f8fc] px-5">
      <div className="flex items-center gap-3 text-sm font-bold text-[#00529c]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#b8d8f2] border-t-[#f37021]" />
        Menyiapkan BRI Tool...
      </div>
    </main>
  );
}

function LoginView() {
  const [username, setUsername] = useState("8014-SUPERADMIN");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await authClient.signIn.username({ username, password });
    if (result.error) {
      setSubmitting(false);
      setError("Username atau kata sandi tidak sesuai.");
      return;
    }
    const accessResponse = await fetch("/api/access", { cache: "no-store" });
    if (!accessResponse.ok) {
      const payload = await accessResponse.json().catch(() => null);
      await authClient.signOut();
      setSubmitting(false);
      setError(payload?.message ?? "Akun tidak dapat digunakan. Hubungi pengelola unit kerja.");
      return;
    }
    setSubmitting(false);
    window.location.reload();
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#eef5fb] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#004785] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-x-0 top-0 h-2 bg-[#f37021]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="britoel-mark scale-110" aria-label="BRI Tool"><span className="britoel-mark__bri">BRI</span><span className="britoel-mark__toel">Tool</span><span className="britoel-mark__spark" /></div>
          <span className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-black text-[#ffb37d]">8014</span>
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#ff9a52]">Unit Greenvilage</p>
          <h1 className="text-5xl font-black leading-[1.08]">Satu ruang kerja untuk pinjaman dan operasional BRIMEN.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">Pantau kualitas kredit, tindak lanjut nasabah, arsip berkas, serta aktivitas unit dengan akses yang terlindungi.</p>
        </div>
        <p className="relative z-10 text-xs font-semibold text-blue-200">BRI Tool Internal Workspace</p>
        <div className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full border-[70px] border-white/5" />
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="britoel-mark" aria-label="BRI Tool"><span className="britoel-mark__bri">BRI</span><span className="britoel-mark__toel">Tool</span><span className="britoel-mark__spark" /></div>
            <p className="mt-3 text-sm font-bold text-[#00529c]">Unit Greenvilage</p>
          </div>
          <div className="rounded-lg border border-[#cbddeb] bg-white p-6 shadow-[0_24px_60px_rgba(0,65,120,0.12)] sm:p-8">
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-md bg-[#eaf4fd] text-[#00529c]"><LockKeyhole className="h-6 w-6" /></span>
            <h2 className="text-2xl font-black text-[#003d70]">Masuk ke BRI Tool</h2>
            <p className="mt-1 text-sm text-slate-500">Gunakan username sesuai kode branch unit kerja Anda.</p>
            <form className="mt-7 space-y-4" onSubmit={handleLogin}>
              <label className="block text-sm font-bold text-slate-700">Username
                <Input value={username} onChange={(event) => setUsername(event.target.value.toUpperCase())} className="mt-1.5 h-11 uppercase" autoComplete="username" placeholder="8014-KAUNIT" required />
              </label>
              <label className="block text-sm font-bold text-slate-700">Kata sandi
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11" autoComplete="current-password" required />
              </label>
              {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
              <Button type="submit" className="h-11 w-full bg-[#00529c] font-black hover:bg-[#004077]" disabled={submitting}>
                {submitting ? "Memeriksa akun..." : "Masuk"}
              </Button>
            </form>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">Akses tercatat untuk keamanan data unit kerja.</p>
        </div>
      </section>
    </main>
  );
}

function DashboardApp({ session }: { session: DashboardSession }) {
  const activeBranchCode = session.user.branchCode ?? "8014";
  const activeBranchName = activeBranchCode === "8014" ? "Unit Greenvilage" : `Uker ${activeBranchCode}`;
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [mantriView, setMantriView] = useState<MantriViewKey>("ringkasan");
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>("2026-06");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("Mantri");
  const [activeControlPanel, setActiveControlPanel] = useState<ControlPanelKey>("none");
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalMantri, setGlobalMantri] = useState("Semua");
  const [globalQuality, setGlobalQuality] = useState("Semua");
  const [globalProduct, setGlobalProduct] = useState("Semua");
  const [favoriteMenus, setFavoriteMenus] = useState<MenuKey[]>(["mantri", "brimen"]);
  const [recentMenus, setRecentMenus] = useState<MenuKey[]>(["dashboard"]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [arrearsMantri, setArrearsMantri] = useState("Semua");
  const [ckpnMantri, setCkpnMantri] = useState("Semua");
  const [ckpnProduct, setCkpnProduct] = useState("Semua");
  const [ckpnMovement, setCkpnMovement] = useState("Semua");
  const [ckpnQuality, setCkpnQuality] = useState("Semua");
  const [brimenRows, setBrimenRows] = useState<BrimenCustomer[]>([]);
  const [brimenLoans, setBrimenLoans] = useState<BrimenLoan[]>([]);
  const [backendAuditEntries, setBackendAuditEntries] = useState<AuditEntry[]>([]);
  const [brimenSummary, setBrimenSummary] = useState<BrimenSummary | undefined>();
  const [brimenStatus, setBrimenStatus] = useState("Memuat data BRIMEN...");
  const [brimenSearch, setBrimenSearch] = useState("");
  const [brimenFilter, setBrimenFilter] = useState("Arsip Aktif");
  const [brimenFormMode, setBrimenFormMode] = useState<BrimenFormMode>("none");
  const [brimenForm, setBrimenForm] = useState<BrimenFormState>(emptyBrimenForm);
  const [brimenLoanCustomer, setBrimenLoanCustomer] = useState<BrimenCustomer | undefined>();
  const [brimenLoanForm, setBrimenLoanForm] = useState({
    borrowerName: "",
    borrowerUsername: "",
    purpose: "",
    loanDate: "",
  });
  const [brimenProcessForm, setBrimenProcessForm] = useState<BrimenProcessFormState>(emptyBrimenProcessForm);
  const [brimenActionMessage, setBrimenActionMessage] = useState("");
  const [loanDataVersion, setLoanDataVersion] = useState(0);
  const [loanDataSource, setLoanDataSource] = useState<"loading" | "upload" | "mock">("loading");
  const [di319Rows, setDi319Rows] = useState<UploadedDi319Row[]>([]);
  const [latestUploadAt, setLatestUploadAt] = useState<string>();

  async function loadDashboardData() {
    try {
      const response = await fetch("/api/dashboard-data", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Data dashboard gagal dimuat.");
      applySupplementalCkpnData(
        Array.isArray(payload.nominativeCkpn) ? payload.nominativeCkpn : [],
        Array.isArray(payload.missingLoanResolutions) ? payload.missingLoanResolutions : [],
        Array.isArray(payload.ckpnForecasts) ? payload.ckpnForecasts : [],
      );
      setDi319Rows(Array.isArray(payload.di319) ? payload.di319 : []);
      const latestUpload = Array.isArray(payload.uploads) ? payload.uploads[0] : undefined;
      setLatestUploadAt(latestUpload?.createdAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(latestUpload.createdAt)) : undefined);
      if (payload.source === "upload" && Array.isArray(payload.data) && payload.data.length) {
        applyUploadedLoanData(payload.data, payload.periods ?? []);
        setLoanDataSource("upload");
        if (payload.latestPeriod) setSelectedMonth(payload.latestPeriod);
      } else {
        restoreMockLoanData();
        setLoanDataSource("mock");
        setSelectedMonth(months.at(-1)?.value ?? "2026-06");
      }
      setGlobalMantri("Semua");
      setGlobalQuality("Semua");
      setGlobalProduct("Semua");
      setLoanDataVersion((current) => current + 1);
    } catch {
      restoreMockLoanData();
      setDi319Rows([]);
      setLatestUploadAt(undefined);
      setLoanDataSource("mock");
      setLoanDataVersion((current) => current + 1);
    }
  }

  async function loadBrimen() {
    setBrimenStatus("Memuat data BRIMEN...");
    try {
      const response = await fetch("/api/brimen", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setBrimenStatus(payload.message ?? "Data BRIMEN belum bisa dibaca.");
        return;
      }

      setBrimenRows(payload.data ?? []);
      setBrimenSummary(payload.summary);
      setBrimenStatus(`Terhubung ke ${payload.data?.length ?? 0} data operasional`);

      const loanResponse = await fetch("/api/brimen/loans?history=1", { cache: "no-store" });
      const loanPayload = await loanResponse.json();
      if (loanResponse.ok && loanPayload.ok) {
        setBrimenLoans(loanPayload.data ?? []);
      }
    } catch {
      setBrimenStatus("Data BRIMEN belum bisa dimuat.");
    }
  }

  useEffect(() => {
    loadBrimen();
    loadDashboardData();
    fetch("/api/audit", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) return;
        setBackendAuditEntries((payload.data ?? []).map((item: { id: string; actor?: string; action: string; entity: string; detail?: string; createdAt: string; branchCode?: string }) => ({
          id: item.id,
          time: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt)),
          actor: item.actor || "Sistem BRI Tool",
          action: item.action.replaceAll("_", " "),
          detail: item.detail || item.entity,
          category: item.entity.includes("upload") ? "Upload" : item.entity.includes("whatsapp") ? "Kredit" : "BRIMEN",
          branchCode: item.branchCode,
        })));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const refresh = () => {
      loadDashboardData();
      loadBrimen();
    };
    window.addEventListener("britoel-data-uploaded", refresh);
    return () => window.removeEventListener("britoel-data-uploaded", refresh);
  }, []);

  useEffect(() => {
    const role = session.user.role as UserRole | undefined;
    setSelectedRole(role && ["SuperAdmin", "Admin", "Kaunit / SPV", "CS", "Mantri", "User"].includes(role) ? role : "User");
  }, [session.user.role]);

  useEffect(() => {
    const handleCommandShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActiveControlPanel("commands");
      }
    };
    window.addEventListener("keydown", handleCommandShortcut);
    return () => window.removeEventListener("keydown", handleCommandShortcut);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    try {
      const storedFavorites = window.localStorage.getItem("britoel-favorite-menus");
      const storedRecent = window.localStorage.getItem("britoel-recent-menus");
      if (storedFavorites) setFavoriteMenus(JSON.parse(storedFavorites));
      if (storedRecent) setRecentMenus(JSON.parse(storedRecent));
    } catch {
      window.localStorage.removeItem("britoel-favorite-menus");
      window.localStorage.removeItem("britoel-recent-menus");
    }
  }, []);

  const snapshots = useMemo(() => getSnapshots(selectedMonth), [selectedMonth, loanDataVersion]);
  const latestLoanPeriod = useMemo(() => months.at(-1)?.value ?? selectedMonth, [loanDataVersion, selectedMonth]);
  const latestLoanRows = useMemo(() => getSnapshots(latestLoanPeriod), [latestLoanPeriod, loanDataVersion]);
  const summary = useMemo(() => getSummary(selectedMonth), [selectedMonth, loanDataVersion]);
  const mantriNames = useMemo(
    () => [...new Set(loanSnapshots.map((item) => item.mantri))].sort(),
    [loanDataVersion],
  );
  const brimenMap = useMemo(() => {
    return new Map(brimenRows.map((row) => [normalizeAccount(row.accountNumber), row]));
  }, [brimenRows]);
  const filteredNominatif = useMemo(() => {
    const lower = deferredSearch.toLowerCase();
    return snapshots.filter(
      (item) =>
        (item.accountNumber.toLowerCase().includes(lower) ||
          item.debtorName.toLowerCase().includes(lower) ||
          item.mantri.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          getProductType(item.description, item.loanType).toLowerCase().includes(lower)) &&
        (globalMantri === "Semua" || item.mantri === globalMantri) &&
        (globalProduct === "Semua" || getProductType(item.description, item.loanType) === globalProduct) &&
        (globalQuality === "Semua" ||
          (globalQuality === "PL" && isPl(classifyQuality(item, selectedMonth))) ||
          (globalQuality === "NPL" && isNpl(classifyQuality(item, selectedMonth))) ||
          classifyQuality(item, selectedMonth) === globalQuality),
    );
  }, [deferredSearch, globalMantri, globalProduct, globalQuality, selectedMonth, snapshots]);

  const globalResults = useMemo<GlobalSearchResult[]>(() => {
    const query = globalSearch.trim().toLowerCase();
    if (query.length < 2) return [];
    const loanResults = snapshots
      .filter((item) => item.accountNumber.toLowerCase().includes(query) || item.debtorName.toLowerCase().includes(query))
      .slice(0, 5)
      .map((item) => ({
        id: `loan-${item.accountNumber}`,
        kind: "Pinjaman" as const,
        accountNumber: item.accountNumber,
        name: item.debtorName,
        meta: `${item.mantri} | ${getProductType(item.description, item.loanType)}`,
      }));
    const brimenResults = brimenRows
      .filter((item) => item.accountNumber.toLowerCase().includes(query) || item.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map((item) => ({
        id: `brimen-${item.id}`,
        kind: "BRIMEN" as const,
        accountNumber: item.accountNumber,
        name: item.name,
        meta: `${getBrimenStatusLabel(item.status, item)} | ${shortText(item.brimenBerkas)}`,
      }));
    return [...loanResults, ...brimenResults].slice(0, 8);
  }, [brimenRows, globalSearch, snapshots]);

  function openMenu(menu: MenuKey) {
    startTransition(() => setActiveMenu(menu));
    setMobileMenuOpen(false);
    setRecentMenus((current) => {
      const next = [menu, ...current.filter((item) => item !== menu)].slice(0, 3);
      window.localStorage.setItem("britoel-recent-menus", JSON.stringify(next));
      return next;
    });
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }
    setMobileMenuOpen((current) => !current);
  }

  function toggleFavorite(menu: MenuKey) {
    setFavoriteMenus((current) => {
      const next = current.includes(menu) ? current.filter((item) => item !== menu) : [...current, menu];
      window.localStorage.setItem("britoel-favorite-menus", JSON.stringify(next));
      return next;
    });
  }

  function openGlobalResult(result: GlobalSearchResult) {
    if (result.kind === "Pinjaman") {
      setSearch(result.accountNumber);
      setMantriView("nominatif");
      openMenu("mantri");
    } else {
      setBrimenSearch(result.accountNumber);
      setBrimenFilter("Semua");
      openMenu("brimen");
    }
    setGlobalSearch("");
  }

  function openMantriTab(tab: MantriViewKey) {
    startTransition(() => setMantriView(tab));
    openMenu("mantri");
    setActiveControlPanel("none");
  }

  const borrowedBrimenRows = brimenRows.filter((item) => item.status === "Dipinjam");
  const unarchivedBrimenRows = brimenRows.filter((item) => item.status === "Disimpan" && !item.brimenBerkas?.trim());
  const notifications: NotificationItem[] = [
    {
      id: "new-sml",
      title: `${summary.newSml.length} rekening New SML`,
      description: "Kolektibilitas turun dari Lancar dan perlu ditindaklanjuti.",
      tone: summary.newSml.length ? "warning" : "success",
      actionLabel: "Lihat kualitas",
      action: () => openMantriTab("kualitas"),
    },
    {
      id: "borrowed-files",
      title: `${borrowedBrimenRows.length} berkas sedang dipinjam`,
      description: borrowedBrimenRows.length ? "Periksa tenggat pengembalian pada Covenance Day." : "Tidak ada berkas yang sedang dipinjam.",
      tone: borrowedBrimenRows.length ? "danger" : "success",
      actionLabel: "Buka Covenance",
      action: () => {
        setBrimenFilter("Covenance Day");
        openMenu("brimen");
        setActiveControlPanel("none");
      },
    },
    {
      id: "unarchived",
      title: `${unarchivedBrimenRows.length} berkas belum diarsipkan`,
      description: "No BRIMEN berkas masih kosong dan perlu dilengkapi.",
      tone: unarchivedBrimenRows.length ? "warning" : "success",
      actionLabel: "Lihat data",
      action: () => {
        setBrimenFilter("Belum Arsip");
        openMenu("brimen");
        setActiveControlPanel("none");
      },
    },
    {
      id: "upload-status",
      title: "Periksa pembaruan sumber data",
      description: `Upload terakhir ${latestUploadAt ?? uploadHistory[0]?.uploadedAt ?? "belum tersedia"}.`,
      tone: "info",
      actionLabel: "Buka upload",
      action: () => {
        openMenu("unggah");
        setActiveControlPanel("none");
      },
    },
  ];

  const auditEntries: AuditEntry[] = [
    ...backendAuditEntries,
    ...brimenRows.slice(0, 5).map((item) => ({
      id: `brimen-${item.id}`,
      time: item.updatedAt || "-",
      actor: item.mantri || "User BRIMEN",
      action: `Status ${getBrimenStatusLabel(item.status, item)}`,
      detail: `${item.name} | ${item.accountNumber}`,
      category: "BRIMEN" as const,
    })),
    ...uploadHistory.slice(0, 3).map((item) => ({
      id: `upload-${item.fileName}`,
      time: item.uploadedAt,
      actor: item.uploadedBy,
      action: `Upload ${item.status}`,
      detail: `${item.fileName} | ${formatNumber(item.rows)} baris`,
      category: "Upload" as const,
    })),
    {
      id: "credit-review",
      time: `${getMonthLabel(selectedMonth)} | Snapshot terbaru`,
      actor: "Sistem Kredit",
      action: "Perhitungan kualitas diperbarui",
      detail: `${summary.newSml.length} New SML dan ${summary.newNpl.length} New NPL`,
      category: "Kredit" as const,
    },
  ];

  const commandItems: CommandItem[] = [
    { id: "dashboard", label: "Buka Dashboard Utama", description: "Ringkasan pinjaman dan operasional", icon: LayoutDashboard, action: () => { openMenu("dashboard"); setActiveControlPanel("none"); } },
    { id: "nominatif", label: "Cari Nominatif Nasabah", description: "Buka tabel rekening pinjaman", icon: ClipboardList, action: () => openMantriTab("nominatif") },
    { id: "quality", label: "Lihat Perubahan Kualitas", description: "Upgrade, downgrade, dan tetap", icon: Layers3, action: () => openMantriTab("kualitas") },
    { id: "ckpn", label: "Buka Prognosa CKPN", description: "Simulasi dampak perubahan kolektibilitas", icon: PieChartIcon, action: () => openMantriTab("ckpn") },
    { id: "tunggakan", label: "Buka Data Tunggakan", description: "Tunggakan pokok dan bunga dari LW321 terbaru", icon: AlertTriangle, action: () => openMantriTab("tunggakan") },
    { id: "di319", label: "Buka Monitoring Simpanan", description: "Blokiran simpanan dan setoran akhir periode", icon: Banknote, action: () => openMantriTab("di319") },
    { id: "wa-campaign", label: "Buka WA Blast", description: "Penawaran suplesi dan pengingat jatuh tempo", icon: MessageCircle, action: () => openMantriTab("wa") },
    { id: "covenance", label: "Buka Covenance Day", description: "Agenda dan tenggat operasional", icon: CalendarDays, action: () => { setBrimenFilter("Covenance Day"); openMenu("brimen"); setActiveControlPanel("none"); } },
    { id: "add-debtor", label: "Tambah Debitur", description: "Debitur baru atau debitur suplesi", icon: FilePlus2, action: () => { setBrimenFormMode("add-choice"); openMenu("brimen"); setActiveControlPanel("none"); } },
    { id: "upload", label: "Upload Sumber Data", description: "LW321, BRIMEN, nominatif, dan DI319", icon: Upload, action: () => { openMenu("unggah"); setActiveControlPanel("none"); } },
  ];

  const currentTitle = sidebarItems.find((item) => item.key === activeMenu);

  const mantriContent = {
    ringkasan: (
      <RingkasanView
        month={selectedMonth}
        summary={summary}
        onOpenMenu={setMantriView}
      />
    ),
    nominatif: (
      <NominatifView
        rows={filteredNominatif}
        month={selectedMonth}
        search={search}
        setSearch={setSearch}
        brimenMap={brimenMap}
      />
    ),
    kualitas: (
      <KualitasView
        month={selectedMonth}
        qualityFilter={globalQuality}
        setQualityFilter={setGlobalQuality}
        mantriFilter={globalMantri}
        productFilter={globalProduct}
      />
    ),
    rekap: (
      <RekapView
        month={selectedMonth}
        mantriFilter={globalMantri}
        onSelectMantri={(mantri) => {
          setGlobalMantri(mantri);
          setMantriView("nominatif");
        }}
      />
    ),
    realisasi: <RealisasiView month={selectedMonth} mantriFilter={globalMantri} />,
    tunggakan: <TunggakanView month={selectedMonth} mantri={arrearsMantri} setMantri={setArrearsMantri} mantriNames={mantriNames} branchCode={activeBranchCode} branchName={activeBranchName} />,
    ckpn: (
      <CkpnView
        month={selectedMonth}
        mantri={globalMantri === "Semua" ? ckpnMantri : globalMantri}
        setMantri={(value) => {
          setCkpnMantri(value);
          setGlobalMantri(value);
        }}
        product={globalProduct === "Semua" ? ckpnProduct : globalProduct}
        setProduct={(value) => {
          setCkpnProduct(value);
          setGlobalProduct(value);
        }}
        movement={ckpnMovement}
        setMovement={setCkpnMovement}
        quality={globalQuality === "Semua" ? ckpnQuality : globalQuality}
        setQuality={(value) => {
          setCkpnQuality(value);
          setGlobalQuality(value);
        }}
        mantriNames={mantriNames}
      />
    ),
    di319: <Di319View month={selectedMonth} uploadedRows={di319Rows} />,
    wa: <WhatsappCampaignView month={selectedMonth} />,
  }[mantriView];

  const content = {
    dashboard: (
      <DashboardOverviewView
        month={selectedMonth}
        summary={summary}
        loanDataSource={loanDataSource}
        latestUploadAt={latestUploadAt}
        brimenSummary={brimenSummary}
        brimenRows={brimenRows}
        creditAccounts={snapshots.map((item) => item.accountNumber)}
        onOpenMenu={openMenu}
        selectedRole={selectedRole}
        onOpenMantri={(mantri) => {
          setGlobalMantri(mantri);
          setMantriView("nominatif");
          openMenu("mantri");
        }}
      />
    ),
    mantri: (
      <DashboardMantriView
        activeTab={mantriView}
        setActiveTab={(value) => startTransition(() => setMantriView(value))}
        month={selectedMonth}
      >
        {mantriContent}
      </DashboardMantriView>
    ),
    brimen: (
      <BrimenView
        rows={brimenRows}
        summary={brimenSummary}
        status={brimenStatus}
        search={brimenSearch}
        setSearch={setBrimenSearch}
        filter={brimenFilter}
        setFilter={setBrimenFilter}
        creditAccounts={snapshots.map((item) => item.accountNumber)}
        latestLoanPeriod={latestLoanPeriod}
        latestLoanRows={latestLoanRows}
        loans={brimenLoans}
        formMode={brimenFormMode}
        setFormMode={setBrimenFormMode}
        form={brimenForm}
        setForm={setBrimenForm}
        loanCustomer={brimenLoanCustomer}
        setLoanCustomer={setBrimenLoanCustomer}
        loanForm={brimenLoanForm}
        setLoanForm={setBrimenLoanForm}
        processForm={brimenProcessForm}
        setProcessForm={setBrimenProcessForm}
        actionMessage={brimenActionMessage}
        setActionMessage={setBrimenActionMessage}
        reload={loadBrimen}
      />
    ),
    unggah: <UnggahView />,
    users: <UserManagementView session={session} />,
  }[activeMenu];
  const roleToplineClass = {
    SuperAdmin: "bg-[#f37021]",
    Mantri: "bg-[#00529c]",
    CS: "bg-[#f37021]",
    "Kaunit / SPV": "bg-emerald-600",
    Admin: "bg-indigo-600",
    User: "bg-slate-600",
  }[selectedRole];
  const visibleSidebarItems = sidebarItems.filter((item) => {
    if (item.key === "users") return session.user.role === "Admin";
    if (item.key === "unggah") return session.user.role === "Admin";
    return true;
  });

  return (
    <main className="app-shell min-h-screen bg-background text-[15px] antialiased">
      <div className={cn("h-1.5 w-full", roleToplineClass)} />
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "bri-sidebar fixed inset-y-0 left-0 z-[70] h-dvh w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden border-r border-[#d7e3ef] bg-card shadow-2xl transition-transform duration-200 xl:sticky xl:top-0 xl:h-screen xl:w-72 xl:self-start xl:shadow-none",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            desktopSidebarOpen ? "xl:block xl:translate-x-0" : "xl:hidden",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="sidebar-brand-panel p-4 text-white sm:p-5">
              <div className="flex items-center gap-3">
                <div className="britoel-mark" aria-label="BRI Tool">
                  <span className="britoel-mark__bri">BRI</span>
                  <span className="britoel-mark__toel">Tool</span>
                  <span className="britoel-mark__spark" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-[#ffb077]">Unit Kerja {activeBranchCode}</p>
                  <h2 className="truncate font-black text-white">{activeBranchName}</h2>
                </div>
                <Button type="button" variant="outline" size="icon" aria-label="Tutup sidebar" className="ml-auto h-9 w-9 shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white xl:hidden" onClick={() => setMobileMenuOpen(false)}>
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase text-slate-400">Navigasi Utama</p>
              {visibleSidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="relative">
                    <button
                      onClick={() => openMenu(item.key)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 overflow-hidden rounded-md border border-transparent px-2.5 py-2.5 pr-11 text-left text-sm font-semibold transition-colors before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-transparent",
                        activeMenu === item.key
                          ? "border-[#00529c] bg-[#00529c] text-white shadow-[0_8px_18px_rgba(0,82,156,0.18)] before:bg-[#f37021]"
                          : "text-muted-foreground hover:border-[#d7e3ef] hover:bg-[#eef6fc] hover:text-[#00529c]",
                      )}
                    >
                      <span className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors",
                        activeMenu === item.key ? "bg-white/12 text-white" : "bg-[#eaf3fb] text-[#00529c] group-hover:bg-white",
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${favoriteMenus.includes(item.key) ? "Hapus dari" : "Tambahkan ke"} favorit ${item.label}`}
                      onClick={() => toggleFavorite(item.key)}
                      className={cn(
                        "absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md transition",
                        activeMenu === item.key
                          ? "text-[#ffd2b5] hover:text-white"
                          : favoriteMenus.includes(item.key)
                            ? "text-[#f37021]"
                            : "text-slate-400 hover:text-[#00529c]",
                      )}
                    >
                      <Star className={cn("h-3.5 w-3.5", favoriteMenus.includes(item.key) && "fill-current")} />
                    </button>
                  </div>
                );
              })}
            </nav>
            <div className="sidebar-status border-t border-[#d7e3ef] p-4 text-xs text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                Sistem terhubung
              </div>
              Data kredit dan database BRIMEN unit kerja siap digunakan.
            </div>
          </div>
        </aside>

        {mobileMenuOpen ? (
          <button
            className="fixed inset-0 z-[60] bg-[#001b33]/45 backdrop-blur-[1px] xl:hidden"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="app-header sticky top-0 z-40 border-b border-[#cbddeb] bg-white/95 px-3 py-2 shadow-[0_5px_20px_rgba(0,55,105,0.07)] backdrop-blur-md md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={desktopSidebarOpen ? "Buka atau tutup sidebar" : "Buka sidebar"}
                  className="h-9 w-9 shrink-0"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 md:hidden">
                    <span className="rounded-md bg-[#00529c] px-2 py-1 text-xs font-black text-white">{activeBranchCode}</span>
                    <span className="truncate text-sm font-black text-[#00529c]">{activeBranchName}</span>
                  </div>
                  <p className="hidden text-[10px] font-black uppercase text-[#f37021] md:block">Ruang Kerja Aktif</p>
                  <p className="truncate text-xs font-semibold text-muted-foreground md:text-base md:font-black md:text-[#004077]">{currentTitle?.label}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="hidden items-center gap-1.5 xl:flex">
                  <div className="flex h-9 items-center gap-2 rounded-md border border-[#cbddeb] bg-white px-3">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eaf4fd] text-[#00529c]"><UserRound className="h-3.5 w-3.5" /></span>
                    <span className="max-w-32 truncate text-xs font-black text-[#004077]">{session.user.displayUsername ?? session.user.username ?? session.user.name}</span>
                    <Badge className="bg-[#00529c]/10 text-[10px] text-[#00529c] hover:bg-[#00529c]/10">{selectedRole}</Badge>
                  </div>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 bg-white" aria-label="Buka perintah cepat" onClick={() => setActiveControlPanel("commands")}>
                    <Command className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="relative h-9 w-9 bg-white" aria-label="Buka notifikasi" onClick={() => setActiveControlPanel("notifications")}>
                    <Bell className="h-4 w-4" />
                    {notifications.some((item) => item.tone === "danger" || item.tone === "warning") ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#f37021]" /> : null}
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 bg-white" aria-label="Buka audit trail" onClick={() => setActiveControlPanel("audit")}>
                    <History className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 bg-white" aria-label="Buka mode presentasi" onClick={() => setActiveControlPanel("presentation")}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Keluar" title="Keluar" onClick={async () => { await authClient.signOut(); window.location.reload(); }}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 xl:hidden">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 bg-white" aria-label="Buka perintah cepat" onClick={() => setActiveControlPanel("commands")}>
                    <Command className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="relative h-8 w-8 bg-white" aria-label="Buka notifikasi" onClick={() => setActiveControlPanel("notifications")}>
                    <Bell className="h-3.5 w-3.5" />
                    {notifications.some((item) => item.tone === "danger" || item.tone === "warning") ? <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#f37021]" /> : null}
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="hidden h-8 w-8 bg-white sm:inline-flex" aria-label="Buka audit trail" onClick={() => setActiveControlPanel("audit")}>
                    <History className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="hidden h-8 w-8 bg-white md:inline-flex" aria-label="Buka mode presentasi" onClick={() => setActiveControlPanel("presentation")}>
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Keluar" onClick={async () => { await authClient.signOut(); window.location.reload(); }}>
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="hidden w-fit items-center gap-1.5 whitespace-nowrap rounded-md border border-[#d7e3ef] bg-[#f8fbfe] px-2 py-1.5 text-xs font-semibold text-[#004077] md:flex md:gap-2 md:px-2.5 md:text-sm">
                  <CalendarDays className="h-4 w-4 text-[#f37021]" />
                  <span>{formatTodayLabel()}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md border border-[#d7e3ef] bg-[#f8fbfe] px-2 py-1.5 text-xs font-semibold text-[#004077] md:hidden">
              <CalendarDays className="h-3.5 w-3.5 text-[#f37021]" />
              <span>{formatTodayLabel()}</span>
            </div>
            {false ? <>
            <div className="hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00529c]" />
                <Input
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                  placeholder="Cari no rekening atau nama nasabah..."
                  className="h-10 bg-white pl-9 pr-10"
                />
                {globalSearch ? (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#00529c]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                {globalSearch.trim().length >= 2 ? (
                  <div className="absolute inset-x-0 top-11 z-50 overflow-hidden rounded-lg border border-[#d7e3ef] bg-white shadow-2xl">
                    {globalResults.length ? (
                      globalResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => openGlobalResult(result)}
                          className="flex w-full items-center gap-3 border-b border-[#edf3f8] px-3 py-3 text-left last:border-b-0 hover:bg-[#f5f9fd]"
                        >
                          <span className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-md text-white",
                            result.kind === "Pinjaman" ? "bg-[#00529c]" : "bg-[#f37021]",
                          )}>
                            {result.kind === "Pinjaman" ? <Banknote className="h-4 w-4" /> : <FolderArchive className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-[#004077]">{result.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{result.accountNumber} | {result.meta}</span>
                          </span>
                          <Badge variant="outline">{result.kind}</Badge>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-5 text-center text-sm text-muted-foreground">Data tidak ditemukan.</div>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="hidden gap-2 overflow-x-auto pb-1 sm:flex xl:pb-0">
                <Select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value as MonthKey)} className="h-10 min-w-[145px] bg-white">
                  {months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
                <Select value={globalMantri} onChange={(event) => setGlobalMantri(event.target.value)} className="h-10 min-w-[150px] bg-white">
                  <option value="Semua">Semua Mantri</option>
                  {mantriNames.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={globalQuality} onChange={(event) => setGlobalQuality(event.target.value)} className="h-10 min-w-[145px] bg-white">
                  {qualityOptions.map((item) => <option key={item} value={item}>{item === "Semua" ? "Semua Kualitas" : item}</option>)}
                </Select>
                <Select value={globalProduct} onChange={(event) => setGlobalProduct(event.target.value)} className="h-10 min-w-[150px] bg-white">
                  {['Semua', 'PUMK', 'Kupedes', 'Kupedes Rakyat', 'KUR Mikro'].map((item) => <option key={item} value={item}>{item === "Semua" ? "Semua Produk" : item}</option>)}
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-white"
                  aria-label="Reset filter global"
                  onClick={() => {
                    setGlobalMantri("Semua");
                    setGlobalQuality("Semua");
                    setGlobalProduct("Semua");
                  }}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="hidden">
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 justify-between bg-white text-[#00529c]"
                onClick={() => setMobileFiltersOpen((current) => !current)}
              >
                <span className="inline-flex items-center gap-2"><Settings2 className="h-4 w-4" />Filter Global</span>
                <span className="rounded-full bg-[#00529c]/10 px-2 py-0.5 text-xs">
                  {Number(globalMantri !== "Semua") + Number(globalQuality !== "Semua") + Number(globalProduct !== "Semua")}
                </span>
              </Button>
              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />Data Siap
              </span>
            </div>
            {mobileFiltersOpen ? (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-2 sm:hidden">
                <Select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value as MonthKey)} className="h-10 bg-white">
                  {months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
                <Select value={globalMantri} onChange={(event) => setGlobalMantri(event.target.value)} className="h-10 bg-white">
                  <option value="Semua">Semua Mantri</option>
                  {mantriNames.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={globalQuality} onChange={(event) => setGlobalQuality(event.target.value)} className="h-10 bg-white">
                  {qualityOptions.map((item) => <option key={item} value={item}>{item === "Semua" ? "Semua Kualitas" : item}</option>)}
                </Select>
                <Select value={globalProduct} onChange={(event) => setGlobalProduct(event.target.value)} className="h-10 bg-white">
                  {['Semua', 'PUMK', 'Kupedes', 'Kupedes Rakyat', 'KUR Mikro'].map((item) => <option key={item} value={item}>{item === "Semua" ? "Semua Produk" : item}</option>)}
                </Select>
                <div className="col-span-2 flex h-10 items-center justify-between rounded-md border border-[#cbddeb] bg-white px-3 text-sm font-semibold text-[#00529c]">
                  <span className="truncate">{session.user.name}</span><span>{selectedRole}</span>
                </div>
                <Button type="button" variant="outline" className="h-10 bg-white text-[#00529c]" onClick={() => setActiveControlPanel("audit")}>
                  <History className="mr-2 h-4 w-4" />Audit Trail
                </Button>
                <Button type="button" variant="outline" className="h-10 bg-white text-[#00529c]" onClick={() => setActiveControlPanel("presentation")}>
                  <Maximize2 className="mr-2 h-4 w-4" />Presentasi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-2 h-10 bg-white"
                  onClick={() => {
                    setGlobalMantri("Semua");
                    setGlobalQuality("Semua");
                    setGlobalProduct("Semua");
                  }}
                >
                  <FilterX className="mr-2 h-4 w-4" />Reset Filter
                </Button>
                <Button type="button" variant="outline" className="col-span-2 h-10 border-rose-200 bg-white text-rose-600" onClick={async () => { await authClient.signOut(); window.location.reload(); }}>
                  <LogOut className="mr-2 h-4 w-4" />Keluar dari BRI Tool
                </Button>
              </div>
            ) : null}
            <div className="hidden">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Kredit {getMonthLabel(selectedMonth)}
              </span>
              <span className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold",
                brimenRows.length ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
              )}>
                <Database className="h-3.5 w-3.5" /> BRIMEN {brimenRows.length ? `${brimenRows.length} data` : "memuat"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 font-semibold text-sky-700">
                <Upload className="h-3.5 w-3.5" /> Upload terakhir {latestUploadAt ?? uploadHistory[0]?.uploadedAt ?? "-"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#f7c9aa] bg-[#fff5ee] px-2.5 py-1.5 font-semibold text-[#b54b00]">
                <CalendarDays className="h-3.5 w-3.5" /> Periode aktif {getMonthLabel(selectedMonth)}
              </span>
            </div>
            </> : null}
          </header>

          <div className="app-content mx-auto w-full max-w-[1920px] min-w-0 space-y-6 p-3 sm:p-4 md:p-6 xl:p-7 2xl:p-8">
            {content}
            <footer className="surface-panel overflow-hidden px-4 py-3 text-xs text-muted-foreground">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-black text-[#00529c]">BRI Tool</span>
                  <span className="mx-2 text-[#f37021]">|</span>
                  <span>8014 - Unit Greenvilage</span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Data unit kerja aktif</span>
              </div>
            </footer>
          </div>
        </section>
      </div>
      {activeControlPanel === "commands" ? (
        <CommandPalette items={commandItems.filter((item) => item.id !== "upload" || session.user.role === "Admin")} onClose={() => setActiveControlPanel("none")} />
      ) : null}
      {activeControlPanel === "notifications" ? (
        <NotificationCenter items={notifications} onClose={() => setActiveControlPanel("none")} />
      ) : null}
      {activeControlPanel === "audit" ? (
        <AuditTrailPanel entries={auditEntries} onClose={() => setActiveControlPanel("none")} />
      ) : null}
      {activeControlPanel === "presentation" ? (
        <PresentationMode
          month={selectedMonth}
          summary={summary}
          brimenRows={brimenRows}
          role={selectedRole}
          onClose={() => setActiveControlPanel("none")}
        />
      ) : null}
    </main>
  );
}

function OverlayShell({ title, description, icon: Icon, onClose, children }: { title: string; description: string; icon: React.ElementType; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#001b33]/55 p-2.5 sm:p-5 sm:pt-10 lg:p-6 lg:pt-12" onClick={onClose}>
      <section className="overlay-panel max-h-[calc(100dvh-1.25rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#b9cfdf] bg-white shadow-[0_28px_80px_rgba(0,31,58,0.3)] sm:max-h-[calc(100dvh-5rem)]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-30 flex items-start justify-between gap-3 border-b border-[#d7e3ef] bg-[#f8fbfe]/95 px-3.5 py-3.5 backdrop-blur sm:px-5 sm:py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#00529c] text-white"><Icon className="h-5 w-5" /></span>
            <div>
              <h2 className="font-black text-[#00529c]">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={`Tutup ${title}`}><X className="h-5 w-5" /></Button>
        </div>
        {children}
      </section>
    </div>
  );
}

function CommandPalette({ items, onClose }: { items: CommandItem[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const filtered = items.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <OverlayShell title="Perintah Cepat" description="Cari menu atau tindakan tanpa berpindah-pindah halaman." icon={Command} onClose={onClose}>
      <div className="p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#00529c]" />
          <Input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ketik perintah, misalnya CKPN atau tambah debitur" className="h-11 pl-9" />
        </div>
        <div className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={item.action} className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-3 text-left hover:border-[#d7e3ef] hover:bg-[#f5f9fd]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#00529c]/10 text-[#00529c]"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block font-bold text-[#004077]">{item.label}</span><span className="block text-xs text-muted-foreground">{item.description}</span></span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
          {!filtered.length ? <EmptyState title="Perintah tidak ditemukan" description="Coba gunakan kata kunci menu atau jenis proses yang lain." icon={Command} /> : null}
        </div>
      </div>
    </OverlayShell>
  );
}

function NotificationCenter({ items, onClose }: { items: NotificationItem[]; onClose: () => void }) {
  const toneClass = { info: "border-sky-200 bg-sky-50", warning: "border-amber-200 bg-amber-50", danger: "border-rose-200 bg-rose-50", success: "border-emerald-200 bg-emerald-50" };
  return (
    <OverlayShell title="Pusat Notifikasi" description="Informasi yang perlu diperiksa berdasarkan data terbaru." icon={Bell} onClose={onClose}>
      <div className="space-y-3 p-4 sm:p-5">
        {items.map((item) => (
          <div key={item.id} className={cn("rounded-lg border p-4", toneClass[item.tone])}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-black text-[#004077]">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
              <Button type="button" variant="outline" size="sm" className="shrink-0 bg-white" onClick={item.action}>{item.actionLabel}<ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </OverlayShell>
  );
}

function AuditTrailPanel({ entries, onClose }: { entries: AuditEntry[]; onClose: () => void }) {
  return (
    <OverlayShell title="Audit Trail Terpadu" description="Riwayat perubahan data kredit, BRIMEN, dan upload." icon={History} onClose={onClose}>
      <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-5">
        <div className="relative ml-3 border-l-2 border-[#d7e3ef] pl-6">
          {entries.map((entry) => (
            <div key={entry.id} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#f37021] ring-2 ring-[#f37021]/20" />
              <div className="rounded-lg border border-[#d7e3ef] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant="outline">{entry.category}</Badge>{entry.branchCode ? <Badge className="bg-[#00529c]/10 text-[#00529c] hover:bg-[#00529c]/10">Uker {entry.branchCode}</Badge> : null}</div><span className="text-xs text-muted-foreground">{entry.time}</span></div>
                <p className="mt-2 font-bold text-[#004077]">{entry.action}</p><p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p><p className="mt-2 text-xs font-semibold text-[#00529c]">Oleh {entry.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OverlayShell>
  );
}

function PresentationMode({ month, summary, brimenRows, role, onClose }: { month: MonthKey; summary: ReturnType<typeof getSummary>; brimenRows: BrimenCustomer[]; role: UserRole; onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const [presentationUploads, setPresentationUploads] = useState<PresentationUploads>();
  const [uploadPresentationStatus, setUploadPresentationStatus] = useState("Memuat file presentasi...");
  const [almafactZoom, setAlmafactZoom] = useState(100);
  const slideCount = 8;
  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slideCount), 8000);
    return () => window.clearInterval(timer);
  }, [slideCount]);
  useEffect(() => {
    fetch("/api/uploads/presentation", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok || !payload.ok) throw new Error(payload.message ?? "File presentasi gagal dimuat.");
        setPresentationUploads({ almafact: payload.almafact ?? null, branchPl: payload.branchPl ?? null });
        setUploadPresentationStatus("");
      })
      .catch((error) => setUploadPresentationStatus(error instanceof Error ? error.message : "File presentasi gagal dimuat."));
  }, []);
  const qualityRows = getQualityDistribution(month);
  const maxQualityOs = Math.max(...qualityRows.map((item) => item.os), 1);
  const mantriRows = getMantriRecap(month).map((item) => {
    const sml = item.SML1.os + item.SML2.os + item.SML3.os;
    const npl = item.KL.os + item.Diragukan.os + item.Macet.os;
    return { ...item, sml, npl, smlPercent: item.totalOs ? (sml / item.totalOs) * 100 : 0, nplPercent: item.totalOs ? (npl / item.totalOs) * 100 : 0 };
  });
  const realisasiRows = getRealisasiRows(month);
  const realisasiTotal = realisasiRows.reduce((total, item) => total + item.total, 0);
  const realisasiCount = realisasiRows.reduce((total, item) => total + item.count, 0);
  const maxRealisasi = Math.max(...realisasiRows.map((item) => item.total), 1);
  const pipelineRows = getPipelineRows(month);
  const pipelinePotential = pipelineRows.reduce((total, item) => total + item.remainingPlafond, 0);
  const ckpnRows = getCkpnRows(month);
  const ckpnAddition = ckpnRows.filter((item) => item.ckpnImpact > 0).reduce((total, item) => total + item.ckpnImpact, 0);
  const ckpnRecovery = ckpnRows.filter((item) => item.ckpnImpact < 0).reduce((total, item) => total + Math.abs(item.ckpnImpact), 0);
  const borrowed = brimenRows.filter((item) => item.status === "Dipinjam").length;
  const unarchived = brimenRows.filter((item) => !item.brimenBerkas?.trim()).length;
  const archived = brimenRows.length - unarchived;
  const slides = [
    { title: "Posisi Portofolio Kredit", subtitle: `Ikhtisar posisi ${getMonthLabel(month)}` },
    { title: "Komposisi Kualitas Kredit", subtitle: "Sebaran outstanding menurut kolektibilitas" },
    { title: "Peta Risiko Mantri", subtitle: "Perbandingan OS, SML, dan NPL setiap pengelola" },
    { title: "Pergerakan Kualitas & CKPN", subtitle: "Dampak perubahan kolektibilitas terhadap biaya risiko" },
    { title: "Realisasi & Potensi Suplesi", subtitle: "Kinerja bulan berjalan dan ruang pertumbuhan" },
    { title: "Kondisi Operasional BRIMEN", subtitle: "Kesiapan arsip, peminjaman, dan pekerjaan prioritas" },
    { title: "Almafact Unit Kerja", subtitle: "Dokumen Almafact aktif dari Upload Data" },
    { title: "Branch PL", subtitle: "Ringkasan data posisi dan pencapaian branch" },
  ];
  const active = slides[slide];
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#f3f8fc] text-[#0f2942]">
      <div className="h-2 shrink-0 bg-[linear-gradient(90deg,#00529c_0%,#00529c_76%,#f37021_76%,#f37021_100%)]" />
      <div className="flex items-center justify-between border-b border-[#d7e3ef] bg-white px-4 py-3 shadow-sm sm:px-8">
        <div className="flex items-center gap-3">
          <div className="britoel-mark scale-90" aria-label="BRI Tool"><span className="britoel-mark__bri">BRI</span><span className="britoel-mark__toel">Tool</span><span className="britoel-mark__spark" /></div>
          <div><p className="text-xs font-black uppercase text-[#f37021]">8014 - Unit Greenvilage</p><p className="text-sm font-bold text-[#00529c]">Briefing Kinerja | {getMonthLabel(month)}</p></div>
        </div>
        <div className="flex items-center gap-2"><span className="hidden rounded-md bg-[#eaf3fb] px-3 py-2 text-xs font-bold text-[#00529c] sm:inline-flex">Tampilan {role}</span><Button type="button" variant="outline" size="icon" aria-label="Tutup mode presentasi" className="border-[#bfd3e5] bg-white text-[#00529c] hover:bg-[#eaf3fb]" onClick={onClose}><X className="h-5 w-5" /></Button></div>
      </div>
      <div className="flex flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9">
        <div className="mx-auto flex w-full max-w-7xl flex-col">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#f37021]">Analisa {String(slide + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}</p><h1 className="mt-1 text-2xl font-black text-[#00529c] sm:text-4xl">{active.title}</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">{active.subtitle}</p></div><span className="w-fit rounded-md border border-[#d7e3ef] bg-white px-3 py-2 text-xs font-bold text-[#004077]">Data per {getMonthLabel(month)}</span></div>

          {slide === 0 ? <div className="mt-6 grid flex-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex min-h-[250px] flex-col justify-between rounded-lg bg-[#00529c] p-6 text-white shadow-[0_18px_40px_rgba(0,82,156,0.22)]"><div><p className="text-sm font-bold uppercase text-white/70">Total Outstanding</p><p className="mt-3 break-words text-4xl font-black sm:text-5xl">{formatCurrency(summary.totalOs)}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-md bg-white/10 p-3"><p className="text-xs text-white/65">PL</p><p className="mt-1 text-xl font-black">{formatPercent(100 - summary.nplPercent)}</p></div><div className="rounded-md bg-white/10 p-3"><p className="text-xs text-white/65">Rekening Bergerak</p><p className="mt-1 text-xl font-black">{ckpnRows.length}</p></div></div></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div className="rounded-lg border border-[#f7c9aa] bg-[#fff7ed] p-5"><p className="text-xs font-black uppercase text-[#b54b00]">SML</p><p className="mt-2 text-2xl font-black text-[#f37021]">{formatCurrency(summary.smlOs)}</p><p className="mt-1 font-bold text-[#b54b00]">{formatPercent(summary.smlPercent)} dari OS</p></div><div className="rounded-lg border border-rose-200 bg-rose-50 p-5"><p className="text-xs font-black uppercase text-rose-700">NPL</p><p className="mt-2 text-2xl font-black text-rose-700">{formatCurrency(summary.nplOs)}</p><p className="mt-1 font-bold text-rose-600">{formatPercent(summary.nplPercent)} dari OS</p></div></div>
          </div> : null}

          {slide === 1 ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{qualityRows.map((item, index) => <div key={item.name} className="rounded-lg border border-[#d7e3ef] bg-white p-4 shadow-[0_8px_20px_rgba(0,55,105,0.06)]"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase text-muted-foreground">{item.name}</p><p className="mt-1 text-lg font-black text-[#004077]">{formatCurrency(item.os)}</p></div><p className="text-sm font-bold text-[#00529c]">{formatPercent(summary.totalOs ? (item.os / summary.totalOs) * 100 : 0)}</p></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#eaf3fb]"><div className={cn("h-full rounded-full", index === 0 ? "bg-emerald-500" : index < 4 ? "bg-[#f37021]" : "bg-rose-600")} style={{ width: `${Math.max(4, (item.os / maxQualityOs) * 100)}%` }} /></div></div>)}</div> : null}

          {slide === 2 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {mantriRows.map((item) => (
                <div key={item.mantri} className="rounded-lg border border-[#d7e3ef] bg-white p-5 shadow-[0_10px_24px_rgba(0,55,105,0.07)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-[#00529c]">{item.mantri}</p>
                      <p className="text-sm text-muted-foreground">OS {formatCurrency(item.totalOs)}</p>
                    </div>
                    <span className={cn("rounded-md px-2.5 py-1 text-xs font-black", item.nplPercent >= 20 ? "bg-rose-50 text-rose-700" : item.smlPercent >= 20 ? "bg-[#fff7ed] text-[#b54b00]" : "bg-emerald-50 text-emerald-700")}>
                      {item.nplPercent >= 20 ? "Risiko Tinggi" : item.smlPercent >= 20 ? "Perlu Atensi" : "Terkendali"}
                    </span>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold"><span>SML</span><span className="text-[#f37021]">{formatPercent(item.smlPercent)}</span></div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#f37021]" style={{ width: `${Math.min(100, item.smlPercent)}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold"><span>NPL</span><span className="text-rose-700">{formatPercent(item.nplPercent)}</span></div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-rose-600" style={{ width: `${Math.min(100, item.nplPercent)}%` }} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {slide === 3 ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
            { label: "New SML", value: `${summary.newSml.length} rekening`, helper: formatCurrency(summary.newSml.reduce((total, item) => total + item.outstanding, 0)), color: "border-[#f37021] bg-[#fff7ed] text-[#b54b00]" },
            { label: "New NPL", value: `${summary.newNpl.length} rekening`, helper: formatCurrency(summary.newNpl.reduce((total, item) => total + item.outstanding, 0)), color: "border-rose-500 bg-rose-50 text-rose-700" },
            { label: "Downgrade CKPN", value: formatCurrency(ckpnAddition), helper: `${ckpnRows.filter((item) => item.ckpnImpact > 0).length} rekening memburuk`, color: "border-rose-500 bg-white text-rose-700" },
            { label: "Upgrade CKPN", value: formatCurrency(ckpnRecovery), helper: `${ckpnRows.filter((item) => item.ckpnImpact < 0).length} rekening membaik`, color: "border-emerald-500 bg-white text-emerald-700" },
          ].map((item) => <div key={item.label} className={cn("rounded-lg border-t-4 p-5 shadow-[0_10px_24px_rgba(0,55,105,0.07)]", item.color)}><p className="text-xs font-black uppercase">{item.label}</p><p className="mt-3 break-words text-2xl font-black">{item.value}</p><p className="mt-2 text-xs font-semibold opacity-75">{item.helper}</p></div>)}<div className="sm:col-span-2 lg:col-span-4 rounded-lg bg-[#00529c] p-5 text-white"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase text-white/65">Net Dampak CKPN</p><p className="mt-1 text-3xl font-black">{formatCurrency(summary.totalCkpn)}</p></div><p className="max-w-xl text-sm leading-6 text-white/75">Nilai positif menunjukkan tambahan biaya risiko. Prioritaskan rekening dengan penurunan kualitas dan outstanding terbesar.</p></div></div></div> : null}

          {slide === 4 ? <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><div className="rounded-lg border border-[#d7e3ef] bg-white p-5"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase text-[#f37021]">Realisasi Bulan Ini</p><p className="mt-2 text-3xl font-black text-[#00529c]">{formatCurrency(realisasiTotal)}</p></div><p className="font-bold text-muted-foreground">{realisasiCount} rekening</p></div><div className="mt-6 space-y-4">{realisasiRows.map((item) => <div key={item.mantri}><div className="flex justify-between gap-4 text-sm"><span className="font-bold text-[#004077]">{item.mantri}</span><span className="font-black text-[#00529c]">{formatCurrency(item.total)}</span></div><div className="mt-1.5 h-3 rounded-full bg-[#eaf3fb]"><div className="h-3 rounded-full bg-[linear-gradient(90deg,#00529c,#2f80c2)]" style={{ width: `${Math.max(5, (item.total / maxRealisasi) * 100)}%` }} /></div></div>)}</div></div><div className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-6"><div><p className="text-xs font-black uppercase text-emerald-700">Pipeline Suplesi</p><p className="mt-3 text-4xl font-black text-emerald-800">{pipelineRows.length}</p><p className="mt-1 font-bold text-emerald-700">rekening potensial</p></div><div className="mt-6 rounded-md bg-white/75 p-4"><p className="text-xs font-bold uppercase text-emerald-700">Potensi Sisa Plafond</p><p className="mt-2 text-2xl font-black text-emerald-800">{formatCurrency(pipelinePotential)}</p></div></div></div> : null}

          {slide === 5 ? <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"><div className="grid grid-cols-2 gap-4">{[
            { label: "Total Data", value: brimenRows.length, tone: "text-[#00529c] bg-white border-[#bfd3e5]" },
            { label: "Aktif Dalam Arsip", value: archived, tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            { label: "Sedang Dipinjam", value: borrowed, tone: "text-[#b54b00] bg-[#fff7ed] border-[#f7c9aa]" },
            { label: "Belum Disimpan", value: unarchived, tone: "text-rose-700 bg-rose-50 border-rose-200" },
          ].map((item) => <div key={item.label} className={cn("rounded-lg border p-5", item.tone)}><p className="text-xs font-black uppercase">{item.label}</p><p className="mt-3 text-4xl font-black">{item.value}</p></div>)}</div><div className="rounded-lg border border-[#d7e3ef] bg-white p-6"><p className="text-xs font-black uppercase text-[#f37021]">Prioritas Operasional</p><div className="mt-4 space-y-3">{[
            { label: "Lengkapi No BRIMEN berkas", value: `${unarchived} nasabah`, tone: "bg-rose-50 text-rose-700" },
            { label: "Pantau pengembalian berkas", value: `${borrowed} nasabah`, tone: "bg-[#fff7ed] text-[#b54b00]" },
            { label: "Kelengkapan arsip", value: formatPercent(brimenRows.length ? (archived / brimenRows.length) * 100 : 0), tone: "bg-emerald-50 text-emerald-700" },
          ].map((item, index) => <div key={item.label} className="flex items-center gap-3 rounded-md border border-[#e3edf6] p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#00529c] font-black text-white">{index + 1}</span><div className="min-w-0 flex-1"><p className="font-bold text-[#004077]">{item.label}</p></div><span className={cn("rounded-md px-3 py-1.5 text-sm font-black", item.tone)}>{item.value}</span></div>)}</div></div></div> : null}

          {slide === 6 ? (
            <div className="mt-4 flex h-[calc(100vh-250px)] min-h-[520px] flex-col overflow-hidden rounded-lg border border-[#d7e3ef] bg-white shadow-[0_14px_32px_rgba(0,55,105,0.08)]">
              {presentationUploads?.almafact ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d7e3ef] bg-[#f8fbfe] px-4 py-3">
                    <div><p className="font-black text-[#004077]">{presentationUploads.almafact.fileName}</p><p className="text-xs text-muted-foreground">Format {presentationUploads.almafact.format} | File aktif terakhir</p></div>
                    <div className="flex items-center gap-2">
                      {presentationUploads.almafact.format !== "PDF" ? (
                        <div className="flex items-center rounded-md border border-[#bfd3e5] bg-white p-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#00529c]" aria-label="Perkecil Almafact" disabled={almafactZoom <= 75} onClick={() => setAlmafactZoom((value) => Math.max(75, value - 25))}><ZoomOut className="h-4 w-4" /></Button>
                          <span className="min-w-12 text-center text-xs font-black text-[#004077]">{almafactZoom}%</span>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#00529c]" aria-label="Perbesar Almafact" disabled={almafactZoom >= 200} onClick={() => setAlmafactZoom((value) => Math.min(200, value + 25))}><ZoomIn className="h-4 w-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#f37021]" aria-label="Sesuaikan lebar Almafact" onClick={() => setAlmafactZoom(100)}><Maximize2 className="h-4 w-4" /></Button>
                        </div>
                      ) : null}
                      <Badge className="bg-[#00529c] text-white hover:bg-[#00529c]">Almafact</Badge>
                    </div>
                  </div>
                  {presentationUploads.almafact.format === "PDF" ? (
                    <iframe title="Dokumen Almafact" src={presentationUploads.almafact.url} className="min-h-0 w-full flex-1 bg-white" />
                  ) : (
                    <div className="min-h-0 flex-1 overflow-auto bg-[#dfeaf3] p-2 sm:p-3">
                      <div className="mx-auto shadow-[0_12px_30px_rgba(0,55,105,0.18)]" style={{ width: `${almafactZoom}%` }}>
                        <img src={presentationUploads.almafact.url} alt="Almafact Unit Kerja" className="h-auto w-full max-w-none bg-white" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState title="Almafact belum tersedia" description={uploadPresentationStatus || "Unggah file Almafact PNG atau PDF melalui menu Upload Data."} icon={FileText} />
              )}
            </div>
          ) : null}

          {slide === 7 ? (
            <div className="mt-6 space-y-4">
              {presentationUploads?.branchPl ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#bfd3e5] bg-white p-4"><p className="text-xs font-black uppercase text-muted-foreground">File Aktif</p><p className="mt-2 truncate font-black text-[#00529c]" title={presentationUploads.branchPl.fileName}>{presentationUploads.branchPl.fileName}</p></div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black uppercase text-emerald-700">Jumlah Data</p><p className="mt-2 text-2xl font-black text-emerald-800">{formatNumber(presentationUploads.branchPl.totalRows)} baris</p></div>
                    <div className="rounded-lg border border-[#f7c9aa] bg-[#fff7ed] p-4"><p className="text-xs font-black uppercase text-[#b54b00]">Struktur</p><p className="mt-2 text-2xl font-black text-[#f37021]">{presentationUploads.branchPl.headers.length} kolom</p></div>
                  </div>
                  <div className="max-h-[50vh] overflow-auto rounded-lg border border-[#d7e3ef] bg-white shadow-[0_14px_32px_rgba(0,55,105,0.08)]">
                    <table className="w-full min-w-[900px] border-collapse text-sm">
                      <thead className="bg-[#00529c] text-white"><tr>{presentationUploads.branchPl.headers.map((header) => <th key={header} className="whitespace-nowrap border-r border-white/15 px-3 py-3 text-left text-xs font-black uppercase">{header}</th>)}</tr></thead>
                      <tbody>{presentationUploads.branchPl.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[#e3edf6] even:bg-[#f8fbfe]">{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2.5 font-medium text-[#29445c]">{String(cell)}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                  {presentationUploads.branchPl.totalRows > presentationUploads.branchPl.rows.length ? <p className="text-xs font-semibold text-muted-foreground">Menampilkan {presentationUploads.branchPl.rows.length} baris pertama dari {formatNumber(presentationUploads.branchPl.totalRows)} data.</p> : null}
                </>
              ) : (
                <div className="min-h-[52vh] rounded-lg border border-[#d7e3ef] bg-white"><EmptyState title="Branch PL belum tersedia" description={uploadPresentationStatus || "Unggah file Branch PL CSV atau Excel melalui menu Upload Data."} icon={FileSpreadsheet} /></div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#d7e3ef] bg-white px-4 py-3 sm:px-8"><Button type="button" variant="outline" className="border-[#bfd3e5] bg-white text-[#00529c] hover:bg-[#eaf3fb]" onClick={() => setSlide((slide + slideCount - 1) % slideCount)}>Sebelumnya</Button><div className="flex gap-1.5">{slides.map((_, index) => <button key={index} type="button" aria-label={`Slide ${index + 1}`} onClick={() => setSlide(index)} className={cn("h-2.5 rounded-full transition-all", index === slide ? "w-8 bg-[#f37021]" : "w-3 bg-[#bfd3e5]")} />)}</div><Button type="button" className="bg-[#00529c] hover:bg-[#003f78]" onClick={() => setSlide((slide + 1) % slideCount)}>Berikutnya</Button></div>
    </div>
  );
}

function formatChartAxis(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} Jt`;
  if (absolute >= 1_000) return `${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} Rb`;
  return formatNumber(value);
}

function PortfolioGrowthChart({ month, title = "Pertumbuhan Portofolio Kredit" }: { month: MonthKey; title?: string }) {
  const previousMonth = getPreviousMonth(month) ?? month;
  const yearEndMonth = getYearEndComparisonMonth(month);
  const currentSummary = getSummary(month);
  const previousSummary = getSummary(previousMonth);
  const yearEndSummary = getSummary(yearEndMonth);
  const data = [
    { period: "Akhir Tahun", month: getMonthLabel(yearEndMonth), os: yearEndSummary.totalOs, sml: yearEndSummary.smlOs, npl: yearEndSummary.nplOs },
    { period: "Bulan Lalu", month: getMonthLabel(previousMonth), os: previousSummary.totalOs, sml: previousSummary.smlOs, npl: previousSummary.nplOs },
    { period: "Terbaru", month: getMonthLabel(month), os: currentSummary.totalOs, sml: currentSummary.smlOs, npl: currentSummary.nplOs },
  ];
  const growth = [
    { label: "OS", value: currentSummary.totalOs, delta: currentSummary.totalOs - yearEndSummary.totalOs, color: "#00529c", background: "bg-[#e8f3fb]" },
    { label: "SML", value: currentSummary.smlOs, delta: currentSummary.smlOs - yearEndSummary.smlOs, color: "#f37021", background: "bg-[#fff0e6]" },
    { label: "NPL", value: currentSummary.nplOs, delta: currentSummary.nplOs - yearEndSummary.nplOs, color: "#dc2626", background: "bg-rose-50" },
  ];

  return (
    <Card className="bri-card overflow-hidden border-[#d7e3ef]">
      <CardHeader className="border-b border-[#e3edf6] bg-[linear-gradient(110deg,#f8fbfe_0%,#eef7ff_68%,#fff5ee_100%)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>{title}</CardTitle><CardDescription>Tren OS, SML, dan NPL dari akhir tahun hingga posisi terbaru.</CardDescription></div>
          <Badge variant="outline" className="w-fit border-[#9fc3df] bg-white text-[#00529c]">3 posisi laporan</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px]">
          <div className="h-[310px] min-w-0 rounded-lg border border-[#e3edf6] bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={data} margin={{ top: 18, right: 8, left: 2, bottom: 4 }}>
                <defs>
                  <filter id="portfolioLineGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#003765" floodOpacity="0.22" />
                  </filter>
                </defs>
                <CartesianGrid stroke="#dce9f4" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="period" axisLine={{ stroke: "#aac4d9" }} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#35546d" }} dy={8} />
                <YAxis yAxisId="os" tickFormatter={formatChartAxis} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#60778b" }} width={52} />
                <YAxis yAxisId="risk" orientation="right" tickFormatter={formatChartAxis} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#60778b" }} width={48} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.month ?? ""}
                  contentStyle={{ borderRadius: 8, borderColor: "#bfd3e5", boxShadow: "0 12px 28px rgba(0,55,105,.16)", fontSize: 12 }}
                />
                <RechartsLine yAxisId="os" type="monotone" dataKey="os" name="OS" stroke="#00529c" strokeWidth={4} dot={{ r: 5, fill: "#00529c", stroke: "#fff", strokeWidth: 3 }} activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }} style={{ filter: "url(#portfolioLineGlow)" }} />
                <RechartsLine yAxisId="risk" type="monotone" dataKey="sml" name="SML" stroke="#f37021" strokeWidth={4} dot={{ r: 5, fill: "#f37021", stroke: "#fff", strokeWidth: 3 }} activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }} style={{ filter: "url(#portfolioLineGlow)" }} />
                <RechartsLine yAxisId="risk" type="monotone" dataKey="npl" name="NPL" stroke="#dc2626" strokeWidth={4} dot={{ r: 5, fill: "#dc2626", stroke: "#fff", strokeWidth: 3 }} activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }} style={{ filter: "url(#portfolioLineGlow)" }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-1">
            {growth.map((item) => (
              <div key={item.label} className={cn("relative overflow-hidden rounded-lg border border-[#dbe7f1] p-3.5", item.background)}>
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: item.color }} />
                <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase text-slate-600">{item.label} Terbaru</p><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 0 4px ${item.color}18` }} /></div>
                <p className="metric-value mt-1.5 text-base font-black text-[#0b355a]">{formatCurrency(item.value)}</p>
                <p className={cn("mt-1 text-xs font-black", item.delta > 0 ? "text-rose-700" : item.delta < 0 ? "text-emerald-700" : "text-slate-500")}>{item.delta > 0 ? "+" : ""}{formatCurrency(item.delta)} <span className="font-semibold text-slate-500">YTD</span></p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e3edf6] pt-3">
          {growth.map((item) => <div key={item.label} className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="h-1 w-7 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</div>)}
          <p className="ml-auto text-xs font-semibold text-slate-500">Arah garis menunjukkan perubahan nominal, bukan persentase.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardOverviewView({
  month,
  summary,
  loanDataSource,
  latestUploadAt,
  brimenSummary,
  brimenRows,
  creditAccounts,
  onOpenMenu,
  selectedRole,
  onOpenMantri,
}: {
  month: MonthKey;
  summary: ReturnType<typeof getSummary>;
  loanDataSource: "loading" | "upload" | "mock";
  latestUploadAt?: string;
  brimenSummary?: BrimenSummary;
  brimenRows: BrimenCustomer[];
  creditAccounts: string[];
  onOpenMenu: (menu: MenuKey) => void;
  selectedRole: UserRole;
  onOpenMantri: (mantri: string) => void;
}) {
  const [focusMode, setFocusMode] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const ckpnRows = getCkpnRows(month);
  const pipelineRows = getPipelineRows(month);
  const realisasiRows = getRealisasiRows(month);
  const realisasiTotal = realisasiRows.reduce((total, item) => total + item.total, 0);
  const realisasiCount = realisasiRows.reduce((total, item) => total + item.count, 0);
  const creditAccountSet = new Set(creditAccounts.map((account) => normalizeAccount(account)));
  const matchedBrimen = brimenRows.filter((item) => item.persistedInBrimen !== false && creditAccountSet.has(normalizeAccount(item.accountNumber))).length;
  const mantriRecap = getMantriRecap(month);
  const brimenArchivedActive = brimenRows.filter((item) => item.isLatestLw321 === true && Boolean(item.brimenBerkas?.trim()));
  const brimenBorrowed = brimenRows.filter((item) => item.status === "Dipinjam");
  const brimenNotArchived = brimenRows.filter((item) => item.isLatestLw321 === true && !item.brimenBerkas?.trim()).length;
  const followUpItems: {
    label: string;
    value: string;
    helper: string;
    tone: "default" | "warning" | "danger" | "success";
  }[] = [
    { label: "Nasabah baru turun kualitas", value: `${summary.newNpl.length + summary.newSml.length} rekening`, helper: `${summary.newSml.length} New SML | ${summary.newNpl.length} New NPL`, tone: "danger" },
    { label: "Berkas belum diarsipkan", value: `${brimenNotArchived} nasabah`, helper: "No BRIMEN berkas masih kosong", tone: "warning" },
    { label: "Berkas perlu dikembalikan", value: `${brimenBorrowed.length} nasabah`, helper: brimenBorrowed[0]?.name ?? "Tidak ada berkas dipinjam", tone: brimenBorrowed.length ? "warning" : "success" },
    { label: "Pipeline suplesi", value: `${pipelineRows.length} rekening`, helper: "Lancar, belum restruk, OS < 50% plafond", tone: "success" },
    { label: "Pembaruan sumber data", value: "Periksa upload", helper: `Terakhir ${latestUploadAt ?? uploadHistory[0]?.uploadedAt ?? "belum tersedia"}`, tone: "default" },
  ];
  return (
    <div className="dashboard-overview space-y-5 sm:space-y-6">
      <SectionHeader
        title="Dashboard Utama"
        description={`Ringkasan keseluruhan pinjaman dan operasional untuk periode ${getMonthLabel(month)}.`}
        icon={LayoutDashboard}
      />

      <div className="dashboard-context-bar surface-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-md",
            loanDataSource === "upload" ? "bg-emerald-50 text-emerald-700" : loanDataSource === "loading" ? "bg-[#e7f2fb] text-[#00529c]" : "bg-amber-50 text-amber-700",
          )}>
            {loanDataSource === "loading" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : loanDataSource === "upload" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-[#004077]">Posisi {getMonthLabel(month)}</p>
              <Badge variant="outline" className="border-[#bfd3e5] bg-[#f5faff] text-[10px] text-[#00529c]">{selectedRole}</Badge>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {loanDataSource === "upload"
                ? `LW321 aktif${latestUploadAt ? ` | diperbarui ${latestUploadAt}` : ""}`
                : loanDataSource === "loading"
                  ? "Memuat sumber data pinjaman..."
                  : "Data contoh aktif. Upload LW321 untuk memakai data unit kerja."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant={focusMode ? "default" : "outline"} size="sm" className="flex-1 sm:flex-none" onClick={() => setFocusMode((current) => !current)}><ListChecks className="mr-2 h-4 w-4" />{focusMode ? "Semua Data" : "Mode Fokus"}</Button>
          <Button type="button" variant="outline" size="sm" className="flex-1 text-[#00529c] sm:flex-none" onClick={() => setCompareOpen(true)}><GitCompare className="mr-2 h-4 w-4" />Bandingkan</Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase text-[#f37021]">Ringkasan Eksekutif</p>
            <h2 className="mt-1 text-lg font-black text-[#004077]">Kondisi unit kerja dalam satu pandangan</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">Angka posisi terbaru pada periode aktif</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard label="Total Outstanding" value={formatCurrency(summary.totalOs)} detail={`${formatNumber(summary.totalDebtorCount)} debitur aktif`} indicator="OS" icon={Banknote} />
          <OverviewMetricCard label="Special Mention" value={formatCurrency(summary.smlOs)} detail={`${formatNumber(summary.smlDebtorCount)} debitur dalam SML`} indicator={formatPercent(summary.smlPercent)} tone="orange" icon={AlertTriangle} />
          <OverviewMetricCard label="Non Performing Loan" value={formatCurrency(summary.nplOs)} detail={`${formatNumber(summary.nplDebtorCount)} debitur dalam NPL`} indicator={formatPercent(summary.nplPercent)} tone="red" icon={ArrowDownRight} />
          <OverviewMetricCard label="Arsip Aktif" value={`${formatNumber(brimenArchivedActive.length)} nasabah`} detail={`${formatNumber(brimenBorrowed.length)} berkas sedang dipinjam`} indicator={`${brimenSummary?.total ?? brimenRows.length} data`} tone="green" icon={FolderArchive} />
        </div>
      </section>

      {focusMode ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <FollowUpPanel items={followUpItems} />
          <div className="rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-4">
            <p className="text-xs font-black uppercase text-[#f37021]">Urutan Kerja Hari Ini</p>
            <div className="mt-3 space-y-3">{followUpItems.slice(0, 4).map((item, index) => <div key={item.label} className="flex items-center gap-3 rounded-md bg-white p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#00529c] font-black text-white">{index + 1}</span><div><p className="text-sm font-bold text-[#004077]">{item.label}</p><p className="text-xs text-muted-foreground">{item.value}</p></div></div>)}</div>
          </div>
        </div>
      ) : null}

      <section className={cn("space-y-3", focusMode && "hidden")}>
        <div>
          <p className="text-xs font-black uppercase text-[#f37021]">Ruang Kerja</p>
          <h2 className="mt-1 text-lg font-black text-[#004077]">Pilih dashboard yang akan dikerjakan</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onOpenMenu("mantri")}
          className="dashboard-entry-card workspace-launch bri-card group rounded-lg border border-[#d7e3ef] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#00529c]/45 hover:shadow-lg sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700">Monitoring aktif</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f37021]">Dashboard Pinjaman</p>
              <h2 className="mt-2 text-xl font-black text-[#00529c]">{formatCurrency(summary.totalOs)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">OS, kualitas kredit, realisasi, pipeline, dan CKPN.</p>
            </div>
            <span className="dashboard-entry-icon grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#00529c] text-white">
              <UsersRound className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 divide-x divide-[#d7e3ef] border-y border-[#e3edf6] py-3">
            <div className="pr-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">SML</p>
              <p className="font-black text-[#f37021]">{formatPercent(summary.smlPercent)}</p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">NPL</p>
              <p className="font-black text-rose-700">{formatPercent(summary.nplPercent)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-black text-[#00529c]"><span>Buka data pinjaman</span><ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
        </button>

        <button
          type="button"
          onClick={() => onOpenMenu("brimen")}
          className="dashboard-entry-card workspace-launch bri-card group rounded-lg border border-[#d7e3ef] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#00529c]/45 hover:shadow-lg sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-black uppercase text-[#b54b00]">Operasional siap</span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#f37021]" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f37021]">Dashboard Operasional</p>
              <h2 className="mt-2 text-xl font-black text-[#00529c]">{brimenSummary?.total ?? brimenRows.length} nasabah</h2>
              <p className="mt-1 text-sm text-muted-foreground">Arsip berkas, jaminan, status pinjam, dan register BRIMEN.</p>
            </div>
            <span className="dashboard-entry-icon grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f37021] text-white">
              <FolderArchive className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 divide-x divide-[#d7e3ef] border-y border-[#e3edf6] py-3">
            <div className="pr-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Aktif Arsip</p>
              <p className="font-black text-emerald-700">{brimenArchivedActive.length}</p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Dipinjam</p>
              <p className="font-black text-[#f37021]">{brimenBorrowed.length}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-black text-[#00529c]"><span>Buka data operasional</span><ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
        </button>
        </div>
      </section>

      <div className={cn("rounded-lg border border-[#d7e3ef] bg-white p-4", focusMode && "hidden")}>
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase text-[#f37021]">Peta Risiko Mantri</p><p className="mt-1 text-sm text-muted-foreground">Klik mantri untuk membuka rekap dan nominatif kelolaannya.</p></div><Badge variant="outline">{mantriRecap.length} mantri</Badge></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {mantriRecap.map((row) => {
            const sml = row.SML1.os + row.SML2.os + row.SML3.os;
            const npl = row.KL.os + row.Diragukan.os + row.Macet.os;
            const riskRatio = row.totalOs ? ((sml + npl) / row.totalOs) * 100 : 0;
            const tone = npl / Math.max(row.totalOs, 1) >= 0.3 ? "danger" : riskRatio >= 25 ? "warning" : "success";
            return (
              <button key={row.mantri} type="button" onClick={() => onOpenMantri(row.mantri)} className={cn("rounded-lg border p-3 text-left transition hover:-translate-y-0.5", tone === "danger" ? "border-rose-200 bg-rose-50" : tone === "warning" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
                <div className="flex items-center justify-between gap-2"><p className="font-black text-[#004077]">{row.mantri}</p><span className={cn("h-2.5 w-2.5 rounded-full", tone === "danger" ? "bg-rose-600" : tone === "warning" ? "bg-amber-500" : "bg-emerald-600")} /></div>
                <p className="mt-2 text-lg font-black text-[#00529c]">{formatCurrency(row.totalOs)}</p>
                <div className="mt-2 flex justify-between text-xs"><span className="text-[#b54b00]">SML {formatPercent(row.totalOs ? (sml / row.totalOs) * 100 : 0)}</span><span className="text-rose-700">NPL {formatPercent(row.totalOs ? (npl / row.totalOs) * 100 : 0)}</span></div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("grid items-start gap-4 xl:grid-cols-[1.25fr_0.75fr]", focusMode && "hidden")}>
        <Card className="bri-card overflow-hidden border-[#d7e3ef]">
          <CardHeader className="border-b border-[#e3edf6] bg-[#f8fbfe] pb-4">
            <div className="flex items-center justify-between gap-3">
              <div><CardTitle>Insight Bulan Ini</CardTitle><CardDescription>Angka penting untuk keputusan dan tindak lanjut.</CardDescription></div>
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#00529c] text-white"><Activity className="h-5 w-5" /></span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid sm:grid-cols-2">
              {[
                { label: "Realisasi", value: formatCurrency(realisasiTotal), helper: `${realisasiCount} rekening bulan ini`, icon: TrendingUp, tone: "text-emerald-700 bg-emerald-50" },
                { label: "Delta CKPN", value: formatCurrency(summary.totalCkpn), helper: `${ckpnRows.length} rekening bergerak`, icon: PieChartIcon, tone: summary.totalCkpn > 0 ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50" },
                { label: "New SML", value: `${summary.newSml.length} rekening`, helper: formatCurrency(summary.newSml.reduce((total, item) => total + item.outstanding, 0)), icon: AlertTriangle, tone: "text-[#b54b00] bg-[#fff0e6]" },
                { label: "New NPL", value: `${summary.newNpl.length} rekening`, helper: formatCurrency(summary.newNpl.reduce((total, item) => total + item.outstanding, 0)), icon: ArrowDownRight, tone: "text-rose-700 bg-rose-50" },
                { label: "Pipeline Suplesi", value: `${pipelineRows.length} rekening`, helper: formatCurrency(pipelineRows.reduce((total, item) => total + item.remainingPlafond, 0)), icon: Gauge, tone: "text-emerald-700 bg-emerald-50" },
                { label: "Data Cocok", value: `${matchedBrimen} rekening`, helper: `${brimenNotArchived} belum diarsipkan`, icon: CheckCircle2, tone: "text-[#00529c] bg-[#e7f2fb]" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex min-h-[112px] items-start gap-3 border-b border-[#e3edf6] p-4 odd:sm:border-r">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md", item.tone)}><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0"><p className="text-[11px] font-black uppercase text-slate-500">{item.label}</p><p className="metric-value mt-1 break-words text-lg font-black text-[#0b355a]">{item.value}</p><p className="mt-1 text-xs font-medium text-slate-500">{item.helper}</p></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <FollowUpPanel items={followUpItems} />
      </div>

      <div className={cn(focusMode && "hidden")}>
        <PortfolioGrowthChart month={month} />
      </div>
      {compareOpen ? <PeriodComparisonPanel currentMonth={month} onClose={() => setCompareOpen(false)} /> : null}
    </div>
  );
}

function PeriodComparisonPanel({ currentMonth, onClose }: { currentMonth: MonthKey; onClose: () => void }) {
  const defaultComparison = getPreviousMonth(currentMonth) ?? months[0].value;
  const [comparisonMonth, setComparisonMonth] = useState<MonthKey>(defaultComparison);
  const current = getSummary(currentMonth);
  const comparison = getSummary(comparisonMonth);
  const currentRealisasi = getRealisasiRows(currentMonth).reduce((total, item) => total + item.total, 0);
  const comparisonRealisasi = getRealisasiRows(comparisonMonth).reduce((total, item) => total + item.total, 0);
  const rows = [
    { label: "Outstanding", current: current.totalOs, comparison: comparison.totalOs, risk: false },
    { label: "SML", current: current.smlOs, comparison: comparison.smlOs, risk: true },
    { label: "NPL", current: current.nplOs, comparison: comparison.nplOs, risk: true },
    { label: "Realisasi", current: currentRealisasi, comparison: comparisonRealisasi, risk: false },
    { label: "Dampak CKPN", current: current.totalCkpn, comparison: comparison.totalCkpn, risk: true },
  ];
  return (
    <OverlayShell title="Perbandingan Periode" description="Bandingkan posisi kredit dan risiko pada dua periode." icon={GitCompare} onClose={onClose}>
      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Periode Pembanding"><Select value={comparisonMonth} onChange={(event) => setComparisonMonth(event.target.value as MonthKey)}>{months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field>
          <ReadOnlyField label="Periode Terbaru" value={getMonthLabel(currentMonth)} />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#d7e3ef]">
          <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#eaf3fb] px-3 py-2 text-xs font-black uppercase text-[#004077] sm:grid-cols-[1.1fr_1fr_1fr_1fr]"><span>Indikator</span><span className="hidden sm:block">{getMonthLabel(comparisonMonth)}</span><span>{getMonthLabel(currentMonth)}</span><span>Delta</span></div>
          {rows.map((item) => {
            const delta = item.current - item.comparison;
            const favorable = item.risk ? delta < 0 : delta > 0;
            return (
              <div key={item.label} className="grid grid-cols-[1fr_1fr_1fr] items-center border-t border-[#e3edf6] px-3 py-3 text-sm sm:grid-cols-[1.1fr_1fr_1fr_1fr]">
                <span className="font-bold text-[#004077]">{item.label}</span><span className="hidden sm:block text-muted-foreground">{formatCurrency(item.comparison)}</span><span>{formatCurrency(item.current)}</span><span className={cn("font-bold", !delta ? "text-slate-500" : favorable ? "text-emerald-700" : "text-rose-700")}>{delta > 0 ? "+" : ""}{formatCurrency(delta)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </OverlayShell>
  );
}

function FollowUpPanel({
  items,
}: {
  items: {
    label: string;
    value: string;
    helper: string;
    tone: "default" | "warning" | "danger" | "success";
  }[];
}) {
  const toneClass = {
    default: "border-[#d7e3ef] bg-white",
    warning: "border-[#f37021]/30 bg-[#f37021]/10",
    danger: "border-rose-200 bg-rose-50",
    success: "border-emerald-200 bg-emerald-50",
  };

  return (
    <Card className="bri-card h-fit border-[#d7e3ef]">
      <CardHeader>
        <CardTitle>Pusat Tindak Lanjut</CardTitle>
        <CardDescription>Prioritas pekerjaan yang perlu diperiksa hari ini.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className={cn("rounded-lg border p-3", toneClass[item.tone])}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#004077]">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-bold text-[#00529c] shadow-sm">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DashboardMantriView({
  activeTab,
  setActiveTab,
  month,
  children,
}: {
  activeTab: MantriViewKey;
  setActiveTab: (value: MantriViewKey) => void;
  month: MonthKey;
  children: React.ReactNode;
}) {
  const [mobilePinjamanOpen, setMobilePinjamanOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState<MantriViewKey | undefined>();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressTriggered = useRef(false);
  const rekap = getMantriRecap(month);
  const arrears = getArrearsRows(month);
  const realisasi = getRealisasiRows(month);
  const topOs = [...rekap].sort((a, b) => b.totalOs - a.totalOs)[0];
  const topRisk = [...rekap]
    .map((row) => ({
      mantri: row.mantri,
      nplOs: row.KL.os + row.Diragukan.os + row.Macet.os,
      smlOs: row.SML1.os + row.SML2.os + row.SML3.os,
    }))
    .sort((a, b) => b.nplOs + b.smlOs - (a.nplOs + a.smlOs))[0];
  const topRealisasi = [...realisasi].sort((a, b) => b.total - a.total)[0];
  const activeTabLabel = mantriTabs.find((item) => item.key === activeTab)?.label ?? "Data Pinjaman";
  const tabPreviewText: Record<MantriViewKey, string> = {
    ringkasan: "Ikhtisar OS, SML, NPL, CKPN, dan pergerakan kredit.",
    nominatif: `${getSnapshots(month).length} rekening nasabah pada periode ${getMonthLabel(month)}.`,
    kualitas: "Perbandingan kolektibilitas bulan lalu dengan posisi terbaru.",
    rekap: `${rekap.length} mantri dengan rincian OS dan delta pencapaian.`,
    realisasi: `${realisasi.reduce((total, item) => total + item.count, 0)} rekening realisasi bulan ini.`,
    tunggakan: `${arrears.length} rekening memiliki tunggakan pokok atau bunga pada posisi terbaru.`,
    ckpn: `${getPrognosaCkpnRows(month).filter((item) => item.targetCollectibility).length} rekening telah diisi kolektibilitas prognosanya.`,
    di319: "Monitoring pinjaman tanpa blokiran dan setoran yang menggunakan dana blokiran.",
    wa: "Kampanye penawaran suplesi dan pengingat setoran menjelang jatuh tempo.",
  };
  const pinjamanQuickCards: {
    label: string;
    value: string;
    helper: string;
    tone: "success" | "warning" | "danger";
    action: MantriViewKey;
  }[] = [
    {
      label: "OS Terbesar",
      value: topOs?.mantri ?? "-",
      helper: topOs ? formatCurrency(topOs.totalOs) : "-",
      tone: "success",
      action: "rekap",
    },
    {
      label: "Perlu Atensi",
      value: topRisk?.mantri ?? "-",
      helper: topRisk ? formatCurrency(topRisk.smlOs + topRisk.nplOs) : "-",
      tone: "warning",
      action: "kualitas",
    },
    {
      label: "Realisasi Tertinggi",
      value: topRealisasi?.mantri ?? "-",
      helper: topRealisasi ? formatCurrency(topRealisasi.total) : "-",
      tone: "success",
      action: "realisasi",
    },
    {
      label: "Tunggakan",
      value: `${arrears.length} rekening`,
      helper: formatCurrency(arrears.reduce((total, item) => total + item.totalArrears, 0)),
      tone: "warning",
      action: "tunggakan",
    },
  ];

  function openPinjamanTab(key: MantriViewKey) {
    setActiveTab(key);
    setMobilePinjamanOpen(true);
  }

  function startLongPress(key: MantriViewKey) {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setMobilePreview(key);
    }, 550);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handlePinjamanIconClick(key: MantriViewKey) {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    openPinjamanTab(key);
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Dashboard Pinjaman"
        description="Seluruh data kredit, kualitas, realisasi, tunggakan, CKPN, dan monitoring simpanan."
        icon={UsersRound}
      />
      <div className={cn("flex gap-2 overflow-x-auto pb-1 min-[520px]:grid min-[520px]:grid-cols-2 min-[520px]:overflow-visible min-[520px]:pb-0 md:grid-cols-4", mobilePinjamanOpen ? "hidden sm:grid" : "flex min-[520px]:grid")}>
        {pinjamanQuickCards.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => openPinjamanTab(item.action)}
            className={cn(
              "quick-stat-card bri-card relative min-w-[138px] overflow-hidden rounded-lg border bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 sm:min-w-0",
              item.tone === "danger"
                ? "border-rose-200"
                : item.tone === "success"
                  ? "border-emerald-200"
                  : "border-[#f37021]/25",
            )}
          >
            <p className="text-[9px] font-black uppercase text-muted-foreground sm:text-[10px]">{item.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-sm font-black leading-tight text-[#00529c] sm:text-base">{item.value}</span>
              <span className="text-right text-[9px] font-semibold leading-tight text-[#f37021] sm:text-[10px]">{item.helper}</span>
            </div>
          </button>
        ))}
      </div>
      <div className={cn("workspace-tabs surface-panel p-3 sm:p-4", mobilePinjamanOpen ? "hidden sm:block" : "block")}>
        <div className="mb-2 rounded-md border border-[#d7e3ef] bg-[#fffaf6] px-3 py-2 sm:hidden">
          <p className="text-xs font-black uppercase text-[#f37021]">Fitur Utama Pinjaman</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
        {mantriTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => handlePinjamanIconClick(item.key)}
              onTouchStart={() => startLongPress(item.key)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onContextMenu={(event) => {
                event.preventDefault();
                setMobilePreview(item.key);
              }}
              className={cn(
                "workspace-tab-button group flex min-h-[82px] flex-col items-center justify-center gap-1 rounded-lg border bg-white px-2 py-2 text-center text-[9px] font-black uppercase leading-tight tracking-normal transition active:scale-[0.99] sm:h-[86px] sm:min-h-[86px] sm:gap-1.5 sm:rounded-md sm:px-2 sm:py-2 sm:text-xs sm:font-bold sm:normal-case",
                activeTab === item.key
                  ? "border-[#f37021] bg-[#f7fbff] text-[#00529c] shadow-[inset_0_-3px_0_#f37021,0_8px_18px_rgba(0,82,156,0.10)] sm:bg-[#00529c] sm:text-white"
                  : "border-[#d7e3ef] text-[#004077] shadow-[0_6px_14px_rgba(0,55,105,0.045)] hover:-translate-y-0.5 hover:border-[#00529c]/35 hover:bg-[#f7fbff] sm:text-muted-foreground sm:hover:bg-[#00529c]/10 sm:hover:text-[#00529c]",
              )}
              data-active={activeTab === item.key}
            >
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-white transition sm:h-8 sm:w-8 sm:border sm:shadow-sm",
                  mantriTabTones[item.key],
                  activeTab === item.key && "ring-2 ring-[#f37021]/45 ring-offset-2",
                )}
              >
                <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
              </span>
              <span className="max-w-[136px] sm:flex sm:min-h-7 sm:max-w-none sm:items-center sm:justify-center sm:text-center sm:leading-tight">{item.label}</span>
            </button>
          );
        })}
        </div>
        {mobilePreview ? (
          <div className="mt-3 rounded-lg border border-[#f7c9aa] bg-[#fff7ed] p-3 sm:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-[#f37021]">Ringkasan Cepat</p>
                <p className="mt-1 font-black text-[#00529c]">{mantriTabs.find((item) => item.key === mobilePreview)?.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{tabPreviewText[mobilePreview]}</p>
              </div>
              <button type="button" aria-label="Tutup ringkasan" onClick={() => setMobilePreview(undefined)} className="grid h-7 w-7 place-items-center rounded-md bg-white text-[#00529c]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className={cn("space-y-5", mobilePinjamanOpen ? "block" : "hidden sm:block")}>
        <div className="rounded-lg border border-[#d7e3ef] bg-white px-3 py-3 sm:hidden">
          <p className="text-xs font-bold uppercase text-muted-foreground">Data Pinjaman</p>
          <h2 className="text-base font-black text-[#00529c]">{activeTabLabel}</h2>
        </div>
        {children}
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full border-[#00529c]/25 bg-white font-bold text-[#00529c] sm:hidden"
          onClick={() => setMobilePinjamanOpen(false)}
        >
          Kembali
        </Button>
      </div>
    </div>
  );
}

function RingkasanView({
  month,
  summary,
  onOpenMenu,
}: {
  month: MonthKey;
  summary: ReturnType<typeof getSummary>;
  onOpenMenu: (menu: MantriViewKey) => void;
}) {
  const [newQualityMenu, setNewQualityMenu] = useState<"SML" | "NPL">("SML");
  const ckpnRows = getCkpnRows(month);
  const previousMonth = getPreviousMonth(month);
  const previousSummary = getSummary(previousMonth ?? month);
  const yearEndMonth = getYearEndComparisonMonth(month);
  const yearEndSummary = getSummary(yearEndMonth);
  const trendCards = [
    { label: "OS", current: summary.totalOs, debtorCount: summary.totalDebtorCount, mtd: summary.totalOs - previousSummary.totalOs, ytd: summary.totalOs - yearEndSummary.totalOs, risk: false, tone: "blue", icon: Banknote },
    { label: "SML", current: summary.smlOs, debtorCount: summary.smlDebtorCount, mtd: summary.smlOs - previousSummary.smlOs, ytd: summary.smlOs - yearEndSummary.smlOs, risk: true, tone: "orange", icon: AlertTriangle },
    { label: "NPL", current: summary.nplOs, debtorCount: summary.nplDebtorCount, mtd: summary.nplOs - previousSummary.nplOs, ytd: summary.nplOs - yearEndSummary.nplOs, risk: true, tone: "red", icon: ArrowDownRight },
  ] as const;
  const selectedNewRows = (newQualityMenu === "SML" ? summary.newSml : summary.newNpl).map((item) => {
    const latestRow = getCompareSnapshot(month, item.accountNumber);
    const latestBucket: DisplayQuality = latestRow
      ? classifyQuality(latestRow, month)
      : getMissingLoanDisplayStatus(month, item);
    return {
      ...item,
      latestBucket,
      latestMovement: getQualityMovement(item.targetBucket, latestBucket),
    };
  });
  const newRowsPagination = useTablePagination(selectedNewRows, `${month}-${newQualityMenu}-${selectedNewRows.length}`);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ringkasan Portofolio"
        description={`Ikhtisar kualitas kredit, OS, realisasi, dan dampak CKPN untuk ${getMonthLabel(month)}.`}
        icon={LayoutDashboard}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {trendCards.map((item) => {
          const Icon = item.icon;
          const deltaTone = (value: number) => {
            const favorable = item.risk ? value < 0 : value > 0;
            const unfavorable = item.risk ? value > 0 : value < 0;
            return favorable ? "text-emerald-700" : unfavorable ? "text-rose-700" : "text-slate-600";
          };
          return (
            <div key={item.label} className="bri-card overflow-hidden rounded-lg border border-[#d7e3ef] bg-white">
              <div className={cn("h-1", item.tone === "blue" ? "bg-[#00529c]" : item.tone === "orange" ? "bg-[#f37021]" : "bg-rose-600")} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">Posisi {item.label} Terbaru</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-2xl font-black text-[#004077]">{formatCurrency(item.current)}</p>
                      <span className={cn("rounded-md border px-2 py-1 text-xs font-black", item.tone === "blue" ? "border-sky-200 bg-sky-50 text-[#00529c]" : item.tone === "orange" ? "border-orange-200 bg-orange-50 text-[#b54b00]" : "border-rose-200 bg-rose-50 text-rose-700")}>{formatNumber(item.debtorCount)} debitur</span>
                    </div>
                  </div>
                  <span className={cn("grid h-10 w-10 place-items-center rounded-md", item.tone === "blue" ? "bg-[#eaf3fb] text-[#00529c]" : item.tone === "orange" ? "bg-[#fff7ed] text-[#f37021]" : "bg-rose-50 text-rose-700")}><Icon className="h-5 w-5" /></span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[{ label: "Delta MTD", value: item.mtd }, { label: "Delta YTD", value: item.ytd }].map((delta) => (
                    <div key={delta.label} className="rounded-md border border-[#e3edf6] bg-[#f8fbfe] px-3 py-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">{delta.label}</p>
                      <p className={cn("mt-1 flex items-center gap-1 text-sm font-black", deltaTone(delta.value))}>{delta.value > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : delta.value < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}{delta.value > 0 ? "+" : ""}{formatCurrency(delta.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SML %" value={formatPercent(summary.smlPercent)} helper={`${formatNumber(summary.smlDebtorCount)} debitur posisi terbaru`} tone="warning" icon={LineChart} />
        <MetricCard label="NPL %" value={formatPercent(summary.nplPercent)} helper={`${formatNumber(summary.nplDebtorCount)} debitur posisi terbaru`} tone="danger" icon={BarChart3} />
        <MetricCard label="Total Dampak CKPN" value={formatCurrency(summary.totalCkpn)} helper={`${ckpnRows.length} rekening bergerak`} tone={summary.totalCkpn >= 0 ? "danger" : "success"} icon={PieChartIcon} />
        <MetricCard label="Portofolio PUMK" value={formatCurrency(summary.pumkOs)} helper={`${summary.pumkCount} rekening LN_TYPE 5G, terpisah dari rekap kredit`} icon={BriefcaseBusiness} />
      </div>

      <div className="bri-card rounded-lg border border-[#d7e3ef] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase text-[#f37021]">Pergerakan Baru</p><h2 className="mt-1 text-lg font-black text-[#00529c]">Nominatif New SML & New NPL</h2><p className="mt-1 text-xs text-muted-foreground">Kriteria dihitung dari {getMonthLabel(getPreviousMonth(month, 2) ?? month)} ke {getMonthLabel(getPreviousMonth(month) ?? month)}. Tabel menampilkan posisi bulan lalu dan terbaru.</p></div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setNewQualityMenu("SML")} className={cn("flex min-w-[140px] items-center justify-between rounded-md border px-3 py-2 text-sm font-black", newQualityMenu === "SML" ? "border-[#f37021] bg-[#fff7ed] text-[#b54b00]" : "border-[#d7e3ef] bg-white text-muted-foreground")}><span>New SML</span><span className="rounded-full bg-white px-2 py-0.5 text-xs">{summary.newSml.length}</span></button>
            <button type="button" onClick={() => setNewQualityMenu("NPL")} className={cn("flex min-w-[140px] items-center justify-between rounded-md border px-3 py-2 text-sm font-black", newQualityMenu === "NPL" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-[#d7e3ef] bg-white text-muted-foreground")}><span>New NPL</span><span className="rounded-full bg-white px-2 py-0.5 text-xs">{summary.newNpl.length}</span></button>
          </div>
        </div>
        <div className="mt-4">
          {selectedNewRows.length ? (
            <>
              <TableShell minWidth="min-w-[850px]">
                <thead><tr><Th>No Rekening</Th><Th>Nama Debitur</Th><Th>Mantri</Th><Th>Outstanding Bulan Lalu</Th><Th>Kolek Bulan Lalu</Th><Th>Kolek Terbaru</Th><Th>Status Perubahan</Th></tr></thead>
                <tbody>{newRowsPagination.pagedRows.map((item) => <tr key={item.accountNumber}><Td className="font-medium text-[#00529c]">{item.accountNumber}</Td><Td className="font-semibold">{item.debtorName}</Td><Td>{item.mantri}</Td><Td>{formatCurrency(item.outstanding)}</Td><Td><QualityBadge bucket={item.targetBucket} /></Td><Td><QualityBadge bucket={item.latestBucket} /></Td><Td><MovementBadge movement={item.latestMovement} /></Td></tr>)}</tbody>
              </TableShell>
              <PaginationControls page={newRowsPagination.page} pageSize={newRowsPagination.pageSize} totalItems={selectedNewRows.length} onPageChange={newRowsPagination.setPage} onPageSizeChange={newRowsPagination.setPageSize} />
            </>
          ) : <EmptyState title={`Tidak ada New ${newQualityMenu}`} description={`Belum ada rekening yang masuk kategori New ${newQualityMenu} pada ${getMonthLabel(month)}.`} icon={CheckCircle2} />}
        </div>
      </div>

      <PortfolioGrowthChart month={month} title="Tren OS, SML, dan NPL" />

      <div className="grid gap-3 md:grid-cols-3">
        <Button variant="outline" onClick={() => onOpenMenu("kualitas")}>Lihat Nominatif Kualitas</Button>
        <Button variant="outline" onClick={() => onOpenMenu("ckpn")}>Lihat Dampak CKPN</Button>
        <Button variant="outline" onClick={() => onOpenMenu("tunggakan")}>Lihat Data Tunggakan</Button>
      </div>
    </div>
  );
}

const nominatifColumnOptions: ColumnOption[] = [
  { key: "account", label: "No Rekening" },
  { key: "name", label: "Nama Debitur" },
  { key: "nextPayment", label: "Next Payment Date" },
  { key: "outstanding", label: "Outstanding" },
  { key: "quality", label: "Kolektibilitas" },
  { key: "product", label: "Produk" },
  { key: "mantri", label: "Mantri" },
  { key: "realization", label: "Tanggal Realisasi" },
];

function NominatifView({
  rows,
  month,
  search,
  setSearch,
  brimenMap,
}: {
  rows: ReturnType<typeof getSnapshots>;
  month: MonthKey;
  search: string;
  setSearch: (value: string) => void;
  brimenMap: Map<string, BrimenCustomer>;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof rows)[number] | undefined>();
  const { visibleColumns, toggleColumn } = usePersistentColumns("britoel-columns-nominatif-v2", nominatifColumnOptions);
  const pagination = useTablePagination(rows, `${month}-${search}-${rows.length}`);
  const visible = (key: string) => visibleColumns.includes(key);
  const exportHeaders = nominatifColumnOptions.filter((column) => visible(column.key)).map((column) => column.label);
  const exportData = rows.map((item) => {
    const values: Record<string, string | number> = {
      account: item.accountNumber,
      name: item.debtorName,
      nextPayment: dateLabel(item.nextPaymentDate),
      outstanding: item.outstanding,
      quality: classifyQuality(item, month),
      product: getProductType(item.description, item.loanType),
      mantri: item.mantri,
      realization: dateLabel(item.realizedDate),
    };
    return visibleColumns.map((key) => values[key]);
  });

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Data Nominatif Nasabah"
        description="Daftar rekening nasabah dengan OS, kolektibilitas terbaru, mantri, dan tanggal realisasi."
        icon={ClipboardList}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari rekening, debitur, mantri, atau produk" className="pl-9" />
        </div>
        <TableTools
          columns={nominatifColumnOptions}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
          onExportCsv={() => exportRowsCsv(`nominatif-${month}.csv`, exportHeaders, exportData)}
          onExportXls={() => exportRowsXls(`nominatif-${month}.xls`, exportHeaders, exportData)}
        />
      </div>
      <TableShell>
        <thead>
          <tr>
            {visible("account") ? <Th>No Rekening Nasabah</Th> : null}
            {visible("name") ? <Th>Nama Debitur</Th> : null}
            {visible("nextPayment") ? <Th>Next Payment Date</Th> : null}
            {visible("outstanding") ? <Th>Outstanding</Th> : null}
            {visible("quality") ? <Th>Kolektibilitas</Th> : null}
            {visible("product") ? <Th>Produk</Th> : null}
            {visible("mantri") ? <Th>Mantri</Th> : null}
            {visible("realization") ? <Th>Tanggal Realisasi</Th> : null}
          </tr>
        </thead>
        <tbody>
          {pagination.pagedRows.map((item) => {
            const bucket = classifyQuality(item, month);
            return (
              <tr key={item.accountNumber} className={cn(isNpl(bucket) && "bg-rose-50/70", isSml(bucket) && "bg-[#f37021]/5")}>
                {visible("account") ? <Td className="font-medium">{item.accountNumber}</Td> : null}
                {visible("name") ? (
                  <Td>
                    <button type="button" onClick={() => setSelectedCustomer(item)} className="inline-flex items-center gap-2 font-bold text-[#00529c] hover:underline">
                      {item.debtorName}
                      {item.realizedDate.startsWith(month) ? <NewBadge /> : null}
                    </button>
                  </Td>
                ) : null}
                {visible("nextPayment") ? <Td>{dateLabel(item.nextPaymentDate)}</Td> : null}
                {visible("outstanding") ? <Td>{formatCurrency(item.outstanding)}</Td> : null}
                {visible("quality") ? <Td><QualityBadge bucket={bucket} /></Td> : null}
                {visible("product") ? <Td>{getProductType(item.description, item.loanType)}</Td> : null}
                {visible("mantri") ? <Td>{item.mantri}</Td> : null}
                {visible("realization") ? <Td>{dateLabel(item.realizedDate)}</Td> : null}
              </tr>
            );
          })}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      {selectedCustomer ? (
        <CustomerQuickPanel
          customer={selectedCustomer}
          month={month}
          brimen={brimenMap.get(normalizeAccount(selectedCustomer.accountNumber))}
          onClose={() => setSelectedCustomer(undefined)}
        />
      ) : null}
    </div>
  );
}

function CustomerQuickPanel({
  customer,
  month,
  brimen,
  onClose,
}: {
  customer: ReturnType<typeof getSnapshots>[number];
  month: MonthKey;
  brimen?: BrimenCustomer;
  onClose: () => void;
}) {
  const bucket = classifyQuality(customer, month);
  const previousMonth = getPreviousMonth(month);
  const previousCustomer = previousMonth ? getSnapshots(previousMonth).find((item) => item.accountNumber === customer.accountNumber) : undefined;
  const previousBucket = previousCustomer && previousMonth ? classifyQuality(previousCustomer, previousMonth) : undefined;
  const movement = previousBucket ? getQualityMovement(previousBucket, bucket) : "Tetap";
  const timeline = [
    { date: dateLabel(customer.realizedDate), title: "Realisasi Pinjaman", detail: `Plafond ${formatCurrency(customer.plafond)}`, tone: "blue" },
    ...(previousBucket ? [{ date: getMonthLabel(previousMonth as MonthKey), title: `Kolektibilitas ${previousBucket}`, detail: `Posisi OS ${formatCurrency(previousCustomer?.outstanding ?? 0)}`, tone: "slate" }] : []),
    { date: getMonthLabel(month), title: `${movement} menjadi ${bucket}`, detail: `Outstanding terbaru ${formatCurrency(customer.outstanding)}`, tone: movement === "Downgrade" ? "red" : movement === "Upgrade" ? "green" : "blue" },
    ...(brimen ? [{ date: brimen.updatedAt || "Data BRIMEN", title: getBrimenStatusLabel(brimen.status, brimen), detail: `Lokasi berkas ${shortText(brimen.brimenBerkas)}`, tone: brimen.status === "Dipinjam" ? "orange" : "green" }] : []),
    { date: dateLabel(customer.nextPaymentDate), title: "Next Payment Date", detail: "Jadwal pembayaran berikutnya", tone: "orange" },
  ];
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/35" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d7e3ef] bg-[#00529c] px-5 py-4 text-white">
          <div>
            <p className="text-xs font-bold uppercase text-[#ffd2b5]">Detail Cepat Nasabah</p>
            <h2 className="mt-1 text-lg font-black">{customer.debtorName}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">No Rekening</p>
            <p className="mt-1 font-black text-[#00529c]">{customer.accountNumber}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <QualityBadge bucket={bucket} />
              <BrimenStatusBadge status={brimen?.status} row={brimen} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Outstanding" value={formatCurrency(customer.outstanding)} />
            <InfoItem label="Plafond" value={formatCurrency(customer.plafond)} />
            <InfoItem label="Mantri" value={customer.mantri} />
            <InfoItem label="Produk" value={getProductType(customer.description, customer.loanType)} />
            <InfoItem label="Next Payment" value={dateLabel(customer.nextPaymentDate)} />
            <InfoItem label="Tanggal Realisasi" value={dateLabel(customer.realizedDate)} />
          </div>
          <div className="rounded-lg border border-[#f7c9aa] bg-[#fff7ed] p-4">
            <p className="text-xs font-black uppercase text-[#b54b00]">Lokasi BRIMEN</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <InfoItem label="Berkas" value={shortText(brimen?.brimenBerkas ?? "")} />
              <InfoItem label="Jaminan" value={shortText(brimen?.brimenJaminan ?? "")} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-[#00529c]" /><p className="text-xs font-black uppercase text-[#00529c]">Timeline Nasabah</p></div>
            <div className="relative ml-2 mt-4 border-l-2 border-[#d7e3ef] pl-5">
              {timeline.map((item, index) => (
                <div key={`${item.title}-${index}`} className="relative pb-5 last:pb-0">
                  <span className={cn("absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2", item.tone === "red" ? "bg-rose-600 ring-rose-200" : item.tone === "orange" ? "bg-[#f37021] ring-orange-200" : item.tone === "green" ? "bg-emerald-600 ring-emerald-200" : item.tone === "slate" ? "bg-slate-500 ring-slate-200" : "bg-[#00529c] ring-sky-200")} />
                  <p className="text-xs font-semibold text-muted-foreground">{item.date}</p><p className="mt-1 font-bold text-[#004077]">{item.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <Button type="button" className="w-full" onClick={onClose}>Tutup Detail</Button>
        </div>
      </aside>
    </div>
  );
}

const kualitasColumnOptions: ColumnOption[] = [
  { key: "account", label: "No Rekening" },
  { key: "name", label: "Nama Debitur" },
  { key: "mantri", label: "Mantri" },
  { key: "outstanding", label: "Outstanding" },
  { key: "nextPayment", label: "Next Payment Date" },
  { key: "previous", label: "Kolek Bulan Lalu" },
  { key: "latest", label: "Kolek Terbaru" },
  { key: "movement", label: "Perubahan Status" },
  { key: "deltaCkpn", label: "Delta CKPN" },
];

function KualitasView({
  month,
  qualityFilter,
  setQualityFilter,
  mantriFilter,
  productFilter,
}: {
  month: MonthKey;
  qualityFilter: string;
  setQualityFilter: (value: string) => void;
  mantriFilter: string;
  productFilter: string;
}) {
  const [qualitySearch, setQualitySearch] = useState("");
  const [savingResolution, setSavingResolution] = useState("");
  const [resolutionMessage, setResolutionMessage] = useState("");
  const [resolutionVersion, setResolutionVersion] = useState(0);
  const deferredQualitySearch = useDeferredValue(qualitySearch);
  const { visibleColumns, toggleColumn } = usePersistentColumns("britoel-columns-kualitas-v2", kualitasColumnOptions);
  const visible = (key: string) => visibleColumns.includes(key);
  const sourceMonth = month;
  const comparisonMonth = getPreviousMonth(sourceMonth);
  const baseRows = useMemo(() => {
    const actualCkpnByAccount = new Map(
      getCkpnRows(sourceMonth).map((item) => [normalizeAccount(item.accountNumber), item]),
    );
    const latestRows = getSnapshots(sourceMonth).map((item) => {
      const latestBucket = classifyQuality(item, sourceMonth);
      const previous = comparisonMonth ? getCompareSnapshot(comparisonMonth, item.accountNumber) : undefined;
      const previousBucket = previous && comparisonMonth ? classifyQuality(previous, comparisonMonth) : "-";
      const movement = getQualityMovement(previousBucket, latestBucket);
      return { ...item, latestBucket, previousBucket, movement, missingLatest: false };
    });
    const latestAccounts = new Set(latestRows.map((item) => normalizeAccount(item.accountNumber)));
    const missingRows = comparisonMonth ? getSnapshots(comparisonMonth)
      .filter((item) => !latestAccounts.has(normalizeAccount(item.accountNumber)))
      .map((item) => {
        const previousBucket = classifyQuality(item, comparisonMonth);
        const latestBucket = getMissingLoanDisplayStatus(sourceMonth, item);
        return {
          ...item,
          month: sourceMonth,
          previousBucket,
          latestBucket,
          movement: getQualityMovement(previousBucket, latestBucket),
          missingLatest: true,
        };
      }) : [];
    return [...latestRows, ...missingRows]
      .map((item) => ({ ...item, actualCkpn: actualCkpnByAccount.get(normalizeAccount(item.accountNumber)) }));
  }, [comparisonMonth, resolutionVersion, sourceMonth]);
  const rows = useMemo(() => {
    const searchValue = deferredQualitySearch.trim().toLowerCase();
    return baseRows.filter((item) => {
      const searchMatch = !searchValue ||
        item.accountNumber.toLowerCase().includes(searchValue) ||
        item.debtorName.toLowerCase().includes(searchValue) ||
        item.mantri.toLowerCase().includes(searchValue) ||
        item.description.toLowerCase().includes(searchValue) ||
        getProductType(item.description, item.loanType).toLowerCase().includes(searchValue);
      const qualityMatch =
        qualityFilter === "Semua" ||
        (qualityFilter === "PL" && item.previousBucket !== "-" && isPl(item.previousBucket)) ||
        (qualityFilter === "NPL" && item.previousBucket !== "-" && isNpl(item.previousBucket)) ||
        item.previousBucket === qualityFilter;
      return searchMatch && qualityMatch &&
        (mantriFilter === "Semua" || item.mantri === mantriFilter) &&
        (productFilter === "Semua" || getProductType(item.description, item.loanType) === productFilter);
    });
  }, [baseRows, deferredQualitySearch, mantriFilter, productFilter, qualityFilter]);
  const filteredOutstanding = rows.reduce((total, item) => total + item.outstanding, 0);
  const filteredDebtors = new Set(
    rows.map((item) => item.cif?.trim() || item.debtorName.trim().toUpperCase() || normalizeAccount(item.accountNumber)),
  ).size;
  const filteredCkpn = rows.reduce((total, item) => total + (item.actualCkpn?.ckpnImpact ?? 0), 0);
  const filteredCkpnAddition = rows.reduce((total, item) => total + Math.max(0, item.actualCkpn?.ckpnImpact ?? 0), 0);
  const filteredCkpnRecovery = rows.reduce((total, item) => total + Math.abs(Math.min(0, item.actualCkpn?.ckpnImpact ?? 0)), 0);
  const pagination = useTablePagination(rows, `${sourceMonth}-${qualityFilter}-${mantriFilter}-${productFilter}-${deferredQualitySearch}-${rows.length}-${resolutionVersion}`);
  const exportHeaders = kualitasColumnOptions.filter((column) => visible(column.key)).map((column) => column.label);
  const exportData = rows.map((item) => {
    const values: Record<string, string | number> = {
      account: item.accountNumber,
      name: item.debtorName,
      mantri: item.mantri,
      outstanding: item.outstanding,
      nextPayment: dateLabel(item.nextPaymentDate),
      previous: item.previousBucket,
      latest: item.latestBucket,
      movement: item.movement,
      deltaCkpn: item.actualCkpn?.missingLatest && !item.actualCkpn.resolutionStatus
        ? "Menunggu pilihan"
        : item.actualCkpn?.ckpnImpact ?? 0,
    };
    return visibleColumns.map((key) => values[key]);
  });

  async function saveMissingResolution(accountNumber: string, status: "PH" | "Lunas") {
    setSavingResolution(accountNumber);
    setResolutionMessage("");
    try {
      const response = await fetch("/api/loan-resolutions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, period: sourceMonth, status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Status rekening belum dapat disimpan.");
      setMissingLoanResolution(sourceMonth, accountNumber, status);
      setResolutionVersion((current) => current + 1);
      setResolutionMessage(`Status rekening ${accountNumber} berhasil disimpan sebagai ${status}.`);
    } catch (error) {
      setResolutionMessage(error instanceof Error ? error.message : "Status rekening belum dapat disimpan.");
    } finally {
      setSavingResolution("");
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Nominatif per Kualitas"
        description={`Perubahan status dihitung dari kolektibilitas bulan lalu ${getMonthLabel(comparisonMonth ?? sourceMonth)} ke posisi terbaru ${getMonthLabel(sourceMonth)}.`}
        icon={Layers3}
      />
      <div className="grid gap-3 md:grid-cols-[minmax(240px,0.8fr)_minmax(280px,1fr)_auto] md:items-end">
        <Field label={`Filter Kolektibilitas Bulan Lalu ${getMonthLabel(comparisonMonth ?? sourceMonth)}`}>
          <Select value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value)} className="min-w-64">
            {qualityOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cari Nominatif Kualitas">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00529c]" />
            <Input
              value={qualitySearch}
              onChange={(event) => setQualitySearch(event.target.value)}
              placeholder="No rekening, nama, mantri, atau produk..."
              className="pl-9"
            />
          </div>
        </Field>
        <div className="md:justify-self-end">
          <TableTools
            columns={kualitasColumnOptions}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onExportCsv={() => exportRowsCsv(`nominatif-kualitas-${sourceMonth}.csv`, exportHeaders, exportData)}
            onExportXls={() => exportRowsXls(`nominatif-kualitas-${sourceMonth}.xls`, exportHeaders, exportData)}
          />
        </div>
      </div>
      {resolutionMessage ? <p className="rounded-md border border-[#b8d8f2] bg-[#eef7ff] px-3 py-2 text-sm font-semibold text-[#00529c]">{resolutionMessage}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Jumlah OS"
          value={formatCurrency(filteredOutstanding)}
          helper={`${qualityFilter === "Semua" ? "Semua kolektibilitas bulan lalu" : `Kolektibilitas ${qualityFilter} bulan lalu`}`}
          icon={Banknote}
        />
        <MetricCard
          label="Jumlah Debitur"
          value={formatNumber(filteredDebtors)}
          helper={`${formatNumber(rows.length)} rekening sesuai filter`}
          tone="warning"
          icon={UsersRound}
        />
        <MetricCard
          label="Biaya CKPN"
          value={formatCurrency(filteredCkpn)}
          helper={`Downgrade ${formatCurrency(filteredCkpnAddition)} | Upgrade ${formatCurrency(filteredCkpnRecovery)}`}
          tone={filteredCkpn > 0 ? "danger" : "success"}
          icon={PieChartIcon}
        />
      </div>
      <TableShell>
        <thead>
          <tr>
            {visible("account") ? <Th>No Rekening</Th> : null}
            {visible("name") ? <Th>Nama Debitur</Th> : null}
            {visible("mantri") ? <Th>Mantri</Th> : null}
            {visible("outstanding") ? <Th>Outstanding</Th> : null}
            {visible("nextPayment") ? <Th>Next Payment Date</Th> : null}
            {visible("previous") ? <Th>Kolek Bulan Lalu</Th> : null}
            {visible("latest") ? <Th>Kolek Terbaru</Th> : null}
            {visible("movement") ? <Th>Perubahan Status</Th> : null}
            {visible("deltaCkpn") ? <Th>Delta CKPN</Th> : null}
          </tr>
        </thead>
        <tbody>
          {pagination.pagedRows.map((item) => (
            <tr key={item.accountNumber} className={cn(isNpl(item.latestBucket) && "bg-rose-50/70", isSml(item.latestBucket) && "bg-[#f37021]/5")}>
              {visible("account") ? <Td className="font-medium">{item.accountNumber}</Td> : null}
              {visible("name") ? <Td><span className="inline-flex items-center gap-2">{item.debtorName}{item.movement !== "Tetap" ? <NewBadge /> : null}</span></Td> : null}
              {visible("mantri") ? <Td>{item.mantri}</Td> : null}
              {visible("outstanding") ? <Td>{formatCurrency(item.outstanding)}</Td> : null}
              {visible("nextPayment") ? <Td>{dateLabel(item.nextPaymentDate)}</Td> : null}
              {visible("previous") ? <Td>{typeof item.previousBucket === "string" && item.previousBucket !== "-" ? <QualityBadge bucket={item.previousBucket} /> : "-"}</Td> : null}
              {visible("latest") ? (
                <Td>
                  {item.missingLatest && item.previousBucket === "Macet" ? (
                    <Select
                      value={item.actualCkpn?.resolutionStatus ?? ""}
                      disabled={savingResolution === item.accountNumber}
                      onChange={(event) => event.target.value && saveMissingResolution(item.accountNumber, event.target.value as "PH" | "Lunas")}
                      className="h-9 min-w-36"
                    >
                      <option value="">Pilih PH / Lunas</option>
                      <option value="PH">PH</option>
                      <option value="Lunas">Lunas</option>
                    </Select>
                  ) : <QualityBadge bucket={item.latestBucket} />}
                </Td>
              ) : null}
              {visible("movement") ? <Td><MovementBadge movement={item.movement} /></Td> : null}
              {visible("deltaCkpn") ? (
                <Td className={cn("font-bold", (item.actualCkpn?.ckpnImpact ?? 0) > 0 ? "text-rose-700" : (item.actualCkpn?.ckpnImpact ?? 0) < 0 ? "text-emerald-700" : "text-slate-600")}>
                  {item.actualCkpn?.missingLatest && !item.actualCkpn.resolutionStatus
                    ? "Menunggu pilihan"
                    : formatCurrency(item.actualCkpn?.ckpnImpact ?? 0)}
                </Td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

type DisplayQuality = QualityBucket | "Lunas" | "PH" | "Perlu Konfirmasi";
type QualityMovement = "Upgrade" | "Downgrade" | "Tetap";

const qualityRanks: Record<DisplayQuality, number> = {
  Lunas: -1,
  Lancar: 0,
  LR: 1,
  SML1: 2,
  SML2: 3,
  SML3: 4,
  KL: 5,
  Diragukan: 6,
  Macet: 7,
  PH: 8,
  "Perlu Konfirmasi": 7,
};

function getQualityMovement(previous: DisplayQuality | "-", latest: DisplayQuality): QualityMovement {
  if (previous === "-" || latest === "Perlu Konfirmasi" || qualityRanks[previous] === qualityRanks[latest]) return "Tetap";
  return qualityRanks[latest] < qualityRanks[previous] ? "Upgrade" : "Downgrade";
}

function MovementBadge({ movement }: { movement: QualityMovement }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-black",
        movement === "Upgrade" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        movement === "Downgrade" && "border-rose-200 bg-rose-50 text-rose-700",
        movement === "Tetap" && "border-sky-200 bg-sky-50 text-sky-700",
      )}
    >
      {movement === "Upgrade" ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
      {movement === "Downgrade" ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
      {movement === "Tetap" ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> : null}
      {movement}
    </span>
  );
}

type PortfolioPosition = { os: number; sml: number; npl: number };

function getPortfolioPosition(row?: ReturnType<typeof getMantriRecap>[number]): PortfolioPosition {
  if (!row) return { os: 0, sml: 0, npl: 0 };
  return {
    os: row.totalOs,
    sml: row.SML1.os + row.SML2.os + row.SML3.os,
    npl: row.KL.os + row.Diragukan.os + row.Macet.os,
  };
}

function PositionCell({ position }: { position: PortfolioPosition }) {
  return (
    <div className="min-w-[190px] space-y-1.5">
      <div className="flex items-center justify-between gap-3 rounded-md bg-[#eaf3fb] px-2.5 py-1.5">
        <span className="text-[10px] font-black uppercase text-[#00529c]">OS</span>
        <span className="font-bold text-[#004077]">{formatCurrency(position.os)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md bg-[#fff7ed] px-2.5 py-1.5">
        <span className="text-[10px] font-black uppercase text-[#b54b00]">SML</span>
        <span className="font-bold text-[#b54b00]">{formatCurrency(position.sml)}</span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md bg-rose-50 px-2.5 py-1.5">
        <span className="text-[10px] font-black uppercase text-rose-700">NPL</span>
        <span className="font-bold text-rose-700">{formatCurrency(position.npl)}</span>
      </div>
    </div>
  );
}

function PortfolioDeltaCell({ delta }: { delta: PortfolioPosition }) {
  const items = [
    { label: "OS", value: delta.os, risk: false },
    { label: "SML", value: delta.sml, risk: true },
    { label: "NPL", value: delta.npl, risk: true },
  ];

  return (
    <div className="min-w-[190px] space-y-1.5">
      {items.map((item) => {
        const favorable = item.risk ? item.value < 0 : item.value > 0;
        const unfavorable = item.risk ? item.value > 0 : item.value < 0;
        return (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5",
              favorable && "border-emerald-200 bg-emerald-50 text-emerald-700",
              unfavorable && "border-rose-200 bg-rose-50 text-rose-700",
              !item.value && "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            <span className="text-[10px] font-black uppercase">{item.label}</span>
            <span className="flex items-center gap-1 font-bold">
              {item.value > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
              {item.value < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
              {item.value > 0 ? "+" : ""}{formatCurrency(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RekapView({ month, mantriFilter, onSelectMantri }: { month: MonthKey; mantriFilter: string; onSelectMantri: (mantri: string) => void }) {
  const rows = getMantriRecap(month).filter((row) => mantriFilter === "Semua" || row.mantri === mantriFilter);
  const monthlyCkpnDeltaByMantri = getMonthlyCkpnDeltaByMantri(month);
  const previousMonth = getPreviousMonth(month);
  const yearEndComparisonMonth = getYearEndComparisonMonth(month);
  const previousRecap = new Map(
    (previousMonth ? getMantriRecap(previousMonth) : []).map((row) => [row.mantri, row]),
  );
  const yearEndRecap = new Map(getMantriRecap(yearEndComparisonMonth).map((row) => [row.mantri, row]));
  const rowsWithDelta = rows.map((row) => {
    const latest = getPortfolioPosition(row);
    const yearEnd = getPortfolioPosition(yearEndRecap.get(row.mantri));
    const previous = getPortfolioPosition(previousRecap.get(row.mantri));
    return {
      ...row,
      monthlyCkpnDelta: monthlyCkpnDeltaByMantri.get(row.mantri) ?? { amount: 0, accountCount: 0 },
      latest,
      yearEnd,
      previous,
      ytd: {
        os: latest.os - yearEnd.os,
        sml: latest.sml - yearEnd.sml,
        npl: latest.npl - yearEnd.npl,
      },
      mtd: {
        os: latest.os - previous.os,
        sml: latest.sml - previous.sml,
        npl: latest.npl - previous.npl,
      },
    };
  });
  const pagination = useTablePagination(rowsWithDelta, `${month}-${mantriFilter}-${rowsWithDelta.length}`);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Rekap Pencapaian Mantri"
        description="Perbandingan posisi OS, SML, dan NPL serta Delta CKPN yang terjadi pada bulan berjalan per mantri."
        icon={BarChart3}
      />
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">YTD: terbaru dibanding posisi akhir tahun</Badge>
        <Badge variant="outline">MTD: dibanding akhir bulan lalu</Badge>
        <Badge variant="secondary">Posisi akhir tahun: {getMonthLabel(yearEndComparisonMonth)}</Badge>
      </div>
      <TableShell minWidth="min-w-[1480px]">
        <thead>
          <tr>
            <Th>Mantri</Th>
            <Th>Posisi Akhir Tahun</Th>
            <Th>Posisi Bulan Lalu</Th>
            <Th>Posisi Terbaru</Th>
            <Th>Delta YTD</Th>
            <Th>Delta MTD</Th>
            <Th>Delta CKPN Bulan Berjalan</Th>
          </tr>
        </thead>
        <tbody>
          {pagination.pagedRows.map((row) => (
            <tr key={row.mantri}>
              <Td>
                <button className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => onSelectMantri(row.mantri)}>
                  {row.mantri}
                </button>
              </Td>
              <Td><PositionCell position={row.yearEnd} /></Td>
              <Td><PositionCell position={row.previous} /></Td>
              <Td><PositionCell position={row.latest} /></Td>
              <Td><PortfolioDeltaCell delta={row.ytd} /></Td>
              <Td><PortfolioDeltaCell delta={row.mtd} /></Td>
              <Td>
                <div className={cn(
                  "min-w-[190px] rounded-md border px-3 py-2.5",
                  row.monthlyCkpnDelta.amount > 0
                    ? "border-rose-200 bg-rose-50"
                    : row.monthlyCkpnDelta.amount < 0
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50",
                )}>
                  <p className={cn("text-[10px] font-black uppercase", row.monthlyCkpnDelta.amount > 0 ? "text-rose-700" : row.monthlyCkpnDelta.amount < 0 ? "text-emerald-700" : "text-slate-600")}>Delta Bulan Berjalan</p>
                  <p className={cn("metric-value mt-1 text-base font-black", row.monthlyCkpnDelta.amount > 0 ? "text-rose-800" : row.monthlyCkpnDelta.amount < 0 ? "text-emerald-800" : "text-slate-700")}>{formatCurrency(row.monthlyCkpnDelta.amount)}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{formatNumber(row.monthlyCkpnDelta.accountCount)} rekening bergerak</p>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={rowsWithDelta.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

function RealisasiView({ month, mantriFilter }: { month: MonthKey; mantriFilter: string }) {
  const rows = getRealisasiRows(month).filter((row) => mantriFilter === "Semua" || row.mantri === mantriFilter);
  const total = rows.reduce((sum, item) => sum + item.total, 0);
  const count = rows.reduce((sum, item) => sum + item.count, 0);
  const average = count ? total / count : 0;
  const topMantri = rows[0];
  const maxTotal = Math.max(...rows.map((item) => item.total), 1);
  const pagination = useTablePagination(rows, `${month}-${mantriFilter}-${rows.length}`);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Realisasi Mantri"
        description="Nominal dan jumlah rekening realisasi berdasarkan tanggal realisasi pada bulan terpilih."
        icon={TrendingUp}
      />
      <section className="overflow-hidden rounded-lg bg-[#00529c] text-white shadow-[0_12px_28px_rgba(0,82,156,0.2)]">
        <div className="h-1.5 bg-[#f37021]" />
        <div className="grid divide-y divide-white/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <div className="p-5"><p className="text-xs font-black uppercase text-white/65">Total Realisasi</p><p className="mt-2 text-2xl font-black">{formatCurrency(total)}</p><p className="mt-1 text-xs font-semibold text-white/70">Posisi {getMonthLabel(month)}</p></div>
          <div className="p-5"><p className="text-xs font-black uppercase text-white/65">Jumlah Rekening</p><p className="mt-2 text-2xl font-black">{formatNumber(count)}</p><p className="mt-1 text-xs font-semibold text-white/70">Rekening terealisasi</p></div>
          <div className="p-5"><p className="text-xs font-black uppercase text-white/65">Rata-rata per Rekening</p><p className="mt-2 text-2xl font-black">{formatCurrency(average)}</p><p className="mt-1 text-xs font-semibold text-white/70">Nominal rata-rata realisasi</p></div>
          <div className="bg-[#004077] p-5"><p className="text-xs font-black uppercase text-[#ffd2b5]">Mantri Tertinggi</p><p className="mt-2 truncate text-lg font-black">{topMantri?.mantri ?? "-"}</p><p className="mt-1 text-xs font-semibold text-white/70">{topMantri ? formatCurrency(topMantri.total) : "Belum ada realisasi"}</p></div>
        </div>
      </section>

      <section className="rounded-lg border border-[#d7e3ef] bg-white p-4 shadow-[0_8px_22px_rgba(0,55,105,0.06)] sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase text-[#f37021]">Perbandingan Kinerja</p><h2 className="mt-1 text-lg font-black text-[#00529c]">Realisasi per Mantri</h2></div>
          <p className="text-xs font-semibold text-muted-foreground">Urutan berdasarkan nominal terbesar</p>
        </div>
        {rows.length ? (
          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 12, bottom: 4 }}>
                <defs>
                  <linearGradient id="realizationBlue3d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d9cda" /><stop offset="50%" stopColor="#00529c" /><stop offset="100%" stopColor="#003765" />
                  </linearGradient>
                  <linearGradient id="realizationGreen3d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#54d5c5" /><stop offset="50%" stopColor="#0f9f8f" /><stop offset="100%" stopColor="#087064" />
                  </linearGradient>
                  <linearGradient id="realizationOrange3d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffad73" /><stop offset="50%" stopColor="#f37021" /><stop offset="100%" stopColor="#a8430d" />
                  </linearGradient>
                  <filter id="realizationBarShadow" x="-20%" y="-40%" width="150%" height="190%">
                    <feDropShadow dx="5" dy="4" stdDeviation="3" floodColor="#003765" floodOpacity="0.25" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d7e3ef" />
                <XAxis type="number" tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="mantri" width={175} tick={{ fontSize: 11, fill: "#004077" }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: "#eef7ff" }} />
                <Bar dataKey="total" fill="url(#realizationBlue3d)" radius={[2, 7, 7, 2]} barSize={24} style={{ filter: "url(#realizationBarShadow)" }}>
                  {rows.map((row, index) => <Cell key={row.mantri} fill={index === 0 ? "url(#realizationOrange3d)" : index % 2 ? "url(#realizationGreen3d)" : "url(#realizationBlue3d)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState title="Belum ada realisasi" description={`Tidak ada realisasi pada ${getMonthLabel(month)} untuk filter terpilih.`} icon={TrendingUp} />}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eaf3fb]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#00529c,#0f9f8f,#f37021)]" style={{ width: `${total ? 100 : 0}%` }} />
        </div>
      </section>

      <TableShell minWidth="min-w-[820px]">
        <thead>
          <tr>
            <Th>Peringkat</Th>
            <Th>Mantri</Th>
            <Th>Nominal Realisasi</Th>
            <Th>Kontribusi</Th>
            <Th>Jumlah Debitur/Rekening</Th>
            <Th>Rata-rata/Rekening</Th>
          </tr>
        </thead>
        <tbody>
          {pagination.pagedRows.map((row, index) => (
            <tr key={row.mantri}>
              <Td><span className={cn("grid h-8 w-8 place-items-center rounded-md text-xs font-black", pagination.page === 1 && index === 0 ? "bg-[#f37021] text-white" : "bg-[#eaf3fb] text-[#00529c]")}>{(pagination.page - 1) * pagination.pageSize + index + 1}</span></Td>
              <Td className="font-bold text-[#004077]">{row.mantri}</Td>
              <Td className="font-black text-[#00529c]">{formatCurrency(row.total)}</Td>
              <Td><div className="min-w-32"><div className="flex justify-between text-xs font-bold"><span>{formatPercent(total ? (row.total / total) * 100 : 0)}</span><span className="text-muted-foreground">dari total</span></div><div className="mt-1.5 h-2 rounded-full bg-[#eaf3fb]"><div className="h-2 rounded-full bg-[#0f9f8f]" style={{ width: `${(row.total / maxTotal) * 100}%` }} /></div></div></Td>
              <Td>{formatNumber(row.count)}</Td>
              <Td>{formatCurrency(row.count ? row.total / row.count : 0)}</Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

type ArrearsBand = "Semua" | "Tucil";

type WarningLetterRecord = {
  id: string;
  period: string;
  accountNumber: string;
  debtorName: string;
  level: "SP1" | "SP2" | "SP3";
  letterNumber: string;
  issuedAt: string;
  dueDate: string;
  recipientAddress: string;
  penalty: number;
  signerName: string;
  signerTitle: string;
  status: string;
};

type WarningLetterForm = Omit<WarningLetterRecord, "id" | "period" | "accountNumber" | "debtorName" | "status">;

function TunggakanView({
  month,
  mantri,
  setMantri,
  mantriNames,
  branchCode,
  branchName,
}: {
  month: MonthKey;
  mantri: string;
  setMantri: (value: string) => void;
  mantriNames: string[];
  branchCode: string;
  branchName: string;
}) {
  const [arrearsBand, setArrearsBand] = useState<ArrearsBand>("Semua");
  const [warningLetters, setWarningLetters] = useState<WarningLetterRecord[]>([]);
  const [warningCustomer, setWarningCustomer] = useState<ReturnType<typeof getArrearsRows>[number]>();
  const [completedWarning, setCompletedWarning] = useState<WarningLetterRecord>();
  const [warningMessage, setWarningMessage] = useState("");
  const [savingWarning, setSavingWarning] = useState(false);
  const [warningForm, setWarningForm] = useState<WarningLetterForm>({
    level: "SP1",
    letterNumber: "",
    issuedAt: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    recipientAddress: "di Tempat",
    penalty: 0,
    signerName: "",
    signerTitle: "Kepala Unit",
  });
  const allRows = getArrearsRows(month);
  const matchesBand = (total: number, band: ArrearsBand) =>
    band === "Semua" ||
    (band === "Tucil" && total < 100_000);
  const segmentedRows = allRows.filter((item) => matchesBand(item.totalArrears, arrearsBand));
  const rows = segmentedRows.filter((item) => mantri === "Semua" || item.mantri === mantri);
  const mantriRecap = [...segmentedRows.reduce((map, item) => {
    const current = map.get(item.mantri) ?? { mantri: item.mantri, debtors: new Set<string>(), outstanding: 0 };
    current.debtors.add(item.cif?.trim() || item.debtorName.trim().toUpperCase() || item.accountNumber);
    current.outstanding += item.outstanding;
    map.set(item.mantri, current);
    return map;
  }, new Map<string, { mantri: string; debtors: Set<string>; outstanding: number }>()).values()]
    .map((item) => ({ ...item, debtorCount: item.debtors.size }))
    .sort((a, b) => b.outstanding - a.outstanding);
  const pagination = useTablePagination(rows, `${month}-${arrearsBand}-${mantri}-${rows.length}`);
  const exportHeaders = ["No Rekening", "Nama Debitur", "Mantri", "Outstanding", "Kolektibilitas", "Total Tunggakan (Pokok + Bunga)"];
  const exportData = rows.map((item) => [
    item.accountNumber,
    item.debtorName,
    item.mantri,
    item.outstanding,
    classifyQuality(item, month),
    item.totalArrears,
  ]);
  const warningHistoryByAccount = new Map<string, WarningLetterRecord[]>();
  warningLetters.forEach((item) => {
    const key = normalizeAccount(item.accountNumber);
    warningHistoryByAccount.set(key, [...(warningHistoryByAccount.get(key) ?? []), item]);
  });
  const warningLevelOrder = { SP1: 1, SP2: 2, SP3: 3 } as const;
  warningHistoryByAccount.forEach((items) => items.sort((a, b) => warningLevelOrder[a.level] - warningLevelOrder[b.level]));

  useEffect(() => {
    fetch(`/api/warning-letters?period=${encodeURIComponent(month)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => { if (payload.ok) setWarningLetters(payload.data ?? []); })
      .catch(() => undefined);
  }, [month]);

  function getWarningLevelLabel(level: WarningLetterForm["level"]) {
    return level === "SP1" ? "Surat Peringatan Pertama" : level === "SP2" ? "Surat Peringatan Kedua" : "Surat Peringatan Ketiga";
  }

  function buildWarningForm(customer: ReturnType<typeof getArrearsRows>[number], level: WarningLetterForm["level"]): WarningLetterForm {
    const existing = warningLetters.find((item) => normalizeAccount(item.accountNumber) === normalizeAccount(customer.accountNumber) && item.level === level);
    if (existing) return {
      level,
      letterNumber: existing.letterNumber,
      issuedAt: existing.issuedAt,
      dueDate: existing.dueDate,
      recipientAddress: "di Tempat",
      penalty: existing.penalty,
      signerName: existing.signerName,
      signerTitle: existing.signerTitle,
    };
    const issueDate = new Date();
    const monthCode = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(issueDate).replace(".", "");
    const sequence = String(warningLetters.length + 1).padStart(4, "0");
    return {
      level,
      letterNumber: `${sequence}/${level}/${branchCode}/${monthCode}/${issueDate.getFullYear()}`,
      issuedAt: issueDate.toISOString().slice(0, 10),
      dueDate: new Date(issueDate.getTime() + 3 * 86_400_000).toISOString().slice(0, 10),
      recipientAddress: "di Tempat",
      penalty: 0,
      signerName: "",
      signerTitle: "Kepala Unit",
    };
  }

  function openWarningDialog(customer: ReturnType<typeof getArrearsRows>[number]) {
    const issuedLevels = new Set(warningLetters.filter((item) => normalizeAccount(item.accountNumber) === normalizeAccount(customer.accountNumber)).map((item) => item.level));
    const nextLevel: WarningLetterForm["level"] = !issuedLevels.has("SP1") ? "SP1" : !issuedLevels.has("SP2") ? "SP2" : "SP3";
    setWarningCustomer(customer);
    setCompletedWarning(undefined);
    setWarningForm(buildWarningForm(customer, nextLevel));
    setWarningMessage("");
  }

  function printWarningLetter(printWindow: Window, record: WarningLetterRecord, customer: ReturnType<typeof getArrearsRows>[number]) {
    const escapeHtml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const dateText = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
    const briLogoUrl = `${window.location.origin}/brand/bri-symbol.svg`;
    const previousLevels = record.level === "SP1" ? [] : record.level === "SP2" ? ["SP1"] : ["SP1", "SP2"];
    const previousReferences = previousLevels.map((level) => warningLetters.find((item) => normalizeAccount(item.accountNumber) === normalizeAccount(customer.accountNumber) && item.level === level)).filter(Boolean) as WarningLetterRecord[];
    const totalObligation = customer.totalArrears + record.penalty;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(record.level)} - ${escapeHtml(customer.debtorName)}</title><style>
      @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;font-size:12px;line-height:1.45;margin:0}.head{display:grid;grid-template-columns:82px 1fr 82px;align-items:center;border-bottom:3px solid #00529c;padding-bottom:14px}.logo{display:grid;place-items:center;width:64px;height:58px}.logo img{display:block;width:58px;height:58px;object-fit:contain}.bank{text-align:center}.bank h1{font-size:17px;margin:0;color:#003f78}.bank p{margin:4px 0 0;font-weight:700;color:#00529c}.meta{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:22px}.meta table td{padding:2px 5px;vertical-align:top}.meta strong,.recipient strong{color:#00529c}.recipient{padding-left:20px}.refs{margin:25px 0 14px;padding-bottom:12px;border-bottom:1px solid #777}.body-copy{text-align:justify}.loan{width:100%;border-collapse:collapse;margin:18px 0;background:#fff}.loan th,.loan td{border:1px solid #222;background:#fff;padding:9px 6px;text-align:center;color:#111;font-size:12px;font-weight:700}.loan th{font-size:11px;font-weight:800}.sign{margin-top:28px;margin-left:auto;width:310px;text-align:center}.sign-space{height:72px}.small{font-size:10px}.copies{margin-top:45px}.print-actions{position:fixed;right:18px;top:18px}@media print{.print-actions{display:none}}
    </style></head><body><button class="print-actions" onclick="window.print()">Cetak / Simpan PDF</button>
      <header class="head"><div class="logo"><img id="bri-letter-logo" src="${escapeHtml(briLogoUrl)}" alt="Logo BRI"></div><div class="bank"><h1>PT. BANK RAKYAT INDONESIA (PERSERO) TBK.</h1><p>${escapeHtml(branchName.toUpperCase())}</p></div><div></div></header>
      <section class="meta"><table><tr><td>Nomor</td><td>:</td><td><strong>${escapeHtml(record.letterNumber)}</strong></td></tr><tr><td>Perihal</td><td>:</td><td><strong>${escapeHtml(getWarningLevelLabel(record.level))}</strong></td></tr></table><div class="recipient"><div>Kab. Karawang, ${dateText(record.issuedAt)}</div><br><div>Kepada Yth.</div><strong>${escapeHtml(customer.debtorName)}</strong><div>di Tempat</div></div></section>
      <section class="refs"><div>1. Surat Pengakuan Hutang / Perjanjian Kredit Nomor ${escapeHtml(customer.accountNumber)}</div>${previousReferences.map((item, index) => `<div>${index + 2}. ${escapeHtml(getWarningLevelLabel(item.level))} Nomor ${escapeHtml(item.letterNumber)} tanggal ${dateText(item.issuedAt)}</div>`).join("")}</section>
      <p class="body-copy">Menunjuk surat perjanjian kredit${previousReferences.length ? " dan surat peringatan sebelumnya" : ""}, kami sampaikan bahwa sampai dengan saat ini Saudara masih belum menyelesaikan kewajiban di BRI. Posisi kewajiban kredit Saudara tanggal ${dateText(record.issuedAt)} adalah sebagai berikut:</p>
      <table class="loan"><thead><tr><th>Nomor Rekening</th><th>Outstanding</th><th>Tunggakan Pokok</th><th>Tunggakan Bunga</th><th>Penalty</th><th>Total Kewajiban Tunggakan</th></tr></thead><tbody><tr><td>${escapeHtml(customer.accountNumber)}</td><td>${formatCurrency(customer.outstanding)}</td><td>${formatCurrency(customer.principalArrears)}</td><td>${formatCurrency(customer.interestArrears)}</td><td>${formatCurrency(record.penalty)}</td><td>${formatCurrency(totalObligation)}</td></tr></tbody></table>
      <p class="small">Catatan: Kewajiban tersebut di atas belum termasuk bunga berjalan dan biaya lain yang akan timbul kemudian hari.</p>
      <p class="body-copy">Sehubungan dengan hal tersebut di atas, maka diharapkan Saudara segera menyelesaikan kewajiban tunggakan tersebut selambat-lambatnya tanggal <strong>${dateText(record.dueDate)}</strong>.</p><p>Demikian, atas perhatian dan kerja samanya kami sampaikan terima kasih.</p>
      <section class="sign"><strong>PT. BANK RAKYAT INDONESIA (Persero) Tbk.<br>${escapeHtml(branchName.toUpperCase())}</strong><div class="sign-space"></div><u><strong>${escapeHtml(record.signerName || "Nama Pejabat")}</strong></u><div>${escapeHtml(record.signerTitle)}</div></section>
      <section class="copies small"><strong>Tindasan:</strong><div>- Arsip</div><div>- Branch Office</div></section>
    </body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    const logo = printWindow.document.getElementById("bri-letter-logo") as HTMLImageElement | null;
    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      printWindow.focus();
      printWindow.print();
    };
    if (logo && !logo.complete) {
      logo.addEventListener("load", triggerPrint, { once: true });
      logo.addEventListener("error", triggerPrint, { once: true });
    } else {
      setTimeout(triggerPrint, 200);
    }
    setTimeout(triggerPrint, 1200);
  }

  async function loadBriLogoPng() {
    const response = await fetch("/brand/bri-symbol.svg");
    if (!response.ok) throw new Error("Logo BRI belum dapat dimuat.");
    const svg = await response.text();
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      return await new Promise<string>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 720;
          canvas.height = 720;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Logo BRI belum dapat diproses."));
            return;
          }
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png"));
        };
        image.onerror = () => reject(new Error("Logo BRI belum dapat diproses."));
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function exportWarningPdf(record: WarningLetterRecord, customer: ReturnType<typeof getArrearsRows>[number]) {
    const { jsPDF } = await import("jspdf");
    const briLogo = await loadBriLogoPng();
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const dateText = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
    const accountHistory = warningHistoryByAccount.get(normalizeAccount(customer.accountNumber)) ?? [];
    const priorHistory = accountHistory.filter((item) => warningLevelOrder[item.level] < warningLevelOrder[record.level]);
    const pageWidth = 210;
    const left = 18;
    const contentWidth = 174;
    let y = 16;

    pdf.addImage(briLogo, "PNG", left, y, 20, 20);
    pdf.setTextColor(15, 41, 66);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("PT. BANK RAKYAT INDONESIA (PERSERO) TBK.", pageWidth / 2 + 8, y + 7, { align: "center" });
    pdf.setFontSize(10);
    pdf.text(branchName.toUpperCase(), pageWidth / 2 + 8, y + 14, { align: "center" });
    pdf.setDrawColor(0, 82, 156);
    pdf.setLineWidth(0.8);
    pdf.line(left, y + 23, pageWidth - left, y + 23);
    y += 32;

    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Nomor", left, y);
    pdf.text(":", left + 19, y);
    pdf.setTextColor(0, 82, 156);
    pdf.setFont("helvetica", "bold");
    pdf.text(record.letterNumber, left + 23, y);
    pdf.setTextColor(20, 20, 20);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Kab. Karawang, ${dateText(record.issuedAt)}`, 118, y);
    y += 6;
    pdf.text("Perihal", left, y);
    pdf.text(":", left + 19, y);
    pdf.setTextColor(0, 82, 156);
    pdf.setFont("helvetica", "bold");
    pdf.text(getWarningLevelLabel(record.level), left + 23, y);
    pdf.setTextColor(20, 20, 20);
    pdf.setFont("helvetica", "normal");
    pdf.text("Kepada Yth.", 118, y);
    y += 5;
    pdf.setTextColor(0, 82, 156);
    pdf.setFont("helvetica", "bold");
    pdf.text(customer.debtorName, 118, y);
    pdf.setTextColor(20, 20, 20);
    pdf.setFont("helvetica", "normal");
    const addressLines = ["di Tempat"];
    pdf.text(addressLines, 118, y + 4);
    y = Math.max(y + 6 + addressLines.length * 4, 72);

    pdf.setFontSize(8.5);
    pdf.text(`1. Surat Pengakuan Hutang / Perjanjian Kredit Nomor ${customer.accountNumber}`, left, y);
    priorHistory.forEach((item, index) => {
      y += 5;
      pdf.text(`${index + 2}. ${getWarningLevelLabel(item.level)} Nomor ${item.letterNumber} tanggal ${dateText(item.issuedAt)}`, left, y);
    });
    y += 4;
    pdf.setDrawColor(140, 140, 140);
    pdf.setLineWidth(0.25);
    pdf.line(left, y, pageWidth - left, y);
    y += 8;

    const opening = `Menunjuk surat perjanjian kredit${priorHistory.length ? " dan surat peringatan sebelumnya" : ""}, kami sampaikan bahwa sampai dengan saat ini Saudara masih belum menyelesaikan kewajiban di BRI. Posisi kewajiban kredit Saudara tanggal ${dateText(record.issuedAt)} adalah sebagai berikut:`;
    const openingLines = pdf.splitTextToSize(opening, contentWidth) as string[];
    pdf.setFontSize(9);
    pdf.text(openingLines, left, y, { align: "justify", maxWidth: contentWidth });
    y += openingLines.length * 4.5 + 6;

    const headers = ["Nomor Rekening", "Outstanding", "Tunggakan Pokok", "Tunggakan Bunga", "Penalty", "Total Kewajiban"];
    const values = [customer.accountNumber, formatCurrency(customer.outstanding), formatCurrency(customer.principalArrears), formatCurrency(customer.interestArrears), formatCurrency(record.penalty), formatCurrency(customer.totalArrears + record.penalty)];
    const widths = [34, 30, 28, 28, 24, 30];
    let x = left;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    headers.forEach((header, index) => {
      pdf.setDrawColor(30, 30, 30);
      pdf.rect(x, y, widths[index], 13, "S");
      pdf.setTextColor(15, 15, 15);
      const lines = pdf.splitTextToSize(header, widths[index] - 2) as string[];
      pdf.text(lines, x + widths[index] / 2, y + 5, { align: "center" });
      x += widths[index];
    });
    y += 13;
    x = left;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.8);
    values.forEach((value, index) => {
      pdf.setDrawColor(30, 30, 30);
      pdf.rect(x, y, widths[index], 12, "S");
      pdf.setTextColor(15, 15, 15);
      const lines = pdf.splitTextToSize(value, widths[index] - 2) as string[];
      pdf.text(lines, x + widths[index] / 2, y + 5, { align: "center" });
      x += widths[index];
    });
    pdf.setTextColor(20, 20, 20);
    y += 18;
    pdf.setFontSize(7.5);
    pdf.text("Catatan: Kewajiban tersebut belum termasuk bunga berjalan dan biaya lain yang akan timbul kemudian hari.", left, y);
    y += 9;
    pdf.setFontSize(9);
    const closing = `Sehubungan dengan hal tersebut di atas, maka diharapkan Saudara segera menyelesaikan kewajiban tunggakan tersebut selambat-lambatnya tanggal ${dateText(record.dueDate)}.\n\nDemikian, atas perhatian dan kerja samanya kami sampaikan terima kasih.`;
    const closingLines = pdf.splitTextToSize(closing, contentWidth) as string[];
    pdf.text(closingLines, left, y, { maxWidth: contentWidth });
    y += closingLines.length * 4.5 + 12;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("PT. BANK RAKYAT INDONESIA (Persero) Tbk.", 147, y, { align: "center" });
    pdf.text(branchName.toUpperCase(), 147, y + 5, { align: "center" });
    y += 28;
    pdf.text(record.signerName || "Nama Pejabat", 147, y, { align: "center" });
    pdf.setDrawColor(20, 20, 20);
    pdf.line(125, y + 1, 169, y + 1);
    pdf.setFont("helvetica", "normal");
    pdf.text(record.signerTitle, 147, y + 6, { align: "center" });
    pdf.setFontSize(7.5);
    pdf.text(["Tindasan:", "- Arsip", "- Branch Office"], left, Math.max(y + 12, 267));

    const safeAccount = customer.accountNumber.replace(/[^a-zA-Z0-9]/g, "");
    pdf.save(`${record.level}-${safeAccount}-${record.issuedAt}.pdf`);
  }

  async function processWarning() {
    if (!warningCustomer) return;
    setSavingWarning(true);
    setWarningMessage("");
    try {
      const response = await fetch("/api/warning-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...warningForm, status: "Dikirim", period: month, accountNumber: warningCustomer.accountNumber, debtorName: warningCustomer.debtorName }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Surat peringatan belum dapat disimpan.");
      const saved = payload.data as WarningLetterRecord;
      setWarningLetters((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setCompletedWarning(saved);
      try {
        await exportWarningPdf(saved, warningCustomer);
        setWarningMessage(`${saved.level} berhasil dikirim, disimpan, dan diekspor ke PDF.`);
      } catch (exportError) {
        setWarningMessage(`${saved.level} berhasil dikirim dan disimpan, tetapi PDF belum dapat diekspor. ${exportError instanceof Error ? exportError.message : ""}`.trim());
      }
    } catch (error) {
      setWarningMessage(error instanceof Error ? error.message : "Surat peringatan belum dapat disimpan.");
    } finally {
      setSavingWarning(false);
    }
  }

  function printCompletedWarning() {
    if (!warningCustomer || !completedWarning) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setWarningMessage("Jendela print diblokir browser. Izinkan pop-up lalu coba kembali.");
      return;
    }
    printWarningLetter(printWindow, completedWarning, warningCustomer);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Tunggakan"
        description={`Rekening dengan tunggakan pokok atau bunga berdasarkan LW321 terbaru posisi ${getMonthLabel(month)}.`}
        icon={AlertTriangle}
      />
      <section className="surface-panel p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-[#f37021]">Rekap Mantri Menunggak</p>
            <h2 className="mt-1 font-black text-[#004077]">Debitur dan OS per Mantri</h2>
          </div>
          <Badge variant="outline">{formatNumber(mantriRecap.length)} mantri</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {mantriRecap.map((item, index) => (
            <button
              key={item.mantri}
              type="button"
              onClick={() => setMantri(mantri === item.mantri ? "Semua" : item.mantri)}
              className={cn(
                "relative overflow-hidden rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                mantri === item.mantri ? "border-[#f37021] bg-[#fff7ed] shadow-[inset_0_-3px_0_#f37021]" : "border-[#d7e3ef] bg-white hover:border-[#00529c]/35",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#00529c]">{item.mantri || "Mantri belum terisi"}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{formatNumber(item.debtorCount)} debitur menunggak</p>
                </div>
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-black text-white", index === 0 ? "bg-[#f37021]" : "bg-[#00529c]")}>{index + 1}</span>
              </div>
              <div className="mt-3 border-t border-[#e3edf6] pt-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Outstanding</p>
                <p className="metric-value mt-1 font-black text-[#0f2942]">{formatCurrency(item.outstanding)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
      <div className="surface-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Filter Tunggakan">
            <Select value={arrearsBand} onChange={(event) => setArrearsBand(event.target.value as ArrearsBand)} className="min-w-48">
              <option value="Semua">Semua Tunggakan</option>
              <option value="Tucil">Tucil (di bawah Rp100 ribu)</option>
            </Select>
          </Field>
          <Field label="Filter Mantri">
            <Select value={mantri} onChange={(event) => setMantri(event.target.value)} className="min-w-64">
              {["Semua", ...mantriNames].map((item) => <option key={item} value={item}>{item === "Semua" ? "Semua Mantri" : item}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => exportRowsCsv(`tunggakan-${month}.csv`, exportHeaders, exportData)} disabled={!rows.length}>
            <Download className="h-4 w-4" />CSV
          </Button>
          <Button type="button" variant="outline" onClick={() => exportRowsXls(`tunggakan-${month}.xls`, exportHeaders, exportData)} disabled={!rows.length}>
            <FileSpreadsheet className="h-4 w-4" />Excel
          </Button>
        </div>
      </div>
      {rows.length ? (
        <>
          <TableShell minWidth="min-w-[1240px]">
            <thead>
              <tr>
                <Th>No Rekening</Th>
                <Th>Nama Debitur</Th>
                <Th>Mantri</Th>
                <Th>Outstanding</Th>
                <Th>Kolektibilitas</Th>
                <Th>Total Tunggakan (Pokok + Bunga)</Th>
                <Th>Status SP</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {pagination.pagedRows.map((item) => {
                const warningHistory = warningHistoryByAccount.get(normalizeAccount(item.accountNumber)) ?? [];
                return (
                  <tr key={item.accountNumber}>
                    <Td className="font-medium">{item.accountNumber}</Td>
                    <Td>{item.debtorName}</Td>
                    <Td>{item.mantri}</Td>
                    <Td>{formatCurrency(item.outstanding)}</Td>
                    <Td><QualityBadge bucket={classifyQuality(item, month)} /></Td>
                    <Td className="font-black text-rose-700">{formatCurrency(item.totalArrears)}</Td>
                    <Td>
                      {warningHistory.length ? (
                        <div className="flex min-w-max flex-col gap-1.5">
                          {warningHistory.map((record) => (
                            <div key={record.id} className="flex items-center gap-2">
                              <Badge className={cn("w-11 justify-center border-0", record.level === "SP3" ? "bg-rose-100 text-rose-700" : record.level === "SP2" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-700")}>{record.level}</Badge>
                              <span className="text-[10px] font-bold text-muted-foreground">{safeDateLabel(record.issuedAt)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <Badge variant="outline">Belum Ada SP</Badge>}
                    </Td>
                    <Td>
                      <Button type="button" size="sm" variant="outline" className="whitespace-nowrap border-[#00529c]/25 text-[#00529c]" onClick={() => openWarningDialog(item)}>
                        <FileText className="h-4 w-4" />Kirim SP
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
          <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </>
      ) : (
        <EmptyState
          title="Belum ada data tunggakan"
          description="Tidak ada tunggakan untuk filter terpilih. Jika LW321 belum memuat tunggakan pokok dan bunga, unggah ulang file terbaru setelah kolom tersedia."
          icon={AlertTriangle}
        />
      )}
      {warningCustomer ? (
        <OverlayShell
          title={`Kirim Surat Peringatan - ${warningCustomer.debtorName}`}
          description="Pilih tingkat peringatan, lengkapi tujuan surat, lalu simpan dan cetak dokumen."
          icon={FileText}
          onClose={() => setWarningCustomer(undefined)}
        >
          <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4 sm:p-5">
            <section className="rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-3">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div><p className="text-[10px] font-black uppercase text-muted-foreground">No Rekening</p><p className="mt-1 font-mono font-bold text-[#004077]">{warningCustomer.accountNumber}</p></div>
                <div><p className="text-[10px] font-black uppercase text-muted-foreground">Outstanding</p><p className="mt-1 font-black text-[#004077]">{formatCurrency(warningCustomer.outstanding)}</p></div>
                <div><p className="text-[10px] font-black uppercase text-muted-foreground">Total Tunggakan</p><p className="mt-1 font-black text-rose-700">{formatCurrency(warningCustomer.totalArrears)}</p></div>
              </div>
            </section>
            {(warningHistoryByAccount.get(normalizeAccount(warningCustomer.accountNumber)) ?? []).length ? (
              <section className="rounded-lg border border-[#d7e3ef] bg-white p-3">
                <p className="text-[10px] font-black uppercase text-[#00529c]">Riwayat Surat Peringatan</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(warningHistoryByAccount.get(normalizeAccount(warningCustomer.accountNumber)) ?? []).map((record) => (
                    <button key={record.id} type="button" onClick={() => { setWarningForm(buildWarningForm(warningCustomer, record.level)); setCompletedWarning(undefined); setWarningMessage(""); }} className="flex items-center gap-2 rounded-md border border-[#d7e3ef] bg-[#f8fbfe] px-2.5 py-2 text-left hover:border-[#00529c]/40">
                      <Badge className={cn("border-0", record.level === "SP3" ? "bg-rose-100 text-rose-700" : record.level === "SP2" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-700")}>{record.level}</Badge>
                      <span><span className="block text-xs font-bold text-[#004077]">{safeDateLabel(record.issuedAt)}</span><span className="block max-w-40 truncate text-[9px] text-muted-foreground">{record.letterNumber}</span></span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-black uppercase text-[#00529c]">Tingkat Surat Peringatan</p>
              <div className="grid grid-cols-3 gap-2">
                {(["SP1", "SP2", "SP3"] as const).map((level) => {
                  const existing = warningLetters.find((item) => normalizeAccount(item.accountNumber) === normalizeAccount(warningCustomer.accountNumber) && item.level === level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => { setWarningForm(buildWarningForm(warningCustomer, level)); setCompletedWarning(undefined); setWarningMessage(""); }}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left transition",
                        warningForm.level === level ? "border-[#00529c] bg-[#eaf3fb] shadow-[inset_0_-3px_0_#f37021]" : "border-[#d7e3ef] bg-white hover:border-[#00529c]/40",
                      )}
                    >
                      <span className="block font-black text-[#00529c]">{level}</span>
                      <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{existing ? `Tersimpan ${safeDateLabel(existing.issuedAt)}` : "Belum dibuat"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nomor Surat">
                <Input value={warningForm.letterNumber} onChange={(event) => setWarningForm((current) => ({ ...current, letterNumber: event.target.value }))} placeholder="0001/SP1/8014/Jul/2026" />
              </Field>
              <Field label="Penalty">
                <Input type="number" min="0" value={warningForm.penalty} onChange={(event) => setWarningForm((current) => ({ ...current, penalty: Number(event.target.value) || 0 }))} />
              </Field>
              <Field label="Tanggal Surat">
                <Input type="date" value={warningForm.issuedAt} onChange={(event) => setWarningForm((current) => ({ ...current, issuedAt: event.target.value }))} />
              </Field>
              <Field label="Batas Pembayaran">
                <Input type="date" value={warningForm.dueDate} onChange={(event) => setWarningForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Penandatangan">
                <Input value={warningForm.signerName} onChange={(event) => setWarningForm((current) => ({ ...current, signerName: event.target.value }))} placeholder="Nama Kepala Unit/Pejabat" />
              </Field>
              <Field label="Jabatan">
                <Input value={warningForm.signerTitle} onChange={(event) => setWarningForm((current) => ({ ...current, signerTitle: event.target.value }))} placeholder="Kepala Unit" />
              </Field>
            </div>
            {warningMessage ? <p className={cn("rounded-md px-3 py-2 text-sm font-bold", warningMessage.includes("berhasil") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>{warningMessage}</p> : null}
            <div className="flex flex-col-reverse gap-2 border-t border-[#d7e3ef] pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
              {completedWarning ? (
                <>
                  <Button type="button" variant="outline" onClick={printCompletedWarning} className="border-[#00529c]/25 text-[#00529c]">
                    <Printer className="h-4 w-4" />Print
                  </Button>
                  <Button type="button" onClick={() => setWarningCustomer(undefined)} className="bg-[#00529c] text-white hover:bg-[#004077]">
                    <Check className="h-4 w-4" />Selesai
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setWarningCustomer(undefined)}>Batal</Button>
                  <Button
                    type="button"
                    onClick={processWarning}
                    disabled={savingWarning || !warningForm.letterNumber.trim() || !warningForm.issuedAt || !warningForm.dueDate || !warningForm.signerName.trim()}
                    className="bg-[#00529c] text-white hover:bg-[#004077]"
                  >
                    <Send className="h-4 w-4" />{savingWarning ? "Memproses & Export PDF..." : "Kirim & Simpan"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </OverlayShell>
      ) : null}
    </div>
  );
}

type Di319Status = "Tidak Ada Blokiran" | "Setor dari Blokiran" | "Blokiran Aktif";

type UploadedDi319Row = {
  period: string;
  cif: string;
  loanAccountNumber: string;
  debtorName: string;
  mantri: string;
  savingsAccount: string;
  blockedAtStart: number;
  currentBlocked: number;
  installmentFromBlocked: number;
  mutationDate: string;
  status: Di319Status;
};

function Di319View({ month, uploadedRows }: { month: MonthKey; uploadedRows: UploadedDi319Row[] }) {
  const [filter, setFilter] = useState<"Semua Data" | Di319Status>("Tidak Ada Blokiran");
  const fallbackMonth = getPreviousMonth(month) ?? month;
  const uploadPeriods = [...new Set(uploadedRows.map((item) => item.period))].sort();
  const sourceMonth = uploadPeriods.filter((period) => period <= month).at(-1) ?? uploadPeriods.at(-1) ?? fallbackMonth;
  const statusPattern: Di319Status[] = [
    "Tidak Ada Blokiran",
    "Setor dari Blokiran",
    "Blokiran Aktif",
    "Tidak Ada Blokiran",
    "Setor dari Blokiran",
    "Blokiran Aktif",
    "Tidak Ada Blokiran",
    "Setor dari Blokiran",
    "Blokiran Aktif",
    "Tidak Ada Blokiran",
    "Setor dari Blokiran",
  ];
  const mockRows = getSnapshots(month).map((item, index) => {
    const status = statusPattern[index % statusPattern.length];
    const blockedAtStart = 2500000 + (index % 5) * 750000;
    const installmentFromBlocked = status === "Setor dari Blokiran" ? Math.min(blockedAtStart, 1750000 + (index % 3) * 500000) : 0;
    const currentBlocked = status === "Blokiran Aktif" ? blockedAtStart : status === "Setor dari Blokiran" ? Math.max(0, blockedAtStart - installmentFromBlocked) : 0;
    return {
      ...item,
      cif: item.cif ?? "-",
      status,
      savingsAccount: `0206${item.accountNumber.replace(/\D/g, "").slice(-11)}`,
      blockedAtStart,
      currentBlocked,
      installmentFromBlocked,
      mutationDate: `${sourceMonth}-${String(20 + (index % 8)).padStart(2, "0")}`,
    };
  });
  const monthSnapshots = getSnapshots(month);
  const creditByAccount = new Map(monthSnapshots.map((item) => [normalizeAccount(item.accountNumber), item]));
  const creditByCif = new Map<string, (typeof monthSnapshots)[number]>();
  [...monthSnapshots].sort((a, b) => b.outstanding - a.outstanding).forEach((item) => {
    const cif = String(item.cif ?? "").trim().toUpperCase();
    if (cif && !creditByCif.has(cif)) creditByCif.set(cif, item);
  });
  const sourceDepositRows = uploadedRows.filter((item) => item.period === sourceMonth);
  const importedRows = sourceDepositRows.flatMap((item) => {
    const credit = (item.loanAccountNumber ? creditByAccount.get(normalizeAccount(item.loanAccountNumber)) : undefined)
      ?? creditByCif.get(String(item.cif ?? "").trim().toUpperCase());
    if (!credit) return [];
    return [{
      cif: item.cif,
      debtorName: credit.debtorName || item.debtorName || "Nama tidak tersedia",
      mantri: credit.mantri || item.mantri || "-",
      description: credit.description || "Data DI319",
      loanType: credit.loanType,
      outstanding: credit.outstanding,
      savingsAccount: item.savingsAccount || "-",
      blockedAtStart: item.blockedAtStart,
      currentBlocked: item.currentBlocked,
      installmentFromBlocked: item.installmentFromBlocked,
      mutationDate: item.mutationDate,
      status: item.status,
      accountNumber: credit.accountNumber,
    }];
  });
  const rows = sourceDepositRows.length ? importedRows : mockRows;
  const unmatchedCifCount = Math.max(0, sourceDepositRows.length - importedRows.length);
  const filteredRows = filter === "Semua Data" ? rows : rows.filter((item) => item.status === filter);
  const pagination = useTablePagination(filteredRows, `${sourceMonth}-${filter}-${filteredRows.length}`);
  const withoutBlock = rows.filter((item) => item.status === "Tidak Ada Blokiran");
  const paidFromBlock = rows.filter((item) => item.status === "Setor dari Blokiran");
  const activeBlock = rows.filter((item) => item.status === "Blokiran Aktif");

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Monitoring Simpanan"
        description={`Posisi DI319 ${getMonthLabel(sourceMonth)} untuk memantau blokiran simpanan yang disiapkan sebagai setoran akhir periode pinjaman.`}
        icon={Banknote}
      />
      <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold", importedRows.length ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800")}>
        {sourceDepositRows.length ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {sourceDepositRows.length
          ? `${importedRows.length} rekening simpanan tersinkron dengan LW321 melalui CIF${unmatchedCifCount ? `, ${unmatchedCifCount} CIF belum cocok` : ""}.`
          : "Data contoh ditampilkan sampai file DI319 diunggah."}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Tidak Ada Blokiran" value={`${withoutBlock.length} rekening simpanan`} helper="Blokiran sudah tidak tersedia" tone="warning" icon={AlertTriangle} />
        <MetricCard label="Setor dari Blokiran" value={`${paidFromBlock.length} rekening simpanan`} helper={formatCurrency(paidFromBlock.reduce((total, item) => total + item.installmentFromBlocked, 0))} tone="danger" icon={ArrowDownRight} />
        <MetricCard label="Blokiran Aktif" value={`${activeBlock.length} rekening simpanan`} helper={formatCurrency(activeBlock.reduce((total, item) => total + item.currentBlocked, 0))} icon={Shield} />
      </div>
      <div className="bri-card rounded-lg border border-[#d7e3ef] bg-white p-3">
        <p className="mb-2 text-xs font-black uppercase text-[#f37021]">Kategori DI319</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["Semua Data", "Tidak Ada Blokiran", "Setor dari Blokiran"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={cn("flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-bold", filter === item ? "border-[#f37021] bg-[#00529c] text-white" : "border-[#d7e3ef] bg-white text-[#00529c] hover:bg-[#eaf3fb]")}>
              <span>{item}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs", filter === item ? "bg-white/20 text-white" : "bg-[#eaf3fb] text-[#00529c]")}>{item === "Semua Data" ? rows.length : rows.filter((row) => row.status === item).length}</span>
            </button>
          ))}
        </div>
      </div>
      <TableShell minWidth="min-w-[1550px]">
        <thead><tr><Th>No CIF</Th><Th>No Rekening Pinjaman</Th><Th>Nama Debitur</Th><Th>Mantri</Th><Th>Produk</Th><Th>Outstanding</Th><Th>No Rekening Simpanan</Th><Th>Blokiran Awal</Th><Th>Blokiran Saat Ini</Th><Th>Setoran dari Blokiran</Th><Th>Tanggal Mutasi</Th><Th>Status DI319</Th></tr></thead>
        <tbody>
          {pagination.pagedRows.map((item) => (
            <tr key={`${item.cif}-${item.accountNumber}-${item.savingsAccount}`} className={cn(item.status === "Tidak Ada Blokiran" && "bg-[#fff7ed]/60", item.status === "Setor dari Blokiran" && "bg-rose-50/60")}>
              <Td className="font-medium text-[#00529c]">{item.cif}</Td><Td className="font-medium text-[#00529c]">{item.accountNumber}</Td><Td className="font-semibold">{item.debtorName}</Td><Td>{item.mantri}</Td><Td>{getProductType(item.description, item.loanType)}</Td><Td>{formatCurrency(item.outstanding)}</Td><Td className="font-mono text-[#00529c]">{item.savingsAccount}</Td><Td>{formatCurrency(item.blockedAtStart)}</Td><Td>{formatCurrency(item.currentBlocked)}</Td><Td className={item.installmentFromBlocked ? "font-bold text-rose-700" : "text-muted-foreground"}>{formatCurrency(item.installmentFromBlocked)}</Td><Td>{dateLabel(item.mutationDate)}</Td><Td><Badge variant={item.status === "Tidak Ada Blokiran" ? "warning" : item.status === "Setor dari Blokiran" ? "danger" : "success"}>{item.status}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={filteredRows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

type WhatsappCampaignType = "pipeline" | "reminder";
type WhatsappRecipient = {
  id: string;
  accountNumber: string;
  name: string;
  phone: string;
  mantri: string;
  detail: string;
  product?: string;
  dueDate?: string;
  previousQuality: QualityBucket | "-";
  optIn: boolean;
};

function WhatsappCampaignView({ month }: { month: MonthKey }) {
  const [campaignType, setCampaignType] = useState<WhatsappCampaignType>("pipeline");
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<"simulation" | "live">("simulation");
  const [resultMessage, setResultMessage] = useState("");
  const [sendResults, setSendResults] = useState<Record<string, "Terkirim" | "Simulasi Berhasil" | "Gagal">>({});
  const [contactPhones, setContactPhones] = useState<Record<string, string>>({});
  const [phoneDrafts, setPhoneDrafts] = useState<Record<string, string>>({});
  const [phoneSaveStatus, setPhoneSaveStatus] = useState<Record<string, "Menyimpan" | "Tersimpan" | "Gagal">>({});
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [waMantriFilter, setWaMantriFilter] = useState("Semua");
  const [waPreviousQualityFilter, setWaPreviousQualityFilter] = useState("Semua");
  const pipelineRecipients: WhatsappRecipient[] = getPipelineRows(month).map((item) => ({
    id: `pipeline-${item.accountNumber}`,
    accountNumber: item.accountNumber,
    name: item.debtorName,
    phone: contactPhones[normalizeAccount(item.accountNumber)] ?? "",
    mantri: item.pnPengelolaSinglePn,
    product: item.productType,
    previousQuality: classifyQuality(item, item.sourceMonth),
    detail: `${item.productType} | OS ${formatCurrency(item.outstanding)}`,
    optIn: true,
  }));
  const today = new Date("2026-07-12T00:00:00");
  const reminderPreviousMonth = getPreviousMonth(month);
  const reminderRecipients: WhatsappRecipient[] = getSnapshots(month)
    .map((item) => {
      const due = new Date(`${item.nextPaymentDate}T00:00:00`);
      const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      return { item, daysUntilDue };
    })
    .filter(({ daysUntilDue }) => daysUntilDue >= 0 && daysUntilDue <= 14)
    .map(({ item, daysUntilDue }) => {
      const previous = reminderPreviousMonth ? getCompareSnapshot(reminderPreviousMonth, item.accountNumber) : undefined;
      return {
      id: `reminder-${item.accountNumber}`,
      accountNumber: item.accountNumber,
      name: item.debtorName,
      phone: contactPhones[normalizeAccount(item.accountNumber)] ?? "",
      mantri: item.mantri,
      dueDate: item.nextPaymentDate,
      previousQuality: previous && reminderPreviousMonth ? classifyQuality(previous, reminderPreviousMonth) : "-" as const,
      detail: `${daysUntilDue} hari lagi | ${dateLabel(item.nextPaymentDate)}`,
      optIn: true,
    };
    });
  const allRecipients = campaignType === "pipeline" ? pipelineRecipients : reminderRecipients;
  const recipients = allRecipients.filter((item) =>
    (waMantriFilter === "Semua" || item.mantri === waMantriFilter) &&
    (campaignType !== "reminder" || waPreviousQualityFilter === "Semua" || item.previousQuality === waPreviousQualityFilter),
  );
  const waMantriNames = [...new Set(allRecipients.map((item) => item.mantri))].sort();
  const pagination = useTablePagination(recipients, `${month}-${campaignType}-${waMantriFilter}-${waPreviousQualityFilter}-${recipients.length}`);
  const selectedRows = recipients.filter((item) => selectedRecipients.has(item.id));
  const templateName = campaignType === "pipeline" ? "penawaran_suplesi" : "pengingat_setoran";
  const previewRecipient = recipients[0];
  const previewMessage = campaignType === "pipeline"
    ? `Yth. Bapak/Ibu ${previewRecipient?.name ?? "Nama Nasabah"}, BRI Unit Greenvilage memiliki penawaran suplesi ${previewRecipient?.product ?? "pinjaman"}. Silakan hubungi Mantri ${previewRecipient?.mantri ?? "pengelola"} untuk informasi lebih lanjut.`
    : `Yth. Bapak/Ibu ${previewRecipient?.name ?? "Nama Nasabah"}, kami mengingatkan jadwal setoran pinjaman pada ${previewRecipient?.dueDate ? dateLabel(previewRecipient.dueDate) : "tanggal jatuh tempo"}. Silakan memastikan dana setoran tersedia atau hubungi Mantri ${previewRecipient?.mantri ?? "pengelola"}.`;

  useEffect(() => {
    if (!contactsLoaded) return;
    setSelectedRecipients(new Set(recipients.filter((item) => item.optIn && item.phone).map((item) => item.id)));
    setSendResults({});
    setResultMessage("");
  }, [campaignType, month, contactsLoaded, waMantriFilter, waPreviousQualityFilter]);

  useEffect(() => {
    fetch("/api/whatsapp/campaign", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setSendMode(payload.mode === "live" ? "live" : "simulation"))
      .catch(() => setSendMode("simulation"));
  }, []);

  useEffect(() => {
    fetch("/api/whatsapp/contacts", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const next: Record<string, string> = {};
        for (const item of payload.data ?? []) next[String(item.account_number)] = String(item.phone);
        setContactPhones(next);
      })
      .finally(() => setContactsLoaded(true));
  }, []);

  function toggleRecipient(id: string) {
    setSelectedRecipients((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function savePhone(item: WhatsappRecipient) {
    const accountKey = normalizeAccount(item.accountNumber);
    const draft = phoneDrafts[accountKey];
    if (draft === undefined) return;
    setPhoneSaveStatus((current) => ({ ...current, [accountKey]: "Menyimpan" }));
    try {
      const response = await fetch("/api/whatsapp/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: item.accountNumber, phone: draft }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Gagal menyimpan nomor HP.");
      const savedPhone = String(payload.data.phone ?? "");
      setContactPhones((current) => ({ ...current, [accountKey]: savedPhone }));
      setPhoneDrafts((current) => {
        const next = { ...current };
        delete next[accountKey];
        return next;
      });
      setPhoneSaveStatus((current) => ({ ...current, [accountKey]: "Tersimpan" }));
      setSelectedRecipients((current) => {
        const next = new Set(current);
        if (savedPhone && item.optIn) next.add(item.id); else next.delete(item.id);
        return next;
      });
    } catch {
      setPhoneSaveStatus((current) => ({ ...current, [accountKey]: "Gagal" }));
    }
  }

  async function submitCampaign() {
    if (!selectedRows.length) return;
    setSending(true);
    setResultMessage("");
    try {
      const response = await fetch("/api/whatsapp/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignType,
          recipients: selectedRows.map((item) => ({ id: item.id, accountNumber: item.accountNumber, phone: item.phone, name: item.name, mantri: item.mantri, product: item.product, dueDate: item.dueDate })),
        }),
      });
      const payload = await response.json();
      const nextResults: Record<string, "Terkirim" | "Simulasi Berhasil" | "Gagal"> = {};
      for (const item of payload.results ?? []) nextResults[item.id] = item.status;
      setSendResults(nextResults);
      setSendMode(payload.mode === "live" ? "live" : "simulation");
      setResultMessage(payload.message ?? "Proses kampanye selesai.");
      setShowConfirmation(false);
    } catch {
      setResultMessage("Kampanye belum dapat diproses. Periksa koneksi dan konfigurasi WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="WA Blast" description="Kirim penawaran pipeline suplesi dan pengingat setoran menjelang Next Payment Date." icon={MessageCircle} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Penerima Tersedia" value={`${recipients.length} nasabah`} helper={campaignType === "pipeline" ? "Pipeline memenuhi syarat" : "Jatuh tempo 14 hari"} icon={UsersRound} />
        <MetricCard label="Penerima Dipilih" value={`${selectedRows.length} nasabah`} helper="Memiliki persetujuan komunikasi" tone="success" icon={CheckCircle2} />
        <MetricCard label="Template Meta" value={templateName} helper="Template harus disetujui Meta" tone="warning" icon={FileText} />
        <div className={cn("bri-card rounded-lg border p-4", sendMode === "live" ? "border-emerald-200 bg-emerald-50" : "border-sky-200 bg-sky-50")}><p className="text-xs font-black uppercase text-muted-foreground">Mode Pengiriman</p><p className={cn("mt-2 text-xl font-black", sendMode === "live" ? "text-emerald-700" : "text-sky-700")}>{sendMode === "live" ? "Cloud API Aktif" : "Simulasi Aman"}</p><p className="mt-1 text-xs text-muted-foreground">{sendMode === "live" ? "Pesan dikirim melalui Meta" : "Tidak mengirim pesan nyata"}</p></div>
      </div>
      <div className="bri-card rounded-lg border border-[#d7e3ef] bg-white p-4">
        <p className="text-xs font-black uppercase text-[#f37021]">Jenis Campaign</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setCampaignType("pipeline")} className={cn("flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left", campaignType === "pipeline" ? "border-emerald-500 bg-emerald-50" : "border-[#d7e3ef] bg-white")}><span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-600 text-white"><Gauge className="h-5 w-5" /></span><span><strong className="block text-[#004077]">Penawaran Pipeline Suplesi</strong><span className="text-xs text-muted-foreground">Nasabah lancar yang memenuhi kriteria suplesi</span></span></button>
          <button type="button" onClick={() => setCampaignType("reminder")} className={cn("flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left", campaignType === "reminder" ? "border-[#f37021] bg-[#fff7ed]" : "border-[#d7e3ef] bg-white")}><span className="grid h-10 w-10 place-items-center rounded-md bg-[#f37021] text-white"><CalendarDays className="h-5 w-5" /></span><span><strong className="block text-[#004077]">Pengingat Setoran</strong><span className="text-xs text-muted-foreground">Next Payment Date dalam 14 hari</span></span></button>
        </div>
      </div>
      <div className="grid gap-3 rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-4 sm:grid-cols-2">
        <Field label="Filter Mantri">
          <Select value={waMantriFilter} onChange={(event) => setWaMantriFilter(event.target.value)}>
            {["Semua", ...waMantriNames].map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </Field>
        {campaignType === "reminder" ? (
          <Field label={`Kolektibilitas Bulan Lalu ${getMonthLabel(reminderPreviousMonth ?? month)}`}>
            <Select value={waPreviousQualityFilter} onChange={(event) => setWaPreviousQualityFilter(event.target.value)}>
              {["Semua", "Lancar", "SML1", "SML2", "SML3", "KL", "Diragukan", "Macet"].map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </Field>
        ) : (
          <div className="flex items-end"><p className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">Filter mantri berlaku untuk daftar penawaran pipeline suplesi.</p></div>
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-black uppercase text-[#f37021]">Daftar Penerima</p><p className="text-sm text-muted-foreground">Nomor HP dapat diisi langsung dan tersimpan otomatis untuk periode berikutnya.</p></div>
            <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setSelectedRecipients(new Set())}>Kosongkan</Button><Button type="button" variant="outline" size="sm" onClick={() => setSelectedRecipients(new Set(recipients.filter((item) => item.optIn && item.phone).map((item) => item.id)))}>Pilih Semua</Button></div>
          </div>
          {recipients.length ? (
            <>
            <TableShell minWidth="min-w-[1180px]">
              <thead><tr><Th>Pilih</Th><Th>No Rekening</Th><Th>Nama Nasabah</Th><Th>No HP / WhatsApp</Th><Th>Mantri</Th><Th>Keterangan</Th><Th>Persetujuan</Th><Th>Status</Th></tr></thead>
              <tbody>{pagination.pagedRows.map((item) => {
                const accountKey = normalizeAccount(item.accountNumber);
                const saveStatus = phoneSaveStatus[accountKey];
                return (
                  <tr key={item.id}>
                    <Td><input type="checkbox" aria-label={`Pilih ${item.name}`} checked={selectedRecipients.has(item.id)} disabled={!item.optIn || !item.phone} onChange={() => toggleRecipient(item.id)} className="h-4 w-4 accent-[#00529c]" /></Td>
                    <Td className="font-medium text-[#00529c]">{item.accountNumber}</Td>
                    <Td className="font-semibold">{item.name}</Td>
                    <Td>
                      <div className="min-w-[190px]">
                        <Input
                          value={phoneDrafts[accountKey] ?? item.phone}
                          onChange={(event) => setPhoneDrafts((current) => ({ ...current, [accountKey]: event.target.value }))}
                          onBlur={() => savePhone(item)}
                          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                          inputMode="tel"
                          placeholder="08xxxxxxxxxx"
                          aria-label={`No HP ${item.name}`}
                          className="h-9 bg-white font-mono"
                        />
                        <p className={cn("mt-1 text-[10px] font-semibold", saveStatus === "Gagal" ? "text-rose-700" : saveStatus === "Menyimpan" ? "text-sky-700" : "text-emerald-700")}>{saveStatus ?? (item.phone ? "Tersimpan di master kontak" : "Wajib diisi sebelum dipilih")}</p>
                      </div>
                    </Td>
                    <Td>{item.mantri}</Td><Td>{item.detail}</Td><Td><Badge variant={item.optIn ? "success" : "warning"}>{item.optIn ? "Setuju" : "Belum Setuju"}</Badge></Td><Td><Badge variant={sendResults[item.id] === "Gagal" ? "danger" : sendResults[item.id] ? "success" : item.phone ? "outline" : "warning"}>{sendResults[item.id] ?? (item.phone ? "Siap" : "Lengkapi No HP")}</Badge></Td>
                  </tr>
                );
              })}</tbody>
            </TableShell>
            <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={recipients.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
            </>
          ) : <EmptyState title="Tidak ada penerima" description="Tidak ada nasabah yang memenuhi kriteria campaign pada periode ini." icon={MessageCircle} />}
        </div>
        <div className="h-fit rounded-lg border border-[#d7e3ef] bg-white p-4 shadow-[0_10px_24px_rgba(0,55,105,0.07)]"><p className="text-xs font-black uppercase text-[#f37021]">Pratinjau Template</p><div className="mt-3 rounded-lg bg-[#e7f7ef] p-4 text-sm leading-6 text-[#173b2d] shadow-inner">{previewMessage}<p className="mt-3 text-right text-[10px] text-emerald-700">BRI Unit Greenvilage</p></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Template pengiriman nyata mengikuti template <strong>{templateName}</strong> yang disetujui Meta.</p><Button type="button" className="mt-4 w-full bg-[#00529c] hover:bg-[#003f78]" disabled={!selectedRows.length} onClick={() => setShowConfirmation(true)}><MessageCircle className="mr-2 h-4 w-4" />Tinjau Pengiriman ({selectedRows.length})</Button>{resultMessage ? <p className="mt-3 rounded-md bg-[#eaf3fb] p-3 text-xs font-semibold text-[#00529c]">{resultMessage}</p> : null}</div>
      </div>
      {showConfirmation ? <div className="fixed inset-0 z-[90] grid place-items-center bg-[#001b33]/55 p-4"><div className="w-full max-w-lg rounded-lg bg-white shadow-2xl"><div className="border-b border-[#d7e3ef] p-5"><p className="text-xs font-black uppercase text-[#f37021]">Konfirmasi Campaign</p><h2 className="mt-1 text-xl font-black text-[#00529c]">Kirim ke {selectedRows.length} nasabah?</h2></div><div className="space-y-3 p-5"><p className="text-sm leading-6 text-muted-foreground">Campaign menggunakan template <strong>{templateName}</strong>. Hanya nasabah yang telah memberikan persetujuan komunikasi yang diproses.</p><div className={cn("rounded-md border p-3 text-sm font-bold", sendMode === "live" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-sky-200 bg-sky-50 text-sky-700")}>{sendMode === "live" ? "Cloud API aktif: tindakan ini akan mengirim pesan WhatsApp nyata." : "Mode simulasi: tidak ada pesan WhatsApp nyata yang dikirim."}</div></div><div className="flex justify-end gap-2 border-t border-[#d7e3ef] p-4"><Button type="button" variant="outline" onClick={() => setShowConfirmation(false)}>Batal</Button><Button type="button" className="bg-emerald-600 hover:bg-emerald-700" disabled={sending} onClick={submitCampaign}>{sending ? "Memproses..." : "Kirim Sekarang"}</Button></div></div></div> : null}
    </div>
  );
}

function CkpnView({
  month,
  mantri,
  setMantri,
  product,
  setProduct,
  movement,
  setMovement,
  quality,
  setQuality,
  mantriNames,
}: {
  month: MonthKey;
  mantri: string;
  setMantri: (value: string) => void;
  product: string;
  setProduct: (value: string) => void;
  movement: string;
  setMovement: (value: string) => void;
  quality: string;
  setQuality: (value: string) => void;
  mantriNames: string[];
}) {
  const [savingForecast, setSavingForecast] = useState("");
  const [forecastVersion, setForecastVersion] = useState(0);
  const [forecastMessage, setForecastMessage] = useState("");
  const sourceMonth = month;
  const comparisonMonth = getPreviousMonth(sourceMonth);
  const rows = getPrognosaCkpnRows(sourceMonth).filter((item) => {
    const mantriMatch = mantri === "Semua" || item.mantri === mantri;
    const productMatch = product === "Semua" || item.productType === product;
    const movementMatch = movement === "Semua" || item.movement === movement;
    const qualityMatch = quality === "Semua" || item.previousBucket === quality;
    return mantriMatch && productMatch && movementMatch && qualityMatch;
  });
  const filledRows = rows.filter((item) => item.targetCollectibility);
  const changedRows = filledRows.filter((item) => Math.abs(item.ckpnImpact) >= 1);
  const tambahan = filledRows.filter((item) => item.ckpnImpact > 0).reduce((sum, item) => sum + item.ckpnImpact, 0);
  const pemulihan = filledRows.filter((item) => item.ckpnImpact < 0).reduce((sum, item) => sum + item.ckpnImpact, 0);
  const net = filledRows.reduce((sum, item) => sum + item.ckpnImpact, 0);
  const pagination = useTablePagination(rows, `${sourceMonth}-${mantri}-${product}-${movement}-${quality}-${rows.length}-${forecastVersion}`);
  const targetOptions: PrognosaCollectibility[] = ["Lancar", "LR", "SML1", "SML2", "SML3", "KL/D", "Macet", "Lunas", "PH"];

  async function saveForecast(accountNumber: string, targetCollectibility: PrognosaCollectibility) {
    setSavingForecast(accountNumber);
    setForecastMessage("");
    try {
      const response = await fetch("/api/ckpn-forecasts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, period: sourceMonth, targetCollectibility }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Kolektibilitas prognosa belum dapat disimpan.");
      setCkpnForecast(sourceMonth, accountNumber, targetCollectibility);
      setForecastVersion((current) => current + 1);
      setForecastMessage(`Prognosa ${targetCollectibility} untuk rekening ${accountNumber} berhasil disimpan.`);
    } catch (error) {
      setForecastMessage(error instanceof Error ? error.message : "Kolektibilitas prognosa belum dapat disimpan.");
    } finally {
      setSavingForecast("");
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Prognosa CKPN"
        description={`Isi Prognosa Kolek secara manual untuk memproyeksikan Delta CKPN dari posisi ${getMonthLabel(comparisonMonth ?? sourceMonth)}. PUMK tidak masuk perhitungan.`}
        icon={PieChartIcon}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Downgrade CKPN" value={formatCurrency(tambahan)} tone="danger" icon={ArrowUpRight} />
        <MetricCard label="Upgrade CKPN" value={formatCurrency(pemulihan)} tone="success" icon={ArrowDownRight} />
        <MetricCard label="Net Dampak CKPN" value={formatCurrency(net)} tone={net >= 0 ? "danger" : "success"} icon={PieChartIcon} />
        <MetricCard label="Prognosa Terisi" value={`${filledRows.length} rekening`} helper={`dari ${rows.length} rekening`} icon={UsersRound} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Mantri"><Select value={mantri} onChange={(event) => setMantri(event.target.value)}>
          {["Semua", ...mantriNames].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select></Field>
        <Field label="Tipe Pinjaman"><Select value={product} onChange={(event) => setProduct(event.target.value)}>
          {["Semua", "Kupedes", "Kupedes Rakyat", "KUR Mikro"].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select></Field>
        <Field label="Arah Prognosa"><Select value={movement} onChange={(event) => setMovement(event.target.value)}>
          {["Semua", "Belum Diisi", "Memburuk", "Membaik", "Tetap"].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select></Field>
        <Field label={`Kolektibilitas Bulan Lalu ${getMonthLabel(comparisonMonth ?? sourceMonth)}`}><Select value={quality} onChange={(event) => setQuality(event.target.value)}>
          {["Semua", "Lancar", "LR", "SML1", "SML2", "SML3", "KL/D", "Macet"].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select></Field>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-[#d7e3ef] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#004077]">Laporan Perubahan Prognosa CKPN</p>
          <p className="text-xs text-muted-foreground">Excel hanya memuat {changedRows.length} rekening terfilter dengan Delta CKPN tidak nol.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!changedRows.length}
          onClick={() => exportRowsXls(
            `prognosa-ckpn-perubahan-${sourceMonth}.xls`,
            ["No Rekening", "Nama Debitur", "Mantri", "Outstanding Acuan", "Kolek Bulan Lalu", "Prognosa Kolek", "CKPN Terbentuk", "Delta CKPN", "Arah Prognosa"],
            changedRows.map((item) => [item.accountNumber, item.debtorName, item.mantri, item.outstanding, item.previousBucket, item.targetCollectibility, item.formedCkpn, item.ckpnImpact, item.movement]),
          )}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />Export Excel ({changedRows.length})
        </Button>
      </div>
      {forecastMessage ? <p className="rounded-md border border-[#b8d8f2] bg-[#eef7ff] px-3 py-2 text-sm font-semibold text-[#00529c]">{forecastMessage}</p> : null}
      <TableShell>
        <thead>
          <tr>
            <Th>No Rekening</Th>
            <Th>Nama Debitur</Th>
            <Th>Mantri</Th>
            <Th>Outstanding Acuan</Th>
            <Th>Kolek Bulan Lalu</Th>
            <Th>Prognosa Kolek</Th>
            <Th>Delta CKPN</Th>
          </tr>
        </thead>
        <tbody>
          {pagination.pagedRows.map((item) => (
            <tr key={item.accountNumber}>
              <Td className="font-medium">{item.accountNumber}</Td>
              <Td>{item.debtorName}</Td>
              <Td>{item.mantri}</Td>
              <Td><span className="font-semibold">{formatCurrency(item.outstanding)}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">Posisi bulan lalu</span></Td>
              <Td><QualityBadge bucket={item.previousBucket} /></Td>
              <Td>
                <Select
                  value={item.targetCollectibility ?? ""}
                  disabled={savingForecast === item.accountNumber}
                  onChange={(event) => event.target.value && saveForecast(item.accountNumber, event.target.value as PrognosaCollectibility)}
                  className="h-9 min-w-40"
                >
                  <option value="">Pilih prognosa kolek</option>
                  {targetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </Select>
              </Td>
              <Td className={cn("font-medium", item.ckpnImpact > 0 ? "text-red-700" : item.ckpnImpact < 0 ? "text-emerald-700" : "text-slate-600")}>
                {item.targetCollectibility ? formatCurrency(item.ckpnImpact) : "Menunggu input"}
                <span className="mt-0.5 block text-[10px] font-semibold text-muted-foreground">Dasar: {item.ckpnBasisSource}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={rows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

function BrimenMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass = {
    default: "border-emerald-300/25 bg-emerald-300/[0.1] text-emerald-100",
    warning: "border-amber-300/25 bg-amber-300/[0.12] text-amber-100",
    danger: "border-rose-300/25 bg-rose-300/[0.12] text-rose-100",
  }[tone];

  return (
    <div className="brimen-surface rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
          <p className="mt-3 text-xl font-black text-white">{value}</p>
          {helper ? <p className="mt-1 text-xs font-semibold text-zinc-400">{helper}</p> : null}
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function BrimenDarkStatusBadge({ status }: { status: BrimenCustomer["status"] }) {
  const className =
    status === "Disimpan"
      ? "border-emerald-300/35 bg-emerald-300/[0.14] text-emerald-100"
      : status === "Dipinjam"
        ? "border-amber-300/35 bg-amber-300/[0.13] text-amber-100"
        : status === "Lunas"
          ? "border-sky-300/35 bg-sky-300/[0.13] text-sky-100"
          : "border-white/10 bg-white/[0.05] text-zinc-300";

  return (
    <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-bold", className)}>
      {status}
    </span>
  );
}

function BrimenView({
  rows,
  summary,
  status,
  search,
  setSearch,
  filter,
  setFilter,
  creditAccounts,
  latestLoanPeriod,
  latestLoanRows,
  loans,
  formMode,
  setFormMode,
  form,
  setForm,
  loanCustomer,
  setLoanCustomer,
  loanForm,
  setLoanForm,
  processForm,
  setProcessForm,
  actionMessage,
  setActionMessage,
  reload,
}: {
  rows: BrimenCustomer[];
  summary?: BrimenSummary;
  status: string;
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  creditAccounts: string[];
  latestLoanPeriod: MonthKey;
  latestLoanRows: LoanSnapshot[];
  loans: BrimenLoan[];
  formMode: BrimenFormMode;
  setFormMode: (value: BrimenFormMode) => void;
  form: BrimenFormState;
  setForm: (value: BrimenFormState) => void;
  loanCustomer?: BrimenCustomer;
  setLoanCustomer: (value: BrimenCustomer | undefined) => void;
  loanForm: { borrowerName: string; borrowerUsername: string; purpose: string; loanDate: string };
  setLoanForm: (value: { borrowerName: string; borrowerUsername: string; purpose: string; loanDate: string }) => void;
  processForm: BrimenProcessFormState;
  setProcessForm: (value: BrimenProcessFormState) => void;
  actionMessage: string;
  setActionMessage: (value: string) => void;
  reload: () => Promise<void>;
}) {
  const [dataPage, setDataPage] = useState(1);
  const [dataPageSize, setDataPageSize] = useState(10);
  const [loanPage, setLoanPage] = useState(1);
  const [loanPageSize, setLoanPageSize] = useState(10);
  const [mobileOperationalOpen, setMobileOperationalOpen] = useState(false);
  const [mobileOperationalPreview, setMobileOperationalPreview] = useState<{ title: string; summary: string } | undefined>();
  const operationalLongPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const operationalLongPressTriggered = useRef(false);
  const [quickDocFilter, setQuickDocFilter] = useState("Semua");
  const [initialProcess, setInitialProcess] = useState<BrimenOperationType | null>(null);
  const [covenanceRecords, setCovenanceRecords] = useState<CovenanceRecord[]>([]);
  const [covenanceDateFrom, setCovenanceDateFrom] = useState("");
  const [covenanceDateTo, setCovenanceDateTo] = useState("");
  const [covenanceSelected, setCovenanceSelected] = useState<(LoanSnapshot & { record?: CovenanceRecord; dataStatus: "Lengkap" | "Belum Lengkap" })>();
  const [covenanceMode, setCovenanceMode] = useState<"detail" | "edit">();
  const [covenanceForm, setCovenanceForm] = useState<CovenanceFormState>(emptyCovenanceForm);
  const [covenanceMessage, setCovenanceMessage] = useState("");
  const [savingCovenance, setSavingCovenance] = useState(false);
  useEffect(() => {
    fetch("/api/covenance", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => { if (payload.ok) setCovenanceRecords(payload.data ?? []); })
      .catch(() => undefined);
  }, [latestLoanPeriod]);
  const creditAccountSet = useMemo(
    () => new Set(creditAccounts.map((account) => normalizeAccount(account))),
    [creditAccounts],
  );
  const lower = search.trim().toLowerCase();
  const isActiveArchived = (item: BrimenCustomer) => item.isLatestLw321 === true && Boolean(item.brimenBerkas?.trim());
  const isActiveUnarchived = (item: BrimenCustomer) => item.isLatestLw321 === true && !item.brimenBerkas?.trim();
  const archivedActiveRows = rows.filter(isActiveArchived);
  const unarchivedActiveRows = rows.filter(isActiveUnarchived);
  const borrowedCustomerRows = rows.filter((item) => item.status === "Dipinjam");
  const matchesCustomerSearch = (item: BrimenCustomer) => {
    if (!lower) return true;
    return (
      item.accountNumber.toLowerCase().includes(lower) ||
      item.name.toLowerCase().includes(lower) ||
      item.mantri.toLowerCase().includes(lower) ||
      item.brimenBerkas.toLowerCase().includes(lower) ||
      item.brimenJaminan.toLowerCase().includes(lower) ||
      item.guarantee.toLowerCase().includes(lower)
    );
  };
  const dataSourceRows =
    filter === "Arsip Aktif"
      ? archivedActiveRows
      : filter === "Belum Arsip"
        ? unarchivedActiveRows
        : filter === "Semua"
          ? rows
          : rows.filter((item) => item.status === filter);
  const quickFilteredRows = dataSourceRows.filter((item) => {
    if (quickDocFilter === "Ada Jaminan") return hasBrimenGuarantee(item);
    if (quickDocFilter === "Tanpa Jaminan") return !hasBrimenGuarantee(item);
    if (quickDocFilter === "Belum Arsip") return !item.brimenBerkas?.trim();
    if (quickDocFilter === "Dipinjam") return item.status === "Dipinjam";
    if (quickDocFilter === "Perlu Lengkap") return needsBrimenCompletion(item);
    return true;
  });
  const filteredRows = quickFilteredRows.filter(matchesCustomerSearch);

  const matchedCredit = rows.filter((item) => item.persistedInBrimen !== false && creditAccountSet.has(normalizeAccount(item.accountNumber))).length;
  const borrowedLoans = loans.filter((loan) => loan.status === "Dipinjam");
  const borrowedLoanCustomerIds = new Set(borrowedLoans.map((loan) => loan.customerId));
  const borrowedFileRows: BorrowedFileRow[] = [
    ...borrowedLoans.map((loan) => ({
      id: loan.id,
      customerId: loan.customerId,
      accountNumber: loan.accountNumber,
      customerName: loan.customerName,
      plafond: loan.plafond,
      brimenBerkas: loan.brimenBerkas,
      brimenJaminan: loan.brimenJaminan,
      guarantee: loan.guarantee,
      borrowerName: loan.borrowerName,
      borrowerUsername: loan.borrowerUsername,
      loan,
    })),
    ...borrowedCustomerRows
      .filter((item) => !borrowedLoanCustomerIds.has(item.id))
      .map((item) => ({
        id: item.id,
        customerId: item.id,
        accountNumber: item.accountNumber,
        customerName: item.name,
        plafond: item.plafond,
        brimenBerkas: item.brimenBerkas,
        brimenJaminan: item.brimenJaminan,
        guarantee: item.guarantee,
        borrowerName: "-",
        borrowerUsername: "-",
      })),
  ];
  const archivedActiveFiltered = archivedActiveRows.filter(matchesCustomerSearch);
  const unarchivedActiveFiltered = unarchivedActiveRows.filter(matchesCustomerSearch);
  const showingBorrowed = filter === "Dipinjam";
  const showingRegister = filter === "Register Pinjam Berkas";
  const showingCovenance = filter === "Covenance Day";
  const showingArchivedActive = filter === "Arsip Aktif";
  const showingUnarchivedActive = filter === "Belum Arsip";
  const matchesLoanSearch = (loan: BrimenLoan) => {
    if (!lower) return true;
    return (
      loan.accountNumber?.toLowerCase().includes(lower) ||
      loan.customerName?.toLowerCase().includes(lower) ||
      loan.borrowerName.toLowerCase().includes(lower) ||
      loan.borrowerUsername.toLowerCase().includes(lower) ||
      loan.purpose.toLowerCase().includes(lower)
    );
  };
  const filteredLoans = loans.filter(matchesLoanSearch);
  const filteredBorrowedFileRows = borrowedFileRows.filter((row) => {
    if (!lower) return true;
    return (
      row.accountNumber?.toLowerCase().includes(lower) ||
      row.customerName?.toLowerCase().includes(lower) ||
      row.borrowerName.toLowerCase().includes(lower) ||
      row.borrowerUsername.toLowerCase().includes(lower) ||
      row.brimenBerkas?.toLowerCase().includes(lower) ||
      row.brimenJaminan?.toLowerCase().includes(lower) ||
      row.guarantee?.toLowerCase().includes(lower)
    );
  });
  const activeLoanRows = filteredLoans;
  const dueBorrowedLoans = borrowedLoans.filter((loan) => {
    const borrowedAt = new Date(`${loan.loanDate.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(borrowedAt.getTime())) return false;
    const dayDiff = (Date.now() - borrowedAt.getTime()) / 86_400_000;
    return dayDiff >= 3;
  });
  const readyProcessRows = archivedActiveRows;
  const incompleteRows = rows.filter(needsBrimenCompletion);
  const covenanceRecordMap = new Map(covenanceRecords.map((item) => [`${normalizeAccount(item.accountNumber)}|${item.realizedDate}`, item]));
  const isCovenanceComplete = (record?: CovenanceRecord | CovenanceFormState) => Boolean(record && [
    record.sphNumber,
    record.creditApplicationNumber,
    record.ktpNumber,
    record.kkNumber,
    record.skuNibNumber,
    record.slikOjk,
  ].every((value) => value.trim()));
  const previousCovenancePeriod = getPreviousMonth(latestLoanPeriod);
  const visibleCovenancePeriods = new Set([latestLoanPeriod, previousCovenancePeriod].filter((value): value is MonthKey => Boolean(value)));
  const covenantRows = latestLoanRows
    .filter((item) => visibleCovenancePeriods.has(item.realizedDate.slice(0, 7) as MonthKey))
    .map((item) => {
      const record = covenanceRecordMap.get(`${normalizeAccount(item.accountNumber)}|${item.realizedDate}`);
      return { ...item, record, dataStatus: isCovenanceComplete(record) ? "Lengkap" as const : "Belum Lengkap" as const };
    })
    .sort((a, b) => b.realizedDate.localeCompare(a.realizedDate) || a.debtorName.localeCompare(b.debtorName));
  const filteredCovenantRows = covenantRows.filter((item) => {
    if (covenanceDateFrom && (!item.realizedDate || item.realizedDate < covenanceDateFrom)) return false;
    if (covenanceDateTo && (!item.realizedDate || item.realizedDate > covenanceDateTo)) return false;
    if (!lower) return true;
    return [
      item.accountNumber,
      item.debtorName,
      item.mantri,
      getProductType(item.description, item.loanType),
      item.dataStatus,
    ].some((value) => String(value ?? "").toLowerCase().includes(lower));
  });
  const covenanceCompletionCount = Object.values(covenanceForm).filter((value) => value.trim()).length;
  const covenantTotalPages = Math.max(1, Math.ceil(filteredCovenantRows.length / dataPageSize));
  const safeCovenantPage = Math.min(dataPage, covenantTotalPages);
  const pagedCovenantRows = filteredCovenantRows.slice((safeCovenantPage - 1) * dataPageSize, safeCovenantPage * dataPageSize);
  const activeFilterCount = Number(filter !== "Semua") + Number(Boolean(search.trim())) + Number(quickDocFilter !== "Semua");
  const dataTotalPages = Math.max(1, Math.ceil(filteredRows.length / dataPageSize));
  const safeDataPage = Math.min(dataPage, dataTotalPages);
  const pagedRows = filteredRows.slice((safeDataPage - 1) * dataPageSize, safeDataPage * dataPageSize);
  const activeLoanTotal = showingBorrowed ? filteredBorrowedFileRows.length : activeLoanRows.length;
  const loanTotalPages = Math.max(1, Math.ceil(activeLoanTotal / loanPageSize));
  const safeLoanPage = Math.min(loanPage, loanTotalPages);
  const pagedLoans = activeLoanRows.slice((safeLoanPage - 1) * loanPageSize, safeLoanPage * loanPageSize);
  const pagedBorrowedFileRows = filteredBorrowedFileRows.slice((safeLoanPage - 1) * loanPageSize, safeLoanPage * loanPageSize);
  const tabItems = [
    { label: "Covenance Day", value: "Covenance Day", count: covenantRows.length, icon: CalendarDays, tone: "orange" },
    { label: "Berkas Aktif Dalam Arsip", value: "Arsip Aktif", count: archivedActiveRows.length, icon: FolderArchive, tone: "blue" },
    { label: "Semua Data", value: "Semua", count: rows.length, icon: ClipboardList, tone: "navy" },
    { label: "Berkas Dipinjam", value: "Dipinjam", count: borrowedFileRows.length, icon: Upload, tone: "orange" },
    { label: "Berkas Aktif Belum di Arsip", value: "Belum Arsip", count: unarchivedActiveRows.length, icon: AlertTriangle, tone: "red" },
    { label: "Register Pinjam Berkas", value: "Register Pinjam Berkas", count: loans.length, icon: FileSpreadsheet, tone: "green" },
  ];
  const mobileQuickItems = [
    { label: "Covenance Day", value: "Covenance Day", icon: CalendarDays, tone: "orange", inactive: false },
    { label: "Tambah Data", value: "Belum Arsip", icon: FilePlus2, tone: "blue", inactive: false },
    { label: "Edit Data", value: "Semua", icon: FileText, tone: "green", inactive: false },
    { label: "Pinjam Berkas", value: "Arsip Aktif", icon: ClipboardList, tone: "navy", inactive: false },
  ];
  const activeTabLabel = tabItems.find((item) => item.value === filter)?.label ?? "Data Operasional";

  function openOperationalTab(value: string) {
    setFilter(value);
    setSearch("");
    setQuickDocFilter("Semua");
    setDataPage(1);
    setLoanPage(1);
    setFormMode("none");
    setLoanCustomer(undefined);
    setForm(emptyBrimenForm);
    setProcessForm(emptyBrimenProcessForm);
    setMobileOperationalOpen(true);
  }

  function startOperationalLongPress(title: string, summary: string) {
    operationalLongPressTriggered.current = false;
    operationalLongPressTimer.current = setTimeout(() => {
      operationalLongPressTriggered.current = true;
      setMobileOperationalPreview({ title, summary });
    }, 550);
  }

  function cancelOperationalLongPress() {
    if (operationalLongPressTimer.current) clearTimeout(operationalLongPressTimer.current);
  }

  function consumeOperationalLongPress() {
    if (!operationalLongPressTriggered.current) return false;
    operationalLongPressTriggered.current = false;
    return true;
  }

  function openAddNewLoanForm() {
    setSearch("");
    setQuickDocFilter("Semua");
    setDataPage(1);
    setLoanPage(1);
    setLoanCustomer(undefined);
    setProcessForm(emptyBrimenProcessForm);
    setInitialProcess(null);
    setForm(emptyBrimenForm);
    setFormMode("add-choice");
    setActionMessage("");
    setMobileOperationalOpen(true);
  }

  function closeMobileOperational() {
    setMobileOperationalOpen(false);
    setSearch("");
    setQuickDocFilter("Semua");
    setDataPage(1);
    setLoanPage(1);
    setFormMode("none");
    setLoanCustomer(undefined);
    setForm(emptyBrimenForm);
    setProcessForm(emptyBrimenProcessForm);
    setInitialProcess(null);
  }

  function exportOperationalData(format: "csv" | "xls" = "csv") {
    const exportFile = (baseName: string, headers: string[], data: (string | number | undefined | null)[][]) => {
      if (format === "xls") exportRowsXls(`${baseName}.xls`, headers, data);
      else exportRowsCsv(`${baseName}.csv`, headers, data);
    };

    if (showingCovenance) {
      exportFile(
        `covenance-day-${latestLoanPeriod}`,
        ["No Rekening", "Nama Debitur", "Plafond", "Tanggal Realisasi", "Produk", "Status Data", "No SPH", "No Surat Permohonan Kredit", "No KTP", "No KK", "No SKU/NIB", "No NPWP"],
        filteredCovenantRows.map((item) => [
          formatAccountNumber(item.accountNumber),
          item.debtorName,
          item.plafond,
          item.realizedDate,
          getProductType(item.description, item.loanType),
          item.dataStatus,
          item.record?.sphNumber,
          item.record?.creditApplicationNumber,
          item.record?.ktpNumber,
          item.record?.kkNumber,
          item.record?.skuNibNumber,
          item.record?.slikOjk,
        ]),
      );
      return;
    }

    if (showingBorrowed) {
      exportFile(
        "berkas-dipinjam-brimen",
        ["No Rekening", "Nama Nasabah", "Plafond", "No BRIMEN Berkas", "No BRIMEN Jaminan", "Jaminan", "Nama Peminjam", "Username Peminjam"],
        filteredBorrowedFileRows.map((row) => [
          formatAccountNumber(row.accountNumber),
          row.customerName,
          row.plafond ?? 0,
          row.brimenBerkas,
          row.brimenJaminan,
          row.guarantee,
          row.borrowerName,
          row.borrowerUsername,
        ]),
      );
      return;
    }

    if (showingRegister) {
      exportFile(
        "register-pinjam-berkas-brimen",
        ["No Rekening", "Nama Nasabah", "No BRIMEN Berkas", "No BRIMEN Jaminan", "Nama Peminjam", "Username", "Keperluan", "Tanggal Pinjam", "Tanggal Kembali", "Status"],
        filteredLoans.map((loan) => [
          formatAccountNumber(loan.accountNumber),
          loan.customerName,
          loan.brimenBerkas,
          loan.brimenJaminan,
          loan.borrowerName,
          loan.borrowerUsername,
          loan.purpose,
          loan.loanDate,
          loan.returnedDate ?? "",
          loan.status,
        ]),
      );
      return;
    }

    exportFile(
      "data-brimen-dashboard",
      ["No Rekening", "Nama Nasabah", "Plafond", "Tanggal Realisasi", "Officer / Mantri", "Alamat Nasabah", "Detail Jaminan", "No Brimen Berkas", "No Brimen Jaminan", "Status", "Branch Code", "Update Terakhir"],
      filteredRows.map((row) => [
        row.accountNumber,
        row.name,
        row.plafond,
        row.realizationDate,
        row.mantri,
        row.address,
        row.guarantee,
        row.brimenBerkas,
        row.brimenJaminan,
        getBrimenStatusLabel(row.status, row),
        row.branchCode,
        row.updatedAt,
      ]),
    );
  }

  function openCovenanceForm(item: LoanSnapshot & { record?: CovenanceRecord; dataStatus: "Lengkap" | "Belum Lengkap" }, mode: "detail" | "edit") {
    setCovenanceSelected(item);
    setCovenanceMode(mode);
    setCovenanceForm(item.record ? {
      sphNumber: item.record.sphNumber,
      creditApplicationNumber: item.record.creditApplicationNumber,
      ktpNumber: item.record.ktpNumber,
      kkNumber: item.record.kkNumber,
      skuNibNumber: item.record.skuNibNumber,
      slikOjk: item.record.slikOjk,
    } : emptyCovenanceForm);
    setCovenanceMessage("");
  }

  async function saveCovenance() {
    if (!covenanceSelected) return;
    setSavingCovenance(true);
    setCovenanceMessage("");
    try {
      const response = await fetch("/api/covenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: latestLoanPeriod,
          accountNumber: covenanceSelected.accountNumber,
          debtorName: covenanceSelected.debtorName,
          realizedDate: covenanceSelected.realizedDate,
          ...covenanceForm,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Data Covenance belum dapat disimpan.");
      const saved = payload.data as CovenanceRecord;
      setCovenanceRecords((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setActionMessage(isCovenanceComplete(saved) ? `Data Covenance ${saved.debtorName} berhasil disimpan dengan status Lengkap.` : `Data Covenance ${saved.debtorName} berhasil disimpan dengan status Belum Lengkap.`);
      setCovenanceSelected(undefined);
      setCovenanceMode(undefined);
      setCovenanceForm(emptyCovenanceForm);
      setCovenanceMessage("");
    } catch (error) {
      setCovenanceMessage(error instanceof Error ? error.message : "Data Covenance belum dapat disimpan.");
    } finally {
      setSavingCovenance(false);
    }
  }

  async function submitCustomer() {
    const isUpdate = formMode === "edit" || formMode === "archive";
    if (isUpdate && !form.id) {
      setActionMessage("Data yang akan diperbarui belum dipilih.");
      return;
    }

    setActionMessage(isUpdate ? "Memperbarui data BRIMEN..." : "Menyimpan data BRIMEN...");
    const response = await fetch(isUpdate ? `/api/brimen/${form.id}` : "/api/brimen", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setActionMessage(payload.message ?? "Gagal menyimpan data.");
      return;
    }
    setFormMode("none");
    setForm(emptyBrimenForm);
    setActionMessage(
      formMode === "archive"
        ? "Data berhasil diarsipkan."
        : isUpdate
          ? "Data BRIMEN berhasil diperbarui."
          : "Data BRIMEN berhasil disimpan.",
    );
    await reload();
  }

  async function submitProcess() {
    if (!loanCustomer || !form.id) return;
    setActionMessage(`Memproses ${processForm.operationType}...`);

    if (processForm.operationType === "Peminjaman Berkas") {
      const response = await fetch("/api/brimen/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: loanCustomer.id,
          borrowerName: currentBrimenUser.name,
          borrowerUsername: currentBrimenUser.username,
          loanDate: new Date().toISOString().slice(0, 10),
          purpose: "Konfirmasi penerimaan berkas oleh peminjam.",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setActionMessage(payload.message ?? "Gagal membuat peminjaman berkas.");
        return;
      }
      setFormMode("none");
      setLoanCustomer(undefined);
      setForm(emptyBrimenForm);
      setProcessForm(emptyBrimenProcessForm);
      setInitialProcess(null);
      setActionMessage("Peminjaman berkas berhasil dikonfirmasi.");
      await reload();
      return;
    }

    const body =
      processForm.operationType === "Edit Data"
        ? form
        : {
            ...form,
            plafond: processForm.operationType === "Suplesi" && processForm.newPlafond ? processForm.newPlafond : form.plafond,
            brimenBerkas: processForm.operationType === "Suplesi" ? form.brimenBerkas : processForm.newBrimenBerkas || form.brimenBerkas,
            brimenJaminan:
              processForm.operationType === "Suplesi"
                ? form.brimenJaminan
                : processForm.operationType === "Pelunasan"
                ? "-"
                : processForm.newBrimenJaminan || form.brimenJaminan,
            guarantee:
              processForm.operationType === "Pelunasan" ||
              (processForm.operationType === "Suplesi" && processForm.guaranteeAction === "ambil")
                ? "Tidak ada detail jaminan"
                : processForm.newGuarantee || form.guarantee,
            status: processForm.operationType === "Pelunasan" ? "Lunas" : form.status,
          };

    const response = await fetch(`/api/brimen/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setActionMessage(payload.message ?? "Gagal memproses data.");
      return;
    }
    setFormMode("none");
    setLoanCustomer(undefined);
    setForm(emptyBrimenForm);
    setProcessForm(emptyBrimenProcessForm);
    setInitialProcess(null);
    setActionMessage(`${processForm.operationType} berhasil diproses.`);
    await reload();
  }

  async function deleteCustomer(row: BrimenCustomer) {
    const confirmed = window.confirm(`Hapus data BRIMEN ${row.name}?`);
    if (!confirmed) return;
    setActionMessage("Menghapus data BRIMEN...");
    const response = await fetch(`/api/brimen/${row.id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setActionMessage(payload.message ?? "Gagal menghapus data.");
      return;
    }
    setActionMessage("Data BRIMEN berhasil dihapus.");
    await reload();
  }

  async function submitLoan() {
    if (!loanCustomer) return;
    setActionMessage("Menyimpan peminjaman berkas...");
    const response = await fetch("/api/brimen/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: loanCustomer.id,
        ...loanForm,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setActionMessage(payload.message ?? "Gagal membuat peminjaman.");
      return;
    }
    setFormMode("none");
    setLoanCustomer(undefined);
    setLoanForm({ borrowerName: "", borrowerUsername: "", purpose: "", loanDate: "" });
    setActionMessage("Peminjaman berkas berhasil dibuat.");
    await reload();
  }

  async function returnLoan(loan: BrimenLoan) {
    setActionMessage("Mengembalikan berkas...");
    const response = await fetch(`/api/brimen/loans/${loan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Sudah Dikembalikan",
        actor: "Dashboard Operasional",
        note: "Berkas dikembalikan melalui Dashboard Operasional.",
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setActionMessage(payload.message ?? "Gagal mengembalikan berkas.");
      return;
    }
    setActionMessage("Berkas berhasil dikembalikan.");
    await reload();
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Dashboard Operasional"
        description="Arsip berkas dan jaminan nasabah dengan tema BRI, terhubung ke database BRIMEN lokal."
        icon={FolderArchive}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
        {[
          { label: "Arsip Aktif", value: readyProcessRows.length, helper: "termasuk dipinjam", tone: "success", action: "Arsip Aktif" },
          { label: "Berkas Dipinjam", value: borrowedFileRows.length, helper: "status dipinjam", tone: "warning", action: "Dipinjam" },
          { label: "Belum Arsip", value: unarchivedActiveRows.length, helper: "lengkapi hari ini", tone: "danger", action: "Belum Arsip" },
          { label: "Perlu Lengkap", value: incompleteRows.length, helper: "data wajib kosong", tone: "warning", action: "Semua" },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              openOperationalTab(item.action);
              if (item.label === "Perlu Lengkap") setQuickDocFilter("Perlu Lengkap");
            }}
            className={cn(
              "quick-stat-card bri-card min-w-[138px] rounded-lg border bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 sm:min-w-0",
              item.tone === "danger"
                ? "border-rose-200"
                : item.tone === "success"
                  ? "border-emerald-200"
                  : "border-[#f37021]/25",
            )}
          >
            <p className="text-[9px] font-black uppercase text-muted-foreground sm:text-[10px]">{item.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-base font-black text-[#00529c] sm:text-lg">{item.value}</span>
              <span className="text-[9px] font-semibold text-[#f37021] sm:text-[10px]">{item.helper}</span>
            </div>
          </button>
        ))}
      </div>

      <div className={cn("workspace-tabs surface-panel p-3 sm:p-4", mobileOperationalOpen ? "hidden sm:block" : "block")}>
        <div className="mb-2 rounded-md border border-[#d7e3ef] bg-[#fffaf6] px-3 py-2 sm:hidden">
          <p className="text-xs font-black uppercase text-[#f37021]">Fitur Utama</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-label={item.label}
                  data-operational-tab={item.value}
                  onClick={() => {
                    if (consumeOperationalLongPress()) return;
                    openOperationalTab(item.value);
                  }}
                  onTouchStart={() => startOperationalLongPress(item.label, `${item.count} data tersedia pada menu ini.`)}
                  onTouchEnd={cancelOperationalLongPress}
                  onTouchMove={cancelOperationalLongPress}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMobileOperationalPreview({ title: item.label, summary: `${item.count} data tersedia pada menu ini.` });
                  }}
                  className={cn(
                    "workspace-tab-button group flex min-h-[82px] flex-col items-center justify-center gap-1 rounded-lg border bg-white px-2 py-2 text-center text-[9px] font-black uppercase leading-tight tracking-normal transition active:scale-[0.99] sm:h-[86px] sm:min-h-[86px] sm:gap-1.5 sm:rounded-md sm:px-2 sm:py-2 sm:text-xs sm:font-bold sm:normal-case",
                    item.value === "Covenance Day" && "hidden sm:flex",
                    active
                      ? "border-[#f37021] bg-[#f7fbff] text-[#00529c] shadow-[inset_0_-3px_0_#f37021,0_8px_18px_rgba(0,82,156,0.10)] sm:bg-[#00529c] sm:text-white"
                      : "border-[#d7e3ef] text-[#004077] shadow-[0_6px_14px_rgba(0,55,105,0.045)] hover:-translate-y-0.5 hover:border-[#00529c]/35 hover:bg-[#f7fbff] sm:text-muted-foreground sm:hover:bg-[#00529c]/10 sm:hover:text-[#00529c]",
                  )}
                  data-active={active}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-white transition sm:h-8 sm:w-8 sm:shadow-sm",
                      operationalTabTones[item.tone],
                      active && "ring-2 ring-[#f37021]/45 ring-offset-2",
                    )}
                  >
                    <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
                  </span>
                  <span className="max-w-[150px] sm:flex sm:min-h-7 sm:max-w-none sm:items-center sm:justify-center sm:text-center sm:leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-2 sm:hidden">
            <div className="mt-0 rounded-md border border-[#d7e3ef] bg-[#fffaf6] px-3 py-2">
              <p className="text-xs font-black uppercase text-[#f37021]">Aksi Cepat</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mobileQuickItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-label={item.label}
                    data-mobile-action={item.label}
                    disabled={item.inactive}
                    onTouchStart={() => startOperationalLongPress(item.label, item.inactive ? "Fitur sedang disiapkan." : "Tekan untuk membuka proses operasional terkait.")}
                    onTouchEnd={cancelOperationalLongPress}
                    onTouchMove={cancelOperationalLongPress}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setMobileOperationalPreview({ title: item.label, summary: item.inactive ? "Fitur sedang disiapkan." : "Tekan untuk membuka proses operasional terkait." });
                    }}
                    onClick={() => {
                      if (consumeOperationalLongPress()) return;
                      if (item.inactive) {
                        setActionMessage("Fitur Covenance Day belum tersedia.");
                        return;
                      }
                      if (item.label === "Tambah Data") {
                        openAddNewLoanForm();
                        return;
                      }
                      openOperationalTab(item.value);
                    }}
                    className={cn(
                      "group flex min-h-[78px] flex-col items-center justify-center gap-1 rounded-lg border bg-white px-2 py-1.5 text-[9px] font-black uppercase leading-tight text-[#004077] shadow-[0_8px_18px_rgba(0,55,105,0.07)] transition active:scale-[0.99]",
                      item.inactive
                        ? "border-[#d7e3ef] opacity-65"
                        : "border-[#d7e3ef] hover:border-[#f37021]/45 hover:bg-[#fffaf6]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-lg border shadow-sm transition group-hover:-translate-y-0.5",
                        item.tone === "orange"
                          ? "border-[#f37021]/20 bg-[#fff7ed] text-[#f37021]"
                          : item.tone === "green"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-[#00529c]/20 bg-[#eaf3fb] text-[#00529c]",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="max-w-[132px] text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
            {mobileOperationalPreview ? (
              <div className="rounded-lg border border-[#f7c9aa] bg-[#fff7ed] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-[#f37021]">Ringkasan Cepat</p>
                    <p className="mt-1 font-black text-[#00529c]">{mobileOperationalPreview.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{mobileOperationalPreview.summary}</p>
                  </div>
                  <button type="button" aria-label="Tutup ringkasan" onClick={() => setMobileOperationalPreview(undefined)} className="grid h-7 w-7 place-items-center rounded-md bg-white text-[#00529c]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="hidden sm:flex sm:flex-row sm:gap-2.5">
            <Button
              variant="outline"
              className="h-28 flex-col gap-2 text-[11px] uppercase sm:h-10 sm:flex-row sm:gap-1 sm:text-sm sm:normal-case"
              onClick={openAddNewLoanForm}
            >
              <span className="grid h-12 w-12 place-items-center rounded-lg border border-[#00529c]/20 bg-[#eaf3fb] text-[#00529c] sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:text-current">
                <FilePlus2 className="h-6 w-6 sm:h-4 sm:w-4" />
              </span>
              <span>Tambah Data</span>
            </Button>
            <Button className="h-28 flex-col gap-2 text-[11px] uppercase sm:h-10 sm:flex-row sm:gap-1 sm:text-sm sm:normal-case" onClick={() => exportOperationalData("csv")}>
              <span className="grid h-12 w-12 place-items-center rounded-lg border border-white/25 bg-white/15 text-white sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:text-current">
                <Download className="h-6 w-6 sm:h-4 sm:w-4" />
              </span>
              <span>Export CSV</span>
            </Button>
            <Button variant="outline" className="h-28 flex-col gap-2 text-[11px] uppercase sm:h-10 sm:flex-row sm:gap-1 sm:text-sm sm:normal-case" onClick={() => exportOperationalData("xls")}>
              <FileSpreadsheet className="h-6 w-6 sm:h-4 sm:w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 hidden gap-3 sm:grid lg:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onInput={() => {
                setDataPage(1);
                setLoanPage(1);
              }}
              placeholder="Cari no rekening, nama, mantri, lokasi berkas, atau jaminan"
              className="h-11 pl-9"
            />
          </div>
          <Select value={filter} onChange={(event) => {
            setFilter(event.target.value);
            setQuickDocFilter("Semua");
            setDataPage(1);
            setLoanPage(1);
          }} className="hidden h-11 sm:block">
            {[
              "Arsip Aktif",
              "Semua",
              "Disimpan",
              "Dipinjam",
              "Diambil",
              "Lunas",
              "Belum Arsip",
              "Register Pinjam Berkas",
            ].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </div>
        <div className="mt-3 hidden flex-wrap items-center gap-2 text-xs sm:flex">
          <Badge variant="secondary">
            {showingRegister
              ? `${filteredLoans.length} dari ${loans.length} register`
              : showingBorrowed
                ? `${filteredBorrowedFileRows.length} dari ${borrowedFileRows.length} berkas dipinjam`
                : `${filteredRows.length} dari ${rows.length} data`}
          </Badge>
          <Badge variant="outline">{archivedActiveRows.length} aktif dalam arsip</Badge>
          <Badge variant="outline">{unarchivedActiveRows.length} aktif belum arsip</Badge>
          <Badge variant="outline">{matchedCredit} cocok data kredit</Badge>
          {showingArchivedActive ? <Badge variant="success">{archivedActiveFiltered.length} data siap proses</Badge> : null}
          {showingUnarchivedActive ? <Badge variant="warning">{unarchivedActiveFiltered.length} perlu dilengkapi</Badge> : null}
          {filter !== "Semua" ? <Badge variant="outline">Filter: {filter}</Badge> : null}
          {search.trim() ? <Badge variant="outline">Cari: {search.trim()}</Badge> : null}
          {activeFilterCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter("Semua");
                setSearch("");
                setQuickDocFilter("Semua");
                setDataPage(1);
                setLoanPage(1);
              }}
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset Filter
            </Button>
          ) : null}
          <span className="text-muted-foreground">{status}</span>
        </div>
        {actionMessage ? (
          <p className="mt-2 rounded-md border border-[#d7e3ef] bg-[#00529c]/5 px-3 py-2 text-sm font-medium text-[#00529c]">
            {actionMessage}
          </p>
        ) : null}
      </div>

      <div className={cn("space-y-5", mobileOperationalOpen ? "block" : "hidden sm:block")}>
        <div className="rounded-lg border border-[#d7e3ef] bg-white px-3 py-3 sm:hidden">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Data Operasional</p>
            <h2 className="text-base font-black text-[#00529c]">{activeTabLabel}</h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-[#d7e3ef] bg-[#f8fbfe] p-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Total</p>
              <p className="text-base font-black text-[#00529c]">
                {showingCovenance ? filteredCovenantRows.length : showingBorrowed ? filteredBorrowedFileRows.length : showingRegister ? filteredLoans.length : filteredRows.length}
              </p>
            </div>
            <div className="rounded-md border border-[#d7e3ef] bg-[#fff7ed] p-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{showingCovenance ? "Belum Lengkap" : showingRegister ? "Dipinjam" : "Belum Arsip"}</p>
              <p className="text-base font-black text-[#f37021]">
                {showingCovenance ? filteredCovenantRows.filter((item) => item.dataStatus === "Belum Lengkap").length : showingRegister ? filteredLoans.filter((loan) => loan.status === "Dipinjam").length : unarchivedActiveFiltered.length}
              </p>
            </div>
            <div className="rounded-md border border-[#d7e3ef] bg-emerald-50 p-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{showingCovenance ? "Lengkap" : showingRegister ? "Selesai" : showingBorrowed ? "Jaminan" : "Lengkap"}</p>
              <p className="text-base font-black text-emerald-700">
                {showingCovenance
                  ? filteredCovenantRows.filter((item) => item.dataStatus === "Lengkap").length
                  : showingRegister
                  ? filteredLoans.filter((loan) => loan.status === "Sudah Dikembalikan").length
                  : showingBorrowed
                  ? filteredBorrowedFileRows.filter((row) => hasBrimenGuarantee({ brimenJaminan: row.brimenJaminan ?? "", guarantee: row.guarantee ?? "" })).length
                  : filteredRows.filter((row) => !needsBrimenCompletion(row)).length}
              </p>
            </div>
          </div>
        </div>

        {formMode === "none" ? (
          <div className="grid gap-2 rounded-lg border border-[#d7e3ef] bg-white p-3 sm:hidden">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setDataPage(1);
                setLoanPage(1);
              }}
              placeholder="Cari no rekening, nama, mantri, atau jaminan"
              className="h-11"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={() => exportOperationalData("csv")} className="h-11 bg-[#00529c] hover:bg-[#004077]">
                <Download className="h-4 w-4" />CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => exportOperationalData("xls")} className="h-11 border-[#00529c]/25 text-[#00529c]">
                <FileSpreadsheet className="h-4 w-4" />Excel
              </Button>
            </div>
            {!showingBorrowed && !showingRegister && !showingCovenance ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["Semua", "Ada Jaminan", "Tanpa Jaminan", "Belum Arsip", "Dipinjam", "Perlu Lengkap"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuickDocFilter(item);
                      setDataPage(1);
                    }}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold",
                      quickDocFilter === item
                        ? "border-[#f37021] bg-[#00529c] text-white"
                        : "border-[#d7e3ef] bg-white text-[#004077]",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

      {formMode === "add-choice" ? (
        <BrimenAddChoice
          onCancel={() => {
            setFormMode("none");
            setForm(emptyBrimenForm);
            setLoanCustomer(undefined);
            setProcessForm(emptyBrimenProcessForm);
            setInitialProcess(null);
            setActionMessage("");
          }}
          onNewDebtor={() => {
            setForm({
              ...emptyBrimenForm,
              realizationDate: new Date().toISOString().slice(0, 10),
              status: "Disimpan",
            });
            setFormMode("add");
            setActionMessage("Menu ini hanya untuk menambah data pinjaman baru yang belum punya riwayat pinjam dan belum punya No BRIMEN Berkas/Jaminan. Untuk suplesi, gunakan Debitur Suplesi.");
          }}
          onSuplesiDebtor={() => {
            const today = new Date().toISOString().slice(0, 10);
            setLoanCustomer({ ...emptySuplesiCustomer, realizationDate: today });
            setForm({
              ...emptyBrimenForm,
              accountNumber: "",
              name: "",
              plafond: "",
              realizationDate: today,
              status: "Disimpan",
            });
            setProcessForm({
              ...emptyBrimenProcessForm,
              operationType: "Suplesi",
              processDate: today,
              newPlafond: "",
              newBrimenBerkas: "",
              newBrimenJaminan: "",
              newGuarantee: "",
            });
            setInitialProcess("Suplesi");
            setFormMode("process");
            setActionMessage("");
          }}
        />
      ) : null}

      {formMode === "add" ? (
        <BrimenCustomerForm
          mode="add"
          form={form}
          setForm={setForm}
          loanLookupRows={latestLoanRows}
          loanLookupLabel={`LW321 terbaru posisi ${getMonthLabel(latestLoanPeriod)}`}
          onCancel={() => {
            setFormMode("none");
            setForm(emptyBrimenForm);
          }}
          onSubmit={submitCustomer}
        />
      ) : null}

      {formMode === "edit" || formMode === "archive" ? (
        <BrimenCustomerForm
          mode={formMode}
          form={form}
          setForm={setForm}
          onCancel={() => {
            setFormMode("none");
            setForm(emptyBrimenForm);
          }}
          onSubmit={submitCustomer}
        />
      ) : null}

      {formMode === "detail" ? (
        <BrimenCustomerDetailForm
          form={form}
          onClose={() => {
            setFormMode("none");
            setForm(emptyBrimenForm);
          }}
        />
      ) : null}

      {formMode === "process" && loanCustomer ? (
        <BrimenProcessForm
          customer={loanCustomer}
          rows={rows}
          previousLoanRows={getSnapshots(getPreviousMonth(latestLoanPeriod) ?? latestLoanPeriod)}
          previousLoanPeriod={getPreviousMonth(latestLoanPeriod) ?? latestLoanPeriod}
          customerForm={form}
          setCustomerForm={setForm}
          processForm={processForm}
          setProcessForm={setProcessForm}
          onCancel={() => {
            setFormMode("none");
            setLoanCustomer(undefined);
            setForm(emptyBrimenForm);
            setProcessForm(emptyBrimenProcessForm);
            setInitialProcess(null);
          }}
          initialProcess={initialProcess ?? undefined}
          onSubmit={submitProcess}
        />
      ) : null}

      {showingCovenance ? (
        <>
          <Card className="bri-card border-[#d7e3ef]">
            <CardHeader className="border-b border-[#d7e3ef] bg-[#fffaf6]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#00529c]"><CalendarDays className="h-5 w-5 text-[#f37021]" />Covenance Day</CardTitle>
                  <CardDescription className="mt-1">Kelengkapan dokumen untuk realisasi {previousCovenancePeriod ? getMonthLabel(previousCovenancePeriod) : "bulan lalu"} dan {getMonthLabel(latestLoanPeriod)}. Status tersimpan tetap dipertahankan saat LW321 diperbarui.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="success">{covenantRows.filter((item) => item.dataStatus === "Lengkap").length} lengkap</Badge>
                  <Badge variant="warning">{covenantRows.filter((item) => item.dataStatus === "Belum Lengkap").length} belum lengkap</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4 grid gap-3 rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-3 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] sm:items-end">
                <Field label="Tanggal Realisasi Dari"><Input type="date" value={covenanceDateFrom} onChange={(event) => { setCovenanceDateFrom(event.target.value); setDataPage(1); }} /></Field>
                <Field label="Tanggal Realisasi Sampai"><Input type="date" value={covenanceDateTo} onChange={(event) => { setCovenanceDateTo(event.target.value); setDataPage(1); }} /></Field>
                <Button type="button" variant="outline" onClick={() => { setCovenanceDateFrom(""); setCovenanceDateTo(""); setDataPage(1); }} disabled={!covenanceDateFrom && !covenanceDateTo}><FilterX className="h-4 w-4" />Reset Tanggal</Button>
              </div>
              <TableShell minWidth="min-w-[1050px]">
                <thead><tr><Th>No Rekening</Th><Th>Nama Debitur</Th><Th>Plafond</Th><Th>Tanggal Realisasi</Th><Th>Produk</Th><Th>Status Data</Th><Th>Aksi</Th></tr></thead>
                <tbody>
                  {pagedCovenantRows.map((item) => (
                    <tr key={`${item.accountNumber}-${item.realizedDate}`}>
                      <Td className="font-mono font-bold text-[#00529c]">{normalizeAccount(item.accountNumber)}</Td>
                      <Td className="font-semibold">{item.debtorName}</Td>
                      <Td className="font-bold">{formatCurrency(item.plafond)}</Td>
                      <Td>{safeDateLabel(item.realizedDate)}</Td>
                      <Td><Badge variant="outline">{getProductType(item.description, item.loanType)}</Badge></Td>
                      <Td><Badge variant={item.dataStatus === "Lengkap" ? "success" : "warning"}>{item.dataStatus}</Badge></Td>
                      <Td>
                        <div className="flex min-w-max gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openCovenanceForm(item, "detail")}><Eye className="h-4 w-4" />Detail</Button>
                          <Button type="button" size="sm" className="bg-[#00529c] text-white hover:bg-[#004077]" onClick={() => openCovenanceForm(item, "edit")}><FilePlus2 className="h-4 w-4" />Isi Data</Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
              {!pagedCovenantRows.length ? <div className="mt-3"><EmptyState title="Data tidak ditemukan" description="Tidak ada data LW321 terbaru yang sesuai dengan tanggal realisasi atau pencarian." icon={CalendarDays} /></div> : null}
              <PaginationControls page={safeCovenantPage} pageSize={dataPageSize} totalItems={filteredCovenantRows.length} onPageChange={setDataPage} onPageSizeChange={(value) => { setDataPageSize(value); setDataPage(1); }} />
            </CardContent>
          </Card>

          {covenanceSelected && covenanceMode ? (
            <OverlayShell
              title={covenanceMode === "detail" ? `Detail Covenance - ${covenanceSelected.debtorName}` : `Isi Data Covenance - ${covenanceSelected.debtorName}`}
              description={`No Rekening ${normalizeAccount(covenanceSelected.accountNumber)} | Realisasi ${safeDateLabel(covenanceSelected.realizedDate)}`}
              icon={covenanceMode === "detail" ? Eye : FilePlus2}
              onClose={() => { setCovenanceSelected(undefined); setCovenanceMode(undefined); setCovenanceMessage(""); }}
            >
              <div className="max-h-[75vh] overflow-y-auto bg-[#f4f8fc]">
                <section className="relative overflow-hidden border-t-4 border-[#f37021] bg-[#00529c] px-4 py-5 text-white sm:px-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/20 bg-white/10"><UserRound className="h-5 w-5" /></span>
                      <div className="min-w-0"><p className="text-[10px] font-black uppercase text-[#ffd2b5]">Data Debitur LW321</p><p className="mt-1 truncate text-lg font-black">{covenanceSelected.debtorName}</p><p className="mt-0.5 font-mono text-xs font-semibold text-blue-100">{normalizeAccount(covenanceSelected.accountNumber)}</p></div>
                    </div>
                    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-2 text-xs font-black", isCovenanceComplete(covenanceForm) ? "bg-emerald-400 text-emerald-950" : "bg-[#f37021] text-white")}>
                      {isCovenanceComplete(covenanceForm) ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{isCovenanceComplete(covenanceForm) ? "DATA LENGKAP" : "BELUM LENGKAP"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 divide-x divide-white/20 border-t border-white/20 pt-3 sm:grid-cols-3">
                    <div className="pr-3"><p className="text-[9px] font-bold uppercase text-blue-200">Plafond</p><p className="mt-1 text-sm font-black">{formatCurrency(covenanceSelected.plafond)}</p></div>
                    <div className="px-3"><p className="text-[9px] font-bold uppercase text-blue-200">Tanggal Realisasi</p><p className="mt-1 text-sm font-black">{safeDateLabel(covenanceSelected.realizedDate)}</p></div>
                    <div className="hidden pl-3 sm:block"><p className="text-[9px] font-bold uppercase text-blue-200">Dokumen Terisi</p><p className="mt-1 text-sm font-black">{covenanceCompletionCount} dari 6</p></div>
                  </div>
                </section>

                <section className="p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#d7e3ef] pb-3">
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-md bg-[#eaf3fb] text-[#00529c]"><ClipboardList className="h-4 w-4" /></span><div><p className="text-xs font-black uppercase text-[#00529c]">Dokumen Pengajuan Kredit</p><p className="text-[11px] text-muted-foreground">{covenanceMode === "detail" ? "Data tersimpan pada Covenance Day" : "Lengkapi identitas dokumen debitur"}</p></div></div>
                    <span className="text-xs font-black text-[#f37021]">{Math.round((covenanceCompletionCount / 6) * 100)}%</span>
                  </div>
                  <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#dbe8f3]"><div className={cn("h-full rounded-full transition-all", covenanceCompletionCount === 6 ? "bg-emerald-500" : "bg-[#f37021]")} style={{ width: `${(covenanceCompletionCount / 6) * 100}%` }} /></div>

                  {covenanceMode === "detail" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ReadOnlyField label="No SPH" value={covenanceForm.sphNumber || "-"} />
                      <ReadOnlyField label="No Surat Permohonan Kredit" value={covenanceForm.creditApplicationNumber || "-"} />
                      <ReadOnlyField label="No KTP" value={covenanceForm.ktpNumber || "-"} />
                      <ReadOnlyField label="No KK" value={covenanceForm.kkNumber || "-"} />
                      <ReadOnlyField label="No SKU/NIB" value={covenanceForm.skuNibNumber || "-"} />
                      <ReadOnlyField label="No NPWP" value={covenanceForm.slikOjk || "-"} />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 [&_input]:h-11 [&_input]:border-[#b9cfe2] [&_input]:bg-white [&_input]:font-semibold [&_input]:text-[#0f2942] focus-within:[&_input]:border-[#00529c]">
                      <Field label="No SPH"><Input placeholder="Masukkan nomor SPH" value={covenanceForm.sphNumber} onChange={(event) => setCovenanceForm((current) => ({ ...current, sphNumber: event.target.value }))} /></Field>
                      <Field label="No Surat Permohonan Kredit"><Input placeholder="Masukkan nomor surat permohonan" value={covenanceForm.creditApplicationNumber} onChange={(event) => setCovenanceForm((current) => ({ ...current, creditApplicationNumber: event.target.value }))} /></Field>
                      <Field label="No KTP"><Input inputMode="numeric" placeholder="Nomor identitas debitur" value={covenanceForm.ktpNumber} onChange={(event) => setCovenanceForm((current) => ({ ...current, ktpNumber: event.target.value.replace(/\D/g, "") }))} /></Field>
                      <Field label="No KK"><Input inputMode="numeric" placeholder="Nomor kartu keluarga" value={covenanceForm.kkNumber} onChange={(event) => setCovenanceForm((current) => ({ ...current, kkNumber: event.target.value.replace(/\D/g, "") }))} /></Field>
                      <Field label="No SKU/NIB"><Input placeholder="Nomor SKU atau NIB" value={covenanceForm.skuNibNumber} onChange={(event) => setCovenanceForm((current) => ({ ...current, skuNibNumber: event.target.value }))} /></Field>
                      <Field label="No NPWP"><Input inputMode="numeric" placeholder="Masukkan nomor NPWP" value={covenanceForm.slikOjk} onChange={(event) => setCovenanceForm((current) => ({ ...current, slikOjk: event.target.value.replace(/\D/g, "") }))} /></Field>
                    </div>
                  )}
                  {covenanceMessage ? <p className={cn("mt-4 rounded-md border px-3 py-2 text-sm font-bold", covenanceMessage.includes("berhasil") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>{covenanceMessage}</p> : null}
                  <div className="mt-5 flex justify-end gap-2 border-t border-[#d7e3ef] pt-4">
                    <Button type="button" variant="outline" className="border-[#b9cfe2] text-[#004077]" onClick={() => { setCovenanceSelected(undefined); setCovenanceMode(undefined); setCovenanceMessage(""); }}>{covenanceMode === "detail" ? "Tutup" : "Batal"}</Button>
                    {covenanceMode === "edit" ? <Button type="button" onClick={saveCovenance} disabled={savingCovenance} className="bg-[#00529c] text-white shadow-[0_8px_16px_rgba(0,82,156,0.18)] hover:bg-[#004077]"><Check className="h-4 w-4" />{savingCovenance ? "Menyimpan..." : "Simpan Data"}</Button> : null}
                  </div>
                </section>
              </div>
            </OverlayShell>
          ) : null}
        </>
      ) : showingBorrowed ? (
        <Card className="bri-card border-[#d7e3ef]">
          <CardHeader>
            <CardTitle>Berkas Dipinjam</CardTitle>
            <CardDescription>Daftar berkas yang sedang dipinjam oleh user dan menunggu pengembalian.</CardDescription>
          </CardHeader>
          <CardContent>
            <TableShell minWidth="min-w-[1500px]">
              <thead>
                <tr>
                  <Th>No Rekening</Th>
                  <Th>Nama Nasabah</Th>
                  <Th>Plafond</Th>
                  <Th>No BRIMEN Berkas</Th>
                  <Th>No BRIMEN Jaminan</Th>
                  <Th>Jaminan</Th>
                  <Th>Nama Peminjam (User)</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {pagedBorrowedFileRows.map((row) => (
                  <tr key={row.id} className="border-l-4 border-l-[#f37021] bg-[#fff7ed]/55">
                    <Td className="font-mono font-semibold text-[#00529c]">{formatAccountNumber(row.accountNumber)}</Td>
                    <Td className="font-semibold">{row.customerName}</Td>
                    <Td>{formatCurrency(row.plafond ?? 0)}</Td>
                    <Td className="font-mono font-semibold text-[#00529c]">{shortText(row.brimenBerkas ?? "")}</Td>
                    <Td className="font-mono font-semibold text-[#00529c]">{shortText(row.brimenJaminan ?? "", "Tidak dipinjam")}</Td>
                    <Td className="max-w-[360px] whitespace-normal">{shortText(row.guarantee ?? "", "Tidak ada / tidak dipinjam")}</Td>
                    <Td>
                      <div className="font-semibold">{row.borrowerName}</div>
                      <div className="text-xs text-muted-foreground">{row.borrowerUsername}</div>
                    </Td>
                    <Td>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        disabled={!row.loan || row.borrowerUsername !== currentBrimenUser.username}
                        onClick={() => row.loan && returnLoan(row.loan)}
                        title={
                          !row.loan
                            ? "Data berstatus dipinjam belum memiliki register peminjaman aktif"
                            : row.borrowerUsername === currentBrimenUser.username
                              ? "Kembalikan berkas"
                              : "Hanya user peminjam yang dapat mengembalikan"
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Kembalikan
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            {!pagedBorrowedFileRows.length ? (
              <div className="mt-3">
                <EmptyState
                  title="Tidak ada berkas dipinjam"
                  description="Semua berkas aktif dalam kondisi tersimpan atau belum ada transaksi peminjaman."
                  icon={Upload}
                />
              </div>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Tombol Kembalikan hanya aktif untuk user peminjam. User simulasi saat ini: {currentBrimenUser.name}.
            </p>
            <PaginationControls
              page={safeLoanPage}
              pageSize={loanPageSize}
              totalItems={filteredBorrowedFileRows.length}
              onPageChange={setLoanPage}
              onPageSizeChange={(value) => {
                setLoanPageSize(value);
                setLoanPage(1);
              }}
            />
          </CardContent>
        </Card>
      ) : showingRegister ? (
        <Card className="bri-card border-[#d7e3ef]">
          <CardHeader>
            <CardTitle>Register Pinjam Berkas</CardTitle>
            <CardDescription>Riwayat peminjaman dan pengembalian berkas BRIMEN.</CardDescription>
          </CardHeader>
          <CardContent>
            <TableShell minWidth="min-w-[1400px]">
              <thead>
                <tr>
                  <Th>No Rekening</Th>
                  <Th>Nama Nasabah</Th>
                  <Th>No Brimen Berkas</Th>
                  <Th>No Brimen Jaminan</Th>
                  <Th>Nama Peminjam</Th>
                  <Th>Username</Th>
                  <Th>Keperluan</Th>
                  <Th>Tanggal Pinjam</Th>
                  <Th>Tanggal Kembali</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {pagedLoans.map((loan) => (
                  <tr key={loan.id} className={cn("border-l-4", loan.status === "Dipinjam" ? "border-l-[#f37021] bg-[#fff7ed]/55" : "border-l-emerald-500 bg-emerald-50/50")}>
                    <Td className="font-mono font-semibold text-[#00529c]">{formatAccountNumber(loan.accountNumber)}</Td>
                    <Td>{loan.customerName}</Td>
                    <Td>{shortText(loan.brimenBerkas ?? "")}</Td>
                    <Td>{shortText(loan.brimenJaminan ?? "")}</Td>
                    <Td>{loan.borrowerName}</Td>
                    <Td>{loan.borrowerUsername}</Td>
                    <Td className="max-w-[280px] whitespace-normal">{shortText(loan.purpose)}</Td>
                    <Td>{safeDateLabel(loan.loanDate.slice(0, 10))}</Td>
                    <Td>{loan.returnedDate ? safeDateLabel(loan.returnedDate.slice(0, 10)) : "-"}</Td>
                    <Td>
                      <Badge variant={loan.status === "Dipinjam" ? "warning" : "success"}>{loan.status}</Badge>
                    </Td>
                    <Td>
                      {loan.status === "Dipinjam" ? (
                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => returnLoan(loan)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                          Kembalikan
                        </Button>
                      ) : (
                        "-"
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            {!pagedLoans.length ? (
              <div className="mt-3">
                <EmptyState
                  title="Register masih kosong"
                  description="Belum ada aktivitas peminjaman atau pengembalian berkas pada filter ini."
                  icon={FileSpreadsheet}
                />
              </div>
            ) : null}
            <PaginationControls
              page={safeLoanPage}
              pageSize={loanPageSize}
              totalItems={filteredLoans.length}
              onPageChange={setLoanPage}
              onPageSizeChange={(value) => {
                setLoanPageSize(value);
                setLoanPage(1);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
        <TableShell minWidth="min-w-[1450px]">
        <thead>
          <tr>
            <Th>No Rekening</Th>
            <Th>Nama Nasabah</Th>
            <Th>Plafond</Th>
            <Th>Tgl Realisasi</Th>
            <Th>Officer / Mantri</Th>
            <Th>Detail Jaminan</Th>
            <Th>No Brimen Berkas</Th>
            <Th>No Brimen Jaminan</Th>
            <Th>Status</Th>
            {showingUnarchivedActive ? <Th>Keterangan</Th> : <Th>Aksi</Th>}
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((item) => {
            const needsArchive = !item.brimenBerkas;
            return (
              <tr
                key={item.id}
                className={cn(getBrimenRowTone(item), needsArchive && "bg-rose-50/70")}
              >
                <Td className="font-mono font-semibold text-[#00529c]">{formatAccountNumber(item.accountNumber)}</Td>
                <Td className="font-semibold">{item.name}</Td>
                <Td>{formatCurrency(item.plafond)}</Td>
                <Td>{safeDateLabel(item.realizationDate)}</Td>
                <Td>{shortText(item.mantri)}</Td>
                <Td className="max-w-[380px] whitespace-normal">{shortText(item.guarantee)}</Td>
                <Td className="font-mono font-semibold text-[#00529c]">{shortText(item.brimenBerkas)}</Td>
                <Td className="font-mono font-semibold text-[#00529c]">{shortText(item.brimenJaminan)}</Td>
                <Td><BrimenStatusBadge status={item.status} row={item} /></Td>
                <Td>
                  {showingUnarchivedActive ? (
                    <div className="min-w-[260px] rounded-md border border-[#f37021]/25 bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#9a3f00]">
                      Silahkan proses di menu tambah data
                    </div>
                  ) : (
                  <div className="flex min-w-max flex-nowrap items-center gap-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setForm(customerToForm(item));
                        setFormMode("detail");
                        setActionMessage("");
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </Button>
                    {filter === "Semua" && item.persistedInBrimen !== false ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setForm({
                            ...customerToForm(item),
                            plafond: formatRupiahInput(item.plafond),
                          });
                          setFormMode("edit");
                          setActionMessage("");
                        }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : null}
                    {showingArchivedActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          const today = new Date().toISOString().slice(0, 10);
                          setLoanCustomer(item);
                          setForm({
                            ...customerToForm(item),
                            accountNumber: "",
                            name: "",
                            plafond: "",
                            realizationDate: today,
                          });
                          setProcessForm({
                            ...emptyBrimenProcessForm,
                            processDate: today,
                            newPlafond: "",
                            newBrimenBerkas: item.brimenBerkas,
                            newBrimenJaminan: item.brimenJaminan,
                            newGuarantee: item.guarantee,
                          });
                          setLoanForm({
                            borrowerName: "",
                            borrowerUsername: "",
                            purpose: "",
                            loanDate: new Date().toISOString().slice(0, 10),
                          });
                          setInitialProcess(null);
                          setFormMode("process");
                          setActionMessage("");
                        }}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Proses
                      </Button>
                    ) : null}
                  </div>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
      <PaginationControls
        page={safeDataPage}
        pageSize={dataPageSize}
        totalItems={filteredRows.length}
        onPageChange={setDataPage}
        onPageSizeChange={(value) => {
          setDataPageSize(value);
          setDataPage(1);
        }}
      />
      {!pagedRows.length ? (
        <EmptyState
          title="Data tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau pilih kategori data yang lain."
          icon={ClipboardList}
        />
      ) : null}
        </>
      )}
        {formMode === "none" ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-[#00529c]/25 bg-white font-bold text-[#00529c] sm:hidden"
            onClick={closeMobileOperational}
          >
            Kembali
          </Button>
        ) : null}
    </div>

    </div>
  );
}

function BrimenAddChoice({
  onCancel,
  onNewDebtor,
  onSuplesiDebtor,
}: {
  onCancel: () => void;
  onNewDebtor: () => void;
  onSuplesiDebtor: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-[#d7e3ef] bg-white shadow-2xl">
        <div className="bri-topline h-1.5 w-full" />
        <div className="flex items-center justify-between border-b border-[#d7e3ef] bg-[#f8fbfe] px-5 py-4">
          <div>
            <h2 className="text-base font-black uppercase text-[#00529c]">Tambah Data</h2>
            <p className="text-xs font-semibold text-muted-foreground">Pilih alur debitur sebelum mengisi form.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-[#00529c]/10 hover:text-[#00529c]"
            aria-label="Tutup tambah data"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2">
          <button
            type="button"
            className="group rounded-lg border border-[#00529c]/25 bg-[#f8fbfe] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#00529c]/50 hover:shadow-lg"
            onClick={onSuplesiDebtor}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#00529c] text-white shadow-sm group-hover:bg-[#004077]">
              <RefreshCw className="h-5 w-5" />
            </span>
            <p className="mt-4 font-black uppercase text-[#00529c]">Debitur Suplesi</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Untuk nasabah existing. Input nomor rekening dilakukan langsung di form suplesi, lalu data kredit diperbarui.
            </p>
          </button>
          <button
            type="button"
            className="group rounded-lg border border-[#f37021]/25 bg-[#fff7ed] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#f37021]/50 hover:shadow-lg"
            onClick={onNewDebtor}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f37021] text-white shadow-sm group-hover:bg-[#d95d0f]">
              <FilePlus2 className="h-5 w-5" />
            </span>
            <p className="mt-4 font-black uppercase text-[#9a3f00]">Debitur Baru</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Untuk pinjaman baru yang belum punya riwayat pinjam dan belum punya No BRIMEN Berkas/Jaminan.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

function BrimenCustomerForm({
  mode,
  form,
  setForm,
  loanLookupRows = [],
  loanLookupLabel = "LW321 terbaru",
  onCancel,
  onSubmit,
}: {
  mode: "add" | "edit" | "archive";
  form: BrimenFormState;
  setForm: (value: BrimenFormState) => void;
  loanLookupRows?: LoanSnapshot[];
  loanLookupLabel?: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [accountSearchStatus, setAccountSearchStatus] = useState<"idle" | "found" | "not-found">("idle");
  const update = (key: keyof BrimenFormState, value: string) => {
    setForm({ ...form, [key]: value });
  };
  const handleNewDebtorAccount = (value: string) => {
    const accountNumber = formatAccountNumber(value);
    if (mode !== "add") {
      update("accountNumber", accountNumber);
      return;
    }
    if (accountNumber.length < 15) {
      setForm({ ...form, accountNumber });
      setAccountSearchStatus("idle");
      return;
    }
    const matched = loanLookupRows.find((item) => normalizeAccount(item.accountNumber) === accountNumber);
    if (!matched) {
      setForm({ ...form, accountNumber });
      setAccountSearchStatus("not-found");
      return;
    }
    setForm({
      ...form,
      accountNumber,
      name: matched.debtorName,
      plafond: formatRupiahInput(matched.plafond),
      realizationDate: matched.realizedDate,
      mantri: matched.mantri,
    });
    setAccountSearchStatus("found");
  };
  const isArchiveMode = mode === "archive";
  const isEditMode = mode === "edit";
  const title = mode === "add" ? "Tambah Data BRIMEN" : isArchiveMode ? "Arsipkan Berkas Aktif" : "Edit Data BRIMEN";
  const description = isArchiveMode
    ? "Lengkapi data arsip yang belum terisi. Data pokok nasabah dibuat terkunci."
    : "Lengkapi data arsip berkas, jaminan, dan posisi status BRIMEN nasabah.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg shadow-2xl">
    <Card className="bri-card overflow-hidden border-[#d7e3ef]">
      <CardHeader className="border-t-4 border-[#f37021] bg-[#00529c] text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/20 bg-white/10"><FilePlus2 className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-black uppercase text-[#ffd2b5]">BRI Tool Operasional</p><CardTitle className="mt-1 text-lg font-black text-white">{title}</CardTitle><CardDescription className="mt-1 text-blue-100">{description}</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="bg-[#f4f8fc] p-4 pt-5 sm:p-5">
        {mode === "add" ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#f37021]/30 bg-[#fff7ed] px-3 py-3 text-sm font-semibold text-[#7a3200]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f37021]" />
            Menu ini hanya untuk menambah data pinjaman baru yang belum punya riwayat pinjam dan belum punya No BRIMEN Berkas/Jaminan. Untuk suplesi, gunakan proses di menu Berkas Aktif Dalam Arsip.
          </div>
        ) : null}
        <form
          className="space-y-4 [&_input]:h-11 [&_input]:border-[#b9cfe2] [&_input]:bg-white [&_input]:font-semibold [&_input]:text-[#0f2942] [&_select]:h-11 [&_select]:border-[#b9cfe2] [&_select]:bg-white"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <section className="rounded-lg border border-[#d7e3ef] bg-white p-4 shadow-[0_6px_16px_rgba(0,55,105,0.04)]">
            <div className="mb-4 flex items-center gap-2 border-b border-[#e3edf6] pb-3"><span className="grid h-8 w-8 place-items-center rounded-md bg-[#eaf3fb] text-[#00529c]"><Banknote className="h-4 w-4" /></span><div><p className="text-xs font-black uppercase text-[#00529c]">Data Pinjaman</p><p className="text-[11px] text-muted-foreground">Identitas debitur dan informasi kredit</p></div></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="No Rekening">
              <div className="space-y-2">
                <div className="relative">
                  {mode === "add" ? <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#00529c]" /> : null}
                  <Input
                    value={form.accountNumber}
                    onChange={(event) => handleNewDebtorAccount(event.target.value)}
                    placeholder={mode === "add" ? "Ketik 15 digit untuk mencari" : "15 digit no rekening"}
                    maxLength={15}
                    inputMode="numeric"
                    readOnly={isArchiveMode}
                    required
                    className={mode === "add" ? "pl-9 font-mono" : undefined}
                  />
                </div>
                {mode === "add" ? <SearchStatusNotice status={accountSearchStatus} accountLength={formatAccountNumber(form.accountNumber).length} sourceLabel={loanLookupLabel} /> : null}
              </div>
            </Field>
            <Field label="Nama Nasabah">
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Nama nasabah"
                readOnly={isArchiveMode}
                required
              />
            </Field>
            <Field label="Tanggal Realisasi">
              <Input
                type="date"
                value={form.realizationDate}
                onChange={(event) => update("realizationDate", event.target.value)}
                readOnly={isArchiveMode}
                required={mode === "add"}
              />
            </Field>
            <Field label="Plafond">
              <Input
                value={form.plafond}
                onChange={(event) => update("plafond", formatRupiahInput(event.target.value))}
                placeholder="Rp 0"
                inputMode="numeric"
                readOnly={isArchiveMode}
                required
              />
            </Field>
            {!isArchiveMode ? (
              <>
                <Field label="Mantri / Officer">
                  <Input
                    value={form.mantri}
                    onChange={(event) => update("mantri", event.target.value)}
                    placeholder="Nama mantri"
                  />
                </Field>
                {mode === "add" ? (
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onChange={(event) => update("status", event.target.value as BrimenCustomer["status"])}
                    >
                      {["Disimpan", "Dipinjam", "Diambil", "Lunas"].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <Field label="Branch Code">
                  <Input
                    value={form.branchCode}
                    onChange={(event) => update("branchCode", event.target.value)}
                    placeholder="Kode unit"
                  />
                </Field>
              </>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
            <Field label="Alamat Nasabah">
              <Input
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="Alamat nasabah"
              />
            </Field>
          </div>
          </section>

          {mode === "add" ? (
            <section className="rounded-lg border border-[#bdd5e8] bg-white p-4 shadow-[0_6px_16px_rgba(0,55,105,0.04)]">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e3edf6] pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-emerald-50 text-emerald-700"><ClipboardList className="h-4 w-4" /></span>
                  <div><p className="text-xs font-black uppercase text-[#00529c]">Dokumen Covenance Day</p><p className="text-[11px] text-muted-foreground">Disimpan bersama data BRIMEN agar status dokumen langsung lengkap</p></div>
                </div>
                <Badge variant="success">6 dokumen wajib</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field label="No SPH"><Input value={form.sphNumber} onChange={(event) => update("sphNumber", event.target.value)} placeholder="Masukkan nomor SPH" required /></Field>
                <Field label="No Surat Permohonan Kredit"><Input value={form.creditApplicationNumber} onChange={(event) => update("creditApplicationNumber", event.target.value)} placeholder="Masukkan nomor surat permohonan" required /></Field>
                <Field label="No KTP"><Input value={form.ktpNumber} onChange={(event) => update("ktpNumber", event.target.value.replace(/\D/g, ""))} placeholder="Nomor KTP debitur" inputMode="numeric" required /></Field>
                <Field label="No KK"><Input value={form.kkNumber} onChange={(event) => update("kkNumber", event.target.value.replace(/\D/g, ""))} placeholder="Nomor kartu keluarga" inputMode="numeric" required /></Field>
                <Field label="No SKU/NIB"><Input value={form.skuNibNumber} onChange={(event) => update("skuNibNumber", event.target.value)} placeholder="Nomor SKU atau NIB" required /></Field>
                <Field label="No NPWP"><Input value={form.slikOjk} onChange={(event) => update("slikOjk", event.target.value.replace(/\D/g, ""))} placeholder="Nomor NPWP" inputMode="numeric" required /></Field>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-[#d7e3ef] bg-white p-4 shadow-[0_6px_16px_rgba(0,55,105,0.04)]">
            <div className="mb-4 flex items-center gap-2 border-b border-[#e3edf6] pb-3"><span className="grid h-8 w-8 place-items-center rounded-md bg-[#fff1e8] text-[#f37021]"><FolderArchive className="h-4 w-4" /></span><div><p className="text-xs font-black uppercase text-[#00529c]">Arsip BRIMEN & Jaminan</p><p className="text-[11px] text-muted-foreground">Lokasi penyimpanan dan detail jaminan kredit</p></div></div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
            <Field label="No BRIMEN Berkas">
              <Input
                value={form.brimenBerkas}
                onChange={(event) => update("brimenBerkas", formatBrimenStorageInput(event.target.value))}
                placeholder="II.C.3.18"
              />
            </Field>
            <Field label="No BRIMEN Jaminan">
              <Input
                value={form.brimenJaminan}
                onChange={(event) => update("brimenJaminan", formatBrimenStorageInput(event.target.value))}
                placeholder="II.C.3.18"
              />
            </Field>
            <Field label="Detail Jaminan">
              <Input
                value={form.guarantee}
                onChange={(event) => update("guarantee", event.target.value)}
                placeholder="Jenis dan detail jaminan"
              />
            </Field>
          </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#d7e3ef] pt-4">
            <Button type="button" variant="outline" className="border-[#b9cfe2] text-[#004077]" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" className="bg-[#00529c] text-white shadow-[0_8px_16px_rgba(0,82,156,0.18)] hover:bg-[#004077]">
              {isArchiveMode ? "Simpan Arsip" : isEditMode ? "Simpan Data" : "Tambah Data"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
      </div>
    </div>
  );
}

function BrimenCustomerDetailForm({
  form,
  onClose,
}: {
  form: BrimenFormState;
  onClose: () => void;
}) {
  const detailRow: BrimenCustomer = {
    id: form.id ?? "",
    accountNumber: form.accountNumber,
    name: form.name,
    plafond: Number(String(form.plafond).replace(/[^\d]/g, "")) || 0,
    realizationDate: form.realizationDate,
    address: form.address,
    mantri: form.mantri,
    brimenBerkas: form.brimenBerkas,
    brimenJaminan: form.brimenJaminan,
    guarantee: form.guarantee,
    status: form.status,
    branchCode: form.branchCode,
    updatedAt: "",
  };
  const timeline = [
    { label: "Data nasabah terdaftar", value: safeDateLabel(form.realizationDate), done: Boolean(form.realizationDate) },
    { label: "Berkas masuk arsip BRIMEN", value: shortText(form.brimenBerkas), done: Boolean(form.brimenBerkas?.trim()) },
    { label: hasBrimenGuarantee(detailRow) ? "Jaminan tercatat" : "Kredit tanpa jaminan", value: hasBrimenGuarantee(detailRow) ? shortText(form.brimenJaminan) : "Tanpa jaminan", done: true },
    { label: `Status berkas ${getBrimenStatusLabel(form.status, detailRow)}`, value: "Posisi saat ini", done: true },
  ];

  return (
    <Card className="bri-card border-[#d7e3ef]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Detail Data Nasabah</CardTitle>
            <CardDescription>Data nasabah dan posisi arsip BRIMEN.</CardDescription>
          </div>
          <div>
            <BrimenStatusBadge status={form.status} row={detailRow} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <section className="rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-3">
              <h3 className="mb-3 text-xs font-black uppercase text-[#00529c]">Identitas</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <ReadOnlyField label="No Rekening" value={formatAccountNumber(form.accountNumber)} />
                <ReadOnlyField label="Nama Nasabah" value={form.name} />
                <ReadOnlyField label="Alamat Nasabah" value={shortText(form.address)} multiline />
                <ReadOnlyField label="Branch Code" value={shortText(form.branchCode)} />
              </div>
            </section>
            <section className="rounded-lg border border-[#d7e3ef] bg-white p-3">
              <h3 className="mb-3 text-xs font-black uppercase text-[#00529c]">Pinjaman</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <ReadOnlyField label="Plafond" value={formatCurrency(detailRow.plafond)} />
                <ReadOnlyField label="Tanggal Realisasi" value={safeDateLabel(form.realizationDate)} />
                <ReadOnlyField label="Mantri / Officer" value={shortText(form.mantri)} />
              </div>
            </section>
            <section className="rounded-lg border border-[#d7e3ef] bg-white p-3">
              <h3 className="mb-3 text-xs font-black uppercase text-[#00529c]">BRIMEN & Jaminan</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <ReadOnlyField label="No BRIMEN Berkas" value={shortText(form.brimenBerkas)} />
                <ReadOnlyField label="No BRIMEN Jaminan" value={shortText(form.brimenJaminan)} />
                <ReadOnlyField label="Status" value={getBrimenStatusLabel(form.status, detailRow)} />
                <div className="md:col-span-3">
                  <ReadOnlyField label="Detail Jaminan" value={shortText(form.guarantee, "Tidak ada detail jaminan")} multiline />
                </div>
              </div>
            </section>
          </div>
          <section className="rounded-lg border border-[#d7e3ef] bg-[#fffaf6] p-3">
            <h3 className="mb-3 text-xs font-black uppercase text-[#f37021]">Riwayat Aktivitas</h3>
            <div className="space-y-3">
              {timeline.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className={cn("mt-1 h-3 w-3 shrink-0 rounded-full", item.done ? "bg-[#00529c]" : "bg-[#d7e3ef]")} />
                  <div>
                    <p className="text-sm font-bold text-[#004077]">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadOnlyField({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <div className={cn("rounded-md border border-[#d7e3ef] bg-[#f8fbfe] px-3 py-2 text-sm font-medium text-[#004077]", multiline && "min-h-24 whitespace-pre-wrap")}>
        {value}
      </div>
    </div>
  );
}

function BrimenProcessForm({
  customer,
  rows,
  previousLoanRows,
  previousLoanPeriod,
  customerForm,
  setCustomerForm,
  processForm,
  setProcessForm,
  onCancel,
  initialProcess,
  onSubmit,
}: {
  customer: BrimenCustomer;
  rows: BrimenCustomer[];
  previousLoanRows: LoanSnapshot[];
  previousLoanPeriod: MonthKey;
  customerForm: BrimenFormState;
  setCustomerForm: (value: BrimenFormState) => void;
  processForm: BrimenProcessFormState;
  setProcessForm: (value: BrimenProcessFormState) => void;
  onCancel: () => void;
  initialProcess?: BrimenOperationType;
  onSubmit: () => void;
}) {
  const [activeProcess, setActiveProcess] = useState<BrimenOperationType | null>(initialProcess ?? null);
  const [addressEditable, setAddressEditable] = useState(false);
  const [suplesiSearchStatus, setSuplesiSearchStatus] = useState<"idle" | "found" | "not-found">("idle");
  const [selectedCustomer, setSelectedCustomer] = useState(customer);
  const currentCustomer = selectedCustomer;
  const updateProcess = (key: keyof BrimenProcessFormState, value: string) => {
    setProcessForm({ ...processForm, [key]: value });
  };
  const updateCustomer = (key: keyof BrimenFormState, value: string) => {
    setCustomerForm({ ...customerForm, [key]: value });
  };
  const activeArchivedRows = rows.filter((row) => row.status !== "Lunas" && Boolean(row.brimenBerkas?.trim()));
  const handleSuplesiAccountSearch = (value: string) => {
    const accountNumber = formatAccountNumber(value);
    const matchedLoan = previousLoanRows.find((row) => formatAccountNumber(row.accountNumber) === accountNumber);
    const matched = activeArchivedRows.find((row) => formatAccountNumber(row.accountNumber) === accountNumber);

    if (matched && matchedLoan) {
      const matchedHasGuarantee = [matched.brimenJaminan, matched.guarantee].some((item) => Boolean(item && item.trim() && item.trim() !== "-"));
      setSelectedCustomer(matched);
      setCustomerForm({
        ...customerToForm(matched),
        accountNumber,
        name: matchedLoan.debtorName,
        plafond: formatRupiahInput(matchedLoan.plafond),
        realizationDate: matchedLoan.realizedDate,
        mantri: matchedLoan.mantri,
      });
      setProcessForm({
        ...processForm,
        guaranteeAction: matchedHasGuarantee
          ? processForm.guaranteeAction === "tambah"
            ? "none"
            : processForm.guaranteeAction
          : processForm.guaranteeAction === "tambah"
            ? "tambah"
            : "ambil",
        newPlafond: formatRupiahInput(matchedLoan.plafond),
        newBrimenBerkas: matched.brimenBerkas,
        newBrimenJaminan: matched.brimenJaminan,
        newGuarantee: matched.guarantee,
      });
      setSuplesiSearchStatus("found");
      return;
    }

    setCustomerForm({ ...customerForm, accountNumber });
    setSuplesiSearchStatus(accountNumber.length >= 15 ? "not-found" : "idle");
  };
  const workingBrimenBerkas = processForm.operationType === "Suplesi" ? customerForm.brimenBerkas : currentCustomer.brimenBerkas;
  const workingBrimenJaminan = processForm.operationType === "Suplesi" ? customerForm.brimenJaminan : currentCustomer.brimenJaminan;
  const workingGuarantee = processForm.operationType === "Suplesi" ? customerForm.guarantee : currentCustomer.guarantee;
  const hasGuarantee = [workingBrimenJaminan, workingGuarantee].some((value) => Boolean(value && value.trim() && value.trim() !== "-"));
  const showGuaranteeChoice = processForm.operationType === "Suplesi";
  const showPickupForm =
    hasGuarantee &&
    (processForm.operationType === "Pelunasan" ||
      processForm.operationType === "Pergantian Jaminan" ||
      (processForm.operationType === "Suplesi" && processForm.guaranteeAction !== "none"));
  const showNewCollateral = processForm.operationType === "Pergantian Jaminan";
  const showEditData = processForm.operationType === "Edit Data";
  const needsPhoto = showPickupForm && !processForm.collateralPickupPhotoName;
  const needsSupportFile = showPickupForm && processForm.pickupRelationship !== "Pemilik Jaminan" && !processForm.pickupSupportFileName;
  const missingRequiredProcessFields =
    (processForm.operationType === "Suplesi" || showEditData) &&
    (!formatAccountNumber(customerForm.accountNumber) ||
      !customerForm.name.trim() ||
      !(showEditData ? customerForm.plafond : processForm.newPlafond).trim());
  const activeStep = activeProcess ? 2 : 1;
  const guaranteeLabel =
    processForm.guaranteeAction === "none"
      ? "Jaminan Tetap"
      : processForm.guaranteeAction === "ganti"
        ? "Ganti Jaminan"
        : processForm.guaranteeAction === "tambah"
          ? "Tambah Jaminan"
          : "Tanpa Jaminan";
  const selectedMenu = {
    Suplesi: "Menu 01",
    Pelunasan: "Menu 02",
    "Pergantian Jaminan": "Menu 03",
    "Edit Data": "Menu 04",
    "Peminjaman Berkas": "Menu 05",
  }[processForm.operationType];
  const processOptions: {
    type: BrimenOperationType;
    title: string;
    description: string;
    icon: React.ElementType;
    tone: "green" | "yellow" | "blue" | "purple";
    menu: string;
  }[] = [
    {
      type: "Suplesi",
      title: "Suplesi",
      description: "Nasabah existing mengajukan pinjaman baru, data lama diganti dengan data baru.",
      icon: Activity,
      tone: "green",
      menu: "Menu 01",
    },
    {
      type: "Pelunasan",
      title: "Pelunasan",
      description: "Nasabah pelunasan putus, data dinonaktifkan dan jaminan bisa diambil.",
      icon: CheckCircle2,
      tone: "yellow",
      menu: "Menu 02",
    },
    {
      type: "Pergantian Jaminan",
      title: "Pergantian Jaminan",
      description: "Ambil jaminan lama, lalu input jaminan pengganti yang baru.",
      icon: RefreshCw,
      tone: "blue",
      menu: "Menu 03",
    },
    {
      type: "Edit Data",
      title: "Edit Data",
      description: "Koreksi data manual oleh Kaunit, SPV, atau CS tanpa alur jaminan.",
      icon: FileText,
      tone: "purple",
      menu: "Menu 04",
    },
    {
      type: "Peminjaman Berkas",
      title: "Peminjaman Berkas",
      description: "User selain CS mengajukan, menerima, dan status berkas menjadi Dipinjam.",
      icon: ClipboardList,
      tone: "blue",
      menu: "Menu 05",
    },
  ];
  const visibleProcessOptions = processOptions.filter((option) => initialProcess === "Suplesi" || option.type !== "Suplesi");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-[#d7e3ef] bg-white text-[#0f2942] shadow-2xl">
        <div className="bri-topline h-1.5 w-full" />
        <div className="flex items-center justify-between border-b border-[#d7e3ef] bg-[#f8fbfe] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-[#00529c]/20 bg-[#00529c]/10 text-[#00529c]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-normal text-[#00529c]">Proses Aktifitas Nasabah</h2>
              <p className="text-xs font-semibold text-muted-foreground">{currentCustomer.name} - {formatAccountNumber(currentCustomer.accountNumber) || "Input no rekening"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-[#00529c]/10 hover:text-[#00529c]"
            aria-label="Tutup proses"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <ProcessWizard currentStep={activeStep} />

          <div className="rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-4">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Status Agent / Debitur Saat Ini:</p>
            <div className="grid gap-3 md:grid-cols-3">
              <DarkInfo label="Nama Debitur" value={currentCustomer.name} />
              <DarkInfo label="Nomor Rekening" value={formatAccountNumber(currentCustomer.accountNumber) || "-"} />
              <DarkInfo label="Plafond" value={formatCurrency(currentCustomer.plafond)} strong />
              <DarkInfo label="Status Jaminan" value={currentCustomer.status} badge />
              <DarkInfo label="Jaminan Fisik" value={shortText(currentCustomer.guarantee, "Tidak ada detail jaminan")} />
              <DarkInfo label="Brimen Jaminan" value={shortText(currentCustomer.brimenJaminan)} />
            </div>
          </div>

          {!activeProcess ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProcessOptions.map((option) => (
                <ProcessOptionCard
                  key={option.type}
                  option={option}
                  active={processForm.operationType === option.type}
                  disabled={option.type === "Pergantian Jaminan" && !hasGuarantee}
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setActiveProcess(option.type);
                    setAddressEditable(option.type === "Edit Data");
                    setSuplesiSearchStatus("idle");
                    if (option.type === "Edit Data") {
                      setCustomerForm({
                        ...customerToForm(currentCustomer),
                        plafond: formatRupiahInput(currentCustomer.plafond),
                      });
                    }
                    if (option.type === "Suplesi") {
                      setCustomerForm({
                        ...customerToForm(currentCustomer),
                        accountNumber: "",
                        name: "",
                        plafond: "",
                        realizationDate: today,
                      });
                    }
                    setProcessForm({
                      ...processForm,
                      operationType: option.type,
                      guaranteeAction: option.type === "Suplesi" && !hasGuarantee ? "tambah" : "none",
                      collateralPickupPhotoName: "",
                      pickupSupportFileName: "",
                    });
                  }}
                />
              ))}
            </div>
          ) : (
          <div className="rounded-xl border border-[#d7e3ef] bg-white p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Form Proses Data BRIMEN</p>
                <h3 className="text-lg font-black text-[#00529c]">{processForm.operationType}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-fit rounded-md border border-[#d7e3ef] bg-[#00529c]/5 px-2 py-1 text-[11px] font-bold uppercase text-[#00529c]">
                  {selectedMenu}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveProcess(null)}>
                  Kembali ke Menu
                </Button>
              </div>
            </div>

            {showGuaranteeChoice ? (
              <div className="rounded-lg border border-[#f37021]/25 bg-[#fff7ed] p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#9a3f00]">Penggunaan Jaminan</p>
                <div className="grid gap-2 md:grid-cols-3">
                  {hasGuarantee ? (
                    <GuaranteeChoice
                      label="Jaminan Tetap"
                      checked={processForm.guaranteeAction === "none"}
                      onClick={() => updateProcess("guaranteeAction", "none")}
                    />
                  ) : null}
                  {hasGuarantee ? (
                    <GuaranteeChoice
                      label="Ganti Jaminan"
                      checked={processForm.guaranteeAction === "ganti"}
                      onClick={() => updateProcess("guaranteeAction", "ganti")}
                    />
                  ) : null}
                  {!hasGuarantee ? (
                    <GuaranteeChoice
                      label="Tambah Jaminan"
                      checked={processForm.guaranteeAction === "tambah"}
                      onClick={() => updateProcess("guaranteeAction", "tambah")}
                    />
                  ) : null}
                  <GuaranteeChoice
                    label="Tanpa Jaminan"
                    checked={processForm.guaranteeAction === "ambil"}
                    onClick={() => updateProcess("guaranteeAction", "ambil")}
                  />
                </div>
              </div>
            ) : null}

            <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", processForm.operationType === "Suplesi" && "xl:grid-cols-2")}>
              {processForm.operationType === "Suplesi" || showEditData ? (
                <>
                  <div className="space-y-1.5">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">No Rekening</p>
                    {processForm.operationType === "Suplesi" ? (
                      <>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formatAccountNumber(customerForm.accountNumber)}
                            onChange={(event) => handleSuplesiAccountSearch(event.target.value)}
                          inputMode="numeric"
                          maxLength={15}
                          required
                          placeholder="Cari 15 digit no rekening"
                            className="border-[#d7e3ef] bg-white pl-9 font-mono text-[#0f2942]"
                          />
                        </div>
                        <SearchStatusNotice
                          status={suplesiSearchStatus}
                          accountLength={formatAccountNumber(customerForm.accountNumber).length}
                          sourceLabel={`LW321 bulan lalu posisi ${getMonthLabel(previousLoanPeriod)}`}
                          notFoundMessage="Rekening tidak ditemukan pada LW321 bulan lalu atau belum memiliki arsip BRIMEN aktif."
                        />
                      </>
                    ) : (
                      <Input
                        value={formatAccountNumber(customerForm.accountNumber)}
                        onChange={(event) => updateCustomer("accountNumber", formatAccountNumber(event.target.value))}
                        inputMode="numeric"
                        maxLength={15}
                        required
                        placeholder="15 digit no rekening"
                        className="border-[#d7e3ef] bg-white font-mono text-[#0f2942]"
                      />
                    )}
                  </div>
                  <DarkField label="Nama Nasabah">
                    <Input value={customerForm.name} onChange={(event) => updateCustomer("name", event.target.value)} required className="border-[#d7e3ef] bg-white text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Tanggal Realisasi">
                    <Input
                      type="date"
                      value={customerForm.realizationDate}
                      onChange={(event) => updateCustomer("realizationDate", event.target.value)}
                      className="border-[#d7e3ef] bg-white text-[#0f2942]"
                    />
                  </DarkField>
                </>
              ) : null}
              {processForm.operationType === "Suplesi" || showEditData ? (
                <DarkField label="Plafond">
                  <Input
                    value={showEditData ? customerForm.plafond : processForm.newPlafond}
                    onChange={(event) => showEditData ? updateCustomer("plafond", event.target.value) : updateProcess("newPlafond", formatRupiahInput(event.target.value))}
                    inputMode="numeric"
                    required
                    placeholder="Rp 0"
                    className="border-[#d7e3ef] bg-white text-[#0f2942]"
                  />
                </DarkField>
              ) : null}
              {processForm.operationType === "Pelunasan" ? (
                <>
                  <DarkField label="No Rekening">
                    <Input value={formatAccountNumber(currentCustomer.accountNumber)} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Penerima Berkas / Jaminan">
                    <Input value={currentCustomer.name} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Status Setelah Proses">
                    <Input value="Lunas dan berkas dinonaktifkan dari arsip aktif" readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                </>
              ) : null}
              {false ? (
                <>
                  <DarkField label="Nama Nasabah">
                    <Input value={customerForm.name} onChange={(event) => updateCustomer("name", event.target.value)} className="border-[#d7e3ef] bg-white text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Mantri / Officer">
                    <Input value={customerForm.mantri} onChange={(event) => updateCustomer("mantri", event.target.value)} className="border-[#d7e3ef] bg-white text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Status">
                    <Select value={customerForm.status} onChange={(event) => updateCustomer("status", event.target.value as BrimenCustomer["status"])} className="border-[#d7e3ef] bg-white text-[#0f2942]">
                      {["Disimpan", "Dipinjam", "Diambil", "Lunas"].map((item) => <option key={item} value={item}>{item}</option>)}
                    </Select>
                  </DarkField>
                </>
              ) : null}
              {false ? (
                <>
                  <DarkField label="No Rekening">
                    <Input value={formatAccountNumber(customer.accountNumber)} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Nama Nasabah">
                    <Input value={customer.name} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                </>
              ) : null}
              {processForm.operationType === "Peminjaman Berkas" ? (
                <>
                  <DarkField label="No Rekening">
                    <Input value={formatAccountNumber(currentCustomer.accountNumber)} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] font-mono text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Nama Peminjam (User)">
                    <Input value={currentBrimenUser.name} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Tanggal Konfirmasi Terima">
                    <Input value={safeDateLabel(new Date().toISOString().slice(0, 10))} readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="Status Setelah Proses">
                    <Input value="Dipinjam" readOnly className="border-[#d7e3ef] bg-[#f8fbfe] text-[#0f2942]" />
                  </DarkField>
                </>
              ) : null}
            </div>

            {processForm.operationType === "Suplesi" || showEditData ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_52px]">
                <DarkField label="Alamat">
                  <Input
                    value={customerForm.address}
                    onChange={(event) => updateCustomer("address", event.target.value)}
                    readOnly={processForm.operationType === "Suplesi" && !addressEditable}
                    placeholder="Edit bila nasabah pindah alamat"
                    className={cn(
                      "h-11 border-[#d7e3ef] text-[#0f2942]",
                      processForm.operationType === "Suplesi" && !addressEditable ? "bg-[#f8fbfe]" : "bg-white",
                    )}
                  />
                </DarkField>
                {processForm.operationType === "Suplesi" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("mt-[22px] h-11 border-[#00529c]/25 px-0 text-[#00529c]", addressEditable && "border-[#f37021]/50 bg-[#fff7ed] text-[#9a3f00]")}
                    title={addressEditable ? "Alamat sedang diedit" : "Edit alamat"}
                    onClick={() => setAddressEditable((current) => !current)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}

            {processForm.operationType === "Suplesi" || showEditData ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
                <DarkField label="No BRIMEN Berkas">
                  <Input
                    value={showEditData ? customerForm.brimenBerkas : workingBrimenBerkas || "-"}
                    onChange={(event) => updateCustomer("brimenBerkas", formatBrimenStorageInput(event.target.value))}
                    readOnly={!showEditData}
                    placeholder="II.C.3.18"
                    className={cn("border-[#d7e3ef] font-mono text-[#0f2942]", showEditData ? "bg-white" : "bg-[#f8fbfe]")}
                  />
                </DarkField>
                <DarkField label="No BRIMEN Jaminan">
                  <Input
                    value={showEditData ? customerForm.brimenJaminan : processForm.guaranteeAction === "tambah" ? processForm.newBrimenJaminan : workingBrimenJaminan || "-"}
                    onChange={(event) =>
                      showEditData
                        ? updateCustomer("brimenJaminan", formatBrimenStorageInput(event.target.value))
                        : updateProcess("newBrimenJaminan", formatBrimenStorageInput(event.target.value))
                    }
                    readOnly={!showEditData && processForm.operationType === "Suplesi"}
                    placeholder="II.C.3.18"
                    className={cn("border-[#d7e3ef] font-mono text-[#0f2942]", showEditData ? "bg-white" : "bg-[#f8fbfe]")}
                  />
                </DarkField>
                <DarkField label={processForm.guaranteeAction === "ganti" || processForm.guaranteeAction === "tambah" ? "Detail Jaminan Baru" : "Data Jaminan"}>
                  <Input
                    value={
                      showEditData
                        ? customerForm.guarantee
                        : processForm.guaranteeAction === "ganti" || processForm.guaranteeAction === "tambah"
                          ? processForm.newGuarantee
                          : workingGuarantee || "Tidak ada detail jaminan"
                    }
                    onChange={(event) => showEditData ? updateCustomer("guarantee", event.target.value) : updateProcess("newGuarantee", event.target.value)}
                    readOnly={!showEditData && processForm.guaranteeAction !== "ganti" && processForm.guaranteeAction !== "tambah"}
                    placeholder="Input detail jaminan baru"
                    className={cn("border-[#d7e3ef] text-[#0f2942]", showEditData || processForm.guaranteeAction === "ganti" || processForm.guaranteeAction === "tambah" ? "bg-white" : "bg-[#f8fbfe]")}
                  />
                </DarkField>
              </div>
            ) : null}

            {false ? (
              <div className="mt-4 rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Jaminan Lama</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <DarkField label="Jaminan Lama">
                    <Input value={hasGuarantee ? customer.guarantee : "Tidak ada jaminan tersimpan"} readOnly className="border-[#d7e3ef] bg-white text-[#0f2942]" />
                  </DarkField>
                  <DarkField label="No BRIMEN Jaminan Lama">
                    <Input value={customer.brimenJaminan || "-"} readOnly className="border-[#d7e3ef] bg-white text-[#0f2942]" />
                  </DarkField>
                </div>
                {!hasGuarantee ? (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    Proses pergantian jaminan hanya berlaku untuk nasabah yang mempunyai jaminan.
                  </p>
                ) : null}
              </div>
            ) : null}

            {showNewCollateral ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
                <DarkField label="No BRIMEN Berkas">
                  <Input
                    value={currentCustomer.brimenBerkas || "-"}
                    readOnly
                    className="border-[#d7e3ef] bg-[#f8fbfe] font-mono text-[#0f2942]"
                  />
                </DarkField>
                <DarkField label="No BRIMEN Jaminan">
                  <Input
                    value={currentCustomer.brimenJaminan || "-"}
                    readOnly
                    className="border-[#d7e3ef] bg-[#f8fbfe] font-mono text-[#0f2942]"
                  />
                </DarkField>
                <DarkField label="Detail Jaminan Baru">
                  <Input
                    value={processForm.newGuarantee}
                    onChange={(event) => updateProcess("newGuarantee", event.target.value)}
                    placeholder="Detail jaminan"
                    className="border-[#d7e3ef] bg-white text-[#0f2942]"
                  />
                </DarkField>
              </div>
            ) : null}

            {showPickupForm ? (
              <BrimenPickupGuaranteeForm processForm={processForm} updateProcess={updateProcess} />
            ) : null}

            {false ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <DarkField label="Alamat Nasabah">
                  <textarea
                    value={customerForm.address}
                    onChange={(event) => updateCustomer("address", event.target.value)}
                    className="min-h-24 w-full rounded-md border border-[#d7e3ef] bg-white px-3 py-2 text-sm text-[#0f2942] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f37021]"
                  />
                </DarkField>
                <DarkField label="Branch Code">
                  <Input value={customerForm.branchCode} onChange={(event) => updateCustomer("branchCode", event.target.value)} className="border-[#d7e3ef] bg-white text-[#0f2942]" />
                </DarkField>
              </div>
            ) : null}

            <ProcessSummaryBar
              process={processForm.operationType}
              guarantee={processForm.operationType === "Suplesi" ? guaranteeLabel : undefined}
              ready={!(needsPhoto || needsSupportFile || missingRequiredProcessFields)}
            />

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
              <Button type="submit" disabled={needsPhoto || needsSupportFile || missingRequiredProcessFields}>
                {needsPhoto
                  ? "Ambil Foto Terlebih Dahulu"
                  : needsSupportFile
                    ? "Unggah Surat Kuasa"
                    : missingRequiredProcessFields
                      ? "Lengkapi Field Wajib"
                    : processForm.operationType === "Peminjaman Berkas"
                      ? "Konfirmasi Berkas Diterima"
                      : "Simpan Proses"}
              </Button>
            </div>
          </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ProcessWizard({ currentStep }: { currentStep: number }) {
  const steps = ["Pilih Proses", "Isi Data", "Konfirmasi"];

  return (
    <div className="rounded-lg border border-[#d7e3ef] bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => {
          const number = index + 1;
          const active = number === currentStep;
          const done = number < currentStep;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-semibold",
                active
                  ? "border-[#00529c]/30 bg-[#00529c]/10 text-[#00529c]"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[#d7e3ef] bg-[#f8fbfe] text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-black",
                  active
                    ? "bg-[#00529c] text-white"
                    : done
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : number}
              </span>
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchStatusNotice({
  status,
  accountLength,
  sourceLabel,
  notFoundMessage,
}: {
  status: "idle" | "found" | "not-found";
  accountLength: number;
  sourceLabel?: string;
  notFoundMessage?: string;
}) {
  if (status === "found") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        Data ditemukan pada {sourceLabel ?? "sumber data"} dan field terisi otomatis.
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {notFoundMessage ?? `Data tidak ditemukan pada ${sourceLabel ?? "sumber data"}. Cek kembali nomor rekening atau lanjutkan dengan input manual.`}
      </div>
    );
  }

  if (accountLength > 0) {
    return (
      <div className="rounded-md border border-[#d7e3ef] bg-[#f8fbfe] px-3 py-2 text-xs font-semibold text-muted-foreground">
        Masukkan 15 digit nomor rekening.
      </div>
    );
  }

  return null;
}

function ProcessSummaryBar({
  process,
  guarantee,
  ready,
}: {
  process: BrimenOperationType;
  guarantee?: string;
  ready: boolean;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Proses: {process}</Badge>
        {guarantee ? <Badge variant="outline">Jaminan: {guarantee}</Badge> : null}
      </div>
      <Badge variant={ready ? "success" : "warning"}>
        {ready ? "Siap disimpan" : "Perlu dilengkapi"}
      </Badge>
    </div>
  );
}

function WorkflowStrip({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#d7e3ef] bg-[#f8fbfe] p-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div key={item} className="flex items-start gap-2 text-xs font-semibold text-[#0f2942]">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#00529c] text-[11px] font-black text-white">
            {index + 1}
          </span>
          <span className="pt-1 leading-5">{item}</span>
        </div>
      ))}
    </div>
  );
}

function GuaranteeChoice({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-3 rounded-md border px-3 text-left text-sm font-bold transition",
        checked
          ? "border-[#f37021] bg-white text-[#00529c] ring-1 ring-[#f37021]/30"
          : "border-[#f37021]/25 bg-white/70 text-[#0f2942] hover:border-[#f37021]/50",
      )}
    >
      <input type="checkbox" checked={checked} readOnly className="sr-only" />
      <span
        className={cn(
          "grid h-5 w-5 place-items-center rounded border",
          checked ? "border-[#00529c] bg-[#00529c] text-white" : "border-[#d7e3ef] bg-white",
        )}
      >
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      </span>
      {label}
    </button>
  );
}

function DirectCameraCapture({
  photoName,
  onPhotoTaken,
}: {
  photoName: string;
  onPhotoTaken: (name: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setCameraError("Kamera tidak dapat diakses. Cek izin kamera pada browser/device.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPhotoPreview(canvas.toDataURL("image/jpeg", 0.86));
    onPhotoTaken(`Foto kamera ${new Date().toLocaleString("id-ID")}`);
    stopCamera();
  };

  return (
    <div className="rounded-lg border border-dashed border-[#00529c]/35 bg-white p-4 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#00529c]/10 text-[#00529c]">
        <Camera className="h-5 w-5" />
      </div>
      <p className="mt-2 text-sm font-black text-[#00529c]">Ambil Foto Langsung</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Gunakan kamera device atau PC.</p>
      {cameraOpen ? (
        <div className="mt-3 space-y-3">
          <video ref={videoRef} autoPlay muted playsInline className="mx-auto aspect-video w-full max-w-sm rounded-md bg-slate-950 object-cover" />
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" onClick={capturePhoto}>Ambil Foto</Button>
            <Button type="button" variant="outline" size="sm" onClick={stopCamera}>Tutup Kamera</Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={startCamera}>
          <Camera className="h-4 w-4" />
          Buka Kamera
        </Button>
      )}
      {photoName ? <p className="mt-2 text-xs font-semibold text-emerald-700">Foto sudah tersedia.</p> : null}
      {photoPreview ? (
        <img src={photoPreview} alt="Preview foto pengambil jaminan" className="mt-3 aspect-video w-full rounded-md border border-[#d7e3ef] object-cover" />
      ) : null}
      {cameraError ? <p className="mt-2 text-xs font-semibold text-rose-700">{cameraError}</p> : null}
    </div>
  );
}

function BrimenPickupGuaranteeForm({
  processForm,
  updateProcess,
}: {
  processForm: BrimenProcessFormState;
  updateProcess: (key: keyof BrimenProcessFormState, value: string) => void;
}) {
  const showSupportFile = processForm.pickupRelationship !== "Pemilik Jaminan";

  return (
    <div className="mt-4 rounded-xl border border-[#f37021]/35 bg-[#fff7ed] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-[#9a3f00]">Form Pengambilan Jaminan</p>
          <p className="mt-1 text-xs font-semibold text-[#9a3f00]/80">
            Isi nama pengambil dan hubungan dengan pemilik jaminan. Surat pendukung muncul bila pengambil bukan pemilik jaminan.
          </p>
        </div>
        <Badge className={cn("w-fit", processForm.collateralPickupPhotoName ? "bg-emerald-600" : "bg-[#f37021]")}>
          {processForm.collateralPickupPhotoName ? "Foto sudah ada" : "Foto wajib"}
        </Badge>
      </div>
      {!processForm.collateralPickupPhotoName ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Ambil atau unggah foto terlebih dahulu sebelum proses dapat disimpan.
        </p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <DarkField label="Nama Yang Mengambil Jaminan">
          <Input
            value={processForm.collateralPickupName}
            onChange={(event) => updateProcess("collateralPickupName", event.target.value)}
            placeholder="Nama sesuai identitas"
            className="border-[#d7e3ef] bg-white"
          />
        </DarkField>
        <DarkField label="Hubungan Dengan Pemilik Jaminan">
          <Select
            value={processForm.pickupRelationship}
            onChange={(event) => updateProcess("pickupRelationship", event.target.value)}
            className="border-[#d7e3ef] bg-white"
          >
            <option>Pemilik Jaminan</option>
            <option>Nasabah</option>
            <option>Keluarga</option>
            <option>Kuasa</option>
            <option>Ahli Waris</option>
          </Select>
        </DarkField>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <DirectCameraCapture
          photoName={processForm.collateralPickupPhotoName}
          onPhotoTaken={(name) => updateProcess("collateralPickupPhotoName", name)}
        />
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#00529c]/25 bg-white px-4 py-5 text-center transition hover:bg-[#f8fbfe]">
          <Upload className="h-6 w-6 text-[#00529c]" />
          <span className="mt-2 text-sm font-black text-[#00529c]">Upload File Photo/Surat Kuasa</span>
          <span className="mt-1 text-xs leading-5 text-muted-foreground">
            Alternatif bila kamera tidak tersedia dan file Surat Kuasa.
          </span>
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            multiple
            className="sr-only"
            onChange={(event) => {
              const names = Array.from(event.target.files ?? []).map((file) => file.name);
              if (!names.length) return;
              updateProcess(
                "collateralPickupPhotoName",
                [processForm.collateralPickupPhotoName, ...names].filter(Boolean).join(", "),
              );
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {processForm.collateralPickupPhotoName ? (
        <span className="mt-3 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          {processForm.collateralPickupPhotoName}
        </span>
      ) : null}
      {showSupportFile ? (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#f37021]/45 bg-white px-4 py-5 text-center transition hover:bg-[#fff7ed]">
          <Upload className="h-6 w-6 text-[#f37021]" />
          <span className="mt-2 text-sm font-black text-[#9a3f00]">Unggah Surat Kuasa / Surat Pendukung</span>
          <span className="mt-1 text-xs leading-5 text-[#9a3f00]/75">
            Wajib bila pengambil bukan pemilik jaminan.
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="sr-only"
            onChange={(event) => updateProcess("pickupSupportFileName", event.target.files?.[0]?.name ?? "")}
          />
          {processForm.pickupSupportFileName ? (
            <span className="mt-2 rounded-md bg-[#00529c]/10 px-2 py-1 text-xs font-semibold text-[#00529c]">
              {processForm.pickupSupportFileName}
            </span>
          ) : null}
        </label>
      ) : null}
      </div>
  );
}

function DarkInfo({ label, value, strong = false, badge = false }: { label: string; value: string; strong?: boolean; badge?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      {badge ? (
        <span className="mt-1 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{value}</span>
      ) : (
        <p className={cn("mt-1 text-sm font-black text-[#0f2942]", strong && "font-mono text-emerald-700")}>{value}</p>
      )}
    </div>
  );
}

function ProcessOptionCard({
  option,
  active,
  disabled = false,
  onClick,
}: {
  option: {
    type: BrimenProcessFormState["operationType"];
    title: string;
    description: string;
    icon: React.ElementType;
    tone: "green" | "yellow" | "blue" | "purple";
    menu: string;
  };
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  const toneClass = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
  }[option.tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "min-h-28 rounded-lg border bg-white p-4 text-left transition hover:border-[#f37021]/55 hover:bg-[#f8fbfe]",
        active ? "border-[#f37021] ring-1 ring-[#f37021]/40" : "border-[#d7e3ef]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-md border", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-md border border-[#d7e3ef] bg-[#00529c]/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#00529c]">
          {option.menu}
        </span>
      </div>
      <p className="mt-3 text-sm font-black uppercase text-[#0f2942]">{option.title}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {disabled ? "Tidak tersedia karena data nasabah tidak memiliki jaminan." : option.description}
      </p>
    </button>
  );
}

function DarkField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (value: number) => void;
  onPageSizeChange: (value: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="surface-panel mt-3 flex flex-col gap-3 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground">
        Menampilkan <span className="metric-value font-black text-[#00529c]">{start}-{end}</span> dari <span className="metric-value font-black text-[#00529c]">{totalItems}</span> data
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">Data per halaman</span>
        <Select
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 w-24"
        >
          {[5, 10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </Select>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeft className="h-4 w-4" /><span className="hidden md:inline">Sebelumnya</span>
        </Button>
        <span className="metric-value rounded-md border border-[#d7e3ef] bg-[#f8fbfe] px-3 py-1.5 text-xs font-black text-[#00529c]">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Halaman berikutnya">
          <span className="hidden md:inline">Berikutnya</span><ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function LegacyBrimenProcessForm({
  customer,
  customerForm,
  setCustomerForm,
  processForm,
  setProcessForm,
  onCancel,
  onSubmit,
}: {
  customer: BrimenCustomer;
  customerForm: BrimenFormState;
  setCustomerForm: (value: BrimenFormState) => void;
  processForm: BrimenProcessFormState;
  setProcessForm: (value: BrimenProcessFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const updateProcess = (key: keyof BrimenProcessFormState, value: string) => {
    setProcessForm({ ...processForm, [key]: value });
  };
  const updateCustomer = (key: keyof BrimenFormState, value: string) => {
    setCustomerForm({ ...customerForm, [key]: value });
  };
  const showCollateral = processForm.operationType === "Suplesi" || processForm.operationType === "Pergantian Jaminan";
  const showEditData = processForm.operationType === "Edit Data";

  return (
    <Card className="bri-card border-[#d7e3ef]">
      <CardHeader>
        <CardTitle>Proses Operasional BRIMEN</CardTitle>
        <CardDescription>
          Pilih jenis proses untuk suplesi, pelunasan, pergantian jaminan, atau edit data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="rounded-lg border border-[#d7e3ef] bg-[#00529c]/5 p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoItem label="No Rekening" value={customer.accountNumber} />
              <InfoItem label="Nama Nasabah" value={customer.name} />
              <InfoItem label="Plafond Saat Ini" value={formatCurrency(customer.plafond)} />
              <InfoItem label="Status" value={customer.status} />
              <InfoItem label="No BRIMEN Berkas" value={shortText(customer.brimenBerkas)} />
              <InfoItem label="No BRIMEN Jaminan" value={shortText(customer.brimenJaminan)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Jenis Proses">
              <Select
                value={processForm.operationType}
                onChange={(event) => updateProcess("operationType", event.target.value as BrimenProcessFormState["operationType"])}
              >
                {["Suplesi", "Pelunasan", "Pergantian Jaminan", "Edit Data"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tanggal Proses">
              <Input
                type="date"
                value={processForm.processDate}
                onChange={(event) => updateProcess("processDate", event.target.value)}
                required
              />
            </Field>
            {processForm.operationType === "Suplesi" || showEditData ? (
              <Field label="Plafond">
                <Input
                  value={showEditData ? customerForm.plafond : processForm.newPlafond}
                  onChange={(event) => showEditData ? updateCustomer("plafond", event.target.value) : updateProcess("newPlafond", event.target.value)}
                  inputMode="numeric"
                  placeholder="Nominal plafond"
                />
              </Field>
            ) : null}
            {processForm.operationType === "Pelunasan" ? (
              <Field label="Status Setelah Proses">
                <Input value="Lunas" readOnly />
              </Field>
            ) : null}
            {showEditData ? (
              <>
                <Field label="Nama Nasabah">
                  <Input value={customerForm.name} onChange={(event) => updateCustomer("name", event.target.value)} />
                </Field>
                <Field label="Mantri / Officer">
                  <Input value={customerForm.mantri} onChange={(event) => updateCustomer("mantri", event.target.value)} />
                </Field>
                <Field label="Status">
                  <Select value={customerForm.status} onChange={(event) => updateCustomer("status", event.target.value as BrimenCustomer["status"])}>
                    {["Disimpan", "Dipinjam", "Diambil", "Lunas"].map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </Field>
              </>
            ) : null}
          </div>

          {showCollateral || showEditData ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="No BRIMEN Berkas">
                <Input
                  value={showEditData ? customerForm.brimenBerkas : processForm.newBrimenBerkas}
                  onChange={(event) =>
                    showEditData
                      ? updateCustomer("brimenBerkas", formatBrimenStorageInput(event.target.value))
                      : updateProcess("newBrimenBerkas", formatBrimenStorageInput(event.target.value))
                  }
                  placeholder="II.C.3.18"
                />
              </Field>
              <Field label="No BRIMEN Jaminan">
                <Input
                  value={showEditData ? customerForm.brimenJaminan : processForm.newBrimenJaminan}
                  onChange={(event) =>
                    showEditData
                      ? updateCustomer("brimenJaminan", formatBrimenStorageInput(event.target.value))
                      : updateProcess("newBrimenJaminan", formatBrimenStorageInput(event.target.value))
                  }
                  placeholder="II.C.3.18"
                />
              </Field>
              <Field label="Detail Jaminan">
                <textarea
                  value={showEditData ? customerForm.guarantee : processForm.newGuarantee}
                  onChange={(event) => showEditData ? updateCustomer("guarantee", event.target.value) : updateProcess("newGuarantee", event.target.value)}
                  placeholder="Detail jaminan"
                  className={cn(
                    "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
              </Field>
            </div>
          ) : null}

          {showEditData ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Alamat Nasabah">
                <textarea
                  value={customerForm.address}
                  onChange={(event) => updateCustomer("address", event.target.value)}
                  className={cn(
                    "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
              </Field>
              <Field label="Branch Code">
                <Input value={customerForm.branchCode} onChange={(event) => updateCustomer("branchCode", event.target.value)} />
              </Field>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit">Simpan Proses</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#00529c]">{value}</p>
    </div>
  );
}

type UploadSlotKey =
  | "lw321-terbaru"
  | "lw321-bulan-lalu"
  | "lw321-tahun-lalu"
  | "lw321-dua-bulan"
  | "brimen"
  | "nominatif-rekening"
  | "di319"
  | "almafact"
  | "branch-pl"
  | "kpi-rka";

type UploadSlotState = {
  fileName: string;
  status: "Belum diunggah" | "Siap diunggah" | "Berhasil";
  uploadedAt?: string;
  source?: string;
  uploadCount: number;
};

type ManagedUser = {
  id: string;
  username: string;
  name: string;
  role: string;
  branchCode: string;
  active: boolean;
  effectiveActive: boolean;
  blockedByAdmin: boolean;
  createdBy?: string | null;
  parentUsername?: string | null;
  online: boolean;
  activeSessions: number;
  lastActiveAt?: string | null;
};

type UserAuditActivity = {
  id: string;
  action: string;
  detail?: string | null;
  actor?: string | null;
  branchCode: string;
  createdAt: string;
};

type SuperAdminBranchOverview = {
  period: string;
  accounts: number;
  outstanding: number;
  uploadSources: number;
};

function UserManagementView({ session }: { session: DashboardSession }) {
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [activities, setActivities] = useState<UserAuditActivity[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("Semua");
  const [branchOverview, setBranchOverview] = useState<SuperAdminBranchOverview>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<ManagedUser>();
  const [resetPassword, setResetPassword] = useState("");
  const [form, setForm] = useState({ branchCode: session.user.branchCode ?? "8014", usernameSuffix: "", name: "", role: session.user.role === "SuperAdmin" ? "Admin" : "CS", password: "" });
  const isSuperAdmin = session.user.role === "SuperAdmin";

  async function loadUsers() {
    setLoading(true);
    const [response, auditResponse] = await Promise.all([
      fetch("/api/users", { cache: "no-store" }),
      fetch("/api/audit", { cache: "no-store" }),
    ]);
    const [payload, auditPayload] = await Promise.all([response.json(), auditResponse.json()]);
    if (response.ok && payload.ok) setRows(payload.data ?? []);
    else setMessage(payload.message ?? "Data pengguna belum dapat dimuat.");
    if (auditResponse.ok && auditPayload.ok) setActivities(auditPayload.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (!isSuperAdmin || selectedBranch === "Semua") {
      setBranchOverview(undefined);
      return;
    }
    fetch(`/api/dashboard-data?branch=${selectedBranch}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) return setBranchOverview(undefined);
        const period = String(payload.latestPeriod ?? "");
        const positionRows = (payload.data ?? []).filter((item: { month?: string }) => item.month === period) as { accountNumber: string; outstanding: number }[];
        setBranchOverview({
          period,
          accounts: new Set(positionRows.map((item) => item.accountNumber)).size,
          outstanding: positionRows.reduce((total, item) => total + Number(item.outstanding || 0), 0),
          uploadSources: new Set((payload.uploads ?? []).map((item: { sourceKey?: string }) => item.sourceKey)).size,
        });
      })
      .catch(() => setBranchOverview(undefined));
  }, [isSuperAdmin, selectedBranch]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) return setMessage(payload.message ?? "Pengguna gagal dibuat.");
    setMessage(`Pengguna ${payload.data.username} berhasil dibuat.`);
    setCreateOpen(false);
    setForm((current) => ({ ...current, usernameSuffix: "", name: "", password: "" }));
    await loadUsers();
  }

  async function updateUser(payload: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok || !result.ok) return setMessage(result.message ?? "Perubahan gagal disimpan.");
    setMessage("Perubahan pengguna berhasil disimpan.");
    setResetUser(undefined);
    setResetPassword("");
    await loadUsers();
  }

  const branchCount = new Set(rows.filter((item) => item.role === "Admin").map((item) => item.branchCode)).size;
  const onlineCount = rows.filter((item) => item.online).length;
  const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const visibleRows = selectedBranch === "Semua" ? rows : rows.filter((item) => item.branchCode === selectedBranch);
  const visibleActivities = selectedBranch === "Semua" ? activities.slice(0, 12) : activities.filter((item) => item.branchCode === selectedBranch).slice(0, 12);
  const pagination = useTablePagination(visibleRows, `${visibleRows.length}-${loading}-${selectedBranch}`);
  const branchSummaries = [...new Set(rows.map((item) => item.branchCode))].sort().map((branchCode) => {
    const users = rows.filter((item) => item.branchCode === branchCode);
    const lastActive = users.map((item) => item.lastActiveAt ? new Date(item.lastActiveAt) : undefined).filter((item): item is Date => Boolean(item)).sort((a, b) => b.getTime() - a.getTime())[0];
    const admin = users.find((item) => item.role === "Admin");
    return { branchCode, total: users.length, online: users.filter((item) => item.online).length, lastActive, admin };
  });

  return (
    <div className="space-y-4">
      <SectionHeader title={isSuperAdmin ? "Pengawasan SuperAdmin" : "Manajemen User"} description={isSuperAdmin ? "Pantau Admin, jajaran pengguna, dan aktivitas setiap unit kerja tanpa mengolah data operasional." : `Kelola pengguna yang Anda buat di branch ${session.user.branchCode}.`} icon={UserCog} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={isSuperAdmin ? "Total Admin" : "Total Pengguna"} value={formatNumber(isSuperAdmin ? rows.filter((item) => item.role === "Admin").length : rows.length)} helper={isSuperAdmin ? "Kaunit / SPV terdaftar" : "Akun dalam jajaran Anda"} icon={UsersRound} />
        <MetricCard label="Sedang Aktif" value={formatNumber(onlineCount)} helper="Aktivitas 5 menit terakhir" icon={Activity} tone="success" />
        <MetricCard label="Unit Kerja" value={formatNumber(branchCount)} helper={isSuperAdmin ? "Terpantau global" : `Branch ${session.user.branchCode}`} icon={Database} />
        <MetricCard label="Akun Nonaktif" value={formatNumber(rows.filter((item) => !item.active).length)} helper="Akses dihentikan" icon={Shield} tone="warning" />
      </div>
      {isSuperAdmin ? <div className="overflow-hidden rounded-lg border border-[#cbddeb] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#d7e3ef] bg-[#f4f9fd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-[#004077]">Unit Kerja Terpantau</p><p className="text-xs text-slate-500">Pilih uker untuk melihat Admin, jajaran, dan aktivitasnya.</p></div>{selectedBranch !== "Semua" ? <Button type="button" size="sm" variant="outline" onClick={() => setSelectedBranch("Semua")}>Tampilkan Semua</Button> : null}</div>
        <div className="grid gap-px bg-[#d7e3ef] sm:grid-cols-2 xl:grid-cols-4">{branchSummaries.map((item) => <button type="button" key={item.branchCode} onClick={() => setSelectedBranch(item.branchCode)} className={cn("bg-white p-4 text-left transition hover:bg-[#f5faff]", selectedBranch === item.branchCode && "bg-[#eef7ff] ring-2 ring-inset ring-[#00529c]")}><div className="flex items-center justify-between"><span className="text-lg font-black text-[#00529c]">Uker {item.branchCode}</span><span className={cn("rounded-full px-2 py-1 text-xs font-bold", item.online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{item.online} online</span></div><p className="mt-2 text-sm font-black text-slate-700">{item.admin?.name ?? "Admin belum tersedia"}</p><p className="text-xs text-slate-500">{item.total} akun dalam jajaran</p><p className="mt-1 text-xs text-slate-500">Last update: {item.lastActive ? formatter.format(item.lastActive) : "Belum ada aktivitas"}</p></button>)}</div>
      </div> : null}
      {isSuperAdmin && selectedBranch !== "Semua" ? <div className="rounded-lg border border-[#b9d6ec] bg-gradient-to-r from-[#edf7ff] to-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-black text-[#004077]">Tampilan Data Uker {selectedBranch}</p><p className="text-xs text-slate-500">Ringkasan baca saja dari data yang dikelola Admin uker.</p></div><Badge className="bg-[#00529c] text-white">Read only</Badge></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-md border border-white bg-white/90 p-3"><p className="text-xs font-bold text-slate-500">Posisi Data</p><p className="mt-1 font-black text-[#00529c]">{branchOverview?.period || "Belum tersedia"}</p></div><div className="rounded-md border border-white bg-white/90 p-3"><p className="text-xs font-bold text-slate-500">Jumlah Rekening</p><p className="mt-1 font-black text-[#00529c]">{formatNumber(branchOverview?.accounts ?? 0)}</p></div><div className="rounded-md border border-white bg-white/90 p-3"><p className="text-xs font-bold text-slate-500">Outstanding</p><p className="mt-1 font-black text-[#00529c]">{formatCurrency(branchOverview?.outstanding ?? 0)}</p></div><div className="rounded-md border border-white bg-white/90 p-3"><p className="text-xs font-bold text-slate-500">Sumber Data Aktif</p><p className="mt-1 font-black text-[#00529c]">{formatNumber(branchOverview?.uploadSources ?? 0)} file</p></div></div></div> : null}
      <div className="flex flex-col gap-3 rounded-lg border border-[#cbddeb] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-black text-[#004077]">Kontrol Akses Uker</p><p className="text-sm text-slate-500">Format akun: KODE BRANCH-JABATAN, misalnya 8014-KAUNIT atau 8014-MANTRI_SYIFA.</p></div>
        <Button type="button" className="bg-[#00529c] hover:bg-[#004077]" onClick={() => setCreateOpen(true)}><FilePlus2 className="mr-2 h-4 w-4" />{isSuperAdmin ? "Tambah Admin" : "Tambah User"}</Button>
      </div>
      {message ? <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-[#00529c]">{message}</p> : null}
      <TableShell>
        <thead><tr><Th>Username</Th><Th>Nama Pengguna</Th><Th>Branch</Th><Th>Peran</Th>{isSuperAdmin ? <Th>Admin Induk</Th> : null}<Th>Status</Th><Th>Last Update</Th><Th>Sesi</Th><Th>Aksi</Th></tr></thead>
        <tbody>
          {pagination.pagedRows.map((item) => (
            <tr key={item.id}>
              <Td className="font-black text-[#00529c]">{item.username}</Td><Td>{item.name}</Td><Td>{item.branchCode}</Td><Td><Badge variant="outline">{item.role}</Badge></Td>
              {isSuperAdmin ? <Td>{item.role === "Admin" ? <span className="font-bold text-[#00529c]">Admin Utama</span> : item.parentUsername ?? "Belum terhubung"}</Td> : null}
              <Td><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold", item.online && item.effectiveActive ? "bg-emerald-50 text-emerald-700" : item.effectiveActive ? "bg-slate-100 text-slate-600" : "bg-rose-50 text-rose-700")}><span className={cn("h-2 w-2 rounded-full", item.online && item.effectiveActive ? "bg-emerald-500" : item.effectiveActive ? "bg-slate-400" : "bg-rose-500")} />{item.blockedByAdmin ? "Admin Nonaktif" : item.online ? "Online" : item.active ? "Offline" : "Nonaktif"}</span></Td>
              <Td>{item.lastActiveAt ? formatter.format(new Date(item.lastActiveAt)) : "Belum pernah"}</Td><Td>{item.activeSessions}</Td>
              <Td><div className="flex min-w-max gap-2">{(!isSuperAdmin || item.role === "Admin") ? <><Button type="button" variant="outline" size="sm" onClick={() => updateUser({ userId: item.id, action: "toggle-active", active: !item.active })}>{item.active ? "Nonaktifkan" : "Aktifkan"}</Button><Button type="button" variant="outline" size="sm" onClick={() => setResetUser(item)}>Reset Password</Button></> : <span className="text-xs font-semibold text-slate-400">Dikelola Admin</span>}</div></Td>
            </tr>
          ))}
          {!loading && !visibleRows.length ? <tr><td colSpan={isSuperAdmin ? 9 : 8} className="px-3 py-8 text-center text-sm text-slate-500">Belum ada pengguna yang dapat ditampilkan.</td></tr> : null}
        </tbody>
      </TableShell>
      <PaginationControls page={pagination.page} pageSize={pagination.pageSize} totalItems={visibleRows.length} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />

      {isSuperAdmin ? <div className="overflow-hidden rounded-lg border border-[#cbddeb] bg-white"><div className="border-b border-[#d7e3ef] bg-[#f4f9fd] px-4 py-3"><p className="font-black text-[#004077]">Log Aktivitas {selectedBranch === "Semua" ? "Global" : `Uker ${selectedBranch}`}</p><p className="text-xs text-slate-500">Jejak penggunaan terbaru dari Admin dan jajarannya.</p></div><div className="divide-y divide-[#e4edf5]">{visibleActivities.map((item) => <div key={item.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center"><div><p className="text-sm font-black text-[#00529c]">{item.actor ?? "Sistem"}</p><p className="text-xs text-slate-500">Uker {item.branchCode}</p></div><div><p className="text-sm font-bold text-slate-700">{item.action.replaceAll("_", " ")}</p><p className="line-clamp-1 text-xs text-slate-500">{item.detail || "Tidak ada rincian tambahan"}</p></div><time className="text-xs font-semibold text-slate-500">{formatter.format(new Date(item.createdAt))}</time></div>)}{!visibleActivities.length ? <p className="px-4 py-8 text-center text-sm text-slate-500">Belum ada aktivitas pada unit kerja ini.</p> : null}</div></div> : null}

      {createOpen ? <OverlayShell title={isSuperAdmin ? "Tambah Admin Uker" : "Tambah Pengguna Uker"} description={isSuperAdmin ? "Buat akun Kaunit/SPV sebagai Admin baru pada unit kerja." : "Buat akun jajaran sesuai branch dan kewenangan pengguna."} icon={UserCog} onClose={() => setCreateOpen(false)}>
        <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={createUser}>
          <label className="text-sm font-bold text-slate-700">Kode Branch<Input value={form.branchCode} onChange={(event) => setForm({ ...form, branchCode: event.target.value.replace(/\D/g, "").slice(0, 4) })} disabled={!isSuperAdmin} className="mt-1.5 h-10" required /></label>
          <label className="text-sm font-bold text-slate-700">Jabatan / Username<Input value={form.usernameSuffix} onChange={(event) => setForm({ ...form, usernameSuffix: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} placeholder={isSuperAdmin ? "KAUNIT atau SPV" : "CS, MANTRI_NAMA, LAINNYA_NAMA"} className="mt-1.5 h-10 uppercase" required /></label>
          <div className="sm:col-span-2 rounded-md bg-[#eef7ff] px-3 py-2 text-sm font-black text-[#00529c]">Username: {form.branchCode}-{form.usernameSuffix || "NAMA"}</div>
          <label className="text-sm font-bold text-slate-700">Nama Lengkap<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 h-10" required /></label>
          <label className="text-sm font-bold text-slate-700">Peran<Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, usernameSuffix: "" })} className="mt-1.5 h-10" disabled={isSuperAdmin}><option value="Admin" disabled={!isSuperAdmin}>Admin / Kaunit / SPV</option><option value="CS">CS</option><option value="Mantri">Mantri</option><option value="User">Lainnya</option></Select></label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">Password Awal<Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} className="mt-1.5 h-10" required /></label>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button><Button type="submit" className="bg-[#00529c]">Buat Pengguna</Button></div>
        </form>
      </OverlayShell> : null}

      {resetUser ? <OverlayShell title="Reset Password" description={`Tetapkan password baru untuk ${resetUser.username}. Semua sesi lamanya akan dihentikan.`} icon={LockKeyhole} onClose={() => setResetUser(undefined)}>
        <div className="space-y-4 p-5"><Input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} minLength={8} placeholder="Password baru minimal 8 karakter" /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setResetUser(undefined)}>Batal</Button><Button type="button" className="bg-[#00529c]" disabled={resetPassword.length < 8} onClick={() => updateUser({ userId: resetUser.id, action: "reset-password", password: resetPassword })}>Simpan Password</Button></div></div>
      </OverlayShell> : null}
    </div>
  );
}

const uploadSlots: {
  key: UploadSlotKey;
  title: string;
  period: string;
  description: string;
  accept: string;
  formatLabel: string;
  optional?: boolean;
}[] = [
  {
    key: "lw321-terbaru",
    title: "LW321 Terbaru",
    period: "Posisi data terkini",
    description: "Data utama untuk posisi outstanding dan kolektibilitas terbaru.",
    accept: ".csv",
    formatLabel: "CSV",
  },
  {
    key: "lw321-bulan-lalu",
    title: "LW321 Akhir Bulan Lalu",
    period: "Snapshot akhir bulan sebelumnya",
    description: "Pembanding kondisi kolektibilitas dan pergerakan rekening.",
    accept: ".csv",
    formatLabel: "CSV",
  },
  {
    key: "lw321-tahun-lalu",
    title: "LW321 Akhir Tahun Lalu",
    period: "Snapshot 31 Desember tahun lalu",
    description: "Data pembanding untuk posisi dan pencapaian sejak awal tahun.",
    accept: ".csv",
    formatLabel: "CSV",
  },
  {
    key: "lw321-dua-bulan",
    title: "LW321 Dua Bulan Lalu",
    period: "Snapshot dua bulan sebelum data terbaru",
    description: "Digunakan untuk menghitung New SML dan New NPL.",
    accept: ".csv",
    formatLabel: "CSV",
    optional: true,
  },
  {
    key: "brimen",
    title: "Data BRIMEN Berjalan",
    period: "Data operasional aktif",
    description: "Data arsip berkas dan jaminan dari aplikasi BRIMEN yang sudah berjalan.",
    accept: ".csv,.xlsx,.xls",
    formatLabel: "CSV / Excel",
  },
  {
    key: "nominatif-rekening",
    title: "Nominatif Per Rekening",
    period: "Posisi akhir bulan lalu",
    description: "Nominatif rekening untuk pencocokan dan validasi data pinjaman.",
    accept: ".csv",
    formatLabel: "CSV",
  },
  {
    key: "di319",
    title: "DI319 Akhir Bulan Lalu",
    period: "Posisi akhir bulan sebelumnya",
    description: "Data pendukung realisasi dan informasi pinjaman per rekening.",
    accept: ".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    formatLabel: "CSV / Excel",
  },
  {
    key: "almafact",
    title: "Almafact",
    period: "Dokumen pendukung unit kerja",
    description: "Unggah dokumen Almafact dalam bentuk gambar atau PDF.",
    accept: ".png,.pdf,image/png,application/pdf",
    formatLabel: "PNG / PDF",
  },
  {
    key: "branch-pl",
    title: "Branch PL",
    period: "Data pencapaian branch",
    description: "Data Branch PL untuk pemantauan posisi dan pencapaian unit kerja.",
    accept: ".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    formatLabel: "CSV / Excel",
  },
  {
    key: "kpi-rka",
    title: "KPI/RKA Uker",
    period: "Target dan rencana kerja unit",
    description: "Data KPI dan RKA sebagai pembanding target kinerja unit kerja.",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    formatLabel: "Excel",
  },
];

const emptyUploadSlots = Object.fromEntries(
  uploadSlots.map((slot) => [slot.key, { fileName: "", status: "Belum diunggah", uploadCount: 0 }]),
) as Record<UploadSlotKey, UploadSlotState>;

const uploadSlotTones = [
  { accent: "bg-[#00529c]", icon: "bg-[#00529c]", surface: "bg-[#eef7ff]", border: "border-[#b8d8f2]" },
  { accent: "bg-[#f37021]", icon: "bg-[#f37021]", surface: "bg-[#fff5ee]", border: "border-[#f7c9aa]" },
  { accent: "bg-teal-600", icon: "bg-teal-600", surface: "bg-teal-50", border: "border-teal-200" },
  { accent: "bg-amber-500", icon: "bg-amber-500", surface: "bg-amber-50", border: "border-amber-200" },
  { accent: "bg-sky-600", icon: "bg-sky-600", surface: "bg-sky-50", border: "border-sky-200" },
  { accent: "bg-emerald-600", icon: "bg-emerald-600", surface: "bg-emerald-50", border: "border-emerald-200" },
  { accent: "bg-rose-600", icon: "bg-rose-600", surface: "bg-rose-50", border: "border-rose-200" },
];

type SessionUpload = {
  id: string;
  fileName: string;
  source: string;
  uploadedAt: string;
  rows: number;
};

type UploadValidation = {
  total: number;
  accepted: number;
  duplicates: number;
  invalidAccounts: number;
  missingColumns: number;
  updated: number;
};

function UnggahView() {
  const [slotStates, setSlotStates] = useState<Record<UploadSlotKey, UploadSlotState>>(emptyUploadSlots);
  const [sessionUploads, setSessionUploads] = useState<SessionUpload[]>([]);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<Partial<Record<UploadSlotKey, File>>>({});
  const [validationResults, setValidationResults] = useState<Partial<Record<UploadSlotKey, UploadValidation>>>({});
  const completedCount = Object.values(slotStates).filter((item) => item.status === "Berhasil").length;
  const historyRows = [
    ...sessionUploads.map((item) => ({ ...item, status: "Berhasil", uploadedBy: "User Aktif", sourceName: item.source })),
    ...uploadHistory.map((item) => ({ id: `mock-${item.fileName}`, fileName: item.fileName, sourceName: "LW321", status: item.status, uploadedAt: item.uploadedAt, uploadedBy: item.uploadedBy, rows: item.rows })),
  ];
  const historyPagination = useTablePagination(historyRows, `${historyRows.length}`);

  useEffect(() => {
    fetch("/api/uploads", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) return;
        const uploadedRows = (payload.data ?? []) as { id: string; sourceKey: UploadSlotKey; fileName: string; sourceName: string; createdAt: string; rowCount: number }[];
        setSessionUploads(uploadedRows.map((item) => ({
          id: item.id,
          fileName: item.fileName,
          source: item.sourceName,
          uploadedAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt)),
          rows: item.rowCount,
        })));
        const latestBySource = new Map<UploadSlotKey, (typeof uploadedRows)[number]>();
        uploadedRows.forEach((item) => {
          if (!latestBySource.has(item.sourceKey)) latestBySource.set(item.sourceKey, item);
        });
        setSlotStates((current) => {
          const next = { ...current };
          latestBySource.forEach((item, key) => {
            if (!next[key]) return;
            next[key] = {
              fileName: item.fileName,
              status: "Berhasil",
              uploadedAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt)),
              source: `${item.rowCount.toLocaleString("id-ID")} baris aktif`,
              uploadCount: 1,
            };
          });
          return next;
        });
      });
  }, []);

  function selectUploadFile(key: UploadSlotKey, file?: File) {
    setSelectedUploadFiles((current) => ({ ...current, [key]: file }));
    setSlotStates((current) => ({
      ...current,
      [key]: file
        ? {
            ...current[key],
            fileName: file.name,
            status: "Siap diunggah",
            uploadedAt: undefined,
            source: undefined,
          }
        : { ...current[key], fileName: "", status: "Belum diunggah", uploadedAt: undefined },
    }));
  }

  async function completeUpload(key: UploadSlotKey) {
    const slot = uploadSlots.find((item) => item.key === key);
    const fileName = slotStates[key].fileName;
    const file = selectedUploadFiles[key];
    if (!file || !slot) return;
    const uploadedAt = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    const slotIndex = uploadSlots.findIndex((item) => item.key === key);
    const total = [3284, 3251, 3012, 3220, 1248, 2876, 1942, 1, 416, 68][Math.max(0, slotIndex)];
    const duplicates = [12, 9, 6, 8, 3, 11, 4, 0, 2, 0][Math.max(0, slotIndex)];
    const invalidAccounts = [4, 3, 2, 3, 0, 5, 2, 0, 0, 0][Math.max(0, slotIndex)];
    const missingColumns = fileName.toLowerCase().includes("error") ? 2 : 0;
    const accepted = Math.max(0, total - duplicates - invalidAccounts);
    let validation = { total, accepted, duplicates, invalidAccounts, missingColumns, updated: accepted };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sourceKey", key);
    formData.append("sourceName", slot.title);
    formData.append("rowCount", String(accepted));
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setSlotStates((current) => ({ ...current, [key]: { ...current[key], status: "Siap diunggah", source: payload.message ?? "Upload gagal." } }));
      return;
    }
    if (payload.import) {
      validation = {
        total: payload.import.accepted + payload.import.rejected + payload.import.duplicates,
        accepted: payload.import.accepted,
        duplicates: payload.import.duplicates,
        invalidAccounts: payload.import.rejected,
        missingColumns: 0,
        updated: payload.import.accepted,
      };
    }

    setSlotStates((current) => ({
      ...current,
      [key]: {
        ...current[key],
        status: "Berhasil",
        uploadedAt,
        source: key === "lw321-terbaru"
          ? `${payload.import?.brimenSynchronized ?? 0} data BRIMEN tersinkron; data arsip tetap tersimpan`
          : current[key].uploadCount > 0 ? "Data aktif sebelumnya telah ditimpa" : "Data aktif berhasil dibuat",
        uploadCount: current[key].uploadCount + 1,
      },
    }));
    setSessionUploads((current) => [
      {
        id: `${key}-${Date.now()}`,
        fileName,
        source: slot?.title ?? "Data",
        uploadedAt,
        rows: payload.data?.rowCount ?? validation.accepted,
      },
      ...current,
    ]);
    setValidationResults((current) => ({ ...current, [key]: validation }));
    window.dispatchEvent(new CustomEvent("britoel-data-uploaded", { detail: { sourceKey: key } }));
  }

  function usePreviousArchive() {
    setSlotStates((current) => ({
      ...current,
      "lw321-dua-bulan": {
        fileName: "Arsip LW321 dari unggahan bulan sebelumnya",
        status: "Berhasil",
        uploadedAt: "Tersedia otomatis",
        source: "Menggunakan arsip bulan sebelumnya",
        uploadCount: current["lw321-dua-bulan"].uploadCount + 1,
      },
    }));
    setValidationResults((current) => ({ ...current, "lw321-dua-bulan": { total: 3220, accepted: 3220, duplicates: 0, invalidAccounts: 0, missingColumns: 0, updated: 3220 } }));
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Upload Data"
        description="Perbarui sumber data sesuai kebutuhan. Setiap upload baru akan menimpa data aktif sebelumnya."
        icon={Upload}
      />

      <div className="bri-card rounded-lg border border-[#d7e3ef] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-[#f37021]">Status Pembaruan</p>
            <p className="mt-1 text-sm font-semibold text-[#004077]">
              {completedCount} dari {uploadSlots.length} sumber data telah diperbarui
            </p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eaf3fb] sm:w-64">
            <div
              className="h-full rounded-full bg-[#00529c] transition-all"
              style={{ width: `${(completedCount / uploadSlots.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {uploadSlots.map((slot, index) => {
          const state = slotStates[slot.key];
          const isComplete = state.status === "Berhasil";
          const isReady = state.status === "Siap diunggah";
          const tone = uploadSlotTones[index % uploadSlotTones.length];
          const validation = validationResults[slot.key];

          return (
            <Card
              key={slot.key}
              className={cn(
                "bri-card grid h-full grid-rows-[auto_1fr] overflow-hidden transition",
                tone.border,
                isComplete && "border-emerald-300",
              )}
            >
              <CardHeader className={cn("relative min-h-[132px] space-y-2 border-b p-4", tone.surface, tone.border)}>
                <div className={cn("absolute inset-x-0 top-0 h-1", isComplete ? "bg-emerald-500" : isReady ? "bg-[#f37021]" : tone.accent)} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-md text-sm font-black text-white shadow-sm",
                      isComplete ? "bg-emerald-600" : tone.icon,
                    )}>
                      {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base text-[#004077]">{slot.title}</CardTitle>
                      <CardDescription className="mt-1">{slot.period}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isComplete ? "success" : isReady ? "warning" : "secondary"}>
                    {state.status}
                  </Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{slot.description}</p>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="rounded-md border border-dashed border-[#b9cee1] bg-white p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#00529c]">Format: {slot.formatLabel}</span>
                    {slot.optional ? <Badge variant="outline">Arsip tersedia</Badge> : null}
                  </div>
                  <Input
                    key={`${slot.key}-${state.uploadedAt ?? "baru"}`}
                    type="file"
                    accept={slot.accept}
                    className="cursor-pointer bg-white file:mr-3 file:border-0 file:bg-[#eaf3fb] file:px-3 file:py-1 file:font-semibold file:text-[#00529c]"
                    onChange={(event) => selectUploadFile(slot.key, event.target.files?.[0])}
                  />
                </div>

                {state.fileName ? (
                  <div className="flex items-start gap-2 rounded-md bg-[#f5f9fd] px-3 py-2 text-sm">
                    <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-[#f37021]" />
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-[#004077]">{state.fileName}</p>
                      {state.uploadedAt ? <p className="mt-0.5 text-xs text-muted-foreground">{state.uploadedAt}</p> : null}
                      {state.source ? <p className="mt-0.5 text-xs font-semibold text-emerald-700">{state.source}</p> : null}
                      {state.uploadCount > 1 ? <p className="mt-0.5 text-xs font-semibold text-[#f37021]">Telah diperbarui {state.uploadCount} kali</p> : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada file yang dipilih.</p>
                )}

                {isComplete && validation ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="flex items-center justify-between gap-2"><p className="text-xs font-black uppercase text-emerald-700">Hasil Validasi</p><Badge variant={validation.missingColumns ? "danger" : "success"}>{validation.missingColumns ? "Perlu diperiksa" : "Struktur sesuai"}</Badge></div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-base font-black text-emerald-700">{formatNumber(validation.accepted)}</p><p className="text-[9px] uppercase text-muted-foreground">Diterima</p></div>
                      <div><p className="text-base font-black text-[#f37021]">{formatNumber(validation.duplicates)}</p><p className="text-[9px] uppercase text-muted-foreground">Duplikat</p></div>
                      <div><p className="text-base font-black text-rose-700">{formatNumber(validation.invalidAccounts)}</p><p className="text-[9px] uppercase text-muted-foreground">Tidak Valid</p></div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{validation.missingColumns ? `${validation.missingColumns} kolom tidak ditemukan.` : "Seluruh kolom utama ditemukan."} {formatNumber(validation.updated)} data aktif diperbarui.</p>
                  </div>
                ) : null}

                <p className="text-[11px] leading-4 text-muted-foreground">Upload baru menimpa data aktif dari sumber yang sama.</p>

                <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {slot.optional ? (
                    <Button type="button" variant="outline" className="border-[#00529c]/25 text-[#00529c]" onClick={usePreviousArchive}>
                      Gunakan Arsip Bulan Sebelumnya
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    disabled={!state.fileName || isComplete}
                    onClick={() => completeUpload(slot.key)}
                  >
                    {isComplete ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isComplete ? "Pilih File Baru" : "Upload File"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="pt-1">
        <h2 className="text-base font-black text-[#00529c]">Riwayat Unggahan Terakhir</h2>
        <p className="mt-1 text-sm text-muted-foreground">Daftar file yang pernah diproses pada aplikasi.</p>
      </div>
      <TableShell>
        <thead>
          <tr>
            <Th>Jenis Data</Th>
            <Th>Nama File</Th>
            <Th>Status</Th>
            <Th>Waktu Upload</Th>
            <Th>Uploader</Th>
            <Th>Jumlah Baris</Th>
          </tr>
        </thead>
        <tbody>
          {historyPagination.pagedRows.map((item) => (
            <tr key={item.id} className={cn(!String(item.id).startsWith("mock-") && "bg-emerald-50/50")}>
              <Td className="font-medium text-[#00529c]">{item.sourceName}</Td>
              <Td className="font-medium">{item.fileName}</Td>
              <Td><Badge variant={item.status === "Berhasil" ? "success" : item.status === "Gagal" ? "danger" : "warning"}>{item.status}</Badge></Td>
              <Td>{item.uploadedAt}</Td>
              <Td>{item.uploadedBy}</Td>
              <Td>{formatNumber(item.rows)}</Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <PaginationControls page={historyPagination.page} pageSize={historyPagination.pageSize} totalItems={historyRows.length} onPageChange={historyPagination.setPage} onPageSizeChange={historyPagination.setPageSize} />
    </div>
  );
}
