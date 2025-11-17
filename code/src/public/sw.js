// -----------------------------------------
// Monkey School — Production Service Worker
// -----------------------------------------

const STATIC_CACHE = "static-v3";
const API_CACHE = "api-v1";
const CDN_CACHE = "cdn-v1";

// Install — precache static files
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      const manifest = await fetch("/precache-manifest.json")
        .then(r => r.json())
        .catch(() => []);

      await cache.addAll(manifest);

      self.skipWaiting();
    })()
  );
});

// Activate — clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key !== STATIC_CACHE &&
            key !== API_CACHE &&
            key !== CDN_CACHE
          )
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip browser extension requests
  if (url.protocol.startsWith("chrome") || url.hostname.endsWith("extension")) {
    return;
  }

  // 🔥 0) BYPASS AUTH ROUTES (critical)
  if (url.pathname.startsWith("/api/auth/")) {
    // Do NOT intercept Google OAuth
    return; // Let browser handle 302 redirect normally
  }

  // 1) SPA navigation → return cached index.html
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then(cached => cached || fetch(req))
    );
    return;
  }

  // 2) API requests → network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) External CDN → stale-while-revalidate
  if (url.origin !== location.origin) {
    event.respondWith(cacheExternal(req));
    return;
  }

  // 4) Static assets → cache-first
  if (
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "image" ||
    req.destination === "font"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Default → network
  event.respondWith(fetch(req));
});


// ------------------------------------------------
// STATIC: Cache-first
// ------------------------------------------------
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}

// ------------------------------------------------
// API: Network-first
// ------------------------------------------------
async function networkFirst(req) {
  const cache = await caches.open(API_CACHE);

  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}

// ------------------------------------------------
// CDN: Stale-While-Revalidate
// ------------------------------------------------
async function cacheExternal(req) {
  const cache = await caches.open(CDN_CACHE);

  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then(response => {
      cache.put(req, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}
