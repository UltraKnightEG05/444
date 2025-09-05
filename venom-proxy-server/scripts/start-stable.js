const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء تشغيل Venom Proxy بشكل مستقر...');

// التحقق من الملفات المطلوبة
const requiredFiles = ['.env', 'server.js'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ الملف المطلوب غير موجود: ${file}`);
    process.exit(1);
  }
}

// التحقق من المجلدات
const requiredDirs = ['tokens', 'logs'];
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 تم إنشاء المجلد: ${dir}`);
  }
}

// إعدادات البيئة للاستقرار
const env = {
  ...process.env,
  NODE_ENV: 'production',
  WHATSAPP_HEADLESS: 'false', // بدء بدون headless
  WHATSAPP_DEBUG: 'true',
  WHATSAPP_DISABLE_SPINS: 'true',
  WHATSAPP_DISABLE_WELCOME: 'true'
};

console.log('📋 إعدادات التشغيل:');
console.log('- Headless:', env.WHATSAPP_HEADLESS);
console.log('- Debug:', env.WHATSAPP_DEBUG);
console.log('- Chrome Path:', env.CHROME_PATH);

// تشغيل الخادم
const server = spawn('node', ['server.js'], {
  env,
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('❌ خطأ في تشغيل الخادم:', error);
});

server.on('exit', (code) => {
  console.log(`🛑 الخادم توقف برمز: ${code}`);
  
  if (code !== 0) {
    console.log('🔄 إعادة تشغيل تلقائي خلال 5 ثواني...');
    setTimeout(() => {
      console.log('🚀 إعادة تشغيل الخادم...');
      // إعادة تشغيل
      require('child_process').spawn('node', [__filename], {
        detached: true,
        stdio: 'inherit'
      });
    }, 5000);
  }
});

// معالجة إشارات الإيقاف
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف الخادم...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف الخادم...');
  server.kill('SIGTERM');
  process.exit(0);
});