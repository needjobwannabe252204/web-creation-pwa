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

        if (!done) return;

        /* Green border on the card */
        var cardId = 'index-lesson' + n + '-card';
        var card   = document.getElementById(cardId);
        if (card) card.style.borderLeft = '6px solid #4caf50';

        /* Update the button label */
        var btnId = 'index-lesson' + n + '-btn';
        var btn   = document.getElementById(btnId);
        if (btn) {
            btn.textContent = '✅ Completed — Review';
            btn.disabled    = false;
        }

        /* Show the reset button */
        var resetId = 'reset-lesson' + n + '-btn';
        var resetEl = document.getElementById(resetId);
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

function _parsePrereqString(str) {
    if (!str) return [];
    return String(str).split(',')
        .map(function (s) { return Number(s.trim()); })
        .filter(Boolean);
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

        var prereqsMet = arePrereqsMet(prereqArr);
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
            _applyLockedState(btn, card, prereqStr);

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
    if (!prereqArr.length) {
        if (href) window.location.href = href;
        return;
    }

    if (btn.classList.contains('can-unlock')) {
        ev.preventDefault();
        _performUnlock(btn, card, lessonNum);
        return;
    }

    var cp         = loadCourseProgress();
    var nowUnlocked = !!(cp.lessonsUnlocked && cp.lessonsUnlocked[lessonNum]);

    if (arePrereqsMet(prereqArr) && nowUnlocked) {
        if (href) window.location.href = href;
        return;
    }

    /* Completed lessons are always navigable for review */
    if (_isLessonDone(lessonNum)) {
        if (href) window.location.href = href;
        return;
    }

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

function _performUnlock(btn, card, lessonNum) {
    if (!card) {
        _saveUnlock(lessonNum);
        btn.classList.remove('can-unlock');
        if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
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
