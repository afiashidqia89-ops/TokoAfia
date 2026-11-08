'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { createCategory, createItem, db, deleteCategory, deleteItem, restockItem, updateCategory, updateItem } from '@/lib/db'
import { formatRupiah } from '@/lib/format'
import type { Category, Item } from '@/lib/types'
import { EmptyState, StockBadge } from './shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Check,
  Info,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ItemsView() {
  const items = useLiveQuery(() => db.items.orderBy('name').toArray(), [], undefined)
  const catRows = useLiveQuery(() => db.categories.orderBy('name').toArray(), [], undefined)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [lowOnly, setLowOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [stockInItem, setStockInItem] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState<Item | null>(null)
  const [catManagerOpen, setCatManagerOpen] = useState(false)

  // Daftar kategori untuk chip filter: dari tabel kategori + jaring pengaman
  // bila ada barang dengan kategori yang belum terdaftar
  const categories = useMemo(() => {
    const set = new Set<string>((catRows ?? []).map((c) => c.name))
    for (const i of items ?? []) {
      if (i.category) set.add(i.category)
    }
    return ['Semua', ...Array.from(set).sort()]
  }, [catRows, items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (items ?? []).filter((i) => {
      if (category !== 'Semua' && i.category !== category) return false
      if (lowOnly && !(i.stock <= i.minStock)) return false
      return q === '' || i.name.toLowerCase().includes(q)
    })
  }, [items, search, category, lowOnly])

  const totalValue = (items ?? []).reduce((s, i) => s + i.stock * i.costPrice, 0)

  return (
    <div className="space-y-3 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Barang & Stok</h1>
          <p className="text-xs text-muted-foreground">
            {items === undefined ? '…' : `${items.length} jenis barang • nilai stok ${formatRupiah(totalValue)}`}
          </p>
        </div>
      </div>

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
        <button
          onClick={() => setLowOnly((v) => !v)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            lowOnly
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'bg-card text-muted-foreground hover:bg-accent'
          )}
        >
          ⚠ Stok Menipis
        </button>
        <button
          onClick={() => setCatManagerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-primary/50 bg-card px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          <Tags className="size-3.5" /> Kelola Kategori
        </button>
      </div>

      {items !== undefined && items.length === 0 ? (
        <EmptyState
          title="Belum ada barang"
          description="Catat barang dagangan Anda: nama, harga modal, harga jual, dan stok. Keuntungan akan terhitung otomatis."
          action={{ label: 'Tambah Barang', onClick: () => setFormOpen(true) }}
          className="mt-6"
        />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Tidak ada barang yang cocok dengan filter.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((item) => {
            const margin = item.sellPrice - item.costPrice
            const marginPct = item.costPrice > 0 ? Math.round((margin / item.costPrice) * 100) : 0
            return (
              <li key={item.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.category} • terjual {item.sold}
                    </p>
                  </div>
                  <StockBadge item={item} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Harga jual</p>
                    <p className="font-bold text-primary">{formatRupiah(item.sellPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Modal / unit</p>
                    <p className="font-semibold">{formatRupiah(item.costPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Untung / unit</p>
                    <p className="font-semibold text-emerald-600">
                      +{formatRupiah(margin)}{' '}
                      <span className="text-[11px] font-normal">({marginPct}%)</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <p className="text-sm">
                    Sisa stok:{' '}
                    <span className="font-bold">
                      {item.stock} {item.unit}
                    </span>{' '}
                    <span className="text-xs text-muted-foreground">(min. {item.minStock})</span>
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full"
                      onClick={() => {
                        setEditing(item)
                        setFormOpen(true)
                      }}
                      aria-label={`Ubah ${item.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full text-primary"
                      onClick={() => setStockInItem(item)}
                      aria-label={`Tambah stok ${item.name}`}
                    >
                      <PackagePlus className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full text-destructive"
                      onClick={() => setDeleting(item)}
                      aria-label={`Hapus ${item.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* FAB tambah barang */}
      {(items?.length ?? 0) > 0 && (
        <Button
          size="lg"
          className="fixed bottom-[76px] right-4 z-30 rounded-full shadow-xl shadow-orange-500/30"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-5" /> Barang
        </Button>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        categories={catRows ?? []}
      />

      <StockInDialog item={stockInItem} onClose={() => setStockInItem(null)} />

      <CategoryManagerDialog open={catManagerOpen} onOpenChange={setCatManagerOpen} />

      <AlertDialog open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Barang akan dihapus dari daftar. Riwayat transaksi yang sudah tercatat tidak ikut
              terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (deleting?.id) await deleteItem(deleting.id)
                toast.success(`${deleting?.name} dihapus`)
                setDeleting(null)
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: Item | null
  categories: Category[]
}) {
  const isEdit = item !== null
  const NEW = '__baru__'
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [cost, setCost] = useState('')
  const [sell, setSell] = useState('')
  const [minStock, setMinStock] = useState('5')
  const [stock, setStock] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '')
      setCategory(item?.category ?? categories[0]?.name ?? 'Lainnya')
      setUnit(item?.unit ?? 'pcs')
      setCost(item ? String(item.costPrice) : '')
      setSell(item ? String(item.sellPrice) : '')
      setMinStock(item ? String(item.minStock) : '5')
      setStock(item ? String(item.stock) : '0')
    }
  }, [open, item])

  const costNum = Number(cost) || 0
  const sellNum = Number(sell) || 0
  const margin = sellNum - costNum
  const marginPct = costNum > 0 ? Math.round((margin / costNum) * 100) : 0

  async function save() {
    const finalCategory =
      category === NEW
        ? (document.getElementById('f-newcat') as HTMLInputElement | null)?.value.trim() ?? ''
        : category
    if (!name.trim()) {
      toast.error('Nama barang wajib diisi')
      return
    }
    if (!finalCategory) {
      toast.error('Kategori wajib diisi')
      return
    }
    if (costNum <= 0 || sellNum <= 0) {
      toast.error('Harga modal dan harga jual harus lebih dari 0')
      return
    }
    if (!isEdit && (Number(stock) || 0) < 0) {
      toast.error('Stok tidak boleh negatif')
      return
    }
    setSaving(true)
    try {
      // Kategori yang diketik manual langsung didaftarkan agar muncul di pengelola kategori
      const known = categories.some((c) => c.name.toLowerCase() === finalCategory.toLowerCase())
      if (!known) await createCategory(finalCategory)
      if (isEdit && item.id) {
        const newStock = Number(stock) || 0
        await updateItem(item.id, {
          name: name.trim(),
          category: finalCategory,
          unit: unit.trim() || 'pcs',
          costPrice: costNum,
          sellPrice: sellNum,
          minStock: Number(minStock) || 0,
          newStock,
        })
        toast.success('Barang diperbarui')
      } else {
        await createItem({
          name: name.trim(),
          category: finalCategory,
          unit: unit.trim() || 'pcs',
          costPrice: costNum,
          sellPrice: sellNum,
          minStock: Number(minStock) || 0,
          initialStock: Number(stock) || 0,
        })
        toast.success(`${name.trim()} ditambahkan`)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto rounded-3xl thin-scrollbar">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah Barang' : 'Tambah Barang'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui data barang. Jika stok diubah, perubahan tercatat sebagai penyesuaian.'
              : 'Isi harga modal & harga jual agar keuntungan terhitung otomatis.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="f-name">Nama barang</Label>
            <Input
              id="f-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Indomie Goreng"
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="f-cat">Kategori</Label>
              <select
                id="f-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                {item && !categories.some((c) => c.name === item.category) ? (
                  <option value={item.category}>{item.category}</option>
                ) : null}
                <option value={NEW}>＋ Kategori baru…</option>
              </select>
              {category === NEW ? (
                <Input
                  id="f-newcat"
                  autoFocus
                  placeholder="Nama kategori baru"
                  maxLength={30}
                />
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-unit">Satuan</Label>
              <Input
                id="f-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs / kg / box"
                maxLength={12}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="f-cost">Harga modal (Rp)</Label>
              <Input
                id="f-cost"
                type="number"
                inputMode="numeric"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-sell">Harga jual (Rp)</Label>
              <Input
                id="f-sell"
                type="number"
                inputMode="numeric"
                min={0}
                value={sell}
                onChange={(e) => setSell(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {sellNum > 0 && costNum > 0 ? (
            <p
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm',
                margin > 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              )}
            >
              <TrendingUp className="size-4 shrink-0" />
              {margin > 0 ? (
                <>
                  Untung <b>{formatRupiah(margin)}</b> per unit ({marginPct}%)
                </>
              ) : (
                <>Harga jual tidak menguntungkan!</>
              )}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="f-min">Stok minimum</Label>
              <Input
                id="f-min"
                type="number"
                inputMode="numeric"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-stock">{isEdit ? 'Stok saat ini' : 'Stok awal'}</Label>
              <Input
                id="f-stock"
                type="number"
                inputMode="numeric"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          {isEdit ? (
            <p className="flex items-start gap-1.5 rounded-xl bg-accent/60 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Untuk menambah stok, gunakan tombol <PackagePlus className="inline size-3.5 text-primary" /> di
              daftar barang agar modal pembelian ikut tercatat.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Barang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StockInDialog({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setQty('')
      setCost(String(item.costPrice))
      setNote('')
    }
  }, [item])

  const qtyNum = Number(qty) || 0
  const costNum = Number(cost) || 0
  const capitalAdded = qtyNum * costNum

  async function save() {
    if (!item?.id) return
    if (qtyNum <= 0 || costNum <= 0) {
      toast.error('Jumlah dan harga modal harus lebih dari 0')
      return
    }
    setSaving(true)
    try {
      await restockItem(item.id, qtyNum, costNum, note || undefined)
      toast.success(
        `Stok ${item.name} +${qtyNum} ${item.unit} • modal ${formatRupiah(capitalAdded)} tercatat`
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Tambah Stok</DialogTitle>
          <DialogDescription>
            {item ? `${item.name} • stok sekarang ${item.stock} ${item.unit}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="s-qty">Jumlah masuk</Label>
              <Input
                id="s-qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-cost">Modal / unit (Rp)</Label>
              <Input
                id="s-cost"
                type="number"
                inputMode="numeric"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-note">Catatan (opsional)</Label>
            <Input
              id="s-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth. kulakan ke supplier A"
              maxLength={60}
            />
          </div>
          {capitalAdded > 0 ? (
            <p className="rounded-xl bg-accent/60 px-3 py-2 text-sm">
              Modal bertambah{' '}
              <b className="text-primary">{formatRupiah(capitalAdded)}</b> • stok menjadi{' '}
              <b>{(item?.stock ?? 0) + qtyNum} {item?.unit}</b>
            </p>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Catat Stok Masuk'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Pengelola Kategori ----------

function CategoryManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const categories = useLiveQuery(
    () => db.categories.orderBy('name').toArray(),
    [open],
    undefined
  )
  const items = useLiveQuery(() => db.items.toArray(), [open], undefined)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleting, setDeleting] = useState<Category | null>(null)

  // Jumlah barang per kategori (untuk info & konfirmasi hapus)
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of items ?? []) {
      map.set(i.category, (map.get(i.category) ?? 0) + 1)
    }
    return map
  }, [items])

  async function add() {
    try {
      await createCategory(newName)
      toast.success(`Kategori "${newName.trim()}" ditambahkan`)
      setNewName('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah kategori')
    }
  }

  async function rename() {
    if (editingId === null) return
    try {
      await updateCategory(editingId, editingName)
      toast.success('Kategori diperbarui')
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah kategori')
    }
  }

  async function remove() {
    if (!deleting?.id) return
    try {
      await deleteCategory(deleting.id)
      toast.success(`Kategori "${deleting.name}" dihapus`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus kategori')
    } finally {
      setDeleting(null)
    }
  }

  const deleteCount = deleting ? (counts.get(deleting.name) ?? 0) : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] max-w-sm overflow-y-auto rounded-3xl thin-scrollbar">
          <DialogHeader>
            <DialogTitle>Kelola Kategori</DialogTitle>
            <DialogDescription>
              Tambah, ubah nama, atau hapus kategori barang. Menghapus kategori tidak menghapus
              barangnya.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
              }}
              placeholder="Kategori baru, cth. Minuman"
              maxLength={30}
            />
            <Button onClick={add} disabled={!newName.trim()} className="shrink-0">
              <Plus className="size-4" /> Tambah
            </Button>
          </div>

          <ul className="space-y-1.5">
            {(categories ?? []).map((c) => {
              const count = counts.get(c.name) ?? 0
              const isEditing = editingId === c.id
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl border bg-accent/30 px-3 py-2"
                >
                  {isEditing ? (
                    <>
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') rename()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        maxLength={30}
                        className="h-8"
                      />
                      <Button
                        size="icon"
                        className="size-8 shrink-0 rounded-full"
                        onClick={rename}
                        aria-label="Simpan nama kategori"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 rounded-full"
                        onClick={() => setEditingId(null)}
                        aria-label="Batal mengubah"
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {count} jenis barang
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 rounded-full"
                        onClick={() => {
                          setEditingId(c.id!)
                          setEditingName(c.name)
                        }}
                        aria-label={`Ubah kategori ${c.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 rounded-full text-destructive"
                        onClick={() => setDeleting(c)}
                        aria-label={`Hapus kategori ${c.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </li>
              )
            })}
            {categories !== undefined && categories.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">
                Belum ada kategori. Tambahkan di atas.
              </li>
            ) : null}
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCount > 0
                ? `${deleteCount} jenis barang di kategori ini otomatis dipindahkan ke kategori "Lainnya". Barang tidak ikut terhapus.`
                : 'Kategori ini belum dipakai barang apa pun, jadi aman dihapus.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={remove}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
