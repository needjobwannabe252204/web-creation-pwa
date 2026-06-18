const runBtn = document.getElementById("runBtn");

if (runBtn) {
    runBtn.addEventListener("click", function () {
        const editor = document.getElementById("editor");
        const output = document.getElementById("output");

        output.innerHTML = editor.value;
    });
}

/* ==========================================================
   LESSON 2 — lesson-specific behaviors
   Purpose: small utilities for Lesson 2 pages (code runner,
   activity helpers). Navigation buttons using `data-href` are
   handled globally by `src/js/script.js` to avoid duplication.
   ========================================================== */

// Attach click behavior to buttons that use data-href for navigation
// (Navigation handled globally by src/js/script.js)