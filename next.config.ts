import type { NextConfig } from "next";

// LakuKu — situs statis (PWA), siap di-deploy ke GitHub Pages / hosting statis.
//
// Deploy ke GitHub Pages (repo bernama mis. "lakuku"):
//   NEXT_PUBLIC_BASE_PATH=/lakuku npm run build   → hasil di folder out/
//   (workflow .github/workflows/deploy.yml sudah mengaturnya otomatis)
//
// Tanpa NEXT_PUBLIC_BASE_PATH → aplikasi dijalankan di root domain
// (mis. Vercel / Netlify / hosting sendiri).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // hasil build statis di folder out/ — tanpa server
  basePath: basePath || undefined,
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
