const venom = require('venom-bot');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.lastActivity = Date.now();
    this.statusCheckInterval = null;
    this.initializationPromise = null;
    this.isReady = false;
    this.readyCheckInterval = null;
    this.wapiReady = false;
    this.storeReady = false;
  }

  async initialize() {
    // منع التهيئة المتعددة
    if (this.initializationPromise) {
      console.log('⏳ انتظار التهيئة الجارية...');
      return this.initializationPromise;
    }

    if (this.isConnected && this.client && this.isReady && this.wapiReady) {
      console.log('✅ الواتساب متصل وجاهز بالفعل');
      return { success: true, message: 'الواتساب متصل بالفعل', alreadyConnected: true };
    }

    // إنشاء promise للتهيئة
    this.initializationPromise = this._performInitialization();
    
    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  async _performInitialization() {
    this.isInitializing = true;
    this.stopStatusCheck();
    this.stopReadyCheck();

    try {
      console.log('🚀 بدء تهيئة الواتساب مع إصلاح getMaybeMeUser...');
      
      // تنظيف الاتصال السابق
      await this.cleanup();
      
      // التأكد من وجود المجلدات
      await this.ensureDirectories();
      
      // إعدادات محسنة للمتصفح مع إصلاح مشكلة getMaybeMeUser
      const puppeteerOptions = {
        headless: 'new',
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
          '--disable-features=VizDisplayCompositor',
          '--run-all-compositor-stages-before-draw',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-checker-imaging',
          '--disable-new-content-rendering-timeout',
          '--disable-image-animation-resync',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        defaultViewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
        slowMo: 150, // إبطاء أكثر لضمان تحميل كامل
        timeout: 180000 // 3 دقائق
      };

      // البحث عن Chrome في مسارات متعددة
      const chromePaths = [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/snap/bin/chromium'
      ].filter(Boolean);

      let chromeFound = false;
      for (const chromePath of chromePaths) {
        if (chromePath && await fs.pathExists(chromePath)) {
          puppeteerOptions.executablePath = chromePath;
          console.log('🌐 استخدام Chrome من:', chromePath);
          chromeFound = true;
          break;
        }
      }

      if (!chromeFound) {
        console.log('⚠️ لم يتم العثور على Chrome، سيتم استخدام المتصفح الافتراضي');
      }
      
      // إعدادات venom محسنة لحل مشكلة getMaybeMeUser
      const venomOptions = {
        session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
        folderNameToken: process.env.TOKENS_PATH || './tokens',
        mkdirFolderToken: '',
        headless: 'new',
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        puppeteerOptions,
        autoClose: 0,
        createPathFileToken: true,
        waitForLogin: true,
        disableSpins: true,
        disableWelcome: true,
        timeout: 300000, // 5 دقائق
        multidevice: true,
        refreshQR: 15000,
        autoCloseInterval: 0,
        logQR: true,
        disableBrowserFetcher: false,
        waitForLogin: true,
        waitForIncomingCall: false,
        catchQR: true,
        // إعدادات خاصة لحل مشكلة getMaybeMeUser
        addProxy: [],
        browserArgs: [],
        statusFind: (statusSession, session) => {
          console.log(`📊 حالة الجلسة: ${statusSession} | الجلسة: ${session}`);
        }
      };
      
      this.client = await venom.create(
        venomOptions.session,
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log(`📱 QR Code جديد - المحاولة: ${attempts}`);
          console.log('🔗 URL Code:', urlCode);
          console.log('\n' + asciiQR + '\n');
          this.qrCode = base64Qr;
          
          // حفظ QR Code كصورة
          this.saveQRCode(base64Qr, attempts);
          
          if (attempts >= 5) {
            console.log('⚠️ تم الوصول للحد الأقصى من محاولات QR Code');
          }
          
          console.log('\n📋 خطوات المسح:');
          console.log('1. افتح واتساب على هاتفك');
          console.log('2. اذهب إلى: الإعدادات > الأجهزة المرتبطة');
          console.log('3. اضغط على "ربط جهاز"');
          console.log('4. امسح QR Code أعلاه');
          console.log('5. انتظر رسالة التأكيد\n');
        },
        (statusSession, session) => {
          console.log(`📊 تغيير حالة الجلسة: ${statusSession}`);
          console.log(`📱 اسم الجلسة: ${session || 'غير محدد'}`);
          
          switch (statusSession) {
            case 'isLogged':
            case 'qrReadSuccess':
            case 'chatsAvailable':
              console.log('✅ تم الاتصال بالواتساب!');
              this.isConnected = true;
              this.isInitializing = false;
              this.connectionRetries = 0;
              this.lastActivity = Date.now();
              // بدء فحص الجاهزية مع تأخير
              setTimeout(() => {
                this.startReadyCheck();
              }, 5000);
              break;
            case 'notLogged':
              this.isConnected = false;
              this.isReady = false;
              this.wapiReady = false;
              this.storeReady = false;
              console.log('❌ لم يتم تسجيل الدخول');
              break;
            case 'browserClose':
            case 'noOpenBrowser':
              this.isConnected = false;
              this.isReady = false;
              this.wapiReady = false;
              this.storeReady = false;
              console.log('🔒 تم إغلاق المتصفح أو فشل في فتحه');
              if (this.isInitializing && this.connectionRetries < this.maxRetries) {
                this.connectionRetries++;
                console.log(`🔄 إعادة المحاولة ${this.connectionRetries}/${this.maxRetries}...`);
                setTimeout(() => {
                  if (this.isInitializing) {
                    this._performInitialization();
                  }
                }, 10000);
              }
              break;
            case 'qrReadFail':
              console.log('❌ فشل في مسح QR Code');
              break;
            case 'autocloseCalled':
              console.log('🔄 تم استدعاء الإغلاق التلقائي');
              break;
            case 'desconnectedMobile':
              console.log('📱 انقطع الاتصال من الهاتف');
              this.handleDisconnection();
              break;
            case 'initBrowser':
              console.log('🌐 بدء تشغيل المتصفح...');
              break;
            default:
              console.log(`ℹ️ حالة غير معروفة: ${statusSession}`);
          }
        },
        venomOptions
      );
      
      if (this.client) {
        this.setupEventHandlers();
        
        // انتظار حتى يتم الاتصال مع timeout محسن
        const timeout = 300000; // 5 دقائق
        const startTime = Date.now();
        
        console.log('⏳ انتظار اكتمال الاتصال...');
        
        while (!this.isConnected && (Date.now() - startTime) < timeout && this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        if (this.isConnected) {
          console.log('✅ تم الاتصال بالواتساب!');
          
          // انتظار إضافي لضمان تحميل WhatsApp Web بالكامل
          console.log('⏳ انتظار تحميل WhatsApp Web بالكامل...');
          await new Promise(resolve => setTimeout(resolve, 15000));
          
          // فحص وإعداد WAPI
          await this.initializeWAPI();
          
          // انتظار الجاهزية الكاملة
          console.log('⏳ انتظار جاهزية النظام للإرسال...');
          let readyAttempts = 0;
          const maxReadyAttempts = 30;
          
          while ((!this.isReady || !this.wapiReady) && readyAttempts < maxReadyAttempts) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.checkFullReadiness();
            readyAttempts++;
            console.log(`🔍 محاولة جاهزية ${readyAttempts}/${maxReadyAttempts} - WAPI: ${this.wapiReady ? '✅' : '❌'} | Store: ${this.storeReady ? '✅' : '❌'} | Ready: ${this.isReady ? '✅' : '❌'}`);
          }
          
          if (this.isReady && this.wapiReady) {
            console.log('🎉 تم تهيئة الواتساب بنجاح وهو جاهز للإرسال!');
            this.startStatusCheck();
            return { success: true, message: 'تم تهيئة الواتساب بنجاح وهو جاهز للإرسال!' };
          } else {
            console.log('⏰ النظام غير جاهز للإرسال بعد انتهاء المهلة');
            console.log(`📊 الحالة النهائية: WAPI: ${this.wapiReady} | Store: ${this.storeReady} | Ready: ${this.isReady}`);
            return { success: false, message: 'النظام متصل لكن غير جاهز للإرسال. قد تحتاج لإعادة المحاولة.' };
          }
        } else {
          this.isInitializing = false;
          console.log('⏰ انتهت المهلة الزمنية للاتصال');
          await this.cleanup();
          return { success: false, message: 'انتهت المهلة الزمنية للاتصال. تحقق من QR Code وحاول مرة أخرى.' };
        }
      }
      
      this.isInitializing = false;
      return { success: false, message: 'فشل في إنشاء جلسة الواتساب' };
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الواتساب:', error);
      this.isInitializing = false;
      this.isConnected = false;
      this.isReady = false;
      this.wapiReady = false;
      this.storeReady = false;
      await this.cleanup();
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to launch the browser process')) {
        errorMessage = 'فشل في تشغيل المتصفح. تحقق من تثبيت Chrome ومسار CHROME_PATH في ملف .env';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'فشل في الاتصال. تحقق من إعدادات الشبكة';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'انتهت المهلة الزمنية. حاول مرة أخرى';
      } else if (error.message.includes('Protocol error')) {
        errorMessage = 'خطأ في بروتوكول المتصفح. أعد تشغيل الخادم';
      }
      
      return { 
        success: false, 
        message: `خطأ في تهيئة الواتساب: ${errorMessage}` 
      };
    }
  }

  async ensureDirectories() {
    const dirs = [
      process.env.TOKENS_PATH || './tokens',
      process.env.LOGS_PATH || './logs',
      './backups'
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(dir);
      console.log(`📁 تم التأكد من وجود المجلد: ${dir}`);
    }
  }

  async saveQRCode(base64Qr, attempts) {
    try {
      const qrPath = path.join(process.env.LOGS_PATH || './logs', `qr-code-${attempts}.png`);
      const base64Data = base64Qr.replace(/^data:image\/png;base64,/, '');
      await fs.writeFile(qrPath, base64Data, 'base64');
      console.log(`💾 تم حفظ QR Code في: ${qrPath}`);
    } catch (error) {
      console.error('❌ خطأ في حفظ QR Code:', error);
    }
  }

  setupEventHandlers() {
    if (!this.client) return;

    try {
      this.client.onMessage(async (message) => {
        this.lastActivity = Date.now();
        console.log('📨 رسالة واردة من:', message.from);
      });

      this.client.onStateChange((state) => {
        console.log('🔄 تغيير حالة الاتصال:', state);
        this.lastActivity = Date.now();
        
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
          console.log('⚠️ تعارض في الاتصال، محاولة إعادة الاتصال...');
          this.handleDisconnection();
        } else if (state === 'CONNECTED') {
          this.isConnected = true;
          this.connectionRetries = 0;
          // بدء فحص الجاهزية عند الاتصال مع تأخير
          setTimeout(() => {
            this.startReadyCheck();
          }, 10000);
        } else if (state === 'DISCONNECTED') {
          this.isConnected = false;
          this.isReady = false;
          this.wapiReady = false;
          this.storeReady = false;
          this.handleDisconnection();
        }
      });

      this.client.onStreamChange((state) => {
        console.log('📡 تغيير حالة البث:', state);
        this.lastActivity = Date.now();
        
        if (state === 'DISCONNECTED') {
          console.log('📡 انقطع البث، محاولة إعادة الاتصال...');
          this.handleDisconnection();
        }
      });

    } catch (error) {
      console.error('❌ خطأ في إعداد معالجات الأحداث:', error);
    }
  }

  // تهيئة WAPI بشكل صحيح لحل مشكلة getMaybeMeUser
  async initializeWAPI() {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      console.log('🔧 تهيئة WAPI لحل مشكلة getMaybeMeUser...');
      
      // انتظار تحميل الصفحة بالكامل
      await this.client.page.waitForSelector('[data-testid="chat-list"]', { timeout: 60000 });
      console.log('✅ تم تحميل قائمة المحادثات');
      
      // انتظار إضافي لضمان تحميل جميع العناصر
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // فحص وإصلاح WAPI
      const wapiFixed = await this.client.page.evaluate(() => {
        return new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 20;
          
          const checkWAPI = () => {
            attempts++;
            console.log(`🔍 فحص WAPI - المحاولة ${attempts}/${maxAttempts}`);
            
            try {
              // التحقق من وجود Store
              if (!window.Store) {
                console.log('❌ Store غير موجود');
                if (attempts < maxAttempts) {
                  setTimeout(checkWAPI, 2000);
                  return;
                }
                resolve(false);
                return;
              }
              
              // التحقق من وجود WAPI
              if (!window.WAPI) {
                console.log('❌ WAPI غير موجود');
                if (attempts < maxAttempts) {
                  setTimeout(checkWAPI, 2000);
                  return;
                }
                resolve(false);
                return;
              }
              
              // التحقق من دالة getMaybeMeUser
              if (!window.Store.Conn || !window.Store.Conn.getMaybeMeUser) {
                console.log('⚠️ getMaybeMeUser غير متوفر، محاولة إصلاح...');
                
                // محاولة إعادة تعريف الدالة
                try {
                  if (window.Store.Conn && !window.Store.Conn.getMaybeMeUser) {
                    window.Store.Conn.getMaybeMeUser = function() {
                      try {
                        return window.Store.Conn.me || window.Store.Me || null;
                      } catch (e) {
                        console.error('خطأ في getMaybeMeUser:', e);
                        return null;
                      }
                    };
                    console.log('✅ تم إصلاح getMaybeMeUser');
                  }
                } catch (fixError) {
                  console.error('❌ فشل في إصلاح getMaybeMeUser:', fixError);
                }
              }
              
              // التحقق من جاهزية WAPI للإرسال
              if (window.WAPI && window.WAPI.sendMessage && typeof window.WAPI.sendMessage === 'function') {
                console.log('✅ WAPI جاهز للإرسال');
                
                // اختبار بسيط للتأكد من عمل WAPI
                try {
                  const me = window.WAPI.getMe();
                  console.log('✅ تم الحصول على معلومات المستخدم:', me ? 'نجح' : 'فشل');
                  resolve(true);
                } catch (testError) {
                  console.error('❌ خطأ في اختبار WAPI:', testError);
                  if (attempts < maxAttempts) {
                    setTimeout(checkWAPI, 2000);
                    return;
                  }
                  resolve(false);
                }
              } else {
                console.log('❌ WAPI.sendMessage غير متوفر');
                if (attempts < maxAttempts) {
                  setTimeout(checkWAPI, 2000);
                  return;
                }
                resolve(false);
              }
              
            } catch (error) {
              console.error('❌ خطأ في فحص WAPI:', error);
              if (attempts < maxAttempts) {
                setTimeout(checkWAPI, 2000);
                return;
              }
              resolve(false);
            }
          };
          
          // بدء الفحص
          checkWAPI();
        });
      });
      
      if (wapiFixed) {
        this.wapiReady = true;
        console.log('✅ تم إعداد WAPI بنجاح');
        return true;
      } else {
        console.log('❌ فشل في إعداد WAPI');
        return false;
      }
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة WAPI:', error);
      return false;
    }
  }

  // فحص جاهزية WhatsApp Web الكاملة
  async checkFullReadiness() {
    if (!this.client || !this.isConnected) {
      this.isReady = false;
      this.wapiReady = false;
      this.storeReady = false;
      return false;
    }

    try {
      console.log('🔍 فحص الجاهزية الكاملة لـ WhatsApp Web...');
      
      // فحص حالة الاتصال
      const connectionState = await this.client.getConnectionState();
      console.log('📡 حالة الاتصال:', connectionState);
      
      if (connectionState !== 'CONNECTED') {
        this.isReady = false;
        this.wapiReady = false;
        this.storeReady = false;
        return false;
      }

      // فحص شامل للجاهزية
      const readinessCheck = await this.client.page.evaluate(() => {
        return new Promise((resolve) => {
          try {
            // فحص العناصر الأساسية
            const chatList = document.querySelector('[data-testid="chat-list"]');
            const searchBox = document.querySelector('[data-testid="chat-list-search"]');
            const mainPanel = document.querySelector('#main');
            
            // فحص Store
            const storeReady = window.Store && 
                              window.Store.Msg && 
                              window.Store.Chat && 
                              window.Store.Contact &&
                              window.Store.Conn;
            
            // فحص WAPI مع التحقق من getMaybeMeUser
            let wapiReady = false;
            if (window.WAPI && window.WAPI.sendMessage && typeof window.WAPI.sendMessage === 'function') {
              // التحقق من getMaybeMeUser
              try {
                if (window.Store.Conn && window.Store.Conn.getMaybeMeUser) {
                  const me = window.Store.Conn.getMaybeMeUser();
                  wapiReady = true;
                  console.log('✅ getMaybeMeUser يعمل بشكل صحيح');
                } else if (window.Store.Conn) {
                  // محاولة إصلاح getMaybeMeUser
                  window.Store.Conn.getMaybeMeUser = function() {
                    try {
                      return window.Store.Conn.me || window.Store.Me || window.Store.Conn.attributes || null;
                    } catch (e) {
                      console.error('خطأ في getMaybeMeUser المصلح:', e);
                      return null;
                    }
                  };
                  
                  // اختبار الدالة المصلحة
                  const testMe = window.Store.Conn.getMaybeMeUser();
                  wapiReady = testMe !== null;
                  console.log('🔧 تم إصلاح getMaybeMeUser:', wapiReady ? 'نجح' : 'فشل');
                } else {
                  console.log('❌ Store.Conn غير متوفر');
                  wapiReady = false;
                }
              } catch (error) {
                console.error('❌ خطأ في فحص getMaybeMeUser:', error);
                wapiReady = false;
              }
            }
            
            // فحص إضافي للتأكد من جاهزية الإرسال
            let sendReady = false;
            if (wapiReady && storeReady) {
              try {
                // اختبار بسيط للتأكد من عمل دوال الإرسال
                const testFunction = window.WAPI.getMe;
                sendReady = typeof testFunction === 'function';
              } catch (error) {
                console.error('خطأ في اختبار دوال الإرسال:', error);
                sendReady = false;
              }
            }
            
            console.log('🔍 نتائج فحص الجاهزية:', {
              chatList: !!chatList,
              searchBox: !!searchBox,
              mainPanel: !!mainPanel,
              storeReady: storeReady,
              wapiReady: wapiReady,
              sendReady: sendReady,
              getMaybeMeUser: !!(window.Store.Conn && window.Store.Conn.getMaybeMeUser)
            });
            
            resolve({
              uiReady: !!(chatList && searchBox),
              storeReady: storeReady,
              wapiReady: wapiReady,
              sendReady: sendReady,
              fullReady: !!(chatList && storeReady && wapiReady && sendReady)
            });
            
          } catch (error) {
            console.error('خطأ في فحص الجاهزية:', error);
            resolve({
              uiReady: false,
              storeReady: false,
              wapiReady: false,
              sendReady: false,
              fullReady: false
            });
          }
        });
      });

      this.storeReady = readinessCheck.storeReady;
      this.wapiReady = readinessCheck.wapiReady;
      this.isReady = readinessCheck.fullReady;

      if (this.isReady && this.wapiReady) {
        console.log('✅ WhatsApp Web جاهز بالكامل للإرسال!');
        
        // اختبار نهائي للتأكد من عمل الإرسال
        try {
          const hostDevice = await this.client.getHostDevice();
          console.log('📱 معلومات الجهاز:', hostDevice);
          return true;
        } catch (error) {
          console.log('❌ خطأ في الاختبار النهائي:', error.message);
          this.isReady = false;
          this.wapiReady = false;
          return false;
        }
      } else {
        console.log('⏳ WhatsApp Web لا يزال يحمل...', {
          storeReady: this.storeReady,
          wapiReady: this.wapiReady,
          isReady: this.isReady
        });
        return false;
      }

    } catch (error) {
      console.error('❌ خطأ في فحص الجاهزية الكاملة:', error);
      this.isReady = false;
      this.wapiReady = false;
      this.storeReady = false;
      return false;
    }
  }

  startReadyCheck() {
    this.stopReadyCheck();
    
    this.readyCheckInterval = setInterval(async () => {
      if (!this.isReady && this.isConnected) {
        await this.checkFullReadiness();
      }
    }, 5000); // كل 5 ثواني
  }

  stopReadyCheck() {
    if (this.readyCheckInterval) {
      clearInterval(this.readyCheckInterval);
      this.readyCheckInterval = null;
    }
  }

  startStatusCheck() {
    this.stopStatusCheck();
    
    this.statusCheckInterval = setInterval(async () => {
      try {
        if (!this.client) {
          this.isConnected = false;
          this.isReady = false;
          this.wapiReady = false;
          this.storeReady = false;
          return;
        }

        const state = await this.client.getConnectionState();
        const isActive = state === 'CONNECTED' || state === 'OPENING' || state === 'OPEN';
        
        if (!isActive) {
          console.log('⚠️ الاتصال غير نشط:', state);
          this.handleDisconnection();
          return;
        }

        // فحص صحة الجلسة
        try {
          await this.client.getHostDevice();
          this.lastActivity = Date.now();
          
          // فحص الجاهزية إذا لم تكن جاهزة
          if (!this.isReady || !this.wapiReady) {
            await this.checkFullReadiness();
          }
        } catch (error) {
          console.log('❌ فشل فحص صحة الجلسة:', error.message);
          this.handleDisconnection();
        }

      } catch (error) {
        console.error('❌ خطأ في فحص حالة الاتصال:', error);
        this.handleDisconnection();
      }
    }, 30000); // كل 30 ثانية
  }

  stopStatusCheck() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  handleDisconnection() {
    console.log('🔄 معالجة انقطاع الاتصال...');
    this.isConnected = false;
    this.isReady = false;
    this.wapiReady = false;
    this.storeReady = false;
    this.stopStatusCheck();
    this.stopReadyCheck();
    
    console.log('ℹ️ يمكن إعادة التهيئة يدوياً عند الحاجة');
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    // التحقق من الاتصال والجاهزية
    if (!this.isConnected || !this.client) {
      throw new Error('الواتساب غير متصل. يرجى التهيئة أولاً.');
    }

    if (!this.isReady || !this.wapiReady) {
      console.log('⏳ WhatsApp Web لا يزال يحمل، انتظار الجاهزية...');
      
      // انتظار الجاهزية لمدة أقصاها 60 ثانية
      const readyTimeout = 60000;
      const startTime = Date.now();
      
      while ((!this.isReady || !this.wapiReady) && (Date.now() - startTime) < readyTimeout) {
        await this.checkFullReadiness();
        if (!this.isReady || !this.wapiReady) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      if (!this.isReady || !this.wapiReady) {
        throw new Error('WhatsApp Web غير جاهز للإرسال. يرجى إعادة التهيئة.');
      }
    }

    try {
      // فحص حالة الاتصال قبل الإرسال
      const state = await this.client.getConnectionState();
      if (state !== 'CONNECTED') {
        throw new Error('الاتصال غير مستقر. يرجى إعادة التهيئة.');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`📤 إرسال رسالة إلى ${formattedNumber}`);
      
      // التحقق من صحة الرقم قبل الإرسال
      let isValidNumber;
      try {
        isValidNumber = await this.client.checkNumberStatus(formattedNumber);
        if (!isValidNumber.exists) {
          throw new Error(`الرقم ${phoneNumber} غير مسجل في الواتساب`);
        }
      } catch (checkError) {
        console.warn('⚠️ لم يتم التحقق من صحة الرقم:', checkError.message);
        // المتابعة بدون فحص الرقم
      }

      // محاولة إرسال الرسالة مع معالجة محسنة للأخطاء
      let result;
      let sendAttempts = 0;
      const maxSendAttempts = 3;
      
      while (sendAttempts < maxSendAttempts) {
        try {
          sendAttempts++;
          console.log(`📤 محاولة إرسال ${sendAttempts}/${maxSendAttempts}...`);
          
          // فحص WAPI قبل كل محاولة إرسال
          const wapiCheck = await this.client.page.evaluate(() => {
            try {
              // التحقق من وجود getMaybeMeUser
              if (!window.Store.Conn || !window.Store.Conn.getMaybeMeUser) {
                // إعادة إنشاء الدالة
                if (window.Store.Conn) {
                  window.Store.Conn.getMaybeMeUser = function() {
                    try {
                      return window.Store.Conn.me || window.Store.Me || window.Store.Conn.attributes || null;
                    } catch (e) {
                      console.error('خطأ في getMaybeMeUser:', e);
                      return null;
                    }
                  };
                  console.log('🔧 تم إعادة إنشاء getMaybeMeUser');
                }
              }
              
              // اختبار الدالة
              const me = window.Store.Conn.getMaybeMeUser();
              return {
                success: true,
                hasMeUser: !!me,
                wapiReady: !!(window.WAPI && window.WAPI.sendMessage)
              };
            } catch (error) {
              console.error('خطأ في فحص WAPI:', error);
              return {
                success: false,
                error: error.message
              };
            }
          });
          
          if (!wapiCheck.success || !wapiCheck.wapiReady) {
            console.log('❌ WAPI غير جاهز:', wapiCheck);
            if (sendAttempts < maxSendAttempts) {
              console.log('⏳ انتظار 5 ثواني قبل المحاولة التالية...');
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            } else {
              throw new Error('WAPI غير جاهز للإرسال بعد عدة محاولات');
            }
          }
          
          console.log('✅ WAPI جاهز، بدء الإرسال...');
          result = await this.client.sendText(formattedNumber, message);
          
          // إذا وصلنا هنا، فقد نجح الإرسال
          break;
          
        } catch (sendError) {
          console.error(`❌ خطأ في محاولة الإرسال ${sendAttempts}:`, sendError.message);
          
          // إذا كان الخطأ متعلق بـ getMaybeMeUser
          if (sendError.message.includes('getMaybeMeUser') || sendError.message.includes('Cannot read properties of undefined')) {
            console.log('🔄 إصلاح مشكلة getMaybeMeUser...');
            
            try {
              // إعادة تحميل الصفحة
              await this.client.page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
              console.log('🔄 تم إعادة تحميل الصفحة');
              
              // انتظار تحميل الواجهة
              await new Promise(resolve => setTimeout(resolve, 15000));
              
              // إعادة تهيئة WAPI
              await this.initializeWAPI();
              
              // إعادة فحص الجاهزية
              await this.checkFullReadiness();
              
              if (this.isReady && this.wapiReady) {
                console.log('✅ تم إصلاح المشكلة، المتابعة...');
                continue; // المحاولة مرة أخرى
              } else {
                console.log('❌ فشل في إصلاح المشكلة');
                if (sendAttempts >= maxSendAttempts) {
                  throw new Error('فشل في إصلاح مشكلة getMaybeMeUser بعد عدة محاولات');
                }
              }
            } catch (reloadError) {
              console.error('❌ فشل في إعادة التحميل:', reloadError.message);
              if (sendAttempts >= maxSendAttempts) {
                throw new Error('فشل في إرسال الرسالة بعد إعادة التحميل. يرجى إعادة تهيئة الواتساب.');
              }
            }
          } else {
            // خطأ آخر غير متعلق بـ getMaybeMeUser
            if (sendAttempts >= maxSendAttempts) {
              throw sendError;
            }
          }
          
          // انتظار قبل المحاولة التالية
          if (sendAttempts < maxSendAttempts) {
            console.log(`⏳ انتظار 5 ثواني قبل المحاولة ${sendAttempts + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      if (!result) {
        throw new Error('فشل في إرسال الرسالة بعد عدة محاولات');
      }
      
      console.log('✅ تم إرسال الرسالة بنجاح:', result.id);
      
      this.lastActivity = Date.now();
      
      // انتظار قصير بين الرسائل لتجنب الحظر
      const delay = parseInt(process.env.MESSAGE_DELAY) || 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return {
        success: true,
        messageId: result.id,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('number not exists')) {
        errorMessage = `الرقم ${phoneNumber} غير مسجل في الواتساب`;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'تم تجاوز حد الإرسال، يرجى المحاولة لاحقاً';
      } else if (error.message.includes('blocked')) {
        errorMessage = 'تم حظر الحساب مؤقتاً';
      } else if (error.message.includes('Session closed') || error.message.includes('Protocol error')) {
        errorMessage = 'انقطع الاتصال بالواتساب';
        this.handleDisconnection();
      } else if (error.message.includes('getMaybeMeUser') || error.message.includes('Cannot read properties of undefined')) {
        errorMessage = 'خطأ في واجهة WhatsApp Web. يرجى إعادة التهيئة.';
        this.isReady = false;
        this.wapiReady = false;
      }
      
      throw new Error(errorMessage);
    }
  }

  async testMessage(phoneNumber, message = null) {
    try {
      const testMsg = message || `🧪 رسالة اختبار من نظام إدارة الحضور

هذه رسالة اختبار للتأكد من عمل النظام.

الوقت: ${new Date().toLocaleString('en-GB')}
الحالة: ${this.isConnected ? 'متصل' : 'غير متصل'}
الجاهزية: ${this.isReady ? 'جاهز' : 'غير جاهز'}
WAPI: ${this.wapiReady ? 'جاهز' : 'غير جاهز'}

📚 نظام إدارة الحضور`;
      
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

  async sendBulkMessages(messages) {
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    console.log(`📤 بدء إرسال ${messages.length} رسالة...`);
    
    // التحقق من الجاهزية الكاملة قبل البدء
    if (!this.isReady || !this.wapiReady) {
      console.log('⏳ انتظار جاهزية WhatsApp Web الكاملة...');
      
      let readyAttempts = 0;
      const maxReadyAttempts = 10;
      
      while ((!this.isReady || !this.wapiReady) && readyAttempts < maxReadyAttempts) {
        await this.checkFullReadiness();
        if (!this.isReady || !this.wapiReady) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        readyAttempts++;
        console.log(`🔍 محاولة جاهزية ${readyAttempts}/${maxReadyAttempts} - WAPI: ${this.wapiReady ? '✅' : '❌'} | Ready: ${this.isReady ? '✅' : '❌'}`);
      }
      
      if (!this.isReady || !this.wapiReady) {
        throw new Error('WhatsApp Web غير جاهز للإرسال المجمع. يرجى إعادة التهيئة.');
      }
    }
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      try {
        console.log(`📤 إرسال رسالة ${i + 1}/${messages.length} إلى ${msg.phoneNumber}`);
        
        const result = await this.sendMessage(msg.phoneNumber, msg.message, msg.messageType || 'bulk');
        results.push({
          phoneNumber: msg.phoneNumber,
          success: true,
          messageId: result.messageId,
          timestamp: result.timestamp
        });
        successCount++;
        console.log(`✅ تم إرسال الرسالة ${successCount}/${messages.length}`);
        
        // انتظار أطول بين الرسائل في الإرسال المجمع
        const bulkDelay = parseInt(process.env.BULK_MESSAGE_DELAY) || 5000;
        await new Promise(resolve => setTimeout(resolve, bulkDelay));
        
      } catch (error) {
        results.push({
          phoneNumber: msg.phoneNumber,
          success: false,
          error: error.message
        });
        failedCount++;
        console.error(`❌ فشل إرسال الرسالة ${successCount + failedCount}/${messages.length}:`, error.message);
        
        // إذا كان الخطأ متعلق بالجلسة، توقف
        if (error.message.includes('انقطع الاتصال') || error.message.includes('غير متصل') || error.message.includes('getMaybeMeUser')) {
          console.log('🛑 توقف الإرسال المجمع بسبب مشكلة في الاتصال');
          
          // محاولة إصلاح سريع
          try {
            console.log('🔄 محاولة إصلاح سريع...');
            await this.initializeWAPI();
            await this.checkFullReadiness();
            
            if (this.isReady && this.wapiReady) {
              console.log('✅ تم الإصلاح، المتابعة...');
              continue;
            } else {
              console.log('❌ فشل الإصلاح السريع');
              break;
            }
          } catch (fixError) {
            console.error('❌ فشل في الإصلاح السريع:', fixError.message);
            break;
          }
        }
        
        // انتظار أطول في حالة الخطأ
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }
    
    console.log(`📊 ملخص الإرسال: ${successCount} نجح، ${failedCount} فشل`);
    return {
      success: true,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount
      }
    };
  }

  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('رقم الهاتف مطلوب');
    }
    
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      throw new Error('رقم الهاتف قصير جداً');
    }
    
    // دعم الأرقام المصرية والسعودية
    if (cleaned.startsWith('20')) {
      if (!cleaned.match(/^20[0-9]{9,10}$/)) {
        throw new Error('رقم الهاتف المصري غير صحيح');
      }
    } else if (cleaned.startsWith('966')) {
      if (!cleaned.match(/^966[5][0-9]{8}$/)) {
        throw new Error('رقم الهاتف السعودي غير صحيح');
      }
    } else {
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      
      if (cleaned.startsWith('5') && cleaned.length === 9) {
        cleaned = '966' + cleaned;
      } else if (cleaned.startsWith('1') && cleaned.length >= 9) {
        cleaned = '20' + cleaned;
      } else {
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
          cleaned = '20' + cleaned;
        } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
          cleaned = '966' + cleaned;
        } else {
          console.warn('⚠️ تنسيق رقم غير معروف، سيتم المحاولة كما هو:', cleaned);
        }
      }
    }
    
    return cleaned + '@c.us';
  }

  async cleanup() {
    try {
      this.stopStatusCheck();
      this.stopReadyCheck();
      
      if (this.client) {
        console.log('🧹 تنظيف الاتصال السابق...');
        try {
          await this.client.close();
        } catch (error) {
          console.log('⚠️ خطأ في إغلاق الاتصال السابق:', error.message);
        }
        this.client = null;
      }
      
      this.isConnected = false;
      this.isReady = false;
      this.wapiReady = false;
      this.storeReady = false;
      this.isInitializing = false;
      this.connectionRetries = 0;
      this.qrCode = null;
      
    } catch (error) {
      console.error('❌ خطأ في تنظيف الاتصال:', error);
    }
  }

  async disconnect() {
    console.log('🔌 قطع اتصال الواتساب...');
    await this.cleanup();
    console.log('✅ تم قطع الاتصال بنجاح');
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected && this.client !== null,
      ready: this.isReady,
      wapiReady: this.wapiReady,
      storeReady: this.storeReady,
      qrCode: this.qrCode,
      lastActivity: this.lastActivity,
      retries: this.connectionRetries
    };
  }

  async validateConnection() {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const state = await this.client.getConnectionState();
      const isValid = state === 'CONNECTED';
      
      if (!isValid) {
        console.log('⚠️ الاتصال غير صالح:', state);
        this.handleDisconnection();
      } else if (!this.isReady || !this.wapiReady) {
        // إذا كان متصل لكن غير جاهز، فحص الجاهزية
        await this.checkFullReadiness();
      }
      
      return isValid && this.isReady && this.wapiReady;
    } catch (error) {
      console.error('❌ خطأ في التحقق من صحة الاتصال:', error);
      this.handleDisconnection();
      return false;
    }
  }
}

module.exports = WhatsAppService;