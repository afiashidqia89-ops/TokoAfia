"use client";

import { Home, LayoutGrid, Plus, ReceiptText, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "beranda" | "katalog" | "po" | "pesanan" | "produk";

const ITEMS: Array<{
  key: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "katalog", label: "Katalog", icon: LayoutGrid },
  { key: "po", label: "Buat PO", icon: Plus },
  { key: "pesanan", label: "Pesanan", icon: ReceiptText },
  { key: "produk", label: "Produk", icon: Boxes },
];

export function BottomNav({
  active,
  onChange,
  draftCount,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  draftCount: number;
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="grid h-16 grid-cols-5 items-end px-1">
        {ITEMS.map((item) => {
          const isCenter = item.key === "po";
          const isActive = active === item.key;

          if (isCenter) {
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                aria-label="Buat Purchase Order"
                className="relative flex flex-col items-center justify-end"
              >
                <span
                  className={cn(
                    "absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/40 transition-transform active:scale-95",
                    isActive && "ring-4 ring-emerald-100"
                  )}
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </span>
                {draftCount > 0 && (
                  <span className="absolute -top-1 right-1/2 translate-x-6 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {draftCount}
                  </span>
                )}
                <span
                  className={cn(
                    "pb-1.5 text-[10px] font-semibold",
                    isActive ? "text-emerald-600" : "text-slate-400"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              aria-current={isActive ? "page" : undefined}
              className="flex h-full flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-emerald-600" : "text-slate-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  isActive ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
