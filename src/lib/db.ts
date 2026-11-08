'use client'

// Database lokal (IndexedDB via Dexie) — semua data tersimpan di perangkat,
// tidak butuh server/internet. Operasi penjualan & pembatalan bersifat atomik.

import Dexie, { type Table } from 'dexie'
import type {
  CartLine,
  Category,
  Item,
  ItemInput,
  StockMove,
  StockMoveType,
  Transaction,
} from './types'

export class LakuKuDB extends Dexie {
  items!: Table<Item, number>
  transactions!: Table<Transaction, number>
  stockMoves!: Table<StockMove, number>
  settings!: Table<{ key: string; value: string }, string>
  categories!: Table<Category, number>

  constructor() {
    super('lakuku')
    this.version(1).stores({
      items: '++id, name, category, stock, createdAt',
      transactions: '++id, code, createdAt',
      stockMoves: '++id, itemId, type, createdAt',
      settings: 'key',
    })
    // v2: tabel kategori barang — bisa dikelola sendiri (tambah/ubah/hapus)
    this.version(2).stores({
      categories: '++id, name, createdAt',
    })
    // Isi kategori bawaan saat pertama kali (juga mengambil kategori
    // yang sudah terpakai di barang lama agar migrasi mulus)
    this.on('ready', async () => {
      await ensureDefaultCategories()
    })
  }
}

export const db = new LakuKuDB()

// ---------- Pengaturan ----------

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.get(key)
  return row?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

// ---------- Kategori ----------

const DEFAULT_CATEGORIES = [
  'Makanan',
  'Minuman',
  'Snack',
  'Sembako',
  'Kebutuhan Rumah',
  'Lainnya',
]

// Pastikan tabel kategori terisi: kategori bawaan saat database baru, dan
// kategori yang terpakai di barang lama (migrasi mulus dari versi 1).
// Kategori yang sengaja dihapus pengguna TIDAK dihidupkan kembali.
export async function ensureDefaultCategories(): Promise<void> {
  const existing = await db.categories.toArray()
  const existingLower = new Set(existing.map((c) => c.name.toLowerCase()))

  const toAdd: Array<{ name: string; createdAt: Date }> = []

  if (existing.length === 0) {
    // Database baru: isi kategori bawaan
    for (const name of DEFAULT_CATEGORIES) {
      toAdd.push({ name, createdAt: new Date() })
    }
  }

  // Kategori yang terpakai di barang tapi belum terdaftar (migrasi dari versi lama)
  const items = await db.items.toArray()
  for (const i of items) {
    if (i.category && !existingLower.has(i.category.toLowerCase())) {
      if (!toAdd.some((t) => t.name.toLowerCase() === i.category.toLowerCase())) {
        toAdd.push({ name: i.category, createdAt: new Date() })
      }
    }
  }

  if (toAdd.length > 0) {
    await db.categories.bulkAdd(
      toAdd.sort((a, b) => a.name.localeCompare(b.name))
    )
  }
}

export async function createCategory(name: string): Promise<void> {
  const clean = name.trim()
  if (!clean) throw new Error('Nama kategori tidak boleh kosong.')
  const dup = await db.categories
    .filter((c) => c.name.toLowerCase() === clean.toLowerCase())
    .first()
  if (dup) throw new Error(`Kategori "${clean}" sudah ada.`)
  await db.categories.add({ name: clean, createdAt: new Date() })
}

