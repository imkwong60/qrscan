const CACHE_NAME = 'kumamon-qr-v6-supabase';
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
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        return caches.delete(CACHE_NAME).then(() => {
          throw error;
        });
      })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('kumamon-qr-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(event.request, { ignoreSearch: true })).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, response.clone()))
                .catch((error) => console.warn('Failed to cache:', event.request.url, error))
            );
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document' || event.request.mode === 'navigate') {
            return caches.open(CACHE_NAME).then((cache) =>
              cache.match(new URL('./index.html', self.registration.scope).href)
            );
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
