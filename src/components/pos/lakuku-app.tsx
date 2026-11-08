'use client'

// Kerangka aplikasi LakuKu: header + 4 tab (Beranda, Kasir, Barang, Laporan)

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useCashierCart } from '@/store/cart'
import { AppHeader } from './app-header'
import { BottomNav } from './bottom-nav'
import { SettingsSheet } from './settings-sheet'
import { DashboardView } from './dashboard-view'
import { CashierView } from './cashier-view'
import { ItemsView } from './items-view'
import { ReportsView } from './reports-view'
import { PwaRegister } from './pwa'
import type { TabKey } from './shared'

export function LakuKuApp() {
  const [tab, setTab] = useState<TabKey>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const cartCount = useCashierCart((s) => s.lines.reduce((sum, l) => sum + l.qty, 0))
  // Berlangganan perubahan data agar badge keranjang ikut hidup saat stok berubah
  useLiveQuery(() => db.items.count(), [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <PwaRegister />
      <AppHeader onOpenSettings={() => setSettingsOpen(true)} />

      <main className="flex-1 px-4 pb-32 pt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {tab === 'home' && <DashboardView onNavigate={setTab} />}
            {tab === 'cashier' && <CashierView onGoItems={() => setTab('items')} />}
            {tab === 'items' && <ItemsView />}
            {tab === 'reports' && <ReportsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={tab} onChange={setTab} cartCount={cartCount} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
