@echo off
title WhatsApp-Web.js Proxy + Cloudflare Tunnel
color 0A

echo.
echo ================================================
echo    WhatsApp-Web.js Proxy Server v2.0
echo    مع Cloudflare Tunnel التلقائي
echo    بديل مستقر لـ Venom-Bot
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
    set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo ✅ Chrome متوفر
    set CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
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

REM التحقق من وجود Tunnel
echo 🔍 فحص Tunnel ID المحدد: 9752631e-8b0d-48a8-b9c1-20f376ce578f
cloudflared tunnel info 9752631e-8b0d-48a8-b9c1-20f376ce578f >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Tunnel ID غير موجود أو غير مُعد
    echo 💡 يرجى التأكد من إعداد Tunnel:
    echo    cloudflared tunnel list
    echo    cloudflared tunnel info 9752631e-8b0d-48a8-b9c1-20f376ce578f
    pause
    exit /b 1
)

echo ✅ Tunnel ID موجود ومُعد

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
if exist sessions rmdir /s /q sessions >nul 2>&1
if exist logs\*.log del /q logs\*.log >nul 2>&1
if exist logs\qr-code-*.png del /q logs\qr-code-*.png >nul 2>&1

mkdir sessions >nul 2>&1
mkdir logs >nul 2>&1
mkdir backups >nul 2>&1

echo ✅ تم التنظيف

REM تحديث المكتبات لـ WhatsApp-Web.js
echo 📦 تحديث المكتبات لـ WhatsApp-Web.js...
npm install whatsapp-web.js@1.23.0 qrcode-terminal@0.12.0 qrcode@1.5.3 --save

echo.
echo 🚀 تشغيل WhatsApp-Web.js مع Cloudflare Tunnel...
echo 📱 خدمة مستقرة وموثوقة
echo 🌍 مع Cloudflare Tunnel التلقائي
echo 🆔 Tunnel ID: 9752631e-8b0d-48a8-b9c1-20f376ce578f
echo.
echo ⏳ انتظر ظهور QR Code (خلال دقيقة واحدة)
echo 📱 امسح QR Code بهاتفك عند ظهوره
echo 🌍 الخادم سيكون متاح على: https://api.go4host.net
echo 🏠 والمحلي على: http://localhost:3002
echo.

REM تشغيل النظام مع Tunnel
npm run start:tunnel

echo.
echo 🛑 تم إيقاف النظام
pause