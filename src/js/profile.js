/* ==========================================================
   profile.js — Profile page logic (profile.html only)
   ----------------------------------------------------------
   Responsibilities:
     1. Pre-fill the form if a profile is already saved.
     2. Save the form to localStorage on submit (via saveProfile()).
     3. Show an "almost there" banner when arriving right after
        install (so the form doesn't feel like it's out of nowhere).
     4. Render the progress bar + accomplishments list from
        courseProgress / lesson1State.
     5. After a successful save, if Lesson 1 was only waiting on
        the profile, send the user back to the homepage so they
        see the unlock animation there.

   Dependencies: utils.js (loadProfile, saveProfile, isInstallUnlocked,
   loadCourseProgress) must load before this file.
   ========================================================== */

"use strict";

console.log('[profile.js] Loading profile.js');

if (typeof loadProfile !== 'function') {
    console.error('[profile.js] CRITICAL: loadProfile not found - utils.js may not be loaded');
}
if (typeof saveProfile !== 'function') {
    console.error('[profile.js] CRITICAL: saveProfile not found - utils.js may not be loaded');
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[profile.js] DOMContentLoaded event fired');

    var form        = document.getElementById('profileForm');
    var savedNote    = document.getElementById('profileSavedNote');
    var introCard    = document.getElementById('profileIntroCard');

    /* -------------------------------------------------------
       1) Pre-fill from existing profile, if any
       ------------------------------------------------------- */
    var existing = (typeof loadProfile === 'function') ? loadProfile() : null;
    if (existing) {
        setVal('profileName', existing.name);
        setVal('profileCourse', existing.course);
        setVal('profileSection', existing.section);
        setVal('profileSemester', existing.semester);
        setVal('profileYearLevel', existing.yearLevel);
    }

    function setVal(id, val) {
        var el = document.getElementById(id);
        if (el && val) el.value = val;
    }

    /* -------------------------------------------------------
       2) Show the "almost there" banner only when relevant:
          install is done but profile isn't saved yet.
       ------------------------------------------------------- */
    var cameFromInstall = /from=lesson1/.test(window.location.search) ||
        (typeof isInstallUnlocked === 'function' && isInstallUnlocked() &&
         typeof isProfileComplete === 'function' && !isProfileComplete());

    if (introCard && cameFromInstall) {
        introCard.style.display = 'block';
    }

    /* -------------------------------------------------------
       3) Save on submit
       ------------------------------------------------------- */
    if (form) {
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();

            var profile = {
                name      : (document.getElementById('profileName') || {}).value || '',
                course    : (document.getElementById('profileCourse') || {}).value || '',
                section   : (document.getElementById('profileSection') || {}).value || '',
                semester  : (document.getElementById('profileSemester') || {}).value || '',
                yearLevel : (document.getElementById('profileYearLevel') || {}).value || ''
            };

            /* Trim and validate (the `required` attributes already
               help, but double-check in case of autofill weirdness) */
            var missingField = Object.keys(profile).some(function (k) { return !profile[k].trim(); });
            if (missingField) {
                if (typeof showToast === 'function') showToast('Please fill in every field.', 'error');
                return;
            }

            var ok = (typeof saveProfile === 'function') && saveProfile(profile);
            if (!ok) {
                if (typeof showToast === 'function') showToast('Could not save your profile. Try again.', 'error');
                return;
            }

            if (savedNote) {
                savedNote.style.display = 'block';
                savedNote.textContent = '✅ Profile saved.';
            }
            if (typeof showToast === 'function') showToast('Profile saved! 🎉', 'success');

            renderProgress(); /* harmless here, but keeps the page consistent if they stay */

            /* If Lesson 1 was waiting only on the profile (and install
               is already done), send them home to see it unlock. */
            var installDone = (typeof isInstallUnlocked === 'function') && isInstallUnlocked();
            if (installDone) {
                if (typeof showToast === 'function') {
                    showToast('Lesson 1 is unlocking… heading home. 🔓', 'success', 1800);
                }
                setTimeout(function () {
                    window.location.href = '/index.html?unlocked=1';
                }, 1200);
            }
        });
    }

    /* -------------------------------------------------------
       4) Progress bar + accomplishments
       ------------------------------------------------------- */
    function renderProgress() {
        var fill    = document.getElementById('profileProgressFill');
        var percent = document.getElementById('profileProgressPercent');

        var totalLessons = 4;
        var doneCount = 0;

        for (var n = 1; n <= totalLessons; n++) {
            var isDone = false;
            if (n === 1) {
                try {
                    var raw = localStorage.getItem('lesson1State');
                    var s   = raw ? JSON.parse(raw) : null;
                    isDone = !!(s && s.lessonCompleted);
                } catch (e) { isDone = false; }
            } else if (typeof isLessonCompleted === 'function') {
                isDone = isLessonCompleted(n);
            }

            var li = document.getElementById('acc-' + n);
            if (li) {
                var labels = {
                    1: 'Lesson 1 — Tools for Web Design',
                    2: 'Lesson 2 — HTML Basics',
                    3: 'Lesson 3 — CSS Styling & Layout',
                    4: 'Lesson 4 — Final Project'
                };
                li.textContent = (isDone ? '✅ ' : '⬜ ') + labels[n];
                li.classList.toggle('profile-accomplishment-done', isDone);
            }

            if (isDone) doneCount++;
        }

        var pct = Math.round((doneCount / totalLessons) * 100);
        if (fill) fill.style.width = pct + '%';
        if (percent) percent.textContent = pct + '%';
    }

    renderProgress();
});
