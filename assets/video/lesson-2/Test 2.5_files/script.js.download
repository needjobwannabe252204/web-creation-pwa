/* ==========================================================
   1) App init / DOM refs
   - Grab key elements used across the UI and perform
    basic runtime checks so script doesn't throw errors
   ========================================================== */

// Use stable DOM methods to get references to the interactive
// elements. These are expected to exist in the markup but the
// code below guards against missing elements so developers can
// still open the page without a hard runtime error.
const menuBtn = document.getElementById("menuBtn"); // hamburger button
const closeBtn = document.getElementById("closeBtn"); // sidebar close button
const sidebar = document.getElementById("sidebar"); // sidebar panel element
const overlay = document.getElementById("overlay"); // page overlay shown when sidebar is open

// If any of the critical elements are missing, stop initialization
// but do so gracefully so the rest of the page still works.
if (!menuBtn || !sidebar || !overlay) {
   console.warn("Menu script: missing DOM elements, aborting menu setup.");
   // Keep user in control: don't throw — allow page to render.
}


/* ==========================================================
   2) Menu controls (open / close)
   - Functions to toggle sidebar and overlay visibility
   ========================================================== */

// Open the sidebar and update accessible state attributes.
function openMenu() {
   if (!sidebar || !overlay) return;
   sidebar.classList.add("open"); // slide sidebar in
   overlay.classList.add("show"); // fade in overlay

   // Accessibility: indicate the expanded state to assistive tech
   if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
   sidebar.setAttribute("aria-hidden", "false");
}

// Close the sidebar and restore accessible state attributes.
function closeMenu() {
   if (!sidebar || !overlay) return;
   sidebar.classList.remove("open"); // slide sidebar out
   overlay.classList.remove("show"); // fade out overlay

   if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
   sidebar.setAttribute("aria-hidden", "true");
}


/* ==========================================================
   3) Event listeners
   - Wire UI events to control functions, and keep user in
    control by providing toggle + Escape handling
   ========================================================== */

// Toggle behavior: clicking the menu button will open or close the
// sidebar so the user stays in control with a single control.
if (menuBtn) {
   // Ensure ARIA attributes exist and reflect the initial state
   menuBtn.setAttribute("aria-controls", "sidebar");
   menuBtn.setAttribute("aria-expanded", sidebar && sidebar.classList.contains("open") ? "true" : "false");

   menuBtn.addEventListener("click", function () {
      if (sidebar && sidebar.classList.contains("open")) {
         closeMenu();
      } else {
         openMenu();
      }
   });
}

// Close controls: close button, clicking overlay, and pressing Escape
if (closeBtn) closeBtn.addEventListener("click", closeMenu);
if (overlay) overlay.addEventListener("click", closeMenu);

// Allow the user to press Escape to close the sidebar — a common
// pattern that keeps the user in control of the UI.
window.addEventListener("keydown", function (e) {
   if (e.key === "Escape" || e.key === "Esc") {
      if (sidebar && sidebar.classList.contains("open")) {
         closeMenu();
      }
   }
});

// End of script
 
// Simple handler for lesson buttons used in markup (inline handlers)
function doneLesson() {
   // Minimal feedback — non-blocking and safe if DOM is missing
   try {
      // Optionally, show a subtle confirmation using alert for now
      // You can replace with a nicer UI (toast) later.
      alert('Marked as read. Good job!');
   } catch (e) {
      // swallow errors to avoid breaking the page
      console.warn('doneLesson handler failed', e);
   }
}

window.doneLesson = doneLesson;

