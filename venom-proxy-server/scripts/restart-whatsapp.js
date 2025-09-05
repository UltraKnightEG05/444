const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function restartWhatsApp() {
  console.log('🔄 إعادة تشغيل خدمة الواتساب...');
  
  try {
    // 1. إيقاف العمليات الحالية
    console.log('🛑 إيقاف العمليات الحالية...');
    
    if (process.platform === 'win32') {
      // إيقاف node.exe المرتبط بـ venom
      spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq venom*'], { stdio: 'ignore' });
      // إيقاف Chrome
      spawn('taskkill', ['/F', '/IM', 'chrome.exe'], { stdio: 'ignore' });
      spawn('taskkill', ['/F', '/IM', 'chromium.exe'], { stdio: 'ignore' });
    } else {
      spawn('pkill', ['-f', 'venom'], { stdio: 'ignore' });
      spawn('pkill', ['-f', 'chrome'], { stdio: 'ignore' });
      spawn('pkill', ['-f', 'chromium'], { stdio: 'ignore' });
    }
    
    // انتظار 5 ثواني
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. تنظيف الملفات المؤقتة
    console.log('🧹 تنظيف الملفات المؤقتة...');
    
    const tempPaths = [
      './tokens',
      './logs/qr-code-*.png',
      './logs/*.log'
    ];
    
    for (const tempPath of tempPaths) {
      try {
        if (tempPath.includes('*')) {
          // حذف الملفات المطابقة للنمط
          const dir = path.dirname(tempPath);
          const pattern = path.basename(tempPath);
          
          if (await fs.pathExists(dir)) {
            const files = await fs.readdir(dir);
            for (const file of files) {
              if (file.match(pattern.replace('*', '.*'))) {
                await fs.remove(path.join(dir, file));
              }
            }
          }
        } else {
          if (await fs.pathExists(tempPath)) {
            await fs.remove(tempPath);
          }
        }
      } catch (error) {
        console.log(`⚠️ لم يتم حذف ${tempPath}:`, error.message);
      }
    }
    
    // إعادة إنشاء المجلدات
    await fs.ensureDir('./tokens');
    await fs.ensureDir('./logs');
    console.log('📁 تم إعادة إنشاء المجلدات');
    
    // 3. تحديث إعدادات venom
    console.log('⚙️ تحديث إعدادات venom...');
    const configPath = './venom-config.json';
    const config = {
      session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
      folderNameToken: './tokens',
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
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw'
      ]
    };
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    console.log('✅ تم تحديث إعدادات venom');
    
    console.log('\n🎉 تم إعادة تشغيل خدمة الواتساب بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. شغّل الخادم: npm start');
    console.log('2. انتظر ظهور QR Code');
    console.log('3. امسح QR Code بهاتفك');
    console.log('4. انتظر رسالة "جاهز للإرسال"');
    console.log('5. اختبر الإرسال');
    
    console.log('\n⚠️ ملاحظات مهمة:');
    console.log('- تأكد من إغلاق جميع نوافذ Chrome قبل البدء');
    console.log('- لا تفتح WhatsApp Web في متصفح آخر أثناء التشغيل');
    console.log('- انتظر اكتمال تحميل الواجهة قبل الإرسال');
    console.log('- إذا ظهر خطأ getMaybeMeUser، أعد تشغيل الخادم');
    
  } catch (error) {
    console.error('❌ خطأ في إعادة تشغيل الواتساب:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  restartWhatsApp();
}

module.exports = restartWhatsApp;