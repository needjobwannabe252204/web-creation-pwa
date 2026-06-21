/* Service Worker for Web Creation — precache with progress reporting
   - Caches the app shell file-by-file (not addAll) so we can report
     download progress back to the page that's waiting on it.
   - Serves cached responses first, falls back to network.
   - Provides an offline page for navigations when offline.
*/

var CACHE_NAME = 'webcreation-v2';
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/src/css/style.css',
  '/src/js/utils.js',
  '/src/js/script.js',
  '/src/js/lesson-1.js',
  '/src/js/lesson-2.js',
  '/src/js/lesson-3.js',
  // icons
  '/assets/image/logo/icon-192.svg',
  '/assets/image/logo/icon-512.svg',
  '/assets/image/logo/cdm-logo.jpeg',
  // nav pages
  '/src/html/nav-pages/about.html',
  '/src/html/nav-pages/contact.html',
  // main lesson pages (cache core content for offline review)
  '/src/html/lesson-1/lesson-1.html',
  '/src/html/lesson-2/lesson-2.html',
  '/src/html/lesson-3/lesson-3.html',
  '/src/html/lesson-4/lesson-4.html'
];

/**
 * Tell every open tab/window how the precache download is going.
 * type: 'progress' while in flight, 'done' when finished (or failed-but-finished).
 */
function broadcast(msg) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (clients) {
      clients.forEach(function (client) { client.postMessage(msg); });
    });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var total = PRECACHE_URLS.length;
      var done = 0;

      /* Cache requests one at a time (in parallel) but count each as it
         resolves, so the page can show a live X / total progress bar. */
      var tasks = PRECACHE_URLS.map(function (url) {
        return fetch(url, { cache: 'no-cache' }).then(function (response) {
          if (response && response.ok) {
            return cache.put(url, response);
          }
          /* Non-fatal: skip files that 404 instead of aborting install */
          return null;
        }).catch(function () {
          /* Network hiccup on one file shouldn't break the whole install */
          return null;
        }).then(function () {
          done++;
          broadcast({
            type: 'precache-progress',
            done: done,
            total: total,
            percent: Math.round((done / total) * 100)
          });
        });
      });

      return Promise.all(tasks).then(function () {
        return broadcast({ type: 'precache-done', total: total });
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Allow a page to ask "are you done caching yet?" right after registering,
   in case the install finished before the page attached its listener. */
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'check-precache') {
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.keys();
    }).then(function (keys) {
      event.source && event.source.postMessage({
        type: 'precache-status',
        cachedCount: keys.length,
        total: PRECACHE_URLS.length,
        complete: keys.length >= PRECACHE_URLS.length
      });
    });
  }
});

self.addEventListener('fetch', function (event) {
  var request = event.request;

  // For navigation requests, try network first then fall back to cache and offline page
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request).then(function (response) {
        // Put a copy in the runtime cache
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // For other requests, try cache, then network, then fail
  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        // Cache fetched files for future use
        if (!request.url.startsWith('http')) return response;
        var resClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, resClone);
        });
        return response;
      }).catch(function () { return cached; });
    })
  );
});
