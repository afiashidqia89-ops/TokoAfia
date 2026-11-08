'use client'

// Tipe & komponen kecil yang dipakai lintas tab LakuKu

import { Badge } from '@/components/ui/badge'
import { PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Item } from '@/lib/types'

export type TabKey = 'home' | 'cashier' | 'items' | 'reports'

export function stockStatus(item: Item): {
  label: string
  className: string
  level: 'ok' | 'low' | 'out'
} {
  if (item.stock <= 0)
    return {
      label: 'Habis',
      className: 'bg-red-100 text-red-700 border-red-200',
      level: 'out',
    }
  if (item.stock <= item.minStock)
    return {
      label: 'Menipis',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
      level: 'low',
    }
  return {
    label: 'Tersedia',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    level: 'ok',
  }
}

export function StockBadge({ item, className }: { item: Item; className?: string }) {
  const s = stockStatus(item)
  return (
    <Badge variant="outline" className={cn(s.className, 'border font-medium', className)}>
      {s.label}
    </Badge>
  )
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center',
        className
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent">
        <PackageOpen className="size-7 text-primary" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Button onClick={action.onClick} className="mt-5 rounded-full">
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
