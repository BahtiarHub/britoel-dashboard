import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type StoredObjectInfo = {
  key: string;
  name: string;
  updatedAt: string;
};

const storageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "britoel-private";
const localStorageRoot = path.join(process.cwd(), "data", "uploads");
let supabaseClient: SupabaseClient | undefined;
let bucketPromise: Promise<void> | undefined;

function storageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return undefined;
  supabaseClient ??= createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return supabaseClient;
}

async function ensureBucket(client: SupabaseClient) {
  bucketPromise ??= (async () => {
    const { data, error } = await client.storage.getBucket(storageBucket);
    if (data && !error) return;
    const created = await client.storage.createBucket(storageBucket, {
      public: false,
      fileSizeLimit: 25 * 1024 * 1024,
    });
    if (created.error && !/already exists/i.test(created.error.message)) throw created.error;
  })();
  await bucketPromise;
}

function safeParts(value: string) {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_"));
}

export function storageKey(...parts: string[]) {
  return parts.flatMap(safeParts).join("/");
}

function localPath(key: string) {
  const resolved = path.resolve(localStorageRoot, ...safeParts(key));
  if (!resolved.startsWith(path.resolve(localStorageRoot) + path.sep)) throw new Error("Path penyimpanan tidak valid.");
  return resolved;
}

export function usesSupabaseStorage() {
  return Boolean(storageClient());
}

export async function putStoredObject(key: string, bytes: Uint8Array, contentType = "application/octet-stream") {
  const normalizedKey = storageKey(key);
  const client = storageClient();
  if (client) {
    await ensureBucket(client);
    const result = await client.storage.from(storageBucket).upload(normalizedKey, bytes, {
      contentType,
      upsert: true,
      cacheControl: "0",
    });
    if (result.error) throw result.error;
    return normalizedKey;
  }

  const destination = localPath(normalizedKey);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes);
  return normalizedKey;
}

export async function getStoredObject(key: string) {
  const normalizedKey = storageKey(key);
  const client = storageClient();
  if (client) {
    await ensureBucket(client);
    const result = await client.storage.from(storageBucket).download(normalizedKey);
    if (result.error) throw result.error;
    return Buffer.from(await result.data.arrayBuffer());
  }
  return fs.readFile(localPath(normalizedKey));
}

export async function listStoredObjects(prefix: string): Promise<StoredObjectInfo[]> {
  const normalizedPrefix = storageKey(prefix);
  const client = storageClient();
  if (client) {
    await ensureBucket(client);
    const result = await client.storage.from(storageBucket).list(normalizedPrefix, {
      limit: 1000,
      sortBy: { column: "updated_at", order: "desc" },
    });
    if (result.error) throw result.error;
    return (result.data ?? [])
      .filter((item) => item.id)
      .map((item) => ({
        key: storageKey(normalizedPrefix, item.name),
        name: item.name,
        updatedAt: item.updated_at ?? item.created_at ?? new Date(0).toISOString(),
      }));
  }

  const directory = localPath(normalizedPrefix);
  const names = await fs.readdir(directory).catch(() => []);
  const rows = await Promise.all(names.map(async (name) => {
    const filePath = path.join(directory, name);
    const stat = await fs.stat(filePath).catch(() => undefined);
    if (!stat?.isFile()) return undefined;
    return { key: storageKey(normalizedPrefix, name), name, updatedAt: stat.mtime.toISOString() };
  }));
  return rows
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteStoredObjects(keys: string[]) {
  const normalizedKeys = keys.map((key) => storageKey(key)).filter(Boolean);
  if (!normalizedKeys.length) return;
  const client = storageClient();
  if (client) {
    await ensureBucket(client);
    const result = await client.storage.from(storageBucket).remove(normalizedKeys);
    if (result.error) throw result.error;
    return;
  }
  await Promise.all(normalizedKeys.map((key) => fs.unlink(localPath(key)).catch(() => undefined)));
}
