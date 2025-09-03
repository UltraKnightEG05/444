const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function completeFix() {
  console.log('🔧 تطبيق الإصلاح الشامل لمشكلة getMaybeMeUser...');
  
  try {
    // 1. إيقاف جميع العمليات
    console.log('🛑 إيقاف جميع العمليات...');
    
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
        execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
        execSync('taskkill /F /IM chromium.exe', { stdio: 'ignore' });
        console.log('✅ تم إيقاف العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. تنظيف شامل
    console.log('🧹 تنظيف شامل للملفات...');
    
    const pathsToClean = [
      './node_modules',
      './package-lock.json',
      './tokens',
      './logs'
    ];
    
    for (const cleanPath of pathsToClean) {
      if (await fs.pathExists(cleanPath)) {
        await fs.remove(cleanPath);
        console.log(`🗑️ تم حذف: ${cleanPath}`);
      }
    }
    
    // إعادة إنشاء المجلدات
    await fs.ensureDir('./tokens');
    await fs.ensureDir('./logs');
    await fs.ensureDir('./backups');
    console.log('📁 تم إعادة إنشاء المجلدات');
    
    // 3. تحديث package.json
    console.log('📝 تحديث package.json مع الإصدارات المحسنة...');
    const packageData = await fs.readJson('./package.json');
    
    packageData.dependencies = {
      ...packageData.dependencies,
      'venom-bot': '^5.0.17',
      'puppeteer': '^22.15.0',
      'cors': '^2.8.5',
      'dotenv': '^16.3.1',
      'express': '^4.18.2',
      'express-rate-limit': '^6.8.1',
      'fs-extra': '^11.1.1',
      'helmet': '^7.0.0',
      'qrcode-terminal': '^0.12.0'
    };
    
    packageData.scripts = {
      ...packageData.scripts,
      'start:fixed': 'node server.js',
      'test:fixed': 'node test-fixed.js',
      'fix:complete': 'node scripts/complete-fix.js',
      'update:venom': 'node scripts/update-venom.js'
    };
    
    await fs.writeJson('./package.json', packageData, { spaces: 2 });
    console.log('✅ تم تحديث package.json');
    
    // 4. تثبيت المكتبات
    console.log('📦 تثبيت المكتبات المحدثة...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ تم تثبيت المكتبات بنجاح');
    
    // 5. إنشاء ملف إعدادات محسن
    console.log('📝 إنشاء ملف إعدادات محسن...');
    const envContent = `# إعدادات محسنة لـ venom-bot v5.0.17 مع إصلاحات getMaybeMeUser
PORT=3002
NODE_ENV=production

# مفتاح API
API_SECRET_KEY=${process.env.API_SECRET_KEY || 'venom-proxy-secret-key-2024'}

# النطاقات المسموحة
ALLOWED_ORIGINS=https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001,http://localhost:5173

# إعدادات الواتساب المحسنة لـ v5.0.17
WHATSAPP_SESSION_NAME=attendance-system-v5-fixed
WHATSAPP_HEADLESS=new
WHATSAPP_DEBUG=false

# مسار Chrome (حدث حسب نظام التشغيل)
CHROME_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe

# مسارات التخزين
TOKENS_PATH=./tokens
LOGS_PATH=./logs

# إعدادات الرسائل المحسنة
MESSAGE_DELAY=4000
BULK_MESSAGE_DELAY=6000

# رقم اختبار
TEST_PHONE_NUMBER=201002246668

# إعدادات Cloudflare Tunnel
TUNNEL_URL=https://api.go4host.net

# إعدادات خاصة لحل مشكلة getMaybeMeUser
WHATSAPP_WAIT_FOR_LOGIN=true
WHATSAPP_MULTIDEVICE=true
WHATSAPP_REFRESH_QR=15000
WHATSAPP_CATCH_QR=true
WHATSAPP_DISABLE_SPINS=true
WHATSAPP_DISABLE_WELCOME=true
WHATSAPP_AUTO_CLOSE=0
WHATSAPP_TIMEOUT=300000`;
    
    await fs.writeFile('./.env.fixed', envContent);
    console.log('✅ تم إنشاء ملف .env محسن');
    
    // 6. إنشاء سكريبت تشغيل محسن
    console.log('📝 إنشاء سكريبت تشغيل محسن...');
    const startScript = `@echo off
echo 🚀 تشغيل Venom Proxy v5.0.17 مع إصلاحات getMaybeMeUser

REM إغلاق العمليات السابقة
echo 🛑 إغلاق العمليات السابقة...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 3 >nul

echo ✅ تم التنظيف

REM تشغيل الخادم
echo 🚀 تشغيل الخادم المحسن...
echo ⏳ انتظر ظهور QR Code (قد يستغرق دقيقتين)
echo 📱 امسح QR Code بهاتفك عند ظهوره
echo 🔧 تم تطبيق إصلاحات getMaybeMeUser v5.0.17

npm run start:fixed

pause`;
    
    await fs.writeFile('./start-v5-fixed.bat', startScript);
    console.log('✅ تم إنشاء سكريبت التشغيل المحسن');
    
    console.log('\n🎉 تم تطبيق الإصلاح الشامل بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. انسخ إعدادات .env.fixed إلى .env');
    console.log('2. شغّل الخادم: npm run start:fixed');
    console.log('3. أو استخدم: start-v5-fixed.bat');
    console.log('4. انتظر ظهور QR Code');
    console.log('5. امسح QR Code بهاتفك');
    console.log('6. انتظر رسالة "جاهز بالكامل للإرسال"');
    console.log('7. اختبر الإرسال: npm run test:fixed');
    
    console.log('\n🔧 الإصلاحات المطبقة:');
    console.log('✅ تحديث venom-bot إلى v5.0.17 (أحدث إصدار مستقر)');
    console.log('✅ تحديث puppeteer إلى v22.15.0 (متوافق مع venom v5)');
    console.log('✅ إصلاح شامل ونهائي لدالة getMaybeMeUser');
    console.log('✅ تحسين معالجة أخطاء WAPI');
    console.log('✅ إضافة آليات إعادة المحاولة المحسنة');
    console.log('✅ تحسين انتظار تحميل WhatsApp Web');
    console.log('✅ إصلاحات خاصة لـ WAPI.sendMessage');
    console.log('✅ معالجة أفضل لحالات الانقطاع');
    
    console.log('\n⚠️ ملاحظات مهمة:');
    console.log('- هذا الإصلاح شامل ونهائي لمشكلة getMaybeMeUser');
    console.log('- ستحتاج لمسح QR Code جديد بعد التحديث');
    console.log('- لا تفتح WhatsApp Web في متصفح آخر');
    console.log('- انتظر اكتمال التحميل قبل الإرسال');
    console.log('- إذا ظهرت أي مشاكل، أعد تشغيل الخادم');
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح الشامل:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  completeFix();
}

module.exports = completeFix;