const venom = require('venom-bot');
const fs = require('fs-extra');
const path = require('path');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isReady = false;
    this.wapiReady = false;
    this.storeReady = false;
    this.getMaybeMeUserWorking = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.lastActivity = null;
    this.retries = 0;
    this.maxRetries = 5;
    this.readinessCheckInterval = null;
    this.connectionCheckInterval = null;
    
    // إعدادات محسنة لحل مشكلة getMaybeMeUser
    this.venomConfig = {
      session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
      folderNameToken: './tokens',
      mkdirFolderToken: '',
      headless: 'new',
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: true,
      autoClose: 0,
      createPathFileToken: true,
      waitForLogin: true,
      disableSpins: true,
      disableWelcome: true,
      timeout: 300000,
      multidevice: true,
      refreshQR: 15000,
      catchQR: true,
      statusFind: true,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-back-forward-cache',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-blink-features=AutomationControlled',
        '--run-all-compositor-stages-before-draw',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-checker-imaging',
        '--disable-new-content-rendering-timeout',
        '--disable-image-animation-resync',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--force-color-profile=srgb',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees'
      ],
      puppeteerOptions: {
        defaultViewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        slowMo: 200,
        timeout: 300000
      }
    };
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ الواتساب قيد التهيئة بالفعل...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected && this.isReady && this.wapiReady) {
      console.log('✅ الواتساب متصل وجاهز بالفعل');
      return { success: true, message: 'الواتساب متصل بالفعل', alreadyConnected: true };
    }

    this.isInitializing = true;
    this.retries = 0;

    try {
      console.log('🚀 بدء تهيئة الواتساب مع إصلاحات getMaybeMeUser...');
      console.log('📱 اسم الجلسة:', this.venomConfig.session);
      console.log('🗂️ مجلد التوكن:', this.venomConfig.folderNameToken);

      await this.ensureDirectories();
      await this.cleanOldSessions();

      this.client = await venom.create(
        this.venomConfig.session,
        this.onQRCode.bind(this),
        this.onStatusChange.bind(this),
        this.venomConfig
      );

      if (this.client) {
        console.log('✅ تم إنشاء جلسة venom بنجاح');
        await this.setupEventHandlers();
        await this.waitForFullConnection();
        
        this.isInitializing = false;
        return { 
          success: true, 
          message: 'تم تهيئة الواتساب بنجاح مع إصلاح getMaybeMeUser',
          alreadyConnected: false 
        };
      }

      throw new Error('فشل في إنشاء جلسة venom');

    } catch (error) {
      console.error('❌ خطأ في تهيئة الواتساب:', error);
      this.isInitializing = false;
      await this.handleError(error);
      return { 
        success: false, 
        message: `فشل في تهيئة الواتساب: ${error.message}` 
      };
    }
  }

  async waitForFullConnection() {
    console.log('⏳ انتظار اكتمال الاتصال...');
    
    // انتظار الاتصال الأساسي
    let connectionAttempts = 0;
    const maxConnectionAttempts = 60; // 5 دقائق
    
    while (!this.isConnected && connectionAttempts < maxConnectionAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      connectionAttempts++;
      console.log(`🔍 محاولة اتصال ${connectionAttempts}/${maxConnectionAttempts}`);
    }
    
    if (!this.isConnected) {
      throw new Error('فشل في الاتصال خلال المهلة المحددة');
    }
    
    console.log('✅ تم الاتصال بالواتساب!');
    
    // انتظار تحميل WhatsApp Web بالكامل مع إصلاح getMaybeMeUser
    console.log('⏳ انتظار تحميل WhatsApp Web بالكامل...');
    await this.waitForWhatsAppWebReady();
  }

  async waitForWhatsAppWebReady() {
    let readinessAttempts = 0;
    const maxReadinessAttempts = 60; // 5 دقائق
    
    while ((!this.isReady || !this.wapiReady || !this.getMaybeMeUserWorking) && readinessAttempts < maxReadinessAttempts) {
      console.log('🔍 فحص الجاهزية الكاملة لـ WhatsApp Web...');
      
      try {
        // فحص حالة الاتصال
        const connectionState = await this.client.getConnectionState();
        console.log('📡 حالة الاتصال:', connectionState);
        
        // فحص جاهزية Store و WAPI مع إصلاح getMaybeMeUser
        const readinessStatus = await this.checkFullReadinessWithFix();
        console.log('📊 حالة الجاهزية:', readinessStatus);
        
        if (readinessStatus.storeReady && readinessStatus.wapiReady && readinessStatus.getMaybeMeUserWorking) {
          this.storeReady = true;
          this.wapiReady = true;
          this.isReady = true;
          this.getMaybeMeUserWorking = true;
          console.log('🎉 WhatsApp Web جاهز بالكامل للإرسال!');
          break;
        } else {
          console.log('⏳ WhatsApp Web لا يزال يحمل...', readinessStatus);
          
          // تطبيق إصلاحات getMaybeMeUser كل 10 محاولات
          if (readinessAttempts % 10 === 0 && readinessAttempts > 0) {
            console.log('🔧 تطبيق إصلاحات getMaybeMeUser الشاملة...');
            await this.applyGetMaybeMeUserFixes();
          }
        }
        
      } catch (error) {
        console.error('❌ خطأ في فحص الجاهزية:', error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      readinessAttempts++;
    }
    
    if (!this.isReady || !this.wapiReady || !this.getMaybeMeUserWorking) {
      console.warn('⚠️ لم يكتمل تحميل WhatsApp Web خلال المهلة المحددة');
      console.log('📊 الحالة النهائية:', {
        isConnected: this.isConnected,
        isReady: this.isReady,
        wapiReady: this.wapiReady,
        storeReady: this.storeReady,
        getMaybeMeUserWorking: this.getMaybeMeUserWorking
      });
      
      // محاولة أخيرة لإصلاح getMaybeMeUser
      console.log('🔧 محاولة أخيرة لإصلاح getMaybeMeUser...');
      await this.applyGetMaybeMeUserFixes();
      
      // فحص نهائي
      const finalCheck = await this.checkFullReadinessWithFix();
      if (finalCheck.getMaybeMeUserWorking && finalCheck.wapiReady) {
        this.wapiReady = true;
        this.isReady = true;
        this.getMaybeMeUserWorking = true;
        console.log('✅ تم إصلاح getMaybeMeUser في المحاولة الأخيرة!');
      } else {
        console.warn('⚠️ سيتم المتابعة بحالة جزئية - قد تحتاج لإعادة التشغيل');
      }
    }
  }

  async checkFullReadinessWithFix() {
    try {
      // فحص Store
      let storeReady = false;
      try {
        const store = await this.client.getStore();
        storeReady = store && typeof store === 'object';
      } catch (error) {
        console.log('⚠️ Store غير جاهز:', error.message);
      }
      
      // فحص WAPI مع إصلاح getMaybeMeUser
      let wapiReady = false;
      let getMaybeMeUserWorking = false;
      
      try {
        // محاولة الوصول لـ WAPI
        const wapiCheck = await this.client.page.evaluate(() => {
          return new Promise((resolve) => {
            try {
              // فحص وجود WAPI
              if (typeof window.WAPI === 'undefined') {
                resolve({ wapiExists: false, getMaybeMeUserExists: false, getMaybeMeUserWorking: false });
                return;
              }
              
              // فحص وجود getMaybeMeUser
              if (typeof window.WAPI.getMaybeMeUser !== 'function') {
                resolve({ wapiExists: true, getMaybeMeUserExists: false, getMaybeMeUserWorking: false });
                return;
              }
              
              // اختبار getMaybeMeUser
              try {
                const result = window.WAPI.getMaybeMeUser();
                const working = result !== undefined && result !== null;
                resolve({ 
                  wapiExists: true, 
                  getMaybeMeUserExists: true, 
                  getMaybeMeUserWorking: working,
                  userInfo: working ? { id: result.id, name: result.name } : null
                });
              } catch (error) {
                resolve({ 
                  wapiExists: true, 
                  getMaybeMeUserExists: true, 
                  getMaybeMeUserWorking: false,
                  error: error.message 
                });
              }
            } catch (error) {
              resolve({ wapiExists: false, getMaybeMeUserExists: false, getMaybeMeUserWorking: false, error: error.message });
            }
          });
        });
        
        wapiReady = wapiCheck.wapiExists;
        getMaybeMeUserWorking = wapiCheck.getMaybeMeUserWorking;
        
        if (wapiCheck.getMaybeMeUserWorking && wapiCheck.userInfo) {
          console.log('👤 معلومات المستخدم:', wapiCheck.userInfo);
        }
        
      } catch (error) {
        console.log('⚠️ WAPI غير جاهز:', error.message);
      }
      
      return {
        storeReady,
        wapiReady,
        getMaybeMeUserWorking,
        isFullyReady: storeReady && wapiReady && getMaybeMeUserWorking
      };
      
    } catch (error) {
      console.error('❌ خطأ في فحص الجاهزية:', error);
      return {
        storeReady: false,
        wapiReady: false,
        getMaybeMeUserWorking: false,
        isFullyReady: false
      };
    }
  }

  async applyGetMaybeMeUserFixes() {
    try {
      console.log('🔧 تطبيق إصلاحات getMaybeMeUser المتقدمة...');
      
      // إصلاح 1: إعادة تحميل WAPI
      await this.client.page.evaluate(() => {
        return new Promise((resolve) => {
          try {
            // إعادة تعريف getMaybeMeUser إذا كان مفقوداً
            if (window.WAPI && typeof window.WAPI.getMaybeMeUser !== 'function') {
              console.log('🔧 إعادة تعريف getMaybeMeUser...');
              
              window.WAPI.getMaybeMeUser = function() {
                try {
                  if (window.Store && window.Store.Conn && window.Store.Conn.me) {
                    return window.Store.Conn.me;
                  }
                  if (window.Store && window.Store.Me) {
                    return window.Store.Me;
                  }
                  if (window.Store && window.Store.User && window.Store.User.me) {
                    return window.Store.User.me;
                  }
                  return null;
                } catch (error) {
                  console.error('خطأ في getMaybeMeUser:', error);
                  return null;
                }
              };
            }
            
            // إصلاح 2: التأكد من تحميل Store
            if (window.Store && window.Store.Conn) {
              console.log('✅ Store.Conn متوفر');
            }
            
            // إصلاح 3: فحص وإصلاح sendMessage
            if (window.WAPI && typeof window.WAPI.sendMessage !== 'function') {
              console.log('🔧 إعادة تعريف sendMessage...');
              
              window.WAPI.sendMessage = function(chatId, message) {
                return new Promise((resolve, reject) => {
                  try {
                    if (window.Store && window.Store.Chat) {
                      const chat = window.Store.Chat.get(chatId);
                      if (chat) {
                        chat.sendMessage(message).then(resolve).catch(reject);
                      } else {
                        reject(new Error('Chat not found'));
                      }
                    } else {
                      reject(new Error('Store.Chat not available'));
                    }
                  } catch (error) {
                    reject(error);
                  }
                });
              };
            }
            
            resolve(true);
          } catch (error) {
            console.error('خطأ في تطبيق الإصلاحات:', error);
            resolve(false);
          }
        });
      });
      
      // إصلاح 4: انتظار إضافي لضمان التحميل
      console.log('⏳ انتظار إضافي لضمان التحميل...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // إصلاح 5: فحص نهائي
      const finalCheck = await this.checkFullReadinessWithFix();
      if (finalCheck.getMaybeMeUserWorking) {
        console.log('✅ تم إصلاح getMaybeMeUser بنجاح!');
        this.getMaybeMeUserWorking = true;
        this.wapiReady = true;
        this.isReady = true;
      }
      
    } catch (error) {
      console.error('❌ خطأ في تطبيق إصلاحات getMaybeMeUser:', error);
    }
  }

  async ensureDirectories() {
    const dirs = [this.venomConfig.folderNameToken, './logs', './backups'];
    for (const dir of dirs) {
      await fs.ensureDir(dir);
      console.log(`📁 تم التأكد من وجود المجلد: ${dir}`);
    }
  }

  async cleanOldSessions() {
    const tokenPath = path.join(this.venomConfig.folderNameToken, this.venomConfig.session);
    if (await fs.pathExists(tokenPath)) {
      const stats = await fs.stat(tokenPath);
      const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceModified > 7) {
        console.log('🧹 تنظيف الجلسة القديمة...');
        const backupPath = `./backups/session_backup_${Date.now()}`;
        await fs.ensureDir('./backups');
        await fs.copy(tokenPath, backupPath);
        await fs.remove(tokenPath);
        console.log(`💾 تم إنشاء نسخة احتياطية في: ${backupPath}`);
      }
    }
  }

  onQRCode(base64Qr, asciiQR, attempts, urlCode) {
    console.log('\n📱 QR Code جديد - المحاولة:', attempts);
    console.log('🔗 URL Code:', urlCode);
    
    // عرض QR Code في Terminal
    qrcode.generate(urlCode, { small: true });
    
    this.qrCode = base64Qr;
    this.saveQRCode(base64Qr, attempts);
    
    if (attempts >= 5) {
      console.log('⚠️ تم الوصول للحد الأقصى من محاولات QR Code');
      console.log('💡 نصيحة: تأكد من أن الواتساب مفتوح على هاتفك وجرب مرة أخرى');
    }
    
    console.log('\n📋 خطوات المسح:');
    console.log('1. افتح واتساب على هاتفك');
    console.log('2. اذهب إلى: الإعدادات > الأجهزة المرتبطة');
    console.log('3. اضغط على "ربط جهاز"');
    console.log('4. امسح QR Code أعلاه');
    console.log('5. انتظر رسالة التأكيد\n');
  }

  async saveQRCode(base64Qr, attempts) {
    try {
      const qrPath = path.join('./logs', `qr-code-${attempts}-${Date.now()}.png`);
      const base64Data = base64Qr.replace(/^data:image\/png;base64,/, '');
      await fs.writeFile(qrPath, base64Data, 'base64');
      console.log(`💾 تم حفظ QR Code في: ${qrPath}`);
    } catch (error) {
      console.error('❌ خطأ في حفظ QR Code:', error);
    }
  }

  onStatusChange(statusSession, session) {
    console.log('\n📊 تغيير حالة الجلسة:', statusSession);
    console.log('📱 اسم الجلسة:', session);

    const connectedStates = ['isLogged', 'CONNECTED', 'waitChat', 'qrReadSuccess', 'successChat'];

    if (connectedStates.includes(statusSession)) {
      this.isConnected = true;
      this.lastActivity = new Date().toISOString();
      console.log('✅ تم تسجيل الدخول/الاتصال بنجاح!');
      
      // بدء فحص الجاهزية الكاملة
      if (statusSession === 'successChat' || statusSession === 'isLogged') {
        setTimeout(() => {
          this.startReadinessCheck();
        }, 5000);
      }
    } else if (statusSession === 'notLogged') {
      this.isConnected = false;
      this.isReady = false;
      this.wapiReady = false;
      this.getMaybeMeUserWorking = false;
      console.log('❌ لم يتم تسجيل الدخول');
    } else if (statusSession === 'browserClose') {
      console.log('🔒 تم إغلاق المتصفح');
      this.isConnected = false;
      this.isReady = false;
      this.wapiReady = false;
      this.getMaybeMeUserWorking = false;
    } else if (statusSession === 'qrReadFail') {
      console.log('❌ فشل في مسح QR Code');
    } else {
      console.log('ℹ️ حالة غير معروفة:', statusSession);
    }
  }

  startReadinessCheck() {
    if (this.readinessCheckInterval) {
      clearInterval(this.readinessCheckInterval);
    }
    
    console.log('🔄 بدء فحص الجاهزية الدوري...');
    
    this.readinessCheckInterval = setInterval(async () => {
      if (this.isReady && this.wapiReady && this.getMaybeMeUserWorking) {
        console.log('✅ النظام جاهز بالكامل - إيقاف الفحص الدوري');
        clearInterval(this.readinessCheckInterval);
        return;
      }
      
      try {
        const status = await this.checkFullReadinessWithFix();
        if (status.isFullyReady) {
          this.storeReady = status.storeReady;
          this.wapiReady = status.wapiReady;
          this.isReady = status.wapiReady;
          this.getMaybeMeUserWorking = status.getMaybeMeUserWorking;
          
          console.log('🎉 النظام أصبح جاهز بالكامل!');
          clearInterval(this.readinessCheckInterval);
        }
      } catch (error) {
        console.error('❌ خطأ في الفحص الدوري:', error.message);
      }
    }, 10000); // فحص كل 10 ثواني
  }

  async setupEventHandlers() {
    if (!this.client) return;

    this.client.onMessage(async (message) => {
      console.log('📨 رسالة واردة:', message.from, message.body?.substring(0, 50) + '...');
      this.lastActivity = new Date().toISOString();
    });

    this.client.onStateChange((state) => {
      console.log('🔄 تغيير حالة الاتصال:', state);
      this.lastActivity = new Date().toISOString();

      const stableStates = ['CONNECTED', 'waitChat', 'qrReadSuccess', 'isLogged', 'successChat'];
      if (stableStates.includes(state)) {
        this.isConnected = true;
      } else if (state === 'DISCONNECTED' || state === 'browserClose') {
        this.isConnected = false;
        this.isReady = false;
        this.wapiReady = false;
        this.getMaybeMeUserWorking = false;
      }
    });

    this.client.onStreamChange((state) => {
      console.log('📡 تغيير حالة البث:', state);
      this.lastActivity = new Date().toISOString();
    });
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    try {
      if (!this.isConnected) {
        throw new Error('الواتساب غير متصل');
      }

      if (!this.wapiReady || !this.getMaybeMeUserWorking) {
        console.log('⚠️ WAPI غير جاهز، محاولة إصلاح getMaybeMeUser...');
        await this.applyGetMaybeMeUserFixes();
        
        // فحص مرة أخرى
        const status = await this.checkFullReadinessWithFix();
        if (!status.getMaybeMeUserWorking) {
          throw new Error('getMaybeMeUser لا يعمل - يرجى إعادة تشغيل الخادم');
        }
      }

      console.log(`📤 إرسال رسالة إلى: ${phoneNumber}`);
      console.log(`📝 نوع الرسالة: ${messageType}`);
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`📱 الرقم المنسق: ${formattedNumber}`);
      
      const result = await this.client.sendText(formattedNumber, message);
      
      this.lastActivity = new Date().toISOString();
      
      console.log('✅ تم إرسال الرسالة بنجاح:', result.id);
      
      return {
        success: true,
        messageId: result.id,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      
      // محاولة إصلاح getMaybeMeUser عند الفشل
      if (error.message.includes('getMaybeMeUser') || error.message.includes('WAPI')) {
        console.log('🔧 محاولة إصلاح getMaybeMeUser بعد الفشل...');
        await this.applyGetMaybeMeUserFixes();
      }
      
      throw new Error(`فشل في إرسال الرسالة: ${error.message}`);
    }
  }

  async sendBulkMessages(messages) {
    try {
      console.log(`📤 إرسال ${messages.length} رسالة...`);
      
      if (!this.wapiReady || !this.getMaybeMeUserWorking) {
        console.log('🔧 إصلاح getMaybeMeUser قبل الإرسال المجمع...');
        await this.applyGetMaybeMeUserFixes();
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
          
          // تأخير بين الرسائل
          if (i < messages.length - 1) {
            const delay = parseInt(process.env.BULK_MESSAGE_DELAY) || 6000;
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
      const testMsg = message || `📢 رسالة اختبار من نظام الحضور\n\nالوقت: ${new Date().toLocaleString('en-GB')}\n\n✅ الواتساب يعمل بشكل صحيح!`;
      
      console.log(`🧪 اختبار إرسال رسالة إلى: ${phoneNumber}`);
      
      const result = await this.sendMessage(phoneNumber, testMsg, 'test');
      
      return {
        success: true,
        message: 'تم إرسال رسالة الاختبار بنجاح',
        messageId: result.messageId
      };
      
    } catch (error) {
      console.error('❌ فشل اختبار الرسالة:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // إضافة كود الدولة إذا لم يكن موجوداً
    if (cleaned.startsWith('01')) {
      cleaned = '2' + cleaned;
    } else if (cleaned.startsWith('05')) {
      cleaned = '966' + cleaned.substring(1);
    } else if (!cleaned.startsWith('966') && !cleaned.startsWith('2')) {
      if (cleaned.length === 10 && cleaned.startsWith('5')) {
        cleaned = '966' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '20' + cleaned;
      }
    }
    
    return cleaned + '@c.us';
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      ready: this.isReady && this.wapiReady && this.getMaybeMeUserWorking,
      qrCode: this.qrCode,
      lastActivity: this.lastActivity,
      retries: this.retries,
      wapiReady: this.wapiReady,
      storeReady: this.storeReady,
      getMaybeMeUserWorking: this.getMaybeMeUserWorking
    };
  }

  async disconnect() {
    try {
      console.log('🔌 قطع اتصال الواتساب...');
      
      if (this.readinessCheckInterval) {
        clearInterval(this.readinessCheckInterval);
      }
      
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
      }
      
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      
      this.isConnected = false;
      this.isReady = false;
      this.wapiReady = false;
      this.storeReady = false;
      this.getMaybeMeUserWorking = false;
      this.qrCode = null;
      
      console.log('✅ تم قطع الاتصال بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال:', error);
    }
  }

  async handleError(error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      connectionStatus: this.getConnectionStatus()
    };
    
    const logPath = path.join('./logs', 'whatsapp-errors.json');
    let errors = [];
    
    try {
      if (await fs.pathExists(logPath)) {
        errors = await fs.readJson(logPath);
      }
    } catch (e) {
      console.error('خطأ في قراءة ملف الأخطاء:', e);
    }
    
    errors.push(errorLog);
    
    // الاحتفاظ بآخر 100 خطأ فقط
    if (errors.length > 100) {
      errors = errors.slice(-100);
    }
    
    try {
      await fs.writeJson(logPath, errors, { spaces: 2 });
      console.log(`📝 تم تسجيل الخطأ في: ${logPath}`);
    } catch (e) {
      console.error('خطأ في كتابة ملف الأخطاء:', e);
    }
  }
}

module.exports = WhatsAppService;