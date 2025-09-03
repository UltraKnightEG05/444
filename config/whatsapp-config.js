const path = require('path');

module.exports = {
  session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system',

  // مسارات التخزين
  folderNameToken: process.env.TOKENS_PATH || './tokens',
  mkdirFolderToken: '',

  // إعدادات محسنة لحل مشكلة getMaybeMeUser
  headless: 'new', // استخدام الوضع الجديد
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: true,

  // إعدادات خاصة لحل مشكلة getMaybeMeUser
  multidevice: true,
  disableSpins: true,
  disableWelcome: true,
  autoClose: 0,
  createPathFileToken: true,
  waitForLogin: true,
  refreshQR: 15000,
  catchQR: true,
  statusFind: true,
  
  // إعدادات Puppeteer محسنة لحل مشكلة getMaybeMeUser
  puppeteerOptions: {
    headless: 'new',
    executablePath: process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
    slowMo: 200, // إبطاء العمليات لضمان الاستقرار
    timeout: 300000, // 5 دقائق
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
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess',
      '--enable-features=NetworkService,NetworkServiceLogging',
      '--force-color-profile=srgb',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-features=TranslateUI,BlinkGenPropertyTrees'
    ]
  },

  // إعدادات الرسائل
  messageSettings: {
    maxPerMinute: 10, // تقليل عدد الرسائل لتجنب الحظر
    delay: 4000, // زيادة التأخير
    retryDelay: 5000,
    maxRetries: 3
  },

  // إعدادات إضافية لحل مشكلة getMaybeMeUser
  timeout: 300000, // 5 دقائق
  
  // إعدادات خاصة لـ WhatsApp Web
  browserWS: {
    autoReconnect: true,
    reconnectInterval: 30000,
    maxReconnectAttempts: 5
  },

  // إعدادات لحل مشكلة WAPI
  wapiSettings: {
    waitForWapi: true,
    wapiTimeout: 180000, // 3 دقائق
    checkInterval: 5000,
    maxWapiAttempts: 36 // 3 دقائق / 5 ثواني
  }
};