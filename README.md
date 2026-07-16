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
