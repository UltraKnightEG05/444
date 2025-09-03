const path = require('path');

module.exports = {
  session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system',

  // نخلي tokens زي ما هي لأنه محلي
  folderNameToken: process.env.TOKENS_PATH || './tokens',
  mkdirFolderToken: '',

  // Venom هيشتغل محلي → هنخلي headless true افتراضيًا
  headless: true,

  devtools: false,
  useChrome: true,
  debug: false,
  logQR: true,

  puppeteerOptions: {
    headless: true,
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
      '--disable-renderer-backgrounding'
    ],
    executablePath: process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    slowMo: 0
  },

  autoClose: 0,
  createPathFileToken: true,
  waitForLogin: true,

  disableSpins: true,
  disableWelcome: true,

  timeout: 60000,

  messageSettings: {
    maxPerMinute: 15,
    delay: 2000,
    retryDelay: 3000
  }
};
