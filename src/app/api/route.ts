import { NextResponse } from "next/server";

// Route ini tidak dipakai aplikasi (hanya health-check).
// "force-static" agar kompatibel dengan output: "export" (build APK Capacitor).
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}
