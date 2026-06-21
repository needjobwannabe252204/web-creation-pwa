/* ==========================================================
   utils.js — Shared utility functions for Web Creation PWA
   ----------------------------------------------------------
   WHY THIS FILE EXISTS:
   Previously, helpers like courseProgress load/save and DOM
   shortcuts were copy-pasted across script.js and lesson-1.js.
   Centralising them here means:
     • One place to fix bugs
     • Consistent behaviour across all lesson pages
     • Easier to add new lessons without repeating boilerplate

   HOW TO USE:
   Load this file BEFORE script.js and lesson-N.js in your HTML:
     <script src="../../js/utils.js"></script>
     <script src="../../js/script.js"></script>
     <script src="../../js/lesson-N.js"></script>
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   1) DOM helpers
   ---------------------------------------------------------- */

/**
 * Shorthand for document.getElementById.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getEl(id) {
    return document.getElementById(id);
}

/**
 * Set or clear a left border on a card element.
 * Used to visually mark cards as completed (green) or failed (red).
 *
 * @param {HTMLElement|null} cardEl - The card element to style.
 * @param {string|null} color - CSS colour string, or null/'' to clear.
 */
function setCardBorder(cardEl, color) {
    if (!cardEl) return;
    cardEl.style.borderLeft = color ? `6px solid ${color}` : '';
}


/* ----------------------------------------------------------
   2) Toast notifications
   ----------------------------------------------------------
   Replace disruptive alert() calls with a small non-blocking
   toast that fades out after a few seconds.
   Falls back to alert() on very old browsers where the
   necessary APIs aren't available.
   ---------------------------------------------------------- */

/**
 * Show a brief toast message at the bottom of the screen.
 * Safe to call multiple times — each toast queues independently.
 *
 * @param {string}  message   - Text to display.
 * @param {'info'|'success'|'error'} [type='info'] - Controls colour.
 * @param {number}  [duration=3000] - Milliseconds before fade-out.
 */
function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    /* Ensure a toast container exists in the DOM */
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        /* Inline the minimal positioning styles so no extra CSS file
           is required — keeps the utility self-contained. */
        container.style.cssText = [
            'position:fixed',
            'bottom:20px',
            'left:50%',
            'transform:translateX(-50%)',
            'z-index:9999',
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'gap:8px',
            'pointer-events:none'
        ].join(';');
        document.body.appendChild(container);
    }

    /* Colour map — keep in sync with the lesson colour palette */
    var colors = {
        success : { bg: '#2e7d32', text: '#fff' },
        error   : { bg: '#c62828', text: '#fff' },
        info    : { bg: '#1565c0', text: '#fff' }
    };
    var scheme = colors[type] || colors.info;

    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
        'background:' + scheme.bg,
        'color:' + scheme.text,
        'padding:10px 20px',
        'border-radius:8px',
        'font-size:0.95rem',
        'font-weight:500',
        'box-shadow:0 4px 12px rgba(0,0,0,0.3)',
        'opacity:1',
        'transition:opacity 0.4s ease',
        'pointer-events:none',
        'max-width:90vw',
        'text-align:center'
    ].join(';');

    container.appendChild(toast);

    /* Start fade-out just before removal */
    var fadeTimer = setTimeout(function () {
        toast.style.opacity = '0';
    }, duration - 400);

    var removeTimer = setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration);

    /* Allow callers to cancel early if needed */
    return {
        dismiss: function () {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }
    };
}


/* ----------------------------------------------------------
   3) Course progress (localStorage)
   ----------------------------------------------------------
   Centralised read/write for the `courseProgress` key so every
   lesson reads from and writes to the same structure.

   Schema:
   {
     lessonsUnlocked:  { 1: true, 2: true, ... },
     lessonsCompleted: { 1: true, 2: true, ... }
   }
   ---------------------------------------------------------- */

var COURSE_PROGRESS_KEY = 'courseProgress';

