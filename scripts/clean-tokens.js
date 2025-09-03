const fs = require('fs-extra');
const path = require('path');
const config = require('../config/whatsapp-config'); // استدعاء الإعدادات

async function cleanTokens(sessionName = null) {
  try {
    const tokensRoot = config.folderNameToken || './tokens';
    const targetPath = sessionName
      ? path.join(tokensRoot, sessionName)
      : tokensRoot;

    console.log('🧹 بدء تنظيف ملفات التوكن...');
    console.log(`🎯 المسار المستهدف: ${targetPath}`);

    if (await fs.pathExists(targetPath)) {
      const backupPath = `${targetPath}_backup_${Date.now()}`;
      console.log('💾 إنشاء نسخة احتياطية...');
      await fs.copy(targetPath, backupPath);
      console.log(`✅ تم إنشاء نسخة احتياطية في: ${backupPath}`);

      await fs.remove(targetPath);
      console.log('🗑️ تم حذف مجلد التوكن');

      if (!sessionName) {
        await fs.ensureDir(tokensRoot);
        console.log('📁 تم إنشاء مجلد توكن جديد');
      }

      console.log('✅ تم تنظيف ملفات التوكن بنجاح!');
    } else {
      console.log('ℹ️ مجلد التوكن غير موجود أو تم تحديد جلسة غير موجودة');
    }
  } catch (error) {
    console.error('❌ خطأ في تنظيف التوكن:', error);
  }
}

if (require.main === module) {
  // تمرير اسم الجلسة من CLI لو عايز
  const sessionArg = process.argv[2] || null;
  cleanTokens(sessionArg);
}

module.exports = cleanTokens;
