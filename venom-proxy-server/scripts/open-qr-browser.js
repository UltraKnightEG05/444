const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function openQRInBrowser() {
  console.log('🌐 فتح QR Code في المتصفح...');
  
  const qrURL = 'http://localhost:3002/qr';
  
  try {
    // فتح المتصفح حسب نظام التشغيل
    if (process.platform === 'win32') {
      execSync(`start ${qrURL}`, { stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
      execSync(`open ${qrURL}`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open ${qrURL}`, { stdio: 'ignore' });
    }
    
    console.log('✅ تم فتح QR Code في المتصفح');
    console.log(`🔗 الرابط: ${qrURL}`);
    
  } catch (error) {
    console.error('❌ خطأ في فتح المتصفح:', error.message);
    console.log(`💡 افتح الرابط يدوياً: ${qrURL}`);
  }
}

// فتح QR Code بعد 15 ثانية من بدء الخادم
setTimeout(() => {
  // التحقق من وجود الخادم
  const http = require('http');
  const req = http.request('http://localhost:3002/api/test', (res) => {
    if (res.statusCode === 200) {
      console.log('🌐 الخادم جاهز - فتح QR Code في المتصفح...');
      openQRInBrowser();
    }
  });
  
  req.on('error', () => {
    console.log('⏳ الخادم لا يزال يحمل...');
  });
  
  req.end();
}, 15000);

module.exports = openQRInBrowser;