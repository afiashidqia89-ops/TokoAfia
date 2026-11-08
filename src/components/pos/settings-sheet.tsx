'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { db, getSetting, loadDemoData, resetAllData, setSetting } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { InstallButton } from './pwa'
import { Database, Store, Trash2 } from 'lucide-react'

export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const shopName = useLiveQuery(() => getSetting('shopName'), [], 'Toko Saya')
  const itemCount = useLiveQuery(() => db.items.count(), [], 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[86%] sm:max-w-sm">
        <SheetHeader className="p-0">
          <SheetTitle className="text-left">Pengaturan</SheetTitle>
          <SheetDescription className="text-left">
            Sesuaikan aplikasi dengan usaha Anda. Data tersimpan lokal di perangkat.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-2 thin-scrollbar">
          <section className="space-y-2">
            <Label htmlFor="shopName" className="flex items-center gap-1.5">
              <Store className="size-4 text-primary" /> Nama Toko
            </Label>
            <div className="flex gap-2">
              <Input
                id="shopName"
                key={shopName}
                defaultValue={shopName}
                placeholder="cth. Warung Barokah"
                maxLength={40}
              />
              <Button
                onClick={async (e) => {
                  const value = (e.currentTarget.previousElementSibling as HTMLInputElement)?.value ?? ''
                  await setSetting('shopName', value.trim() || 'Toko Saya')
                  toast.success('Nama toko disimpan')
                }}
              >
                Simpan
              </Button>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Database className="size-4 text-primary" /> Data ({itemCount} jenis barang)
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="size-4" /> Muat Data Contoh
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Muat data contoh?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Data contoh akan menggantikan seluruh data saat ini: 12 jenis barang dan
                    riwayat penjualan 30 hari terakhir. Berguna untuk mencoba aplikasi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await loadDemoData()
                      toast.success('Data contoh dimuat')
                    }}
                  >
                    Ya, muat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Hapus Semua Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus semua data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seluruh barang, transaksi, dan catatan stok akan dihapus permanen dari
                    perangkat ini. Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={async () => {
                      await resetAllData()
                      toast.success('Semua data dihapus')
                    }}
                  >
                    Hapus permanen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-sm font-semibold">Pasang di layar utama HP</p>
            <p className="text-sm text-muted-foreground">
              Di Chrome Android: ketuk menu <span className="font-medium">⋮ → Install app</span>{' '}
              (atau <span className="font-medium">Tambahkan ke layar utama</span>) agar LakuKu
              tampil seperti aplikasi biasa dan bisa dibuka tanpa internet.
            </p>
            <InstallButton variant="default" size="default" label="Install Aplikasi" className="mt-1 w-full rounded-full" />
          </section>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            LakuKu v1.0 • Data Anda tersimpan offline di perangkat ini
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
