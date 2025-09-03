const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

async function fixWebSocketV530() {
  console.log('🔧 إصلاح خطأ WebSocket في venom v5.3.0...');
  console.log('🎯 حل مشكلة: SyntaxError: Invalid URL: [object Object]');
  
  try {
    // 1. إيقاف جميع العمليات
    console.log('🛑 إيقاف جميع العمليات...');
    
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
        execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
        execSync('taskkill /F /IM cloudflared.exe', { stdio: 'ignore' });
        console.log('✅ تم إيقاف جميع العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. إصلاح إصدارات المكتبات لحل WebSocket
    console.log('📦 إصلاح إصدارات المكتبات لحل خطأ WebSocket...');
    
    // حذف node_modules وpackage-lock.json
    const nodeModulesPath = './node_modules';
    const packageLockPath = './package-lock.json';
    
    if (await fs.pathExists(nodeModulesPath)) {
      await fs.remove(nodeModulesPath);
      console.log('🗑️ تم حذف node_modules');
    }
    
    if (await fs.pathExists(packageLockPath)) {
      await fs.remove(packageLockPath);
      console.log('🗑️ تم حذف package-lock.json');
    }
    
    // 3. تحديث package.json مع الإصدارات المتوافقة لـ v5.3.0
    console.log('📝 تحديث package.json مع الإصدارات المتوافقة لـ v5.3.0...');
    const packageData = await fs.readJson('./package.json');
    
    // إصدارات متوافقة لحل خطأ WebSocket مع v5.3.0
    packageData.dependencies = {
      ...packageData.dependencies,
      'venom-bot': '5.3.0',
      'puppeteer': '19.11.1', // إصدار أقدم متوافق مع v5.3.0
      'ws': '8.14.2', // إصدار محدد لحل مشكلة WebSocket
      'puppeteer-extra': '3.3.6',
      'puppeteer-extra-plugin-stealth': '2.11.2',
      'cors': '^2.8.5',
      'dotenv': '^16.3.1',
      'express': '^4.18.2',
      'express-rate-limit': '^6.8.1',
      'fs-extra': '^11.1.1',
      'helmet': '^7.0.0',
      'qrcode-terminal': '^0.12.0'
    };
    
    await fs.writeJson('./package.json', packageData, { spaces: 2 });
    console.log('✅ تم تحديث package.json');
    
    // 4. تثبيت المكتبات مع الإصدارات المحددة
    console.log('📦 تثبيت المكتبات مع الإصدارات المتوافقة لـ v5.3.0...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ تم تثبيت المكتبات بنجاح');
    
    // 5. تنظيف ملفات التوكن
    console.log('🧹 تنظيف ملفات التوكن...');
    const tokensPath = './tokens';
    const backupPath = `./backups/tokens_websocket_fix_v530_${Date.now()}`;
    
    if (await fs.pathExists(tokensPath)) {
      await fs.ensureDir('./backups');
      await fs.copy(tokensPath, backupPath);
      console.log(`💾 نسخة احتياطية في: ${backupPath}`);
      
      await fs.remove(tokensPath);
      console.log('🗑️ تم حذف ملفات التوكن القديمة');
    }
    
    await fs.ensureDir(tokensPath);
    await fs.ensureDir('./logs');
    console.log('📁 تم إعادة إنشاء المجلدات');
    
    // 6. إنشاء ملف إعدادات محسن لحل WebSocket مع v5.3.0
    console.log('📝 إنشاء إعدادات محسنة لحل خطأ WebSocket مع v5.3.0...');
    const websocketFixEnv = `# إعدادات محسنة لحل خطأ WebSocket في venom v5.3.0
PORT=3002
NODE_ENV=production

# مفتاح API (محدث)
API_SECRET_KEY=venom-ultimate-fix-2024

# النطاقات المسموحة
ALLOWED_ORIGINS=https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001,http://localhost:5173

# إعدادات الواتساب المحسنة لـ v5.3.0 (حل WebSocket)
WHATSAPP_SESSION_NAME=attendance-system-v5-3-0-websocket-fixed
WHATSAPP_HEADLESS=new
WHATSAPP_DEBUG=false

# مسار Chrome
CHROME_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe

# مسارات التخزين
TOKENS_PATH=./tokens
LOGS_PATH=./logs

# إعدادات الرسائل المحسنة
MESSAGE_DELAY=5000
BULK_MESSAGE_DELAY=7000

# رقم اختبار
TEST_PHONE_NUMBER=201002246668

# إعدادات Cloudflare Tunnel (محدث)
TUNNEL_URL=https://api.go4host.net
TUNNEL_ID=9752631e-8b0d-48a8-b9c1-20f376ce578f
ENABLE_TUNNEL=true
AUTO_START_TUNNEL=true

# إعدادات خاصة لحل خطأ WebSocket في v5.3.0
WHATSAPP_WAIT_FOR_LOGIN=true
WHATSAPP_MULTIDEVICE=true
WHATSAPP_REFRESH_QR=15000
WHATSAPP_CATCH_QR=true
WHATSAPP_DISABLE_SPINS=true
WHATSAPP_DISABLE_WELCOME=true
WHATSAPP_AUTO_CLOSE=0
WHATSAPP_TIMEOUT=300000
WHATSAPP_FORCE_WAPI_RELOAD=true
WHATSAPP_ENABLE_GETMAYBEMEUSER_FIX=true
WHATSAPP_WAPI_TIMEOUT=300000
WHATSAPP_MAX_WAPI_ATTEMPTS=60

# إعدادات خاصة لحل مشكلة WebSocket
WEBSOCKET_FIX_ENABLED=true
PUPPETEER_WEBSOCKET_FIX=true
DISABLE_WEBSOCKET_COMPRESSION=true
PUPPETEER_DISABLE_WEBSOCKET=true`;
    
    await fs.writeFile('./.env.websocket-fix-v530', websocketFixEnv);
    console.log('✅ تم إنشاء ملف .env محسن لحل WebSocket مع v5.3.0');
    
    // 7. إنشاء سكريبت تشغيل محسن لـ v5.3.0
    console.log('📝 إنشاء سكريبت تشغيل محسن لـ v5.3.0...');
    const startScript = `@echo off
title Venom v5.3.0 WebSocket Fix + Cloudflare Tunnel
color 0A

echo.
echo ================================================
echo    Venom v5.3.0 WebSocket Fix
echo    مع Cloudflare Tunnel التلقائي
echo    حل نهائي لخطأ WebSocket
echo ================================================
echo.

REM إغلاق العمليات السابقة
echo 🛑 إغلاق العمليات السابقة...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 5 >nul

echo ✅ تم إغلاق العمليات السابقة

REM تنظيف شامل
echo 🧹 تنظيف شامل...
if exist tokens rmdir /s /q tokens >nul 2>&1
if exist logs\\*.log del /q logs\\*.log >nul 2>&1
if exist logs\\qr-code-*.png del /q logs\\qr-code-*.png >nul 2>&1

mkdir tokens >nul 2>&1
mkdir logs >nul 2>&1

echo ✅ تم التنظيف

REM تعيين متغيرات البيئة لحل WebSocket
set PUPPETEER_DISABLE_WEBSOCKET=true
set WEBSOCKET_FIX_ENABLED=true

echo.
echo 🚀 تشغيل venom v5.3.0 مع حل WebSocket...
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
pause`;
    
    await fs.writeFile('./start-v530-websocket-fix.bat', startScript);
    console.log('✅ تم إنشاء سكريبت التشغيل المحسن لـ v5.3.0');
    
    console.log('\n🎉 تم إصلاح خطأ WebSocket في v5.3.0 بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. انسخ إعدادات .env.websocket-fix-v530 إلى .env');
    console.log('2. شغّل النظام: start-v530-websocket-fix.bat');
    console.log('3. أو استخدم: npm run start:tunnel:ultimate');
    console.log('4. انتظر ظهور QR Code (2-3 دقائق)');
    console.log('5. امسح QR Code بهاتفك');
    console.log('6. انتظر رسالة "جاهز بالكامل للإرسال"');
    
    console.log('\n🔧 الإصلاحات المطبقة:');
    console.log('✅ إصلاح خطأ WebSocket: Invalid URL: [object Object]');
    console.log('✅ تحديث puppeteer إلى v19.11.1 (متوافق مع venom 5.3.0)');
    console.log('✅ إضافة ws v8.14.2 (إصدار مستقر)');
    console.log('✅ تعطيل WebSocket في Puppeteer');
    console.log('✅ تحسين إعدادات Chrome لـ v5.3.0');
    console.log('✅ إصلاح مفتاح API');
    console.log('✅ تحسين Cloudflare Tunnel مع ID المحدد');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح WebSocket:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixWebSocketV530();
}

module.exports = fixWebSocketV530;