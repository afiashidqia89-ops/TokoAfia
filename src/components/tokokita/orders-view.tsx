"use client";

import { useMemo, useState } from "react";
import {
  ReceiptText,
  User,
  Phone,
  NotebookPen,
  Banknote,
  CreditCard,
  QrCode,
  ArrowRight,
  Ban,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import { METODE_LABEL, STATUS_LABEL } from "@/lib/types";
import type { MetodeBayar, PurchaseOrder, StatusPO } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FilterStatus = "semua" | StatusPO;

const FILTERS: Array<{ key: FilterStatus; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "menunggu", label: "Menunggu" },
  { key: "diproses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
  { key: "dibatalkan", label: "Dibatalkan" },
];

const METODE_ICON: Record<MetodeBayar, React.ComponentType<{ className?: string }>> = {
  tunai: Banknote,
  transfer: CreditCard,
  qris: QrCode,
};

export function OrdersView() {
  const orders = useTokoStore((s) => s.orders);
  const setOrderStatus = useTokoStore((s) => s.setOrderStatus);
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const filtered = useMemo(
    () => orders.filter((o) => filter === "semua" || o.status === filter),
    [orders, filter]
  );

  const hitung = (f: FilterStatus) =>
    f === "semua" ? orders.length : orders.filter((o) => o.status === f).length;

  const advance = (o: PurchaseOrder) => {
    if (o.status === "menunggu") {
      setOrderStatus(o.id, "diproses");
      toast.success("PO diproses — barang disiapkan");
      setSelected({ ...o, status: "diproses" });
    } else if (o.status === "diproses") {
      setOrderStatus(o.id, "selesai");
      toast.success("PO selesai — pesanan diterima customer");
      setSelected({ ...o, status: "selesai" });
    }
  };

  const cancel = () => {
    if (!selected) return;
    setOrderStatus(selected.id, "dibatalkan");
    toast.info("PO dibatalkan — stok dikembalikan");
    setSelected({ ...selected, status: "dibatalkan" });
    setConfirmCancel(false);
  };

  const nextLabel = (s: StatusPO) =>
    s === "menunggu" ? "Proses Pesanan" : s === "diproses" ? "Tandai Selesai" : null;

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-5 backdrop-blur">
        <h1 className="text-lg font-bold text-slate-800">Riwayat PO</h1>
        <p className="text-xs text-slate-400">{orders.length} pesanan tercatat</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === f.key
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "border border-slate-200 bg-white text-slate-500"
              )}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{hitung(f.key)}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-2.5 px-4 pt-4">
        {filtered.map((o) => {
          const MetodeIcon = METODE_ICON[o.metodeBayar];
          return (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500">{o.id}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700">{o.customer}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MetodeIcon className="h-3.5 w-3.5" />
                    {METODE_LABEL[o.metodeBayar]} • {formatTanggalWaktu(o.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{formatRupiah(o.total)}</p>
                  <p className="text-[11px] text-slate-400">
                    {o.items.reduce((s, it) => s + it.qty, 0)} barang
                  </p>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">
              Belum ada pesanan dengan status ini.
            </p>
          </div>
        )}
      </main>

      {/* Detail PO */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <SheetContent
            side="bottom"
            className="mx-auto max-h-[88vh] max-w-[430px] overflow-y-auto rounded-t-3xl p-0"
          >
            <div className="sticky top-0 border-b border-slate-100 bg-white/95 px-5 pb-3 pt-5 backdrop-blur">
              <SheetHeader className="p-0 text-left">
                <div className="flex items-center justify-between">
                  <SheetTitle className="font-mono text-base font-bold text-slate-800">
                    {selected.id}
                  </SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <SheetDescription className="text-xs text-slate-400">
                  Dibuat {formatTanggalWaktu(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="space-y-4 p-5 pb-8">
              {/* Info customer */}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <User className="h-3.5 w-3.5" /> Customer
                </p>
                <p className="text-sm font-bold text-slate-700">{selected.customer}</p>
                {selected.telepon && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="h-3 w-3" /> {selected.telepon}
                  </p>
                )}
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  {(() => {
                    const MetodeIcon = METODE_ICON[selected.metodeBayar];
                    return <MetodeIcon className="h-3 w-3" />;
                  })()}
                  Bayar via {METODE_LABEL[selected.metodeBayar]}
                </p>
                {selected.catatan && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-700">
                    <NotebookPen className="mt-0.5 h-3 w-3 shrink-0" />
                    {selected.catatan}
                  </p>
                )}
              </div>

              {/* Item */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Rincian Barang
                </p>
                <ul className="space-y-2">
                  {selected.items.map((it) => (
                    <li
                      key={it.produkId}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{it.nama}</p>
                        <p className="text-xs text-slate-400">
                          {it.qty} × {formatRupiah(it.harga)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {formatRupiah(it.qty * it.harga)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-semibold text-emerald-700">Total PO</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {formatRupiah(selected.total)}
                  </span>
                </div>
              </div>

              {/* Aksi */}
              {selected.status !== "selesai" && selected.status !== "dibatalkan" && (
                <div className="space-y-2">
                  {nextLabel(selected.status) && (
                    <button
                      onClick={() => advance(selected)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.98]"
                    >
                      {selected.status === "diproses" && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {selected.status === "menunggu" && <Loader2 className="h-4 w-4" />}
                      {nextLabel(selected.status)}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-600"
                  >
                    <Ban className="h-4 w-4" />
                    Batalkan PO
                  </button>
                </div>
              )}
              {(selected.status === "selesai" || selected.status === "dibatalkan") && (
                <p className="rounded-2xl bg-slate-50 p-3.5 text-center text-xs text-slate-400">
                  Pesanan ini sudah {STATUS_LABEL[selected.status].toLowerCase()} dan tidak
                  dapat diubah lagi.
                </p>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Konfirmasi batal */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="max-w-[340px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Batalkan PO ini?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Stok barang yang dipesan akan dikembalikan ke katalog. Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1 rounded-xl border-slate-200">
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={cancel}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700"
            >
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
