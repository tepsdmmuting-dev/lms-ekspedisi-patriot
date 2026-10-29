#!/bin/bash

# Clear terminal
clear

echo "====================================================================="
echo "          EKSPEDISI PATRIOT - SERVER LMS OFFLINE SEKOLAH             "
echo "====================================================================="
echo ""

# Find LAN IP address
IP_LAN="127.0.0.1"
if [[ "$OSTYPE" == "darwin"* ]]; then
  IP_LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
else
  IP_LAN=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
fi

echo "[1/4] Alamat IP Lokal Terdeteksi: $IP_LAN"
echo ""
echo "====================================================================="
echo "  PANDUAN AKSES UNTUK KOMPUTER SERVER DAN SISWA DI LAB"
echo "====================================================================="
echo "  [+] Akses di Komputer Ini (Server):"
echo "      http://localhost:5123"
echo ""
echo "  [+] Akses untuk Siswa / Gadget di Jaringan Lab:"
echo "      http://$IP_LAN:5123"
echo ""
echo "  Catatan:"
echo "  - Pastikan komputer siswa terhubung ke Wi-Fi / Switch Lab yang sama."
echo "  - Siswa TIDAK membutuhkan kuota internet untuk membuka modul/video."
echo "====================================================================="
echo ""

echo "[2/4] Memeriksa Direktori Media Offline..."
mkdir -p backend/uploads/videos
mkdir -p backend/uploads/documents

echo "[3/4] Memastikan Build Frontend Tersedia..."
if [ ! -d "frontend/dist" ]; then
  echo "Mengompilasi aset frontend..."
  cd frontend && npm run build && cd ..
fi

echo "[4/4] Memulai Server LMS Ekspedisi Patriot di Port 5123..."
echo ""
echo "Membuka browser otomatis..."

# Open browser
if which open >/dev/null; then
  (sleep 2 && open "http://localhost:5123") &
elif which xdg-open >/dev/null; then
  (sleep 2 && xdg-open "http://localhost:5123") &
fi

cd backend
node server.js
