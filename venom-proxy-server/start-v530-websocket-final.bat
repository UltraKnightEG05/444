@echo off
title Venom v5.3.0 WebSocket Fix - Final
color 0A

echo.
echo ================================================
echo    Venom v5.3.0 WebSocket Fix - Final
echo    حل نهائي لخطأ WebSocket
echo ================================================
echo.

REM التحقق من Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت
    echo 💡 حمل Node.js من: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js متوفر: 
node --version

REM التحقق من Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo ✅ Chrome متوفر
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo ✅ Chrome متوفر
) else (
    echo ❌ Chrome غير مثبت
    echo 💡 حمل Chrome من: https://www.google.com/chrome/
    pause
    exit /b 1
)

REM إغلاق العمليات السابقة
echo.
echo 🛑 إغلاق العمليات السابقة...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 5 >nul

echo ✅ تم إغلاق العمليات السابقة

REM تنظيف شامل
echo 🧹 تنظيف شامل...
if exist tokens rmdir /s /q tokens >nul 2>&1
if exist logs\*.log del /q logs\*.log >nul 2>&1
if exist logs\qr-code-*.png del /q logs\qr-code-*.png >nul 2>&1

mkdir tokens >nul 2>&1
mkdir logs >nul 2>&1

echo ✅ تم التنظيف

REM تطبيق إصلاح WebSocket
echo 🔧 تطبيق إصلاح WebSocket لـ v5.3.0...
npm install venom-bot@5.3.0 puppeteer@19.11.1 ws@8.14.2 puppeteer-extra@3.3.6 --save

REM تعيين متغيرات البيئة لحل WebSocket
set PUPPETEER_DISABLE_WEBSOCKET=true
set WEBSOCKET_FIX_ENABLED=true
set NODE_OPTIONS=--max-old-space-size=4096
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

echo.
echo 🚀 تشغيل venom v5.3.0 مع حل WebSocket النهائي...
echo 🔧 مع الإصلاح النهائي لخطأ WebSocket
echo 🌍 مع Cloudflare Tunnel التلقائي
echo 🆔 Tunnel ID: 9752631e-8b0d-48a8-b9c1-20f376ce578f
echo.
echo ⏳ انتظر ظهور QR Code (قد يستغرق 2-3 دقائق مع v5.3.0)
echo 📱 امسح QR Code بهاتفك عند ظهوره
echo 🌍 الخادم سيكون متاح على: https://api.go4host.net
echo 🏠 والمحلي على: http://localhost:3002
echo.

REM تشغيل النظام مع Tunnel
npm run start:tunnel:ultimate

echo.
echo 🛑 تم إيقاف النظام
pause