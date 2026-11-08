import type { NextConfig } from "next";

// STATIC_EXPORT=true dipakai saat build APK (Capacitor) — hasil build berupa
// situs statis di folder "out" yang dibundel ke dalam aplikasi Android.
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      images: { unoptimized: true },
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    }
  : {
      output: "standalone",
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    };

export default nextConfig;
