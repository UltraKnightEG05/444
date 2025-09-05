const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح مشاكل venom-bot...');

// حذف مجلد node_modules وإعادة التثبيت
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');

try {
  if (fs.existsSync(nodeModulesPath)) {
    console.log('🗑️ حذف مجلد node_modules...');
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  
  if (fs.existsSync(packageLockPath)) {
    console.log('🗑️ حذف package-lock.json...');
    fs.unlinkSync(packageLockPath);
  }
  
  console.log('✅ تم تنظيف الملفات');
  console.log('📦 الآن قم بتشغيل: npm install');
  console.log('🚀 ثم: npm start');
  
} catch (error) {
  console.error('❌ خطأ في التنظيف:', error);
}