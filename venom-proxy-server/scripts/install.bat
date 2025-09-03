@echo off
REM سكريپت تثبيت Venom Proxy Server للويندوز

echo 🚀 بدء تثبيت Venom Proxy Server...

REM التحقق من Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت. يرجى تثبيته أولاً من: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js متوفر
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
    echo 💡 يرجى تحميل وتثبيت Chrome من: https://www.google.com/chrome/
    pause
    exit /b 1
)

REM تثبيت المكتبات
echo 📦 تثبيت المكتبات...
npm install

if %errorlevel% neq 0 (
    echo ❌ فشل في تثبيت المكتبات
    pause
    exit /b 1
)

echo ✅ تم تثبيت المكتبات بنجاح

REM إنشاء ملف .env إذا لم يكن موجوداً
if not exist .env (
    echo 📝 إنشاء ملف .env...
    copy .env.example .env
    
    REM تحديث مسار Chrome في ملف .env
    powershell -Command "(Get-Content .env) -replace 'CHROME_PATH=.*', 'CHROME_PATH=%CHROME_PATH%' | Set-Content .env"
    
    echo ⚠️  يرجى تحديث ملف .env بالإعدادات الصحيحة:
    echo    - API_SECRET_KEY
    echo    - ALLOWED_ORIGINS
)

REM إنشاء المجلدات المطلوبة
echo 📁 إنشاء المجلدات...
if not exist tokens mkdir tokens
if not exist logs mkdir logs
if not exist backups mkdir backups

echo 🎉 تم تثبيت Venom Proxy Server بنجاح!
echo.
echo 📋 الخطوات التالية:
echo 1. عدّل ملف .env بالإعدادات الصحيحة
echo 2. شغّل الخادم: npm start
echo 3. امسح QR Code بهاتفك
echo 4. اختبر الاتصال: npm test
echo.
echo 📖 للمزيد من التفاصيل، راجع README.md

pause