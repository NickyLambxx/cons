const CACHE_NAME = 'prepmate-constitution-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logo.png',
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

// 1. Установка: кэшируем все файлы
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Активация: удаляем старые кэши, если обновили версию
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. Перехват запросов: если нет интернета, берем из кэша
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Если есть в кэше — возвращаем кэш. Если нет — идем в сеть.
      return response || fetch(e.request);
    })
  );
});