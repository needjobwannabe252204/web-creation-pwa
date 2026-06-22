/* ==========================================================
   updates.js — Updates page logic (updates.html only)
   ----------------------------------------------------------
   Real update detection works like this:
     1. navigator.serviceWorker.getRegistration() gives us the
        registration for this scope.
     2. registration.update() forces the browser to re-fetch sw.js
        and compare it byte-for-byte against the currently active
        worker. If it's different, the browser starts installing
        it as registration.installing, then it becomes
        registration.waiting once installed (because our sw.js
        deliberately does NOT call skipWaiting() on updates — see
        sw.js install handler).
     3. While something sits in registration.waiting, that means
        "a newer version finished downloading and is ready — the
        user just hasn't refreshed yet." That's the real "update
        available" signal.
     4. Clicking "Update Now" posts {type:'skip-waiting'} to the
        waiting worker, which calls self.skipWaiting(), and once
        controllerchange fires we reload the page to pick it up.
   ========================================================== */

"use strict";

console.log('[updates.js] Loading updates.js');

document.addEventListener('DOMContentLoaded', function () {
    console.log('[updates.js] DOMContentLoaded event fired');

    var versionLabel  = document.getElementById('updateCurrentVersion');
    var statusText    = document.getElementById('updateStatusText');
    var checkBtn      = document.getElementById('checkUpdateBtn');
    var applyBtn      = document.getElementById('applyUpdateBtn');

    if (!('serviceWorker' in navigator)) {
        if (statusText) statusText.textContent = 'Service workers aren\u2019t supported in this browser, so update checks aren\u2019t available.';
        if (checkBtn) checkBtn.style.display = 'none';
        return;
    }

    var reg = null;

    function setStatus(msg) {
        if (statusText) statusText.textContent = msg;
    }

    /* -------- Ask the active worker which version it is -------- */
    function reportCurrentVersion() {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'get-version' });
        } else if (versionLabel) {
            versionLabel.textContent = 'No installed copy detected yet — install the app from the homepage first.';
        }
    }

    navigator.serviceWorker.addEventListener('message', function (event) {
        var data = event.data || {};
        if (data.type === 'version-info' && versionLabel) {
            versionLabel.textContent = 'Installed version: ' + data.version;
        }
        if (data.type === 'update-ready') {
            showUpdateAvailable();
        }
    });

    function showUpdateAvailable() {
        setStatus('A new version is ready to install.');
        if (applyBtn) applyBtn.style.display = 'inline-flex';
        if (checkBtn) checkBtn.style.display = 'none';
    }

    function showUpToDate() {
        setStatus('You\u2019re on the latest version. ✅');
        if (applyBtn) applyBtn.style.display = 'none';
        if (checkBtn) checkBtn.style.display = 'inline-flex';
    }

    /* -------- Real check: ask the browser to re-fetch sw.js -------- */
    function checkForUpdate() {
        if (!reg) {
            setStatus('No service worker registration found yet.');
            return;
        }
        setStatus('Checking for updates…');

        reg.update().then(function () {
            /* If something is now sitting in .waiting, a newer SW
               finished installing and is ready to take over. */
            if (reg.waiting) {
                showUpdateAvailable();
            } else {
                showUpToDate();
            }
        }).catch(function (err) {
            console.warn('[updates] update() failed:', err);
            setStatus('Couldn\u2019t check for updates right now (are you offline?).');
        });
    }

    /* -------- Apply: tell the waiting worker to take over -------- */
    function applyUpdate() {
        if (!reg || !reg.waiting) {
            setStatus('Nothing to update yet.');
            return;
        }
        setStatus('Updating…');
        reg.waiting.postMessage({ type: 'skip-waiting' });
    }

    /* Once the new worker actually takes control, reload once so the
       page picks up the new cached files. The `refreshing` guard stops
       this from looping if controllerchange fires more than once. */
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });

    if (checkBtn) checkBtn.addEventListener('click', checkForUpdate);
    if (applyBtn) applyBtn.addEventListener('click', applyUpdate);

    navigator.serviceWorker.getRegistration().then(function (registration) {
        reg = registration;
        if (!reg) {
            setStatus('No installed copy detected yet — install the app from the homepage first.');
            if (checkBtn) checkBtn.style.display = 'none';
            return;
        }

        reportCurrentVersion();

        /* A worker might already be sitting in .waiting from before
           this page even loaded (e.g. it updated while this tab was
           closed). Surface that immediately. */
        if (reg.waiting) {
            showUpdateAvailable();
        } else {
            setStatus('Tap "Check for Updates" to look for a newer version.');
        }

        /* Watch for a fresh install starting up while this page is open. */
        reg.addEventListener('updatefound', function () {
            var newWorker = reg.installing;
            if (!newWorker) return;
            setStatus('Downloading update…');
            newWorker.addEventListener('statechange', function () {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateAvailable();
                }
            });
        });
    });
});
