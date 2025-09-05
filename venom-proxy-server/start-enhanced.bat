@echo off
echo 🚀 بدء تشغيل Venom Proxy Server المحسن...
echo 🔧 مع إصلاح مشكلة getMaybeMeUser

REM التحقق من Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت
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
    echo 💡 يرجى تثبيت Chrome من: https://www.google.com/chrome/
    pause
    exit /b 1
)

REM إغلاق العمليات السابقة
echo 🛑 إغلاق العمليات السابقة...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 3 >nul

REM تنظيف الملفات
echo 🧹 تنظيف الملفات...
if exist tokens rmdir /s /q tokens
if exist logs\*.log del /q logs\*.log
if exist logs\qr-code-*.png del /q logs\qr-code-*.png

mkdir tokens >nul 2>&1
mkdir logs >nul 2>&1

echo ✅ تم التنظيف

REM تشغيل الخادم المحسن
echo 🚀 تشغيل الخادم المحسن...
echo ⏳ انتظر ظهور QR Code (قد يستغرق دقيقتين)
echo 📱 امسح QR Code بهاتفك عند ظهوره
echo 🔧 تم تطبيق إصلاحات getMaybeMeUser

npm run start:enhanced

pause