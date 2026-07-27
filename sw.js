const CACHE_NAME = 'urgences-dentaires-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './favicon-32.png',
  './favicon-16.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

// Install — precache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

function isCacheable(response) {
  // 'basic' = same-origin, 'cors' = Google Fonts CSS + font files
  return response && response.status === 200 &&
    (response.type === 'basic' || response.type === 'cors');
}

// Fetch — stale-while-revalidate: serve cache instantly, refresh in background.
// Guarantees offline availability AND that updates eventually reach users.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request, { ignoreSearch: event.request.mode === 'navigate' }).then(cached => {
        const networkFetch = fetch(event.request)
          .then(response => {
            if (isCacheable(response)) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for navigations
            if (event.request.mode === 'navigate') {
              return cache.match('./index.html');
            }
            return cached;
          });

        return cached || networkFetch;
      })
    )
  );
});
