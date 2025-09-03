const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class TunnelManager {
  constructor() {
    this.venomProcess = null;
    this.tunnelProcess = null;
    this.isRunning = false;
  }

  async checkCloudflared() {
    try {
      execSync('cloudflared version', { stdio: 'pipe' });
      console.log('✅ cloudflared متوفر');
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

  async checkTunnelConfig() {
    const configPath = path.join(require('os').homedir(), '.cloudflared', 'config.yml');
    
    if (!await fs.pathExists(configPath)) {
      console.log('📝 إنشاء ملف إعدادات Cloudflare Tunnel...');
      
      const configContent = `tunnel: attendance-venom
credentials-file: ~/.cloudflared/attendance-venom.json

ingress:
  - hostname: api.go4host.net
    service: http://localhost:3002
    originRequest:
      connectTimeout: 30s
      tlsTimeout: 30s
      tcpKeepAlive: 30s
      keepAliveConnections: 10
      keepAliveTimeout: 90s
      httpHostHeader: api.go4host.net
  - service: http_status:404

# إعدادات إضافية للاستقرار
metrics: 0.0.0.0:8080
no-autoupdate: true
protocol: quic
`;
      
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeFile(configPath, configContent);
      console.log('✅ تم إنشاء ملف إعدادات Tunnel');
      
      console.log('\n⚠️ يرجى تشغيل الأوامر التالية أولاً:');
      console.log('1. cloudflared tunnel login');
      console.log('2. cloudflared tunnel create attendance-venom');
      console.log('3. cloudflared tunnel route dns attendance-venom api.go4host.net');
      
      return false;
    }
    
    return true;
  }

  async startVenomProxy() {
    return new Promise((resolve, reject) => {
      console.log('🚀 بدء تشغيل Venom Proxy...');
      
      // إعدادات البيئة المحسنة
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        WHATSAPP_HEADLESS: 'new',
        WHATSAPP_DEBUG: 'false',
        ENABLE_TUNNEL: 'true',
        AUTO_START_TUNNEL: 'true'
      };
      
      this.venomProcess = spawn('node', ['server.js'], {
        env,
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });
      
      let serverReady = false;
      
      this.venomProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        // التحقق من جاهزية الخادم
        if (output.includes('تم تشغيل Venom Proxy Server بنجاح') && !serverReady) {
          serverReady = true;
          console.log('✅ Venom Proxy جاهز');
          resolve();
        }
        
        // عرض QR Code
        if (output.includes('QR Code جديد')) {
          console.log('📱 QR Code جديد - امسحه بهاتفك');
        }
        
        // تأكيد الاتصال
        if (output.includes('النظام جاهز بالكامل')) {
          console.log('🎉 Venom Proxy جاهز بالكامل للإرسال!');
        }
      });
      
      this.venomProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('❌ Venom Error:', error);
        
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
          console.log('✅ Venom Proxy بدأ (timeout)');
          resolve();
        }
      }, 10000);
    });
  }

  async startCloudflaredTunnel() {
    return new Promise((resolve, reject) => {
      console.log('🌐 بدء تشغيل Cloudflare Tunnel...');
      
      this.tunnelProcess = spawn('cloudflared', [
        'tunnel',
        'run',
        'attendance-venom'
      ], {
        stdio: 'pipe'
      });
      
      let tunnelReady = false;
      
      this.tunnelProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('🌐 Tunnel:', output);
        
        if ((output.includes('Registered tunnel connection') || 
             output.includes('Started tunnel') ||
             output.includes('Connection registered')) && !tunnelReady) {
          tunnelReady = true;
          console.log('✅ Cloudflare Tunnel متصل');
          console.log('🌍 الخادم متاح على: https://api.go4host.net');
          resolve();
        }
      });
      
      this.tunnelProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('❌ Tunnel Error:', error);
        
        if (error.includes('failed to connect to the edge') || 
            error.includes('connection failed')) {
          console.log('🔄 محاولة إعادة الاتصال...');
        }
      });
      
      this.tunnelProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل Cloudflare Tunnel:', error);
        reject(error);
      });
      
      this.tunnelProcess.on('exit', (code) => {
        console.log(`🔴 Cloudflare Tunnel توقف بكود: ${code}`);
        if (code !== 0 && !tunnelReady) {
          reject(new Error(`Cloudflare Tunnel توقف بكود خطأ: ${code}`));
        }
      });
      
      // timeout للتأكد من بدء النفق
      setTimeout(() => {
        if (!tunnelReady) {
          console.log('✅ Cloudflare Tunnel بدأ (timeout)');
          resolve();
        }
      }, 15000);
    });
  }

  async start() {
    try {
      console.log('🚀 بدء تشغيل Venom Proxy مع Cloudflare Tunnel...');
      console.log('🔧 مع إصلاحات getMaybeMeUser المتقدمة');
      
      // التحقق من cloudflared
      const hasCloudflared = await this.checkCloudflared();
      if (!hasCloudflared) {
        console.log('⚠️ سيتم تشغيل Venom Proxy فقط بدون Tunnel');
        await this.startVenomProxy();
        return;
      }
      
      // التحقق من إعدادات Tunnel
      const hasConfig = await this.checkTunnelConfig();
      if (!hasConfig) {
        console.log('⚠️ سيتم تشغيل Venom Proxy فقط بدون Tunnel');
        await this.startVenomProxy();
        return;
      }
      
      // بدء تشغيل Venom Proxy
      await this.startVenomProxy();
      
      // انتظار قليل لضمان بدء الخادم
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // بدء تشغيل Cloudflare Tunnel
      await this.startCloudflaredTunnel();
      
      this.isRunning = true;
      
      console.log('\n🎉 تم تشغيل النظام بنجاح!');
      console.log('📱 امسح QR Code الذي سيظهر لربط الواتساب');
      console.log('🌐 الخادم متاح محلياً على: http://localhost:3002');
      console.log('🌍 الخادم متاح عالمياً على: https://api.go4host.net');
      console.log('🔧 تم تطبيق إصلاحات getMaybeMeUser المتقدمة');
      
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
        if (code !== 0) {
          console.log('🔄 إعادة تشغيل Venom Proxy خلال 10 ثواني...');
          setTimeout(async () => {
            try {
              await this.startVenomProxy();
            } catch (error) {
              console.error('❌ فشل في إعادة تشغيل Venom Proxy:', error);
            }
          }, 10000);
        }
      });
    }
    
    // مراقبة Cloudflare Tunnel
    if (this.tunnelProcess) {
      this.tunnelProcess.on('exit', (code) => {
        console.log(`🔴 Cloudflare Tunnel توقف بكود: ${code}`);
        if (code !== 0) {
          console.log('🔄 إعادة تشغيل Cloudflare Tunnel خلال 5 ثواني...');
          setTimeout(async () => {
            try {
              await this.startCloudflaredTunnel();
            } catch (error) {
              console.error('❌ فشل في إعادة تشغيل Cloudflare Tunnel:', error);
            }
          }, 5000);
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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