// Ubah nama kategori: semua barang dengan nama lama ikut diperbarui (atomik).
export async function updateCategory(id: number, newName: string): Promise<void> {
  const clean = newName.trim()
  if (!clean) throw new Error('Nama kategori tidak boleh kosong.')
  await db.transaction('rw', db.categories, db.items, async () => {
    const cat = await db.categories.get(id)
    if (!cat) return
    if (cat.name === clean) return
    const dup = await db.categories
      .filter((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())
      .first()
    if (dup) throw new Error(`Kategori "${clean}" sudah ada.`)
    const oldName = cat.name
    await db.categories.update(id, { name: clean })
    const affected = await db.items.where('category').equals(oldName).toArray()
    for (const item of affected) {
      await db.items.update(item.id!, { category: clean })
    }
  })
}

// Hapus kategori: barang di dalamnya dipindah ke "Lainnya" (dibuat bila perlu).
export async function deleteCategory(id: number): Promise<void> {
  await db.transaction('rw', db.categories, db.items, async () => {
    const cat = await db.categories.get(id)
    if (!cat) return
    const affectedCount = await db.items.where('category').equals(cat.name).count()
    if (cat.name === 'Lainnya' && affectedCount > 0) {
      throw new Error(
        `Masih ada ${affectedCount} barang di kategori Lainnya. Pindahkan dulu barangnya.`
      )
    }
    if (affectedCount > 0) {
      const hasLainnya = await db.categories.filter((c) => c.name === 'Lainnya').first()
      if (!hasLainnya) {
        await db.categories.add({ name: 'Lainnya', createdAt: new Date() })
      }
      const affected = await db.items.where('category').equals(cat.name).toArray()
      for (const item of affected) {
        await db.items.update(item.id!, { category: 'Lainnya' })
      }
    }
    await db.categories.delete(id)
  })
}

// ---------- Barang ----------

export async function createItem(input: ItemInput): Promise<number> {
  return db.transaction('rw', db.items, db.stockMoves, async () => {
    const now = new Date()
    const id = await db.items.add({
      name: input.name.trim(),
      category: input.category.trim() || 'Lainnya',
      unit: input.unit.trim() || 'pcs',
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      stock: input.initialStock,
      minStock: input.minStock,
      sold: 0,
      createdAt: now,
      updatedAt: now,
    })
    if (input.initialStock > 0) {
      await db.stockMoves.add({
        itemId: id,
        itemName: input.name.trim(),
        type: 'in',
        qty: input.initialStock,
        cost: input.costPrice,
        note: 'Stok awal',
        createdAt: now,
      })
    }
    return id
  })
}

export async function updateItem(
  id: number,
  patch: Partial<Pick<Item, 'name' | 'category' | 'unit' | 'costPrice' | 'sellPrice' | 'minStock'>> & {
    newStock?: number
  }
): Promise<void> {
  await db.transaction('rw', db.items, db.stockMoves, async () => {
    const item = await db.items.get(id)
    if (!item) return
    const now = new Date()
    const { newStock, ...rest } = patch
    await db.items.update(id, { ...rest, updatedAt: now })
    if (newStock !== undefined && newStock !== item.stock) {
      await db.items.update(id, { stock: newStock })
      await db.stockMoves.add({
        itemId: id,
        itemName: rest.name ?? item.name,
        type: 'adjust',
        qty: Math.abs(newStock - item.stock),
        note: `Penyesuaian stok (${item.stock} → ${newStock})`,
        createdAt: now,
      })
    }
  })
}

// Tambah stok (restock): stok bertambah, modal dicatat, harga modal barang
// diperbarui dengan rata-rata bergerak agar laporan untung tetap akurat.
export async function restockItem(
  id: number,
  qty: number,
  costPerUnit: number,
  note?: string
): Promise<void> {
  await db.transaction('rw', db.items, db.stockMoves, async () => {
    const item = await db.items.get(id)
    if (!item || qty <= 0) return
    const now = new Date()
    const totalQty = item.stock + qty
    const avgCost =
      item.stock > 0
        ? Math.round((item.stock * item.costPrice + qty * costPerUnit) / totalQty)
        : costPerUnit
    await db.items.update(id, { stock: totalQty, costPrice: avgCost, updatedAt: now })
    await db.stockMoves.add({
      itemId: id,
      itemName: item.name,
      type: 'in',
      qty,
      cost: costPerUnit,
      note: note?.trim() || 'Pembelian / restock',
      createdAt: now,
    })
  })
}

export async function deleteItem(id: number): Promise<void> {
  await db.transaction('rw', db.items, db.stockMoves, async () => {
    await db.items.delete(id)
    await db.stockMoves.where('itemId').equals(id).delete()
  })
}

// ---------- Penjualan ----------

function makeCode(now: Date, seq: number): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `TRX-${y}${m}${d}-${String(seq).padStart(3, '0')}`
}

