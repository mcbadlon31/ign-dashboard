
const CACHE = 'ign-cache-v2';
const API_CACHE = 'ign-api-v1';
const CORE = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET' && url.pathname.startsWith('/api/')) {
    // SWR for API
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) cache.put(event.request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }
  // Default cache-first for others
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});


self.addEventListener('sync', async (event) => {
  if (event.tag === 'ign-sync') {
    event.waitUntil((async () => {
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
      for (const c of clientsList) {
        c.postMessage({ type: 'FLUSH_QUEUE' });
      }
    })());
  }
});
