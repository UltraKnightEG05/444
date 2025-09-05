const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function startWithTunnel() {
  console.log('🚀 بدء تشغيل Venom Proxy مع Cloudflare Tunnel...');
  
  // التحقق من وجود cloudflared
  try {
    const { execSync } = require('child_process');
    execSync('cloudflared version', { stdio: 'pipe' });
    console.log('✅ cloudflared متوفر');
  } catch (error) {
    console.log('❌ cloudflared غير مثبت');
    console.log('💡 لتثبيت cloudflared:');
    console.log('   Windows: winget install --id Cloudflare.cloudflared');
    console.log('   macOS: brew install cloudflare/cloudflare/cloudflared');
    console.log('   Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/');
    process.exit(1);
  }
  
  // بدء تشغيل Venom Proxy
  console.log('🔄 بدء تشغيل Venom Proxy...');
  const venomProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true
  });
  
  // انتظار قليل لبدء الخادم
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // بدء تشغيل Cloudflare Tunnel
  console.log('🌐 بدء تشغيل Cloudflare Tunnel...');
  const tunnelProcess = spawn('cloudflared', [
    'tunnel',
    'run',
    '--url',
    'http://localhost:3002',
    'attendance-venom'
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  // معالجة إغلاق العمليات
  process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف العمليات...');
    venomProcess.kill('SIGINT');
    tunnelProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 إيقاف العمليات...');
    venomProcess.kill('SIGTERM');
    tunnelProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  venomProcess.on('exit', (code) => {
    console.log(`🔴 Venom Proxy توقف بكود: ${code}`);
    tunnelProcess.kill();
    process.exit(code);
  });
  
  tunnelProcess.on('exit', (code) => {
    console.log(`🔴 Cloudflare Tunnel توقف بكود: ${code}`);
    venomProcess.kill();
    process.exit(code);
  });
  
  console.log('✅ تم تشغيل النظام بنجاح!');
  console.log('📱 امسح QR Code الذي سيظهر لربط الواتساب');
  console.log('🌐 الخادم متاح على: https://api.go4host.net');
}

if (require.main === module) {
  startWithTunnel().catch(console.error);
}

module.exports = startWithTunnel;