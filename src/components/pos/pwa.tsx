'use client'

// Registrasi service worker + tombol "Install" (Tambahkan ke layar utama)

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Smartphone } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    window.dispatchEvent(new Event('lakuku:installable'))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new Event('lakuku:installed'))
  })
}

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Mode dev: SW hanya pass-through (tanpa cache) agar hot-reload tidak basi
      const suffix = process.env.NODE_ENV === 'production' ? '' : '?mode=dev'
      // basePath untuk hosting di subfolder (cth. GitHub Pages: /nama-repo/sw.js)
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
      navigator.serviceWorker.register(`${basePath}/sw.js${suffix}`).catch(() => {})
    }
  }, [])
  return null
}

export function InstallButton({
  variant = 'outline',
  size = 'sm',
  label = 'Install',
  className,
}: {
  variant?: 'outline' | 'default' | 'ghost'
  size?: 'sm' | 'default'
  label?: string
  className?: string
}) {
  const [installable, setInstallable] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onInstallable = () => setInstallable(true)
    const onInstalled = () => {
      setInstalled(true)
      setInstallable(false)
    }
    window.addEventListener('lakuku:installable', onInstallable)
    window.addEventListener('lakuku:installed', onInstalled)
    return () => {
      window.removeEventListener('lakuku:installable', onInstallable)
      window.removeEventListener('lakuku:installed', onInstalled)
    }
  }, [])

  if (!installable || installed) return null

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'dismissed') toast('Install dibatalkan')
        deferredPrompt = null
        setInstallable(false)
      }}
    >
      <Smartphone className="size-4" />
      {label}
    </Button>
  )
}
