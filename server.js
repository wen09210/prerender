#!/usr/bin/env node
var prerender = require('./lib');

// Determine Chrome/Chromium location. Prefer puppeteer's downloaded binary if available,
// otherwise fall back to environment variable or /usr/bin/chromium.
let chromeLocation = process.env.CHROME_LOCATION || '/usr/bin/chromium';
try {
    const puppeteer = require('puppeteer');
    const ppPath = puppeteer.executablePath();
    if (ppPath) {
        chromeLocation = ppPath;
    }
} catch (e) {
    // puppeteer not installed or executable not found; fall back to default
}

var server = prerender({
    chromeLocation: chromeLocation,
    chromeFlags: [
        '--no-sandbox',
        '--headless',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-zygote',
        '--remote-debugging-port=9222'
    ],
    pageLoadTimeout: 40000 // 40秒
});

server.use(prerender.sendPrerenderHeader());
server.use(prerender.browserForceRestart());
// server.use(prerender.blockResources());
server.use(prerender.addMetaTags());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());

server.start();