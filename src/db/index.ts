import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/bri_tool";
const globalForDatabase = globalThis as unknown as { briToolPostgres?: ReturnType<typeof postgres> };
export const sql = globalForDatabase.briToolPostgres ?? postgres(databaseUrl, {
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});
if (process.env.NODE_ENV !== "production") globalForDatabase.briToolPostgres = sql;

export const db = drizzle(sql, { schema });
