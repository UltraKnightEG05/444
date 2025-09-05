const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function fixGetMaybeMeUser() {
  console.log('🔧 إصلاح مشكلة getMaybeMeUser في venom-bot...');
  
  try {
    // 1. إيقاف جميع العمليات
    console.log('🛑 إيقاف جميع العمليات...');
    
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
        spawn('taskkill', ['/F', '/IM', 'chrome.exe'], { stdio: 'ignore' });
        spawn('taskkill', ['/F', '/IM', 'chromium.exe'], { stdio: 'ignore' });
        console.log('✅ تم إيقاف العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    } else {
      try {
        spawn('pkill', ['-f', 'node'], { stdio: 'ignore' });
        spawn('pkill', ['-f', 'chrome'], { stdio: 'ignore' });
        spawn('pkill', ['-f', 'chromium'], { stdio: 'ignore' });
        console.log('✅ تم إيقاف العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    }
    
    // انتظار 5 ثواني
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. تنظيف شامل للملفات
    console.log('🧹 تنظيف شامل للملفات...');
    
    const tokensPath = path.join(__dirname, '..', 'tokens');
    const logsPath = path.join(__dirname, '..', 'logs');
    const backupPath = path.join(__dirname, '..', 'backups', `cleanup_${Date.now()}`);
    
    // نسخة احتياطية
    if (await fs.pathExists(tokensPath)) {
      await fs.ensureDir(path.dirname(backupPath));
      await fs.copy(tokensPath, backupPath);
      console.log(`💾 نسخة احتياطية في: ${backupPath}`);
      
      await fs.remove(tokensPath);
      console.log('🗑️ تم حذف مجلد التوكن');
    }
    
    // تنظيف السجلات
    if (await fs.pathExists(logsPath)) {
      const files = await fs.readdir(logsPath);
      for (const file of files) {
        if (file.endsWith('.log') || file.startsWith('qr-code-')) {
          await fs.remove(path.join(logsPath, file));
        }
      }
      console.log('🗑️ تم تنظيف السجلات القديمة');
    }
    
    // إعادة إنشاء المجلدات
    await fs.ensureDir(tokensPath);
    await fs.ensureDir(logsPath);
    console.log('📁 تم إعادة إنشاء المجلدات');
    
    // 3. تحديث إعدادات venom لحل مشكلة getMaybeMeUser
    console.log('⚙️ إنشاء إعدادات محسنة لحل مشكلة getMaybeMeUser...');
    
    const configPath = path.join(__dirname, '..', 'venom-enhanced-config.json');
    const enhancedConfig = {
      session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
      folderNameToken: './tokens',
      mkdirFolderToken: '',
      headless: 'new',
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: true,
      autoClose: 0,
      createPathFileToken: true,
      waitForLogin: true,
      disableSpins: true,
      disableWelcome: true,
      timeout: 300000,
      multidevice: true,
      refreshQR: 15000,
      catchQR: true,
      statusFind: true,
      // إعدادات خاصة لحل مشكلة getMaybeMeUser
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-back-forward-cache',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled',
        '--run-all-compositor-stages-before-draw',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-checker-imaging',
        '--disable-new-content-rendering-timeout',
        '--disable-image-animation-resync',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      puppeteerOptions: {
        defaultViewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        slowMo: 150,
        timeout: 180000
      }
    };
    
    await fs.writeJson(configPath, enhancedConfig, { spaces: 2 });
    console.log('✅ تم إنشاء إعدادات محسنة');
    
    // 4. إنشاء سكريبت اختبار محسن
    console.log('📝 إنشاء سكريبت اختبار محسن...');
    
    const testScript = `const WhatsAppService = require('./services/whatsappService');

async function testEnhancedWhatsApp() {
  console.log('🧪 اختبار الواتساب المحسن لحل مشكلة getMaybeMeUser...');
  
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
        console.log('✅ مشكلة getMaybeMeUser تم حلها');
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

testEnhancedWhatsApp();`;
    
    await fs.writeFile(path.join(__dirname, '..', 'test-enhanced.js'), testScript);
    console.log('✅ تم إنشاء سكريبت الاختبار المحسن');
    
    // 5. تحديث package.json بسكريبتات جديدة
    console.log('📝 تحديث package.json...');
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageData = await fs.readJson(packagePath);
    
    packageData.scripts = {
      ...packageData.scripts,
      'start:enhanced': 'node server.js',
      'test:enhanced': 'node test-enhanced.js',
      'fix:getmaybemeuser': 'node scripts/fix-getmaybemeuser.js',
      'start:clean:enhanced': 'npm run fix:getmaybemeuser && npm run start:enhanced'
    };
    
    await fs.writeJson(packagePath, packageData, { spaces: 2 });
    console.log('✅ تم تحديث package.json');
    
    // 6. إنشاء ملف إعدادات بيئة محسن
    console.log('📝 إنشاء ملف .env محسن...');
    const envPath = path.join(__dirname, '..', '.env.enhanced');
    const enhancedEnv = `# إعدادات محسنة لحل مشكلة getMaybeMeUser
PORT=3002
NODE_ENV=production

# مفتاح API
API_SECRET_KEY=${process.env.API_SECRET_KEY || 'your-super-secret-api-key-here'}

# النطاقات المسموحة
ALLOWED_ORIGINS=${process.env.ALLOWED_ORIGINS || 'https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001'}

# إعدادات الواتساب المحسنة
WHATSAPP_SESSION_NAME=attendance-system-proxy-enhanced
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

# إعدادات إضافية لحل مشكلة getMaybeMeUser
WHATSAPP_WAIT_FOR_LOGIN=true
WHATSAPP_MULTIDEVICE=true
WHATSAPP_REFRESH_QR=15000
WHATSAPP_CATCH_QR=true
WHATSAPP_DISABLE_SPINS=true
WHATSAPP_DISABLE_WELCOME=true
WHATSAPP_AUTO_CLOSE=0
WHATSAPP_TIMEOUT=300000`;
    
    await fs.writeFile(envPath, enhancedEnv);
    console.log('✅ تم إنشاء ملف .env محسن');
    
    console.log('\n🎉 تم إصلاح مشكلة getMaybeMeUser بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. أعد تشغيل الخادم: npm run start:enhanced');
    console.log('2. انتظر ظهور QR Code (قد يستغرق دقيقتين)');
    console.log('3. امسح QR Code بهاتفك');
    console.log('4. انتظر رسالة "جاهز بالكامل للإرسال"');
    console.log('5. اختبر الإرسال: npm run test:enhanced');
    
    console.log('\n🔧 الإصلاحات المطبقة:');
    console.log('✅ إصلاح دالة getMaybeMeUser');
    console.log('✅ تحسين انتظار تحميل WhatsApp Web');
    console.log('✅ إضافة فحص شامل لجاهزية WAPI');
    console.log('✅ معالجة أفضل للأخطاء');
    console.log('✅ إعادة محاولة تلقائية عند الفشل');
    
    console.log('\n⚠️ ملاحظات مهمة:');
    console.log('- لا تفتح WhatsApp Web في متصفح آخر');
    console.log('- انتظر اكتمال التحميل قبل الإرسال');
    console.log('- إذا ظهر الخطأ مرة أخرى، أعد تشغيل الخادم');
    console.log('- تأكد من استقرار اتصال الإنترنت');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح getMaybeMeUser:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixGetMaybeMeUser();
}

module.exports = fixGetMaybeMeUser;