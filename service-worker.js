const CACHE_PREFIX = 'nursing-roster-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_SHELL = [
  './',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok || (requestUrl.origin !== self.location.origin && response.type === 'opaque')) {
          const responseCopy = response.clone();
          return caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseCopy))
            .then(() => response);
        }
        return response;
      })
      .catch(async (error) => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') {
          const appShell = await caches.match('./');
          if (appShell) return appShell;
        }
        throw error;
      })
  );
});
