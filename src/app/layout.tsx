import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Path dasar saat di-host di subfolder (GitHub Pages), mis. /lakuku
// Diisi otomatis oleh workflow GitHub Actions lewat NEXT_PUBLIC_BASE_PATH.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "LakuKu — Manajemen Penjualan",
  description:
    "Aplikasi manajemen penjualan untuk usaha kecil: catat modal, keuntungan, item barang, dan sisa stok. Data tersimpan aman di HP, bisa dipakai offline.",
  applicationName: "LakuKu",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LakuKu",
  },
  keywords: ["kasir", "manajemen penjualan", "modal", "keuntungan", "stok", "UMKM"],
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
