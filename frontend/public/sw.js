// public/sw.js
const CACHE_NAME = 'agrovault-pwa-v1'; // AgroVault ka naya cache version

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force new Service Worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('AgroVault: Deleting old cache:', cacheName);
            return caches.delete(cacheName); // Purana kachra saaf
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-First strategy (Next.js ke liye best)
self.addEventListener('fetch', event => {
  // Ignore external API calls (jaise Render backend) taaki wo hamesha fresh data layen
  if (!event.request.url.startsWith(self.location.origin) || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) {
          return response; // Cache se serve karo agar offline hai
        }
        // Agar offline hai aur page nahi mila, toh home page return karo
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});