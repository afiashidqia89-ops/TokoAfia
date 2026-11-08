'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db, loadDemoData, getSetting } from '@/lib/db'
import {
  addDays,
  formatRupiah,
  formatTime,
  startOfDay,
  startOfMonth,
  todayLabel,
} from '@/lib/format'
import { EmptyState } from './shared'
import type { TabKey } from './shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardView({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const items = useLiveQuery(() => db.items.toArray(), [], undefined)
  const todayTx = useLiveQuery(
    () => db.transactions.where('createdAt').above(startOfDay(new Date())).toArray(),
    [],
    undefined
  )
  const monthStats = useLiveQuery(async () => {
    const monthStart = startOfMonth(new Date())
    const [txs, moves] = await Promise.all([
      db.transactions.where('createdAt').above(monthStart).toArray(),
      db.stockMoves.where('type').equals('in').filter((m) => m.createdAt >= monthStart).toArray(),
    ])
    return {
      profit: txs.reduce((s, t) => s + t.profit, 0),
      revenue: txs.reduce((s, t) => s + t.total, 0),
      capital: moves.reduce((s, m) => s + m.qty * (m.cost ?? 0), 0),
      txCount: txs.length,
    }
  }, [], undefined)
  const recentTx = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().limit(5).toArray(),
    [],
    undefined
  )
  const shopName = useLiveQuery(() => getSetting('shopName'), [], 'Toko Saya')

  const loading = items === undefined || todayTx === undefined || monthStats === undefined

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  const allItems = items ?? []
  const tToday = todayTx ?? []
  const omzetToday = tToday.reduce((s, t) => s + t.total, 0)
  const profitToday = tToday.reduce((s, t) => s + t.profit, 0)
  const marginToday = omzetToday > 0 ? Math.round((profitToday / omzetToday) * 100) : 0
  const inventoryValue = allItems.reduce((s, i) => s + i.stock * i.costPrice, 0)
  const lowStockItems = allItems.filter((i) => i.stock <= i.minStock)
  const month = monthStats ?? { profit: 0, revenue: 0, capital: 0, txCount: 0 }
  const marginMonth = month.revenue > 0 ? Math.round((month.profit / month.revenue) * 100) : 0

  // Awal pakai aplikasi: belum ada barang sama sekali
  if (allItems.length === 0) {
    return (
      <div className="space-y-4">
        <GreetingCard shopName={shopName} omzetToday={0} profitToday={0} txToday={0} />
        <div className="rounded-3xl border border-dashed bg-card px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent">
            <Sparkles className="size-7 text-primary" />
          </div>
          <p className="text-lg font-bold">Selamat datang di LakuKu! 👋</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Catat modal, penjualan, keuntungan, dan sisa stok usaha Anda dalam satu aplikasi —
            tanpa internet, data tersimpan di HP.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              className="rounded-full"
              onClick={async () => {
                toast.loading('Menyiapkan data contoh…', { id: 'demo' })
                await loadDemoData()
                toast.success('Data contoh siap! Silakan jelajahi aplikasi.', { id: 'demo' })
              }}
            >
              <Sparkles className="size-4" /> Muat Data Contoh
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => onNavigate('items')}>
              <Package className="size-4" /> Tambah Barang Pertama
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GreetingCard shopName={shopName} omzetToday={omzetToday} profitToday={profitToday} txToday={tToday.length} />

      {/* Aksi cepat */}
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-12 rounded-2xl text-[15px]" onClick={() => onNavigate('cashier')}>
          <ShoppingBag className="size-5" /> Jual Sekarang
        </Button>
        <Button size="lg" variant="outline" className="h-12 rounded-2xl text-[15px]" onClick={() => onNavigate('items')}>
          <Package className="size-5" /> Kelola Barang
        </Button>
      </div>

      {/* Modal & untung bulan ini */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Modal Bulan Ini"
          value={formatRupiah(month.capital)}
          sub="uang yang masuk ke barang"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Untung Bulan Ini"
          value={formatRupiah(month.profit)}
          sub={month.txCount > 0 ? `margin ${marginMonth}% • ${month.txCount} transaksi` : 'belum ada penjualan'}
          valueClass="text-emerald-600"
        />
        <StatCard
          icon={<Boxes className="size-4" />}
          label="Nilai Sisa Stok"
          value={formatRupiah(inventoryValue)}
          sub="modal tertanam di stok"
        />
        <StatCard
          icon={<Package className="size-4" />}
          label="Jenis Barang"
          value={`${allItems.length}`}
          sub={
            lowStockItems.length > 0 ? (
              <span className="font-medium text-amber-600">
                {lowStockItems.length} stok menipis
              </span>
            ) : (
              'semua stok aman'
            )
          }
        />
      </div>

      {/* Stok menipis */}
      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Perlu Restock</h2>
          <Button variant="ghost" size="sm" className="h-7 rounded-full text-primary" onClick={() => onNavigate('items')}>
            Lihat semua <ArrowRight className="size-3.5" />
          </Button>
        </div>
        {lowStockItems.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Semua stok masih di atas batas minimum. 👍
          </p>
        ) : (
          <ul className="space-y-1">
            {lowStockItems.slice(0, 4).map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-accent/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    min. {i.minStock} {i.unit}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                    i.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  )}
                >
                  sisa {i.stock} {i.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Transaksi terakhir */}
      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Transaksi Terakhir</h2>
          <Button variant="ghost" size="sm" className="h-7 rounded-full text-primary" onClick={() => onNavigate('reports')}>
            Laporan <ArrowRight className="size-3.5" />
          </Button>
        </div>
        {recentTx === undefined ? null : recentTx.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada penjualan tercatat. Mulai dari tab <span className="font-medium text-primary">Kasir</span>.
          </p>
        ) : (
          <ul className="space-y-1">
            {recentTx.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-accent/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.customerName || 'Pelanggan'}{' '}
                    <span className="text-xs font-normal text-muted-foreground">• {t.lines.length} item</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.code} • {formatTime(t.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{formatRupiah(t.total)}</p>
                  <p className="text-xs font-medium text-emerald-600">untung {formatRupiah(t.profit)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function GreetingCard({
  shopName,
  omzetToday,
  profitToday,
  txToday,
}: {
  shopName: string
  omzetToday: number
  profitToday: number
  txToday: number
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-5 text-white shadow-lg shadow-orange-500/20">
      <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" aria-hidden />
      <div className="absolute -bottom-14 right-10 size-32 rounded-full bg-white/10" aria-hidden />
      <div className="relative">
        <p className="text-sm font-medium text-white/85">{todayLabel()}</p>
        <p className="mt-2 text-sm text-white/85">Omzet hari ini — {shopName}</p>
        <p className="mt-0.5 text-[34px] font-bold leading-tight tracking-tight">
          {formatRupiah(omzetToday)}
        </p>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs text-white/75">Untung hari ini</p>
            <p className="text-lg font-bold">{formatRupiah(profitToday)}</p>
          </div>
          <div>
            <p className="text-xs text-white/75">Transaksi</p>
            <p className="text-lg font-bold">{txToday}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string | React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className={cn('mt-1.5 text-lg font-bold tracking-tight', valueClass)}>{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}
