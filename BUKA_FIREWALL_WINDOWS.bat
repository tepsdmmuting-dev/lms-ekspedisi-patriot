@echo off
cd /d "%~dp0"
title Buka Firewall Windows - LMS Ekspedisi Patriot
color 0B

:: Cek hak akses Administrator
net session >nul 2>&1
if %errorlevel% equ 0 goto :is_admin

echo ===================================================================
echo     BUKA PORT FIREWALL WINDOWS - LMS EKSPEDISI PATRIOT
echo ===================================================================
echo.
echo Meminta izin Administrator agar HP dan laptop siswa di Wi-Fi bisa
echo mengakses server LMS ini...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
if %errorlevel% neq 0 goto :err_uac
exit /b 0

:err_uac
color 0C
echo [ERROR] Gagal meminta izin Administrator secara otomatis.
echo Silakan Klik Kanan file BUKA_FIREWALL_WINDOWS.bat lalu pilih:
echo   Run as administrator
echo.
pause
exit /b 1

:is_admin
cls
color 0B
echo ===================================================================
echo     MEMBUKA PORT FIREWALL WINDOWS - LMS EKSPEDISI PATRIOT
echo ===================================================================
echo.

set CUSTOM_PORT=
if exist "backend\.env" for /f "tokens=2 delims==" %%a in ('findstr /b "PORT=" "backend\.env" 2^>nul') do set CUSTOM_PORT=%%a
if not "%CUSTOM_PORT%"=="" set CUSTOM_PORT=%CUSTOM_PORT: =%

set DISPLAY_PORT=%CUSTOM_PORT%
if "%DISPLAY_PORT%"=="" set DISPLAY_PORT=5000

set FW_PORTS=5000,5123,3000
if "%CUSTOM_PORT%"=="" goto :apply_rule
if "%CUSTOM_PORT%"=="5000" goto :apply_rule
if "%CUSTOM_PORT%"=="5123" goto :apply_rule
if "%CUSTOM_PORT%"=="3000" goto :apply_rule
set FW_PORTS=%FW_PORTS%,%CUSTOM_PORT%

:apply_rule
echo Menghapus aturan firewall lama jika ada...
netsh advfirewall firewall delete rule name="LMS Ekspedisi Patriot" >nul 2>&1

echo Menambahkan aturan firewall untuk port TCP: %FW_PORTS% ...
netsh advfirewall firewall add rule name="LMS Ekspedisi Patriot" dir=in action=allow protocol=TCP localport=%FW_PORTS% profile=any enable=yes
if %errorlevel% neq 0 goto :err_fw

color 0A
echo.
echo ===================================================================
echo [OK] FIREWALL WINDOWS BERHASIL DIBUKA!
echo.
echo Port yang diizinkan : %FW_PORTS% (TCP Inbound)
echo Profil Jaringan     : Domain, Private, dan Public (Wi-Fi / LAN)
echo.
echo Langkah selanjutnya:
echo 1. Jalankan START_SERVER_WINDOWS.bat
echo 2. Di browser HP, ketik http://IP_WIFI_SERVER:%DISPLAY_PORT%
echo    sesuai alamat [Wi-Fi] yang tampil di terminal server.
echo ===================================================================
echo.
pause
exit /b 0

:err_fw
color 0C
echo.
echo [ERROR] Gagal menambahkan aturan Firewall Windows.
echo Pastikan Anda menjalankan file ini sebagai Administrator.
echo.
pause
exit /b 1
