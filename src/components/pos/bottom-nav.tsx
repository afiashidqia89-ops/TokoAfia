'use client'

import { cn } from '@/lib/utils'
import { BarChart3, Home, Package, ShoppingCart } from 'lucide-react'
import type { TabKey } from './shared'

const TABS: Array<{
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { key: 'home', label: 'Beranda', icon: Home },
  { key: 'cashier', label: 'Kasir', icon: ShoppingCart },
  { key: 'items', label: 'Barang', icon: Package },
  { key: 'reports', label: 'Laporan', icon: BarChart3 },
]

export function BottomNav({
  active,
  onChange,
  cartCount,
}: {
  active: TabKey
  onChange: (tab: TabKey) => void
  cartCount: number
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md"
    >
      <div
        className="mx-auto grid max-w-2xl grid-cols-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === active
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="tap-target relative flex flex-col items-center gap-0.5 pt-2 text-[11px] font-medium"
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  'relative flex items-center justify-center rounded-full px-4 py-1 transition-colors',
                  isActive ? 'bg-accent' : 'bg-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'size-[22px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                {tab.key === 'cashier' && cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                ) : null}
              </span>
              <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
