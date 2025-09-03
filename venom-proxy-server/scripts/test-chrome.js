const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config();

async function testChrome() {
  console.log('🧪 اختبار Chrome و Puppeteer...');
  
  const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log('📍 مسار Chrome:', chromePath);
  
  try {
    console.log('🚀 بدء تشغيل Chrome...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      timeout: 30000
    });
    
    console.log('✅ تم تشغيل Chrome بنجاح');
    
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('✅ تم الوصول إلى WhatsApp Web');
    
    await browser.close();
    console.log('✅ تم إغلاق Chrome بنجاح');
    
    console.log('\n🎉 Chrome يعمل بشكل صحيح!');
    console.log('💡 يمكنك الآن تشغيل venom-bot');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Chrome:', error.message);
    
    if (error.message.includes('Could not find expected browser')) {
      console.log('\n💡 حلول مقترحة:');
      console.log('1. تأكد من تثبيت Chrome');
      console.log('2. تحديث مسار Chrome في .env');
      console.log('3. جرب مسار مختلف:');
      console.log('   - C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
      console.log('   - C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 مشكلة في المهلة الزمنية:');
      console.log('1. تحقق من اتصال الإنترنت');
      console.log('2. أغلق Chrome إذا كان مفتوحاً');
      console.log('3. أعد تشغيل الكمبيوتر');
    }
  }
}

testChrome();