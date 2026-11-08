'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting } from '@/lib/db'
import { InstallButton } from './pwa'
import { Settings2, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AppHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  const shopName = useLiveQuery(() => getSetting('shopName'), [], 'Toko Saya')

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm">
          <Store className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[17px] font-bold tracking-tight">Tofia</p>
          <p className="truncate text-xs text-muted-foreground">{shopName}</p>
        </div>
        <InstallButton variant="outline" size="sm" className="hidden h-8 rounded-full sm:inline-flex" />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-muted-foreground"
          onClick={onOpenSettings}
          aria-label="Pengaturan"
        >
          <Settings2 className="size-5" />
        </Button>
      </div>
    </header>
  )
}
