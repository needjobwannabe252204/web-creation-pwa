/* ==========================================================
   script.js — Global UI behaviours for Web Creation PWA
   ----------------------------------------------------------
   Responsibilities:
     1. Sidebar (hamburger menu) open / close
     2. Global button[data-href] navigation
     3. Index-page lesson card gating (lock / unlock)
     4. Index-page lesson-1 completion badge

   Dependencies:
     utils.js  — must be loaded BEFORE this file

   Per-lesson logic lives in lesson-N.js, not here.
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

/* Warn but don't crash if elements are missing — some pages may
   not use the full header/sidebar layout. */
if (!menuBtn || !sidebar || !overlay) {
    console.warn('[script.js] Sidebar elements not found — menu setup skipped.');
}

/** Slide the sidebar into view and darken the page background. */
function openMenu() {
    if (!sidebar || !overlay) return;
    sidebar.classList.add('open');
    overlay.classList.add('show');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
}

/** Slide the sidebar back out and remove the dark overlay. */
function closeMenu() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
}

/* Wire up menu toggle — clicking the burger icon opens *or* closes */
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

/* Three ways to close: close button, overlay click, Escape key */
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
   ----------------------------------------------------------
   Buttons marked with data-href="path/to/page.html" behave
   like links without needing an <a> wrapper. Locked / can-unlock
   buttons intercept the click themselves, so we skip those here.
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('button[data-href]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            /* Let specialised lock handlers manage locked / can-unlock buttons */
            if (btn.classList.contains('locked') || btn.classList.contains('can-unlock')) {
                e.preventDefault();
                return;
            }
            var target = btn.dataset.href || btn.getAttribute('data-href');
            if (target) window.location.href = target;
        });
    });

    /* -------------------------------------------------------
       3) Index-page: lesson-1 completion badge
       ------------------------------------------------------- */
    _refreshLesson1Badge();

    /* Reset-progress button (only on index.html) */
    var resetBtn = document.getElementById('reset-lesson1-btn');
    if (resetBtn) {
        _initResetButton(resetBtn);
    }

    /* Reset-progress button for Lesson 2 */
    var reset2 = document.getElementById('reset-lesson2-btn');
    if (reset2) {
        _initResetLesson2Button(reset2);
    }

    /* Reset-progress button for Lesson 3 */
    var reset3 = document.getElementById('reset-lesson3-btn');
    if (reset3) {
        _initResetLesson3Button(reset3);
    }

    /* -------------------------------------------------------
       4) Index-page: lesson gate initialisation
       ------------------------------------------------------- */
    initLessonGates();

}); // end DOMContentLoaded


/* ----------------------------------------------------------
   3 (helper) — Update the Lesson 1 card on the index page
   to reflect its completion state.
   ---------------------------------------------------------- */
function _refreshLesson1Badge() {
    try {
        var raw = localStorage.getItem('lesson1State');
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!s || !s.lessonCompleted) return;

        var card = document.getElementById('index-lesson1-card');
        if (card) card.style.borderLeft = '6px solid #4caf50';

        var btn = document.getElementById('index-lesson1-btn');
        if (btn) {
            btn.textContent = '✅ Completed — Review';
            btn.disabled = false;
        }

        var resetBtn = document.getElementById('reset-lesson1-btn');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
    } catch (e) {
        console.warn('[script.js] Could not refresh lesson-1 badge:', e);
    }
}

/**
 * Set up reset button for Lesson 3.
 * Clears `lesson3State` and updates `courseProgress` to mark
 * lesson 3 as not completed and locks lesson 4 again.
 */
