const CACHE_NAME = 'prepmate-v4-final';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './logo.png',
  './favicon.ico',
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
  self.skipWaiting(); // Немедленная активация
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim()); // Немедленный захват клиентов
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});