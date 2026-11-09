@echo off
cd /d "%~dp0"
title Ekspedisi Patriot LMS - Local Server Offline
color 0B
cls

echo ===================================================================
echo     EKSPEDISI PATRIOT LMS - LOCAL SERVER SEKOLAH [OFFLINE]
echo ===================================================================
echo.

:: 1. Cek Node.js
where node >nul 2>nul
if %errorlevel% neq 0 goto :no_node
goto :check_dirs

:no_node
color 0C
echo [ERROR] Node.js belum terinstall di komputer ini!
echo Silakan unduh dan install Node.js LTS dari: https://nodejs.org/
echo Setelah install selesai, jalankan kembali file ini.
echo.
pause
exit /b 1

:check_dirs
if not exist "backend\uploads\videos" mkdir "backend\uploads\videos"
if not exist "backend\uploads\documents" mkdir "backend\uploads\documents"
if not exist "backend\uploads\images" mkdir "backend\uploads\images"

:: 2. Cek file konfigurasi backend\.env
if exist "backend\.env" goto :read_port
echo [INFO] Menyiapkan file konfigurasi database backend\.env...
if exist "backend\.env.example" goto :copy_env
echo PORT=5000> "backend\.env"
echo DB_USER=postgres>> "backend\.env"
echo DB_PASSWORD=postgres>> "backend\.env"
echo DB_HOST=localhost>> "backend\.env"
echo DB_PORT=5432>> "backend\.env"
echo DB_NAME=ekspedisi_patriot>> "backend\.env"
echo JWT_SECRET=rahasia_sekolah_ekspedisi_patriot_12345>> "backend\.env"
echo [OK] File backend\.env dibuat dengan konfigurasi default.
goto :env_done

:copy_env
copy "backend\.env.example" "backend\.env" >nul
echo [OK] File backend\.env berhasil dibuat dari template.

:env_done
echo [CATATAN] Jika password PostgreSQL Anda bukan "postgres", silakan ubah DB_PASSWORD di file backend\.env
echo.

:read_port
set SERVER_PORT=5000
for /f "tokens=2 delims==" %%a in ('findstr /b "PORT=" "backend\.env" 2^>nul') do set SERVER_PORT=%%a
set SERVER_PORT=%SERVER_PORT: =%
if "%SERVER_PORT%"=="" set SERVER_PORT=5000

:: 3. Cek dependensi backend
if exist "backend\node_modules" goto :check_frontend
color 0E
echo [INFO] Modul backend belum terpasang. Mengunduh dependensi backend...
echo [INFO] Pastikan komputer terhubung internet sebentar untuk proses instalasi ini.
echo.
cd backend
call npm install
if %errorlevel% neq 0 goto :err_backend_npm
cd ..
echo [OK] Dependensi backend selesai dipasang!
echo.
goto :check_frontend

:err_backend_npm
cd ..
color 0C
echo.
echo [ERROR] Gagal menginstall dependensi backend! Periksa koneksi internet Anda.
echo.
pause
exit /b 1

:check_frontend
:: 4. Cek build frontend offline
if exist "frontend\dist\index.html" goto :detect_ip
color 0E
echo [INFO] Build frontend offline belum ditemukan.
echo [INFO] Sedang memproses kompilasi web offline - hanya 1x...
echo.
cd frontend
if exist "node_modules" goto :build_fe_now
echo Mengunduh dependensi frontend...
call npm install
if %errorlevel% neq 0 goto :err_fe_npm

:build_fe_now
echo Mem-build tampilan web frontend...
call npm run build
if %errorlevel% neq 0 goto :err_fe_build
cd ..
echo.
echo [OK] Tampilan web offline berhasil dikompilasi!
echo.
goto :detect_ip

:err_fe_npm
cd ..
color 0C
echo.
echo [ERROR] Gagal menginstall dependensi frontend! Periksa koneksi internet Anda.
echo.
pause
exit /b 1

:err_fe_build
cd ..
color 0C
echo.
echo [ERROR] Gagal mem-build frontend!
echo.
pause
exit /b 1

:detect_ip
:: 5. Deteksi IP Komputer Server di Jaringan Sekolah
set SERVER_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set SERVER_IP=%%a
    goto :found_ip
)
:found_ip
set SERVER_IP=%SERVER_IP: =%

color 0A
echo ===================================================================
echo [STATUS] SERVER OFFLINE SIAP DIGUNAKAN!
echo.
echo Komputer ini sekarang bertindak sebagai SERVER OFFLINE sekolah.
echo Siswa, guru, dan admin di jaringan WiFi / LAN sekolah dapat
echo membuka browser dan mengetik alamat:
echo.
echo        http://%SERVER_IP%:%SERVER_PORT%
echo.
echo Atau jika dibuka langsung dari komputer server ini:
echo        http://localhost:%SERVER_PORT%
echo ===================================================================
echo.
echo Menjalankan server LMS...
echo JANGAN TUTUP jendela ini selama jam pembelajaran berlangsung.
echo Untuk mematikan server, tekan Ctrl+C atau tutup jendela ini.
echo.

cd backend
node server.js

echo.
color 0C
echo ===================================================================
echo [PERINGATAN] Server berhenti atau gagal dijalankan!
echo Periksa pesan error di atas. Hal yang sering terjadi:
echo  1. PostgreSQL Service belum aktif atau belum terinstall.
echo  2. Database "ekspedisi_patriot" belum dibuat di pgAdmin.
echo  3. Password DB_PASSWORD di file backend\.env salah.
echo  4. Port %SERVER_PORT% sedang dipakai aplikasi lain.
echo ===================================================================
echo.
pause
