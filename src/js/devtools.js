/* ==========================================================
   devtools.js — Hidden developer panel (index page only)
   ----------------------------------------------------------
   PURPOSE
   While building/styling the index page you don't want to keep
   manually answering every quiz just to see what a "card lit
   green" or "card unlocked" state looks like. This panel lets
   you fake that state instantly, AND lets you see exactly what
   localStorage currently holds — which is usually the actual
   cause of "it didn't update / it's stuck" bugs during dev
   (stale courseProgress / lesson1State left over from a
   previous test run, not a real code bug).

   HOW TO OPEN IT
   Tap the header logo 5 times within 2 seconds. A panel slides
   up from the bottom. Tap the logo again (or the ✕) to hide it.
   This is intentionally undocumented in the UI — it's a dev
   tool, not a feature for end users.

   Dependencies: utils.js, script.js (for initLessonGates,
   loadCourseProgress, saveCourseProgress, markLessonComplete,
   setInstallUnlocked, showToast).
   ========================================================== */

"use strict";

(function () {

    /* ----------------------------------------------------------
       1) Logo tap-5x detector
       ---------------------------------------------------------- */
    var logo = document.getElementById('devTapLogo');
    var tapCount = 0;
    var tapTimer = null;

    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', function () {
            tapCount++;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(function () { tapCount = 0; }, 2000);

            if (tapCount >= 5) {
                tapCount = 0;
                clearTimeout(tapTimer);
                toggleDevPanel();
            }
        });
    }

    /* ----------------------------------------------------------
       2) Build the panel (once), inserted at end of <body>
       ---------------------------------------------------------- */
    var panel = null;

    function buildPanel() {
        panel = document.createElement('div');
        panel.id = 'devToolsPanel';
        panel.className = 'devtools-panel';
        panel.innerHTML =
            '<div class="devtools-header">' +
                '<span>🛠️ Dev Tools</span>' +
                '<button type="button" id="devToolsClose" class="devtools-close" aria-label="Close dev tools">✕</button>' +
            '</div>' +
            '<div class="devtools-body">' +

                '<div class="devtools-section">' +
                    '<p class="devtools-section-title">Quick state</p>' +
                    '<div class="devtools-row">' +
                        '<button type="button" id="devUnlockAll" class="devtools-btn devtools-btn-good">🔓 Unlock All Lessons</button>' +
                        '<button type="button" id="devCompleteAll" class="devtools-btn devtools-btn-good">✅ Complete All Lessons</button>' +
                    '</div>' +
                    '<div class="devtools-row">' +
                        '<button type="button" id="devModeToggle" class="devtools-btn devtools-btn-warn">🧪 Dev Mode: OFF</button>' +
                    '</div>' +
                    '<div class="devtools-row">' +
                        '<button type="button" id="devUnlockInstall" class="devtools-btn devtools-btn-good">📲 Force Install-Unlock</button>' +
                        '<button type="button" id="devLockInstall" class="devtools-btn devtools-btn-warn">📲 Re-lock Install</button>' +
                    '</div>' +
                    '<div class="devtools-row">' +
                        '<button type="button" id="devFillProfile" class="devtools-btn devtools-btn-good">👤 Fill Dummy Profile</button>' +
                        '<button type="button" id="devClearProfile" class="devtools-btn devtools-btn-warn">👤 Clear Profile</button>' +
                    '</div>' +
                '</div>' +

                '<div class="devtools-section">' +
                    '<p class="devtools-section-title">Per-lesson</p>' +
                    '<div class="devtools-row" id="devPerLesson"></div>' +
                '</div>' +

                '<div class="devtools-section">' +
                    '<p class="devtools-section-title">Reset</p>' +
                    '<div class="devtools-row">' +
                        '<button type="button" id="devResetAll" class="devtools-btn devtools-btn-danger">🗑️ Reset ALL Progress</button>' +
                        '<button type="button" id="devReloadGates" class="devtools-btn">🔄 Re-run Gate Check</button>' +
                    '</div>' +
                '</div>' +

                '<div class="devtools-section">' +
                    '<p class="devtools-section-title">localStorage (live)</p>' +
                    '<pre class="devtools-storage" id="devStorageView"></pre>' +
                    '<button type="button" id="devRefreshStorage" class="devtools-btn">🔍 Refresh View</button>' +
                '</div>' +

            '</div>';
        document.body.appendChild(panel);

        /* Per-lesson quick buttons (complete / lock individually) */
        var perLessonWrap = panel.querySelector('#devPerLesson');
        [1, 2, 3, 4].forEach(function (lessonNum) {
            var completeBtn = document.createElement('button');
            completeBtn.type = 'button';
            completeBtn.className = 'devtools-btn devtools-chip';
            completeBtn.textContent = '✅ L' + lessonNum;
            completeBtn.title = 'Mark Lesson ' + lessonNum + ' as completed';
            completeBtn.addEventListener('click', function () { devCompleteLesson(lessonNum); });

            var lockBtn = document.createElement('button');
            lockBtn.type = 'button';
            lockBtn.className = 'devtools-btn devtools-chip devtools-chip-warn';
            lockBtn.textContent = '🔒 L' + lessonNum;
            lockBtn.title = 'Reset/lock Lesson ' + lessonNum + ' only';
            lockBtn.addEventListener('click', function () { devLockLesson(lessonNum); });

            perLessonWrap.appendChild(completeBtn);
            perLessonWrap.appendChild(lockBtn);
        });

        /* Wire up the main buttons */
        panel.querySelector('#devToolsClose').addEventListener('click', hideDevPanel);
        panel.querySelector('#devUnlockAll').addEventListener('click', devUnlockAll);
        panel.querySelector('#devCompleteAll').addEventListener('click', devCompleteAll);
        panel.querySelector('#devModeToggle').addEventListener('click', devModeToggle);
        panel.querySelector('#devUnlockInstall').addEventListener('click', devForceInstallUnlock);
        panel.querySelector('#devLockInstall').addEventListener('click', devRelockInstall);
        panel.querySelector('#devFillProfile').addEventListener('click', devFillDummyProfile);
        panel.querySelector('#devClearProfile').addEventListener('click', devClearProfileAction);
        panel.querySelector('#devResetAll').addEventListener('click', devResetAll);
        panel.querySelector('#devReloadGates').addEventListener('click', function () {
            refreshEverything();
            devLog('Gate check re-run.');
        });
        panel.querySelector('#devRefreshStorage').addEventListener('click', renderStorageView);
        
        /* Update dev mode button on panel open */
        updateDevModeButton();
    }

    function toggleDevPanel() {
        if (!panel) buildPanel();
        var isOpen = panel.classList.contains('open');
        if (isOpen) {
            hideDevPanel();
        } else {
            panel.classList.add('open');
            renderStorageView();
        }
    }

    function hideDevPanel() {
        if (panel) panel.classList.remove('open');
    }

    /* ----------------------------------------------------------
       3) Actions
       ---------------------------------------------------------- */

    function devUnlockAll() {
        var cp = loadCourseProgress();
        /* Only UNLOCK lessons — don't mark as completed yet */
        cp.lessonsUnlocked[1] = true;
        cp.lessonsUnlocked[2] = true;
        cp.lessonsUnlocked[3] = true;
        cp.lessonsUnlocked[4] = true;
        /* DO NOT mark as completed — let dev test the actual lessons */
        saveCourseProgress(cp);

        /* Lesson 1's gate isn't a numbered prereq — it's "install" +
           "profile" (see data-prereq="install,profile" on index.html).
           Satisfy both so dev can freely navigate without restrictions. */
        if (typeof setInstallUnlocked === 'function') setInstallUnlocked();
        if (typeof isProfileComplete === 'function' && !isProfileComplete() && typeof saveProfile === 'function') {
            saveProfile({
                name: 'Dev Tester',
                course: 'BS Information Technology',
                section: 'ICT 11 - Test Section',
                semester: '1st Semester',
                yearLevel: '2nd Year'
            });
        }

        /* Also clear any lesson-specific localStorage keys to avoid conflicts */
        try { localStorage.removeItem('lesson1State'); } catch (e) {}
        try { localStorage.removeItem('lesson2State'); } catch (e) {}
        try { localStorage.removeItem('lesson3State'); } catch (e) {}

        refreshEverything();
        devLog('🔓 All lessons unlocked — prerequisites cleared! Use "Complete All" to mark them done.');
    }

    function devModeToggle() {
        var isEnabled = localStorage.getItem('__devModeEnabled') === 'true';
        if (isEnabled) {
            localStorage.removeItem('__devModeEnabled');
            devLog('🧪 Dev Mode: OFF — Gates are now active again.');
        } else {
            localStorage.setItem('__devModeEnabled', 'true');
            devLog('🧪 Dev Mode: ON — All lesson gates bypassed! Access any lesson freely.');
        }
        refreshEverything();
        updateDevModeButton();
    }

    function updateDevModeButton() {
        var btn = document.getElementById('devModeToggle');
        if (!btn) return;
        var isEnabled = localStorage.getItem('__devModeEnabled') === 'true';
        if (isEnabled) {
            btn.textContent = '🧪 Dev Mode: ON';
            btn.classList.remove('devtools-btn-warn');
            btn.classList.add('devtools-btn-good');
        } else {
            btn.textContent = '🧪 Dev Mode: OFF';
            btn.classList.remove('devtools-btn-good');
            btn.classList.add('devtools-btn-warn');
        }
    }

    function devCompleteAll() {
        /* Lesson 1 uses its own legacy key */
        try {
            localStorage.setItem('lesson1State', JSON.stringify({
                completedTopics: { topic1: true, topic2: true, topic3: true, quiz: true },
                quizPassed: true,
                quizAttempted: true,
                lessonCompleted: true
            }));
        } catch (e) { console.warn('[devtools] could not write lesson1State', e); }

        /* Also update central courseProgress for consistency */
        var cp = loadCourseProgress();
        cp.lessonsCompleted[1] = true;
        cp.lessonsCompleted[2] = true;
        cp.lessonsCompleted[3] = true;
        cp.lessonsCompleted[4] = true;
        saveCourseProgress(cp);

        refreshEverything();
        devLog('✅ All 4 lessons marked completed — full access granted!');
    }

    function devCompleteLesson(n) {
        if (n === 1) {
            try {
                localStorage.setItem('lesson1State', JSON.stringify({
                    completedTopics: { topic1: true, topic2: true, topic3: true, quiz: true },
                    quizPassed: true,
                    quizAttempted: true,
                    lessonCompleted: true
                }));
            } catch (e) { console.warn('[devtools] could not write lesson1State', e); }
            /* Also update courseProgress for consistency */
            var cp = loadCourseProgress();
            cp.lessonsCompleted[1] = true;
            cp.lessonsUnlocked[1]  = true;
            saveCourseProgress(cp);
        } else if (typeof markLessonComplete === 'function') {
            markLessonComplete(n);
        }
        refreshEverything();
        devLog('✅ Lesson ' + n + ' marked completed — you can now access it freely!');
    }

    function devUnlockSingleLesson(n) {
        /* Unlock + complete a single lesson so it's immediately accessible */
        var cp = loadCourseProgress();
        cp.lessonsUnlocked[n] = true;
        cp.lessonsCompleted[n] = true;
        saveCourseProgress(cp);
        refreshEverything();
        devLog('🔓 Lesson ' + n + ' unlocked — prerequisites bypassed!');
    }

    function devLockLesson(n) {
        if (n === 1) {
            localStorage.removeItem('lesson1State');
            /* Also update courseProgress for consistency */
            var cp = loadCourseProgress();
            cp.lessonsCompleted[1] = false;
            cp.lessonsUnlocked[1]  = false;
            saveCourseProgress(cp);
        } else {
            var cp = loadCourseProgress();
            cp.lessonsCompleted[n] = false;
            cp.lessonsUnlocked[n]  = false;
            saveCourseProgress(cp);
        }
        refreshEverything();
        devLog('🔒 Lesson ' + n + ' reset/locked.');
    }

    function devForceInstallUnlock() {
        if (typeof setInstallUnlocked === 'function') setInstallUnlocked();
        refreshEverything();
        devLog('Install-unlock flag forced ON. Lesson 1 should open without installing.');
    }

    function devRelockInstall() {
        try { localStorage.removeItem('pwaInstallUnlocked'); } catch (e) {}
        refreshEverything();
        devLog('Install-unlock flag cleared. Lesson 1 re-locked behind install.');
    }

    function devFillDummyProfile() {
        if (typeof saveProfile === 'function') {
            saveProfile({
                name: 'Dev Tester',
                course: 'BS Information Technology',
                section: 'ICT 11 - Test Section',
                semester: '1st Semester',
                yearLevel: '2nd Year'
            });
        }
        refreshEverything();
        devLog('Dummy profile saved. Profile prereq satisfied.');
    }

    function devClearProfileAction() {
        if (typeof clearProfile === 'function') clearProfile();
        refreshEverything();
        devLog('Profile cleared. Profile prereq re-locked.');
    }

    function devResetAll() {
        if (!confirm('Wipe ALL stored progress (every lesson + install-unlock + profile)? This cannot be undone.')) return;
        try {
            localStorage.removeItem('lesson1State');
            localStorage.removeItem('lesson2State');
            localStorage.removeItem('lesson3State');
            localStorage.removeItem('courseProgress');
            localStorage.removeItem('pwaInstallUnlocked');
            localStorage.removeItem('userProfile');
        } catch (e) { console.warn('[devtools] reset failed', e); }
        refreshEverything();
        devLog('Everything wiped — fresh first-visit state.');
    }

    /**
     * Re-run every bit of index-page state logic that normally only
     * runs once on DOMContentLoaded, so changes show up immediately
     * without a manual page reload (and without losing the dev panel).
     */
    function refreshEverything() {
        if (typeof initLessonGates === 'function') initLessonGates();
        if (typeof _refreshAllBadges === 'function') _refreshAllBadges();
        renderStorageView();
    }

    function devLog(msg) {
        if (typeof showToast === 'function') {
            showToast('[Dev] ' + msg, 'info', 2200);
        } else {
            console.log('[devtools]', msg);
        }
    }

    /* ----------------------------------------------------------
       4) Live localStorage viewer
       ----------------------------------------------------------
       Shows exactly what's stored right now. This is usually the
       fastest way to spot "it's not a bug, it's stale leftover
       state from an earlier test" — e.g. courseProgress.lessonsUnlocked
       still true from before you changed a prereq, or pwaInstallUnlocked
       sitting at true from a previous install test.
       ---------------------------------------------------------- */
    var WATCHED_KEYS = ['lesson1State', 'lesson2State', 'lesson3State', 'courseProgress', 'pwaInstallUnlocked', 'userProfile'];

    function renderStorageView() {
        var view = document.getElementById('devStorageView');
        if (!view) return;

        var lines = [];
        WATCHED_KEYS.forEach(function (key) {
            var raw = null;
            try { raw = localStorage.getItem(key); } catch (e) {}

            if (raw === null) {
                lines.push(key + ': (not set)');
                return;
            }
            try {
                var parsed = JSON.parse(raw);
                lines.push(key + ': ' + JSON.stringify(parsed, null, 2));
            } catch (e) {
                lines.push(key + ': ' + raw);
            }
        });
        view.textContent = lines.join('\n\n');
    }

})();
