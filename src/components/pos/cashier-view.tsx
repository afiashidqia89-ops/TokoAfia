'use client'

import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, recordSale } from '@/lib/db'
import { useCashierCart } from '@/store/cart'
import { formatRupiah, startOfDay } from '@/lib/format'
import { EmptyState, stockStatus } from './shared'
import type { Item, Transaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  BadgeCheck,
  Banknote,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CashierView({ onGoItems }: { onGoItems: () => void }) {
  const items = useLiveQuery(() => db.items.toArray(), [], undefined)
  const todayTxCount = useLiveQuery(
    () => db.transactions.where('createdAt').above(startOfDay(new Date())).count(),
    [],
    undefined
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const lines = useCashierCart((s) => s.lines)
  const add = useCashierCart((s) => s.add)
  const setQty = useCashierCart((s) => s.setQty)
  const remove = useCashierCart((s) => s.remove)
  const clear = useCashierCart((s) => s.clear)

  const catRows = useLiveQuery(() => db.categories.orderBy('name').toArray(), [], undefined)
  const categories = useMemo(() => {
    const set = new Set<string>((catRows ?? []).map((c) => c.name))
    for (const i of items ?? []) {
      if (i.category) set.add(i.category)
    }
    return ['Semua', ...Array.from(set).sort()]
  }, [catRows, items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (items ?? []).filter(
      (i) =>
        (category === 'Semua' || i.category === category) &&
        (q === '' || i.name.toLowerCase().includes(q))
    )
  }, [items, search, category])

  const itemById = useMemo(() => {
    const map = new Map<number, Item>()
    for (const i of items ?? []) map.set(i.id!, i)
    return map
  }, [items])

  const cartRows: Array<{ line: { itemId: number; qty: number }; item: Item }> = []
  for (const l of lines) {
    const item = itemById.get(l.itemId)
    if (item) cartRows.push({ line: l, item })
  }
  const cartTotal = cartRows.reduce((s, r) => s + r.line.qty * r.item.sellPrice, 0)
  const cartCount = cartRows.reduce((s, r) => s + r.line.qty, 0)

  if (items !== undefined && items.length === 0) {
    return (
      <EmptyState
        title="Belum ada barang"
        description="Tambahkan barang dahulu di tab Barang, lalu Anda bisa langsung menjual dari sini."
        action={{ label: 'Ke Tab Barang', onClick: onGoItems }}
        className="mt-8"
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Kasir</h1>
          <p className="text-xs text-muted-foreground">
            Ketuk barang untuk memasukkan ke keranjang • {todayTxCount ?? '…'} transaksi hari ini
          </p>
        </div>
      </div>

      {/* Pencarian */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama barang…"
          className="rounded-full pl-9"
          inputMode="search"
        />
      </div>

      {/* Filter kategori */}
      <div className="tap-target -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              category === c
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-accent'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Daftar barang */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Tidak ada barang yang cocok dengan pencarian.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 pb-28">
          {filtered.map((item) => {
            const st = stockStatus(item)
            const inCart = lines.find((l) => l.itemId === item.id)?.qty ?? 0
            return (
              <button
                key={item.id}
                disabled={item.stock <= 0}
                onClick={() => {
                  const ok = add(item.id!, item.stock)
                  if (!ok && item.stock > 0) toast(`${item.name} sudah maksimal di keranjang`)
                }}
                className={cn(
                  'tap-target relative rounded-2xl border bg-card p-3 text-left transition-all active:scale-[0.97]',
                  item.stock <= 0
                    ? 'opacity-55'
                    : 'hover:border-primary/50 hover:shadow-md hover:shadow-orange-500/5',
                  inCart > 0 && 'border-primary/60 ring-1 ring-primary/30'
                )}
              >
                {inCart > 0 ? (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {inCart}
                  </span>
                ) : null}
                <p className="line-clamp-2 min-h-10 text-sm font-medium leading-snug">{item.name}</p>
                <p className="mt-1 text-[15px] font-bold text-primary">{formatRupiah(item.sellPrice)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {st.level === 'out' ? (
                    <span className="font-medium text-red-600">Stok habis</span>
                  ) : (
                    <>stok {item.stock} {item.unit}</>
                  )}
                </p>
              </button>
            )
          })}
        </div>
      )}

      {/* Bar keranjang melayang */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-[62px] z-30 px-4" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-xl shadow-orange-500/30">
            <div className="relative">
              <ShoppingCart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[15px] font-bold">{formatRupiah(cartTotal)}</p>
              <p className="text-[11px] text-primary-foreground/80">{cartRows.length} jenis barang</p>
            </div>
            <Button
              variant="secondary"
              className="h-9 rounded-full bg-white font-bold text-primary hover:bg-white/90"
              onClick={() => setCheckoutOpen(true)}
            >
              Bayar
            </Button>
          </div>
        </div>
      )}

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        rows={cartRows}
        total={cartTotal}
        setQty={setQty}
        remove={remove}
        onDone={() => clear()}
      />
    </div>
  )
}

interface CartRow {
  line: { itemId: number; qty: number }
  item: Item
}

function CheckoutDialog({
  open,
  onOpenChange,
  rows,
  total,
  setQty,
  remove,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rows: CartRow[]
  total: number
  setQty: (itemId: number, qty: number, maxStock: number) => void
  remove: (itemId: number) => void
  onDone: () => void
}) {
  const [pay, setPay] = useState('')
  const [customer, setCustomer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<Transaction | null>(null)

  const payNum = Number(pay) || 0
  const change = payNum - total
  const quickAmounts = useMemo(() => {
    const set = new Set<number>([total])
    set.add(Math.ceil(total / 10000) * 10000)
    set.add(50000)
    set.add(100000)
    set.add(200000)
    return Array.from(set)
      .filter((v) => v >= total)
      .sort((a, b) => a - b)
      .slice(0, 4)
  }, [total])

  function resetForm() {
    setPay('')
    setCustomer('')
    setSuccess(null)
  }

  async function submit() {
    setSubmitting(true)
    const res = await recordSale(
      rows.map((r) => ({ itemId: r.line.itemId, qty: r.line.qty })),
      customer,
      payNum
    )
    setSubmitting(false)
    if (!res.ok) {
      toast.error(res.error ?? 'Gagal menyimpan transaksi')
      return
    }
    setSuccess(res.transaction!)
    onDone()
    toast.success(`Transaksi ${res.transaction!.code} tersimpan`)
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 rounded-3xl p-0 sm:rounded-3xl">
        {success ? (
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
                <BadgeCheck className="size-8 text-emerald-600" />
              </div>
              <p className="mt-3 text-lg font-bold">Penjualan berhasil!</p>
              <p className="text-sm text-muted-foreground">
                Kode: <span className="font-mono font-medium text-foreground">{success.code}</span>
              </p>
            </div>
            <div className="mt-4 rounded-2xl border bg-accent/40 p-3 text-sm">
              <ul className="space-y-1">
                {success.lines.map((l) => (
                  <li key={l.itemId} className="flex justify-between gap-2">
                    <span className="truncate">
                      {l.name} <span className="text-muted-foreground">×{l.qty}</span>
                    </span>
                    <span className="shrink-0 font-medium">{formatRupiah(l.qty * l.price)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatRupiah(success.total)}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Bayar</span>
                <span>{formatRupiah(success.payAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Kembalian</span>
                <span>{formatRupiah(success.changeAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between font-medium text-emerald-600">
                <span>Untung transaksi ini</span>
                <span>{formatRupiah(success.profit)}</span>
              </div>
            </div>
            <Button className="mt-4 w-full rounded-full" size="lg" onClick={() => handleClose(false)}>
              Selesai
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="rounded-t-3xl border-b bg-accent/40 px-4 py-3">
              <DialogTitle className="text-left">Ringkasan Penjualan</DialogTitle>
              <DialogDescription className="text-left text-xs">
                Periksa jumlah barang, lalu isi uang yang dibayar pelanggan.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[38vh] px-4 py-2 thin-scrollbar">
              <ul className="divide-y">
                {rows.map((r) => (
                  <li key={r.line.itemId} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(r.item.sellPrice)} / {r.item.unit} • stok {r.item.stock}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7 rounded-full"
                        onClick={() => r.line.qty <= 1 ? remove(r.line.itemId) : setQty(r.line.itemId, r.line.qty - 1, r.item.stock)}
                        aria-label="Kurangi"
                      >
                        {r.line.qty <= 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{r.line.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7 rounded-full"
                        disabled={r.line.qty >= r.item.stock}
                        onClick={() => setQty(r.line.itemId, r.line.qty + 1, r.item.stock)}
                        aria-label="Tambah"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold">
                      {formatRupiah(r.line.qty * r.item.sellPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <div className="space-y-3 border-t px-4 py-3">
              <div className="flex items-center justify-between text-[15px]">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold text-primary">{formatRupiah(total)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((v) => (
                  <button
                    key={v}
                    onClick={() => setPay(String(v))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      payNum === v
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {v === total ? 'Uang pas' : formatRupiah(v)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="pay" className="text-xs font-medium text-muted-foreground">
                    Uang dibayar
                  </label>
                  <Input
                    id="pay"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={pay}
                    onChange={(e) => setPay(e.target.value)}
                    placeholder="0"
                    className="font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Kembalian</label>
                  <div
                    className={cn(
                      'flex h-9 items-center rounded-md border px-3 text-sm font-bold',
                      payNum === 0
                        ? 'text-muted-foreground'
                        : change < 0
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    )}
                  >
                    {payNum === 0
                      ? '—'
                      : change < 0
                        ? `Kurang ${formatRupiah(-change)}`
                        : formatRupiah(change)}
                  </div>
                </div>
              </div>

              <Input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nama pembeli (opsional)"
                maxLength={40}
              />

              <Button
                size="lg"
                className="w-full rounded-full text-[15px] font-bold"
                disabled={submitting || payNum < total}
                onClick={submit}
              >
                <Banknote className="size-5" />
                {submitting ? 'Menyimpan…' : `Bayar ${formatRupiah(total)}`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
