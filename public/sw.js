const CACHE_NAME = "mileage-tracker-v1";
const OFFLINE_PAGE = "/offline.html";

const PRECACHE_ASSETS = [
  OFFLINE_PAGE,
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/maskable-icon-192x192.png",
  "/maskable-icon-512x512.png",
  "/apple-icon.png",
];

const ORIGIN = self.location.origin;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignore cross-origin and API/server-action routes.
  if (url.origin !== ORIGIN || url.pathname.startsWith("/api/")) return;

  // Cache static assets and the web manifest.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    PRECACHE_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request).then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Navigation requests: try the network, then fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }
});
