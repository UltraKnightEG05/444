const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح مشاكل Chrome مع venom-bot...');

async function fixChrome() {
  try {
    // 1. إغلاق جميع عمليات Chrome
    console.log('🔄 إغلاق جميع عمليات Chrome...');
    
    if (process.platform === 'win32') {
      spawn('taskkill', ['/F', '/IM', 'chrome.exe'], { stdio: 'ignore' });
      spawn('taskkill', ['/F', '/IM', 'chromium.exe'], { stdio: 'ignore' });
    } else {
      spawn('pkill', ['-f', 'chrome'], { stdio: 'ignore' });
      spawn('pkill', ['-f', 'chromium'], { stdio: 'ignore' });
    }
    
    // انتظار 3 ثواني
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. تنظيف مجلد التوكن
    console.log('🧹 تنظيف مجلد التوكن...');
    const tokensPath = path.join(__dirname, '..', 'tokens');
    if (fs.existsSync(tokensPath)) {
      fs.rmSync(tokensPath, { recursive: true, force: true });
    }
    fs.mkdirSync(tokensPath, { recursive: true });
    
    // 3. تنظيف مجلد السجلات
    console.log('🧹 تنظيف مجلد السجلات...');
    const logsPath = path.join(__dirname, '..', 'logs');
    if (fs.existsSync(logsPath)) {
      fs.rmSync(logsPath, { recursive: true, force: true });
    }
    fs.mkdirSync(logsPath, { recursive: true });
    
    // 4. تنظيف cache المتصفح
    console.log('🧹 تنظيف cache المتصفح...');
    const userDataPath = path.join(process.env.USERPROFILE || process.env.HOME, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    const tempPath = path.join(userDataPath, 'Default', 'Cache');
    
    if (fs.existsSync(tempPath)) {
      try {
        fs.rmSync(tempPath, { recursive: true, force: true });
        console.log('✅ تم تنظيف cache Chrome');
      } catch (error) {
        console.log('⚠️ لم يتم تنظيف cache (قد يكون Chrome مفتوح)');
      }
    }
    
    // 5. إنشاء ملف .nodemonignore
    console.log('📝 إنشاء ملف .nodemonignore...');
    const nodemonIgnore = `tokens/
logs/
*.log
*.json
.env
node_modules/
backups/
temp/
cache/
session/
.wwebjs_auth/
.wwebjs_cache/`;
    
    fs.writeFileSync(path.join(__dirname, '..', '.nodemonignore'), nodemonIgnore);
    
    console.log('✅ تم إصلاح مشاكل Chrome!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. تأكد من إغلاق جميع نوافذ Chrome');
    console.log('2. شغّل الخادم: npm start');
    console.log('3. انتظر ظهور QR Code');
    console.log('4. امسح QR Code بهاتفك');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح Chrome:', error);
  }
}

fixChrome();