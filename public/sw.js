const CACHE_NAME = 'qr-v1';

self.addEventListener('install', (event) => {
  const basePath = self.registration.scope 
    ? new URL(self.registration.scope).pathname.replace(/\/$/, '') 
    : '/qr';

  const STATIC_ASSETS = [
    `${basePath}/`,
    `${basePath}/index.html`,
    `${basePath}/404.html`,
    `${basePath}/manifest.json`,
    `${basePath}/qr-icon.svg`
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Offline, ignore network failure
        });
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const basePath = self.registration.scope 
            ? new URL(self.registration.scope).pathname.replace(/\/$/, '') 
            : '/qr';
          return caches.match(`${basePath}/index.html`);
        }
      });
    })
  );
});
