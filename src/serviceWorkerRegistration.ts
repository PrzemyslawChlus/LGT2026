// Service worker registration helper for Liga Gentlemanów Tenisa
// Ensures service worker is ONLY active in production builds,
// preventing dev server caching conflicts with Vite and React hooks.

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    // In development mode, unregister any lingering service workers
    // and clear cache storage to avoid stale Vite/React chunks.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('[SW-Dev] Unregistered stale service worker to prevent chunk conflicts.');
          }
        });
      }
    });

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
    return;
  }

  // Production environment: register service worker for offline & PWA support
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Immediate update check
        reg.update();

        // Periodic check every 60 seconds
        setInterval(() => {
          reg.update();
        }, 60 * 1000);

        // Visibility change check
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });

        // Trigger skip waiting when a new version is detected
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New version detected, notifying worker...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration warning:', err);
      });

    // Handle controller change smoothly
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[SW] Controller changed, refreshing...');
        window.location.reload();
      }
    });
  });
}