function _initResetLesson3Button(resetBtn) {
    try {
        var cp = loadCourseProgress() || { lessonsUnlocked: {}, lessonsCompleted: {} };
        var show = !!(cp.lessonsCompleted && cp.lessonsCompleted[3]);
        resetBtn.style.display = show ? 'inline-flex' : 'none';
    } catch (_) {
        resetBtn.style.display = 'none';
    }

    resetBtn.addEventListener('click', function () {
        if (!confirm('Clear Lesson 3 progress? This will lock Lesson 4 again.')) return;
        try {
            localStorage.removeItem('lesson3State');
            var cp2 = loadCourseProgress() || { lessonsUnlocked: {}, lessonsCompleted: {} };
            if (cp2.lessonsCompleted) cp2.lessonsCompleted[3] = false;
            if (cp2.lessonsUnlocked) cp2.lessonsUnlocked[4] = false;
            saveCourseProgress(cp2);
        } catch (e) {
            console.warn('[script.js] Could not clear lesson-3 progress:', e);
        }
        location.reload();
    });
}

/**
 * Set up reset button for Lesson 2.
 * Clears `lesson2State` and updates `courseProgress` to mark
 * lesson 2 as not completed and locks lesson 3 again.
 */
function _initResetLesson2Button(resetBtn) {
    try {
        var cp = loadCourseProgress() || { lessonsUnlocked: {}, lessonsCompleted: {} };
        var show = !!(cp.lessonsCompleted && cp.lessonsCompleted[2]);
        resetBtn.style.display = show ? 'inline-flex' : 'none';
    } catch (_) {
        resetBtn.style.display = 'none';
    }

    resetBtn.addEventListener('click', function () {
        if (!confirm('Clear Lesson 2 progress? This will lock Lesson 3 again.')) return;
        try {
            localStorage.removeItem('lesson2State');
            var cp2 = loadCourseProgress() || { lessonsUnlocked: {}, lessonsCompleted: {} };
            if (cp2.lessonsCompleted) cp2.lessonsCompleted[2] = false;
            if (cp2.lessonsUnlocked) cp2.lessonsUnlocked[3] = false;
            saveCourseProgress(cp2);
        } catch (e) {
            console.warn('[script.js] Could not clear lesson-2 progress:', e);
        }
        location.reload();
    });
}

/**
 * Set up the reset-lesson-1-progress button.
 * Shows/hides itself based on stored state and confirms before clearing.
 */
function _initResetButton(resetBtn) {
    /* Determine initial visibility */
    try {
        var rawState = localStorage.getItem('lesson1State');
        var s0 = rawState ? JSON.parse(rawState) : null;
        resetBtn.style.display = (s0 && s0.lessonCompleted) ? 'inline-flex' : 'none';
    } catch (_) {
        resetBtn.style.display = 'none';
    }

    resetBtn.addEventListener('click', function () {
        if (!confirm('Clear Lesson 1 progress? This cannot be undone.')) return;
        try {
            localStorage.removeItem('lesson1State');
            localStorage.removeItem('courseProgress');
        } catch (e) {
            console.warn('[script.js] Could not clear progress:', e);
        }
        location.reload();
    });
}


/* ----------------------------------------------------------
   4) Lesson gate system
   ----------------------------------------------------------
   Reads `data-lesson` and `data-prereq` attributes from index
   buttons and locks/unlocks cards based on courseProgress.

   States a button/card can be in:
     • locked     — prerequisites not met yet
     • can-unlock — prerequisites met; user must click to unlock
     • unlocked   — user has explicitly unlocked; shows Start label
     • (default)  — no prerequisites; always navigable
   ---------------------------------------------------------- */

function _parsePrereqString(str) {
    if (!str) return [];
    return String(str).split(',')
        .map(function (s) { return Number(s.trim()); })
        .filter(Boolean);
}

