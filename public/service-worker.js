const CACHE_VERSION = 'v2';
const CACHE_NAME = `hyperborea-${CACHE_VERSION}`;
const ASSETS = [
  '/hyperborea.html',
  '/main.js',
  '/styles.css',
  '/videos/intro-video.mp4',
  '/manifest.json',
  // Add more static assets as needed
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Try cache first, then network, then update cache in background (stale-while-revalidate)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Only cache valid responses (status 200, basic type)
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // fallback to cache if offline
      // Return cached response immediately, update in background
      return cachedResponse || fetchPromise;
    })
  );
});