// Global navigation: buttons with `data-href` should navigate like links.
document.addEventListener('DOMContentLoaded', () => {
   document.querySelectorAll('button[data-href]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
         // Prevent the generic navigation if the button is in a special locked/unlock state
         if (btn.classList.contains('locked') || btn.classList.contains('can-unlock')) {
            ev.preventDefault();
            return; // let the specialized handlers manage click behavior
         }
         const target = btn.dataset?.href || btn.getAttribute('data-href');
         if (target) window.location.href = target;
      });
   });

   // Update index lesson card if lesson 1 was completed (activity finished)
   try {
      const raw = localStorage.getItem('lesson1State');
      if (raw) {
         const s = JSON.parse(raw);
         if (s && s.lessonCompleted) {
            const card = document.getElementById('index-lesson1-card');
            if (card) card.style.borderLeft = '6px solid #4caf50';
            const btn = document.getElementById('index-lesson1-btn');
            if (btn) {
               btn.textContent = '✅ Completed — Review';
               btn.disabled = false; // allow review access
               btn.style.opacity = '';
            }
         }
      }
   } catch (e) {
      console.warn('Could not read lesson1State for index', e);
   }
   // Reset progress handler (clears lesson1State)
   const resetBtn = document.getElementById('reset-lesson1-btn');
   if (resetBtn) {
      // Set initial visibility based on stored state
      try {
         const rawState = localStorage.getItem('lesson1State');
         const s0 = rawState ? JSON.parse(rawState) : null;
         if (s0 && s0.lessonCompleted) {
            resetBtn.style.display = 'inline-flex';
         } else {
            resetBtn.style.display = 'none';
         }
      } catch (e) {
         // If parsing fails, hide the button for safety
         resetBtn.style.display = 'none';
      }

      resetBtn.addEventListener('click', () => {
         if (!confirm('Clear Lesson 1 progress? This cannot be undone.')) return;
         try {
            localStorage.removeItem('lesson1State');
            localStorage.removeItem('courseProgress');
         } catch (e) { console.warn('Could not clear lesson1State or courseProgress', e); }
         location.reload();
      });
   }

   // Generic gatekeeping utility for lessons
   // Buttons on the index with `data-lesson` will be checked against their
   // `data-prereq` attribute (comma-separated lesson numbers). This creates
   // a central place to add future lesson-locking logic.
   function parsePrereqString(str) {
      if (!str) return [];
      return String(str).split(',').map(s => Number(s.trim())).filter(Boolean);
   }

   function isPrereqsMet(prereqArr) {
      // Check `courseProgress` first (future-proof), then fallback to legacy
      // `lesson1State` when checking lesson 1 specifically.
      try {
         const rawCourse = localStorage.getItem('courseProgress');
         const course = rawCourse ? JSON.parse(rawCourse) : null;
         for (const n of prereqArr) {
            if (!n) continue;
            // prefer centralised courseProgress structure
            if (course && course.lessonsCompleted && typeof course.lessonsCompleted[n] !== 'undefined') {
               if (!course.lessonsCompleted[n]) return false;
               continue;
            }
            // legacy: only lesson 1 state exists today
            if (n === 1) {
               const raw1 = localStorage.getItem('lesson1State');
               const s1 = raw1 ? JSON.parse(raw1) : null;
               if (!(s1 && s1.lessonCompleted)) return false;
               continue;
            }
            // if we don't know about the lesson, treat as locked
            return false;
         }
         return true;
      } catch (e) {
         console.warn('isPrereqsMet failed', e);
         return false;
      }
   }

   // Course progress helpers: centralised unlocked/completed state
   function loadCourseProgress() {
      try {
         const raw = localStorage.getItem('courseProgress');
         return raw ? JSON.parse(raw) : { lessonsUnlocked: {}, lessonsCompleted: {} };
      } catch (e) { return { lessonsUnlocked: {}, lessonsCompleted: {} }; }
   }

   function saveCourseProgress(cp) {
      try { localStorage.setItem('courseProgress', JSON.stringify(cp)); } catch (e) { console.warn('Could not save courseProgress', e); }
   }

   function initLessonGates() {
      const cp = loadCourseProgress();
      document.querySelectorAll('button[data-lesson]').forEach(btn => {
         const prereqStr = btn.getAttribute('data-prereq') || '';
         const prereqArr = parsePrereqString(prereqStr);
         const href = btn.getAttribute('data-href');

         // store original label for restoration when unlocked
         if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent.trim();

         // mark card-level locked state for visual treatment
         const card = btn.closest('.card');
         const lessonNum = Number(btn.getAttribute('data-lesson')) || 0;
         const isUnlocked = !!(cp.lessonsUnlocked && cp.lessonsUnlocked[lessonNum]);

         if (prereqArr.length && !isPrereqsMet(prereqArr) && !isUnlocked) {
            // fully locked: user cannot unlock yet
            btn.classList.add('locked');
            if (card) card.classList.add('locked');
            btn.textContent = '🔒 Locked';
            btn.title = `Locked — complete lesson(s): ${prereqStr}`;
            // add a lock badge if not present
            if (card && !card.querySelector('.lock-badge')) {
               const span = document.createElement('span');
               span.className = 'lock-badge';
               span.innerHTML = '🔒 Locked';
               card.appendChild(span);
            }
         } else if (isUnlocked) {
            // already unlocked: show start label
            btn.classList.remove('locked');
            if (card) card.classList.remove('locked');
            btn.classList.remove('can-unlock');
            btn.title = '';
            if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
            if (card) {
               const lb = card.querySelector('.lock-badge'); if (lb) lb.remove();
            }
         } else if (prereqArr.length && isPrereqsMet(prereqArr)) {
            // prerequisites are met, but require explicit user action to unlock
            btn.classList.remove('locked');
            btn.classList.add('can-unlock');
            if (card) {
               card.classList.add('locked');
               card.classList.add('can-unlock');
               // ensure lock-badge exists to indicate pending-unlock
               if (!card.querySelector('.lock-badge')) {
                  const span = document.createElement('span');
                  span.className = 'lock-badge';
                  span.innerHTML = '🔓 Unlock';
                  card.appendChild(span);
               } else {
                  const lb = card.querySelector('.lock-badge'); if (lb) lb.innerHTML = '🔓 Unlock';
               }
            }
            btn.textContent = '🔓 Unlock';
            btn.title = 'Click to unlock this lesson';
         } else {
            // no prerequisites — normal behaviour
            btn.classList.remove('locked');
            if (card) card.classList.remove('locked');
            btn.title = '';
            // restore original label
            if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
            // remove lock badge if present
            if (card) {
               const lb = card.querySelector('.lock-badge'); if (lb) lb.remove();
            }
         }

         // Intercept clicks to provide guided navigation when locked or to
         // perform an explicit unlock when prerequisites were already met.
         btn.addEventListener('click', (ev) => {
            // If no prerequisites exist, follow link
            if (!prereqArr.length) {
               if (href) window.location.href = href;
               return;
            }

            // If this button is in the special "can-unlock" state, the user
            // explicitly unlocks by clicking it. Play the animation, then
            // restore visuals and show Start button (do not auto-navigate).
            if (btn.classList.contains('can-unlock')) {
               ev.preventDefault();
               // play unlock animation on card if available
               if (card) {
                  // temporarily update badge and visuals
                  const lb = card.querySelector('.lock-badge'); if (lb) lb.innerHTML = '🔓 Unlocking...';
                  card.classList.remove('can-unlock');
                  card.classList.add('unlock-animate');
                  // after animation, remove locked visuals, mark unlocked and show Start
                  card.addEventListener('animationend', () => {
                     card.classList.remove('unlock-animate');
                     card.classList.remove('locked');
                     const lb2 = card.querySelector('.lock-badge'); if (lb2) lb2.remove();
                     btn.classList.remove('can-unlock');
                     // persist unlocked state
                     const cp2 = loadCourseProgress();
                     cp2.lessonsUnlocked = cp2.lessonsUnlocked || {};
                     cp2.lessonsUnlocked[lessonNum] = true;
                     saveCourseProgress(cp2);
                     // restore original label to be the Start button
                     if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
                     // do not auto-navigate; user must press Start to continue
                  }, { once: true });
               } else {
                  // fallback: immediate unlock and show start label
                  btn.classList.remove('can-unlock');
                  const cp2 = loadCourseProgress();
                  cp2.lessonsUnlocked = cp2.lessonsUnlocked || {};
                  cp2.lessonsUnlocked[lessonNum] = true;
                  saveCourseProgress(cp2);
                  if (btn.dataset.origLabel) btn.textContent = btn.dataset.origLabel;
               }
               return;
            }

            // If prerequisites are met and unlocked, allow navigation
            const cpNow = loadCourseProgress();
            const nowUnlocked = !!(cpNow.lessonsUnlocked && cpNow.lessonsUnlocked[lessonNum]);
            if (isPrereqsMet(prereqArr) && nowUnlocked) {
               if (href) window.location.href = href;
               return;
            }

            // Still locked: guide the user to the missing prerequisite
            ev.preventDefault();
            const missing = prereqArr.find(n => !isPrereqsMet([n]));
            if (missing) {
               if (confirm(`You must complete Lesson ${missing} before starting this lesson. Go to Lesson ${missing} now?`)) {
                  window.location.href = `src/html/lesson-${missing}/lesson-${missing}.html`;
               }
            } else {
               alert('This lesson is locked. Complete the prerequisites first.');
            }
         });
      });
   }

   // Initialize gates for index buttons
   initLessonGates();
});
