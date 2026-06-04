// TAKE COMMAND — Service Worker v2.0
const CACHE = 'take-command-v2';

// Detect base path automatically (works on file://, localhost, and GitHub Pages)
const BASE = self.location.pathname.replace(/\/sw\.js$/, '') || '';

const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(ASSETS.map(url =>
        cache.add(url).catch(() => null)
      ));
    }).then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  // Only handle GET requests for same-origin resources
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(response => {
      // Cache successful responses
      if (response && response.status === 200 && response.type !== 'opaque') {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return response;
    }).catch(() => {
      // Network failed — serve from cache
      return caches.match(e.request).then(cached => {
        if (cached) return cached;
        // Final fallback — serve index.html
        return caches.match(BASE + '/index.html')
          || caches.match(BASE + '/');
      });
    })
  );
});
