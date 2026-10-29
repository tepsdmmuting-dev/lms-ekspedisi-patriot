@echo off
title Ekspedisi Patriot - Server LMS Offline
chcp 65001 >nul
cls

echo =====================================================================
echo           EKSPEDISI PATRIOT - SERVER LMS OFFLINE SEKOLAH             
echo =====================================================================
echo.
echo [1/4] Mendeteksi Alamat IP Lokal (LAN / Wi-Fi)...

set LOCAL_IP=127.0.0.1
for /f "tokens=4" %%a in ('route print 0.0.0.0 2^>nul ^| findstr /c:" 0.0.0.0"') do (
    if not "%%a"=="" set LOCAL_IP=%%a
)

echo.
echo =====================================================================
echo   PANDUAN AKSES UNTUK KOMPUTER SERVER DAN SISWA DI LAB
echo =====================================================================
echo   [+] Akses di Komputer Ini (Server):
echo       http://localhost:5123
echo.
echo   [+] Akses untuk Siswa / Gadget di Jaringan Lab:
echo       http://%LOCAL_IP%:5123
echo.
echo   Catatan:
echo   - Pastikan laptop/PC siswa terhubung ke Wi-Fi / Router Lab yang sama.
echo   - Siswa TIDAK memerlukan kuota internet.
echo =====================================================================
echo.

echo [2/4] Memeriksa Instalasi Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan install Node.js terlebih dahulu (versi 18 ke atas).
    pause
    exit /b 1
)

echo [3/4] Menyiapkan Direktori Media Offline...
if not exist "backend\uploads\videos" mkdir "backend\uploads\videos"
if not exist "backend\uploads\documents" mkdir "backend\uploads\documents"

echo [4/4] Memulai Server LMS Ekspedisi Patriot...
echo.
echo Server sedang berjalan... Jangan tutup jendela terminal ini!
echo Menghubungkan browser dalam 3 detik...

timeout /t 2 >nul 2>nul
start "" http://localhost:5123

cd backend
node server.js

pause
