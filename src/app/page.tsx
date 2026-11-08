"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
import { useTokoStore } from "@/lib/store";
import { BottomNav, type Tab } from "@/components/tokokita/bottom-nav";
import { HomeView } from "@/components/tokokita/home-view";
import { CatalogView } from "@/components/tokokita/catalog-view";
import { OrderView } from "@/components/tokokita/order-view";
import { OrdersView } from "@/components/tokokita/orders-view";
import { ProductsView } from "@/components/tokokita/products-view";

const TAB_KEYS: Tab[] = ["beranda", "katalog", "po", "pesanan", "produk"];
const emptySubscribe = () => () => {};

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "beranda";
  const param = new URLSearchParams(window.location.search).get("tab");
  return TAB_KEYS.includes(param as Tab) ? (param as Tab) : "beranda";
}

export default function Home() {
  // false saat render server / hidrasi awal, true setelah aplikasi siap di klien
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [tab, setTab] = useState<Tab>(getInitialTab);
  const draftCount = useTokoStore((s) =>
    s.draft.reduce((sum, d) => sum + d.qty, 0)
  );

  // Daftarkan service worker hanya di production build
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50/60">
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-white shadow-2xl shadow-emerald-900/10">
        {!mounted ? (
          <div className="flex min-h-screen flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-600/30">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm font-bold text-slate-700">TokoKita</p>
            <p className="text-xs text-slate-400">Memuat data toko...</p>
          </div>
        ) : (
          <>
            {tab === "beranda" && <HomeView onNavigate={setTab} />}
            {tab === "katalog" && <CatalogView onNavigate={setTab} />}
            {tab === "po" && <OrderView onNavigate={setTab} />}
            {tab === "pesanan" && <OrdersView />}
            {tab === "produk" && <ProductsView />}
            <BottomNav active={tab} onChange={setTab} draftCount={draftCount} />
          </>
        )}
      </div>
    </div>
  );
}
