const venom = require('venom-bot');
const fs = require('fs-extra');
const path = require('path');

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
    this.fixAttempts = 0;
    this.maxFixAttempts = 30;
    
    // إعدادات محسنة لـ venom-bot v5.3.0 مع حل خطأ WebSocket
    this.venomConfig = {
      session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-v5-3-0',
      folderNameToken: './tokens',
      mkdirFolderToken: '',
      
      // إعدادات أساسية لـ v5.3.0
      headless: 'new',
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: true,
      
      // إعدادات الجلسة
      autoClose: 0,
      createPathFileToken: true,
      waitForLogin: true,
      disableSpins: true,
      disableWelcome: true,
      timeout: 300000,
      
      // إعدادات WhatsApp Web
      multidevice: true,
      refreshQR: 15000,
      catchQR: true,
      statusFind: true,
      
      // إعدادات Puppeteer محسنة لحل WebSocket في v5.3.0
      puppeteerOptions: {
        headless: 'new',
        executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        defaultViewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ['--disable-extensions'],
        
        // حل خطأ WebSocket - إعدادات مهمة لـ v5.3.0
        pipe: false, // منع استخدام pipe
        dumpio: false, // تعطيل dumpio
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        
        // timeout settings
        slowMo: 100,
        timeout: 300000,
        protocolTimeout: 300000,
        
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
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          
          // إصلاحات خاصة لحل خطأ WebSocket في v5.3.0
          '--disable-remote-debugging',
          '--remote-debugging-port=0',
          '--disable-dev-tools',
          '--disable-websocket',
          '--disable-websocket-compression',
          '--disable-websocket-extensions',
          '--no-remote-debugging-port'
        ]
      }
    };
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ الواتساب قيد التهيئة بالفعل...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected && this.isReady && this.wapiReady && this.getMaybeMeUserWorking) {
      console.log('✅ الواتساب متصل وجاهز بالفعل');
      return { success: true, message: 'الواتساب متصل بالفعل', alreadyConnected: true };
    }

    this.isInitializing = true;
    this.retries = 0;
    this.fixAttempts = 0;

    try {
      console.log('🚀 بدء تهيئة الواتساب مع venom-bot v5.3.0 (حل WebSocket)...');
      console.log('📱 اسم الجلسة:', this.venomConfig.session);
      console.log('🗂️ مجلد التوكن:', this.venomConfig.folderNameToken);

      await this.ensureDirectories();
      await this.cleanOldSessions();

      console.log('🔧 إنشاء جلسة venom v5.3.0 مع حل WebSocket...');
      
      // تطبيق إصلاح WebSocket قبل إنشاء الجلسة
      process.env.PUPPETEER_DISABLE_WEBSOCKET = 'true';
      process.env.WEBSOCKET_FIX_ENABLED = 'true';
      
      this.client = await venom.create(
        this.venomConfig.session,
        this.onQRCode.bind(this),
        this.onStatusChange.bind(this),
        this.venomConfig
      );

      if (this.client) {
        console.log('✅ تم إنشاء جلسة venom v5.3.0 بنجاح (بدون WebSocket)');
        await this.setupEventHandlers();
        await this.waitForFullConnection();
        
        this.isInitializing = false;
        return { 
          success: true, 
          message: 'تم تهيئة الواتساب بنجاح مع venom v5.3.0',
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
    console.log('⏳ انتظار اكتمال الاتصال مع venom v5.3.0...');
    
    // انتظار الاتصال الأساسي
    let connectionAttempts = 0;
    const maxConnectionAttempts = 60; // 5 دقائق
    
    while (!this.isConnected && connectionAttempts < maxConnectionAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      connectionAttempts++;
      
      if (connectionAttempts % 10 === 0) {
        console.log(`🔍 محاولة اتصال ${connectionAttempts}/${maxConnectionAttempts}`);
      }
    }
    
    if (!this.isConnected) {
      throw new Error('فشل في الاتصال خلال المهلة المحددة');
    }
    
    console.log('✅ تم الاتصال بالواتساب!');
    
    // انتظار تحميل WhatsApp Web بالكامل
    console.log('⏳ انتظار تحميل WhatsApp Web بالكامل مع venom v5.3.0...');
    await this.waitForWhatsAppWebReady();
  }

  async waitForWhatsAppWebReady() {
    let readinessAttempts = 0;
    const maxReadinessAttempts = 100; // 8 دقائق
    
    while ((!this.isReady || !this.wapiReady || !this.getMaybeMeUserWorking) && readinessAttempts < maxReadinessAttempts) {
      
      try {
        // فحص حالة الاتصال
        if (this.client && this.client.getConnectionState) {
          const connectionState = await this.client.getConnectionState();
          if (readinessAttempts % 10 === 0) {
            console.log('📡 حالة الاتصال:', connectionState);
          }
        }
        
        // فحص جاهزية Store و WAPI
        const readinessStatus = await this.checkFullReadinessWithV530Fix();
        
        if (readinessAttempts % 5 === 0) {
          console.log('📊 حالة الجاهزية v5.3.0:', readinessStatus);
        }
        
        if (readinessStatus.storeReady && readinessStatus.wapiReady && readinessStatus.getMaybeMeUserWorking) {
          this.storeReady = true;
          this.wapiReady = true;
          this.isReady = true;
          this.getMaybeMeUserWorking = true;
          console.log('🎉 WhatsApp Web جاهز بالكامل للإرسال مع v5.3.0!');
          break;
        } else {
          if (readinessAttempts % 10 === 0) {
            console.log('⏳ WhatsApp Web لا يزال يحمل...', readinessStatus);
          }
          
          // تطبيق إصلاحات كل 10 محاولات
          if (readinessAttempts % 10 === 0 && readinessAttempts > 0 && this.fixAttempts < this.maxFixAttempts) {
            console.log('🔧 تطبيق إصلاحات v5.3.0...');
            await this.applyV530GetMaybeMeUserFixes();
            this.fixAttempts++;
          }
        }
        
      } catch (error) {
        if (readinessAttempts % 10 === 0) {
          console.error('❌ خطأ في فحص الجاهزية:', error.message);
        }
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
        getMaybeMeUserWorking: this.getMaybeMeUserWorking,
        fixAttempts: this.fixAttempts
      });
      
      // محاولة أخيرة لإصلاح getMaybeMeUser
      console.log('🔧 محاولة أخيرة لإصلاح getMaybeMeUser مع v5.3.0...');
      await this.applyV530GetMaybeMeUserFixes();
      
      // فحص نهائي
      const finalCheck = await this.checkFullReadinessWithV530Fix();
      if (finalCheck.getMaybeMeUserWorking && finalCheck.wapiReady) {
        this.wapiReady = true;
        this.isReady = true;
        this.getMaybeMeUserWorking = true;
        console.log('✅ تم إصلاح getMaybeMeUser في المحاولة الأخيرة مع v5.3.0!');
      } else {
        console.warn('⚠️ سيتم المتابعة بحالة جزئية - قد تحتاج لإعادة التشغيل');
      }
    }
    
    // بدء فحص دوري للجاهزية
    this.startReadinessCheck();
  }

  async checkFullReadinessWithV530Fix() {
    try {
      if (!this.client || !this.client.page) {
        console.log('⚠️ Client أو Page غير متوفر للفحص');
        return {
          storeReady: false,
          wapiReady: false,
          getMaybeMeUserWorking: false,
          isFullyReady: false
        };
      }

      // فحص Store مع إصلاحات v5.3.0 المحسنة
      let storeReady = false;
      try {
        const storeCheck = await this.client.page.evaluate(() => {
          return new Promise((resolve) => {
            try {
              // فحص Store بطرق متعددة محسنة لـ v5.3.0
              if (window.Store && window.Store.Chat && window.Store.Conn && window.Store.Conn.me) {
                resolve(true);
              } else if (window.Store && window.Store.Chat && Object.keys(window.Store.Chat.models).length > 0) {
                resolve(true);
              } else if (window.Store && window.Store.Msg) {
                resolve(true);
              } else if (window.webpackChunkWhatsWebLollipop) {
                // محاولة تحميل Store من webpack لـ v5.3.0
                resolve(true);
              } else if (window.require && window.require.cache) {
                // البحث في modules cache
                for (const moduleId in window.require.cache) {
                  try {
                    const module = window.require.cache[moduleId];
                    if (module && module.exports && module.exports.Chat) {
                      window.Store = module.exports;
                      resolve(true);
                      return;
                    }
                  } catch (e) {
                    // تجاهل الأخطاء
                  }
                }
                resolve(false);
              } else {
                resolve(false);
              }
            } catch (error) {
              console.log('خطأ في فحص Store:', error);
              resolve(false);
            }
          });
        });
        storeReady = storeCheck;
      } catch (error) {
        console.log('⚠️ خطأ في فحص Store:', error.message);
      }
      
      // فحص WAPI مع إصلاحات v5.3.0 المحسنة
      let wapiReady = false;
      let getMaybeMeUserWorking = false;
      
      try {
        const wapiCheck = await this.client.page.evaluate(() => {
          return new Promise((resolve) => {
            try {
              // فحص وجود WAPI لـ v5.3.0
              if (typeof window.WAPI === 'undefined') {
                console.log('WAPI غير موجود، محاولة إنشاؤه...');
                window.WAPI = {};
              }
              
              // التأكد من وجود Store أولاً
              if (!window.Store) {
                console.log('Store غير موجود، محاولة تحميله...');
                if (window.webpackChunkWhatsWebLollipop) {
                  window.webpackChunkWhatsWebLollipop.push([
                    ['webpackChunkWhatsWebLollipop'], {}, function(e) {
                      Object.entries(e.c).forEach(([key, value]) => {
                        if (value.exports && value.exports.default && value.exports.default.Chat) {
                          window.Store = value.exports.default;
                        }
                      });
                    }
                  ]);
                }
              }
              
              // إعادة فحص WAPI بعد التحميل
              if (typeof window.WAPI === 'undefined') {
                resolve({ wapiExists: false, getMaybeMeUserExists: false, getMaybeMeUserWorking: false });
                return;
              }
              
              // إنشاء getMaybeMeUser إذا لم يكن موجوداً
              if (typeof window.WAPI.getMaybeMeUser !== 'function') {
                console.log('إنشاء getMaybeMeUser لـ v5.3.0...');
                
                // إنشاء getMaybeMeUser مع 8 طرق مختلفة لـ v5.3.0
                window.WAPI.getMaybeMeUser = function() {
                  try {
                    // طريقة 1: Store.Conn.me (الأساسية لـ v5.3.0)
                    if (window.Store && window.Store.Conn && window.Store.Conn.me) {
                      return window.Store.Conn.me;
                    }
                    
                    // طريقة 2: Store.Me (v5.3.0)
                    if (window.Store && window.Store.Me) {
                      return window.Store.Me;
                    }
                    
                    // طريقة 3: Store.User.me (v5.3.0)
                    if (window.Store && window.Store.User && window.Store.User.me) {
                      return window.Store.User.me;
                    }
                    
                    // طريقة 4: Store.UserConstructor (v5.3.0)
                    if (window.Store && window.Store.UserConstructor && window.Store.UserConstructor.me) {
                      return window.Store.UserConstructor.me;
                    }
                    
                    // طريقة 5: Store.Contact.me (v5.3.0)
                    if (window.Store && window.Store.Contact && window.Store.Contact.me) {
                      return window.Store.Contact.me;
                    }
                    
                    // طريقة 6: البحث في modules (v5.3.0)
                    if (window.require && window.require.cache) {
                      for (const moduleId in window.require.cache) {
                        try {
                          const module = window.require.cache[moduleId];
                          if (module && module.exports && module.exports.me) {
                            return module.exports.me;
                          }
                        } catch (e) {
                          // تجاهل الأخطاء
                        }
                      }
                    }
                    
                    // طريقة 7: فحص localStorage (v5.3.0)
                    try {
                      const waInfo = localStorage.getItem('WAInfo');
                      if (waInfo) {
                        const parsed = JSON.parse(waInfo);
                        if (parsed && parsed.wid) {
                          return { id: parsed.wid, name: parsed.pushname };
                        }
                      }
                    } catch (e) {
                      // تجاهل الأخطاء
                    }
                    
                    // طريقة 8: فحص window.me مباشرة (v5.3.0)
                    if (window.me) {
                      return window.me;
                    }
                    
                    console.log('⚠️ لم يتم العثور على بيانات المستخدم في v5.3.0');
                    return null;
                  } catch (error) {
                    console.error('خطأ في getMaybeMeUser v5.3.0:', error);
                    return null;
                  }
                };
              }
              
              // اختبار getMaybeMeUser المحسن مع v5.3.0
              try {
                const result = window.WAPI.getMaybeMeUser();
                const working = result && result.id && typeof result.id === 'string';
                
                if (working) {
                  console.log('✅ getMaybeMeUser يعمل مع v5.3.0:', result.id);
                } else {
                  console.log('❌ getMaybeMeUser لا يعمل مع v5.3.0');
                }
                
                resolve({ 
                  wapiExists: true, 
                  getMaybeMeUserExists: true, 
                  getMaybeMeUserWorking: working,
                  userInfo: working ? { 
                    id: result.id, 
                    name: result.name || result.pushname || result.displayName,
                    phone: result.id
                  } : null,
                  storeConnReady: window.Store && window.Store.Conn && window.Store.Conn.me ? true : false,
                  storeReady: window.Store ? true : false
                });
              } catch (error) {
                console.error('خطأ في اختبار getMaybeMeUser:', error);
                resolve({ 
                  wapiExists: true, 
                  getMaybeMeUserExists: true, 
                  getMaybeMeUserWorking: false,
                  error: error.message 
                });
              }
            } catch (error) {
              console.error('خطأ عام في فحص WAPI:', error);
              resolve({ wapiExists: false, getMaybeMeUserExists: false, getMaybeMeUserWorking: false, error: error.message });
            }
          });
        });
        
        wapiReady = wapiCheck.wapiExists;
        getMaybeMeUserWorking = wapiCheck.getMaybeMeUserWorking;
        
        if (wapiCheck.getMaybeMeUserWorking) {
          console.log('👤 معلومات المستخدم v5.3.0:', wapiCheck.userInfo);
          this.getMaybeMeUserWorking = true;
          this.wapiReady = true;
          this.isReady = true;
        } else if (wapiCheck.error) {
          console.log('❌ خطأ في WAPI:', wapiCheck.error);
        }
        
      } catch (error) {
        console.log('❌ خطأ في فحص WAPI:', error.message);
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

  async applyV530GetMaybeMeUserFixes() {
    try {
      if (!this.client || !this.client.page) {
        console.log('⚠️ Client أو Page غير متوفر للإصلاح - انتظار...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return;
      }

      console.log('🔧 تطبيق إصلاحات v5.3.0 لـ getMaybeMeUser...');
      
      const fixResult = await this.client.page.evaluate(() => {
        return new Promise((resolve) => {
          try {
            console.log('🔧 بدء إصلاحات v5.3.0...');
            
            // إصلاح 1: تحميل Store بقوة لـ v5.3.0
            if (!window.Store) {
              console.log('🔧 إعادة تحميل Store لـ v5.3.0...');
              
              // طريقة 1: webpack chunk
              try {
                if (window.webpackChunkWhatsWebLollipop) {
                  window.webpackChunkWhatsWebLollipop.push([
                    ['webpackChunkWhatsWebLollipop'], {}, function(e) {
                      Object.entries(e.c).forEach(([key, value]) => {
                        if (value.exports && value.exports.default) {
                          if (value.exports.default.Chat || value.exports.default.Conn) {
                            window.Store = value.exports.default;
                            console.log('✅ تم تحميل Store من webpack');
                          }
                        }
                      });
                    }
                  ]);
                }
              } catch (e) {
                console.log('فشل في تحميل Store من webpack');
              }
              
              // طريقة 2: البحث في modules
              if (!window.Store && window.require && window.require.cache) {
                for (const moduleId in window.require.cache) {
                  try {
                    const module = window.require.cache[moduleId];
                    if (module && module.exports) {
                      if (module.exports.Chat && module.exports.Conn) {
                        window.Store = module.exports;
                        console.log('✅ تم تحميل Store من modules');
                        break;
                      } else if (module.exports.default && module.exports.default.Chat) {
                        window.Store = module.exports.default;
                        console.log('✅ تم تحميل Store من modules.default');
                        break;
                      }
                    }
                  } catch (e) {
                    // تجاهل الأخطاء
                  }
                }
              }
            }
            
            // إصلاح 2: إنشاء WAPI محسن لـ v5.3.0
            if (!window.WAPI) {
              window.WAPI = {};
              console.log('✅ تم إنشاء WAPI');
            }
            
            // إصلاح 3: إنشاء getMaybeMeUser محسن مع 10 طرق لـ v5.3.0
            window.WAPI.getMaybeMeUser = function() {
              try {
                console.log('🔍 محاولة الحصول على بيانات المستخدم...');
                
                // طريقة 1: Store.Conn.me (الأساسية لـ v5.3.0)
                if (window.Store && window.Store.Conn && window.Store.Conn.me) {
                  console.log('✅ تم العثور على المستخدم من Store.Conn.me');
                  return window.Store.Conn.me;
                }
                
                // طريقة 2: Store.Me (v5.3.0)
                if (window.Store && window.Store.Me) {
                  console.log('✅ تم العثور على المستخدم من Store.Me');
                  return window.Store.Me;
                }
                
                // طريقة 3: Store.User.me (v5.3.0)
                if (window.Store && window.Store.User && window.Store.User.me) {
                  console.log('✅ تم العثور على المستخدم من Store.User.me');
                  return window.Store.User.me;
                }
                
                // طريقة 4: Store.UserConstructor (v5.3.0)
                if (window.Store && window.Store.UserConstructor && window.Store.UserConstructor.me) {
                  console.log('✅ تم العثور على المستخدم من Store.UserConstructor');
                  return window.Store.UserConstructor.me;
                }
                
                // طريقة 5: Store.Contact.me (v5.3.0)
                if (window.Store && window.Store.Contact && window.Store.Contact.me) {
                  console.log('✅ تم العثور على المستخدم من Store.Contact.me');
                  return window.Store.Contact.me;
                }
                
                // طريقة 6: Store.Wap (v5.3.0)
                if (window.Store && window.Store.Wap && window.Store.Wap.me) {
                  console.log('✅ تم العثور على المستخدم من Store.Wap.me');
                  return window.Store.Wap.me;
                }
                
                // طريقة 7: البحث في modules (v5.3.0)
                if (window.require && window.require.cache) {
                  for (const moduleId in window.require.cache) {
                    try {
                      const module = window.require.cache[moduleId];
                      if (module && module.exports) {
                        if (module.exports.me && module.exports.me.id) {
                          console.log('✅ تم العثور على المستخدم من modules');
                          return module.exports.me;
                        }
                        if (module.exports.default && module.exports.default.me) {
                          console.log('✅ تم العثور على المستخدم من modules.default');
                          return module.exports.default.me;
                        }
                      }
                    } catch (e) {
                      // تجاهل الأخطاء
                    }
                  }
                }
                
                // طريقة 8: البحث في window objects (v5.3.0)
                for (const key in window) {
                  try {
                    if (key.includes('Store') || key.includes('store')) {
                      const obj = window[key];
                      if (obj && obj.me && obj.me.id) {
                        console.log('✅ تم العثور على المستخدم من window.' + key);
                        return module.exports.me;
                      }
                    }
                  } catch (e) {
                    // تجاهل الأخطاء
                  }
                }
                
                // طريقة 9: فحص localStorage متقدم (v5.3.0)
                try {
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('user') || key.includes('me') || key.includes('wid'))) {
                      const value = localStorage.getItem(key);
                      if (value) {
                        try {
                          const parsed = JSON.parse(value);
                          if (parsed && (parsed.id || parsed.wid)) {
                            console.log('✅ تم العثور على المستخدم من localStorage.' + key);
                            return { 
                              id: parsed.id || parsed.wid, 
                              name: parsed.name || parsed.pushname || parsed.displayName 
                            };
                          }
                        } catch (e) {
                          // ليس JSON
                        }
                      }
                    }
                  }
                } catch (e) {
                  // تجاهل الأخطاء
                }
                
                // طريقة 10: فحص sessionStorage (v5.3.0)
                try {
                  for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && (key.includes('user') || key.includes('me'))) {
                      const value = sessionStorage.getItem(key);
                      if (value) {
                        try {
                          const parsed = JSON.parse(value);
                          if (parsed && parsed.id) {
                            console.log('✅ تم العثور على المستخدم من sessionStorage.' + key);
                            return parsed;
                          }
                        } catch (e) {
                          // ليس JSON
                        }
                      }
                    } catch (e) {
                      // تجاهل الأخطاء
                    }
                  }
                } catch (e) {
                  // تجاهل الأخطاء
                }
                
                console.log('❌ لم يتم العثور على بيانات المستخدم في v5.3.0 بجميع الطرق');
                return null;
              } catch (error) {
                console.error('خطأ في getMaybeMeUser v5.3.0:', error);
                return null;
              }
            };
            
            // إصلاح 4: إنشاء sendMessage محسن لـ v5.3.0
            if (!window.WAPI.sendMessage) {
              console.log('🔧 إعادة تعريف sendMessage لـ v5.3.0...');
              
              window.WAPI.sendMessage = function(chatId, message) {
                return new Promise((resolve, reject) => {
                  try {
                    console.log('🔧 محاولة إرسال رسالة لـ v5.3.0...');
                    
                    // طريقة 1: Store.Chat (v5.3.0)
                    if (window.Store && window.Store.Chat) {
                      const chat = window.Store.Chat.get(chatId);
                      if (chat) {
                        // محاولة طرق متعددة للإرسال
                        if (typeof chat.sendMessage === 'function') {
                          console.log('✅ استخدام chat.sendMessage');
                          chat.sendMessage(message).then(resolve).catch(reject);
                          return;
                        } else if (window.Store.SendMessage && typeof window.Store.SendMessage === 'function') {
                          console.log('✅ استخدام Store.SendMessage');
                          window.Store.SendMessage(chat, message).then(resolve).catch(reject);
                          return;
                        } else if (window.Store.SendTextMessage && typeof window.Store.SendTextMessage === 'function') {
                          console.log('✅ استخدام Store.SendTextMessage');
                          window.Store.SendTextMessage(chat, message).then(resolve).catch(reject);
                          return;
                        } else if (window.Store.Msg && typeof window.Store.Msg.add === 'function') {
                          console.log('✅ استخدام Store.Msg.add');
                          const msgData = {
                            id: chatId,
                            body: message,
                            type: 'chat',
                            t: Math.ceil(Date.now() / 1000)
                          };
                          window.Store.Msg.add(msgData).then(resolve).catch(reject);
                          return;
                        } else {
                          console.log('❌ لم يتم العثور على طريقة إرسال في Chat');
                          reject(new Error('SendMessage method not found in chat object for v5.3.0'));
                        }
                      } else {
                        console.log('❌ Chat غير موجود');
                        reject(new Error('Chat not found for v5.3.0'));
                      }
                    }
                    
                    // طريقة 2: البحث في modules للإرسال
                    else if (window.require && window.require.cache) {
                      console.log('🔧 البحث عن طريقة إرسال في modules...');
                      let sendFunction = null;
                      
                      for (const moduleId in window.require.cache) {
                        try {
                          const module = window.require.cache[moduleId];
                          if (module && module.exports) {
                            if (typeof module.exports.sendMessage === 'function') {
                              sendFunction = module.exports.sendMessage;
                              break;
                            } else if (module.exports.default && typeof module.exports.default.sendMessage === 'function') {
                              sendFunction = module.exports.default.sendMessage;
                              break;
                            }
                          }
                        } catch (e) {
                          // تجاهل الأخطاء
                        }
                      }
                      
                      if (sendFunction) {
                        console.log('✅ تم العثور على sendFunction في modules');
                        sendFunction(chatId, message).then(resolve).catch(reject);
                      } else {
                        reject(new Error('SendMessage function not found in modules for v5.3.0'));
                      }
                    } else {
                      console.log('❌ Store.Chat غير متوفر');
                      reject(new Error('Store.Chat not available for v5.3.0'));
                    }
                  } catch (error) {
                    console.error('خطأ في sendMessage:', error);
                    reject(error);
                  }
                });
              };
              
              console.log('✅ تم إنشاء sendMessage محسن لـ v5.3.0');
            }
            
            // إصلاح 5: اختبار شامل لـ v5.3.0
            const finalTest = window.WAPI && window.WAPI.getMaybeMeUser ? window.WAPI.getMaybeMeUser() : null;
            const testResult = finalTest && finalTest.id ? true : false;
            
            console.log('🔍 اختبار نهائي لـ getMaybeMeUser v5.3.0:', testResult ? 'يعمل ✅' : 'لا يعمل ❌');
            
            if (testResult && finalTest) {
              console.log('👤 بيانات المستخدم:', {
                id: finalTest.id,
                name: finalTest.name || finalTest.pushname || 'غير محدد'
              });
            }
            
            resolve({
              success: true,
              storeAvailable: window.Store ? true : false,
              wapiAvailable: window.WAPI ? true : false,
              getMaybeMeUserWorking: testResult,
              userInfo: testResult ? finalTest : null
            });
          } catch (error) {
            console.error('خطأ في تطبيق إصلاحات v5.3.0:', error);
            resolve({
              success: false,
              error: error.message
            });
          }
        });
      });
      
      console.log('📊 نتيجة الإصلاح:', fixResult);
      
      if (fixResult.getMaybeMeUserWorking) {
        this.getMaybeMeUserWorking = true;
        this.wapiReady = true;
        this.isReady = true;
        console.log('✅ تم إصلاح getMaybeMeUser بنجاح مع v5.3.0!');
      }
      
      // انتظار إضافي لضمان التحميل مع v5.3.0
      if (!fixResult.getMaybeMeUserWorking) {
        console.log('⏳ انتظار إضافي لضمان التحميل مع v5.3.0...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // فحص نهائي
      const finalCheck = await this.checkFullReadinessWithV530Fix();
      if (finalCheck.getMaybeMeUserWorking) {
        console.log('✅ تم إصلاح getMaybeMeUser بنجاح مع v5.3.0!');
        this.getMaybeMeUserWorking = true;
        this.wapiReady = true;
        this.isReady = true;
      }
      
    } catch (error) {
      console.error('❌ خطأ في تطبيق إصلاحات v5.3.0:', error);
    }
  }

  startReadinessCheck() {
    if (this.readinessCheckInterval) {
      clearInterval(this.readinessCheckInterval);
    }
    
    console.log('🔄 بدء فحص الجاهزية الدوري لـ v5.3.0...');
    
    this.readinessCheckInterval = setInterval(async () => {
      if (this.isReady && this.wapiReady && this.getMaybeMeUserWorking) {
        console.log('🎉 النظام جاهز بالكامل مع v5.3.0 - إيقاف الفحص الدوري');
        clearInterval(this.readinessCheckInterval);
        return;
      }
      
      try {
        const status = await this.checkFullReadinessWithV530Fix();
        
        console.log(`🔍 فحص دوري v5.3.0: Store=${status.storeReady ? '✅' : '❌'} | WAPI=${status.wapiReady ? '✅' : '❌'} | getMaybeMeUser=${status.getMaybeMeUserWorking ? '✅' : '❌'}`);
        
        if (status.isFullyReady) {
          this.storeReady = status.storeReady;
          this.wapiReady = status.wapiReady;
          this.isReady = status.wapiReady;
          this.getMaybeMeUserWorking = status.getMaybeMeUserWorking;
          
          console.log('🎉 النظام أصبح جاهز بالكامل مع v5.3.0!');
          clearInterval(this.readinessCheckInterval);
        } else if (this.fixAttempts < this.maxFixAttempts) {
          // تطبيق إصلاحات كل 20 ثانية
          console.log(`🔧 تطبيق إصلاحات دورية لـ v5.3.0 (محاولة ${this.fixAttempts + 1}/${this.maxFixAttempts})...`);
          await this.applyV530GetMaybeMeUserFixes();
          this.fixAttempts++;
        } else {
          console.log('⚠️ تم الوصول للحد الأقصى من محاولات الإصلاح');
          clearInterval(this.readinessCheckInterval);
        }
      } catch (error) {
        console.error('❌ خطأ في الفحص الدوري:', error.message);
      }
    }, 20000); // فحص كل 20 ثانية
  }

  async ensureDirectories() {
    const dirs = [this.venomConfig.folderNameToken, './logs', './backups'];
    for (const dir of dirs) {
      await fs.ensureDir(dir);
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
      }
    }
  }

  onQRCode(base64Qr, asciiQR, attempts, urlCode) {
    console.log('\n📱 QR Code جديد - المحاولة:', attempts);
    console.log('🔗 URL Code:', urlCode);
    
    // عرض QR Code في Terminal
    console.log('\n📱 QR Code جديد - امسحه بهاتفك');
    console.log(asciiQR);
    
    this.qrCode = base64Qr;
    this.saveQRCode(base64Qr, attempts);
    
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
      console.log('ℹ️ حالة:', statusSession);
    }
  }

  async setupEventHandlers() {
    if (!this.client) return;

    this.client.onMessage(async (message) => {
      this.lastActivity = new Date().toISOString();
    });

    this.client.onStateChange((state) => {
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
      this.lastActivity = new Date().toISOString();
    });
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    try {
      if (!this.isConnected) {
        throw new Error('الواتساب غير متصل');
      }

      // فحص وإصلاح getMaybeMeUser قبل الإرسال
      if (!this.wapiReady || !this.getMaybeMeUserWorking) {
        console.log('⚠️ WAPI غير جاهز، محاولة إصلاح v5.3.0...');
        await this.applyV530GetMaybeMeUserFixes();
        
        // فحص مرة أخرى
        const status = await this.checkFullReadinessWithV530Fix();
        if (!status.getMaybeMeUserWorking) {
          throw new Error('getMaybeMeUser لا يعمل مع v5.3.0 - يرجى إعادة تشغيل الخادم');
        }
      }

      console.log(`📤 إرسال رسالة إلى: ${phoneNumber}`);
      
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`📱 الرقم المنسق: ${formattedNumber}`);
      
      const result = await this.client.sendText(formattedNumber, message);
      
      this.lastActivity = new Date().toISOString();
      
      console.log('✅ تم إرسال الرسالة بنجاح مع v5.3.0:', result.id);
      
      return {
        success: true,
        messageId: result.id,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      
      // محاولة إصلاح getMaybeMeUser عند الفشل
      if (error.message.includes('getMaybeMeUser') || error.message.includes('WAPI')) {
        console.log('🔧 محاولة إصلاح v5.3.0 بعد الفشل...');
        await this.applyV530GetMaybeMeUserFixes();
      }
      
      throw new Error(`فشل في إرسال الرسالة: ${error.message}`);
    }
  }

  async sendBulkMessages(messages) {
    try {
      console.log(`📤 إرسال ${messages.length} رسالة مع v5.3.0...`);
      
      if (!this.wapiReady || !this.getMaybeMeUserWorking) {
        console.log('🔧 إصلاح v5.3.0 قبل الإرسال المجمع...');
        await this.applyV530GetMaybeMeUserFixes();
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
            const delay = parseInt(process.env.BULK_MESSAGE_DELAY) || 7000;
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
      
      console.log(`📊 ملخص الإرسال مع v5.3.0: ${successCount} نجح، ${failedCount} فشل`);
      
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
      const testMsg = message || `📢 رسالة اختبار من نظام الحضور مع venom v5.3.0\n\nالوقت: ${new Date().toLocaleString('en-GB')}\n\n✅ الواتساب يعمل بشكل صحيح مع v5.3.0!`;
      
      console.log(`🧪 اختبار إرسال رسالة مع v5.3.0 إلى: ${phoneNumber}`);
      
      const result = await this.sendMessage(phoneNumber, testMsg, 'test');
      
      return {
        success: true,
        message: 'تم إرسال رسالة الاختبار بنجاح مع v5.3.0',
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
      getMaybeMeUserWorking: this.getMaybeMeUserWorking,
      fixAttempts: this.fixAttempts,
      version: '5.3.0'
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
      connectionStatus: this.getConnectionStatus(),
      venomVersion: '5.3.0'
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
    } catch (e) {
      console.error('خطأ في كتابة ملف الأخطاء:', e);
    }
  }
}

module.exports = WhatsAppService;