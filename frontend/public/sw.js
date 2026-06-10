self.addEventListener('install', (event) => {
  console.log('Service Worker Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker Activated');
});

// Browser ko lagna chahiye ki app offline handle kar sakti hai
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => new Response("Offline")));
});