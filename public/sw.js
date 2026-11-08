/* Service worker LakuKu — caching agar aplikasi bisa dibuka offline.
   Path dihitung relatif terhadap scope, jadi bekerja di root domain
   maupun di subfolder (cth. GitHub Pages: /nama-repo/). */
const VERSION = 'v3'
const STATIC_CACHE = `lakuku-static-${VERSION}`
const RUNTIME_CACHE = `lakuku-runtime-${VERSION}`
// Mode dev (didaftarkan dengan ?mode=dev): tanpa cache, cukup lewat jaringan
const DEV = new URLSearchParams(self.location.search).get('mode') === 'dev'

// Path folder tempat aplikasi berada, cth. '/' atau '/lakuku/'
const BASE = new URL(self.registration.scope).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([BASE, BASE + 'manifest.webmanifest']))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Mode dev: langsung jaringan, tidak ada caching sama sekali
  if (DEV) {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())))
    return
  }

  // Jangan ganggu hot-reload saat development
  if (url.pathname.includes('webpack-hmr') || url.searchParams.has('_rsc')) return

  // Path relatif terhadap folder aplikasi (abaikan basePath subfolder)
  const rel = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : url.pathname

  // Navigasi halaman: utamakan jaringan, fallback ke cache saat offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(BASE, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(BASE).then((r) => r || Response.error()))
    )
    return
  }

  // Aset statis ber-hash: cache-first (permanen)
  if (
    rel.startsWith('_next/static/') ||
    rel.startsWith('icons/') ||
    rel === 'manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {})
            return res
          })
      )
    )
    return
  }

  // Lainnya: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    })
  )
})
