# BRIToel Dashboard

Dashboard monitoring pinjaman dan operasional BRIMEN berbasis Next.js, Tailwind CSS, shadcn/ui, Drizzle ORM, SQLite, dan Better Auth.

## Menjalankan Lokal

1. Salin `.env.example` menjadi `.env.local` dan lengkapi nilai rahasia serta akun SuperAdmin.
2. Instal dependensi dengan `pnpm install`.
3. Siapkan database dengan `pnpm db:setup`.
4. Jalankan aplikasi dengan `pnpm dev`.
5. Buka `http://127.0.0.1:3000`.

## Perintah

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm build
pnpm start
```

Database SQLite, file upload, file environment, serta log server tidak disimpan dalam Git.
