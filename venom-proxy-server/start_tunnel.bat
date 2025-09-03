@echo off

REM تعيين مسار المشروع الخاص بك هنا
REM استبدل C:\Path\To\Your\Project بمسار المجلد الفعلي لمشروعك
set "PROJECT_PATH=D:\venom-proxy-server"

REM الانتقال إلى مسار المشروع
cd /d "%PROJECT_PATH%"

REM التحقق مما إذا كان الانتقال قد تم بنجاح
if %errorlevel% neq 0 (
    echo. 
    echo ❌ فشل الانتقال إلى مسار المشروع: %PROJECT_PATH%
    echo. 
    echo يرجى التأكد من صحة المسار المذكور في ملف .bat.
    pause
    exit /b %errorlevel%
)

echo. 
echo ✅ تم الانتقال إلى مسار المشروع: %PROJECT_PATH%
echo. 

REM تشغيل أمر npm
call npm run start:tunnel

REM إبقاء النافذة مفتوحة بعد انتهاء الأمر
pause
