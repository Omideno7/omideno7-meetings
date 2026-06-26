const CACHE_NAME = "omideno7-meetings-pwa-v165-mobile-admin-audio-unlock";
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/pwa-192.png",
  "/pwa-512.png",
  "/maskable-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : undefined))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.pathname.includes("/api/") ||
    url.pathname.includes("livekit") ||
    url.hostname.includes("supabase") ||
    url.hostname.includes("livekit")
  ) {
    return;
  }

  // Always fetch latest app code first. This avoids old PWA code staying stuck after updates.
  if (request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/offline.html"))));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => cached)
    )
  );
});
