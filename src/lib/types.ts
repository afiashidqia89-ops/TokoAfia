export interface Product {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  stok: number;
  gambar: string;
  deskripsi: string;
  createdAt: string;
}

export type StatusPO = "menunggu" | "diproses" | "selesai" | "dibatalkan";

export type MetodeBayar = "tunai" | "transfer" | "qris";

export interface POItem {
  produkId: string;
  nama: string;
  harga: number;
  qty: number;
}

export interface PurchaseOrder {
  id: string;
  customer: string;
  telepon: string;
  items: POItem[];
  total: number;
  catatan: string;
  metodeBayar: MetodeBayar;
  status: StatusPO;
  createdAt: string;
  updatedAt: string;
}

export interface DraftItem {
  produkId: string;
  qty: number;
}

export const STATUS_LABEL: Record<StatusPO, string> = {
  menunggu: "Menunggu",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const METODE_LABEL: Record<MetodeBayar, string> = {
  tunai: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
};

export const BATAS_STOK_MENIPIS = 5;
