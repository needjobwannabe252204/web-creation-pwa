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

// ---------- Lesson 2 state (per-lesson, persisted) ----------
const completedTopics2 = {
    topic1: false,
    topic2: false,
    topic3: false,
    topic4: false,
    topic5: false,
    topic6: false,
    topic7: false,
    topic8: false,
    quiz: false
};

let quizPassed2 = false;
let quizAttempted2 = false;
let lessonCompleted2 = false;

function saveLesson2State() {
    try {
        const s = {
            completedTopics: completedTopics2,
            quizPassed: !!quizPassed2,
            quizAttempted: !!quizAttempted2,
            lessonCompleted: !!lessonCompleted2
        };
        localStorage.setItem('lesson2State', JSON.stringify(s));
    } catch (e) { console.warn('Could not save lesson2 state', e); }
}

function loadLesson2State() {
    try {
        const raw = localStorage.getItem('lesson2State');
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s && s.completedTopics) {
            Object.keys(completedTopics2).forEach(k => {
                if (s.completedTopics[k] !== undefined) completedTopics2[k] = !!s.completedTopics[k];
            });
        }
        if (s && typeof s.quizPassed === 'boolean') quizPassed2 = s.quizPassed;
        if (s && typeof s.quizAttempted === 'boolean') quizAttempted2 = s.quizAttempted;
        if (s && typeof s.lessonCompleted === 'boolean') lessonCompleted2 = s.lessonCompleted;
    } catch (e) { console.warn('Could not load lesson2 state', e); }
}

function setCardBorderColorForButtonHref(href, color) {
    try {
        const btn = document.querySelector(`button[data-href="${href}"]`);
        if (btn) {
            const card = btn.closest('.card');
            if (card) card.style.borderLeft = color ? `6px solid ${color}` : '';
        }
    } catch (e) { /* ignore */ }
}

function updateLesson2ProgressUI() {
    const total = Object.keys(completedTopics2).length;
    const completed = Object.values(completedTopics2).filter(Boolean).length;
    const percentage = Math.round((completed / total) * 100);

    const progressEl = document.getElementById('lessonProgress');
    if (progressEl) progressEl.style.width = `${percentage}%`;
    const progressText = document.getElementById('progressText');
    if (progressText) progressText.textContent = `Progress: ${percentage}%`;
}

function applyLesson2StateToUI() {
    // map topic flags to lesson-2.html buttons (topic-2.1.html..topic-2.8.html)
    for (let i = 1; i <= 8; i++) {
        const key = `topic${i}`;
        const href = `topic-2.${i}.html`;
        // note file names are topic-2.1.html etc. If element exists, set color
        if (completedTopics2[key]) {
            setCardBorderColorForButtonHref(href, '#4caf50'); // green
        }
    }

    // quiz card on test page: set green/red based on quizPassed2/attempted
    try {
        const quizCard = document.querySelector('.card .tag-bank')?.closest('.card') || document.querySelector('#quiz-card');
        if (quizCard) {
            if (quizAttempted2) {
                quizCard.style.borderLeft = quizPassed2 ? '6px solid #4caf50' : '6px solid #c62828';
            }
        }
    } catch (e) {}

    // If we're on a topic page, mark the topic card green when completed
    try {
        const path = window.location.pathname || window.location.href;
        for (let i = 1; i <= 8; i++) {
            const topicFile = `topic-2.${i}.html`;
            if (path.endsWith(topicFile) && completedTopics2[`topic${i}`]) {
                const firstCard = document.querySelector('.card');
                if (firstCard) firstCard.style.borderLeft = '6px solid #4caf50';
            }
        }
    } catch (e) {}

    updateLesson2ProgressUI();
}

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

