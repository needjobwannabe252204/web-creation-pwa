/* ==========================================================
   script.js — Global UI behaviours for Web Creation PWA
   ----------------------------------------------------------
   Responsibilities:
     1. Sidebar (hamburger menu) open / close
     2. Global button[data-href] navigation
     3. Index-page lesson card gating (lock / unlock)
     4. Index-page lesson completion badges
     5. Reset buttons — cascade-clears downstream lessons too

   Dependencies:
     utils.js  — must be loaded BEFORE this file
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   0) Dependency guard
   ---------------------------------------------------------- */
if (typeof window.WCUtils === 'undefined') {
    console.error('[script.js] utils.js must be loaded before script.js');
}

/* ----------------------------------------------------------
   1) Sidebar — open / close
   ---------------------------------------------------------- */

var menuBtn = document.getElementById('menuBtn');
var closeBtn = document.getElementById('closeBtn');
var sidebar  = document.getElementById('sidebar');
var overlay  = document.getElementById('overlay');

if (!menuBtn || !sidebar || !overlay) {
    console.warn('[script.js] Sidebar elements not found — menu setup skipped.');
}

function openMenu() {
    if (!sidebar || !overlay) return;
    sidebar.classList.add('open');
    overlay.classList.add('show');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
}

function closeMenu() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
}

if (menuBtn) {
    menuBtn.setAttribute('aria-controls', 'sidebar');
    menuBtn.setAttribute('aria-expanded',
        (sidebar && sidebar.classList.contains('open')) ? 'true' : 'false'
    );
    menuBtn.addEventListener('click', function () {
        if (sidebar && sidebar.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}

if (closeBtn) closeBtn.addEventListener('click', closeMenu);
if (overlay)  overlay.addEventListener('click', closeMenu);

window.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') &&
        sidebar && sidebar.classList.contains('open')) {
        closeMenu();
    }
});


