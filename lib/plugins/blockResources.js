const blockedResources = [
  // Google Analytics / GTM / Ads
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'analytics.google.com',
  'googleads.g.doubleclick.net',
  'stats.g.doubleclick.net',
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'partner.googleadservices.com',
  'www.google.com/ccm/collect',
  'www.google.com/rmkt/collect',
  'www.google.com/measurement/conversion',
  'www.google.com.tw/ads/ga-audiences',
  // Adobe Analytics (AA / Omniture / Target / Experience)
  'omtrdc.net',
  '2o7.net',
  'demdex.net',
  'omniture.com',
  'adobedtm.com',
  'adobedc.net',
  'everesttech.net',
  '.rum/@adobe',
  // Social media tracking
  'connect.facebook.net',
  'static.ads-twitter.com',
  'd.line-scdn.net',
  'tr.line.me',
  'snap.licdn.com',
  // Other analytics
  'api.mixpanel.com',
  'mc.yandex.ru',
  'beacon.tapfiliate.com',
  'js-agent.newrelic.com',
  'api.segment.io',
  'woopra.com',
  'static.olark.com',
  'static.getclicky.com',
  'cdn.heapanalytics.com',
  'fullstory.com/rec',
  'navilytics.com/nls_ajax.php',
  'log.optimizely.com/event',
  'hn.inspectlet.com',
  // Fonts
  'fonts.googleapis.com',
  'use.typekit.net',
  'fast.fonts.com',
  // Misc
  'youtube.com/embed',
  '.ttf',
  '.eot',
  '.otf',
  '.woff',
  '.png',
  '.gif',
  '.tiff',
  '.pdf',
  '.jpg',
  '.jpeg',
  '.ico',
  '.svg',
];

module.exports = {
  tabCreated: (req, res, next) => {
    req.prerender.tab.Network.setBlockedURLs({ urls: blockedResources })
      .then(() => {
        next();
      })
      .catch(() => {
        // setBlockedURLs 不支援時 fallback，不擋資源直接繼續
        next();
      });
  },
};
