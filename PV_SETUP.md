# Rooftop PV Studio — pemasangan di myweb

## Isi perubahan

- `index.html`: tautan PV Simulator di navigasi dan tombol yang juga terlihat pada ponsel.
- `pv/`: editor 3D statis, katalog CEC, konfigurasi API, dan hasil simulasi.
- `pv-backend/`: Python/FastAPI, mesin `pv.py` dari BASICPYSAM yang diadaptasi, database CEC, dan EPW pengguna.
- `render.yaml`: konfigurasi backend Render Free.

Website utama tetap HTML statis. Tidak menggunakan Streamlit, BESS, atau NSGA-II.

## 1. Masukkan perubahan ke GitHub

Paket ini berisi hanya file baru/berubah. Salin ke repository `acprakthse/myweb` dan commit. `index.html` dibuat berdasarkan snapshot repository ketika pekerjaan dimulai; jika homepage sudah berubah, tambahkan tautan `pv/` secara manual agar perubahan terbaru tidak tertimpa.

Backend Python di folder repository tidak dijalankan oleh GitHub Pages. GitHub Pages hanya menyajikan frontend.

## 2. Deploy backend gratis di Render

1. Masuk ke https://dashboard.render.com/ dan hubungkan repository `acprakthse/myweb`.
2. Pilih **New → Blueprint**, lalu pilih repository/branch yang berisi perubahan. Render membaca `render.yaml`.
3. Pastikan layanan menggunakan **Free**, runtime **Docker**, dan root directory **pv-backend**.
4. Alternatif pembuatan manual: **New → Web Service**, repository yang sama, root directory `pv-backend`, runtime Docker, paket Free, health check `/health`.
5. Atur `ALLOWED_ORIGINS` menjadi `https://ardiancandra.com,https://www.ardiancandra.com,https://acprakthse.github.io` (tanpa spasi). Tambahkan origin lain hanya jika dipakai.
6. Tunggu deployment selesai. Salin URL layanan HTTPS dari Render. Nama URL belum diketahui sampai layanan dibuat.
7. Buka `<URL layanan>/health`; hasil harus memuat `status: ok` dan `PySAM Pvsamv1`.

`Dockerfile` menyediakan Python 3.12 dan versi NREL-PySAM yang diuji. API memakai satu worker dan satu slot simulasi, sehingga permintaan bersamaan menerima 429 dan dapat dicoba ulang.

Render Free dapat tidur, memiliki kuota penggunaan, dan tidak menyimpan file runtime secara permanen. Paket ini mengembalikan hasil langsung, tanpa database hasil di server. Performa/memori di instance Render belum diuji. Referensi: https://render.com/docs/free

## 3. Hubungkan editor

Edit `pv/config.js`:

```js
export const API_BASE = 'https://URL-LAYANAN-DARI-RENDER';
```

Gunakan URL nyata dari dashboard, lalu commit. Setelah GitHub Pages selesai deploy, buka `https://ardiancandra.com/pv/`.

Untuk percobaan tanpa commit konfigurasi, buka **Koneksi simulator** pada editor, tempel URL backend, dan tekan **Periksa koneksi**. Pengaturan ini hanya berlaku untuk browser tersebut. Konfigurasi `API_BASE` yang tidak kosong menjadi pengaturan utama untuk semua pengunjung.

## 4. Coba lokal / Anaconda

Terminal pertama:

```bash
conda create -n rooftop-pv python=3.12
conda activate rooftop-pv
cd myweb/pv-backend
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

Terminal kedua, dari folder `myweb`:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000/pv/` dan isi koneksi `http://localhost:8001`. Jangan membuka HTML langsung lewat `file://`, karena katalog dan ES modules memerlukan server HTTP. Three.js versi 0.169.0 diambil dari jsDelivr, sehingga tampilan 3D membutuhkan internet dan WebGL.

## Model dan batas teknis

- Atap: persegi panjang datar, satu kemiringan, atau pelana simetris. Dimensi atap memakai proyeksi horizontal; jarak tepi pada atap miring diukur sepanjang bidang atap.
- Atap miring: panel mengikuti bidang atap. Atap datar: sudut input adalah tilt panel; baris mengikuti arah azimut panel.
- Azimut searah jarum jam dari utara: 0° N, 90° E, 180° S, 270° W. Bidang kedua pelana berlawanan 180°.
- Modul diisi berurutan dalam string penuh pada setiap bidang. Sisa posisi tidak dipasang. Geometry dihitung ulang di backend, bukan mempercayai jumlah dari browser.
- Setiap bidang menggunakan **kelompok inverter independen** dengan jumlah inverter yang diinput. Dua bidang berarti dua kelompok. AC tiap kelompok dijumlahkan setelah clipping masing-masing dihitung PySAM. Ini bukan arsitektur inverter bersama untuk dua orientasi.
- CEC STC dipakai untuk kapasitas nameplate; pemilihan komponen memakai nama lengkap agar tidak salah memilih varian.
- Dimensi LONGi LR5-72HPH-550M tidak ada pada CSV pengguna. Input awal 2,28 × 1,13 m adalah asumsi geometri, bukan data dimensi terverifikasi. Ubah mengikuti datasheet.
- EPW Natuna/Bali berasal dari pengguna; koordinat/lokasi di hasil berasal dari header EPW. Tidak ada pengambilan data cuaca otomatis atau pemilihan lokasi lewat peta. Hanya EPW 8.760 interval satu jam yang didukung.
- Pemeriksaan awal mencakup Voc string memakai minimum temperatur EPW, Vmp STC terhadap rentang MPPT, dan pembagian string rata per inverter. Minimum EPW bukan temperatur ekstrem untuk desain proteksi. Batas arus per MPPT, distribusi input, tegangan pada suhu sel panas, kemampuan jaringan, dan keselamatan instalasi belum divalidasi. Katalog CEC bukan bukti kompatibilitas terhadap ketentuan jaringan Indonesia.
- Tidak menghitung bayangan antarbaris, pohon, bangunan, parapet, atau mismatch akibat shading. Tampilan 3D adalah representasi geometri dan orientasi.
- GCR geometri hanya diteruskan sebagai parameter; tidak menjadikan shading aktif. Parameter thermal menggunakan default SAM, belum dikalibrasi terhadap ventilasi atap. Model monofacial.
- Rugi soiling, kabel DC dan AC dapat diubah. Default 3%, 2%, 1%; mismatch 2% dan koneksi dioda 0,5%. Rugi-rugi tidak sekadar dijumlahkan; pemodelan dilakukan SAM.
- Maksimum 3.000 modul per simulasi. Tidak ada login, unggah file pengguna, penyimpanan proyek server, model bebas polygon, atau penyuntingan panel satu per satu.
- Desain dapat diunduh sebagai JSON, dan profil produksi sebagai CSV. CSV memakai interval berurutan 1–8.760; bukan timestamp UTC.

## Verifikasi yang dilakukan

Uji API dengan PySAM nyata untuk atap datar, satu sisi, dan pelana; 8.760 output per jam; konsistensi energi bulanan/tahunan; penolakan input geometri/peralatan/string tidak valid; CORS website utama; kesesuaian perhitungan jumlah panel JS/Python; dan pemeriksaan sintaks/tautan aset.

Belum dilakukan pengujian browser visual, deployment Render, atau publikasi ke website utama.
