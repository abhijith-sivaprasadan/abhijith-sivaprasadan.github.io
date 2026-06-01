/**
 * Service Worker — offline-first for static assets, network-first for HTML.
 *
 * Strategy:
 *   - On install: precache the shell (index, css, key js, fonts list).
 *   - On fetch:
 *       HTML pages → network-first with cache fallback (so updates are seen)
 *       Same-origin CSS/JS/JSON → network-first with cache fallback
 *       Same-origin media/assets → cache-first with background revalidate
 *       Cross-origin (CDN: GSAP, KaTeX, fonts) → cache-first, never stale
 *   - Old caches are cleaned on activate.
 *
 * To disable for a session, the user can hit `?nosw=1` once.
 */

const VERSION = "v4-w21-20260601-mobile-overflow-fix";
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const NETWORK_FIRST_EXTENSIONS = /\.(?:css|js|json)$/i;

const SHELL = [
  "/",
  "/index.html",
  "/projects.html",
  "/research.html",
  "/experience.html",
  "/styles.css",
  "/styles/v4.css",
  "/styles/motion.css",
  "/scripts/site.js",
  "/scripts/motion/index.js",
  "/cv.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL).catch(() => {
      // Don't fail install if a single asset fails to fetch
    })).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Skip cache-busted requests (e.g., analytics)
  if (url.hostname === "plausible.io") return;

  // HTML: network-first, fallback to cache, fallback to offline shell
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Same-origin UI/data assets should not hide edits behind stale runtime cache.
  if (url.origin === self.location.origin) {
    if (req.cache === "no-store" || url.pathname.startsWith("/api/") || NETWORK_FIRST_EXTENSIONS.test(url.pathname)) {
      event.respondWith(networkFirst(req));
    } else {
      event.respondWith(cacheFirstRevalidate(req));
    }
    return;
  }

  // Cross-origin (GSAP, KaTeX, fonts): cache-first
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    const offline = await caches.match("/index.html");
    return offline || new Response("Offline.", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirstRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const fetchAndUpdate = fetch(req).then((res) => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchAndUpdate;
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response("", { status: 408 });
  }
}
