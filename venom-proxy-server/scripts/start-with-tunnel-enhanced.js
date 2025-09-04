const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class TunnelManager {
  constructor() {
    this.whatsappProcess = null;
    this.tunnelProcess = null;
    this.isRunning = false;
    this.tunnelId = '9752631e-8b0d-48a8-b9c1-20f376ce578f';
  }

  async checkCloudflared() {
    try {
      const version = execSync('cloudflared version', { encoding: 'utf8' });
      console.log('✅ cloudflared متوفر:', version.trim());
      return true;
    } catch (error) {
      console.log('❌ cloudflared غير مثبت');
      console.log('\n💡 لتثبيت cloudflared:');
      console.log('   Windows: winget install --id Cloudflare.cloudflared');
      console.log('   macOS: brew install cloudflare/cloudflare/cloudflared');
      console.log('   Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/');
      console.log('\n📋 خطوات الإعداد:');
      console.log('1. cloudflared tunnel login');
      console.log('2. cloudflared tunnel create attendance-venom');
      console.log('3. cloudflared tunnel route dns attendance-venom api.go4host.net');
      return false;
    }
  }

  async checkTunnelExists() {
    try {
      const tunnelList = execSync('cloudflared tunnel list', { encoding: 'utf8' });
      const tunnelExists = tunnelList.includes(this.tunnelId);
      
      if (tunnelExists) {
        console.log(`✅ Tunnel موجود: ${this.tunnelId}`);
        return true;
      } else {
        console.log(`❌ Tunnel غير موجود: ${this.tunnelId}`);
        console.log('💡 يرجى إنشاء Tunnel أولاً:');
        console.log(`   cloudflared tunnel create attendance-venom`);
        console.log(`   cloudflared tunnel route dns attendance-venom api.go4host.net`);
        return false;
      }
    } catch (error) {
      console.log('❌ خطأ في فحص Tunnel:', error.message);
      return false;
    }
  }

  async startWhatsAppProxy() {
    return new Promise((resolve, reject) => {
      console.log('🚀 بدء تشغيل WhatsApp-Web.js Proxy...');
      
      // إعدادات البيئة لـ WhatsApp-Web.js
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        WHATSAPP_HEADLESS: 'true',
        WHATSAPP_DEBUG: 'false',
        ENABLE_TUNNEL: 'true',
        AUTO_START_TUNNEL: 'true',
        WHATSAPP_SERVICE: 'whatsapp-web.js',
        TUNNEL_ID: this.tunnelId
      };
      
      this.whatsappProcess = spawn('node', ['server.js'], {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });
      
      let serverReady = false;
      let qrCodeShown = false;
      
      this.whatsappProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // عرض جميع الرسائل المهمة
        console.log(output.trim());
        
        // التحقق من جاهزية الخادم
        if (output.includes('تم تشغيل WhatsApp Proxy Server بنجاح') && !serverReady) {
          serverReady = true;
          console.log('✅ WhatsApp-Web.js Proxy جاهز');
          resolve();
        }
        
        // فتح المتصفح عند ظهور QR Code
        if (output.includes('تم إنشاء صفحة QR Code') && !qrCodeShown) {
          qrCodeShown = true;
          console.log('📱 QR Code جديد - سيفتح المتصفح تلقائياً');
          
          // فتح المتصفح بعد 5 ثواني
          setTimeout(() => {
            this.openQRInBrowser();
          }, 5000);
        }
        
        // تأكيد الاتصال
        if (output.includes('WhatsApp Web جاهز بالكامل')) {
          console.log('🎉 WhatsApp-Web.js جاهز بالكامل للإرسال!');
        }
      });
      
      this.whatsappProcess.stderr.on('data', (data) => {
        const error = data.toString();
        
        // عرض الأخطاء المهمة فقط
        if (error.includes('Error:') || 
            error.includes('❌') || 
            error.includes('Failed')) {
          console.error('❌ WhatsApp Error:', error.trim());
        }
      });
      
      this.whatsappProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل WhatsApp Proxy:', error.message);
        reject(error);
      });
      
      this.whatsappProcess.on('exit', (code) => {
        console.log(`🔴 WhatsApp Proxy توقف بكود: ${code}`);
        if (code !== 0 && !serverReady) {
          reject(new Error(`WhatsApp Proxy توقف بكود خطأ: ${code}`));
        }
      });
      
      // timeout للتأكد من بدء الخادم
      setTimeout(() => {
        if (!serverReady) {
          console.log('✅ WhatsApp-Web.js Proxy بدأ (timeout)');
          resolve();
        }
      }, 20000);
    });
  }

  async startCloudflaredTunnel() {
    return new Promise((resolve, reject) => {
      console.log(`🌐 بدء تشغيل Cloudflare Tunnel بالـ ID المحدد: ${this.tunnelId}...`);
      
      this.tunnelProcess = spawn('cloudflared', [
        'tunnel',
        'run',
        this.tunnelId
      ], {
        stdio: 'pipe',
        shell: true
      });
      
      let tunnelReady = false;
      
      this.tunnelProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        if (output.includes('Registered tunnel connection')) {
          if (!tunnelReady) {
            tunnelReady = true;
            console.log('✅ Cloudflare Tunnel متصل');
            console.log('🌍 الخادم متاح على: https://api.go4host.net');
            resolve();
          }
        }
      });
      
      this.tunnelProcess.stderr.on('data', (data) => {
        const error = data.toString();
        
        if (error.includes('INF') && error.includes('Registered tunnel connection')) {
          if (!tunnelReady) {
            tunnelReady = true;
            console.log('✅ Cloudflare Tunnel متصل');
            console.log('🌍 الخادم متاح على: https://api.go4host.net');
            resolve();
          }
        }
      });
      
      this.tunnelProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل Cloudflare Tunnel:', error.message);
        reject(error);
      });
      
      this.tunnelProcess.on('exit', (code) => {
        console.log(`🔴 Cloudflare Tunnel توقف بكود: ${code}`);
        if (code !== 0 && !tunnelReady) {
          console.log('⚠️ Tunnel فشل في البدء، سيتم المتابعة بدونه');
          resolve();
        }
      });
      
      setTimeout(() => {
        if (!tunnelReady) {
          console.log('✅ Cloudflare Tunnel بدأ (timeout)');
          resolve();
        }
      }, 30000);
    });
  }

  openQRInBrowser() {
    try {
      const { execSync } = require('child_process');
      const qrURL = 'http://localhost:3002/qr';
      
      console.log('🌐 فتح QR Code في المتصفح...');
      
      if (process.platform === 'win32') {
        execSync(`start ${qrURL}`, { stdio: 'ignore' });
      } else if (process.platform === 'darwin') {
        execSync(`open ${qrURL}`, { stdio: 'ignore' });
      } else {
        execSync(`xdg-open ${qrURL}`, { stdio: 'ignore' });
      }
      
      console.log('✅ تم فتح QR Code في المتصفح');
      
    } catch (error) {
      console.error('❌ خطأ في فتح المتصفح:', error.message);
      console.log(`💡 افتح الرابط يدوياً: ${qrURL}`);
    }
  }

  async start() {
    try {
      console.log('🚀 بدء تشغيل WhatsApp-Web.js مع Cloudflare Tunnel...');
      console.log('📱 خدمة مستقرة وموثوقة');
      console.log(`🌐 Tunnel ID: ${this.tunnelId}`);
      
      // التحقق من cloudflared
      const hasCloudflared = await this.checkCloudflared();
      if (!hasCloudflared) {
        console.log('⚠️ سيتم تشغيل WhatsApp Proxy فقط بدون Tunnel');
        await this.startWhatsAppProxy();
        return;
      }
      
      // التحقق من وجود Tunnel
      const tunnelExists = await this.checkTunnelExists();
      if (!tunnelExists) {
        console.log('⚠️ سيتم تشغيل WhatsApp Proxy فقط بدون Tunnel');
        await this.startWhatsAppProxy();
        return;
      }
      
      // بدء تشغيل WhatsApp Proxy
      await this.startWhatsAppProxy();
      
      // انتظار قليل لضمان بدء الخادم
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // بدء تشغيل Cloudflare Tunnel
      await this.startCloudflaredTunnel();
      
      this.isRunning = true;
      
      console.log('\n🎉 تم تشغيل النظام بنجاح!');
      console.log('📱 امسح QR Code الذي سيظهر لربط الواتساب');
      console.log('🌐 الخادم متاح محلياً على: http://localhost:3002');
      console.log('🌍 الخادم متاح عالمياً على: https://api.go4host.net');
      console.log('📱 خدمة: WhatsApp-Web.js v1.23.0');
      
      // مراقبة العمليات
      this.monitorProcesses();
      
    } catch (error) {
      console.error('❌ خطأ في بدء النظام:', error.message);
      await this.stop();
      process.exit(1);
    }
  }

  monitorProcesses() {
    // مراقبة WhatsApp Proxy
    if (this.whatsappProcess) {
      this.whatsappProcess.on('exit', (code) => {
        console.log(`🔴 WhatsApp Proxy توقف بكود: ${code}`);
        if (code !== 0 && this.isRunning) {
          console.log('🔄 إعادة تشغيل WhatsApp Proxy خلال 15 ثانية...');
          setTimeout(async () => {
            try {
              await this.startWhatsAppProxy();
            } catch (error) {
              console.error('❌ فشل في إعادة تشغيل WhatsApp Proxy:', error.message);
            }
          }, 15000);
        }
      });
    }
    
    // مراقبة Cloudflare Tunnel
    if (this.tunnelProcess) {
      this.tunnelProcess.on('exit', (code) => {
        console.log(`🔴 Cloudflare Tunnel توقف بكود: ${code}`);
        if (code !== 0 && this.isRunning) {
          console.log('🔄 إعادة تشغيل Cloudflare Tunnel خلال 10 ثواني...');
          setTimeout(async () => {
            try {
              await this.startCloudflaredTunnel();
            } catch (error) {
              console.error('❌ فشل في إعادة تشغيل Cloudflare Tunnel:', error.message);
            }
          }, 10000);
        }
      });
    }
  }

  async stop() {
    console.log('🛑 إيقاف جميع العمليات...');
    
    this.isRunning = false;
    
    if (this.whatsappProcess) {
      this.whatsappProcess.kill('SIGTERM');
      console.log('🔴 تم إيقاف WhatsApp Proxy');
    }
    
    if (this.tunnelProcess) {
      this.tunnelProcess.kill('SIGTERM');
      console.log('🔴 تم إيقاف Cloudflare Tunnel');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ تم إيقاف جميع العمليات');
  }
}

async function main() {
  const manager = new TunnelManager();
  
  // معالجة إشارات الإيقاف
  process.on('SIGINT', async () => {
    console.log('\n🛑 تم استلام إشارة الإيقاف...');
    await manager.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 تم استلام إشارة الإنهاء...');
    await manager.stop();
    process.exit(0);
  });
  
  // بدء النظام
  await manager.start();
  
  // إبقاء العملية قيد التشغيل
  process.stdin.resume();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TunnelManager;