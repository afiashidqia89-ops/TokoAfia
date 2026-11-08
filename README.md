# TokoKita

<p align="center">
  <img src="public/icon-192.png" width="96" alt="Logo TokoKita" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="Lisensi MIT" />
</p>

<p align="center">
  Aplikasi penjualan untuk admin/seller — kelola <b>barang tersedia, harga, dan jenis produk</b>, lalu catat <b>pesanan (PO) dari customer</b> dalam satu tempat.
</p>

TokoKita adalah aplikasi web mobile-first (bisa dipasang sebagai **PWA** di HP) dengan UI segar modern bernuansa putih & hijau emerald. Seluruh data tersimpan lokal di browser (localStorage) sehingga bisa langsung dicoba tanpa setup database.

## Fitur

- **Beranda (Dashboard)** — ringkasan jumlah barang, stok menipis, PO hari ini, pendapatan PO selesai, daftar "Perlu Restock", dan pesanan terbaru.
- **Katalog Barang** — grid produk dengan foto, **harga**, **jenis/kategori**, badge stok (`Tersedia / Sisa / Habis`), pencarian, dan filter kategori. Detail produk tersedia lewat bottom sheet.
- **Buat PO Customer** — form data customer (nama, no. HP, catatan), metode pembayaran (Tunai / Transfer / QRIS), pemilih barang dengan penghitung qty, ringkasan total, dan nomor PO otomatis (`PO-YYYYMMDD-XXXX`). Stok otomatis dikurangi saat PO disimpan.
- **Riwayat PO** — filter berdasarkan status (**Menunggu → Diproses → Selesai / Dibatalkan**), detail rincian item, dan aksi perubahan status. Membatalkan PO otomatis mengembalikan stok.
- **Kelola Produk** — tambah / edit / hapus produk: nama, jenis, harga, stok, foto (URL), dan deskripsi.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + TypeScript |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Ikon | [Lucide Icons](https://lucide.dev) |
| State & data | [Zustand](https://zustand.docs.pmnd.rs) dengan persist `localStorage` |
| Animasi toast | [Sonner](https://sonner.emilkowal.dev) |
| PWA | `manifest.json` + service worker sederhana (cache aset statis) |

## Menjalankan Proyek

Pastikan sudah memasang [Node.js 20+](https://nodejs.org) dan [Bun](https://bun.sh) (opsional, bisa juga npm/pnpm).

```bash
# 1. Clone repo Anda
git clone https://github.com/<username>/tokokita.git
cd tokokita

# 2. Pasang dependensi
bun install        # atau: npm install

# 3. Jalankan mode pengembangan
bun run dev        # atau: npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Untuk tampilan terbaik, gunakan mode perangkat mobile (DevTools → Toggle device toolbar).

### Build Produksi

```bash
bun run build
bun run start
```

## CI (GitHub Actions)

Repo ini sudah dilengkapi workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) yang berjalan otomatis pada setiap push ke `main` dan setiap pull request. Workflow akan:

1. Memasang dependensi dengan `bun install --frozen-lockfile`
2. Menjalankan ESLint (`bun run lint`)
3. Menjalankan build produksi (`bun run build`)
4. Mengunggah hasil build sebagai artefak `tokokita-build` (berlaku 7 hari)

Setelah repo di-push ke GitHub, status build bisa dipantau di tab **Actions**. Tambahkan badge berikut di bagian atas README ini (ganti `<username>`):

```md
[![CI](https://github.com/<username>/tokokita/actions/workflows/ci.yml/badge.svg)](https://github.com/<username>/tokokita/actions/workflows/ci.yml)
```

## Build APK Android

Aplikasi ini bisa dikemas menjadi **APK Android** menggunakan [Capacitor](https://capacitorjs.com) — seluruh aplikasi web dibundel ke dalam aplikasi Android sehingga bisa berjalan **offline**.

**Cara build (via GitHub Actions — tanpa install apa pun):**

1. Buka tab **Actions** di repo GitHub Anda.
2. Pilih workflow **Build APK** di sidebar kiri.
3. Klik tombol **Run workflow** → **Run workflow**.
4. Tunggu ± 5–10 menit, lalu buka run yang selesai.
5. Di bagian bawah halaman run, unduh artefak **TokoKita-APK** → ekstrak → dapat file `TokoKita-debug.apk`.
6. Pindahkan ke HP Android, buka, dan izinkan *install dari sumber tidak dikenal* (APK debug belum ditandatangani Play Store).

Hasil APK adalah **debug build** — cocok untuk dipakai sendiri / uji coba. Untuk publikasi ke Play Store diperlukan signing release (lihat [dokumentasi Capacitor](https://capacitorjs.com/docs/android/deploying-to-google-play)).

**Build manual di komputer** (butuh JDK 21 + Android SDK):

```bash
bun install
bun run build:static   # static export ke folder out/
bunx cap add android   # sekali saja, buat project android/
bunx cap sync android  # salin aset web ke project android
cd android && ./gradlew assembleDebug
# hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

## Memasang di HP (PWA)

1. Buka aplikasi (hasil deploy) di browser HP.
2. **Android (Chrome)**: menu ⋮ → *Tambahkan ke layar utama*.
3. **iOS (Safari)**: tombol *Share* → *Tambahkan ke Layar Utama*.

Aplikasi akan berjalan layar penuh seperti aplikasi native.

## Struktur Proyek

```
src/
├── app/
│   ├── layout.tsx          # Metadata, font, PWA, Toaster
│   ├── page.tsx            # Entry: tab navigasi + shell aplikasi
│   └── globals.css         # Tema emerald + variabel Tailwind
├── components/
│   ├── tokokita/
│   │   ├── bottom-nav.tsx      # Navigasi bawah + tombol tengah "Buat PO"
│   │   ├── home-view.tsx       # Dashboard penjual
│   │   ├── catalog-view.tsx    # Katalog + filter jenis + detail produk
│   │   ├── order-view.tsx      # Form Buat PO customer
│   │   ├── orders-view.tsx     # Riwayat PO + update status
│   │   ├── products-view.tsx   # Kelola produk (CRUD)
│   │   ├── product-form.tsx    # Sheet tambah/edit produk
│   │   ├── status-badge.tsx    # Badge status PO
│   │   └── product-image.tsx   # Gambar produk + fallback
│   └── ui/                 # Komponen shadcn/ui
└── lib/
    ├── types.ts            # Tipe Product, PurchaseOrder, dll.
    ├── store.ts            # Zustand store + persist localStorage
    ├── seed.ts             # Data contoh (produk & PO)
    └── format.ts           # Format Rupiah & tanggal Indonesia
```

## Data & Penyimpanan

- Data tersimpan di `localStorage` kunci `tokokita-data` (zustand persist).
- Saat pertama dijalankan, aplikasi mengisi **data contoh**: 13 produk dan 4 PO dengan berbagai status.
- Untuk mengembalikan data awal, jalankan di console browser:

```js
localStorage.removeItem("tokokita-data");
location.reload();
```

- Karena tanpa server, data hanya ada di perangkat/browser yang dipakai. Jika nanti butuh sinkronisasi multi-perangkat, struktur store sudah siap dipindahkan ke REST API atau database (mis. Prisma + SQLite).

## Deploy ke Vercel

Cara termudah mempublikasikan aplikasi:

1. Push repo ini ke GitHub.
2. Buka [vercel.com/new](https://vercel.com/new) dan impor repo.
3. Klik **Deploy** — tanpa konfigurasi tambahan.

## Roadmap Ide Pengembangan

- [ ] Login admin (NextAuth) untuk multi-pengguna
- [ ] Ekspor PO ke PDF / Excel
- [ ] Statistik penjualan mingguan (grafik)
- [ ] Kamera untuk foto produk langsung dari HP
- [ ] Sinkronisasi ke database (Supabase / Prisma)

## Lisensi

Dirilis dengan [Lisensi MIT](LICENSE) — bebas digunakan dan dikembangkan.