/**
 * Load the course-wide progress object from localStorage.
 * Returns a safe default if nothing is stored or parsing fails.
 *
 * @returns {{ lessonsUnlocked: Object, lessonsCompleted: Object }}
 */
function loadCourseProgress() {
    try {
        var raw = localStorage.getItem(COURSE_PROGRESS_KEY);
        if (!raw) return { lessonsUnlocked: {}, lessonsCompleted: {} };
        var parsed = JSON.parse(raw);
        /* Guard against partially-written objects */
        parsed.lessonsUnlocked  = parsed.lessonsUnlocked  || {};
        parsed.lessonsCompleted = parsed.lessonsCompleted || {};
        return parsed;
    } catch (e) {
        console.warn('[utils] Could not load courseProgress:', e);
        return { lessonsUnlocked: {}, lessonsCompleted: {} };
    }
}

/**
 * Persist the course progress object to localStorage.
 *
 * @param {{ lessonsUnlocked: Object, lessonsCompleted: Object }} cp
 */
function saveCourseProgress(cp) {
    try {
        localStorage.setItem(COURSE_PROGRESS_KEY, JSON.stringify(cp));
    } catch (e) {
        console.warn('[utils] Could not save courseProgress:', e);
    }
}

/**
 * Mark a specific lesson as completed in the central progress store.
 * Also marks it as unlocked so other lessons can check prerequisites.
 *
 * @param {number} lessonNum - Lesson number (1, 2, 3 …).
 */
function markLessonComplete(lessonNum) {
    var cp = loadCourseProgress();
    cp.lessonsCompleted[lessonNum] = true;
    cp.lessonsUnlocked[lessonNum]  = true;
    saveCourseProgress(cp);
}

/**
 * Check whether a lesson has been marked completed.
 *
 * @param {number} lessonNum
 * @returns {boolean}
 */
function isLessonCompleted(lessonNum) {
    var cp = loadCourseProgress();
    return !!(cp.lessonsCompleted && cp.lessonsCompleted[lessonNum]);
}

/**
 * Check whether ALL given lesson numbers are completed.
 * Used by the prerequisite gate on the index page.
 *
 * @param {number[]} prereqArr
 * @returns {boolean}
 */
function arePrereqsMet(prereqArr) {
    if (!prereqArr || !prereqArr.length) return true;
    try {
        var cp = loadCourseProgress();
        for (var i = 0; i < prereqArr.length; i++) {
            var n = prereqArr[i];
            if (!n) continue;
            /* Check central store first */
            if (cp.lessonsCompleted && typeof cp.lessonsCompleted[n] !== 'undefined') {
                if (!cp.lessonsCompleted[n]) return false;
                continue;
            }
            /* Legacy fallback: lesson 1 stored its state separately */
            if (n === 1) {
                try {
                    var raw1 = localStorage.getItem('lesson1State');
                    var s1   = raw1 ? JSON.parse(raw1) : null;
                    if (!(s1 && s1.lessonCompleted)) return false;
                    continue;
                } catch (_) { return false; }
            }
            /* Unknown lesson — treat as locked */
            return false;
        }
        return true;
    } catch (e) {
        console.warn('[utils] arePrereqsMet failed:', e);
        return false;
    }
}


/* ----------------------------------------------------------
   3b) PWA install-unlock flag
   ----------------------------------------------------------
   Lesson 1 has a special prerequisite: "install" instead of a
   lesson number. It's satisfied once this device has opened the
   app as an installed PWA (standalone display mode) AND the
   service worker finished caching the app shell offline — i.e.
   the user actually has their own offline copy, not just a tab
   open on the live site.

   This is stored under its own key (not tied to any one lesson
   number) and, once true, stays true permanently for this
   device/browser profile.
   ---------------------------------------------------------- */

var INSTALL_UNLOCK_KEY = 'pwaInstallUnlocked';

/**
 * Has this device already satisfied the install condition?
 * @returns {boolean}
 */
