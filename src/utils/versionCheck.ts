// Version and cache management utility for Liga Gentlemanów Tenisa

export interface VersionInfo {
  version: string;
  buildTime: number;
  buildDate: string;
}

export const LOCAL_BUILD_TIME: number = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : Date.now();
export const LOCAL_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

/**
 * Checks server for a newly deployed version by querying /version.json with cache-busting.
 */
export async function checkServerVersion(): Promise<{ hasUpdate: boolean; serverInfo?: VersionInfo }> {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!res.ok) {
      return { hasUpdate: false };
    }

    const data: VersionInfo = await res.json();
    if (data && typeof data.buildTime === 'number') {
      // If server build time is strictly newer than our compiled build time
      const isNewer = data.buildTime > LOCAL_BUILD_TIME;
      return {
        hasUpdate: isNewer,
        serverInfo: data,
      };
    }

    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}

/**
 * Hard-purges all CacheStorage entries, forces Service Worker updates,
 * and reloads the window to ensure the newest build is rendered.
 */
export async function forceAppRefresh(bypassCache: boolean = true): Promise<void> {
  try {
    // 1. Purge all Service Worker caches
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }

    // 2. Tell active Service Worker to purge or skip waiting
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    // 3. Update registrations
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.update()));
    }
  } catch (err) {
    console.warn('Error while clearing caches during force refresh:', err);
  }

  // 4. Force reload
  if (bypassCache) {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.replace(url.toString());
  } else {
    window.location.reload();
  }
}
