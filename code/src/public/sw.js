/* eslint-env serviceworker */

// -----------------------------------------
// Monkey School — Production Service Worker
// -----------------------------------------

const STATIC_CACHE = "static-v3";
const API_CACHE = "api-v1";
const CDN_CACHE = "cdn-v1";

/**
 * Install event — precaches static files from manifest.
 * @param {ExtendableEvent} event - The SW install event.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      /** @type {string[]} */
      const manifest = await fetch("/precache-manifest.json")
        .then((r) => r.json())
        .catch(() => []);

      await cache.addAll(manifest);

      self.skipWaiting();
    })(),
  );
});

/**
 * Activate event — cleans up old caches and claims clients.
 * @param {ExtendableEvent} event - The SW activate event.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE && key !== API_CACHE && key !== CDN_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );

  self.clients.claim();
});

/**
 * Fetch event — routing logic + caching strategies.
 * @param {FetchEvent} event - The SW fetch event.
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip browser extension requests
  if (url.protocol.startsWith("chrome") || url.hostname.endsWith("extension")) {
    return;
  }

  // 🔥 0) BYPASS AUTH ROUTES (critical)
  if (url.pathname.startsWith("/api/auth/")) {
    return; // Let browser handle OAuth redirects
  }

  // 1) SPA navigation
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then((cached) => cached || fetch(req)),
    );
    return;
  }

  // 2) API → Network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) External CDN → Stale-While-Revalidate
  if (url.origin !== location.origin) {
    event.respondWith(cacheExternal(req));
    return;
  }

  // 4) Static assets → Cache-first
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

/**
 * Cache-first strategy for local static assets.
 * @param {Request} req - The request to handle.
 * @returns {Promise<Response>} Cached response or network fallback.
 */
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}

// ------------------------------------------------
// API: Network-first
// ------------------------------------------------

/**
 * Network-first strategy for API requests.
 * Falls back to cached response on network failure.
 * @param {Request} req - The API request.
 * @returns {Promise<Response>} Fresh or cached response.
 */
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

/**
 * Stale-While-Revalidate strategy for external CDN resources.
 * @param {Request} req - The CDN resource request.
 * @returns {Promise<Response|null>} Cached response or fetched response.
 */
async function cacheExternal(req) {
  const cache = await caches.open(CDN_CACHE);

  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then((response) => {
      cache.put(req, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}
