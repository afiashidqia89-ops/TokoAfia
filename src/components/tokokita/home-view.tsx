"use client";

import { useMemo } from "react";
import {
  Package,
  AlertTriangle,
  ClipboardList,
  Wallet,
  Plus,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { useTokoStore } from "@/lib/store";
import { formatRupiah, formatTanggalWaktu, isSameDay } from "@/lib/format";
import { BATAS_STOK_MENIPIS } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import type { Tab } from "./bottom-nav";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "violet" | "sky";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-teal-50 text-teal-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
      <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-lg font-bold leading-tight text-slate-800">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}

export function HomeView({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const products = useTokoStore((s) => s.products);
  const orders = useTokoStore((s) => s.orders);

  const stats = useMemo(() => {
    const today = new Date();
    const poHariIni = orders.filter(
      (o) => isSameDay(new Date(o.createdAt), today) && o.status !== "dibatalkan"
    ).length;
    const stokMenipis = products.filter(
      (p) => p.stok > 0 && p.stok <= BATAS_STOK_MENIPIS
    ).length;
    const pendapatan = orders
      .filter((o) => o.status === "selesai")
      .reduce((sum, o) => sum + o.total, 0);
    return { totalProduk: products.length, poHariIni, stokMenipis, pendapatan };
  }, [products, orders]);

  const produkMenipis = useMemo(
    () =>
      products
        .filter((p) => p.stok <= BATAS_STOK_MENIPIS)
        .sort((a, b) => a.stok - b.stok)
        .slice(0, 4),
    [products]
  );

  const poTerbaru = useMemo(() => orders.slice(0, 3), [orders]);

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-600/25">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-14 right-10 h-32 w-32 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-100">Panel Penjual</p>
            <h1 className="mt-1 text-xl font-bold">Halo, Admin TokoKita</h1>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-emerald-50/90">
              Catat pesanan customer dan pantau stok barang dari satu tempat.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
        <button
          onClick={() => onNavigate("po")}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Buat PO Baru
        </button>
      </section>

      {/* Statistik */}
      <section aria-label="Ringkasan statistik">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Package}
            label="Barang Tersedia"
            value={String(stats.totalProduk)}
            tone="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="Stok Menipis"
            value={String(stats.stokMenipis)}
            tone="amber"
          />
          <StatCard
            icon={ClipboardList}
            label="PO Hari Ini"
            value={String(stats.poHariIni)}
            tone="violet"
          />
          <StatCard
            icon={Wallet}
            label="Pendapatan Selesai"
            value={formatRupiah(stats.pendapatan)}
            tone="sky"
          />
        </div>
      </section>

      {/* Stok menipis */}
      <section aria-label="Produk dengan stok menipis">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Perlu Restock</h2>
          <button
            onClick={() => onNavigate("produk")}
            className="inline-flex items-center text-xs font-semibold text-emerald-600"
          >
            Kelola <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {produkMenipis.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
            Semua stok aman, tidak ada yang perlu direstock.
          </p>
        ) : (
          <ul className="space-y-2">
            {produkMenipis.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    p.stok === 0 ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">{p.nama}</p>
                  <p className="text-[11px] text-slate-400">{p.kategori}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    p.stok === 0 ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {p.stok === 0 ? "Habis" : `Sisa ${p.stok}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* PO terbaru */}
      <section aria-label="Pesanan terbaru">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Pesanan Terbaru</h2>
          <button
            onClick={() => onNavigate("pesanan")}
            className="inline-flex items-center text-xs font-semibold text-emerald-600"
          >
            Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <ul className="space-y-2">
          {poTerbaru.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => onNavigate("pesanan")}
                className="w-full rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition-transform active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500">{o.id}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{o.customer}</p>
                    <p className="text-[11px] text-slate-400">
                      {o.items.length} produk • {formatTanggalWaktu(o.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.total)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
