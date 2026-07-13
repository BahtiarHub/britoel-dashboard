import { and, desc, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { account, auditLogs, session, user } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const branchPattern = /^\d{4}$/;
const usernamePattern = /^\d{4}-[A-Z0-9_]+$/;
const managedRoles = ["Admin", "CS", "Mantri", "User"] as const;

function canManage(role?: string | null) {
  return role === "SuperAdmin" || role === "Admin";
}

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  if (!canManage(guard.session.user.role)) {
    return NextResponse.json({ ok: false, message: "Anda tidak memiliki akses manajemen pengguna." }, { status: 403 });
  }

  const allUsers = await db.select().from(user).orderBy(desc(user.lastActiveAt), user.branchCode, user.name);
  const allSessions = await db.select({ userId: session.userId, expiresAt: session.expiresAt, updatedAt: session.updatedAt }).from(session);
  const now = Date.now();
  const visibleUsers = allUsers.filter((item) => guard.session.user.role === "SuperAdmin" || (item.branchCode === guard.session.user.branchCode && item.role !== "SuperAdmin"));
  const data = visibleUsers.map((item) => {
    const userSessions = allSessions.filter((entry) => entry.userId === item.id && entry.expiresAt.getTime() > now);
    const latestSession = userSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const latestActivity = item.lastActiveAt ?? latestSession?.updatedAt ?? null;
    return {
      id: item.id,
      username: item.displayUsername ?? item.username ?? "-",
      name: item.name,
      role: item.role,
      branchCode: item.branchCode,
      active: item.active,
      lastActiveAt: latestActivity,
      online: Boolean(latestActivity && now - latestActivity.getTime() <= 5 * 60 * 1000),
      activeSessions: userSessions.length,
      createdAt: item.createdAt,
    };
  });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  if (!canManage(guard.session.user.role)) {
    return NextResponse.json({ ok: false, message: "Anda tidak memiliki akses membuat pengguna." }, { status: 403 });
  }

  const body = await request.json();
  const branchCode = String(body.branchCode ?? "").trim();
  const suffix = String(body.usernameSuffix ?? "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const username = `${branchCode}-${suffix}`;
  const role = String(body.role ?? "User");
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!branchPattern.test(branchCode) || !suffix || !usernamePattern.test(username)) {
    return NextResponse.json({ ok: false, message: "Kode branch harus 4 angka dan nama username wajib diisi." }, { status: 400 });
  }
  if (!name || password.length < 8) {
    return NextResponse.json({ ok: false, message: "Nama wajib diisi dan kata sandi minimal 8 karakter." }, { status: 400 });
  }
  if (!managedRoles.includes(role as (typeof managedRoles)[number])) {
    return NextResponse.json({ ok: false, message: "Peran pengguna tidak valid." }, { status: 400 });
  }
  if (guard.session.user.role === "Admin" && (branchCode !== guard.session.user.branchCode || role === "Admin")) {
    return NextResponse.json({ ok: false, message: "Admin hanya dapat membuat pengguna non-Admin pada branch sendiri." }, { status: 403 });
  }

  const normalizedUsername = username.toLowerCase();
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.username, normalizedUsername)).limit(1);
  if (existing.length) return NextResponse.json({ ok: false, message: "Username sudah digunakan." }, { status: 409 });

  const now = new Date();
  const userId = crypto.randomUUID();
  const email = `${normalizedUsername.replace(/_/g, ".")}@users.britoel.local`;
  const passwordHash = await hashPassword(password);
  db.transaction((tx) => {
    tx.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role,
      username: normalizedUsername,
      displayUsername: username,
      branchCode,
      active: true,
      createdBy: guard.session.user.id,
      createdAt: now,
      updatedAt: now,
    }).run();
    tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    }).run();
    tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: guard.session.user.id,
      action: "CREATE_USER",
      entity: "user",
      entityId: userId,
      detail: `${username} | ${role}`,
      branchCode,
      createdAt: now,
    }).run();
  });

  return NextResponse.json({ ok: true, data: { id: userId, username, name, role, branchCode } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  if (!canManage(guard.session.user.role)) {
    return NextResponse.json({ ok: false, message: "Anda tidak memiliki akses mengubah pengguna." }, { status: 403 });
  }

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const target = (await db.select().from(user).where(eq(user.id, userId)).limit(1))[0];
  if (!target) return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  if (target.role === "SuperAdmin" || (guard.session.user.role === "Admin" && target.branchCode !== guard.session.user.branchCode)) {
    return NextResponse.json({ ok: false, message: "Pengguna tersebut berada di luar kewenangan Anda." }, { status: 403 });
  }

  const now = new Date();
  if (body.action === "toggle-active") {
    const active = Boolean(body.active);
    await db.update(user).set({ active, updatedAt: now }).where(eq(user.id, userId));
    if (!active) await db.delete(session).where(eq(session.userId, userId));
  } else if (body.action === "reset-password") {
    const password = String(body.password ?? "");
    if (password.length < 8) return NextResponse.json({ ok: false, message: "Kata sandi minimal 8 karakter." }, { status: 400 });
    await db.update(account).set({ password: await hashPassword(password), updatedAt: now }).where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
    await db.delete(session).where(eq(session.userId, userId));
  } else {
    return NextResponse.json({ ok: false, message: "Aksi tidak dikenal." }, { status: 400 });
  }

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorId: guard.session.user.id,
    action: body.action === "reset-password" ? "RESET_USER_PASSWORD" : "UPDATE_USER_STATUS",
    entity: "user",
    entityId: userId,
    detail: target.displayUsername ?? target.username,
    branchCode: target.branchCode,
    createdAt: now,
  });
  return NextResponse.json({ ok: true });
}
