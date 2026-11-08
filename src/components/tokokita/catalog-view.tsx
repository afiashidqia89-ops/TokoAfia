"use client";

import { useMemo, useState } from "react";
import { Search, Plus, ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTokoStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { BATAS_STOK_MENIPIS } from "@/lib/types";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import type { Tab } from "./bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function StokBadge({ stok }: { stok: number }) {
  if (stok === 0)
    return (
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
        Habis
      </span>
    );
  if (stok <= BATAS_STOK_MENIPIS)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        Sisa {stok}
      </span>
    );
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
      Stok {stok}
    </span>
  );
}

export function CatalogView({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const products = useTokoStore((s) => s.products);
  const addToDraft = useTokoStore((s) => s.addToDraft);
  const [query, setQuery] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [selected, setSelected] = useState<Product | null>(null);

  const kategoriList = useMemo(
    () => ["Semua", ...Array.from(new Set(products.map((p) => p.kategori)))],
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchKategori = kategori === "Semua" || p.kategori === kategori;
      const matchQuery = !q || p.nama.toLowerCase().includes(q);
      return matchKategori && matchQuery;
    });
  }, [products, query, kategori]);

  const handleAddToPO = (p: Product) => {
    const ok = addToDraft(p.id);
    if (ok) {
      toast.success(`${p.nama} ditambahkan ke PO`);
      setSelected(null);
      onNavigate("po");
    } else {
      toast.error("Stok tidak tersedia");
    }
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Katalog Barang</h1>
            <p className="text-xs text-slate-400">
              {products.length} produk tersedia
            </p>
          </div>
          <button
            onClick={() => onNavigate("produk")}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
          >
            + Produk
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama barang..."
            aria-label="Cari produk"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {/* Filter kategori */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {kategoriList.map((k) => (
            <button
              key={k}
              onClick={() => setKategori(k)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                kategori === k
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "border border-slate-200 bg-white text-slate-500"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </header>

      {/* Grid produk */}
      <main className="grid grid-cols-2 gap-3 px-4 pt-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-50">
              <ProductImage
                src={p.gambar}
                alt={p.nama}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute left-2 top-2">
                <StokBadge stok={p.stok} />
              </div>
              {p.stok === 0 && (
                <div className="absolute inset-0 bg-white/60" aria-hidden="true" />
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                {p.kategori}
              </p>
              <p className="mt-0.5 line-clamp-2 min-h-[2.1em] text-[13px] font-semibold leading-snug text-slate-700">
                {p.nama}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {formatRupiah(p.harga)}
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center">
            <Search className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">
              Tidak ada produk yang cocok dengan pencarian.
            </p>
          </div>
        )}
      </main>

      {/* Detail produk */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <SheetContent side="bottom" className="max-w-[430px] rounded-t-3xl p-0 mx-auto">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
              <ProductImage
                src={selected.gambar}
                alt={selected.nama}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                  {selected.kategori}
                </span>
              </div>
            </div>
            <div className="max-h-[45vh] overflow-y-auto p-5">
              <SheetHeader className="p-0 text-left">
                <div className="flex items-start justify-between gap-3">
                  <SheetTitle className="text-lg font-bold text-slate-800">
                    {selected.nama}
                  </SheetTitle>
                  <StokBadge stok={selected.stok} />
                </div>
                <SheetDescription className="sr-only">
                  Detail produk {selected.nama}
                </SheetDescription>
              </SheetHeader>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {formatRupiah(selected.harga)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {selected.deskripsi || "Belum ada deskripsi untuk produk ini."}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-[11px] text-slate-400">Jenis</p>
                  <p className="text-sm font-bold text-slate-700">{selected.kategori}</p>
                </div>
                <div className="border-l border-slate-200">
                  <p className="text-[11px] text-slate-400">Barang Tersedia</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selected.stok > 0 ? `${selected.stok} unit` : "Habis"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAddToPO(selected)}
                disabled={selected.stok === 0}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
              >
                {selected.stok === 0 ? (
                  "Stok Habis"
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Tambah ke PO
                  </>
                )}
              </button>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
