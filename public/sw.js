// Service Worker - Liga Gentlemanów Tenisa
// Strategy: Network-First for Navigation (HTML) & dynamic version files,
// Cache-First for production hashed /assets/* and static branding assets.
// Explicitly ignores all development modules, Vite client, and external APIs.

const CACHE_VERSION = 'lgt-v2026-clean-v4';
const STATIC_ASSETS = [
  '/logo.svg',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            console.log('[SW] Purging old cache bucket:', key);
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

  // 1. Strict bypass for:
  // - version.json and sw.js
  // - Vite dev server endpoints: /@vite, /@fs, /@react-refresh, /src/, /node_modules/
  // - Query params with timestamp or versioning (e.g. ?v=, ?t=)
  // - External APIs: Firebase, Firestore, Google APIs, AI Studio backend
  if (
    url.pathname === '/sw.js' ||
    url.pathname === '/version.json' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    (url.hostname.includes('run.app') && url.pathname.startsWith('/api'))
  ) {
    return; // Pass through to network untouched
  }

  // 2. Navigation / HTML Document requests -> STRICT NETWORK-FIRST
  // This guarantees fresh index.html after deployments, with offline fallback.
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
          console.warn('[SW] Offline: serving cached document fallback.');
          const cached = await caches.match(request);
          if (cached) return cached;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static assets (/assets/*.js, /assets/*.css, static images, web manifest)
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // If not a content-hashed asset, revalidate in background
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
          .catch(() => {});
      })
    );
  }
});
