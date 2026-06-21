/* ==========================================================
   lesson-3.js — Lesson 3 (CSS Styling) interactive logic
   ----------------------------------------------------------
   Lesson 3 currently has reading topics only (no quiz pages).
   This file:
     • Tracks which topics the student has visited
     • Updates the progress bar on lesson-3.html
     • Marks the lesson complete when all topics are visited
     • Gates the "Lesson 4" button until the lesson is done

   To add a quiz or activity for Lesson 3:
     1. Create the HTML test page (e.g. test-3.1.html)
     2. Add a validator function here (like validateLinks in lesson-2.js)
     3. Call bindL3Activity() from the DOMContentLoaded init block

   Dependencies:
     utils.js must be loaded before this file.
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   1) STATE
   ---------------------------------------------------------- */

var L3 = {
    /* true when the student navigates to each topic page */
    visitedTopics: {
        topic1: false, topic2: false, topic3: false,
        topic4: false, topic5: false, topic6: false, topic7: false
    },
    lessonCompleted: false
};

var TOTAL_L3_TOPICS = 7;
var L3_KEY = 'lesson3State';

/* ----------------------------------------------------------
   2) PERSISTENCE
   ---------------------------------------------------------- */

function saveL3State() {
    try {
        localStorage.setItem(L3_KEY, JSON.stringify({
            visitedTopics  : L3.visitedTopics,
            lessonCompleted: !!L3.lessonCompleted
        }));
    } catch (e) { console.warn('[lesson-3] save failed:', e); }
}

function loadL3State() {
    try {
        var raw = localStorage.getItem(L3_KEY);
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!s) return;
        if (s.visitedTopics) {
            Object.keys(L3.visitedTopics).forEach(function (k) {
                if (s.visitedTopics[k] !== undefined)
                    L3.visitedTopics[k] = !!s.visitedTopics[k];
            });
        }
        if (typeof s.lessonCompleted === 'boolean') L3.lessonCompleted = s.lessonCompleted;
    } catch (e) { console.warn('[lesson-3] load failed:', e); }
}

/** Debug helper: expose a function to clear lesson-3 state (useful for dev). */
function resetL3State() {
    try {
        localStorage.removeItem(L3_KEY);
        L3.visitedTopics = { topic1:false, topic2:false, topic3:false, topic4:false, topic5:false, topic6:false, topic7:false };
        L3.lessonCompleted = false;
        applyL3StateToUI();
        saveL3State();
        console.info('[lesson-3] resetL3State: cleared lesson3State from localStorage');
    } catch (e) { console.warn('[lesson-3] resetL3State failed:', e); }
}
window.resetL3State = resetL3State;

/* ----------------------------------------------------------
   3) PROGRESS UI
   ---------------------------------------------------------- */

function updateL3ProgressUI() {
    var keys      = Object.keys(L3.visitedTopics);
    var visited   = keys.filter(function (k) { return L3.visitedTopics[k]; }).length;
    var pct       = Math.round((visited / keys.length) * 100);

    var bar  = document.getElementById('lessonProgress');
    var text = document.getElementById('progressText');
    if (bar)  bar.style.width  = pct + '%';
    if (text) text.textContent = 'Progress: ' + pct + '%';
}

/**
 * Apply state to the lesson-3 overview page:
 *   • Green border on visited topic cards
 *   • Update progress bar
 */
function applyL3StateToUI() {
    for (var i = 1; i <= TOTAL_L3_TOPICS; i++) {
        if (!L3.visitedTopics['topic' + i]) continue;
        var btn = document.querySelector('button[data-href="topic-3.' + i + '.html"]');
        if (btn && btn.closest('.card')) {
            btn.closest('.card').style.borderLeft = '6px solid #4caf50';
        }
    }
    updateL3ProgressUI();
}

/* ----------------------------------------------------------
   4) MARK TOPIC VISITED
   Called automatically when the student lands on a topic page.
   ---------------------------------------------------------- */

/**
 * Mark a topic as visited, update progress, and check for
 * lesson completion.
 *
 * @param {number} n - Topic number (1–7).
 */
function markL3TopicVisited(n) {
    var key = 'topic' + n;
    if (!L3.visitedTopics.hasOwnProperty(key)) return;
    L3.visitedTopics[key] = true;

    /* Check if all topics are now visited */
    var allVisited = Object.values
        /* Object.values may not exist in very old browsers */
        ? Object.values(L3.visitedTopics).every(Boolean)
        : Object.keys(L3.visitedTopics).every(function (k) {
              return L3.visitedTopics[k];
          });

    if (allVisited && !L3.lessonCompleted) {
        L3.lessonCompleted = true;
        /* Write to the central progress store so index.html can
           unlock Lesson 4 */
        if (typeof markLessonComplete === 'function') {
            markLessonComplete(3);
        }
        showToast('Lesson 3 complete! 🎉 Lesson 4 is now unlocked.', 'success', 4000);
    }

    saveL3State();
    applyL3StateToUI();
}
window.markL3TopicVisited = markL3TopicVisited; /* for inline HTML handlers */

/* ----------------------------------------------------------
   5) AUTO-MARK TOPIC ON TOPIC PAGES
   When the student lands on topic-3.N.html the visit is
   recorded automatically — they don't need to click a button.
   ---------------------------------------------------------- */

function _autoMarkCurrentTopic() {
    var page = (typeof getCurrentPage === 'function') ? getCurrentPage() : '';
    for (var i = 1; i <= TOTAL_L3_TOPICS; i++) {
        if (page === ('topic-3.' + i + '.html')) {
            /* Do NOT auto-mark topics on page load. Visiting a topic
               should not automatically mark it completed — completion
               must be an explicit action (e.g., a Done button). If the
               topic was previously marked, still ensure the page's
               header card shows the green completed border. */
            if (L3.visitedTopics['topic' + i]) {
                var firstCard = document.querySelector('.card');
                if (firstCard) firstCard.style.borderLeft = '6px solid #4caf50';
            }
            break;
        }
    }
}

/* ----------------------------------------------------------
   6) INIT
   ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
    loadL3State();
    applyL3StateToUI();    /* for lesson-3.html overview */
    _autoMarkCurrentTopic(); /* for topic-3.N pages */
});
