import { eq } from "drizzle-orm";

process.env.BETTER_AUTH_ALLOW_SIGNUP = "true";

async function main() {
  const { auth } = await import("../src/lib/auth");
  const { db } = await import("../src/db");
  const { user } = await import("../src/db/schema");

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@britoel.local";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const username = process.env.SEED_ADMIN_USERNAME ?? "8014-SUPERADMIN";
  if (!password) throw new Error("SEED_ADMIN_PASSWORD wajib diisi sebelum menjalankan db:seed.");

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!existing.length) {
    await auth.api.signUpEmail({
      body: {
        name: "Administrator BRIToel",
        email,
        password,
        username,
        displayUsername: username,
      },
    });
  }

  await db.update(user).set({ role: "SuperAdmin", username: username.toLowerCase(), displayUsername: username, branchCode: "8014", active: true, updatedAt: new Date() }).where(eq(user.email, email));
  console.log(`Akun SuperAdmin siap: ${username}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
