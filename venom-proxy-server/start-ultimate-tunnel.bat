@echo off
title Venom Proxy Ultimate + Cloudflare Tunnel
color 0A

echo.
echo ================================================
echo    Venom Proxy Ultimate v5.0.17
echo    مع Cloudflare Tunnel التلقائي
echo    حل نهائي لمشكلة getMaybeMeUser
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

REM التحقق من cloudflared
cloudflared version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cloudflared غير مثبت
    echo 💡 لتثبيت cloudflared:
    echo    winget install --id Cloudflare.cloudflared
    echo.
    echo 📋 بعد التثبيت، شغّل:
    echo    cloudflared tunnel login
    echo    cloudflared tunnel create attendance-venom
    echo    cloudflared tunnel route dns attendance-venom api.go4host.net
    pause
    exit /b 1
)

echo ✅ cloudflared متوفر: 
cloudflared version

REM إغلاق العمليات السابقة
echo.
echo 🛑 إغلاق العمليات السابقة...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 5 >nul

echo ✅ تم إغلاق العمليات السابقة

REM تنظيف سريع
echo 🧹 تنظيف سريع...
if exist tokens rmdir /s /q tokens >nul 2>&1
if exist logs\*.log del /q logs\*.log >nul 2>&1
if exist logs\qr-code-*.png del /q logs\qr-code-*.png >nul 2>&1

mkdir tokens >nul 2>&1
mkdir logs >nul 2>&1

echo ✅ تم التنظيف

echo.
echo 🚀 تشغيل النظام الكامل...
echo 🔧 مع الإصلاح النهائي لمشكلة getMaybeMeUser
echo 🌍 مع Cloudflare Tunnel التلقائي
echo.
echo ⏳ انتظر ظهور QR Code (قد يستغرق 2-3 دقائق)
echo 📱 امسح QR Code بهاتفك عند ظهوره
echo 🌍 الخادم سيكون متاح على: https://api.go4host.net
echo 🏠 والمحلي على: http://localhost:3002
echo.

REM تشغيل النظام مع Tunnel
npm run start:tunnel:ultimate

echo.
echo 🛑 تم إيقاف النظام
pause