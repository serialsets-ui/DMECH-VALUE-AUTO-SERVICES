// Ops PWA service worker. This exists to satisfy installability (Chrome/
// Android requires a manifest + a service worker with a fetch handler
// before it will offer "Add to Home Screen") -- it is deliberately NOT an
// offline cache for app data. Ops is a live operations tool: a staff member
// must never be shown a stale dashboard, invoice, or inventory count that
// looks current but isn't. Only the static app-shell assets (icons,
// manifest) are cached; every other request goes straight to the network,
// falling back to cache only when there's truly no connection at all.
const SHELL_CACHE = "dmech-ops-shell-v1";
const SHELL_ASSETS = ["/icon.png", "/apple-icon.png", "/ops-manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
