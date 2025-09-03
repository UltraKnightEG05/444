const fs = require('fs-extra');
const { execSync } = require('child_process');
const os = require('os');

async function installChrome() {
  const platform = os.platform();
  
  console.log('🌐 بدء تثبيت Google Chrome...');
  console.log('💻 نظام التشغيل:', platform);
  
  try {
    switch (platform) {
      case 'win32':
        await installChromeWindows();
        break;
      case 'linux':
        await installChromeLinux();
        break;
      case 'darwin':
        await installChromeMacOS();
        break;
      default:
        console.log('❌ نظام التشغيل غير مدعوم:', platform);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ خطأ في تثبيت Chrome:', error.message);
    console.log('\n💡 يمكنك تثبيت Chrome يدوياً من: https://www.google.com/chrome/');
    process.exit(1);
  }
}

async function installChromeWindows() {
  console.log('🪟 تثبيت Chrome على Windows...');
  
  // التحقق من وجود Chrome
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  
  for (const path of chromePaths) {
    if (await fs.pathExists(path)) {
      console.log('✅ Chrome موجود بالفعل في:', path);
      return;
    }
  }
  
  console.log('📥 تحميل Chrome...');
  console.log('💡 يرجى تحميل Chrome من: https://www.google.com/chrome/');
  console.log('💡 أو استخدم winget: winget install Google.Chrome');
  
  try {
    execSync('winget install Google.Chrome', { stdio: 'inherit' });
    console.log('✅ تم تثبيت Chrome بنجاح');
  } catch (error) {
    console.log('⚠️ فشل التثبيت التلقائي، يرجى التثبيت يدوياً');
  }
}

async function installChromeLinux() {
  console.log('🐧 تثبيت Chrome على Linux...');
  
  // التحقق من وجود Chrome
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  
  for (const path of chromePaths) {
    if (await fs.pathExists(path)) {
      console.log('✅ Chrome/Chromium موجود بالفعل في:', path);
      return;
    }
  }
  
  console.log('📥 تثبيت Chrome...');
  
  try {
    // محاولة تثبيت Chrome
    console.log('🔄 إضافة مفتاح Google...');
    execSync('wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -', { stdio: 'inherit' });
    
    console.log('🔄 إضافة مستودع Chrome...');
    execSync('sudo sh -c \'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list\'', { stdio: 'inherit' });
    
    console.log('🔄 تحديث قائمة الحزم...');
    execSync('sudo apt update', { stdio: 'inherit' });
    
    console.log('🔄 تثبيت Chrome...');
    execSync('sudo apt install -y google-chrome-stable', { stdio: 'inherit' });
    
    console.log('✅ تم تثبيت Chrome بنجاح');
  } catch (error) {
    console.log('⚠️ فشل تثبيت Chrome، محاولة تثبيت Chromium...');
    try {
      execSync('sudo apt install -y chromium-browser', { stdio: 'inherit' });
      console.log('✅ تم تثبيت Chromium بنجاح');
    } catch (chromiumError) {
      console.log('❌ فشل في تثبيت المتصفح');
      console.log('💡 جرب تثبيت Chrome يدوياً:');
      console.log('   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb');
      console.log('   sudo dpkg -i google-chrome-stable_current_amd64.deb');
      console.log('   sudo apt-get install -f');
    }
  }
}

async function installChromeMacOS() {
  console.log('🍎 تثبيت Chrome على macOS...');
  
  // التحقق من وجود Chrome
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  
  if (await fs.pathExists(chromePath)) {
    console.log('✅ Chrome موجود بالفعل في:', chromePath);
    return;
  }
  
  console.log('📥 تثبيت Chrome...');
  
  try {
    // محاولة التثبيت عبر Homebrew
    execSync('brew install --cask google-chrome', { stdio: 'inherit' });
    console.log('✅ تم تثبيت Chrome بنجاح');
  } catch (error) {
    console.log('⚠️ فشل التثبيت عبر Homebrew');
    console.log('💡 يرجى تحميل Chrome من: https://www.google.com/chrome/');
    console.log('💡 أو تثبيت Homebrew أولاً: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
  }
}

if (require.main === module) {
  installChrome();
}

module.exports = installChrome;