function isInstallUnlocked() {
    try {
        return localStorage.getItem(INSTALL_UNLOCK_KEY) === 'true';
    } catch (e) {
        return false;
    }
}

/**
 * Permanently mark the install condition as satisfied on this device.
 */
function setInstallUnlocked() {
    try {
        localStorage.setItem(INSTALL_UNLOCK_KEY, 'true');
    } catch (e) {
        console.warn('[utils] Could not persist install unlock:', e);
    }
}

/**
 * Live check: is this page currently running as an installed,
 * standalone PWA right now? (Does NOT check the saved flag —
 * use isInstallUnlocked() for the persisted result.)
 * @returns {boolean}
 */
function isRunningStandalone() {
    var mq = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    var iosStandalone = window.navigator && window.navigator.standalone === true; // older iOS Safari
    return !!((mq && mq.matches) || iosStandalone);
}


/* ----------------------------------------------------------
   3c) User profile (localStorage)
   ----------------------------------------------------------
   Collected right after install finishes, before Lesson 1
   unlocks. Stored under its own key so it's easy to read from
   the profile page, the sidebar, and the lesson gate check.

   Schema:
   {
     name: "Juan D.",
     course: "...",
     section: "...",
     semester: "1st" | "2nd",
     yearLevel: "..."
     savedAt: <ISO timestamp>
   }
   ---------------------------------------------------------- */

var PROFILE_KEY = 'userProfile';

/**
 * Load the saved profile, or null if none has been saved yet.
 * @returns {object|null}
 */
