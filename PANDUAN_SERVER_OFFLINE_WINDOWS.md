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

### 1.1. Download Repository dari GitHub
1. Di komputer server sekolah, buka browser dan buka URL repositori:
   `https://github.com/tepsdmmuting-dev/lms-ekspedisi-patriot`
2. Klik tombol hijau **Code** -> pilih **Download ZIP**.
3. Ekstrak file ZIP tersebut ke direktori yang Anda inginkan (misalnya di `C:\LMS_Ekspedisi_Patriot`).

### 1.2. Install Node.js (LTS)
1. Unduh installer **Node.js LTS** untuk Windows dari website resmi: [https://nodejs.org/](https://nodejs.org/)
2. Jalankan file `.msi` yang telah diunduh, klik **Next** hingga selesai (biarkan settingan default).

### 1.3. Install PostgreSQL Database
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

## Langkah 4: Buka Port di Firewall Windows (Hanya 1x Saja)

Secara default, **Windows Defender Firewall** memblokir akses dari HP/laptop lain pada jaringan Wi-Fi (terutama jika Wi-Fi terbaca sebagai *Public Network*). Agar HP dan komputer siswa di Wi-Fi yang sama bisa mengakses server ini:

### Cara Otomatis (1 Klik — Disarankan)
1. Cari file **`BUKA_FIREWALL_WINDOWS.bat`** di folder project ini.
2. **Double Click** (atau Klik Kanan -> **Run as administrator**) -> klik **Yes** pada jendela konfirmasi Administrator.
3. Tunggu hingga muncul pesan `[OK] FIREWALL WINDOWS BERHASIL DIBUKA!` lalu tekan sembarang tombol.

### Cara Manual (Alternatif)
1. Buka **Control Panel** -> **Windows Defender Firewall** -> klik **Advanced settings** di sebelah kiri.
2. Klik **Inbound Rules** di panel kiri, lalu klik **New Rule...** di panel kanan.
3. Pilih **Port**, lalu klik **Next**.
4. Pilih **TCP**, dan pada **Specific local ports**, ketik: `5000, 5123, 3000`
5. Klik **Next**, pilih **Allow the connection**, lalu klik **Next**.
6. Centang semua (**Domain**, **Private**, dan **Public**), klik **Next**.
7. Beri nama: `LMS Ekspedisi Patriot`, lalu klik **Finish**.

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
3. Ketik alamat IP server berlabel **`[Wi-Fi]`** atau **`[Ethernet]`** yang muncul di jendela terminal server, diawali dengan `http://` dan diikuti port server (default `:5000`), contoh:
   ```
   http://192.168.1.50:5000
   ```
4. Website LMS akan langsung terbuka secara instan dan 100% offline!

---

## Troubleshooting: Tidak Bisa Diakses dari HP (Padahal Wi-Fi Sama)

Jika website bisa dibuka di laptop server (`http://localhost:5000`), tetapi **gagal / loading terus di HP**, periksa 5 hal berikut:

1. **Windows Firewall masih memblokir (Penyebab Paling Sering):**
   - Jalankan file **`BUKA_FIREWALL_WINDOWS.bat`** (klik **Yes** saat diminta izin Administrator). Ini otomatis mengizinkan koneksi masuk dari Wi-Fi walaupun status Wi-Fi di Windows adalah *Public Network*.
2. **Salah memilih IP Adapter Virtual (VirtualBox / VMware / WSL):**
   - Jika komputer server memiliki VirtualBox/WSL/Docker, IP `192.168.56.1` atau `172.x.x.x` BUKAN IP Wi-Fi.
   - Lihat baris log terminal server yang berlabel **`[Wi-Fi]`** atau **`[Wireless LAN]`**, gunakan IP tersebut di HP.
3. **Browser HP otomatis memakai `https://` atau mengetik `localhost`:**
   - Di HP **jangan** ketik `localhost`, dan pastikan awalan URL adalah **`http://`** (bukan `https://`), misalnya `http://192.168.1.50:5000`.
4. **Cek Port Server (`backend/.env`):**
   - Default mode Windows offline memakai port **`5000`**. Jika Anda mengubah `PORT=` di `backend/.env` (misalnya `5123`), sesuaikan port di belakang alamat IP (`http://192.168.1.50:5123`).
   - Jika menjalankan mode development manual (`npm run dev`), akses dari HP ke port **`3000`** (Vite), bukan `5123`.
5. **Fitur *AP Isolation / Client Isolation* pada Router Wi-Fi / Hotspot:**
   - Beberapa router Wi-Fi publik, *Guest Wi-Fi*, atau hotspot tertentu mengaktifkan fitur **AP Isolation / Client Isolation** yang melarang sesama HP/laptop di Wi-Fi saling terhubung.
   - Solusi: Sambungkan melalui Wi-Fi utama (bukan *Guest*), matikan *Client/AP Isolation* di pengaturan router, atau ubah profil Wi-Fi di Windows menjadi *Private Network*.

---

## Kredensial Login Admin Default (Instalasi Baru dari GitHub)

Jika Anda baru pertama kali memasang database dari GitHub (`schema.sql` atau database kosong baru), sistem otomatis menyiapkan akun Administrator bawaan:

- **Email**: `admin@ep.gov.id`
- **Password**: `password123`

*(Sedangkan akun contoh siswa/peserta: `budi@trainee.id` / password: `password123`)*

> **Tips Keamanan:** Setelah berhasil masuk ke Dashboard Admin, segera ubah kata sandi bawaan ini melalui tombol **"Ubah Password Admin"** di pojok kiri bawah atau di menu **Manajemen User**.

---

## Fitur Offline yang Sudah Tersedia
- **Font & Icon Mandiri**: Font Poppins dan Material Icons Outlined sudah terpasang lokal di aplikasi (tidak memanggil Google Fonts di internet).
- **Video Lokal**: Video materi pembelajaran berekstensi `.mp4` dapat diunggah langsung ke sistem dan tersimpan di `backend/uploads/videos/`.
- **Modul PDF Lokal**: Dokumen buku panduan berekstensi `.pdf` tersimpan di `backend/uploads/documents/`.
- **Gambar Kuis Lokal**: Gambar pendukung soal Pre-Test & Post-Test tersimpan di `backend/uploads/images/`.
- **Ekspor / Impor Kurikulum**: Materi dan kuis dapat diekspor menjadi file `.json` lalu dipindahkan ke komputer sekolah lain tanpa internet.

