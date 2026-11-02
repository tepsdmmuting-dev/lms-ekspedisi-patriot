# Panduan Setup Server Offline Lokal (Windows) - LMS Ekspedisi Patriot

Panduan ini ditujukan untuk menginstal dan menjalankan aplikasi **LMS Ekspedisi Patriot** sebagai **Local Server Offline** di komputer sekolah berbasis sistem operasi **Windows 10 / 11**.

Setelah server ini aktif, seluruh komputer siswa, laptop guru, dan tablet yang terhubung ke jaringan Wi-Fi / kabel LAN sekolah dapat mengakses aplikasi secara cepat tanpa memerlukan koneksi internet luar.

---

## Spesifikasi Minimum Komputer Server
- **Sistem Operasi**: Windows 10 / 11 (64-bit)
- **RAM**: Minimal 4 GB (Disarankan 8 GB atau lebih jika diakses banyak siswa)
- **Jaringan**: Terhubung ke Router Wi-Fi atau Switch LAN sekolah (tidak perlu koneksi internet)
- **Penyimpanan**: Minimal 10-20 GB sisa ruang kosong (tergantung banyaknya file video materi lokal yang diupload)

---

## Langkah 1: Persiapan Software (Hanya 1x Saja)

### 1.1. Install Node.js (LTS)
1. Unduh installer **Node.js LTS** untuk Windows dari website resmi: [https://nodejs.org/](https://nodejs.org/)
2. Jalankan file `.msi` yang telah diunduh, klik **Next** hingga selesai (biarkan settingan default).

### 1.2. Install PostgreSQL Database
1. Unduh installer **PostgreSQL for Windows** (versi 14, 15, atau 16) dari: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Jalankan installer:
   - Saat diminta password untuk user `postgres`, masukkan password (misalnya: `postgres` atau password pilihan sekolah). **Catat password ini.**
   - Port default: `5432` (biarkan default).
   - Klik Next hingga selesai.
3. Buka aplikasi **pgAdmin 4** (otomatis terinstall bersama PostgreSQL):
   - Klik kanan pada menu **Databases** -> **Create** -> **Database...**
   - Beri nama database: `ekspedisi_patriot`
   - Klik **Save**.
4. Import Struktur Tabel:
   - Klik kanan pada database `ekspedisi_patriot` -> pilih **Query Tool**.
   - Buka file `schema.sql` yang ada di folder project ini, lalu salin (*copy*) seluruh isinya ke Query Tool.
   - Klik tombol **Execute / Run** (ikon Play segitiga atau tekan tombol `F5`).
   - Selesai! Seluruh tabel, role, kuis, dan akun default sudah terpasang.

---

## Langkah 2: Konfigurasi File Lingkungan (.env)

Masuk ke folder `backend/`, buat atau periksa file `.env`:

```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=password_postgres_kamu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ekspedisi_patriot
JWT_SECRET=rahasia_sekolah_ekspedisi_patriot_12345
```
> Ganti `DB_PASSWORD` sesuai dengan password yang Anda buat saat instalasi PostgreSQL di Langkah 1.2.

---

## Langkah 3: Install Dependensi & Build Frontend

Buka **Command Prompt (CMD)** atau **PowerShell** sebagai Administrator, lalu arahkan ke folder project:

1. **Install dependensi Backend**:
   ```cmd
   cd backend
   npm install
   cd ..
   ```

2. **Install & Build Frontend**:
   ```cmd
   cd frontend
   npm install
   npm run build
   cd ..
   ```
   > Begitu folder `frontend/dist` terbentuk, backend Express otomatis berjalan dalam mode **Single-Port**. Artinya Anda **tidak perlu** menjalankan Vite, backend akan langsung menyajikan halaman web, API, database, video lokal, dan gambar kuis dalam 1 port saja (port 5000)!

---

## Langkah 4: Buka Port di Firewall Windows

Agar komputer siswa dan guru di jaringan sekolah diizinkan mengakses server ini:

1. Buka **Control Panel** -> **Windows Defender Firewall** -> klik **Advanced settings** di sebelah kiri.
2. Klik **Inbound Rules** di panel kiri, lalu klik **New Rule...** di panel kanan.
3. Pilih **Port**, lalu klik **Next**.
4. Pilih **TCP**, dan pada **Specific local ports**, ketik: `5000`
5. Klik **Next**, pilih **Allow the connection**, lalu klik **Next**.
6. Centang semua (Domain, Private, Public), klik **Next**.
7. Beri nama: `LMS Ekspedisi Patriot (Port 5000)`, lalu klik **Finish**.

---

## Langkah 5: Menjalankan Server (Cukup 1 Klik!)

Di dalam folder project, kami telah menyediakan file:
```
START_SERVER_WINDOWS.bat
```

Cukup **Double Click** (klik dua kali) file `START_SERVER_WINDOWS.bat`:
1. Skrip akan mendeteksi otomatis alamat IP komputer server di jaringan sekolah (misalnya `192.168.1.50`).
2. Server backend dan web offline akan langsung aktif.
3. Jendela hitam tersebut **jangan ditutup** selama jam pembelajaran berlangsung di sekolah.

---

## Cara Siswa & Guru Mengakses

1. Pastikan perangkat siswa (HP/Laptop/Komputer Lab) tersambung ke **Wi-Fi atau kabel LAN yang sama** dengan komputer server.
2. Buka browser apa saja (Google Chrome, Microsoft Edge, Safari, Mozilla Firefox).
3. Ketik alamat IP server diikuti port 5000, contoh:
   ```
   http://192.168.1.50:5000
   ```
4. Website LMS akan langsung terbuka secara instan dan 100% offline!

---

## Fitur Offline yang Sudah Tersedia
- **Font & Icon Mandiri**: Font Poppins dan Material Icons Outlined sudah terpasang lokal di aplikasi (tidak memanggil Google Fonts di internet).
- **Video Lokal**: Video materi pembelajaran berekstensi `.mp4` dapat diunggah langsung ke sistem dan tersimpan di `backend/uploads/videos/`.
- **Modul PDF Lokal**: Dokumen buku panduan berekstensi `.pdf` tersimpan di `backend/uploads/documents/`.
- **Gambar Kuis Lokal**: Gambar pendukung soal Pre-Test & Post-Test tersimpan di `backend/uploads/images/`.
- **Ekspor / Impor Kurikulum**: Materi dan kuis dapat diekspor menjadi file `.json` lalu dipindahkan ke komputer sekolah lain tanpa internet.
