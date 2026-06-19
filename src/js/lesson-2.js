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

// test-2.1 dragging function
const tags = document.querySelectorAll(".tag");
const boxes = document.querySelectorAll(".drop-box");

let currentTag = null;

tags.forEach(tag => {

    tag.addEventListener("pointerdown", startDrag);

});

function startDrag(e) {

    currentTag = e.target;

    currentTag.classList.add("dragging");

    moveTag(e);

    document.addEventListener("pointermove", moveTag);
    document.addEventListener("pointerup", stopDrag);
}

function moveTag(e) {

    if (!currentTag) return;

    currentTag.style.left = e.clientX - 40 + "px";
    currentTag.style.top = e.clientY - 20 + "px";
}

function stopDrag(e) {

    if (!currentTag) return;

    document.removeEventListener("pointermove", moveTag);
    document.removeEventListener("pointerup", stopDrag);

    const elementBelow = document.elementFromPoint(
        e.clientX,
        e.clientY
    );

    const box = elementBelow?.closest(".drop-box");

    if (box) {

        const existingTag = box.querySelector(".tag");

        if (existingTag) {

            document
                .getElementById("tagBank")
                .appendChild(existingTag);
        }

        currentTag.classList.remove("dragging");

        currentTag.style.left = "";
        currentTag.style.top = "";

        box.appendChild(currentTag);
    } else {

        currentTag.classList.remove("dragging");

        currentTag.style.left = "";
        currentTag.style.top = "";
    }

    currentTag = null;
}