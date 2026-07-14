/* Sterith Workout — service worker (offline shell cache) */
var CACHE = 'sterith-workout-v13';
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
  // Cache the new shell but DON'T skipWaiting — the app shows an "update
  // available" prompt and only activates when the user taps Perbarui.
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
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
  // cache-first for same-origin: the shell is pinned to the active SW version,
  // so the app stays on the current version until the user accepts the update.
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(function (r) {
        return r || fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return caches.match('./index.html'); });
      })
    );
  } else {
    // fonts etc: cache-first
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () { return r; }); }));
  }
});
