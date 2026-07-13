import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";

export const auth = betterAuth({
  appName: "BRIToel",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "britoel-local-development-secret-change-before-production",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
    "http://localhost:3000",
  ],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.BETTER_AUTH_ALLOW_SIGNUP !== "true",
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "Mantri",
        input: false,
      },
      branchCode: { type: "string", required: false, defaultValue: "8014", input: false },
      active: { type: "boolean", required: false, defaultValue: true, input: false },
      lastActiveAt: { type: "date", required: false, input: false },
      createdBy: { type: "string", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  plugins: [
    username({
      minUsernameLength: 5,
      maxUsernameLength: 40,
      usernameValidator: (value) => /^\d{4}-[a-zA-Z0-9_]+$/.test(value),
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
