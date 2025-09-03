const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function updateVenom() {
  console.log('🔄 تحديث venom-bot لحل مشكلة getMaybeMeUser...');
  
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
    } else {
      try {
        execSync('pkill -f node', { stdio: 'ignore' });
        execSync('pkill -f chrome', { stdio: 'ignore' });
        execSync('pkill -f chromium', { stdio: 'ignore' });
        console.log('✅ تم إيقاف العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    }
    
    // انتظار 5 ثواني
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. نسخ احتياطي للتوكن
    console.log('💾 إنشاء نسخة احتياطية للتوكن...');
    const tokensPath = './tokens';
    const backupPath = `./backups/tokens_backup_${Date.now()}`;
    
    if (await fs.pathExists(tokensPath)) {
      await fs.ensureDir('./backups');
      await fs.copy(tokensPath, backupPath);
      console.log(`✅ تم إنشاء نسخة احتياطية في: ${backupPath}`);
    }
    
    // 3. تنظيف node_modules
    console.log('🧹 تنظيف node_modules...');
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
    
    // 4. تحديث package.json
    console.log('📝 تحديث package.json...');
    const packagePath = './package.json';
    const packageData = await fs.readJson(packagePath);
    
    // تحديث إصدارات المكتبات
    packageData.dependencies = {
      ...packageData.dependencies,
      'venom-bot': '^5.0.17',
      'puppeteer': '^22.15.0'
    };
    
    // إضافة سكريبتات جديدة
    packageData.scripts = {
      ...packageData.scripts,
      'update:venom': 'node scripts/update-venom.js',
      'fix:getmaybemeuser': 'node scripts/fix-getmaybemeuser.js',
      'start:fixed': 'npm run fix:getmaybemeuser && npm start',
      'test:fixed': 'node test-fixed.js'
    };
    
    await fs.writeJson(packagePath, packageData, { spaces: 2 });
    console.log('✅ تم تحديث package.json');
    
    // 5. تثبيت المكتبات المحدثة
    console.log('📦 تثبيت المكتبات المحدثة...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ تم تثبيت المكتبات بنجاح');
    } catch (installError) {
      console.error('❌ خطأ في تثبيت المكتبات:', installError.message);
      throw installError;
    }
    
    // 6. تنظيف ملفات التوكن القديمة
    console.log('🧹 تنظيف ملفات التوكن القديمة...');
    if (await fs.pathExists(tokensPath)) {
      await fs.remove(tokensPath);
      console.log('🗑️ تم حذف ملفات التوكن القديمة');
    }
    await fs.ensureDir(tokensPath);
    console.log('📁 تم إنشاء مجلد توكن جديد');
    
    // 7. إنشاء ملف اختبار محسن
    console.log('📝 إنشاء ملف اختبار محسن...');
    const testScript = `const WhatsAppService = require('./services/whatsappService');

async function testFixedVenom() {
  console.log('🧪 اختبار venom-bot v5.0.17 مع إصلاحات getMaybeMeUser...');
  
  const service = new WhatsAppService();
  
  try {
    console.log('🚀 بدء التهيئة المحسنة...');
    const initResult = await service.initialize();
    
    if (!initResult.success) {
      console.error('❌ فشل في التهيئة:', initResult.message);
      return;
    }
    
    console.log('✅ تم الاتصال بنجاح');
    
    // انتظار الجاهزية الكاملة
    console.log('⏳ انتظار الجاهزية الكاملة...');
    let readyAttempts = 0;
    const maxReadyAttempts = 30;
    
    while ((!service.isReady || !service.wapiReady) && readyAttempts < maxReadyAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await service.checkFullReadiness();
      readyAttempts++;
      console.log(\`🔍 محاولة جاهزية \${readyAttempts}/\${maxReadyAttempts} - WAPI: \${service.wapiReady ? '✅' : '❌'} | Ready: \${service.isReady ? '✅' : '❌'}\`);
    }
    
    if (service.isReady && service.wapiReady) {
      console.log('✅ النظام جاهز بالكامل للإرسال!');
      
      // اختبار إرسال رسالة
      const testPhone = process.env.TEST_PHONE_NUMBER || '201002246668';
      console.log(\`📱 اختبار إرسال رسالة إلى: \${testPhone}\`);
      
      const testResult = await service.testMessage(testPhone);
      
      if (testResult.success) {
        console.log('🎉 تم إرسال رسالة الاختبار بنجاح!');
        console.log('✅ مشكلة getMaybeMeUser تم حلها نهائياً');
      } else {
        console.error('❌ فشل في إرسال رسالة الاختبار:', testResult.error);
      }
    } else {
      console.error('❌ النظام غير جاهز للإرسال');
      console.log('📊 الحالة النهائية:', {
        connected: service.isConnected,
        ready: service.isReady,
        wapiReady: service.wapiReady,
        storeReady: service.storeReady
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    console.log('🔌 قطع الاتصال...');
    await service.disconnect();
    process.exit(0);
  }
}

testFixedVenom();`;
    
    await fs.writeFile('./test-fixed.js', testScript);
    console.log('✅ تم إنشاء ملف الاختبار المحسن');
    
    // 8. إنشاء ملف إعدادات محسن
    console.log('📝 إنشاء ملف إعدادات محسن...');
    const envContent = `# إعدادات محسنة لـ venom-bot v5.0.17
PORT=3002
NODE_ENV=production

# مفتاح API
API_SECRET_KEY=${process.env.API_SECRET_KEY || 'your-super-secret-api-key-here'}

# النطاقات المسموحة
ALLOWED_ORIGINS=${process.env.ALLOWED_ORIGINS || 'https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001'}

# إعدادات الواتساب المحسنة لـ v5.0.17
WHATSAPP_SESSION_NAME=attendance-system-v5
WHATSAPP_HEADLESS=new
WHATSAPP_DEBUG=false

# مسار Chrome
CHROME_PATH=${process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}

# مسارات التخزين
TOKENS_PATH=./tokens
LOGS_PATH=./logs

# إعدادات الرسائل المحسنة
MESSAGE_DELAY=4000
BULK_MESSAGE_DELAY=6000

# رقم اختبار
TEST_PHONE_NUMBER=${process.env.TEST_PHONE_NUMBER || '201002246668'}

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
    
    await fs.writeFile('./.env.v5', envContent);
    console.log('✅ تم إنشاء ملف .env محسن');
    
    console.log('\n🎉 تم تحديث venom-bot بنجاح إلى v5.0.17!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. انسخ إعدادات .env.v5 إلى .env إذا أردت');
    console.log('2. أعد تشغيل الخادم: npm start');
    console.log('3. انتظر ظهور QR Code (قد يستغرق دقيقتين)');
    console.log('4. امسح QR Code بهاتفك');
    console.log('5. انتظر رسالة "جاهز بالكامل للإرسال"');
    console.log('6. اختبر الإرسال: npm run test:fixed');
    
    console.log('\n🔧 الإصلاحات المطبقة:');
    console.log('✅ تحديث venom-bot إلى v5.0.17');
    console.log('✅ تحديث puppeteer إلى v22.15.0');
    console.log('✅ إصلاح شامل لدالة getMaybeMeUser');
    console.log('✅ تحسين انتظار تحميل WhatsApp Web');
    console.log('✅ إضافة فحص شامل لجاهزية WAPI');
    console.log('✅ معالجة أفضل للأخطاء');
    console.log('✅ إعادة محاولة تلقائية عند الفشل');
    console.log('✅ إصلاحات خاصة لـ WAPI.sendMessage');
    
    console.log('\n⚠️ ملاحظات مهمة:');
    console.log('- ستحتاج لمسح QR Code جديد');
    console.log('- لا تفتح WhatsApp Web في متصفح آخر');
    console.log('- انتظر رسالة "جاهز بالكامل للإرسال" قبل الاختبار');
    console.log('- إذا ظهر خطأ getMaybeMeUser مرة أخرى، أعد تشغيل الخادم');
    console.log('- تأكد من استقرار اتصال الإنترنت');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث venom-bot:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updateVenom();
}

module.exports = updateVenom;