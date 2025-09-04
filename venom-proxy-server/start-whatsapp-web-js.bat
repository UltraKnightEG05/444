@echo off
title WhatsApp-Web.js Proxy + Cloudflare Tunnel
color 0A
chcp 65001 >nul

echo.
echo ================================================
echo    WhatsApp-Web.js Proxy Server v2.0
echo    مع Cloudflare Tunnel التلقائي
echo    بديل مستقر لـ Venom-Bot
echo ================================================
echo.

REM الانتقال لمجلد المشروع
cd /d "%~dp0"

REM التحقق من نجاح الانتقال
if %errorlevel% neq 0 (
    echo ❌ فشل في الانتقال لمجلد المشروع
    echo 📍 المسار الحالي: %CD%
    echo 📍 المسار المطلوب: %~dp0
    pause
    exit /b 1
)

echo ✅ المسار الحالي: %CD%

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
    echo 📍 المسار الحالي: %CD%
    dir
    pause
    exit /b 1
)

echo ✅ package.json موجود

REM تثبيت المكتبات إذا لم تكن موجودة
if not exist node_modules (
    echo 📦 تثبيت المكتبات...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ فشل في تثبيت المكتبات
        pause
        exit /b 1
    )
) else (
    echo ✅ المكتبات موجودة بالفعل
)

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
call npm run start:tunnel

if %errorlevel% neq 0 (
    echo.
    echo ❌ خطأ في تشغيل النظام
    echo 💡 جرب الحلول التالية:
    echo    1. npm run clean
    echo    2. npm install
    echo    3. أعد تشغيل الملف
    pause
    exit /b 1
)
echo.
echo 🛑 تم إيقاف النظام
pause