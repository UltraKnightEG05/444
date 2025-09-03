const fs = require('fs-extra');
const { execSync } = require('child_process');

async function ultimateClean() {
  console.log('🧹 التنظيف النهائي لـ venom v5.3.0...');
  console.log('🎯 تنظيف شامل لحل مشكلة getMaybeMeUser');
  
  try {
    // 1. إيقاف جميع العمليات
    console.log('🛑 إيقاف جميع العمليات...');
    
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
        execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
        execSync('taskkill /F /IM cloudflared.exe', { stdio: 'ignore' });
        console.log('✅ تم إيقاف جميع العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    } else {
      try {
        execSync('pkill -f node', { stdio: 'ignore' });
        execSync('pkill -f chrome', { stdio: 'ignore' });
        execSync('pkill -f cloudflared', { stdio: 'ignore' });
        console.log('✅ تم إيقاف جميع العمليات');
      } catch (error) {
        console.log('⚠️ لم يتم العثور على عمليات للإيقاف');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. نسخ احتياطي للتوكن
    console.log('💾 إنشاء نسخة احتياطية للتوكن...');
    const tokensPath = './tokens';
    const backupPath = `./backups/tokens_backup_v530_${Date.now()}`;
    
    if (await fs.pathExists(tokensPath)) {
      await fs.ensureDir('./backups');
      await fs.copy(tokensPath, backupPath);
      console.log(`✅ نسخة احتياطية في: ${backupPath}`);
    }
    
    // 3. تنظيف الملفات
    console.log('🗑️ تنظيف الملفات...');
    const cleanPaths = [
      './tokens',
      './logs/*.log',
      './logs/qr-code-*',
      './temp',
      './cache'
    ];
    
    for (const cleanPath of cleanPaths) {
      if (cleanPath.includes('*')) {
        const dir = require('path').dirname(cleanPath);
        const pattern = require('path').basename(cleanPath);
        
        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);
          for (const file of files) {
            if (file.match(pattern.replace('*', '.*'))) {
              await fs.remove(require('path').join(dir, file));
            }
          }
        }
      } else {
        if (await fs.pathExists(cleanPath)) {
          await fs.remove(cleanPath);
        }
      }
    }
    
    // 4. إعادة إنشاء المجلدات
    await fs.ensureDir('./tokens');
    await fs.ensureDir('./logs');
    await fs.ensureDir('./backups');
    console.log('📁 تم إعادة إنشاء المجلدات');
    
    // 5. تنظيف Chrome cache (Windows)
    if (process.platform === 'win32') {
      console.log('🧹 تنظيف Chrome cache...');
      const userProfile = process.env.USERPROFILE;
      if (userProfile) {
        const chromeCachePaths = [
          `${userProfile}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache`,
          `${userProfile}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Code Cache`,
          `${userProfile}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\GPUCache`
        ];
        
        for (const cachePath of chromeCachePaths) {
          try {
            if (await fs.pathExists(cachePath)) {
              await fs.remove(cachePath);
              console.log(`🗑️ تم تنظيف: ${cachePath}`);
            }
          } catch (error) {
            console.log(`⚠️ لم يتم تنظيف ${cachePath} (قد يكون Chrome مفتوح)`);
          }
        }
      }
    }
    
    console.log('✅ تم التنظيف النهائي بنجاح لـ v5.3.0');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. شغّل النظام: npm run start:tunnel:ultimate');
    console.log('2. أو استخدم: start-ultimate-tunnel.bat');
    console.log('3. انتظر ظهور QR Code');
    console.log('4. امسح QR Code بهاتفك');
    console.log('5. انتظر رسالة "جاهز بالكامل للإرسال"');
    
  } catch (error) {
    console.error('❌ خطأ في التنظيف:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  ultimateClean();
}

module.exports = ultimateClean;