@echo off
title SASTRA - Staf Asisten Guru Berbasis Agentic AI
echo =========================================================================
echo               SASTRA: Student Assessment, Tracker, and Report Assistance
echo      Diselaraskan dengan Standar Kurikulum Permendikdasmen No. 13 Tahun 2025
echo =========================================================================
echo.
echo Menjalankan Backend FastAPI dan Frontend Vite...
echo.

start "SASTRA Backend API" cmd /k "python backend\run.py"
timeout /t 2 >nul
start "SASTRA Frontend UI" cmd /k "cd frontend && npm run dev"

echo Backend berjalan di: http://127.0.0.1:8000
echo Frontend berjalan di: http://127.0.0.1:3000
echo.
echo Tekan tombol apa saja untuk keluar dari jendela ini (server tetap berjalan).
pause >nul
