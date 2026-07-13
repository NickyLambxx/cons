const CACHE_NAME = 'prep-mate-v32'; // v32: точный поиск, расширенные материалы, печать и мобильные окна
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/core.js?v=32',
  './js/study-data.js?v=32',
  './js/study-tools.js?v=32',
  './js/practice.js?v=32',
  './js/training.js?v=32',
  './js/reading.js?v=32',
  './js/articles-ui.js?v=32',
  './js/mobile-pwa.js?v=32',
  './js/app.js?v=32',
  './manifest.json',
  './logo.png',
  './favicon.ico',
  './og-image.png',
  './avatar.jpg',
  // Главы (можно добавить сюда, но лучше динамически)
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

// Установка SW
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Принудительно активировать новый SW сразу
});

// Активация и удаление старых кэшей
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия запросов
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Для HTML файлов (навигация) используем Network First
  // Это гарантирует, что пользователь видит свежую версию, если есть интернет
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(req); // Если офлайн, берем из кэша
        })
    );
    return;
  }

  // Для остальных ресурсов (CSS, JS, картинки) - Cache First (для скорости)
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      return cachedResponse || fetch(req).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, response.clone());
          return response;
        });
      });
    })
  );
});
