"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTokoStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Product | null;
}

const emptyForm = {
  nama: "",
  kategori: "",
  harga: "",
  stok: "",
  gambar: "",
  deskripsi: "",
};

export function ProductForm({ open, onClose, editing }: Props) {
  const products = useTokoStore((s) => s.products);
  const addProduct = useTokoStore((s) => s.addProduct);
  const updateProduct = useTokoStore((s) => s.updateProduct);

  const [form, setForm] = useState(() =>
    editing
      ? {
          nama: editing.nama,
          kategori: editing.kategori,
          harga: String(editing.harga),
          stok: String(editing.stok),
          gambar: editing.gambar,
          deskripsi: editing.deskripsi,
        }
      : emptyForm
  );

  const kategoriList = Array.from(new Set(products.map((p) => p.kategori)));

  const handleSubmit = () => {
    const nama = form.nama.trim();
    const kategori = form.kategori.trim() || "Umum";
    const harga = Number(form.harga);
    const stok = Math.max(0, Math.floor(Number(form.stok)));

    if (!nama) {
      toast.error("Nama produk wajib diisi");
      return;
    }
    if (!form.harga || harga <= 0) {
      toast.error("Harga harus lebih dari 0");
      return;
    }
    if (form.stok === "" || isNaN(stok)) {
      toast.error("Isi jumlah stok barang");
      return;
    }

    if (editing) {
      updateProduct(editing.id, {
        nama,
        kategori,
        harga,
        stok,
        gambar: form.gambar.trim(),
        deskripsi: form.deskripsi.trim(),
      });
      toast.success(`Produk "${nama}" diperbarui`);
    } else {
      addProduct({
        nama,
        kategori,
        harga,
        stok,
        gambar: form.gambar.trim(),
        deskripsi: form.deskripsi.trim(),
      });
      toast.success(`Produk "${nama}" ditambahkan`);
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] max-w-[430px] overflow-y-auto rounded-t-3xl p-0"
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 pb-3 pt-5 backdrop-blur">
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-base font-bold text-slate-800">
              {editing ? "Edit Produk" : "Tambah Produk Baru"}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              {editing
                ? "Perbarui informasi, harga, atau stok produk."
                : "Lengkapi detail barang yang akan dijual."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-4 p-5 pb-8">
          <div>
            <label htmlFor="pf-nama" className="mb-1 block text-xs font-semibold text-slate-500">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              id="pf-nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="cth. Kaos Polos Cotton"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="pf-kategori" className="mb-1 block text-xs font-semibold text-slate-500">
              Jenis / Kategori
            </label>
            <input
              id="pf-kategori"
              list="pf-kategori-list"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              placeholder="cth. Elektronik, Fashion..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            <datalist id="pf-kategori-list">
              {kategoriList.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pf-harga" className="mb-1 block text-xs font-semibold text-slate-500">
                Harga (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                id="pf-harga"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.harga}
                onChange={(e) => setForm({ ...form, harga: e.target.value })}
                placeholder="65000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="pf-stok" className="mb-1 block text-xs font-semibold text-slate-500">
                Jumlah Stok <span className="text-rose-500">*</span>
              </label>
              <input
                id="pf-stok"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.stok}
                onChange={(e) => setForm({ ...form, stok: e.target.value })}
                placeholder="24"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pf-gambar" className="mb-1 block text-xs font-semibold text-slate-500">
              URL Foto Produk (opsional)
            </label>
            <input
              id="pf-gambar"
              value={form.gambar}
              onChange={(e) => setForm({ ...form, gambar: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="pf-deskripsi" className="mb-1 block text-xs font-semibold text-slate-500">
              Deskripsi (opsional)
            </label>
            <textarea
              id="pf-deskripsi"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Jelaskan keunggulan produk..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="flex-[2] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.98]"
            >
              {editing ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