function initLessonGates() {
    var cp = loadCourseProgress();

    document.querySelectorAll('button[data-lesson]').forEach(function (btn) {
        var prereqStr  = btn.getAttribute('data-prereq') || '';
        var prereqArr  = _parsePrereqString(prereqStr);
        var href       = btn.getAttribute('data-href');
        var lessonNum  = Number(btn.getAttribute('data-lesson')) || 0;
        var card       = btn.closest('.card');

        /* Cache original label once so we can restore it after unlocking */
        if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent.trim();

        var prereqsMet = arePrereqsMet(prereqArr);
        var isUnlocked = !!(cp.lessonsUnlocked && cp.lessonsUnlocked[lessonNum]);

        if (prereqArr.length && !prereqsMet && !isUnlocked) {
            /* ---- LOCKED ---- */
            _applyLockedState(btn, card, prereqStr);

        } else if (isUnlocked) {
            /* ---- ALREADY UNLOCKED (from previous visit) ---- */
            _applyUnlockedState(btn, card);

        } else if (prereqArr.length && prereqsMet) {
            /* ---- CAN UNLOCK (prereqs met; needs one click) ---- */
            _applyCanUnlockState(btn, card);

        } else {
            /* ---- NO PREREQS — open by default ---- */
            _applyOpenState(btn, card);
        }

        /* If this lesson was completed in the central courseProgress store,
           show a completed state (green) on the index card and update label. */
        try {
            if (cp && cp.lessonsCompleted && cp.lessonsCompleted[lessonNum]) {
                if (card) setCardBorder(card, '#4caf50');
                if (btn) {
                    btn.textContent = '✅ Completed — Review';
                    btn.disabled = false;
                }
            }
        } catch (_) {}

        /* Attach the click handler that governs all state transitions */
        btn.addEventListener('click', function (ev) {
            _handleGateClick(ev, btn, card, prereqArr, prereqStr, lessonNum, href);
        });
    });
}

/* -- State applicators -- */

function _applyLockedState(btn, card, prereqStr) {
    btn.classList.add('locked');
    btn.textContent = '🔒 Locked';
    btn.title = 'Complete lesson(s) ' + prereqStr + ' first';
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
    /* No prerequisites — navigate directly */
    if (!prereqArr.length) {
        if (href) window.location.href = href;
        return;
    }

    /* Can-unlock: user explicitly unlocks on this click (no auto-navigate) */
    if (btn.classList.contains('can-unlock')) {
        ev.preventDefault();
        _performUnlock(btn, card, lessonNum);
        return;
    }

    /* Check live (re-read storage in case another tab updated it) */
    var cp = loadCourseProgress();
    var nowUnlocked = !!(cp.lessonsUnlocked && cp.lessonsUnlocked[lessonNum]);

    if (arePrereqsMet(prereqArr) && nowUnlocked) {
        if (href) window.location.href = href;
        return;
    }

    /* Still locked: guide to the blocking lesson */
    ev.preventDefault();
    var missingLesson = prereqArr.find(function (n) {
        return !arePrereqsMet([n]);
    });
    if (missingLesson) {
        if (confirm(
            'You must complete Lesson ' + missingLesson +
            ' before this one. Go there now?'
        )) {
            window.location.href = 'src/html/lesson-' + missingLesson +
                '/lesson-' + missingLesson + '.html';
        }
    } else {
        showToast('Complete the prerequisites first.', 'info');
    }
}

/** Animate and persist the unlock of a lesson card. */
function _performUnlock(btn, card, lessonNum) {
    if (!card) {
        /* No card: persist state and restore label immediately */
        _saveUnlock(lessonNum);
        btn.classList.remove('can-unlock');
        if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
        return;
    }

    /* Update badge text while animation plays */
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
    });
}

function _saveUnlock(lessonNum) {
    var cp = loadCourseProgress();
    cp.lessonsUnlocked[lessonNum] = true;
    saveCourseProgress(cp);
}


/* ----------------------------------------------------------
   5) Legacy global: doneLesson()
   ----------------------------------------------------------
   Some inline onclick handlers in older HTML pages still call
   this. Keep it here so those pages don't break.
   TODO: Replace alert with a proper toast once all pages have
   been updated to remove inline onclick attributes.
   ---------------------------------------------------------- */
function doneLesson() {
    showToast('Marked as read. Good job! 🎉', 'success');
}
window.doneLesson = doneLesson;
