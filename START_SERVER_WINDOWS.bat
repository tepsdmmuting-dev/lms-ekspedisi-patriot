@echo off
chcp 65001 >nul
title Ekspedisi Patriot LMS - Server Offline Sekolah
color 0B

echo ===================================================================
echo     EKSPEDISI PATRIOT LMS - LOCAL SERVER SEKOLAH (OFFLINE)
echo ===================================================================
echo.

:: 1. Cek Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js belum terinstall di komputer ini!
    echo Silakan unduh dan install Node.js LTS terlebih dahulu dari:
    echo        https://nodejs.org/
    echo Setelah instalasi Node.js selesai, buka kembali file ini.
    echo.
    pause
    exit /b
)

:: 2. Cek file konfigurasi backend\.env
if not exist "backend\.env" (
    echo [INFO] Menyiapkan file konfigurasi database backend\.env...
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] File backend\.env berhasil dibuat dari template.
    ) else (
        (
            echo PORT=5000
            echo DB_USER=postgres
            echo DB_PASSWORD=postgres
            echo DB_HOST=localhost
            echo DB_PORT=5432
            echo DB_NAME=ekspedisi_patriot
            echo JWT_SECRET=rahasia_sekolah_ekspedisi_patriot_12345
        ) > "backend\.env"
        echo [OK] File backend\.env dibuat dengan konfigurasi default.
    )
    echo (CATATAN: Jika password PostgreSQL Anda bukan "postgres", silakan sesuaikan di file backend\.env)
    echo.
)

:: 3. Cek dependensi backend (node_modules)
if not exist "backend\node_modules" (
    color 0E
    echo [INFO] Modul backend belum terpasang. Mengunduh dependensi backend...
    echo (Pastikan terhubung internet sebentar untuk proses download ini)
    echo.
    cd backend
    call npm install
    cd ..
    echo [OK] Dependensi backend selesai dipasang!
    echo.
)

:: 4. Cek apakah folder frontend/dist sudah ada
if not exist "frontend\dist\index.html" (
    color 0E
    echo [INFO] Build frontend offline belum ditemukan.
    echo Sedang memproses kompilasi web offline (hanya 1x)...
    echo.
    cd frontend
    if not exist "node_modules" (
        echo Mengunduh dependensi frontend...
        call npm install
    )
    echo Mem-build tampilan web frontend...
    call npm run build
    cd ..
    echo.
    echo [OK] Tampilan web offline berhasil dikompilasi!
    echo.
)

:: 5. Deteksi IP Komputer Server di Jaringan Sekolah
set SERVER_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
    set SERVER_IP=%%a
    goto :found_ip
)
:found_ip
:: Hapus spasi di awal string
set SERVER_IP=%SERVER_IP: =%

color 0A
echo ===================================================================
echo [STATUS] SERVER OFFLINE SIAP DIGUNAKAN!
echo.
echo Komputer ini sekarang bertindak sebagai SERVER OFFLINE sekolah.
echo Siswa, guru, dan admin di jaringan WiFi / LAN sekolah dapat
echo membuka browser (Chrome / Edge / Firefox) dan mengetik alamat:
echo.
echo        >>>  http://%SERVER_IP%:5000  <<<
echo.
echo Atau jika dibuka langsung dari komputer server ini:
echo        >>>  http://localhost:5000  <<<
echo ===================================================================
echo.
echo Menjalankan aplikasi backend & web...
echo JANGAN TUTUP jendela ini selama jam pembelajaran berlangsung.
echo (Untuk mematikan server, tekan Ctrl+C atau tutup jendela ini)
echo.

cd backend
node server.js

pause
