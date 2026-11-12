# StokPO Mobile Commerce

Aplikasi mobile-first untuk mengelola produk, varian ukuran/warna, stok, Purchase Order, omzet, modal, dan keuntungan. Proyek memakai **Capacitor 7** agar HTML/JavaScript dapat dibangun menjadi APK Android melalui GitHub Actions.

## Isi proyek

- `www/index.html` - aplikasi utama
- `www/manifest.webmanifest` dan `www/sw.js` - PWA/offline shell
- `capacitor.config.json` - konfigurasi Capacitor
- `.github/workflows/build-android.yml` - build APK otomatis
- `.github/workflows/deploy-pages.yml` - preview GitHub Pages

## Upload ke GitHub

1. Buat repository baru, misalnya `stokpo-app`.
2. Ekstrak ZIP ini.
3. Upload seluruh isi folder ke root repository, termasuk folder `.github`.
4. Gunakan branch `main`.
5. Buka tab **Actions** dan pilih **Build Android APK**.
6. Klik **Run workflow**.
7. Setelah selesai, buka hasil workflow lalu unduh artifact `StokPO-debug-apk`.
8. Ekstrak artifact untuk mendapatkan `app-debug.apk`.

## Preview web

Aktifkan GitHub Pages melalui **Settings > Pages > Source: GitHub Actions**. Workflow `Deploy Web Preview` akan menerbitkan isi folder `www`.

## Build lokal

Persyaratan: Node.js 20+, Java 21, dan Android SDK.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Catatan produksi

Workflow saat ini menghasilkan **debug APK** untuk pengujian/sideload. Untuk Google Play, buat Android App Bundle (`bundleRelease`) dan simpan keystore sebagai GitHub Actions Secrets. Jangan commit file `.jks` atau password ke repository.

## Data

Prototype menyimpan data di `localStorage` pada perangkat. Untuk penggunaan multi-user/produksi, ganti penyimpanan dengan Supabase/PostgreSQL atau Firebase dan tambahkan autentikasi.
