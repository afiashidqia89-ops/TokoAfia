'use client'

// Keranjang kasir (sementara, tidak persisten — barang asli di IndexedDB)

import { create } from 'zustand'
import type { CartLine } from '@/lib/types'

interface CartState {
  lines: CartLine[]
  add: (itemId: number, maxStock: number) => boolean
  setQty: (itemId: number, qty: number, maxStock: number) => void
  remove: (itemId: number) => void
  clear: () => void
}

export const useCashierCart = create<CartState>((set) => ({
  lines: [],
  add: (itemId, maxStock) => {
    let added = false
    set((state) => {
      const existing = state.lines.find((l) => l.itemId === itemId)
      if (existing) {
        if (existing.qty >= maxStock) return state
        added = true
        return {
          lines: state.lines.map((l) =>
            l.itemId === itemId ? { ...l, qty: Math.min(l.qty + 1, maxStock) } : l
          ),
        }
      }
      if (maxStock <= 0) return state
      added = true
      return { lines: [...state.lines, { itemId, qty: 1 }] }
    })
    return added
  },
  setQty: (itemId, qty, maxStock) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.itemId === itemId ? { ...l, qty: Math.max(1, Math.min(qty, maxStock)) } : l
      ),
    })),
  remove: (itemId) => set((state) => ({ lines: state.lines.filter((l) => l.itemId !== itemId) })),
  clear: () => set({ lines: [] }),
}))
