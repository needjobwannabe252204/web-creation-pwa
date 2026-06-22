/* ==========================================================
   lesson-4.js — Lesson 4 (Final Project) completion logic
   ----------------------------------------------------------
   Responsibilities:
     1. Restores completion state on page load
     2. Updates the progress bar (0% → 100%, mirrors lesson-1/2/3)
     3. Marks the final project as complete when button is pressed
     4. Notifies the rest of the app via markLessonComplete(4)

   Dependencies:
     utils.js and script.js must be loaded before this file.
   ========================================================== */

"use strict";

function l4UpdateProgress(done) {
    var bar  = getEl ? getEl('lessonProgress') : document.getElementById('lessonProgress');
    var text = getEl ? getEl('progressText')   : document.getElementById('progressText');
    var pct  = done ? 100 : 0;
    if (bar)  bar.style.width  = pct + '%';
    if (text) text.textContent = 'Progress: ' + pct + '%';
}

function l4MarkComplete() {
    var btn    = document.getElementById("completeProjectBtn");
    var banner = document.getElementById("celebrationBanner");

    if (btn) {
        btn.textContent = "✅ Project Completed!";
        btn.disabled    = true;
    }
    if (banner) banner.style.display = "block";
    l4UpdateProgress(true);

    // Mark lesson 4 as complete in the central progress store
    if (typeof markLessonComplete === "function") {
        markLessonComplete(4);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var btn    = document.getElementById("completeProjectBtn");
    var banner = document.getElementById("celebrationBanner");

    function isDone() {
        if (typeof isLessonCompleted === 'function') {
            try { return isLessonCompleted(4); } catch (e) { return false; }
        }
        // Fallback if isLessonCompleted is not available
        try {
            var cp = loadCourseProgress();
            return !!(cp.lessonsCompleted && cp.lessonsCompleted[4]);
        } catch (e) { 
            return false; 
        }
    }

    function applyDoneUI(done) {
        if (done) {
            if (btn) {
                btn.textContent = "✅ Project Completed!";
                btn.disabled    = true;
            }
            if (banner) banner.style.display = "block";
        } else {
            if (btn) {
                btn.textContent = "✅ I Have Completed My Project";
                btn.disabled    = false;
            }
            if (banner) banner.style.display = "none";
        }
        l4UpdateProgress(done);
    }

    // Initial restore on page load
    applyDoneUI(isDone());

    // React to courseProgress changes made in other windows / devtools
    window.addEventListener('storage', function (ev) {
        if (!ev) return;
        if (ev.key === 'courseProgress') {
            applyDoneUI(isDone());
        }
    });

    if (btn) {
        btn.addEventListener("click", function () {
            if (!isDone()) {
                l4MarkComplete();
            }
        });
    }
});