// ===== Quiz controls (submit / validate / retry) — bind to existing HTML controls
document.addEventListener('DOMContentLoaded', function () {
    const tagBank = document.getElementById('tagBank') || document.querySelector('.tag-bank');
    const dropBoxes = document.querySelectorAll('.drop-box');

    // load persisted lesson-2 state and apply UI before binding
    loadLesson2State();
    applyLesson2StateToUI();

    if (!tagBank || dropBoxes.length === 0) return; // nothing to do on pages without the activity

    const submitBtn = document.getElementById('quizSubmit');
    const resetBtn = document.getElementById('quizReset');
    const returnBtn = document.getElementById('quizReturn');
    const nextBtn = document.getElementById('quizNext');
    const resultEl = document.getElementById('quizResult');

    // initial UI
    if (nextBtn) nextBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';

    function allBoxesFilled() {
        return Array.from(dropBoxes).every(b => b.firstChild);
    }

    function submitAnswers() {
        if (!allBoxesFilled()) {
            alert('Please place all tags into the boxes before submitting.');
            return;
        }

        let score = 0;
        dropBoxes.forEach(box => {
            const tagEl = box.firstChild;
            if (tagEl && tagEl.dataset && tagEl.dataset.tag === box.dataset.answer) score++;
        });

        if (resultEl) {
            resultEl.textContent = `🏆 Score: ${score}/${dropBoxes.length}`;
            resultEl.style.display = 'block';
        }

        // hide submit and show Reset button (match lesson-1 pattern)
        // mark attempted and pass/fail in lesson-2 state
        quizAttempted2 = true;
        quizPassed2 = (score === dropBoxes.length);
        // when quiz passed, mark topic1 completed
        if (quizPassed2) {
            completedTopics2.topic1 = true;
        }
        completedTopics2.quiz = true;
        saveLesson2State();
        applyLesson2StateToUI();


        if (submitBtn) submitBtn.style.display = 'none';
        if (resetBtn) {
            resetBtn.style.display = 'inline-block';
            // ensure single handler
            resetBtn.removeEventListener('click', resetQuiz);
            resetBtn.addEventListener('click', resetQuiz);
        }

        // show next button (proceed to next topic)
        if (nextBtn) nextBtn.style.display = 'inline-block';

        // return button should always be visible; wire it to go back to topic-2.1
        if (returnBtn) {
            returnBtn.addEventListener('click', () => { window.location.href = 'topic-2.1.html'; });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => { window.location.href = 'topic-2.2.html'; });
        }
    }

    function resetQuiz() {
        const tags = document.querySelectorAll('.tag');
        tags.forEach(t => {
            t.classList.remove('dragging');
            t.style.left = '';
            t.style.top = '';
            tagBank.appendChild(t);
        });

        dropBoxes.forEach(b => b.innerHTML = '');
        if (resultEl) {
            resultEl.textContent = '';
            resultEl.style.display = 'none';
        }

        // restore submit button behaviour and hide next/reset
        if (resetBtn) {
            resetBtn.removeEventListener('click', resetQuiz);
            resetBtn.style.display = 'none';
        }
        if (submitBtn) {
            submitBtn.style.display = 'inline-block';
            // ensure only one submit handler
            submitBtn.removeEventListener('click', resetQuiz);
            submitBtn.removeEventListener('click', submitAnswers);
            submitBtn.addEventListener('click', submitAnswers);
        }
        if (nextBtn) nextBtn.style.display = 'none';

        // clear lesson-2 quiz attempt state so user can retry
        quizAttempted2 = false;
        quizPassed2 = false;
        completedTopics2.quiz = false;
        saveLesson2State();
        applyLesson2StateToUI();
    }

    if (submitBtn) submitBtn.addEventListener('click', submitAnswers);
    if (returnBtn) {
        // Return always navigates back to topic-2.1
        returnBtn.addEventListener('click', () => { window.location.href = 'topic-2.1.html'; });
    }

    // === Heading quiz (test-2.2) logic binding ===
    const headingSubmit = document.getElementById('headingSubmit');
    const quizForm = document.getElementById('quizForm');
    const headingResult = document.getElementById('result');
    const headingReset = document.getElementById('headingReset');
    const headingReturn = document.getElementById('headingReturn');
    const headingNext = document.getElementById('headingNext');

    if (headingNext) headingNext.style.display = 'none';

    function allQuestionsAnswered(form, keys) {
        return keys.every(k => form.querySelector(`input[name="${k}"]:checked`));
    }

    function resetHeadingQuiz() {
        if (!quizForm) return;
        quizForm.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
        if (headingResult) {
            headingResult.innerHTML = '';
            headingResult.style.display = 'none';
        }
        // restore submit/reset UI
        if (headingReset) {
            headingReset.style.display = 'none';
            headingReset.removeEventListener('click', resetHeadingQuiz);
        }
        if (headingSubmit) headingSubmit.style.display = 'inline-block';
        if (headingNext) headingNext.style.display = 'none';

        // clear lesson-2 quiz attempt state
        quizAttempted2 = false;
        quizPassed2 = false;
        completedTopics2.quiz = false;
        // do not clear topic completion here (user may have passed earlier)
        saveLesson2State();
        applyLesson2StateToUI();
    }

    function gradeHeadingQuiz() {
        if (!quizForm || !headingResult) return;

        const keys = ['q1','q2','q3','q4','q5'];
        if (!allQuestionsAnswered(quizForm, keys)) {
            alert('Please answer all questions before submitting.');
            return;
        }

        const answers = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'd' };
        let score = 0;
        for (let key of keys) {
            const selected = quizForm.querySelector(`input[name="${key}"]:checked`);
            if (selected && selected.value === answers[key]) score++;
        }

        let message = '';
        if (score === 5) message = '🎉 Excellent! You scored 5/5!';
        else if (score >= 3) message = '👍 Good Job! You scored ' + score + '/5.';
        else message = '📚 Keep Practicing! You scored ' + score + '/5.';

        headingResult.innerHTML = message;
        if (headingResult) headingResult.style.display = 'block';

        // update lesson-2 state: mark quiz attempted and pass/fail
        quizAttempted2 = true;
        quizPassed2 = (score >= 3);
        completedTopics2.quiz = true;
        if (quizPassed2) {
            // mark topic2 as completed when this quiz passed
            completedTopics2.topic2 = true;
        }
        saveLesson2State();
        applyLesson2StateToUI();

        // swap submit -> show reset
        if (headingSubmit) headingSubmit.style.display = 'none';
        if (headingReset) {
            headingReset.style.display = 'inline-block';
            headingReset.addEventListener('click', resetHeadingQuiz);
        }

        // show next and wire navigation
        if (headingNext) {
            headingNext.style.display = 'inline-block';
            headingNext.addEventListener('click', () => { window.location.href = 'topic-2.3.html'; });
        }
        if (headingReturn) {
            headingReturn.addEventListener('click', () => { window.location.href = 'topic-2.2.html'; });
        }
    }

    if (headingSubmit && quizForm && headingResult) {
        headingSubmit.addEventListener('click', gradeHeadingQuiz);
    }
    if (headingResult) headingResult.style.display = 'none';
    if (headingReturn) {
        const url = headingReturn.dataset?.href || headingReturn.getAttribute('data-href');
        headingReturn.addEventListener('click', () => { if (url) window.location.href = url; });
    }
});