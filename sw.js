/* Service Worker for Web Creation — precache with progress reporting
   - Caches the app shell file-by-file (not addAll) so we can report
     download progress back to the page that's waiting on it.
   - Serves cached responses first, falls back to network.
   - Provides an offline page for navigations when offline.
   - Bump APP_VERSION on every release; the updates page surfaces it
     and uses the standard updatefound/controllerchange events to
     detect when a newer service worker is ready to take over.
*/

var APP_VERSION = '1.1.12';
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
  // icons and logos
  '/assets/image/logo/icon-48.png',
  '/assets/image/logo/icon-72.png',
  '/assets/image/logo/icon-96.png',
  '/assets/image/logo/icon-144.png',
  '/assets/image/logo/icon-192.png',
  '/assets/image/logo/icon-512.png',
  '/assets/image/logo/app-logo.png',
  '/assets/image/logo/cdm-logo.jpeg',
  // code editor images
  '/assets/image/code-editor/notepad++.png',
  '/assets/image/code-editor/sublime.png',
  '/assets/image/code-editor/vs-code.png',
  '/assets/image/code-editor/web-code.png',
  // browser images
  '/assets/image/browser/chrome.png',
  '/assets/image/browser/edge.png',
  '/assets/image/browser/firefox.png',
  // design tools images
  '/assets/image/design-tools/adobe.png',
  '/assets/image/design-tools/canva.png',
  '/assets/image/design-tools/figma.png',
  // css example images
  '/assets/image/css-example/Facebook_mobile.png',
  '/assets/image/css-example/netflix.png',
  '/assets/image/css-example/youtube.png',
  '/assets/image/css-example/yt.jpg',
  // web example images
  '/assets/image/web-example-image/1.png',
  '/assets/image/web-example-image/2.png',
  '/assets/image/web-example-image/3.png',
  '/assets/image/web-example-image/apple.png',
  '/assets/image/web-example-image/google.png',
  '/assets/image/web-example-image/microsoft.png',
  // animal images
  '/assets/image/animal/cat.png',
  // nav pages
  '/src/html/nav-pages/about.html',
  '/src/html/nav-pages/contact.html',
  '/src/html/nav-pages/profile.html',
  '/src/html/nav-pages/updates.html',
  '/src/html/nav-pages/delete-app.html',
  // main lesson pages (cache core content for offline review)
  '/src/html/lesson-1/lesson-1.html',
  '/src/html/lesson-1/topic-1.1.html',
  '/src/html/lesson-1/topic-1.2.html',
  '/src/html/lesson-1/topic-1.3.html',
  '/src/html/lesson-1/test-1.1.html',
  '/src/html/lesson-2/lesson-2.html',
  '/src/html/lesson-2/topic-2.1.html',
  '/src/html/lesson-2/topic-2.2.html',
  '/src/html/lesson-2/topic-2.3.html',
  '/src/html/lesson-2/topic-2.4.html',
  '/src/html/lesson-2/topic-2.5.html',
  '/src/html/lesson-2/topic-2.6.html',
  '/src/html/lesson-2/topic-2.7.html',
  '/src/html/lesson-2/topic-2.8.html',
  '/src/html/lesson-2/test-2.1.html',
  '/src/html/lesson-2/test-2.2.html',
  '/src/html/lesson-2/test-2.3.html',
  '/src/html/lesson-2/test-2.4.html',
  '/src/html/lesson-2/test-2.5.html',
  '/src/html/lesson-2/test-2.6.html',
  '/src/html/lesson-2/test-2.7.html',
  '/src/html/lesson-2/test-2.8.html',
  '/src/html/lesson-3/lesson-3.html',
  '/src/html/lesson-3/topic-3.1.html',
  '/src/html/lesson-3/topic-3.2.html',
  '/src/html/lesson-3/topic-3.3.html',
  '/src/html/lesson-3/topic-3.4.html',
  '/src/html/lesson-3/topic-3.5.html',
  '/src/html/lesson-3/topic-3.6.html',
  '/src/html/lesson-3/topic-3.7.html',
  '/src/html/lesson-3/test-3.1.html',
  '/src/html/lesson-3/test-3.2.html',
  '/src/html/lesson-3/test-3.3.html',
  '/src/html/lesson-3/test-3.4.html',
  '/src/html/lesson-3/test-3.5.html',
  '/src/html/lesson-3/test-3.6.html',
  '/src/html/lesson-3/test-3.7.html',
  '/src/html/lesson-4/lesson-4.html',
  // lesson 1 videos
  '/assets/video/lesson-1/topic-1.1.mp4',
  '/assets/video/lesson-1/topic-1.4.mp4',
  // lesson 2 videos
  '/assets/video/lesson-2/topic-2.1.mp4',
  '/assets/video/lesson-2/topic-2.2.mp4',
  '/assets/video/lesson-2/topic-2.3.mp4',
  '/assets/video/lesson-2/topic-2.4.mp4',
  '/assets/video/lesson-2/topic-2.5.mp4',
  '/assets/video/lesson-2/topic-2.6.mp4',
  '/assets/video/lesson-2/topic-2.7.mp4',
  '/assets/video/lesson-2/topic-2.8.mp4'
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
      var failed = [];

      /* Cache requests one at a time (in parallel) but count each as it
         resolves, so the page can show a live X / total progress bar. */
      var cssFiles = [];
      var jsFiles = [];
      var htmlFiles = [];
      var imageFiles = [];
      var otherFiles = [];
      
      var tasks = PRECACHE_URLS.map(function (url) {
        // Categorize file for logging
        if (url.includes('.css')) cssFiles.push(url);
        else if (url.includes('.js')) jsFiles.push(url);
        else if (url.includes('.html')) htmlFiles.push(url);
        else if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif') || url.includes('.svg')) imageFiles.push(url);
        else otherFiles.push(url);
        
        /* Retry logic: try up to 3 times if fetch fails */
        function fetchWithRetry(fetchUrl, retryCount) {
          if (retryCount === undefined) retryCount = 0;
          
          return fetch(fetchUrl).then(function (response) {
            if (response && response.ok && response.status === 200) {
              if (retryCount > 0) {
                console.log('[SW] ✅ Cached (attempt ' + (retryCount + 1) + '): ' + fetchUrl);
              } else {
                console.log('[SW] ✅ Cached: ' + fetchUrl + ' (status: ' + response.status + ')');
              }
              return cache.put(fetchUrl, response);
            }
            /* Non-fatal: skip files that 404 or return partial content (206) */
            console.warn('[SW] ⚠️ Skipped: ' + fetchUrl + ' (status ' + (response ? response.status : 'unknown') + ')');
            failed.push(fetchUrl);
            return null;
          }).catch(function (err) {
            /* Retry up to 3 times on network error */
            if (retryCount < 3) {
              var delay = 200 + (retryCount * 300); // 200ms, 500ms, 800ms
              console.warn('[SW] ⚠️ Retry ' + (retryCount + 1) + '/3 for ' + fetchUrl + ' (waiting ' + delay + 'ms)...');
              return new Promise(function(resolve) { setTimeout(resolve, delay); })
                .then(function() { return fetchWithRetry(fetchUrl, retryCount + 1); });
            }
            console.error('[SW] ❌ Fetch error for ' + fetchUrl + ' (after 3 retries): ' + err.message);
            failed.push(fetchUrl);
            return null;
          });
        }
        
        return fetchWithRetry(url).then(function () {
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
        if (failed.length > 0) {
          var failedCss = failed.filter(function(f) { return f.includes('.css'); });
          var failedJs = failed.filter(function(f) { return f.includes('.js'); });
          var failedHtml = failed.filter(function(f) { return f.includes('.html'); });
          console.warn('[SW] PRECACHE SUMMARY:');
          console.warn('[SW]   - Total failed: ' + failed.length);
          if (failedCss.length > 0) console.warn('[SW]   - CSS failed (' + failedCss.length + '): ' + failedCss.join(', '));
          if (failedJs.length > 0) console.warn('[SW]   - JS failed (' + failedJs.length + '): ' + failedJs.join(', '));
          if (failedHtml.length > 0) console.warn('[SW]   - HTML failed (' + failedHtml.length + '): ' + failedHtml.join(', '));
        } else {
          console.log('[SW] ✅ PRECACHE SUCCESS: All ' + total + ' files cached!');
        }
        return broadcast({ type: 'precache-done', total: total, failed: failed.length });
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

  // For navigation requests (HTML pages): TRY CACHE FIRST, then network
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      // Try cache first (for offline support)
      caches.match(request).then(function (cached) {
        if (cached) {
          console.log('[SW] HTML from cache: ' + request.url);
          return cached;
        }
        
        // If not in cache, try network
        return fetch(request).then(function (response) {
          // Put a copy in the runtime cache (only cache full 200 responses, not partial 206)
          if (response && response.ok && response.status === 200) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
          }
          return response;
        }).catch(function (err) {
          console.error('[SW] HTML fetch failed: ' + request.url + ' - ' + err.message);
          // If both cache and network fail, serve offline page
          return caches.match('/offline.html');
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
      }).catch(function (err) {
        console.warn('[SW] Network fetch failed for ' + request.url + ': ' + err.message);
        return null;
      });

      // Cached copy wins the race for speed; network result silently
      // updates the cache for the next time this file is requested.
      if (cached) {
        networkFetch.catch(function () {}); // don't let rejection bubble
        return cached;
      }
      
      // If not cached and network fails, try to serve from cache anyway
      // as a final fallback for offline support (even if stale)
      return networkFetch.then(function (response) {
        if (response) return response;
        // Last resort: return cached even if we tried fresh network
        return caches.match(request).then(function (fallbackCached) {
          return fallbackCached || Response.error();
        });
      });
    })
  );
});
