// Tipe data utama aplikasi LakuKu (disimpan lokal via IndexedDB)

export interface Item {
  id?: number
  name: string
  category: string
  unit: string // pcs, kg, box, dll
  costPrice: number // harga modal per unit
  sellPrice: number // harga jual per unit
  stock: number // sisa stok saat ini
  minStock: number // batas minimum (peringatan stok menipis)
  sold: number // total terjual (qty)
  createdAt: Date
  updatedAt: Date
}

export interface TxLine {
  itemId: number
  name: string
  qty: number
  price: number // harga jual saat transaksi
  cost: number // harga modal saat transaksi (snapshot HPP)
}

export interface Transaction {
  id?: number
  code: string // TRX-YYYYMMDD-NNN
  customerName?: string
  lines: TxLine[]
  total: number // omzet
  cost: number // modal terpakai (HPP)
  profit: number // keuntungan
  payAmount: number
  changeAmount: number
  createdAt: Date
}

export type StockMoveType = 'in' | 'out' | 'adjust' | 'return'

export interface StockMove {
  id?: number
  itemId: number
  itemName: string
  type: StockMoveType
  qty: number
  cost?: number // modal per unit (untuk type 'in')
  note?: string
  createdAt: Date
}

export interface ItemInput {
  name: string
  category: string
  unit: string
  costPrice: number
  sellPrice: number
  minStock: number
  initialStock: number
}

export interface CartLine {
  itemId: number
  qty: number
}

export interface Category {
  id?: number
  name: string
  createdAt: Date
}
