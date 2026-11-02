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
    echo Silakan unduh dan install Node.js LTS dari: https://nodejs.org/
    echo Setelah install selesai, buka kembali file ini.
    echo.
    pause
    exit /b
)

:: 2. Cek apakah folder frontend/dist sudah ada
if not exist "frontend\dist\index.html" (
    color 0E
    echo [INFO] Folder frontend/dist belum ditemukan.
    echo Sedang mem-build frontend agar siap untuk mode offline...
    echo.
    cd frontend
    call npm install
    call npm run build
    cd ..
    echo.
    echo [SUKSES] Frontend berhasil di-build!
    echo.
)

:: 3. Deteksi IP Komputer Server di Jaringan Sekolah
set SERVER_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
    set SERVER_IP=%%a
    goto :found_ip
)
:found_ip
:: Hapus spasi di awal string
set SERVER_IP=%SERVER_IP: =%

echo ===================================================================
echo [STATUS] Server Siap Digunakan!
echo.
echo Komputer ini bertindak sebagai Server Offline.
echo Perangkat siswa, guru, dan laptop di jaringan WiFi/LAN sekolah
echo dapat membuka browser (Chrome/Edge/Safari) dan mengetik alamat:
echo.
echo        >>>  http://%SERVER_IP%:5000  <<<
echo.
echo Atau dari komputer ini sendiri:
echo        >>>  http://localhost:5000  <<<
echo ===================================================================
echo.
echo Menjalankan backend server...
echo JANGAN TUTUP jendela ini selama aplikasi ingin digunakan di sekolah.
echo (Tekan Ctrl+C untuk mematikan server)
echo.

cd backend
node server.js

pause
