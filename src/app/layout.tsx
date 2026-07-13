import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitor Kredit Mantri",
  description: "Dasbor frontend untuk monitoring kualitas kredit dan kinerja mantri.",
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
