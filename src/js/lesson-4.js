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

var L4_COMPLETE_KEY = "lesson4Complete";

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

    localStorage.setItem(L4_COMPLETE_KEY, "true");
    if (btn) {
        btn.textContent = "✅ Project Completed!";
        btn.disabled    = true;
    }
    if (banner) banner.style.display = "block";
    l4UpdateProgress(true);

    // Notify the rest of the app that lesson 4 is done
    // (mirrors the pattern used by other lesson pages)
    if (typeof markLessonComplete === "function") {
        markLessonComplete(4);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var btn    = document.getElementById("completeProjectBtn");
    var banner = document.getElementById("celebrationBanner");

    function checkDoneState() {
        var keyFlag = localStorage.getItem(L4_COMPLETE_KEY) === "true";
        var central = false;
        if (typeof isLessonCompleted === 'function') {
            try { central = isLessonCompleted(4); } catch (e) { central = false; }
        } else {
            try {
                var cp = loadCourseProgress();
                central = !!(cp.lessonsCompleted && cp.lessonsCompleted[4]);
            } catch (e) { central = false; }
        }
        return keyFlag || central;
    }

    function applyDoneUI(done) {
        if (done) {
            if (btn) {
                btn.textContent = "✅ Project Completed!";
                btn.disabled    = true;
            }
            if (banner) banner.style.display = "block";
        }
        l4UpdateProgress(done);
    }

    // Initial restore on page load
    applyDoneUI(checkDoneState());

    // React to localStorage changes made in other windows / devtools
    window.addEventListener('storage', function (ev) {
        if (!ev) return;
        if (ev.key === L4_COMPLETE_KEY || ev.key === 'courseProgress') {
            applyDoneUI(checkDoneState());
        }
    });

    if (btn) {
        btn.addEventListener("click", function () {
            if (localStorage.getItem(L4_COMPLETE_KEY) !== "true") {
                l4MarkComplete();
            }
        });
    }
});
