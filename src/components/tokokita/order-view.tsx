"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ClipboardList,
  User,
  Phone,
  NotebookPen,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTokoStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { METODE_LABEL } from "@/lib/types";
import type { MetodeBayar } from "@/lib/types";
import { ProductImage } from "./product-image";
import type { Tab } from "./bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const METODE_OPTIONS: MetodeBayar[] = ["tunai", "transfer", "qris"];

export function OrderView({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const products = useTokoStore((s) => s.products);
  const draft = useTokoStore((s) => s.draft);
  const addToDraft = useTokoStore((s) => s.addToDraft);
  const setDraftQty = useTokoStore((s) => s.setDraftQty);
  const removeDraft = useTokoStore((s) => s.removeDraft);
  const createPO = useTokoStore((s) => s.createPO);

  const [customer, setCustomer] = useState("");
  const [telepon, setTelepon] = useState("");
  const [catatan, setCatatan] = useState("");
  const [metode, setMetode] = useState<MetodeBayar>("tunai");
  const [query, setQuery] = useState("");
  const [savedOrder, setSavedOrder] = useState<string | null>(null);

  const draftItems = useMemo(
    () =>
      draft
        .map((d) => {
          const p = products.find((pr) => pr.id === d.produkId);
          return p ? { ...d, product: p } : null;
        })
        .filter((x): x is { produkId: string; qty: number; product: typeof products[0] } => !!x),
    [draft, products]
  );

  const total = draftItems.reduce((s, it) => s + it.product.harga * it.qty, 0);
  const totalQty = draftItems.reduce((s, it) => s + it.qty, 0);

  const pickerProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => !q || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q)
    );
  }, [products, query]);

  const handleSave = () => {
    if (!customer.trim()) {
      toast.error("Isi nama customer terlebih dahulu");
      return;
    }
    if (draftItems.length === 0) {
      toast.error("Tambahkan minimal satu produk ke PO");
      return;
    }
    const order = createPO({ customer, telepon, catatan, metodeBayar: metode });
    if (!order) {
      toast.error("Gagal membuat PO, periksa ketersediaan stok");
      return;
    }
    setSavedOrder(order.id);
    setCustomer("");
    setTelepon("");
    setCatatan("");
    setMetode("tunai");
  };

  return (
    <div className="pb-52">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-5 backdrop-blur">
        <h1 className="text-lg font-bold text-slate-800">Buat PO Customer</h1>
        <p className="text-xs text-slate-400">
          Catat pemesanan barang oleh customer
        </p>
      </header>

      <div className="space-y-5 px-4 pt-4">
        {/* Data customer */}
        <section
          aria-label="Data customer"
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            <User className="h-4 w-4 text-emerald-600" /> Data Customer
          </h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="po-customer" className="mb-1 block text-xs font-semibold text-slate-500">
                Nama Customer <span className="text-rose-500">*</span>
              </label>
              <input
                id="po-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="cth. Budi Santoso"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="po-telepon" className="mb-1 block text-xs font-semibold text-slate-500">
                No. HP (opsional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="po-telepon"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="cth. 0812-3456-7890"
                  inputMode="tel"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Metode pembayaran">
                {METODE_OPTIONS.map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={metode === m}
                    onClick={() => setMetode(m)}
                    className={cn(
                      "rounded-xl border py-2 text-xs font-bold transition-colors",
                      metode === m
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500"
                    )}
                  >
                    {METODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="po-catatan" className="mb-1 block text-xs font-semibold text-slate-500">
                Catatan (opsional)
              </label>
              <div className="relative">
                <NotebookPen className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  id="po-catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  placeholder="cth. warna, ukuran, jadwal pengiriman..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Item PO */}
        <section aria-label="Item purchase order">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            <ClipboardList className="h-4 w-4 text-emerald-600" /> Item Pesanan
          </h2>
          {draftItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-emerald-300" />
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                Belum ada barang dipilih
              </p>
              <p className="mt-0.5 text-xs text-emerald-600/70">
                Pilih barang dari daftar di bawah
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {draftItems.map((it) => (
                <li
                  key={it.produkId}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <ProductImage
                    src={it.product.gambar}
                    alt={it.product.nama}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {it.product.nama}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatRupiah(it.product.harga)} × {it.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDraftQty(it.produkId, it.qty - 1)}
                      aria-label={`Kurangi ${it.product.nama}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 active:bg-slate-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-700">
                      {it.qty}
                    </span>
                    <button
                      onClick={() => setDraftQty(it.produkId, it.qty + 1)}
                      disabled={it.qty >= it.product.stok}
                      aria-label={`Tambah ${it.product.nama}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 active:bg-emerald-100 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeDraft(it.produkId)}
                      aria-label={`Hapus ${it.product.nama}`}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-rose-400 active:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pilih produk */}
        <section aria-label="Daftar produk">
          <h2 className="mb-3 text-sm font-bold text-slate-700">Pilih Barang</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari barang atau jenis..."
              aria-label="Cari barang untuk PO"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <ul className="mt-3 space-y-2">
            {pickerProducts.map((p) => {
              const inDraft = draft.find((d) => d.produkId === p.id);
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-white p-2.5 shadow-sm",
                    inDraft ? "border-emerald-300 bg-emerald-50/40" : "border-slate-100"
                  )}
                >
                  <ProductImage
                    src={p.gambar}
                    alt={p.nama}
                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{p.nama}</p>
                    <p className="text-xs font-bold text-emerald-600">
                      {formatRupiah(p.harga)}
                      <span
                        className={cn(
                          "ml-2 font-medium",
                          p.stok === 0 ? "text-rose-400" : "text-slate-400"
                        )}
                      >
                        {p.stok === 0 ? "Habis" : `Stok ${p.stok}`}
                      </span>
                    </p>
                  </div>
                  {p.stok === 0 ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-400">
                      Kosong
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const ok = addToDraft(p.id);
                        if (ok) toast.success(`${p.nama} ditambahkan`);
                        else toast.warning("Jumlah melebihi stok tersedia");
                      }}
                      aria-label={`Tambah ${p.nama} ke PO`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 active:scale-95"
                    >
                      <Plus className="h-4 w-4" strokeWidth={3} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Ringkasan sticky */}
      <div className="fixed bottom-[72px] left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4">
        <div className="rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {totalQty} barang • {draftItems.length} jenis
            </span>
            <span className="text-lg font-bold text-slate-800">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={handleSave}
            className="mt-3 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.98]"
          >
            Simpan PO Customer
          </button>
        </div>
      </div>

      {/* Dialog sukses */}
      <Dialog open={!!savedOrder} onOpenChange={(open) => !open && setSavedOrder(null)}>
        <DialogContent className="max-w-[340px] rounded-3xl text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-800">
              PO Berhasil Disimpan!
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Nomor pesanan{" "}
              <span className="font-mono font-bold text-emerald-700">{savedOrder}</span>{" "}
              sudah dicatat dan stok barang otomatis dikurangi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSavedOrder(null)}
              className="rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600"
            >
              Buat PO Lain
            </button>
            <button
              onClick={() => {
                setSavedOrder(null);
                onNavigate("pesanan");
              }}
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white"
            >
              Lihat Pesanan
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
