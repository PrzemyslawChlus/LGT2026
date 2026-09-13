// Service Worker - Liga Gentlemanów Tenisa
// Strategy: Network-First for Navigation (HTML) & dynamic version files,
// Stale-While-Revalidate/Cache-First for immutable hashed assets.

const CACHE_VERSION = 'lgt-v2026-build';
const STATIC_ASSETS = [
  '/logo.svg',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Pre-cache only immutable core branding assets, NEVER index.html!
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    })
  );
  // Activate immediately without waiting for previous workers
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache bucket:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        if (event.ports?.[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Never cache version.json, sw.js or Firebase/Firestore/Google API calls
  if (
    url.pathname === '/sw.js' ||
    url.pathname === '/version.json' ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('run.app') && url.pathname.startsWith('/api')
  ) {
    return; // Let standard browser network handle it directly
  }

  // 2. Navigation / HTML Document requests -> STRICT NETWORK-FIRST
  // This guarantees that after any new deploy, the user gets the fresh index.html
  // and fresh asset references immediately, falling back to cache only when offline.
  const isHtmlNavigation =
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          console.warn('[SW] Network unreachable, serving cached offline document.');
          const cached = await caches.match(request);
          if (cached) return cached;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static assets (/assets/*.js, /assets/*.css, fonts, images)
  // These files are either hashed by Vite or static, so cache with network fallback is safe.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch update in background for next time if it's not a hashed asset
        if (!url.pathname.startsWith('/assets/')) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => {
          // If offline and image/asset missing, return null
        });
    })
  );
});
