const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isReady = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.lastActivity = null;
    this.retries = 0;
    this.maxRetries = 3;
    this.sessionName = process.env.WHATSAPP_SESSION_NAME || 'attendance-system';
    this.initializationTimeout = null;
    
    console.log('🚀 تهيئة WhatsApp-Web.js Service...');
    console.log('📱 اسم الجلسة:', this.sessionName);
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ WhatsApp قيد التهيئة بالفعل...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected && this.isReady) {
      console.log('✅ WhatsApp متصل وجاهز بالفعل');
      return { success: true, message: 'WhatsApp متصل بالفعل', alreadyConnected: true };
    }

    this.isInitializing = true;
    this.retries++;

    try {
      console.log(`🚀 بدء تهيئة WhatsApp-Web.js (محاولة ${this.retries}/${this.maxRetries})...`);
      
      await this.ensureDirectories();
      await this.cleanup();
      
      // إنشاء client جديد مع إعدادات محسنة
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.sessionName,
          dataPath: './sessions'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--disable-background-networking',
            '--disable-client-side-phishing-detection',
            '--disable-hang-monitor',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--metrics-recording-only',
            '--no-default-browser-check',
            '--safebrowsing-disable-auto-update',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          ],
          executablePath: process.env.CHROME_PATH,
          timeout: 60000,
          protocolTimeout: 60000
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
      });

      // إعداد event handlers
      this.setupEventHandlers();
      
      // إعداد timeout للتهيئة
      this.initializationTimeout = setTimeout(() => {
        if (this.isInitializing) {
          console.log('⏰ انتهت مهلة التهيئة - إعادة المحاولة...');
          this.handleInitializationTimeout();
        }
      }, 120000); // دقيقتان
      
      // بدء التهيئة
      console.log('🔄 بدء تهيئة WhatsApp Client...');
      await this.client.initialize();
      
      return { 
        success: true, 
        message: 'تم بدء تهيئة WhatsApp بنجاح',
        alreadyConnected: false 
      };

    } catch (error) {
      console.error('❌ خطأ في تهيئة WhatsApp:', error.message);
      this.isInitializing = false;
      
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
      
      await this.handleError(error);
      
      // إعادة المحاولة إذا لم نصل للحد الأقصى
      if (this.retries < this.maxRetries) {
        console.log(`🔄 إعادة المحاولة خلال 10 ثواني... (${this.retries}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        return this.initialize();
      }
      
      return { 
        success: false, 
        message: `فشل في تهيئة WhatsApp بعد ${this.maxRetries} محاولات: ${error.message}` 
      };
    }
  }

  async cleanup() {
    try {
      // إغلاق العميل السابق إذا كان موجوداً
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (error) {
          console.log('⚠️ خطأ في إغلاق العميل السابق:', error.message);
        }
        this.client = null;
      }
      
      this.isConnected = false;
      this.isReady = false;
      this.qrCode = null;
      
      console.log('🧹 تم تنظيف الجلسة السابقة');
    } catch (error) {
      console.error('❌ خطأ في التنظيف:', error.message);
    }
  }

  async handleInitializationTimeout() {
    console.log('⏰ انتهت مهلة التهيئة - إعادة تعيين...');
    
    this.isInitializing = false;
    
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.log('⚠️ خطأ في إغلاق العميل:', error.message);
      }
      this.client = null;
    }
    
    // إعادة المحاولة
    if (this.retries < this.maxRetries) {
      console.log('🔄 إعادة المحاولة بعد timeout...');
      setTimeout(() => {
        this.initialize();
      }, 5000);
    }
  }

  setupEventHandlers() {
    if (!this.client) return;

    // عند ظهور QR Code
    this.client.on('qr', (qr) => {
      console.log('\n📱 QR Code جديد - امسحه بهاتفك:');
      console.log('🔗 QR Code Data:', qr.substring(0, 50) + '...');
      
      // عرض QR Code في Terminal مع إعدادات محسنة للـ PowerShell
      try {
        console.log('\n📱 محاولة عرض QR Code في Terminal...');
        qrcode.generate(qr, { small: true });
        console.log('\n✅ تم عرض QR Code أعلاه');
      } catch (terminalError) {
        console.log('⚠️ لا يمكن عرض QR Code في PowerShell');
        console.log('💡 استخدم الطرق البديلة أدناه');
      }
      
      this.qrCode = qr;
      this.saveQRCode(qr).then(() => {
        console.log('💾 تم حفظ QR Code كصورة في مجلد logs');
        console.log('📂 افتح: logs/latest-qr-code.png');
      });
      
      // إنشاء QR Code كـ HTML للعرض في المتصفح
      this.createQRCodeHTML(qr).then(() => {
        console.log('🌐 تم إنشاء صفحة QR Code: http://localhost:3002/qr');
        
        // فتح المتصفح تلقائياً بعد 3 ثواني
        setTimeout(() => {
          this.openQRInBrowser();
        }, 3000);
      });
      
      console.log('\n📋 خطوات المسح:');
      console.log('1. افتح واتساب على هاتفك');
      console.log('2. اذهب إلى: الإعدادات > الأجهزة المرتبطة');
      console.log('3. اضغط على "ربط جهاز"');
      console.log('4. امسح QR Code من:');
      console.log('   • المتصفح: http://localhost:3002/qr (سيفتح تلقائياً)');
      console.log('   • الصورة: logs/latest-qr-code.png');
      console.log('5. انتظر رسالة التأكيد\n');
    });

    // عند تحميل المصادقة
    this.client.on('loading_screen', (percent, message) => {
      console.log(`⏳ تحميل WhatsApp Web: ${percent}% - ${message}`);
    });

    // عند المصادقة
    this.client.on('authenticated', () => {
      console.log('✅ تم التحقق من الهوية بنجاح!');
      this.isConnected = true;
    });

    // عند فشل المصادقة
    this.client.on('auth_failure', (msg) => {
      console.error('❌ فشل في المصادقة:', msg);
      this.isConnected = false;
      this.isReady = false;
      this.isInitializing = false;
    });

    // عند الجاهزية
    this.client.on('ready', async () => {
      console.log('🎉 WhatsApp Web جاهز بالكامل للإرسال!');
      this.isConnected = true;
      this.isReady = true;
      this.isInitializing = false;
      this.lastActivity = new Date().toISOString();
      
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
      
      // الحصول على معلومات الحساب
      try {
        const info = await this.client.info;
       const state = await this.client.getState();
        console.log('👤 معلومات الحساب:');
        console.log(`   📱 الرقم: ${info.wid.user}`);
        console.log(`   👤 الاسم: ${info.pushname}`);
        console.log(`   🔋 البطارية: ${info.battery}%`);
       console.log(`   📶 حالة الاتصال: ${state}`);
       console.log(`   📶 متصل: نعم`);
        console.log(`   📱 المنصة: ${info.platform}`);
      } catch (err) {
        console.log('⚠️ لم يتم الحصول على معلومات الحساب:', err.message);
      }
    });

    // عند قطع الاتصال
    this.client.on('disconnected', (reason) => {
      console.log('🔌 تم قطع الاتصال:', reason);
      this.isConnected = false;
      this.isReady = false;
      this.isInitializing = false;
      
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
      
      if (reason === 'LOGOUT') {
        console.log('🔒 تم تسجيل الخروج من الجهاز');
      } else if (reason === 'NAVIGATION') {
        console.log('🔄 انقطاع مؤقت - سيتم إعادة الاتصال تلقائياً');
      }
    });

    // عند استلام رسالة
    this.client.on('message', (message) => {
      this.lastActivity = new Date().toISOString();
      
      // رد تلقائي على رسائل الاختبار
      if (message.body === '!ping') {
        message.reply('pong - نظام الحضور يعمل بشكل صحيح ✅');
      }
    });

    // معالجة الأخطاء
    this.client.on('error', (error) => {
      console.error('❌ خطأ في WhatsApp Client:', error.message);
      this.handleError(error);
    });
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    try {
     if (!this.isReady) {
       throw new Error('WhatsApp غير جاهز للإرسال. يرجى التأكد من مسح QR Code وانتظار رسالة "جاهز بالكامل".');
     }

      console.log(`📤 إرسال رسالة إلى: ${phoneNumber}`);
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`📱 الرقم المنسق: ${formattedNumber}`);
      
      // التحقق من صحة الرقم
     try {
       const isValidNumber = await this.client.isRegisteredUser(formattedNumber);
       if (!isValidNumber) {
         throw new Error(`الرقم ${phoneNumber} غير مسجل في واتساب`);
       }
     } catch (validationError) {
       console.log('⚠️ تخطي فحص صحة الرقم:', validationError.message);
     }
      
      // إرسال الرسالة
      const result = await this.client.sendMessage(formattedNumber, message);
      
      this.lastActivity = new Date().toISOString();
      
      console.log('✅ تم إرسال الرسالة بنجاح:', result.id._serialized);
      
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error.message);
      throw new Error(`فشل في إرسال الرسالة: ${error.message}`);
    }
  }

  async sendBulkMessages(messages) {
    try {
      console.log(`📤 إرسال ${messages.length} رسالة...`);
      
      if (!this.isConnected || !this.isReady) {
        throw new Error('WhatsApp غير متصل أو غير جاهز');
      }
      
      const results = [];
      let successCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        console.log(`📱 إرسال رسالة ${i + 1}/${messages.length} إلى: ${msg.phoneNumber}`);
        
        try {
          const result = await this.sendMessage(msg.phoneNumber, msg.message, msg.messageType);
          results.push({
            phoneNumber: msg.phoneNumber,
            success: true,
            messageId: result.messageId,
            timestamp: result.timestamp
          });
          successCount++;
          
          // تأخير بين الرسائل لتجنب الحظر
          if (i < messages.length - 1) {
            const delay = parseInt(process.env.BULK_MESSAGE_DELAY) || 5000;
            console.log(`⏳ انتظار ${delay/1000} ثانية قبل الرسالة التالية...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          console.error(`❌ فشل في إرسال رسالة إلى ${msg.phoneNumber}:`, error.message);
          results.push({
            phoneNumber: msg.phoneNumber,
            success: false,
            error: error.message
          });
          failedCount++;
          
          // تأخير أقل عند الفشل
          if (i < messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      console.log(`📊 ملخص الإرسال: ${successCount} نجح، ${failedCount} فشل`);
      
      return {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount
        }
      };
      
    } catch (error) {
      console.error('❌ خطأ في الإرسال المجمع:', error);
      throw error;
    }
  }

  async testMessage(phoneNumber, message = null) {
    try {
      const testMsg = message || `📢 رسالة اختبار من نظام الحضور\n\nالوقت: ${new Date().toLocaleString('en-GB')}\n\n✅ WhatsApp-Web.js يعمل بشكل صحيح!`;
      
      console.log(`🧪 اختبار إرسال رسالة إلى: ${phoneNumber}`);
      
      const result = await this.sendMessage(phoneNumber, testMsg, 'test');
      
      return {
        success: true,
        message: 'تم إرسال رسالة الاختبار بنجاح',
        messageId: result.messageId
      };
      
    } catch (error) {
      console.error('❌ فشل اختبار الرسالة:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // إزالة الأحرف غير الرقمية
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // معالجة أرقام مصر
    if (cleaned.startsWith('01')) {
      cleaned = '2' + cleaned;
    }
    // معالجة أرقام السعودية
    else if (cleaned.startsWith('05')) {
      cleaned = '966' + cleaned.substring(1);
    }
    // إضافة كود الدولة إذا لم يكن موجوداً
    else if (!cleaned.startsWith('966') && !cleaned.startsWith('2')) {
      if (cleaned.length === 10 && cleaned.startsWith('5')) {
        cleaned = '966' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '20' + cleaned;
      }
    }
    
    return cleaned + '@c.us';
  }

  async ensureDirectories() {
    const dirs = ['./sessions', './logs', './backups'];
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  async saveQRCode(qr) {
    try {
      const qrPath = path.join('./logs', `qr-code-${Date.now()}.png`);
      const QRCode = require('qrcode');
      await QRCode.toFile(qrPath, qr, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log(`💾 تم حفظ QR Code في: ${qrPath}`);
      
      // حفظ آخر QR Code للعرض في المتصفح
      const latestQRPath = path.join('./logs', 'latest-qr-code.png');
      await QRCode.toFile(latestQRPath, qr, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
    } catch (error) {
      console.error('❌ خطأ في حفظ QR Code:', error.message);
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected || this.isReady,
      ready: this.isReady,
      state: this.isConnected && this.isReady ? 'CONNECTED' : 'DISCONNECTED',
      initializing: this.isInitializing,
      qrCode: this.qrCode,
      lastActivity: this.lastActivity,
      retries: this.retries,
      maxRetries: this.maxRetries,
      service: 'whatsapp-web.js',
      version: '1.23.0'
    };
  }

  async disconnect() {
    try {
      console.log('🔌 قطع اتصال WhatsApp...');
      
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout);
      }
      
      if (this.client) {
        await this.client.destroy();
        this.client = null;
      }
      
      this.isConnected = false;
      this.isReady = false;
      this.isInitializing = false;
      this.qrCode = null;
      
      console.log('✅ تم قطع الاتصال بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال:', error.message);
    }
  }

  async handleError(error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      connectionStatus: this.getConnectionStatus(),
      service: 'whatsapp-web.js'
    };
    
    const logPath = path.join('./logs', 'whatsapp-errors.json');
    let errors = [];
    
    try {
      if (await fs.pathExists(logPath)) {
        errors = await fs.readJson(logPath);
      }
    } catch (e) {
      console.error('خطأ في قراءة ملف الأخطاء:', e.message);
    }
    
    errors.push(errorLog);
    
    // الاحتفاظ بآخر 50 خطأ فقط
    if (errors.length > 50) {
      errors = errors.slice(-50);
    }
    
    try {
      await fs.writeJson(logPath, errors, { spaces: 2 });
    } catch (e) {
      console.error('خطأ في كتابة ملف الأخطاء:', e.message);
    }
  }

  // دوال إضافية لـ WhatsApp-Web.js
  async getChats() {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp غير جاهز');
      }
      
      const chats = await this.client.getChats();
      return chats;
    } catch (error) {
      console.error('❌ خطأ في جلب المحادثات:', error.message);
      return [];
    }
  }

  async getContacts() {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp غير جاهز');
      }
      
      const contacts = await this.client.getContacts();
      return contacts;
    } catch (error) {
      console.error('❌ خطأ في جلب جهات الاتصال:', error.message);
      return [];
    }
  }

  async sendMedia(phoneNumber, mediaPath, caption = '') {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp غير جاهز');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const media = MessageMedia.fromFilePath(mediaPath);
      
      const result = await this.client.sendMessage(formattedNumber, media, { caption });
      
      console.log('✅ تم إرسال الوسائط بنجاح');
      return {
        success: true,
        messageId: result.id._serialized
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الوسائط:', error.message);
      throw error;
    }
  }

  async getClientInfo() {
    try {
      if (!this.isReady) {
        return null;
      }
      
      const info = await this.client.info;
      return {
        phone: info.wid.user,
        name: info.pushname,
        battery: info.battery,
        connected: info.connected,
        platform: info.platform
      };
    } catch (error) {
      console.error('❌ خطأ في جلب معلومات الحساب:', error.message);
      return null;
    }
  }

  async createQRCodeHTML(qr) {
    try {
      const QRCode = require('qrcode');
      const qrDataURL = await QRCode.toDataURL(qr, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <title>QR Code - نظام الحضور</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="30">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
        }
        .title {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 28px;
        }
        .qr-code {
            margin: 20px 0;
            border: 3px solid #f0f0f0;
            border-radius: 15px;
            padding: 20px;
            background: #fafafa;
        }
        .qr-code img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
        }
        .instructions {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: right;
        }
        .step {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 8px;
            border-right: 4px solid #2196f3;
            font-size: 16px;
        }
        .status {
            background: #4caf50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin: 10px 0;
            font-size: 18px;
            font-weight: bold;
        }
        .refresh-btn {
            background: #2196f3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            transition: background 0.3s;
        }
        .refresh-btn:hover {
            background: #1976d2;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🔗 ربط واتساب - نظام الحضور</h1>
        <div class="status">✅ WhatsApp-Web.js جاهز للربط</div>
        
        <div class="warning">
            <strong>⚠️ مهم:</strong> لا تفتح WhatsApp Web في متصفح آخر أثناء الربط
        </div>
        
        <div class="qr-code">
            <img src="${qrDataURL}" alt="QR Code" />
        </div>
        
        <div class="instructions">
            <h3>📋 خطوات الربط:</h3>
            <div class="step">1️⃣ افتح واتساب على هاتفك</div>
            <div class="step">2️⃣ اذهب إلى: الإعدادات ← الأجهزة المرتبطة</div>
            <div class="step">3️⃣ اضغط على "ربط جهاز"</div>
            <div class="step">4️⃣ امسح QR Code أعلاه</div>
            <div class="step">5️⃣ انتظر رسالة التأكيد</div>
        </div>
        
        <div class="success">
            <strong>💡 نصيحة:</strong> إذا لم يعمل المسح، اضغط "تحديث QR Code" أدناه
        </div>
        
        <button class="refresh-btn" onclick="window.location.reload()">🔄 تحديث QR Code</button>
        <button class="refresh-btn" onclick="checkStatus()">📊 فحص الحالة</button>
        <button class="refresh-btn" onclick="window.open('logs/latest-qr-code.png')">🖼️ فتح الصورة</button>
        
        <p><strong>📱 الوقت:</strong> ${new Date().toLocaleString('ar-EG')}</p>
        <p><strong>🌐 الخادم:</strong> http://localhost:3002</p>
        <p><strong>🌍 Tunnel:</strong> https://api.go4host.net</p>
    </div>
    
    <script>
        // تحديث تلقائي كل 45 ثانية
        setTimeout(() => {
            window.location.reload();
        }, 45000);
        
        function checkStatus() {
            fetch('/api/whatsapp/status')
                .then(response => response.json())
                .then(data => {
                    if (data.data.connected && data.data.ready) {
                        document.body.innerHTML = '<div style="text-align:center;padding:50px;background:#d4edda;color:#155724;font-size:24px;"><h1>🎉 تم الربط بنجاح!</h1><p>يمكنك إغلاق هذه النافذة والعودة للنظام</p></div>';
                    } else {
                        alert('⏳ لا يزال في انتظار المسح...');
                    }
                })
                .catch(error => {
                    alert('❌ خطأ في فحص الحالة');
                });
        }
        
        // فحص تلقائي كل 10 ثواني
        setInterval(() => {
            fetch('/api/whatsapp/status')
                .then(response => response.json())
                .then(data => {
                    if (data.data.connected && data.data.ready) {
                        document.body.innerHTML = '<div style="text-align:center;padding:50px;background:#d4edda;color:#155724;font-size:24px;"><h1>🎉 تم الربط بنجاح!</h1><p>يمكنك إغلاق هذه النافذة والعودة للنظام</p><button onclick="window.close()" style="padding:10px 20px;font-size:16px;background:#28a745;color:white;border:none;border-radius:5px;cursor:pointer;">إغلاق النافذة</button></div>';
                    }
                });
        }, 10000);
    </script>
</body>
</html>`;
      
      await fs.writeFile('./logs/qr-code.html', htmlContent);
      console.log('🌐 تم إنشاء صفحة QR Code: http://localhost:3002/qr');
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء QR Code HTML:', error.message);
    }
  }

  openQRInBrowser() {
    try {
      const { execSync } = require('child_process');
      const qrURL = 'http://localhost:3002/qr';
      
      console.log('🌐 فتح QR Code في المتصفح...');
      
      if (process.platform === 'win32') {
        execSync(`start "" "${qrURL}"`, { stdio: 'ignore' });
      } else if (process.platform === 'darwin') {
        execSync(`open ${qrURL}`, { stdio: 'ignore' });
      } else {
        execSync(`xdg-open ${qrURL}`, { stdio: 'ignore' });
      }
      
      console.log('✅ تم فتح QR Code في المتصفح');
      console.log(`🔗 الرابط: ${qrURL}`);
      
    } catch (error) {
      console.error('❌ خطأ في فتح المتصفح:', error.message);
      console.log(`💡 افتح الرابط يدوياً: http://localhost:3002/qr`);
    }
  }
}

module.exports = WhatsAppService;