export interface SaleResult {
  ok: boolean
  error?: string
  transaction?: Transaction
}

export async function recordSale(
  cart: CartLine[],
  customerName: string,
  payAmount: number
): Promise<SaleResult> {
  if (cart.length === 0) return { ok: false, error: 'Keranjang masih kosong.' }

  return db.transaction(
    'rw',
    db.items,
    db.transactions,
    db.stockMoves,
    async (): Promise<SaleResult> => {
      const lines = []
      for (const line of cart) {
        const item = await db.items.get(line.itemId)
        if (!item) return { ok: false, error: `Barang tidak ditemukan.` }
        if (line.qty > item.stock) {
          return {
            ok: false,
            error: `Stok ${item.name} tinggal ${item.stock} ${item.unit}.`,
          }
        }
        lines.push({
          itemId: item.id!,
          name: item.name,
          qty: line.qty,
          price: item.sellPrice,
          cost: item.costPrice,
        })
      }

      const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
      const cost = lines.reduce((s, l) => s + l.qty * l.cost, 0)
      const profit = total - cost
      if (payAmount < total) return { ok: false, error: 'Uang dibayar kurang dari total.' }

      const now = new Date()
      const prefix = `TRX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-`
      const seq = (await db.transactions.where('code').startsWith(prefix).count()) + 1

      const tx: Transaction = {
        code: makeCode(now, seq),
        customerName: customerName.trim() || undefined,
        lines,
        total,
        cost,
        profit,
        payAmount,
        changeAmount: payAmount - total,
        createdAt: now,
      }
      const txId = await db.transactions.add(tx)

      for (const line of lines) {
        const item = await db.items.get(line.itemId)
        if (item) {
          await db.items.update(line.itemId, {
            stock: item.stock - line.qty,
            sold: item.sold + line.qty,
            updatedAt: now,
          })
        }
        await db.stockMoves.add({
          itemId: line.itemId,
          itemName: line.name,
          type: 'out',
          qty: line.qty,
          note: `Penjualan ${tx.code}`,
          createdAt: now,
        })
      }

      return {
        ok: true,
        transaction: { ...tx, id: txId },
      }
    }
  )
}

// Batalkan transaksi: stok dikembalikan otomatis, transaksi dihapus.
export async function cancelTransaction(txId: number): Promise<void> {
  await db.transaction('rw', db.items, db.transactions, db.stockMoves, async () => {
    const tx = await db.transactions.get(txId)
    if (!tx) return
    const now = new Date()
    for (const line of tx.lines) {
      const item = await db.items.get(line.itemId)
      if (item) {
        await db.items.update(line.itemId, {
          stock: item.stock + line.qty,
          sold: Math.max(0, item.sold - line.qty),
          updatedAt: now,
        })
      }
      await db.stockMoves.add({
        itemId: line.itemId,
        itemName: line.name,
        type: 'return',
        qty: line.qty,
        note: `Pembatalan ${tx.code}`,
        createdAt: now,
      })
    }
    await db.transactions.delete(txId)
  })
}

