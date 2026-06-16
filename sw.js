const CACHE_NAME = 'aiueo-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './icon-512.png',
    './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: Network-first, then cache (auto-updates while keeping offline support)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            // Network succeeded: update the cache dynamically and return response
            if (response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
        }).catch(() => {
            // Network failed (offline): serve from cache
            return caches.match(event.request).then((cached) => {
                if (cached) {
                    return cached;
                }
                // If offline and not in cache, fallback to index for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
