/* Sterith Workout — service worker */
var CACHE = 'sterith-workout-v18';
var ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/data.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/logo-dark.png',
  './assets/logo-light.png'
];

self.addEventListener('install', function (e) {
  // Cache the shell, tolerating individual asset failures so one missing file
  // can't break the whole worker. No skipWaiting — the app prompts to update.
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (a) { return c.add(a).catch(function () { /* skip */ }); }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// The page tells us to activate the waiting worker when the user taps Update.
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Cross-origin (fonts etc.): cache-first, network fallback.
  if (url.origin !== location.origin) {
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }).catch(function () { return caches.match(req); }));
    return;
  }

  // Navigations: NETWORK-FIRST so the app shell is always fresh online, falling
  // back to cache (then index.html, then a minimal page) offline — never fails.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
      }).catch(function () {
        return caches.match(req)
          .then(function (r) { return r || caches.match('./index.html'); })
          .then(function (r) { return r || new Response('<!doctype html><meta charset="utf-8"><title>Sterith Health</title><body style="font-family:system-ui;background:#0D1117;color:#f4efe6;display:grid;place-items:center;height:100vh;margin:0"><p>Sedang offline. Sambungkan internet lalu buka lagi.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); });
      })
    );
    return;
  }

  // Same-origin assets: cache-first, network fallback, final safety = index.html.
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
      });
    }).catch(function () { return caches.match('./index.html'); })
  );
});