// ---------- Data contoh & reset ----------

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEMO_ITEMS: Array<Omit<ItemInput, 'initialStock'> & { initialStock: number }> = [
  { name: 'Kopi Kapal Api Sachet', category: 'Minuman', unit: 'pcs', costPrice: 1500, sellPrice: 2500, minStock: 12, initialStock: 96 },
  { name: 'Teh Botol Sosro', category: 'Minuman', unit: 'botol', costPrice: 3500, sellPrice: 5000, minStock: 6, initialStock: 48 },
  { name: 'Aqua 600ml', category: 'Minuman', unit: 'botol', costPrice: 2200, sellPrice: 3500, minStock: 12, initialStock: 60 },
  { name: 'Indomie Goreng', category: 'Makanan', unit: 'pcs', costPrice: 2800, sellPrice: 3500, minStock: 24, initialStock: 120 },
  { name: 'Chitato 68g', category: 'Snack', unit: 'pcs', costPrice: 8500, sellPrice: 11000, minStock: 5, initialStock: 30 },
  { name: 'Beras Pandan Wangi 5kg', category: 'Sembako', unit: 'karung', costPrice: 62000, sellPrice: 72000, minStock: 2, initialStock: 10 },
  { name: 'Minyak Goreng 1L', category: 'Sembako', unit: 'pcs', costPrice: 16500, sellPrice: 19000, minStock: 5, initialStock: 24 },
  { name: 'Gula Pasir 1kg', category: 'Sembako', unit: 'kg', costPrice: 14000, sellPrice: 17000, minStock: 4, initialStock: 16 },
  { name: 'Telur Ayam 1kg', category: 'Sembako', unit: 'kg', costPrice: 26000, sellPrice: 30000, minStock: 3, initialStock: 12 },
  { name: 'Sabun Lifebuoy', category: 'Kebutuhan Rumah', unit: 'pcs', costPrice: 3800, sellPrice: 5000, minStock: 6, initialStock: 24 },
  { name: 'Susu Ultra Milk 250ml', category: 'Minuman', unit: 'pcs', costPrice: 5200, sellPrice: 6500, minStock: 6, initialStock: 8 },
  { name: 'Rinso Anti Noda 770g', category: 'Kebutuhan Rumah', unit: 'pcs', costPrice: 18000, sellPrice: 21500, minStock: 5, initialStock: 6 },
]

export async function loadDemoData(): Promise<void> {
  await resetAllData()
  const rand = mulberry32(20241107)
  const now = new Date()

  await setSetting('shopName', 'Warung Barokah')
  await setSetting('demoLoaded', 'true')

  // Stok awal dimasukkan 45 hari lalu
  const startedAt = new Date(now)
  startedAt.setDate(startedAt.getDate() - 45)
  startedAt.setHours(9, 0, 0, 0)

  const itemIds: Array<{ id: number; item: (typeof DEMO_ITEMS)[number] }> = []
  for (const item of DEMO_ITEMS) {
    const id = await createItem({ ...item })
    // geser tanggal stok awal & tanggal barang ke masa lalu agar masuk akal
    await db.items.update(id, { createdAt: new Date(startedAt), updatedAt: new Date(startedAt) })
    await db.stockMoves.update(await latestMoveId(), { createdAt: new Date(startedAt) })
    itemIds.push({ id, item })
  }

  // Restock beberapa hari lalu (masih dalam bulan berjalan) untuk barang laris
  const restockAt = new Date(now)
  restockAt.setDate(restockAt.getDate() - 4)
  restockAt.setHours(8, 30, 0, 0)
  await restockItem(itemIds[3].id, 60, 2750, 'Kulakan Indomie')
  await db.stockMoves.update(await latestMoveId(), { createdAt: new Date(restockAt) })
  await restockItem(itemIds[0].id, 48, 1450, 'Kulakan kopi')
  await db.stockMoves.update(await latestMoveId(), { createdAt: new Date(restockAt) })

  // Penjualan 30 hari terakhir, 1-4 transaksi per hari
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const count = 1 + Math.floor(rand() * 4) // 1..4
    for (let t = 0; t < count; t++) {
      const at = new Date(now)
      at.setDate(at.getDate() - dayOffset)
      at.setHours(8 + Math.floor(rand() * 12), Math.floor(rand() * 60), 0, 0)

      const nLines = 1 + Math.floor(rand() * 3) // 1..3 jenis barang
      const picked = new Set<number>()
      const cart: CartLine[] = []
      for (let l = 0; l < nLines; l++) {
        const idx = Math.floor(rand() * itemIds.length)
        if (picked.has(idx)) continue
        picked.add(idx)
        const demo = itemIds[idx].item
        const big = demo.costPrice > 20000
        cart.push({ itemId: itemIds[idx].id, qty: big ? 1 : 1 + Math.floor(rand() * 3) })
      }
      if (cart.length === 0) continue

      // Hitung total lalu bayar dibulatkan ke atas (5.000/10.000/20.000)
      const total = cart.reduce((s, c) => {
        const it = itemIds.find((x) => x.id === c.itemId)!.item
        return s + c.qty * it.sellPrice
      }, 0)
      const step = total > 50000 ? 20000 : total > 20000 ? 10000 : 5000
      const pay = Math.ceil(total / step) * step

      // Simpan transaksi dengan waktu lampau (bypass waktu "now")
      const res = await recordSaleAt(cart, '', pay, at)
      if (!res.ok) continue
    }
  }
}

