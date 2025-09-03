const path = require('path');

module.exports = {
  session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system',

  // مسارات التخزين
  folderNameToken: process.env.TOKENS_PATH || './tokens',
  mkdirFolderToken: '',

  // إعدادات محسنة لحل مشكلة getMaybeMeUser v5.0.17
  headless: 'new',
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: true,

  // إعدادات خاصة لحل مشكلة getMaybeMeUser v5.0.17
  multidevice: true,
  disableSpins: true,
  disableWelcome: true,
  autoClose: 0,
  createPathFileToken: true,
  waitForLogin: true,
  refreshQR: 15000,
  catchQR: true,
  statusFind: true,
  
  // إعدادات جديدة لحل مشكلة getMaybeMeUser نهائياً
  browserWS: {
    autoReconnect: true,
    reconnectInterval: 30000,
    maxReconnectAttempts: 5
  },
  
  // إعدادات WAPI محسنة
  wapiSettings: {
    waitForWapi: true,
    wapiTimeout: 300000,
    checkInterval: 5000,
    maxWapiAttempts: 60,
    enableGetMaybeMeUserFix: true,
    forceWapiReload: true
  },
  
  // إعدادات Puppeteer محسنة لحل مشكلة getMaybeMeUser
  puppeteerOptions: {
    headless: 'new',
    executablePath: process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
    slowMo: 300,
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
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess,TranslateUI,BlinkGenPropertyTrees',
      '--enable-features=NetworkService,NetworkServiceLogging',
      '--force-color-profile=srgb',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--force-fieldtrials=*BackgroundTracing/default/',
      '--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider',
      '--aggressive-cache-discard',
      '--enable-precise-memory-info'
    ]
  },

  // إعدادات الرسائل
  messageSettings: {
    maxPerMinute: 8,
    delay: 5000,
    retryDelay: 5000,
    maxRetries: 3
  },

  // إعدادات إضافية
  timeout: 300000,
  
  // إعدادات Cloudflare Tunnel
  tunnel: {
    enabled: process.env.ENABLE_TUNNEL === 'true',
    domain: process.env.TUNNEL_DOMAIN || 'api.go4host.net',
    tunnelName: process.env.TUNNEL_NAME || 'attendance-venom',
    autoStart: process.env.AUTO_START_TUNNEL === 'true'
  }
};