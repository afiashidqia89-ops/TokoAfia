'use client'

import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cancelTransaction, db } from '@/lib/db'
import {
  addDays,
  addMonths,
  formatDateTime,
  formatRupiah,
  formatRupiahShort,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '@/lib/format'
import type { Transaction } from '@/lib/types'
import { EmptyState } from './shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Banknote, History, TrendingUp, Trophy, XCircle } from 'lucide-react'

type PeriodKey = 'daily' | 'weekly' | 'monthly'

const PERIODS: Record<PeriodKey, { label: string; count: number; caption: string }> = {
  daily: { label: 'Harian', count: 14, caption: '14 hari terakhir' },
  weekly: { label: 'Mingguan', count: 8, caption: '8 minggu terakhir' },
  monthly: { label: 'Bulanan', count: 6, caption: '6 bulan terakhir' },
}

interface Bucket {
  label: string
  start: Date
  end: Date
}

function buildBuckets(period: PeriodKey, now: Date): Bucket[] {
  const cfg = PERIODS[period]
  const buckets: Bucket[] = []
  if (period === 'daily') {
    const fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
    for (let i = cfg.count - 1; i >= 0; i--) {
      const start = startOfDay(addDays(now, -i))
      buckets.push({ label: fmt.format(start), start, end: addDays(start, 1) })
    }
  } else if (period === 'weekly') {
    const fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
    for (let i = cfg.count - 1; i >= 0; i--) {
      const start = startOfWeek(addDays(now, -7 * i))
      buckets.push({ label: fmt.format(start), start, end: addDays(start, 7) })
    }
  } else {
    const fmt = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' })
    for (let i = cfg.count - 1; i >= 0; i--) {
      const start = startOfMonth(addMonths(now, -i))
      buckets.push({ label: fmt.format(start), start, end: addMonths(start, 1) })
    }
  }
  return buckets
}

export function ReportsView() {
  const [period, setPeriod] = useState<PeriodKey>('daily')
  const now = useMemo(() => new Date(), [])
  const buckets = useMemo(() => buildBuckets(period, now), [period, now])
  const windowStart = buckets[0].start

  const txs = useLiveQuery(
    () => db.transactions.where('createdAt').above(windowStart).toArray(),
    [windowStart],
    undefined
  )

  const rows = useMemo(() => {
    return buckets.map((b) => {
      const inBucket = (txs ?? []).filter((t) => t.createdAt >= b.start && t.createdAt < b.end)
      return {
        label: b.label,
        omzet: inBucket.reduce((s, t) => s + t.total, 0),
        untung: inBucket.reduce((s, t) => s + t.profit, 0),
      }
    })
  }, [buckets, txs])

  const totals = useMemo(() => {
    const list = txs ?? []
    const omzet = list.reduce((s, t) => s + t.total, 0)
    const untung = list.reduce((s, t) => s + t.profit, 0)
    const qty = list.reduce((s, t) => s + t.lines.reduce((q, l) => q + l.qty, 0), 0)
    return { omzet, untung, margin: omzet > 0 ? Math.round((untung / omzet) * 100) : 0, count: list.length, qty }
  }, [txs])

  const topItems = useMemo(() => {
    const map = new Map<number, { name: string; qty: number; revenue: number; profit: number }>()
    for (const t of txs ?? []) {
      for (const l of t.lines) {
        const cur = map.get(l.itemId) ?? { name: l.name, qty: 0, revenue: 0, profit: 0 }
        cur.qty += l.qty
        cur.revenue += l.qty * l.price
        cur.profit += l.qty * (l.price - l.cost)
        map.set(l.itemId, cur)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit).slice(0, 5)
  }, [txs])

  const history = useMemo(
    () => [...(txs ?? [])].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20),
    [txs]
  )

  const loading = txs === undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Laporan Penjualan</h1>
        <p className="text-xs text-muted-foreground">
          Periode: {PERIODS[period].caption} • untung = omzet − modal barang terjual
        </p>
      </div>

      {/* Pemilih periode */}
      <div className="grid grid-cols-3 gap-1 rounded-full border bg-muted p-1">
        {(Object.keys(PERIODS) as PeriodKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'tap-target rounded-full py-1.5 text-sm font-semibold transition-colors',
              period === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {PERIODS[key].label}
          </button>
        ))}
      </div>

      {/* Ringkasan */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Banknote className="size-4 text-primary" /> Total Omzet
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight">{formatRupiah(totals.omzet)}</p>
            <p className="text-[11px] text-muted-foreground">{totals.count} transaksi • {totals.qty} barang</p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-500" /> Total Untung
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-emerald-600">
              {formatRupiah(totals.untung)}
            </p>
            <p className="text-[11px] text-muted-foreground">margin {totals.margin}%</p>
          </div>
        </div>
      )}

      {/* Grafik */}
      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Tren Omzet vs Untung</h2>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-orange-500" /> Omzet
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-emerald-500" /> Untung
            </span>
          </div>
        </div>
        <div className="h-56 w-full">
          {loading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#00000014" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={14}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => formatRupiahShort(v)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(249,115,22,0.06)' }}
                  formatter={(value) => formatRupiah(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #eee',
                    fontSize: 12,
                    padding: '6px 10px',
                  }}
                />
                <Bar dataKey="omzet" name="Omzet" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="untung" name="Untung" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Barang terlaris */}
      {!loading && topItems.length > 0 ? (
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
            <Trophy className="size-4 text-amber-500" /> Barang Terlaris (untung tertinggi)
          </h2>
          <ol className="space-y-2">
            {topItems.map((it, idx) => (
              <li key={it.name} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.qty} terjual • omzet {formatRupiah(it.revenue)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-600">
                  +{formatRupiah(it.profit)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Riwayat transaksi */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
          <History className="size-4 text-primary" /> Riwayat Transaksi
        </h2>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description={`Tidak ada penjualan tercatat dalam ${PERIODS[period].caption}. Transaksi dari tab Kasir akan muncul di sini.`}
            className="border-0 py-8"
          />
        ) : (
          <ul className="divide-y">
            {history.map((t) => (
              <HistoryRow key={t.id} tx={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function HistoryRow({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <li>
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-2 py-2.5 text-left transition-colors hover:bg-accent/40"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {tx.customerName || 'Pelanggan'}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                • {tx.lines.reduce((s, l) => s + l.qty, 0)} item
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(tx.createdAt)} • {tx.code}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold">{formatRupiah(tx.total)}</p>
            <p className="text-xs font-medium text-emerald-600">untung {formatRupiah(tx.profit)}</p>
          </div>
        </button>
      </li>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              {tx.code} • {formatDateTime(tx.createdAt)}
              {tx.customerName ? ` • ${tx.customerName}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border p-3 text-sm">
            <ul className="space-y-1.5">
              {tx.lines.map((l) => (
                <li key={l.itemId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {l.name} <span className="text-muted-foreground">×{l.qty}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatRupiah(l.qty * l.price)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Omzet</span>
              <span className="font-semibold">{formatRupiah(tx.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modal barang</span>
              <span>{formatRupiah(tx.cost)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-600">
              <span>Untung</span>
              <span>{formatRupiah(tx.profit)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-muted-foreground">
              <span>Bayar / kembali</span>
              <span>
                {formatRupiah(tx.payAmount)} / {formatRupiah(tx.changeAmount)}
              </span>
            </div>
          </div>
          <CancelTxButton
            tx={tx}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function CancelTxButton({ tx, onDone }: { tx: Transaction; onDone: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <>
      <Button
        variant="outline"
        className="w-full rounded-full text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <XCircle className="size-4" /> Batalkan Transaksi
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan {tx.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi dihapus dari laporan dan seluruh stok barang ({tx.lines.reduce((s, l) => s + l.qty, 0)}{' '}
              item) otomatis dikembalikan. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tidak</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                await cancelTransaction(tx.id!)
                toast.success(`${tx.code} dibatalkan, stok dikembalikan`)
                setConfirmOpen(false)
                onDone()
              }}
            >
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
