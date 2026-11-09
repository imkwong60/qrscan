const CACHE_NAME = 'kumamon-qr-v4-local';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  // 本地函式庫與樣式
  './lib/tailwindcss.js',
  './lib/all.min.css',
  './lib/html5-qrcode.min.js',
  './lib/qrcode.min.js',
  './lib/jszip.min.js',
  // FontAwesome webfonts
  './lib/webfonts/fa-solid-900.woff2',
  './lib/webfonts/fa-regular-400.woff2',
  // Zen Maru Gothic 字型
  './lib/fonts/zen-500.ttf',
  './lib/fonts/zen-700.ttf',
  './lib/fonts/zen-900.ttf'
];

// Install: precache all local assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('Failed to cache:', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: pure Cache-First（完全離線優先）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // 不在快取 → 嘗試網路（僅首次安裝時有用），成功後寫入快取
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document' || event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
