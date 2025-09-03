const fs = require('fs-extra');
const path = require('path');

async function setup() {
  try {
    console.log('🚀 إعداد Venom Proxy Server...');
    
    // إنشاء المجلدات المطلوبة
    const dirs = ['tokens', 'logs', 'backups'];
    for (const dir of dirs) {
      await fs.ensureDir(dir);
      console.log(`📁 تم إنشاء المجلد: ${dir}`);
    }
    
    // نسخ ملف .env إذا لم يكن موجوداً
    if (!await fs.pathExists('.env')) {
      if (await fs.pathExists('.env.example')) {
        await fs.copy('.env.example', '.env');
        console.log('📝 تم نسخ ملف .env من .env.example');
        console.log('⚠️ يرجى تحديث ملف .env بالإعدادات الصحيحة');
      } else {
        console.log('❌ ملف .env.example غير موجود');
      }
    } else {
      console.log('✅ ملف .env موجود بالفعل');
    }
    
    // فحص Chrome
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];
    
    let chromeFound = false;
    for (const chromePath of chromePaths) {
      if (await fs.pathExists(chromePath)) {
        console.log(`✅ تم العثور على Chrome في: ${chromePath}`);
        chromeFound = true;
        break;
      }
    }
    
    if (!chromeFound) {
      console.log('⚠️ لم يتم العثور على Chrome في المسارات المعتادة');
      console.log('💡 يرجى تحديث CHROME_PATH في ملف .env');
    }
    
    console.log('\n🎉 تم إعداد Venom Proxy Server بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. تحديث ملف .env بالإعدادات الصحيحة');
    console.log('2. تشغيل الخادم: npm start');
    console.log('3. مسح QR Code بالهاتف');
    console.log('4. اختبار الاتصال: npm test');
    
  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setup();
}

module.exports = setup;