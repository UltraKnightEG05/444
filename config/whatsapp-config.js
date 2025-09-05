const path = require('path');

module.exports = {
  session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-v5-3-0',

  // مسارات التخزين
  folderNameToken: process.env.TOKENS_PATH || './tokens',
  mkdirFolderToken: '',

  // إعدادات محسنة لـ venom-bot v5.3.0 مع إصلاح WebSocket
  headless: 'new',
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: true,

  // إعدادات خاصة لـ venom-bot v5.3.0 مع إصلاحات WebSocket
  multidevice: true,
  disableSpins: true,
  disableWelcome: true,
  autoClose: 0,
  createPathFileToken: true,
  waitForLogin: true,
  refreshQR: 15000,
  catchQR: true,
  statusFind: true,
  
  // إعدادات محسنة لـ v5.3.0 مع إصلاح WebSocket
  browserWS: {
    autoReconnect: true,
    reconnectInterval: 30000,
    maxReconnectAttempts: 10
  },
  
  // إعدادات WAPI محسنة لـ v5.3.0 مع إصلاحات متقدمة
  wapiSettings: {
    waitForWapi: true,
    wapiTimeout: 300000,
    checkInterval: 3000,
    maxWapiAttempts: 100,
    enableGetMaybeMeUserFix: true,
    forceWapiReload: true,
    enableStoreReady: true
  },
  
  // إعدادات Puppeteer محسنة لـ v5.3.0 مع إصلاح WebSocket
  puppeteerOptions: {
    headless: 'new',
    executablePath: process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    slowMo: 100,
    timeout: 300000,
    protocolTimeout: 300000,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
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
      '--enable-precise-memory-info',
      // إصلاحات خاصة لـ WebSocket في v5.3.0
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-site-isolation-trials',
      '--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer',
      '--remote-debugging-port=0'
    ]
  },

  // إعدادات الرسائل
  messageSettings: {
    maxPerMinute: 12,
    delay: 3000,
    retryDelay: 3000,
    maxRetries: 3
  },

  // إعدادات إضافية لـ v5.3.0
  timeout: 300000,
  
  // إعدادات Cloudflare Tunnel
  tunnel: {
    enabled: process.env.ENABLE_TUNNEL === 'true',
    tunnelId: '9752631e-8b0d-48a8-b9c1-20f376ce578f',
    domain: process.env.TUNNEL_DOMAIN || 'api.go4host.net',
    tunnelName: process.env.TUNNEL_NAME || 'attendance-venom',
    autoStart: process.env.AUTO_START_TUNNEL === 'true'
  }
};
