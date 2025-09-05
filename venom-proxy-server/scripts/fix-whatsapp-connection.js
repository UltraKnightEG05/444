const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function fixWhatsAppConnection() {
  console.log('🔧 إصلاح مشاكل اتصال الواتساب...');
  
  try {
    // 1. إغلاق جميع عمليات Chrome
    console.log('🔄 إغلاق جميع عمليات Chrome...');
    
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/F', '/IM', 'chrome.exe'], { stdio: 'ignore' });
        spawn('taskkill', ['/F', '/IM', 'chromium.exe'], { stdio: 'ignore' });
        console.log('✅ تم إغلاق عمليات Chrome');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات Chrome للإغلاق');
      }
    } else {
      try {
        spawn('pkill', ['-f', 'chrome'], { stdio: 'ignore' });
        spawn('pkill', ['-f', 'chromium'], { stdio: 'ignore' });
        console.log('✅ تم إغلاق عمليات Chrome');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات Chrome للإغلاق');
      }
    }
    
    // انتظار 5 ثواني
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. تنظيف مجلد التوكن مع نسخة احتياطية
    console.log('🧹 تنظيف مجلد التوكن...');
    const tokensPath = path.join(__dirname, '..', 'tokens');
    const backupPath = path.join(__dirname, '..', 'backups', `tokens_backup_${Date.now()}`);
    
    if (await fs.pathExists(tokensPath)) {
      // إنشاء نسخة احتياطية
      await fs.ensureDir(path.dirname(backupPath));
      await fs.copy(tokensPath, backupPath);
      console.log(`💾 تم إنشاء نسخة احتياطية في: ${backupPath}`);
      
      // حذف مجلد التوكن
      await fs.remove(tokensPath);
      console.log('🗑️ تم حذف مجلد التوكن القديم');
    }
    
    // إعادة إنشاء مجلد التوكن
    await fs.ensureDir(tokensPath);
    console.log('📁 تم إنشاء مجلد توكن جديد');
    
    // 3. تنظيف مجلد السجلات
    console.log('🧹 تنظيف مجلد السجلات...');
    const logsPath = path.join(__dirname, '..', 'logs');
    
    if (await fs.pathExists(logsPath)) {
      const files = await fs.readdir(logsPath);
      for (const file of files) {
        if (file.endsWith('.log') || file.startsWith('qr-code-')) {
          await fs.remove(path.join(logsPath, file));
        }
      }
      console.log('🗑️ تم تنظيف ملفات السجلات القديمة');
    }
    
    await fs.ensureDir(logsPath);
    
    // 4. تنظيف cache المتصفح (Windows فقط)
    if (process.platform === 'win32') {
      console.log('🧹 تنظيف cache المتصفح...');
      const userProfile = process.env.USERPROFILE;
      if (userProfile) {
        const cachePaths = [
          path.join(userProfile, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
          path.join(userProfile, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
          path.join(userProfile, 'AppData', 'Local', 'Temp')
        ];
        
        for (const cachePath of cachePaths) {
          try {
            if (await fs.pathExists(cachePath)) {
              const tempBackup = cachePath + '_backup_' + Date.now();
              await fs.move(cachePath, tempBackup);
              await fs.ensureDir(cachePath);
              // حذف النسخة الاحتياطية بعد 10 ثواني
              setTimeout(async () => {
                try {
                  await fs.remove(tempBackup);
                } catch (e) {
                  // تجاهل الأخطاء
                }
              }, 10000);
            }
          } catch (error) {
            console.log(`⚠️ لم يتم تنظيف ${cachePath} (قد يكون Chrome مفتوح)`);
          }
        }
        console.log('✅ تم تنظيف cache المتصفح');
      }
    }
    
    // 5. إنشاء ملف إعدادات محسن
    console.log('📝 إنشاء ملف إعدادات محسن...');
    const configPath = path.join(__dirname, '..', 'whatsapp-config.json');
    const config = {
      session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
      headless: true,
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
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    console.log('✅ تم إنشاء ملف الإعدادات');
    
    // 6. إنشاء سكريبت اختبار محسن
    console.log('📝 إنشاء سكريبت اختبار محسن...');
    const testScript = `
const WhatsAppService = require('./services/whatsappService');

async function testWhatsAppConnection() {
  console.log('🧪 اختبار اتصال الواتساب المحسن...');
  
  const service = new WhatsAppService();
  
  try {
    // تهيئة الاتصال
    console.log('🚀 بدء التهيئة...');
    const initResult = await service.initialize();
    
    if (!initResult.success) {
      console.error('❌ فشل في التهيئة:', initResult.message);
      return;
    }
    
    console.log('✅ تم الاتصال بنجاح');
    
    // انتظار الجاهزية
    console.log('⏳ انتظار جاهزية النظام...');
    let readyAttempts = 0;
    const maxReadyAttempts = 20;
    
    while (!service.isReady && readyAttempts < maxReadyAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await service.checkReadiness();
      readyAttempts++;
      console.log(\`🔍 محاولة جاهزية \${readyAttempts}/\${maxReadyAttempts}\`);
    }
    
    if (service.isReady) {
      console.log('✅ النظام جاهز للإرسال!');
      
      // اختبار إرسال رسالة
      const testPhone = process.env.TEST_PHONE_NUMBER || '201002246668';
      console.log(\`📱 اختبار إرسال رسالة إلى: \${testPhone}\`);
      
      const testResult = await service.testMessage(testPhone);
      
      if (testResult.success) {
        console.log('🎉 تم إرسال رسالة الاختبار بنجاح!');
      } else {
        console.error('❌ فشل في إرسال رسالة الاختبار:', testResult.error);
      }
    } else {
      console.error('❌ النظام غير جاهز للإرسال');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await service.disconnect();
    process.exit(0);
  }
}

testWhatsAppConnection();
`;
    
    await fs.writeFile(path.join(__dirname, '..', 'test-enhanced.js'), testScript);
    console.log('✅ تم إنشاء سكريبت الاختبار المحسن');
    
    console.log('\n🎉 تم إصلاح مشاكل اتصال الواتساب!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. أعد تشغيل الخادم: npm start');
    console.log('2. انتظر ظهور QR Code جديد');
    console.log('3. امسح QR Code بهاتفك');
    console.log('4. انتظر رسالة "جاهز للإرسال"');
    console.log('5. اختبر الإرسال: npm run test:enhanced');
    
    console.log('\n💡 نصائح مهمة:');
    console.log('- لا تغلق نافذة Terminal أثناء التشغيل');
    console.log('- تأكد من استقرار اتصال الإنترنت');
    console.log('- انتظر اكتمال تحميل WhatsApp Web قبل الإرسال');
    console.log('- إذا ظهر خطأ getMaybeMeUser مرة أخرى، أعد تشغيل الخادم');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الاتصال:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixWhatsAppConnection();
}

module.exports = fixWhatsAppConnection;