async function latestMoveId(): Promise<number> {
  const moves = await db.stockMoves.orderBy(':id').reverse().limit(1).toArray()
  const id = moves[0]?.id
  if (id === undefined) throw new Error('Kartu stok tidak ditemukan')
  return id
}

// Versi recordSale dengan timestamp khusus (untuk data contoh bersejarah)
async function recordSaleAt(
  cart: CartLine[],
  customerName: string,
  payAmount: number,
  at: Date
): Promise<SaleResult> {
  return db.transaction(
    'rw',
    db.items,
    db.transactions,
    db.stockMoves,
    async (): Promise<SaleResult> => {
      const lines = []
      for (const line of cart) {
        const item = await db.items.get(line.itemId)
        if (!item) return { ok: false, error: 'Barang tidak ditemukan.' }
        if (line.qty > item.stock) {
          return { ok: false, error: `Stok ${item.name} kurang.` }
        }
        lines.push({
          itemId: item.id!,
          name: item.name,
          qty: line.qty,
          price: item.sellPrice,
          cost: item.costPrice,
        })
      }
      const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
      const cost = lines.reduce((s, l) => s + l.qty * l.cost, 0)
      const prefix = `TRX-${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, '0')}${String(
        at.getDate()
      ).padStart(2, '0')}-`
      const seq = (await db.transactions.where('code').startsWith(prefix).count()) + 1
      const tx: Transaction = {
        code: makeCode(at, seq),
        customerName: customerName.trim() || undefined,
        lines,
        total,
        cost,
        profit: total - cost,
        payAmount,
        changeAmount: payAmount - total,
        createdAt: at,
      }
      const txId = await db.transactions.add(tx)
      for (const line of lines) {
        const item = await db.items.get(line.itemId)
        if (item) {
          await db.items.update(line.itemId, {
            stock: item.stock - line.qty,
            sold: item.sold + line.qty,
            updatedAt: at,
          })
        }
        await db.stockMoves.add({
          itemId: line.itemId,
          itemName: line.name,
          type: 'out',
          qty: line.qty,
          note: `Penjualan ${tx.code}`,
          createdAt: at,
        })
      }
      return { ok: true, transaction: { ...tx, id: txId } }
    }
  )
}

export async function resetAllData(): Promise<void> {
  await db.transaction(
    'rw',
    db.items,
    db.transactions,
    db.stockMoves,
    db.settings,
    db.categories,
    async () => {
      await Promise.all([
        db.items.clear(),
        db.transactions.clear(),
        db.stockMoves.clear(),
        db.settings.clear(),
        db.categories.clear(),
      ])
    }
  )
  // Isi ulang kategori bawaan agar aplikasi langsung siap dipakai
  await ensureDefaultCategories()
}
