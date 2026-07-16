import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

type ApiSessionOptions = {
  allowSuperAdminWrite?: boolean;
};

export async function requireApiSession(request: Request, options: ApiSessionOptions = {}) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ ok: false, message: "Sesi tidak valid. Silakan masuk kembali." }, { status: 401 }),
    };
  }
  if (session.user.active === false) {
    return {
      session: null,
      response: NextResponse.json({ ok: false, message: "Akun dinonaktifkan. Hubungi pengelola uker." }, { status: 403 }),
    };
  }
  const currentUser = (await db.select({ createdBy: user.createdBy }).from(user).where(eq(user.id, session.user.id)).limit(1))[0];
  if (currentUser?.createdBy && session.user.role !== "Admin" && session.user.role !== "SuperAdmin") {
    const parentAdmin = (await db.select({ active: user.active, role: user.role }).from(user).where(eq(user.id, currentUser.createdBy)).limit(1))[0];
    if (parentAdmin?.role === "Admin" && parentAdmin.active === false) {
      return {
        session: null,
        response: NextResponse.json({ ok: false, message: "Admin unit kerja sedang dinonaktifkan. Akses seluruh pengguna di bawahnya dihentikan sementara." }, { status: 403 }),
      };
    }
  }
  const isWriteRequest = !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase());
  if (session.user.role === "SuperAdmin" && isWriteRequest && !options.allowSuperAdminWrite) {
    return {
      session: null,
      response: NextResponse.json({ ok: false, message: "SuperAdmin hanya memiliki akses pemantauan. Pengolahan data dilakukan oleh Admin unit kerja." }, { status: 403 }),
    };
  }
  await db.update(user).set({ lastActiveAt: new Date(), updatedAt: new Date() }).where(eq(user.id, session.user.id));
  return { session, response: null };
}