/* ----------------------------------------------------------
   2) Global data-href navigation
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('button[data-href]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            if (btn.classList.contains('locked') || btn.classList.contains('can-unlock')) {
                e.preventDefault();
                return;
            }
            var target = btn.dataset.href || btn.getAttribute('data-href');
            if (target) window.location.href = target;
        });
    });

    /* -------------------------------------------------------
       3) Index-page: completion badges for all lessons
       ------------------------------------------------------- */
    _refreshAllBadges();

    /* -------------------------------------------------------
       4) Reset buttons
       ------------------------------------------------------- */
    var r1 = document.getElementById('reset-lesson1-btn');
    if (r1) _initResetLesson1Button(r1);

    var r2 = document.getElementById('reset-lesson2-btn');
    if (r2) _initResetLesson2Button(r2);

    var r3 = document.getElementById('reset-lesson3-btn');
    if (r3) _initResetLesson3Button(r3);

    /* -------------------------------------------------------
       5) Index-page: lesson gate initialisation
       ------------------------------------------------------- */
    initLessonGates();

    /* -------------------------------------------------------
       6) Returning from the profile page right after install —
          scroll Lesson 1 into view so the unlock state (and the
          tap-to-unlock animation) is the first thing they see.
       ------------------------------------------------------- */
    if (/unlocked=1/.test(window.location.search)) {
        var lesson1Card = document.getElementById('index-lesson1-card');
        if (lesson1Card) {
            setTimeout(function () {
                lesson1Card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }

}); // end DOMContentLoaded


/* ----------------------------------------------------------
   3) Badge refresh — reads both legacy lesson1State AND
      courseProgress so every card shows its true state.
   ---------------------------------------------------------- */

function _refreshAllBadges() {
    _refreshLessonBadge(1);
    _refreshLessonBadge(2);
    _refreshLessonBadge(3);
    _refreshLessonBadge(4);
}

/**
 * Update a lesson card on the index page to show green + "Completed"
 * if that lesson is recorded as done in storage.
 */
function _refreshLessonBadge(n) {
    try {
        var done = false;

        if (n === 1) {
            /* Lesson 1 uses its own legacy key */
            var raw = localStorage.getItem('lesson1State');
            var s   = raw ? JSON.parse(raw) : null;
            done = !!(s && s.lessonCompleted);
        } else {
            var cp = loadCourseProgress();
            done = !!(cp.lessonsCompleted && cp.lessonsCompleted[n]);
        }

        var cardId  = 'index-lesson' + n + '-card';
        var card    = document.getElementById(cardId);
        var btnId   = 'index-lesson' + n + '-btn';
        var btn     = document.getElementById(btnId);
        var resetId = 'reset-lesson' + n + '-btn';
        var resetEl = document.getElementById(resetId);

        if (!done) {
            /* Not completed (or just got reset) — make sure no leftover
               "completed" styling lingers from a previous state. This
               matters most during dev/testing: editing localStorage by
               hand or via the dev panel used to leave the green border
               and "Completed" label stuck on screen even after the
               underlying data said otherwise. */
            if (card && !card.classList.contains('locked')) card.style.borderLeft = '';
            if (resetEl) resetEl.style.display = 'none';
            return;
        }

        /* Green border on the card */
        if (card) card.style.borderLeft = '6px solid #4caf50';

        /* Update the button label */
        if (btn) {
            btn.textContent = '✅ Completed — Review';
            btn.disabled    = false;
        }

        /* Show the reset button */
        if (resetEl) resetEl.style.display = 'inline-flex';

    } catch (e) {
        console.warn('[script.js] _refreshLessonBadge(' + n + ') failed:', e);
    }
}

/* Keep legacy name so nothing breaks */
function _refreshLesson1Badge() { _refreshLessonBadge(1); }


/* ----------------------------------------------------------
   4) Reset helpers
   ----------------------------------------------------------
   KEY RULE: resetting lesson N must also wipe lessons N+1,
   N+2 … so their topics don't appear done when the lesson
   itself is locked. Each helper calls the ones below it.
   ---------------------------------------------------------- */

/**
 * Wipe ALL progress for lesson 3 and below (does NOT touch 1 or 2).
 * Called by reset-2 and reset-3 handlers.
 */
function _clearLesson3Data() {
    localStorage.removeItem('lesson3State');
    var cp = loadCourseProgress();
    cp.lessonsCompleted[3] = false;
    cp.lessonsUnlocked[3]  = false;
    cp.lessonsCompleted[4] = false;
    cp.lessonsUnlocked[4]  = false;
    saveCourseProgress(cp);
}

/**
 * Wipe ALL progress for lesson 2 and below.
 * Also cascades into lesson 3 (calls _clearLesson3Data).
 */
function _clearLesson2Data() {
    localStorage.removeItem('lesson2State');
    var cp = loadCourseProgress();
    cp.lessonsCompleted[2] = false;
    cp.lessonsUnlocked[2]  = false;
    saveCourseProgress(cp);
    _clearLesson3Data(); /* cascade */
}

/**
 * Wipe ALL progress — lesson 1, 2, 3, 4, and courseProgress.
 */
function _clearLesson1Data() {
    localStorage.removeItem('lesson1State');
    localStorage.removeItem('lesson2State');
    localStorage.removeItem('lesson3State');
    localStorage.removeItem('courseProgress');
}

/* -- Button initialisers -- */

function _initResetLesson1Button(resetBtn) {
    try {
        var raw = localStorage.getItem('lesson1State');
        var s   = raw ? JSON.parse(raw) : null;
        resetBtn.style.display = (s && s.lessonCompleted) ? 'inline-flex' : 'none';
    } catch (_) {
        resetBtn.style.display = 'none';
    }

    resetBtn.addEventListener('click', function () {
        if (!confirm('Clear ALL progress? Lessons 1, 2, and 3 will be reset.')) return;
        _clearLesson1Data();
        location.reload();
    });
}

function _initResetLesson2Button(resetBtn) {
    try {
        var cp   = loadCourseProgress();
        var show = !!(cp.lessonsCompleted && cp.lessonsCompleted[2]);
        resetBtn.style.display = show ? 'inline-flex' : 'none';
    } catch (_) {
        resetBtn.style.display = 'none';
    }

    resetBtn.addEventListener('click', function () {
        if (!confirm('Clear Lesson 2 progress? Lesson 3 will also be reset.')) return;
        _clearLesson2Data();
        location.reload();
    });
}

function _initResetLesson3Button(resetBtn) {
    try {
        var cp   = loadCourseProgress();
        var show = !!(cp.lessonsCompleted && cp.lessonsCompleted[3]);
        resetBtn.style.display = show ? 'inline-flex' : 'none';
    } catch (_) {
        resetBtn.style.display = 'none';
    }

    resetBtn.addEventListener('click', function () {
        if (!confirm('Clear Lesson 3 progress? This will lock Lesson 4 again.')) return;
        _clearLesson3Data();
        location.reload();
    });
}


/* ----------------------------------------------------------
   5) Lesson gate system
   ---------------------------------------------------------- */

/**
 * Parse a data-prereq string into an array of requirements.
 * Numeric entries (e.g. "1", "1,2") mean "lesson N must be completed".
 * Special tokens:
 *   "install" — this device must have installed the PWA and finished
 *               its offline download. See isInstallUnlocked().
 *   "profile" — the user must have filled out and saved their profile
 *               (name, course, section, semester, year level).
 *               See isProfileComplete().
 */
function _parsePrereqString(str) {
    if (!str) return [];
    var SPECIAL = { install: 'install', profile: 'profile' };
    return String(str).split(',')
        .map(function (s) { return s.trim(); })
        .filter(Boolean)
        .map(function (s) {
            var lower = s.toLowerCase();
            return SPECIAL[lower] ? SPECIAL[lower] : Number(s);
        })
        .filter(function (v) {
            return v === 'install' || v === 'profile' ||
                (typeof v === 'number' && !isNaN(v) && v !== 0);
        });
}

/**
 * Check whether every entry in a parsed prereq array is satisfied.
 * Mixes numeric lesson-completion checks with the special tokens.
 */
function _prereqsSatisfied(prereqArr) {
    if (!prereqArr || !prereqArr.length) return true;
    return prereqArr.every(function (p) {
        if (p === 'install') return isInstallUnlocked();
        if (p === 'profile') return isProfileComplete();
        return arePrereqsMet([p]);
    });
}

/**
 * Human-readable description of what's still missing, for tooltips
 * and confirm() dialogs.
 */
function _prereqLabel(p) {
    if (p === 'install') return 'installing the app';
    if (p === 'profile') return 'completing your profile';
    return 'Lesson ' + p;
}

function initLessonGates() {
    var cp = loadCourseProgress();

    document.querySelectorAll('button[data-lesson]').forEach(function (btn) {
        var prereqStr = btn.getAttribute('data-prereq') || '';
        var prereqArr = _parsePrereqString(prereqStr);
        var href      = btn.getAttribute('data-href');
        var lessonNum = Number(btn.getAttribute('data-lesson')) || 0;
        var card      = btn.closest('.card');

        if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent.trim();

        var prereqsMet = _prereqsSatisfied(prereqArr);
        var isUnlocked = !!(cp.lessonsUnlocked && cp.lessonsUnlocked[lessonNum]);
        var isComplete = _isLessonDone(lessonNum);

        if (isComplete) {
            /* Already completed — show green, skip gate logic */
            if (card) setCardBorder(card, '#4caf50');
            btn.textContent = '✅ Completed — Review';
            btn.disabled    = false;
            btn.classList.remove('locked', 'can-unlock');
            var lb = card ? card.querySelector('.lock-badge') : null;
            if (lb) lb.remove();

        } else if (prereqArr.length && !prereqsMet && !isUnlocked) {
            _applyLockedState(btn, card, prereqStr, prereqArr);

        } else if (isUnlocked) {
            _applyUnlockedState(btn, card);

        } else if (prereqArr.length && prereqsMet) {
            /* Prereqs met — show the "can-unlock" state so the user
               clicks to perform the unlock animation (consistent UX). */
            _applyCanUnlockState(btn, card);

        } else {
            _applyOpenState(btn, card);
        }

        btn.addEventListener('click', function (ev) {
            _handleGateClick(ev, btn, card, prereqArr, prereqStr, lessonNum, href);
        });
    });
}

/**
 * Check if a lesson is marked completed, handling the lesson-1
 * legacy separate key as well as the central courseProgress store.
 */
function _isLessonDone(n) {
    try {
        if (n === 1) {
            var raw = localStorage.getItem('lesson1State');
            var s   = raw ? JSON.parse(raw) : null;
            return !!(s && s.lessonCompleted);
        }
        var cp = loadCourseProgress();
        return !!(cp.lessonsCompleted && cp.lessonsCompleted[n]);
    } catch (e) {
        return false;
    }
}

/* -- State applicators -- */

function _applyLockedState(btn, card, prereqStr, prereqArr) {
    btn.classList.add('locked');
    btn.textContent = '🔒 Locked';
    var labels = (prereqArr || []).map(_prereqLabel);
    btn.title = labels.length
        ? ('Requires: ' + labels.join(' + '))
        : ('Complete lesson(s) ' + prereqStr + ' first');
    if (card) {
        card.classList.add('locked');
        _ensureLockBadge(card, '🔒 Locked');
    }
}

function _applyCanUnlockState(btn, card) {
    btn.classList.remove('locked');
    btn.classList.add('can-unlock');
    btn.textContent = '🔓 Unlock';
    btn.title = 'Click to unlock this lesson';
    if (card) {
        card.classList.add('locked', 'can-unlock');
        _ensureLockBadge(card, '🔓 Unlock');
    }
}

function _applyUnlockedState(btn, card) {
    btn.classList.remove('locked', 'can-unlock');
    btn.title = '';
    if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
    if (card) {
        card.classList.remove('locked', 'can-unlock');
        var lb = card.querySelector('.lock-badge');
        if (lb) lb.remove();
    }
}

function _applyOpenState(btn, card) {
    btn.classList.remove('locked', 'can-unlock');
    btn.title = '';
    if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
    if (card) {
        card.classList.remove('locked');
        var lb = card.querySelector('.lock-badge');
        if (lb) lb.remove();
    }
}

function _ensureLockBadge(card, html) {
    var existing = card.querySelector('.lock-badge');
    if (existing) { existing.innerHTML = html; return; }
    var span = document.createElement('span');
    span.className = 'lock-badge';
    span.innerHTML = html;
    card.appendChild(span);
}

/* -- Click handler for gated buttons -- */

function _handleGateClick(ev, btn, card, prereqArr, prereqStr, lessonNum, href) {
    /* DEV MODE: If dev mode is enabled, always allow access */
    if (localStorage.getItem('__devModeEnabled') === 'true') {
        if (href) window.location.href = href;
        return;
    }

    if (!prereqArr.length) {
        if (href) window.location.href = href;
        return;
    }

    if (btn.classList.contains('can-unlock')) {
        ev.preventDefault();
        _performUnlock(btn, card, lessonNum, href);
        return;
    }

    var cp         = loadCourseProgress();
    var nowUnlocked = !!(cp.lessonsUnlocked && cp.lessonsUnlocked[lessonNum]);

    if (_prereqsSatisfied(prereqArr) && nowUnlocked) {
        if (href) window.location.href = href;
        return;
    }

    /* Completed lessons are always navigable for review */
    if (_isLessonDone(lessonNum)) {
        if (href) window.location.href = href;
        return;
    }

    ev.preventDefault();

    var missing = prereqArr.find(function (p) {
        if (p === 'install') return !isInstallUnlocked();
        if (p === 'profile') return !isProfileComplete();
        return !arePrereqsMet([p]);
    });

    if (missing === 'install') {
        showToast('Tap "Install →" above first to get your own offline copy.', 'info');
        var welcomeCard = document.querySelector('#installBtn');
        if (welcomeCard) welcomeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (missing === 'profile') {
        if (confirm('Please complete your profile first. Go there now?')) {
            window.location.href = 'src/html/nav-pages/profile.html?from=lesson1';
        }
        return;
    }

    if (missing) {
        if (confirm(
            'You must complete Lesson ' + missing +
            ' before this one. Go there now?'
        )) {
            window.location.href = 'src/html/lesson-' + missing +
                '/lesson-' + missing + '.html';
        }
    } else {
        showToast('Complete the prerequisites first.', 'info');
    }
}

function _performUnlock(btn, card, lessonNum, href) {
    if (!card) {
        _saveUnlock(lessonNum);
        btn.classList.remove('can-unlock');
        if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
        if (href) window.location.href = href;
        return;
    }

    var lb = card.querySelector('.lock-badge');
    if (lb) lb.innerHTML = '🔓 Unlocking…';

    card.classList.remove('can-unlock');
    card.classList.add('unlock-animate');

    card.addEventListener('animationend', function handler() {
        card.removeEventListener('animationend', handler);
        card.classList.remove('unlock-animate', 'locked');
        var lb2 = card.querySelector('.lock-badge');
        if (lb2) lb2.remove();
        btn.classList.remove('can-unlock');
        _saveUnlock(lessonNum);
        if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
        
        /* After animation completes, navigate to the lesson */
        if (href) {
            setTimeout(function() {
                window.location.href = href;
            }, 300);
        }
    });
}

function _saveUnlock(lessonNum) {
    var cp = loadCourseProgress();
    cp.lessonsUnlocked[lessonNum] = true;
    saveCourseProgress(cp);
}


/* ----------------------------------------------------------
   6) Legacy global: doneLesson()
   ---------------------------------------------------------- */
function doneLesson() {
    showToast('Marked as read. Good job! 🎉', 'success');
}
window.doneLesson = doneLesson;

/* ----------------------------------------------------------
   PWA: Service Worker registration, install prompt, download
   progress bar, and the Lesson-1 "install" unlock condition.
   ----------------------------------------------------------
   How the unlock works:
     1. Register /sw.js. While it precaches the app shell, it
        posts progress messages back here, which drive the
        progress bar under the Install button.
     2. The "Install →" button triggers the native install
        prompt (beforeinstallprompt). Accepting it doesn't by
        itself unlock anything — the user could still be
        looking at the regular browser tab.
     3. The actual unlock condition is: this tab/window is
        running in standalone display mode (i.e. opened from
        the installed app icon, not a browser tab) AND the
        service worker has finished caching the app shell.
        That combination is the real signal that "this device
        now has its own offline copy" — which is what should
        unlock Lesson 1, not merely a one-time prompt click.
     4. Once both are true, isInstallUnlocked() is persisted to
        localStorage permanently and the lesson gates are
        re-evaluated so Lesson 1 unlocks immediately.
   ---------------------------------------------------------- */
(function () {
    var deferredPrompt   = null;
    var precacheComplete = false;
    var swReg            = null;

    var installBtn      = document.getElementById('installBtn');
    var progressWrap     = document.getElementById('installProgressWrap');
    var progressFill      = document.getElementById('installProgressFill');
    var progressPercent   = document.getElementById('installProgressPercent');
    var statusText        = document.getElementById('installStatusText');

    function setStatus(msg) {
        if (!statusText) return;
        statusText.textContent = msg;
        statusText.style.display = msg ? 'block' : 'none';
    }

    function setProgress(percent) {
        if (progressWrap) progressWrap.classList.add('show');
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressPercent) progressPercent.textContent = percent + '%';
    }

    /**
     * Re-check whether the install half of the unlock condition is
     * fully met, and if so, persist it. Lesson 1 itself needs BOTH
     * install AND profile (see data-prereq="install,profile" on the
     * index page) — so finishing install alone doesn't unlock the
     * lesson by itself anymore; it sends the user to fill out their
     * profile first, and the unlock + animation happens back on the
     * homepage once that's saved too.
     * Safe to call repeatedly — it's a no-op once already unlocked.
     */
    function tryFinalizeInstallUnlock() {
        if (isInstallUnlocked()) {
            /* Already installed on this device previously. 
               If they're on the website (not standalone), show status. */
            if (!isRunningStandalone()) {
                setStatus('✅ You have an installed copy on this device. Open it from your home screen, or click the button above to reset.');
                if (installBtn) {
                    installBtn.style.display = 'inline-flex';
                } else {
                    var btn = document.getElementById('installBtn');
                    if (btn) btn.style.display = 'inline-flex';
                }
            }
            return;
        }

        if (isRunningStandalone() && precacheComplete) {
            setInstallUnlocked();
            if (progressWrap) progressWrap.classList.remove('show');
            if (installBtn) installBtn.style.display = 'none';

            if (typeof isProfileComplete === 'function' && isProfileComplete()) {
                /* Returning device / profile already on file (e.g. a
                   reinstall) — nothing left to ask, unlock right away. */
                setStatus('✅ Your offline copy is ready — Lesson 1 is unlocked!');
                showToast('Your copy is installed — Lesson 1 unlocked! 🎉', 'success');
                if (typeof initLessonGates === 'function') initLessonGates();
            } else {
                setStatus('✅ Download complete! One quick step left — tell us about yourself.');
                showToast('Installed! Let\u2019s set up your profile next. 📝', 'success', 2200);
                setTimeout(function () {
                    window.location.href = 'src/html/nav-pages/profile.html?from=lesson1';
                }, 1400);
            }
        } else if (precacheComplete && !isRunningStandalone()) {
            /* Cached, but they're still in the browser tab, not the
               installed app. Tell them what's left to do AND show button. */
            setStatus('Download complete. Open the app from your home screen to finish.');
            /* Always show the button as fallback for manual install or if
               beforeinstallprompt didn't fire for some reason */
            if (installBtn) {
                installBtn.style.display = 'inline-flex';
            } else {
                /* Defensive: if button wasn't found, try finding it again */
                var btn = document.getElementById('installBtn');
                if (btn) btn.style.display = 'inline-flex';
            }
        }
    }

    /* -------- Service worker registration + progress wiring -------- */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function (event) {
            var data = event.data || {};

            if (data.type === 'precache-progress') {
                setProgress(data.percent);
                setStatus('Downloading your copy… (' + data.done + '/' + data.total + ')');
            }

            if (data.type === 'precache-done' || (data.type === 'precache-status' && data.complete)) {
                precacheComplete = true;
                setProgress(100);
                tryFinalizeInstallUnlock();
            }
        });

        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').then(function (reg) {
                swReg = reg;
                console.log('[SW] Registered:', reg.scope);

                /* If the SW was already active from a previous visit,
                   ask it directly whether the cache is already complete
                   instead of waiting for a fresh install event. */
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'check-precache' });
                }
            }).catch(function (err) {
                console.warn('[SW] Registration failed:', err);
            });
        });
    } else {
        setStatus('Offline install isn\u2019t supported in this browser.');
    }

    /* -------- Native install prompt -------- */
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'inline-flex';
    });

    if (installBtn) {
        installBtn.addEventListener('click', function () {
            if (!deferredPrompt) {
                /* Browser hasn't offered the native prompt (e.g. iOS
                   Safari, or already installed). Just surface status. */
                if (isRunningStandalone()) {
                    setStatus('Already running as an installed app.');
                } else if (localStorage.getItem('pwaInstallUnlocked') === 'true') {
                    /* On the website, but install was already done on this device.
                       Show reset option. */
                    if (confirm('Your app is already installed on this device.\n\nWould you like to reset the install state? This lets you reinstall if needed.')) {
                        localStorage.removeItem('pwaInstallUnlocked');
                        setStatus('Install state reset. Reload the page to reinstall.');
                        showToast('Install state cleared. Reload the page to continue.', 'info');
                        setTimeout(function() { window.location.reload(); }, 1500);
                    }
                } else {
                    showToast('Use your browser\u2019s "Add to Home Screen" option to install.', 'info');
                }
                return;
            }
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function (choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    showToast('Installing… open it from your home screen next. 📲', 'success');
                    setStatus('Installing your offline copy…');
                    if (progressWrap) progressWrap.classList.add('show');
                } else {
                    showToast('Installation dismissed', 'info');
                }
                deferredPrompt = null;
                var btn = document.getElementById('installBtn');
                if (btn) btn.style.display = 'none';
                if (installBtn) installBtn.style.display = 'none';
            });
        });
    }

    window.addEventListener('appinstalled', function () {
        showToast('App installed — open it from your home screen 📲', 'success');
    });

    /* -------- Standalone detection on load / visibility change --------
       Covers the case where the user already installed earlier, closed
       the tab, and is now opening the app icon for the first time. */
    window.addEventListener('load', function () {
        if (isRunningStandalone()) {
            setStatus('Checking your offline copy…');
            tryFinalizeInstallUnlock();
        }
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') tryFinalizeInstallUnlock();
    });
})();
