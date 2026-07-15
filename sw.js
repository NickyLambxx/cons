const CACHE_NAME = 'prep-mate-v37';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=37',
  './js/vendor/qrcode.js?v=37',
  './js/core.js?v=37',
  './js/study-data.js?v=37',
  './js/study-tools.js?v=37',
  './js/practice.js?v=37',
  './js/training.js?v=37',
  './js/reading.js?v=37',
  './js/articles-ui.js?v=37',
  './js/mobile-pwa.js?v=37',
  './js/data-transfer.js?v=37',
  './js/app.js?v=37',
  './manifest.json',
  './logo.png',
  './favicon.ico',
  './og-image.png',
  './avatar.jpg',
  './chapters/chapter1.html',
  './chapters/chapter2.html',
  './chapters/chapter3.html',
  './chapters/chapter4.html',
  './chapters/chapter5.html',
  './chapters/chapter6.html',
  './chapters/chapter7.html',
  './chapters/chapter8.html',
  './chapters/chapter9.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? undefined : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Cache API supports GET requests only. Let POST and other methods pass through.
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (!response || !response.ok) return response;
          return caches.open(CACHE_NAME)
            .then(cache => cache.put(req, response.clone()))
            .then(() => response);
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cachedResponse => cachedResponse || fetch(req).then(response => {
      if (!response || !response.ok) return response;
      return caches.open(CACHE_NAME)
        .then(cache => cache.put(req, response.clone()))
        .then(() => response);
    }))
  );
});
