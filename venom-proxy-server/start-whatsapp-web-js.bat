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

REM التحقق من وجود المجلد
if not exist "%~dp0" (
    echo ❌ مجلد المشروع غير موجود
    pause
    exit /b 1
)

REM الانتقال لمجلد المشروع
cd /d "%~dp0"

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

REM التحقق من package.json
if not exist package.json (
    echo ❌ package.json غير موجود
    echo 💡 تأكد من وجودك في مجلد المشروع الصحيح
    pause
    exit /b 1
)

REM تثبيت المكتبات إذا لم تكن موجودة
if not exist node_modules (
    echo 📦 تثبيت المكتبات...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت المكتبات
        pause
        exit /b 1
    )
)

echo ✅ المكتبات جاهزة

REM إنشاء المجلدات المطلوبة
if not exist sessions mkdir sessions
if not exist logs mkdir logs
if not exist backups mkdir backups

echo ✅ المجلدات جاهزة

echo.
echo 🚀 تشغيل WhatsApp-Web.js مع Cloudflare Tunnel...
echo 📱 خدمة مستقرة وموثوقة
echo.
echo ⏳ انتظر ظهور QR Code (خلال دقيقة واحدة)
echo 📱 إذا لم يظهر QR Code في Terminal، افتح: http://localhost:3002/qr
echo 🌐 أو افتح الصورة المحفوظة في مجلد logs
echo.

REM تشغيل النظام
npm run start:tunnel

echo.
echo 🛑 تم إيقاف النظام
pause