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
      btn.addEventListener('click', () => {
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
         } catch (e) { console.warn('Could not clear lesson1State', e); }
         location.reload();
      });
   }

   // Prevent entering Lesson 2 unless Lesson 1 is completed
   const lesson2Btn = document.getElementById('index-lesson2-btn');
   if (lesson2Btn) {
      lesson2Btn.addEventListener('click', (e) => {
         e.preventDefault();
         try {
            const raw = localStorage.getItem('lesson1State');
            const s = raw ? JSON.parse(raw) : null;
            if (s && s.lessonCompleted) {
               window.location.href = 'src/html/lesson-2/lesson-2.html';
            } else {
               if (confirm('You need to finish Lesson 1 before starting Lesson 2. Go to Lesson 1 now?')) {
                  window.location.href = 'src/html/lesson-1/lesson-1.html';
               }
            }
         } catch (err) {
            console.warn('lesson2 navigation check failed', err);
            // Fallback: allow navigation if something goes wrong with storage
            window.location.href = 'src/html/lesson-2/lesson-2.html';
         }
      });
   }
});
