#!/usr/bin/env node
const prerender = require('./lib');
const path = require('path');
const fs = require('fs');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.warn(':warning: puppeteer module not found. Will rely on CHROME_BIN/CHROME_PATH if provided.');
}

// env 可有可無，但路徑要用 __dirname 才能在 Docker 裡正常讀
require('dotenv').config({
  path: path.join(__dirname, 'env/.env.development')
});

function resolveChromeLocation() {
  const puppeteerExecutablePath =
    puppeteer && typeof puppeteer.executablePath === 'function'
      ? puppeteer.executablePath()
      : null;

  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.CHROME_PATH,
    puppeteerExecutablePath,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/local/bin/chrome'
  ].filter(Boolean);

  for (const location of candidates) {
    try {
      if (fs.existsSync(location)) {
        return location;
      }
    } catch (err) {
      // ignore single path check errors and continue
    }
  }

  return candidates[0];
}

const browserDebuggingPort = Number(process.env.BROWSER_DEBUGGING_PORT || 9222);
const chromeProxyServer = process.env.PROXY_SERVER;
const chromeLocation = resolveChromeLocation();

console.log("=== Puppeteer Executable Path ===");
console.log("Chrome Path:", chromeLocation);
console.log("=================================");
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CHROME_PATH:', process.env.CHROME_PATH);
console.log('CHROME_BIN:', process.env.CHROME_BIN);
console.log('BROWSER_DEBUGGING_PORT:', browserDebuggingPort);
console.log('PROXY_SERVER:', chromeProxyServer || '(not set)');

if (!process.env.CACHE_TTL) {
  process.env.CACHE_TTL = '3600'; // 設定為 1 小時 (3600 秒)
}
if (!process.env.CACHE_MAXSIZE) {
  process.env.CACHE_MAXSIZE = '100'; // 最大快取 100 個頁面
}

// 檢查 Chrome 執行檔是否存在
try {
  if (fs.existsSync(chromeLocation)) {
    console.log(':white_check_mark: Chrome executable exists');
    const stats = fs.statSync(chromeLocation);
    console.log(':white_check_mark: Chrome file size:', stats.size, 'bytes');
    console.log(':white_check_mark: Chrome is executable:', !!(stats.mode & fs.constants.S_IXUSR));
  } else {
    console.error(':x: Chrome executable NOT found at:', chromeLocation);
  }
} catch (error) {
  console.error(':x: Error checking Chrome:', error.message);
}

const chromeFlags = [
  // 基礎必要參數
  '--headless=new',
  '--no-sandbox',
  '--disable-setuid-sandbox',

  // 記憶體和共享記憶體
  '--disable-dev-shm-usage',
  '--no-zygote',

  // GPU 相關（容器環境必須停用）
  '--disable-gpu',
  '--disable-accelerated-2d-canvas',
  '--disable-webgl',
  '--disable-software-rasterizer',

  // UI 和顯示
  '--no-first-run',

  // 穩定性增強參數
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--safebrowsing-disable-auto-update',

  // 功能停用
  '--disable-features=VizDisplayCompositor,IsolateOrigins,site-per-process,TranslateUI,BlinkGenPropertyTrees',

  // 遠端除錯
  '--remote-debugging-address=127.0.0.1',
  `--remote-debugging-port=${browserDebuggingPort}`
];

if (chromeProxyServer) {
  chromeFlags.unshift(`--proxy-server=${chromeProxyServer}`);
}

console.log('\n=== Prerender Configuration ===');
const prerenderConfig = {
  chromeLocation: chromeLocation,
  browserDebuggingPort,
  chromeFlags,
  // ========== 時間控制（優化逾時問題） ==========
  navigationTimeout: 90 * 1000,
  executionTimeout: 90 * 1000,
  pageLoadTimeout: 45 * 1000,
  pageDoneCheckInterval: 1000,
  // 頁面 timeout 後回傳已載入的 HTML，而非 504
  timeoutStatusCode: 200,
  waitAfterLastRequest: 500,
  logRequests: true,
};

console.log('Chrome Location:', prerenderConfig.chromeLocation);
console.log('Debug Port:', prerenderConfig.browserDebuggingPort);
console.log('Proxy Enabled:', !!chromeProxyServer);
console.log('Page Load Timeout:', prerenderConfig.pageLoadTimeout);
console.log('HTTP Port (from env):', process.env.PORT || 3000);
console.log('================================\n');

console.log(':rocket: Initializing Prerender server');
const server = prerender(prerenderConfig);
// plugin
console.log(':package: Loading plugins...');

// 健康檢查
server.use(require('./plugins/health-check'));

server.use(prerender.sendPrerenderHeader());
server.use(prerender.browserForceRestart());
// 阻擋不必要內容
server.use(prerender.blockResources());
// 緩存
server.use(require('prerender-memory-cache'));
server.use(prerender.addMetaTags());
// 移除script標籤
server.use(prerender.removeScriptTags());
// server.use(prerender.httpHeaders());
// server.use(require('./plugins/addStatusCodeMeta'));
console.log(':white_check_mark: All plugins loaded');

console.log('\n:clapper: Starting Prerender server...\n');
server.start();

// 監聽進程事件
process.on('unhandledRejection', (reason, promise) => {
  console.error(':x: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error(':x: Uncaught Exception:', error);
});
