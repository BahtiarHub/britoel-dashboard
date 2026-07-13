import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "britoel.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDatabase = globalThis as unknown as { britoelSqlite?: Database.Database };
const sqlite = globalForDatabase.britoelSqlite ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
if (process.env.NODE_ENV !== "production") globalForDatabase.britoelSqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export { dbPath, sqlite };
