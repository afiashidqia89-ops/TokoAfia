import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TokoKita — Aplikasi Penjualan & Pencatatan PO",
  description:
    "Aplikasi penjual untuk mengelola barang tersedia, harga, jenis produk, dan mencatat pesanan (PO) dari customer dalam satu tempat.",
  keywords: ["TokoKita", "kasir", "purchase order", "penjualan", "toko", "PO"],
  applicationName: "TokoKita",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "TokoKita — Aplikasi Penjualan & Pencatatan PO",
    description:
      "Kelola barang, harga, jenis produk, dan pesanan customer (PO) dari satu aplikasi.",
    siteName: "TokoKita",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${jakarta.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
