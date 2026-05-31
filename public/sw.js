/**
 * Mossbit Progressive Web App (PWA) Service Worker
 * Resolves static caching, runtime fallbacks, and background synchronization.
 * Pure Vanilla JavaScript for direct browser Execution.
 */

const CACHE_NAME = 'mossbit-v1-cache';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/types.ts',
  '/src/db.ts',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg'
];

// On Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching critical application shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force immediate control
      return self.skipWaiting();
    })
  );
});

// On Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Evicting stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Interception
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip API or non-GET requests so they pass to network directly
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        // Return structured offline payload for APIs when broken
        return new Response(
          JSON.stringify({
            error: true,
            message: 'You are currently offline. Actions will sync automatically when active.',
            offline: true
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  // SPA navigation fallback: serve index.html if navigating page layouts offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Standard static asset handling: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse);
            });
          }
        }).catch(() => {
          // Fail silently offline
        });
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Cache non-POST/non-chrome-extension assets
          if (req.method === 'GET' && !url.protocol.startsWith('chrome-extension')) {
            cache.put(req, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // offline fallback for graphics / fonts
        if (req.headers.get('accept') && req.headers.get('accept').includes('image')) {
          return caches.match('/icon.svg');
        }
        return new Response('Network network failure.', { status: 408, statusText: 'Network Connection Timeout' });
      });
    })
  );
});

// Background Sync Trigger
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-habits' || event.tag === 'sync-data') {
    console.log('[Service Worker] Sync event active. Triggering network push...');
    event.waitUntil(triggerSyncBacklog());
  }
});

/**
 * Sync backlog helper running inside Service Worker environment
 */
async function triggerSyncBacklog() {
  try {
    const clientsList = await self.clients.matchAll();
    for (const client of clientsList) {
      client.postMessage({ type: 'SYNC_TRIGGERED' });
    }
  } catch (err) {
    console.error('[SW] Sync postmessage failed:', err);
  }
}
