const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 تشغيل Venom Proxy بدون nodemon...');

// إعدادات البيئة
const env = {
  ...process.env,
  NODE_ENV: 'production',
  WHATSAPP_HEADLESS: 'false', // بدء بدون headless
  WHATSAPP_DEBUG: 'false',    // تقليل الرسائل
  WHATSAPP_DISABLE_SPINS: 'true',
  WHATSAPP_DISABLE_WELCOME: 'true'
};

console.log('📋 إعدادات التشغيل:');
console.log('- Headless:', env.WHATSAPP_HEADLESS);
console.log('- Debug:', env.WHATSAPP_DEBUG);
console.log('- Chrome Path:', env.CHROME_PATH);

// تشغيل الخادم مباشرة بدون nodemon
const server = spawn('node', ['server.js'], {
  env,
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

server.on('error', (error) => {
  console.error('❌ خطأ في تشغيل الخادم:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🛑 الخادم توقف برمز: ${code}`);
  process.exit(code);
});

// معالجة إشارات الإيقاف
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف الخادم...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف الخادم...');
  server.kill('SIGTERM');
});

console.log('\n💡 نصائح:');
console.log('- انتظر ظهور QR Code (قد يستغرق دقيقة)');
console.log('- لا تغلق هذه النافذة أثناء التشغيل');
console.log('- اضغط Ctrl+C للإيقاف');