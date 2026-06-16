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
