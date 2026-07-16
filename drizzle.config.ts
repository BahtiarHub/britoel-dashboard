import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle-postgres",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/bri_tool",
  },
});
