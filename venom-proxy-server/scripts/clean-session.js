const fs = require('fs-extra');
const path = require('path');

async function cleanSession() {
  try {
    console.log('🧹 بدء تنظيف جلسة الواتساب...');
    
    const tokensPath = './tokens';
    const logsPath = './logs';
    
    // إنشاء نسخة احتياطية قبل الحذف
    if (await fs.pathExists(tokensPath)) {
      const backupPath = `./backups/tokens_backup_${Date.now()}`;
      await fs.ensureDir('./backups');
      await fs.copy(tokensPath, backupPath);
      console.log(`💾 تم إنشاء نسخة احتياطية في: ${backupPath}`);
      
      // حذف مجلد التوكن
      await fs.remove(tokensPath);
      console.log('🗑️ تم حذف مجلد التوكن');
    }
    
    // إعادة إنشاء المجلدات
    await fs.ensureDir(tokensPath);
    await fs.ensureDir(logsPath);
    console.log('📁 تم إنشاء المجلدات الجديدة');
    
    console.log('✅ تم تنظيف الجلسة بنجاح!');
    console.log('💡 يمكنك الآن بدء جلسة جديدة');
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف الجلسة:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanSession();
}

module.exports = cleanSession;