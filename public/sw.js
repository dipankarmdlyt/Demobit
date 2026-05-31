/**
 * Mossbit Progressive Web App (PWA) Service Worker
 * Resolves static caching, runtime fallbacks, and background synchronization.
 * Pure Vanilla JavaScript for direct browser execution. All TS assertions excluded.
 */

const CACHE_NAME = 'mossbit-v2-cache';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Helper to wrap fetch with a timeout
function fetchWithTimeout(request, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Network request timed out'));
    }, timeoutMs);

    fetch(request).then(
      (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

// On Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching critical application shell');
      // Use Promise.allSettled so individual missing files do NOT block registration
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) => {
          return cache.add(asset)
            .then(() => console.log(`[Service Worker] Precached successfully: ${asset}`))
            .catch((err) => console.warn(`[Service Worker] Skipped precaching: ${asset}`, err));
        })
      );
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

  // Exclude non-http and non-https schemes (chrome-extension, edge, etc) safely
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Skip API or non-GET requests so they pass to network directly
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        // Return structured offline payload for APIs when offline
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

  // SPA navigation fallback: serve index.html with fast timeout (1500ms) to bypass lie-fi
  if (req.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(req, 1500)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseToCache);
            });
            return networkResponse;
          }
          return caches.match('/index.html') || caches.match('/');
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Standard static asset handling: Stale-While-Revalidate with CORS caching
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const type = networkResponse.type;
            if (type === 'basic' || type === 'cors') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, networkResponse);
              });
            }
          }
        }).catch(() => {
          // Fail silently offline
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and dynamically cache
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const type = networkResponse.type;
        if (type === 'basic' || type === 'cors') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Avoid capturing non-GET or protocol-specific garbage
            if (req.method === 'GET') {
              cache.put(req, responseToCache);
            }
          });
        }

        return networkResponse;
      }).catch(() => {
        // Safe offline fallbacks for graphics or fonts
        if (req.headers.get('accept') && req.headers.get('accept').includes('image')) {
          return caches.match('/icon.svg');
        }
        return new Response('Network request failed.', { status: 408, statusText: 'Network Connection Timeout' });
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
