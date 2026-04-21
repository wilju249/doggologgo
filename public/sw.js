const CACHE_NAME = "doggologgo-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.log("Cache failed for some assets (expected in dev):", err);
        // Don't fail install if some assets aren't available yet
        return Promise.resolve();
      });
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first strategy for HTML, cache-first for assets
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    // For HTML navigation requests, try network first
    event.respondWith(
      fetch(request)
        .catch(() => caches.match("/index.html"))
    );
  } else {
    // For other assets (CSS, JS, images), try cache first
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
  }
});