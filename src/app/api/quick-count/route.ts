import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, quickCountResults } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedForecasts = new Set(["Lancar", "SML1", "SML2", "SML3", "KL", "Diragukan", "Macet"]);

function validPeriod(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizedAmount(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(Math.max(-9_000_000_000_000, Math.min(9_000_000_000_000, amount)));
}

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const url = new URL(request.url);
  const period = String(url.searchParams.get("period") ?? "");
  const workDate = String(url.searchParams.get("date") ?? "");
  if (!validPeriod(period) || !validDate(workDate)) {
    return NextResponse.json({ ok: false, message: "Periode atau tanggal Quick Count tidak valid." }, { status: 400 });
  }

  const ownBranch = guard.session.user.branchCode ?? "8014";
  const requestedBranch = String(url.searchParams.get("branch") ?? ownBranch);
  const branchCode = guard.session.user.role === "SuperAdmin" && /^\d{4}$/.test(requestedBranch) ? requestedBranch : ownBranch;
  const rows = await db.select().from(quickCountResults).where(and(
    eq(quickCountResults.branchCode, branchCode),
    eq(quickCountResults.period, period),
    eq(quickCountResults.workDate, workDate),
  )).orderBy(asc(quickCountResults.accountNumber));

  return NextResponse.json({
    ok: true,
    branchCode,
    period,
    workDate,
    data: rows.map((row) => ({
      accountNumber: row.accountNumber,
      name: row.debtorName,
      quality: row.quality,
      billing: String(row.billing),
      actToday: String(row.actToday),
      remaining: String(row.remaining),
      address: row.address,
      forecast: row.forecastCollectibility,
    })),
  });
}

export async function PUT(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => undefined) as {
    period?: unknown;
    workDate?: unknown;
    rows?: unknown;
    forecasts?: unknown;
  } | undefined;
  const period = String(body?.period ?? "");
  const workDate = String(body?.workDate ?? "");
  if (!validPeriod(period) || !validDate(workDate) || !Array.isArray(body?.rows)) {
    return NextResponse.json({ ok: false, message: "Payload Quick Count tidak valid." }, { status: 400 });
  }
  if (body.rows.length > 25_000) {
    return NextResponse.json({ ok: false, message: "Maksimal 25.000 baris Quick Count per hari." }, { status: 400 });
  }

  const forecasts = body.forecasts && typeof body.forecasts === "object" && !Array.isArray(body.forecasts)
    ? body.forecasts as Record<string, unknown>
    : {};
  const branchCode = guard.session.user.branchCode ?? "8014";
  const now = new Date();
  const uniqueRows = new Map<string, {
    accountNumber: string;
    name: string;
    quality: string;
    billing: number;
    actToday: number;
    remaining: number;
    address: string;
  }>();
  for (const value of body.rows) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const accountNumber = String(row.accountNumber ?? "").replace(/\D/g, "").slice(0, 30);
    if (!accountNumber) continue;
    uniqueRows.set(accountNumber, {
      accountNumber,
      name: String(row.name ?? "").trim().slice(0, 250),
      quality: String(row.quality ?? "").trim().slice(0, 30),
      billing: normalizedAmount(row.billing),
      actToday: normalizedAmount(row.actToday),
      remaining: normalizedAmount(row.remaining),
      address: String(row.address ?? "").trim().slice(0, 1000),
    });
  }

  const values = [...uniqueRows.values()].map((row) => {
    const forecastValue = String(forecasts[row.accountNumber] ?? "");
    return {
      id: crypto.randomUUID(),
      branchCode,
      period,
      workDate,
      accountNumber: row.accountNumber,
      debtorName: row.name,
      quality: row.quality,
      billing: row.billing,
      actToday: row.actToday,
      remaining: row.remaining,
      address: row.address,
      forecastCollectibility: allowedForecasts.has(forecastValue) ? forecastValue : "",
      updatedBy: guard.session.user.id,
      updatedAt: now,
    };
  });

  await db.transaction(async (tx) => {
    await tx.delete(quickCountResults).where(and(
      eq(quickCountResults.branchCode, branchCode),
      eq(quickCountResults.period, period),
      eq(quickCountResults.workDate, workDate),
    ));
    for (let index = 0; index < values.length; index += 500) {
      await tx.insert(quickCountResults).values(values.slice(index, index + 500));
    }
    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: guard.session.user.id,
      action: "QUICK_COUNT_SAVE",
      entity: "quick_count_results",
      entityId: `${period}:${workDate}`,
      detail: `${values.length} rekening Quick Count disimpan`,
      branchCode,
      createdAt: now,
    });
  });

  return NextResponse.json({ ok: true, count: values.length, updatedAt: now.toISOString() });
}
