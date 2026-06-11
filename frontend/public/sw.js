// ─── PWA INSTALL TRIGGER ENGINE ───

const CACHE_NAME = "agrovault-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting(); 
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 🚨 YEH SABSE ZAROORI HAI: 
self.addEventListener("fetch", (event) => {
  // Par Chrome ko satisfy karne ke liye iska hona zaroori hai.
});