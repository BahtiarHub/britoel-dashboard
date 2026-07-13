import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireApiSession(request: Request) {
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
  await db.update(user).set({ lastActiveAt: new Date(), updatedAt: new Date() }).where(eq(user.id, session.user.id));
  return { session, response: null };
}
