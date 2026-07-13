import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRI Tool",
  description: "Dashboard monitoring pinjaman dan operasional BRIMEN.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
