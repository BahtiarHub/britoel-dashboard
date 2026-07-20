# BRI Tool Dashboard

Dashboard monitoring pinjaman dan operasional BRIMEN berbasis Next.js, Tailwind CSS, shadcn/ui, Drizzle ORM, PostgreSQL, dan Better Auth.

## Mode Lokal Privat

Mode ini menyimpan database PostgreSQL dan seluruh file upload di komputer
sendiri. Tidak diperlukan Supabase dan data tidak dikirim ke layanan database
atau storage eksternal.

Komputer pengembangan ini sudah memakai PostgreSQL portable di `data/postgres-runtime`
dengan cluster persisten di `data/postgres-cluster`. Jalankan:

```powershell
corepack pnpm local:setup
corepack pnpm local:db:start
corepack pnpm db:migrate
corepack pnpm dev
```

Perintah pengelolaan harian:

```powershell
corepack pnpm local:db:status
corepack pnpm local:db:stop
corepack pnpm local:backup
```

File disimpan di `data/uploads`. Backup bertanggal disimpan di `data/backups`
dan memuat dump PostgreSQL beserta seluruh file upload. Folder database, upload,
backup, dan environment tidak pernah dimasukkan ke Git.

## Menjalankan Lokal Manual

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

## Deployment Mandiri dengan Docker

Kode aplikasi tetap dapat dideploy tanpa menggunakan database cloud. Deployment
Docker menjalankan Next.js dan PostgreSQL dalam dua container, sedangkan data
database serta file upload berada pada volume persisten milik server.

1. Salin `.env.docker.example` menjadi `.env`.
2. Ganti `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, dan `SEED_ADMIN_PASSWORD`.
3. Jalankan `docker compose up -d --build`.
4. Buka `http://127.0.0.1:3000`.

Container setup menerapkan migrasi Drizzle dan membuat akun SuperAdmin awal
sebelum server dimulai. Port database dan aplikasi hanya terikat ke `127.0.0.1` secara default.
Untuk akses jaringan kantor, gunakan reverse proxy HTTPS atau ubah binding
secara sadar setelah firewall disiapkan.

## Opsional: Produksi Supabase (Singapore)

Bagian ini tidak digunakan dalam mode lokal privat. Simpan sebagai jalur migrasi
masa depan hanya bila penggunaan layanan cloud sudah mendapatkan izin.

Gunakan project Supabase berbayar di region Singapore. Supabase menyediakan dua
koneksi database yang dipakai berbeda:

- `DATABASE_URL`: transaction/session pooler untuk aplikasi yang sedang berjalan.
- `DIRECT_DATABASE_URL`: direct connection untuk migrasi Drizzle dan pekerjaan admin.

Jika komputer migrasi hanya memiliki jaringan IPv4, gunakan Session Pooler port
5432 sebagai pengganti sementara `DIRECT_DATABASE_URL` saat menjalankan migrasi.
Direct connection tetap disimpan untuk server atau runner yang mendukung IPv6.

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

Durasi tahap dapat dipersingkat untuk baseline dengan
`RAMP_QUARTER_DURATION`, `RAMP_TARGET_DURATION`, `HOLD_DURATION`, dan
`RAMP_DOWN_DURATION`. Nilai default tetap 2 menit, 3 menit, 5 menit, dan 2 menit.

Target awal yang dipakai skrip: error di bawah 1% dan p95 respons di bawah 1,5
detik. Jangan membuka seluruh uker bila salah satu ambang gagal. File Docker,
Compose, health check, dan contoh reverse proxy tersedia di repository untuk
deployment VPS. Backup database dan backup Storage harus dijadwalkan terpisah.

Pada Windows di folder OneDrive, pembuatan symlink output standalone dapat
ditolak sistem. Gunakan `NEXT_STANDALONE=false` untuk build lokal; build Docker
atau Linux tetap memakai output standalone secara default.

## Mengaktifkan WA Blast

WA Blast menggunakan WhatsApp Cloud API resmi dan secara default berjalan dalam
mode simulasi. Buat dan setujui template `penawaran_suplesi` serta
`pengingat_setoran` di WhatsApp Manager, lalu isi environment server:

```env
WHATSAPP_SEND_MODE=live
WHATSAPP_ACCESS_TOKEN=token-system-user-meta
WHATSAPP_PHONE_NUMBER_ID=id-nomor-whatsapp-business
WHATSAPP_GRAPH_VERSION=v23.0
WHATSAPP_TEMPLATE_PIPELINE=penawaran_suplesi
WHATSAPP_TEMPLATE_REMINDER=pengingat_setoran
WHATSAPP_TEMPLATE_LANGUAGE=id
```

Nama, bahasa, urutan, dan jumlah parameter template di Meta harus sama dengan
payload aplikasi. Template penawaran menggunakan urutan `nama`, `produk`,
`mantri`; template pengingat menggunakan `nama`, `tanggal jatuh tempo`,
`mantri`. Restart aplikasi setelah environment diubah. Uji dahulu ke nomor staf
yang sudah memberi persetujuan sebelum mengirim ke nasabah.
