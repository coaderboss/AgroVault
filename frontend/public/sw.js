const CACHE_NAME = "agrovault-cache-v2"; // Version upgrade kiya

self.addEventListener("install", (event) => {
  self.skipWaiting(); 
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 🚨 YEH SABSE ZAROORI HAI: Chrome ko satisfy karne ke liye proper pass-through
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Agar offline hoga toh error nahi fatne dega
      return new Response("Aap offline hain bhai.");
    })
  );
});