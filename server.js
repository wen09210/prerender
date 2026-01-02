const prerender = require('./lib'); // Correct import for local library
const fs = require('fs');

const server = prerender({
  chromeLocation: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable",
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--remote-debugging-address=0.0.0.0",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-software-rasterizer",
    "--disable-extensions",
    "--mute-audio",
    "--enable-logging",
    "--v=1",
    "--no-zygote",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-sync",
    "--user-data-dir=/tmp/chrome-data"
  ],
  logRequests: true
});

server.use(prerender.sendPrerenderHeader());
server.use(prerender.browserForceRestart());
server.use(prerender.addMetaTags());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());

// Health check middleware
server.use({
  requestReceived: (req, res, next) => {
    if (req.prerender.url === 'health' || req.prerender.url.endsWith('/health')) {
      res.send(200, 'OK');
      return;
    }
    next();
  }
});

const port = process.env.PORT || 3000;

console.log(`Using Chrome at: ${server.options.chromeLocation}`);
if (fs.existsSync(server.options.chromeLocation)) {
  console.log('✅ Chrome executable found at specified path.');
} else {
  console.error('❌ Chrome executable NOT found at specified path!');
}

server.start({ port });
console.log(`Prerender server running on port ${port}`);