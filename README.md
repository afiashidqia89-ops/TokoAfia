# LakuKu — Aplikasi Manajemen Penjualan

Aplikasi pencatatan penjualan untuk usaha kecil (warung/toko): catat **modal (HPP)**, **keuntungan**, **jenis barang**, dan **sisa stok** — semuanya dari HP, tanpa server, tanpa internet.

Terpasang sebagai **PWA**: buka di Chrome Android → *Install app* / *Tambahkan ke layar utama*, dan LakuKu tampil seperti aplikasi biasa dengan ikon sendiri.

## ✨ Fitur

| Tab | Isi |
| --- | --- |
| **Beranda** | Ringkasan hari ini: omzet, keuntungan, jumlah transaksi, modal & untung bulan ini, nilai stok, daftar barang yang perlu restock, transaksi terakhir. |
| **Kasir** | Cari/ketuk barang → keranjang → input uang dibayar (dengan tombol cepat & hitung kembalian otomatis) → struk berisi untung per transaksi. |
| **Barang** | Kelola **jenis barang** & **kategori**: tambah, ubah (nama, kategori, satuan, harga modal, harga jual, stok minimum), hapus. Tambah stok dengan harga beli baru — modal otomatis dihitung rata-rata bergerak. |
| **Laporan** | Periode hari/7 hari/30 hari: grafik omzet vs keuntungan, barang terlaris, riwayat transaksi + batalkan transaksi (stok otomatis kembali). |

### Aturan bisnis yang sudah dijaga kode

- **Harga terkunci saat transaksi (snapshot HPP)** — ubah harga jual/modal tidak mengubah laporan transaksi lama.
- **Modal rata-rata bergerak** — restock dengan harga beli baru otomatis menyesuaikan modal per unit, jadi untung tetap akurat.
- **Operasi atomik** — penjualan, pembatalan, dan restock tersimpan dalam satu transaksi database; tidak ada stok "nyangkut" bila aplikasi tertutup tiba-tiba.
- **Kategori dikelola sendiri** — tambah/ubah nama/hapus kategori. Menghapus kategori **tidak menghapus barangnya** (barang pindah ke kategori *Lainnya*).

## 🔒 Data Anda tersimpan di HP

Semua data (barang, transaksi, stok, kategori, pengaturan) disimpan di **IndexedDB perangkat** lewat [Dexie](https://dexie.org). Tidak ada data yang dikirim ke server mana pun. Konsekuensinya:

- ✅ Bisa dipakai penuh **tanpa internet**
- ✅ Privat, 100% milik Anda
- ⚠️ Data terikat pada browser/perangkat tersebut — gunakan **Hapus Semua Data** di Pengaturan sebelum menyerahkan HP, dan hindari menghapus data situs di Chrome

## 🚀 Menjalankan Proyek

Butuh **Node.js 20.9+**.

```bash
npm install
npm run dev        # buka http://localhost:3000
```

Build produksi (hasil statis di folder `out/`):

```bash
npm run build
npx serve out      # uji hasil build
```

## ☁️ Build & Deploy dengan GitHub

Repositori ini sudah termasuk workflow **GitHub Actions** (`.github/workflows/deploy.yml`) yang otomatis mem-build dan menerbitkan aplikasi ke **GitHub Pages** setiap kali ada push ke `main`.

Langkah pertama kali:

1. **Push repo ini ke GitHub** (lihat bagian *Struktur* di bawah, atau upload file zip).
2. Di GitHub, buka **Settings → Pages** → *Build and deployment* → **Source: GitHub Actions**.
3. Selesai. Setiap push ke `main` akan ter-deploy otomatis ke:
   `https://<username>.github.io/<nama-repo>/`

> Workflow otomatis mengatur `NEXT_PUBLIC_BASE_PATH=/<nama-repo>` sehingga aset, service worker, dan ikon PWA tetap valid di subfolder. Deploy ke root domain (Vercel/Netlify/hosting sendiri) tidak butuh variabel itu.

Setelah online, buka alamatnya di Chrome Android → menu **⋮ → Install app** (atau *Tambahkan ke layar utama*) → LakuKu terpasang dengan ikonnya sendiri dan siap dipakai offline.

## 📁 Struktur Proyek

```
├── .github/workflows/deploy.yml   # Build otomatis → GitHub Pages
├── public/
│   ├── manifest.webmanifest       # Metadata PWA (nama, ikon, tema)
│   ├── sw.js                      # Service worker (cache offline)
│   └── icons/                     # Ikon aplikasi 192/512 + maskable
├── src/
│   ├── app/                       # App Router (layout + halaman utama)
│   ├── components/pos/            # UI aplikasi (Beranda/Kasir/Barang/Laporan)
│   ├── lib/
│   │   ├── db.ts                  # Dexie (IndexedDB): skema + operasi atomik
│   │   ├── types.ts               # Tipe data (Item, Transaction, Category, ...)
│   │   └── format.ts              # Format Rupiah & tanggal
│   └── store/cart.ts              # Zustand: keranjang kasir
├── next.config.ts                 # output: "export" + basePath untuk GitHub Pages
└── package.json
```

## 🧱 Teknologi

- [Next.js 16](https://nextjs.org) (App Router, output statis) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Dexie](https://dexie.org) — IndexedDB dengan transaksi atomik
- [Zustand](https://zustand.docs.pmnd.rs) — state keranjang kasir
- [Recharts](https://recharts.org) — grafik laporan
- [PWA](https://web.dev/progressive-web-apps/) — manifest + service worker

## ❓ Tanya Jawab

**Bagaimana cara mencoba tanpa data asli?**
Pengaturan → *Muat Data Contoh* (12 barang + riwayat penjualan 30 hari). *Hapus Semua Data* untuk mulai bersih.

**Kenapa untung laporan cocok dengan struk?**
Setiap transaksi menyimpan salinan harga jual & modal saat itu (snapshot), sehingga perubahan harga di kemudian hari tidak mengubah lama.

**Apakah bisa dipakai banyak HP dengan data yang sama?**
Belum. Data tersimpan lokal per perangkat; sinkronisasi antar-perangkat butuh server dan belum termasuk.

---

Dibuat untuk membantu pelaku usaha kecil mencatat jual-beli dengan mudah. Selamat berjualan! 🛒
