"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DraftItem,
  MetodeBayar,
  Product,
  PurchaseOrder,
  StatusPO,
} from "./types";
import { SEED_ORDERS, SEED_PRODUCTS } from "./seed";
import { generateId, generatePOId } from "./format";

interface NewOrderInput {
  customer: string;
  telepon?: string;
  catatan?: string;
  metodeBayar: MetodeBayar;
}

interface TokoState {
  products: Product[];
  orders: PurchaseOrder[];
  draft: DraftItem[];
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, p: Partial<Omit<Product, "id">>) => void;
  deleteProduct: (id: string) => void;
  addToDraft: (produkId: string) => boolean;
  setDraftQty: (produkId: string, qty: number) => void;
  removeDraft: (produkId: string) => void;
  clearDraft: () => void;
  createPO: (input: NewOrderInput) => PurchaseOrder | null;
  setOrderStatus: (id: string, status: StatusPO) => void;
  resetDemo: () => void;
}

export const useTokoStore = create<TokoState>()(
  persist(
    (set, get) => ({
      products: SEED_PRODUCTS,
      orders: SEED_ORDERS,
      draft: [],

      addProduct: (p) => {
        const product: Product = {
          ...p,
          id: generateId("prd"),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ products: [product, ...s.products] }));
        return product;
      },

      updateProduct: (id, p) =>
        set((s) => ({
          products: s.products.map((prod) =>
            prod.id === id ? { ...prod, ...p } : prod
          ),
        })),

      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          draft: s.draft.filter((d) => d.produkId !== id),
        })),

      addToDraft: (produkId) => {
        const { products, draft } = get();
        const product = products.find((p) => p.id === produkId);
        if (!product || product.stok < 1) return false;
        const existing = draft.find((d) => d.produkId === produkId);
        if (existing) {
          if (existing.qty >= product.stok) return false;
          set({
            draft: draft.map((d) =>
              d.produkId === produkId ? { ...d, qty: d.qty + 1 } : d
            ),
          });
        } else {
          set({ draft: [...draft, { produkId, qty: 1 }] });
        }
        return true;
      },

      setDraftQty: (produkId, qty) => {
        const { products } = get();
        const product = products.find((p) => p.id === produkId);
        if (!product) return;
        const capped = Math.max(0, Math.min(qty, product.stok));
        if (capped === 0) {
          set((s) => ({
            draft: s.draft.filter((d) => d.produkId !== produkId),
          }));
        } else {
          set((s) => ({
            draft: s.draft.map((d) =>
              d.produkId === produkId ? { ...d, qty: capped } : d
            ),
          }));
        }
      },

      removeDraft: (produkId) =>
        set((s) => ({ draft: s.draft.filter((d) => d.produkId !== produkId) })),

      clearDraft: () => set({ draft: [] }),

      createPO: (input) => {
        const { draft, products } = get();
        if (draft.length === 0) return null;

        // Validasi stok sebelum menyimpan
        for (const d of draft) {
          const p = products.find((pr) => pr.id === d.produkId);
          if (!p || p.stok < d.qty) return null;
        }

        const items = draft.map((d) => {
          const p = products.find((pr) => pr.id === d.produkId)!;
          return { produkId: p.id, nama: p.nama, harga: p.harga, qty: d.qty };
        });
        const total = items.reduce((sum, it) => sum + it.harga * it.qty, 0);
        const now = new Date().toISOString();

        const order: PurchaseOrder = {
          id: generatePOId(),
          customer: input.customer.trim(),
          telepon: input.telepon?.trim() ?? "",
          items,
          total,
          catatan: input.catatan?.trim() ?? "",
          metodeBayar: input.metodeBayar,
          status: "menunggu",
          createdAt: now,
          updatedAt: now,
        };

        // Kurangi stok produk (dicadangkan untuk PO)
        set((s) => ({
          orders: [order, ...s.orders],
          products: s.products.map((p) => {
            const item = items.find((it) => it.produkId === p.id);
            return item ? { ...p, stok: p.stok - item.qty } : p;
          }),
          draft: [],
        }));

        return order;
      },

      setOrderStatus: (id, status) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === id);
          if (!order || order.status === status) return s;
          // Pembatalan mengembalikan stok produk
          if (status === "dibatalkan" && order.status !== "dibatalkan") {
            return {
              orders: s.orders.map((o) =>
                o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
              ),
              products: s.products.map((p) => {
                const item = order.items.find((it) => it.produkId === p.id);
                return item ? { ...p, stok: p.stok + item.qty } : p;
              }),
            };
          }
          return {
            orders: s.orders.map((o) =>
              o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
            ),
          };
        }),

      resetDemo: () =>
        set({ products: SEED_PRODUCTS, orders: SEED_ORDERS, draft: [] }),
    }),
    {
      name: "tokokita-data",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