function loadProfile() {
    try {
        var raw = localStorage.getItem(PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('[utils] Could not load profile:', e);
        return null;
    }
}

/**
 * Persist the profile object. Expects { name, course, section,
 * semester, yearLevel }; adds savedAt automatically.
 * @param {object} profile
 */
function saveProfile(profile) {
    try {
        profile = profile || {};
        profile.savedAt = new Date().toISOString();
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        return true;
    } catch (e) {
        console.warn('[utils] Could not save profile:', e);
        return false;
    }
}

/**
 * Has the user filled out and saved their profile?
 * @returns {boolean}
 */
function isProfileComplete() {
    var p = loadProfile();
    return !!(p && p.name && p.course && p.section && p.semester && p.yearLevel);
}

/**
 * Wipe the saved profile (used by Delete App / reset flows).
 */
function clearProfile() {
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
}


/* ----------------------------------------------------------
   4) Page identity helper
   ---------------------------------------------------------- */

/**
 * Return just the filename portion of the current URL
 * (e.g. 'test-2.3.html'), lower-cased for safe comparison.
 *
 * @returns {string}
 */
function getCurrentPage() {
    var path = window.location.pathname || window.location.href || '';
    /* Strip query string and hash, then grab the last segment */
    var clean = path.split('?')[0].split('#')[0];
    var parts  = clean.split('/');
    return (parts[parts.length - 1] || '').toLowerCase();
}


/* ----------------------------------------------------------
   5) Swap submit ↔ reset buttons
   ----------------------------------------------------------
   All activity pages follow the same pattern:
     • Show submit initially
     • After grading: hide submit, show reset (and optionally next)
   This helper eliminates the repeated inline style toggling.
   ---------------------------------------------------------- */

/**
 * Toggle visibility between submit and reset/next controls.
 *
 * @param {{ submitId?: string, resetId?: string, nextId?: string }} ids
 * @param {boolean} showReset - true after submission, false after reset.
 */
function swapActivityButtons(ids, showReset) {
    var submitEl = ids.submitId ? getEl(ids.submitId) : null;
    var resetEl  = ids.resetId  ? getEl(ids.resetId)  : null;
    var nextEl   = ids.nextId   ? getEl(ids.nextId)   : null;

    if (submitEl) submitEl.style.display = showReset ? 'none'         : 'inline-block';
    if (resetEl)  resetEl.style.display  = showReset ? 'inline-block' : 'none';
    if (nextEl)   nextEl.style.display   = showReset ? 'inline-block' : 'none';
}


/* ----------------------------------------------------------
   6) Auto-resize textarea
   ---------------------------------------------------------- */

/**
 * Make a textarea grow with its content instead of showing a
 * scrollbar. Call once per textarea element after DOM ready.
 *
 * @param {HTMLTextAreaElement} area
 */
function autoResizeTextarea(area) {
    if (!area) return;
    area.style.overflow = 'hidden';
    function resize() {
        area.style.height = 'auto';
        area.style.height = (area.scrollHeight + 2) + 'px';
    }
    resize();
    area.addEventListener('input', resize, { passive: true });
    /* Also resize when the window changes size (e.g. phone rotation) */
    window.addEventListener('resize', resize, { passive: true });
}


/* ----------------------------------------------------------
   7) IMAGE LIGHTBOX (global)
   Make a simple modal available to any topic page that wants
   clickable thumbnails to open a larger view.
   ---------------------------------------------------------- */

function openImage(imgOrSrc) {
    var src = typeof imgOrSrc === 'string' ? imgOrSrc : (imgOrSrc && imgOrSrc.src) || '';
    var alt = (typeof imgOrSrc === 'object' && imgOrSrc && imgOrSrc.alt) || '';
    var modal    = getEl('imageModal');
    var modalImg = getEl('modalImage');
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = alt;
    modal.style.display = 'flex';
}

function closeImage() {
    var modal    = getEl('imageModal');
    var modalImg = getEl('modalImage');
    if (!modal) return;
    modal.style.display = 'none';
    if (modalImg) { modalImg.src = ''; modalImg.alt = ''; }
}


/* ----------------------------------------------------------
   Exports — attach to window so all scripts can access them.
   Using window.* because this project doesn't use ES modules.
   ---------------------------------------------------------- */
window.WCUtils = {
    getEl              : getEl,
    setCardBorder      : setCardBorder,
    showToast          : showToast,
    loadCourseProgress : loadCourseProgress,
    saveCourseProgress : saveCourseProgress,
    markLessonComplete : markLessonComplete,
    isLessonCompleted  : isLessonCompleted,
    arePrereqsMet      : arePrereqsMet,
    isInstallUnlocked  : isInstallUnlocked,
    setInstallUnlocked : setInstallUnlocked,
    isRunningStandalone: isRunningStandalone,
    loadProfile        : loadProfile,
    saveProfile        : saveProfile,
    isProfileComplete  : isProfileComplete,
    clearProfile       : clearProfile,
    getCurrentPage     : getCurrentPage,
    swapActivityButtons: swapActivityButtons,
    autoResizeTextarea : autoResizeTextarea,
    openImage          : openImage,
    closeImage         : closeImage
};

/* Also expose the most-used helpers at the top level for convenience
   so existing inline handlers (onclick="...") still work without
   changing HTML files. */
window.getEl            = getEl;
window.setCardBorder    = setCardBorder;
window.showToast        = showToast;
window.loadCourseProgress  = loadCourseProgress;
window.saveCourseProgress  = saveCourseProgress;
window.markLessonComplete  = markLessonComplete;
window.isLessonCompleted   = isLessonCompleted;
window.arePrereqsMet       = arePrereqsMet;
window.isInstallUnlocked   = isInstallUnlocked;
window.setInstallUnlocked  = setInstallUnlocked;
window.isRunningStandalone = isRunningStandalone;
window.loadProfile         = loadProfile;
window.saveProfile         = saveProfile;
window.isProfileComplete   = isProfileComplete;
window.clearProfile        = clearProfile;
window.getCurrentPage      = getCurrentPage;
window.swapActivityButtons = swapActivityButtons;
window.autoResizeTextarea  = autoResizeTextarea;
window.openImage           = openImage;
window.closeImage          = closeImage;
