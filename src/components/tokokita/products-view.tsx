"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, Boxes } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTokoStore } from "@/lib/store";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { BATAS_STOK_MENIPIS } from "@/lib/types";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { ProductForm } from "./product-form";
import { cn } from "@/lib/utils";

export function ProductsView() {
  const products = useTokoStore((s) => s.products);
  const deleteProduct = useTokoStore((s) => s.deleteProduct);

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => !q || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q)
    );
  }, [products, query]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Kelola Produk</h1>
            <p className="text-xs text-slate-400">
              {products.length} produk •{" "}
              {products.reduce((s, p) => s + p.stok, 0)} unit stok total
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            Tambah
          </button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk atau jenis..."
            aria-label="Cari produk untuk dikelola"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </header>

      <main className="space-y-2.5 px-4 pt-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
          >
            <ProductImage
              src={p.gambar}
              alt={p.nama}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-700">{p.nama}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                {p.kategori}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800">{formatRupiah(p.harga)}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    p.stok === 0
                      ? "bg-rose-100 text-rose-600"
                      : p.stok <= BATAS_STOK_MENIPIS
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-50 text-emerald-600"
                  )}
                >
                  {p.stok === 0 ? "Habis" : `Stok ${p.stok}`}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                onClick={() => openEdit(p)}
                aria-label={`Edit ${p.nama}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 active:bg-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeleting(p)}
                aria-label={`Hapus ${p.nama}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-500 active:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Boxes className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">Tidak ada produk ditemukan.</p>
          </div>
        )}
      </main>

      <ProductForm
        key={`${formOpen ? "open" : "closed"}-${editing?.id ?? "new"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              &ldquo;{deleting?.nama}&rdquo; akan dihapus dari katalog. Riwayat PO yang
              sudah tercatat tidak berubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1 rounded-xl border-slate-200">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  deleteProduct(deleting.id);
                  toast.success(`Produk "${deleting.nama}" dihapus`);
                }
                setDeleting(null);
              }}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
