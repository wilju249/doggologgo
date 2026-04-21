const CACHE_NAME = "doggologgo-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  console.log("Service Worker install event");
  self.skipWaiting();
  
  event.waitUntil(
    (async () => {
      try {
        // Open cache and add all assets
        const cache = await caches.open(CACHE_NAME);
        console.log("Adding assets to cache:", ASSETS_TO_CACHE);
        
        // Add items individually to handle partial failures
        for (const asset of ASSETS_TO_CACHE) {
          try {
            await cache.add(asset);
            console.log("Cached:", asset);
          } catch (err) {
            console.log("Failed to cache:", asset, err);
          }
        }
      } catch (err) {
        console.log("Cache open error:", err);
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activate event");
  
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );
  
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // For navigation requests, try network first
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (err) {
          console.log("Network request failed, trying cache:", request.url);
          return await caches.match("/index.html");
        }
      })()
    );
    return;
  }
  
  // For everything else, cache first
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        console.log("Serving from cache:", request.url);
        return cached;
      }
      
      try {
        const response = await fetch(request);
        // Cache successful responses
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        console.log("Fetch failed:", request.url, err);
        throw err;
      }
    })()
  );
});