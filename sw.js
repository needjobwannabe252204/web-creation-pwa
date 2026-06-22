/* Service Worker for Web Creation — precache with progress reporting
   - Caches the app shell file-by-file (not addAll) so we can report
     download progress back to the page that's waiting on it.
   - Serves cached responses first, falls back to network.
   - Provides an offline page for navigations when offline.
   - Bump APP_VERSION on every release; the updates page surfaces it
     and uses the standard updatefound/controllerchange events to
     detect when a newer service worker is ready to take over.
*/

var APP_VERSION = '1.1.2';
var CACHE_NAME = 'webcreation-v' + APP_VERSION;
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/src/css/style.css',
  '/src/js/utils.js',
  '/src/js/script.js',
  '/src/js/devtools.js',
  '/src/js/profile.js',
  '/src/js/updates.js',
  '/src/js/delete-app.js',
  '/src/js/lesson-1.js',
  '/src/js/lesson-2.js',
  '/src/js/lesson-3.js',
  '/src/js/lesson-4.js',
  // icons
  '/assets/image/logo/icon-48.png',
  '/assets/image/logo/icon-72.png',
  '/assets/image/logo/icon-96.png',
  '/assets/image/logo/icon-144.png',
  '/assets/image/logo/icon-192.png',
  '/assets/image/logo/icon-512.png',
  '/assets/image/logo/app-logo.png',
  '/assets/image/logo/cdm-logo.jpeg',
  // nav pages
  '/src/html/nav-pages/about.html',
  '/src/html/nav-pages/contact.html',
  '/src/html/nav-pages/profile.html',
  '/src/html/nav-pages/updates.html',
  '/src/html/nav-pages/delete-app.html',
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
          if (response && response.ok && response.status === 200) {
            return cache.put(url, response);
          }
          /* Non-fatal: skip files that 404 or return partial content (206) */
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
    }).then(function () {
      /* First-ever install (nobody currently controls any open tab):
         activate right away so the brand-new install/profile/unlock
         flow isn't stuck waiting on anything.
         A later UPDATE (this device already has an older SW running
         this app) intentionally does NOT auto-skip — that's what lets
         the Updates page show a real "update available" prompt instead
         of swapping the app under the user mid-session. The user (or
         the updates page's "Update now" button) triggers skipWaiting
         explicitly via the 'skip-waiting' message handled below. */
      return self.clients.matchAll({ type: 'window' }).then(function () {
        if (!self.registration.active) {
          /* No previous SW was active for this scope yet — genuine first install. */
          return self.skipWaiting();
        }
        /* An older SW is/was active: this is an update. Leave it
           waiting; broadcast so any open page can offer to update. */
        return broadcast({ type: 'update-ready', version: APP_VERSION });
      });
    })
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

  if (event.data && event.data.type === 'get-version') {
    event.source && event.source.postMessage({
      type: 'version-info',
      version: APP_VERSION
    });
  }

  /* Lets the "Update now" button on the updates page skip waiting
     immediately instead of waiting for all tabs to close. */
  if (event.data && event.data.type === 'skip-waiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (event) {
  var request = event.request;

  // For navigation requests, try network first then fall back to cache and offline page
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request).then(function (response) {
        // Put a copy in the runtime cache (only cache full 200 responses, not partial 206)
        if (response && response.ok && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // For other requests (CSS, JS, images): stale-while-revalidate.
  // Serve the cached copy immediately for speed/offline use, but also
  // kick off a network fetch in the background to refresh the cache.
  // This means a CSS/JS change shows up after one extra reload instead
  // of staying stuck until someone remembers to bump APP_VERSION.
  event.respondWith(
    caches.match(request).then(function (cached) {
      var networkFetch = fetch(request).then(function (response) {
        if (response && response.ok && response.status === 200 && request.url.startsWith('http')) {
          var resClone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, resClone);
          });
        }
        return response;
      }).catch(function () { return null; });

      // Cached copy wins the race for speed; network result silently
      // updates the cache for the next time this file is requested.
      if (cached) {
        networkFetch.catch(function () {}); // don't let rejection bubble
        return cached;
      }
      return networkFetch.then(function (response) { return response || Response.error(); });
    })
  );
});
