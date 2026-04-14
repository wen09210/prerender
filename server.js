#!/usr/bin/env node
const prerender = require('./lib');
const path = require('path');
// env 可有可無，但路徑要用 __dirname 才能在 Docker 裡正常讀
require('dotenv').config({
    path: path.join(__dirname, 'env/.env.development')
});
// 優先使用環境變數，最後 fallback 到已知的系統 Chromium 路徑
const chromeLocation = process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_BIN ||
    process.env.CHROME_PATH ||
    '/usr/local/bin/chrome';
console.log("=== Puppeteer Executable Path ===");
console.log("Chrome Path:", chromeLocation);
console.log("=================================");
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CHROME_PATH:', process.env.CHROME_PATH);
console.log('CHROME_BIN:', process.env.CHROME_BIN);

process.env.CACHE_TTL = process.env.CACHE_TTL || 3600;
process.env.CACHE_MAXSIZE = process.env.CACHE_MAXSIZE || 100;





// 檢查 Chrome 執行檔是否存在
const fs = require('fs');
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
console.log('\n=== Prerender Configuration ===');
const prerenderConfig = {
    chromeLocation: chromeLocation,
    chromeFlags: [
        // 若有設定容器網路代理
        ...(process.env.PROXY_SERVER ? [`--proxy-server=${process.env.PROXY_SERVER}`] : []),
        // 基礎必要參數
        '--headless=new',                        // 新版無頭模式（更穩定）
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--user-data-dir=/tmp/prerender-chrome-profile',

        // 記憶體和共享記憶體
        '--disable-dev-shm-usage',
        '--no-zygote',

        // GPU 相關（容器環境必須停用）
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--disable-webgl',
        '--disable-software-rasterizer',

        // 安全性設定
        // '--disable-web-security',
        // '--ignore-certificate-errors',

        // UI 和顯示
        '--no-first-run',
        // proxy

        // 穩定性增強參數
        '--disable-background-networking',        // 停用背景網路請求
        '--disable-background-timer-throttling',  // 停用背景計時器節流
        '--disable-backgrounding-occluded-windows', // 停用背景視窗處理
        '--disable-breakpad',                     // 停用崩潰報告
        '--disable-client-side-phishing-detection', // 停用釣魚檢測
        '--disable-component-extensions-with-background-pages', // 停用背景擴充功能
        '--disable-default-apps',                 // 停用預設應用
        '--disable-extensions',                   // 停用所有擴充功能
        '--disable-hang-monitor',                 // 停用掛起監控
        '--disable-ipc-flooding-protection',      // 停用 IPC 洪流保護
        '--disable-popup-blocking',               // 停用彈窗阻擋
        '--disable-prompt-on-repost',            // 停用重新提交提示
        '--disable-renderer-backgrounding',       // 停用渲染器背景處理
        '--disable-sync',                        // 停用同步功能
        '--disable-translate',                   // 停用翻譯功能
        '--metrics-recording-only',              // 僅記錄指標
        '--mute-audio',                          // 靜音
        '--no-default-browser-check',            // 不檢查預設瀏覽器
        '--safebrowsing-disable-auto-update',    // 停用安全瀏覽自動更新

        // 功能停用
        '--disable-features=VizDisplayCompositor,IsolateOrigins,site-per-process,TranslateUI,BlinkGenPropertyTrees',

        // 遠端除錯
        '--remote-debugging-address=127.0.0.1',
        '--remote-debugging-port=9222',

    ],
    // ========== 時間控制（優化逾時問題） ==========
    navigationTimeout: 60 * 1000,
    executionTimeout: 60 * 1000,
    pageLoadTimeout: 20 * 1000,
    pageDoneCheckInterval: 500,
    logRequests: true,
};

console.log('Chrome Location:', prerenderConfig.chromeLocation);
console.log('Page Load Timeout:', prerenderConfig.pageLoadTimeout);
console.log('HTTP Port (from env):', process.env.PORT || 3000);
console.log('================================\n');

console.log(':rocket: Initializing Prerender server');
const server = prerender(prerenderConfig);
// plugin
console.log(':package: Loading plugins...');

// 健康檢查 (因本機缺少 ./plugins/health-check 檔案，暫時註解避免報錯)
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