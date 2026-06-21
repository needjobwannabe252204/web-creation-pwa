/* ==========================================================
   delete-app.js — Delete App page logic (delete-app.html only)
   ----------------------------------------------------------
   Two separate concerns, deliberately not conflated:
     1. UNINSTALLING the home-screen icon — this can only be
        done by the operating system. A webpage has no API for
        this, so we detect the platform from the user agent and
        show the correct manual steps for it.
     2. CLEARING DATA — this part we genuinely can do: wipe
        localStorage (profile + all lesson progress) and the
        service worker's cache, then unregister the service
        worker so a fresh visit starts completely clean.
   ========================================================== */

"use strict";

document.addEventListener('DOMContentLoaded', function () {

    /* -------------------------------------------------------
       1) Detect platform and show the right uninstall steps
       ------------------------------------------------------- */
    var titleEl = document.getElementById('uninstallStepsTitle');
    var listEl  = document.getElementById('uninstallStepsList');

    var ua = navigator.userAgent || '';
    var platform = 'generic';

    if (/iPhone|iPad|iPod/.test(ua)) {
        platform = 'ios';
    } else if (/Android/.test(ua)) {
        platform = 'android';
    } else if (/Macintosh/.test(ua)) {
        platform = 'mac';
    } else if (/Windows/.test(ua)) {
        platform = 'windows';
    }

    var STEPS = {
        ios: {
            title: '📱 How to Uninstall (iPhone / iPad)',
            steps: [
                'Press and hold the "Web Creation" icon on your Home Screen.',
                'Tap "Remove App" (or the "−" icon, depending on your iOS version).',
                'Confirm "Delete App" when prompted.'
            ]
        },
        android: {
            title: '📱 How to Uninstall (Android)',
            steps: [
                'Press and hold the "Web Creation" icon on your Home Screen or app drawer.',
                'Tap "Uninstall" (or drag it to the Uninstall option, depending on your launcher).',
                'Confirm when prompted.'
            ]
        },
        mac: {
            title: '💻 How to Uninstall (Mac / Chrome)',
            steps: [
                'Open Chrome and go to chrome://apps.',
                'Right-click the "Web Creation" icon.',
                'Choose "Remove from Chrome…" and confirm.'
            ]
        },
        windows: {
            title: '💻 How to Uninstall (Windows / Chrome or Edge)',
            steps: [
                'Open the Start Menu and find "Web Creation".',
                'Right-click it and choose "Uninstall".',
                'Confirm when prompted. (You can also do this from Settings → Apps.)'
            ]
        },
        generic: {
            title: '🖥️ How to Uninstall',
            steps: [
                'Open your browser\u2019s app/PWA list (e.g. chrome://apps in Chrome).',
                'Find "Web Creation" in the list.',
                'Choose the remove/uninstall option and confirm.'
            ]
        }
    };

    var chosen = STEPS[platform];
    if (titleEl) titleEl.textContent = chosen.title;
    if (listEl) {
        listEl.innerHTML = '';
        chosen.steps.forEach(function (stepText) {
            var li = document.createElement('li');
            li.textContent = stepText;
            listEl.appendChild(li);
        });
    }

    /* -------------------------------------------------------
       2) Clear data — wipe storage, cache, and the SW itself
       ------------------------------------------------------- */
    var clearBtn    = document.getElementById('clearDataBtn');
    var clearStatus = document.getElementById('clearDataStatus');

    function setClearStatus(msg) {
        if (!clearStatus) return;
        clearStatus.style.display = 'block';
        clearStatus.textContent = msg;
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            var confirmed = confirm(
                'This will erase your profile and ALL lesson progress on this ' +
                'device, and remove the offline files. This cannot be undone. Continue?'
            );
            if (!confirmed) return;

            setClearStatus('Clearing your data…');

            /* a) Wipe everything this app has put in localStorage */
            try {
                localStorage.removeItem('lesson1State');
                localStorage.removeItem('lesson2State');
                localStorage.removeItem('lesson3State');
                localStorage.removeItem('courseProgress');
                localStorage.removeItem('pwaInstallUnlocked');
                localStorage.removeItem('userProfile');
            } catch (e) {
                console.warn('[delete-app] localStorage clear failed:', e);
            }

            /* b) Drop every cache this app created */
            var cachesCleared = ('caches' in window)
                ? caches.keys().then(function (keys) {
                    return Promise.all(keys.map(function (key) { return caches.delete(key); }));
                })
                : Promise.resolve();

            /* c) Unregister the service worker itself so a future visit
                  starts completely fresh (re-installs from scratch). */
            var swUnregistered = ('serviceWorker' in navigator)
                ? navigator.serviceWorker.getRegistrations().then(function (regs) {
                    return Promise.all(regs.map(function (r) { return r.unregister(); }));
                })
                : Promise.resolve();

            Promise.all([cachesCleared, swUnregistered]).then(function () {
                setClearStatus('✅ Data cleared. To finish removing the app icon, follow the steps above. Reloading…');
                setTimeout(function () { window.location.href = '/index.html'; }, 1800);
            }).catch(function (err) {
                console.warn('[delete-app] clear failed:', err);
                setClearStatus('Cleared your saved progress, but ran into an issue clearing the offline cache. You can still follow the uninstall steps above.');
            });
        });
    }
});
