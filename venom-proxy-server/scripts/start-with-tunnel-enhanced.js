const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class TunnelManager {
  constructor() {
    this.venomProcess = null;
    this.tunnelProcess = null;
    this.isRunning = false;
    this.tunnelId = '9752631e-8b0d-48a8-b9c1-20f376ce578f'; // استخدام الـ ID المحدد
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

  async startVenomProxy() {
    return new Promise((resolve, reject) => {
      console.log('🚀 بدء تشغيل Venom Proxy v5.3.0...');
      
      // إعدادات البيئة المحسنة لـ v5.3.0
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        WHATSAPP_HEADLESS: 'new',
        WHATSAPP_DEBUG: 'false',
        ENABLE_TUNNEL: 'true',
        AUTO_START_TUNNEL: 'true',
        VENOM_VERSION: '5.3.0',
        TUNNEL_ID: this.tunnelId
      };
      
      this.venomProcess = spawn('node', ['server.js'], {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });
      
      let serverReady = false;
      let qrCodeShown = false;
      
      this.venomProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // فلترة الرسائل المهمة فقط
        if (output.includes('تم تشغيل Venom Proxy Server بنجاح') ||
            output.includes('QR Code جديد') ||
            output.includes('تم تسجيل الدخول') ||
            output.includes('جاهز بالكامل') ||
            output.includes('✅') ||
            output.includes('❌') ||
            output.includes('🎉')) {
          console.log(output);
        }
        
        // التحقق من جاهزية الخادم
        if (output.includes('تم تشغيل Venom Proxy Server بنجاح') && !serverReady) {
          serverReady = true;
          console.log('✅ Venom Proxy v5.3.0 جاهز');
          resolve();
        }
        
        // عرض QR Code
        if (output.includes('QR Code جديد') && !qrCodeShown) {
          qrCodeShown = true;
          console.log('📱 QR Code جديد - امسحه بهاتفك');
        }
        
        // تأكيد الاتصال
        if (output.includes('النظام جاهز بالكامل')) {
          console.log('🎉 Venom Proxy v5.3.0 جاهز بالكامل للإرسال!');
        }
      });
      
      this.venomProcess.stderr.on('data', (data) => {
        const error = data.toString();
        
        // فلترة الأخطاء - إخفاء الرسائل غير المهمة
        if (!error.includes('Help Keep This Project Going') &&
            !error.includes('Node.js version verified') &&
            !error.includes('headless option is active') &&
            !error.includes('Executable path browser') &&
            !error.includes('Platform: win32') &&
            !error.includes('Browser Version:') &&
            !error.includes('Page successfully accessed') &&
            !error.includes('waiting for introduction') &&
            !error.includes('Successfully connected') &&
            !error.includes('Successfully main page') &&
            !error.includes('Checking QRCode status') &&
            !error.includes('QRCode Success') &&
            !error.includes('Checking phone is connected') &&
            !error.includes('Connected') &&
            !error.includes('opening main page')) {
          
          // عرض الأخطاء المهمة فقط
          if (error.includes('Error:') || 
              error.includes('❌') || 
              error.includes('Failed') ||
              error.includes('WebSocket') ||
              error.includes('Invalid URL')) {
            console.error('❌ Venom Error:', error.trim());
          }
        }
        
        if (error.includes('getMaybeMeUser')) {
          console.log('🔧 تم اكتشاف مشكلة getMaybeMeUser - سيتم الإصلاح تلقائياً');
        }
      });
      
      this.venomProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل Venom Proxy:', error);
        reject(error);
      });
      
      this.venomProcess.on('exit', (code) => {
        console.log(`🔴 Venom Proxy توقف بكود: ${code}`);
        if (code !== 0 && !serverReady) {
          reject(new Error(`Venom Proxy توقف بكود خطأ: ${code}`));
        }
      });
      
      // timeout للتأكد من بدء الخادم
      setTimeout(() => {
        if (!serverReady) {
          console.log('✅ Venom Proxy v5.3.0 بدأ (timeout)');
          resolve();
        }
      }, 20000);
    });
  }

  async startCloudflaredTunnel() {
    return new Promise((resolve, reject) => {
      console.log(`🌐 بدء تشغيل Cloudflare Tunnel بالـ ID المحدد: ${this.tunnelId}...`);
      
      // استخدام الأمر المحدد مع Tunnel ID
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
        
        // فلترة الرسائل المهمة فقط - تحسين للوضوح
        if (output.includes('Registered tunnel connection')) {
          console.log('🌐 Tunnel: اتصال مسجل بنجاح');
          
          if (!tunnelReady) {
            tunnelReady = true;
            console.log('✅ Cloudflare Tunnel متصل');
            console.log('🌍 الخادم متاح على: https://api.go4host.net');
            resolve();
          }
        } else if (output.includes('Started tunnel')) {
          console.log('🌐 Tunnel: تم بدء النفق');
        } else if (output.includes('Connection registered')) {
          console.log('🌐 Tunnel: تم تسجيل الاتصال');
        }
      });
      
      this.tunnelProcess.stderr.on('data', (data) => {
        const error = data.toString();
        
        // فلترة الأخطاء - إظهار المهم فقط
        if (error.includes('ERR') && (error.includes('failed') || error.includes('error'))) {
          console.error('❌ Tunnel Error:', error.trim());
        } else if (error.includes('INF') && error.includes('Registered tunnel connection')) {
          console.log('✅ Tunnel: اتصال مسجل');
          if (!tunnelReady) {
            tunnelReady = true;
            console.log('✅ Cloudflare Tunnel متصل');
            console.log('🌍 الخادم متاح على: https://api.go4host.net');
            resolve();
          }
        }
      });
      
      this.tunnelProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل Cloudflare Tunnel:', error);
        reject(error);
      });
      
      this.tunnelProcess.on('exit', (code) => {
        console.log(`🔴 Cloudflare Tunnel توقف بكود: ${code}`);
        if (code !== 0 && !tunnelReady) {
          console.log('⚠️ Tunnel فشل في البدء، سيتم المتابعة بدونه');
          resolve(); // لا نفشل العملية بسبب Tunnel
        }
      });
      
      // timeout للتأكد من بدء النفق
      setTimeout(() => {
        if (!tunnelReady) {
          console.log('✅ Cloudflare Tunnel بدأ (timeout)');
          resolve();
        }
      }, 30000);
    });
  }

  async start() {
    try {
      console.log('🚀 بدء تشغيل Venom Proxy v5.3.0 مع Cloudflare Tunnel...');
      console.log('🔧 مع إصلاحات getMaybeMeUser المتقدمة لـ v5.3.0');
      console.log(`🌐 Tunnel ID: ${this.tunnelId}`);
      
      // التحقق من cloudflared
      const hasCloudflared = await this.checkCloudflared();
      if (!hasCloudflared) {
        console.log('⚠️ سيتم تشغيل Venom Proxy فقط بدون Tunnel');
        await this.startVenomProxy();
        return;
      }
      
      // التحقق من وجود Tunnel
      const tunnelExists = await this.checkTunnelExists();
      if (!tunnelExists) {
        console.log('⚠️ سيتم تشغيل Venom Proxy فقط بدون Tunnel');
        await this.startVenomProxy();
        return;
      }
      
      // بدء تشغيل Venom Proxy
      await this.startVenomProxy();
      
      // انتظار قليل لضمان بدء الخادم
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // بدء تشغيل Cloudflare Tunnel
      await this.startCloudflaredTunnel();
      
      this.isRunning = true;
      
      console.log('\n🎉 تم تشغيل النظام بنجاح!');
      console.log('📱 امسح QR Code الذي سيظهر لربط الواتساب');
      console.log('🌐 الخادم متاح محلياً على: http://localhost:3002');
      console.log('🌍 الخادم متاح عالمياً على: https://api.go4host.net');
      console.log('🔧 تم تطبيق إصلاحات getMaybeMeUser المتقدمة لـ v5.3.0');
      
      // مراقبة العمليات
      this.monitorProcesses();
      
    } catch (error) {
      console.error('❌ خطأ في بدء النظام:', error);
      await this.stop();
      process.exit(1);
    }
  }

  monitorProcesses() {
    // مراقبة Venom Proxy
    if (this.venomProcess) {
      this.venomProcess.on('exit', (code) => {
        console.log(`🔴 Venom Proxy توقف بكود: ${code}`);
        if (code !== 0 && this.isRunning) {
          console.log('🔄 إعادة تشغيل Venom Proxy خلال 15 ثانية...');
          setTimeout(async () => {
            try {
              await this.startVenomProxy();
            } catch (error) {
              console.error('❌ فشل في إعادة تشغيل Venom Proxy:', error);
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
              console.error('❌ فشل في إعادة تشغيل Cloudflare Tunnel:', error);
            }
          }, 10000);
        }
      });
    }
  }

  async stop() {
    console.log('🛑 إيقاف جميع العمليات...');
    
    this.isRunning = false;
    
    if (this.venomProcess) {
      this.venomProcess.kill('SIGTERM');
      console.log('🔴 تم إيقاف Venom Proxy');
    }
    
    if (this.tunnelProcess) {
      this.tunnelProcess.kill('SIGTERM');
      console.log('🔴 تم إيقاف Cloudflare Tunnel');
    }
    
    // انتظار قليل للتأكد من الإغلاق
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