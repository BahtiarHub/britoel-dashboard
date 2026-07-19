# BRI Tool Dashboard

Dashboard monitoring pinjaman dan operasional BRIMEN berbasis Next.js, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL, dan Better Auth.

## Menjalankan Lokal

1. Siapkan database PostgreSQL kosong, misalnya `bri_tool`.
2. Salin `.env.example` menjadi `.env.local`, lalu isi `DATABASE_URL`, rahasia Better Auth, dan akun SuperAdmin.
3. Instal dependensi dengan `corepack pnpm install`.
4. Terapkan schema dengan `corepack pnpm db:migrate`.
5. Jalankan aplikasi dengan `corepack pnpm dev`.
6. Buka `http://127.0.0.1:3000`.

Untuk database baru tanpa data lama, jalankan `corepack pnpm db:seed` setelah migrasi schema.

## Migrasi SQLite

File SQLite lama tetap menjadi cadangan dan hanya dibaca oleh skrip migrasi. Pastikan `SQLITE_SOURCE_PATH` dan `BRIMEN_DB_PATH` di `.env.local` menunjuk file yang benar, kemudian jalankan:

```bash
corepack pnpm db:migrate
corepack pnpm db:migrate-sqlite
```

Skrip memindahkan pengguna, sesi, data upload, pinjaman, CKPN, simpanan, surat peringatan, Covenance Day, audit, kontak WhatsApp, serta nasabah dan peminjaman BRIMEN. Migrasi dapat dijalankan ulang; data dengan kunci yang sudah ada tidak digandakan.

## Perintah

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:migrate-sqlite
corepack pnpm db:seed
corepack pnpm build
corepack pnpm start
```

Database, file upload, file environment, serta log server tidak disimpan dalam Git.

## Produksi Supabase (Singapore)

Gunakan project Supabase berbayar di region Singapore. Supabase menyediakan dua
koneksi database yang dipakai berbeda:

- `DATABASE_URL`: transaction/session pooler untuk aplikasi yang sedang berjalan.
- `DIRECT_DATABASE_URL`: direct connection untuk migrasi Drizzle dan pekerjaan admin.

Isi `.env.production` berdasarkan `.env.example`. Gunakan URL HTTPS publik untuk
`BETTER_AUTH_URL`, rahasia acak minimal 32 karakter, dan service role key hanya di
server. Jangan memasukkan `.env.production` ke Git.

Urutan go-live dari komputer yang memiliki akses ke PostgreSQL lokal dan Supabase:

```bash
# 1. Terapkan seluruh schema dan indeks ke Supabase (DIRECT_DATABASE_URL).
corepack pnpm db:migrate

# 2. Salin data PostgreSQL lokal ke Supabase.
# SOURCE_DATABASE_URL mengarah ke lokal, DIRECT_DATABASE_URL ke Supabase.
corepack pnpm db:migrate-postgres

# 3. Pindahkan file lokal ke bucket privat Supabase Storage.
corepack pnpm storage:migrate

# 4. Verifikasi schema, indeks, konfigurasi, dan isolasi branch.
corepack pnpm verify:production

# 5. Uji login/session dan hak akses dengan akun uji Admin Uker.
corepack pnpm smoke:production

# 6. Jalankan load test bertahap setelah aplikasi production aktif.
corepack pnpm load:test
```

Variabel yang diperlukan untuk migrasi data:

```env
SOURCE_DATABASE_URL=postgresql://...database-lokal...
DIRECT_DATABASE_URL=postgresql://...database-supabase...
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=britoel-private
```

Variabel smoke test (gunakan akun uji, bukan SuperAdmin):

```env
SMOKE_BASE_URL=https://domain-produksi.example
SMOKE_ADMIN_EMAIL=akun-uji@example.com
SMOKE_ADMIN_PASSWORD=...
SMOKE_OTHER_BRANCH=9999
```

Load test menggunakan k6. Mulai dari 25 user, lalu 100, 300, dan 1.000 user
virtual sambil memantau CPU, RAM, pool koneksi, latensi p95, dan error rate:

```bash
k6 run -e BASE_URL=https://domain-produksi.example -e TARGET_VUS=25 \
  -e TEST_EMAIL=akun-uji@example.com -e TEST_PASSWORD=... tests/load/britoel.js
```

Target awal yang dipakai skrip: error di bawah 1% dan p95 respons di bawah 1,5
detik. Jangan membuka seluruh uker bila salah satu ambang gagal. File Docker,
Compose, health check, dan contoh reverse proxy tersedia di repository untuk
deployment VPS. Backup database dan backup Storage harus dijadwalkan terpisah.
