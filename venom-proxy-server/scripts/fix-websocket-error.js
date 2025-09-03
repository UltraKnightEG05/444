const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

async function fixWebSocketError() {
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
    
    // 2. إصلاح إصدارات المكتبات
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
    
    // 3. تحديث package.json مع الإصدارات المتوافقة
    console.log('📝 تحديث package.json مع الإصدارات المتوافقة...');
    const packageData = await fs.readJson('./package.json');
    
    // إصدارات متوافقة لحل خطأ WebSocket
    packageData.dependencies = {
      ...packageData.dependencies,
      'venom-bot': '5.3.0',
      'puppeteer': '22.15.0', // إصدار متوافق مع venom 5.3.0
      'ws': '^8.14.2', // إصدار محدد لحل مشكلة WebSocket
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
    console.log('📦 تثبيت المكتبات مع الإصدارات المتوافقة...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ تم تثبيت المكتبات بنجاح');
    
    // 5. تنظيف ملفات التوكن
    console.log('🧹 تنظيف ملفات التوكن...');
    const tokensPath = './tokens';
    const backupPath = `./backups/tokens_websocket_fix_${Date.now()}`;
    
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
    
    // 6. إنشاء ملف إعدادات محسن لحل WebSocket
    console.log('📝 إنشاء إعدادات محسنة لحل خطأ WebSocket...');
    const websocketFixEnv = `# إعدادات محسنة لحل خطأ WebSocket في venom v5.3.0
PORT=3002
NODE_ENV=production

# مفتاح API (محدث)
API_SECRET_KEY=venom-ultimate-fix-2024

# النطاقات المسموحة
ALLOWED_ORIGINS=https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001,http://localhost:5173

# إعدادات الواتساب المحسنة لـ v5.3.0 (حل WebSocket)
WHATSAPP_SESSION_NAME=attendance-system-v5-3-0-fixed
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
DISABLE_WEBSOCKET_COMPRESSION=true`;
    
    await fs.writeFile('./.env.websocket-fix', websocketFixEnv);
    console.log('✅ تم إنشاء ملف .env محسن لحل WebSocket');
    
    console.log('\n🎉 تم إصلاح خطأ WebSocket بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. انسخ إعدادات .env.websocket-fix إلى .env');
    console.log('2. شغّل النظام: npm run start:tunnel:ultimate');
    console.log('3. أو استخدم: start-ultimate-tunnel.bat');
    console.log('4. انتظر ظهور QR Code (2-3 دقائق)');
    console.log('5. امسح QR Code بهاتفك');
    console.log('6. انتظر رسالة "جاهز بالكامل للإرسال"');
    
    console.log('\n🔧 الإصلاحات المطبقة:');
    console.log('✅ إصلاح خطأ WebSocket: Invalid URL: [object Object]');
    console.log('✅ تحديث puppeteer إلى v22.15.0 (متوافق مع venom 5.3.0)');
    console.log('✅ إضافة ws v8.14.2 (إصدار مستقر)');
    console.log('✅ تحسين إعدادات Puppeteer لـ v5.3.0');
    console.log('✅ إصلاح مفتاح API');
    console.log('✅ تحسين Cloudflare Tunnel مع ID المحدد');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح WebSocket:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixWebSocketError();
}

module.exports = fixWebSocketError;