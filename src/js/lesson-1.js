/* ==========================================================
    LESSON 1 — lesson-specific behaviors
    Purpose: handles progress state, per-lesson quiz logic, image
    modal, and activity gating for Lesson 1 pages. This file is
    intentionally lesson-scoped — global UI is in `script.js`.

    Exports (attached to `window`):
    - openImage, closeImage, completeTopic, checkQuiz, resetQuiz,
      startActivity
    ========================================================== */

"use strict";

/* ---------- State ---------- */
const completedTopics = {
    topic1: false,
    topic2: false,
    topic3: false,
    quiz: false
};

let quizPassed = false;      // true when user scores >= 3
let quizAttempted = false;   // true when user submitted the quiz
let lessonCompleted = false; // true when activity finished (Install VS Code)

/* ---------- Persistence (localStorage) ---------- */
function saveState() {
    try {
        const state = {
            completedTopics: completedTopics,
            quizPassed: !!quizPassed,
            quizAttempted: !!quizAttempted,
            lessonCompleted: !!lessonCompleted
        };
        localStorage.setItem('lesson1State', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save lesson state', e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem('lesson1State');
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s && s.completedTopics) {
            // only copy known keys
            Object.keys(completedTopics).forEach(k => {
                if (s.completedTopics[k] !== undefined) completedTopics[k] = !!s.completedTopics[k];
            });
        }
        if (s && typeof s.quizPassed === 'boolean') quizPassed = s.quizPassed;
        if (s && typeof s.quizAttempted === 'boolean') quizAttempted = s.quizAttempted;
        if (s && typeof s.lessonCompleted === 'boolean') lessonCompleted = s.lessonCompleted;
    } catch (e) {
        console.warn('Could not load lesson state', e);
    }
}


/* ---------- Helpers ---------- */
function getEl(id) { return document.getElementById(id); }

function setCardBorder(cardEl, color) {
    if (!cardEl) return;
    cardEl.style.borderLeft = color ? `6px solid ${color}` : "";
}

function showResult(text, color) {
    const resultBox = getEl('result');
    if (!resultBox) return;
    resultBox.style.display = 'block';
    resultBox.style.background = color || '';
    resultBox.innerHTML = text;
}

function getQuizCard() {
    return getEl('quiz-1') || getEl('quiz-card');
}

function swapSubmitReset(showReset = true) {
    const submitBtn = getEl('submitQuiz');
    const resetBtn = getEl('resetQuiz');
    if (submitBtn) submitBtn.style.display = showReset ? 'none' : 'inline-block';
    if (resetBtn) resetBtn.style.display = showReset ? 'inline-block' : 'none';
}


/* ---------- Progress & Activity ---------- */
function updateProgress() {
    const total = Object.keys(completedTopics).length;
    const completed = Object.values(completedTopics).filter(Boolean).length;
    const percentage = Math.round((completed / total) * 100);

    const progressEl = getEl('lessonProgress');
    if (progressEl) progressEl.style.width = `${percentage}%`;

    const progressText = getEl('progressText');
    if (progressText) progressText.textContent = `Progress: ${percentage}%`;

    const activityBtn = getEl('activityBtn');
    const nextBtn = getEl('nextLessonBtn');
    if (!activityBtn) return;

    if (completedTopics.topic1 && completedTopics.topic2 && completedTopics.topic3 && quizPassed) {
        activityBtn.innerHTML = '🚀 Install VS Code';
        if (nextBtn) nextBtn.style.display = 'inline-block';
    } else {
        activityBtn.innerHTML = '🔒 Complete Lesson First';
        if (nextBtn) nextBtn.style.display = 'none';
    }
}

function completeTopic(topicNumber) {
    completedTopics[`topic${topicNumber}`] = true;
    const btn = getEl(`topic${topicNumber}Btn`);
    if (btn) {
        btn.innerHTML = '✅ Completed — Review';
        // keep the button enabled so the user can review the topic
        btn.disabled = false;
        setCardBorder(btn.closest('.card'), '#4caf50');
    }
    updateProgress();
    saveState();
}


/* ---------- Quiz ---------- */
function _allQuestionsAnswered() {
    return [1,2,3,4,5].every(i => document.querySelector(`input[name="q${i}"]:checked`));
}

function _scoreQuiz() {
    let score = 0;
    if (document.querySelector('input[name="q1"]:checked')?.value === 'b') score++;
    if (document.querySelector('input[name="q2"]:checked')?.value === 'a') score++;
    if (document.querySelector('input[name="q3"]:checked')?.value === 'a') score++;
    if (document.querySelector('input[name="q4"]:checked')?.value === 'b') score++;
    if (document.querySelector('input[name="q5"]:checked')?.value === 'a') score++;
    return score;
}

function checkQuiz() {
    // guard: topics must be completed first
    if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
        alert('Please complete Topics 1, 2, and 3 first.');
        return;
    }

    if (!_allQuestionsAnswered()) {
        alert('Please answer all questions before submitting.');
        return;
    }

    // mark attempted
    quizAttempted = true;

    const score = _scoreQuiz();
    const quizCard = getQuizCard();

    if (score >= 3) {
        quizPassed = true;
        completedTopics.quiz = true;
        const message = score === 5 ? '🎉 Excellent!' : '👍 Good Job!';
        showResult(`🏆 Your Score: ${score}/5<br>${message}`, '#2e7d32');
        setCardBorder(quizCard, '#4caf50');
    } else {
        quizPassed = false;
        completedTopics.quiz = true; // mark as attempted (even if failed)
        showResult(`🏆 Your Score: ${score}/5<br>📖 Review the lesson and try again.`, '#c62828');
        setCardBorder(quizCard, '#c62828');
    }

    swapSubmitReset(true);
    updateProgress();
    saveState();
}

function resetQuiz() {
    // clear radios
    document.querySelectorAll('#quiz-1 input[type="radio"]').forEach(r => r.checked = false);

    const resultBox = getEl('result');
    if (resultBox) {
        resultBox.innerHTML = '';
        resultBox.style.display = 'none';
        resultBox.style.background = '';
    }

    quizPassed = false;
    quizAttempted = false;
    completedTopics.quiz = false;

    setCardBorder(getQuizCard(), '');
    swapSubmitReset(false);
    updateProgress();
    saveState();
}


/* ---------- Image modal ---------- */
function openImage(imgOrSrc) {
    const modalImage = getEl('modalImage');
    const imageModal = getEl('imageModal');
    const src = typeof imgOrSrc === 'string' ? imgOrSrc : imgOrSrc?.src || '';
    const alt = typeof imgOrSrc === 'object' ? imgOrSrc?.alt || '' : '';
    if (!modalImage || !imageModal) return;
    modalImage.src = src;
    modalImage.alt = alt;
    imageModal.style.display = 'flex';
}

function closeImage() {
    const modalImage = getEl('modalImage');
    const imageModal = getEl('imageModal');
    if (!imageModal) return;
    imageModal.style.display = 'none';
    if (modalImage) { modalImage.src = ''; modalImage.alt = ''; }
}


/* ---------- Activity starter ---------- */
function startActivity() {
    // If lesson already completed, allow review access without re-checking
    if (lessonCompleted) {
        window.open('https://code.visualstudio.com/', '_blank');
        return;
    }

    if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
        alert('📚 Please finish Topics 1, 2, and 3 first.');
        return;
    }
    if (!quizAttempted) {
        alert('📝 Please complete the quiz first.');
        return;
    }
    if (!quizPassed) {
        alert('❌ You must score at least 3/5 to continue.');
        return;
    }

    // mark lesson completed and persist state so index can reflect completion
    lessonCompleted = true;
    saveState();
    // update UI immediately so activity card shows completed state
    try {
        const activityCard = getEl('activity-card');
        if (activityCard) setCardBorder(activityCard, '#4caf50');
        const activityBtnEl = getEl('activityBtn');
        if (activityBtnEl) {
            activityBtnEl.innerHTML = '✅ Completed — Review';
            activityBtnEl.disabled = false;
            activityBtnEl.style.opacity = '';
        }
    } catch (e) { console.warn(e); }

    window.open('https://code.visualstudio.com/', '_blank');
}


/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    // restore persisted state from previous page visits
    loadState();

    const submitBtn = getEl('submitQuiz');
    const resetBtn = getEl('resetQuiz');
    if (submitBtn) submitBtn.style.display = 'inline-block';
    if (resetBtn) {
        resetBtn.style.display = 'none';
        resetBtn.addEventListener('click', resetQuiz);
    }

    const activityBtn = getEl('activityBtn');
    if (activityBtn) activityBtn.addEventListener('click', startActivity);

    const returnBtn = getEl('returnHomeBtn');
    if (returnBtn) {
        const url = returnBtn.dataset?.href || returnBtn.getAttribute('data-href');
        returnBtn.addEventListener('click', () => { if (url) window.location.href = url; });
    }

    const nextNavBtn = getEl('nextLessonBtn');
    if (nextNavBtn) {
        const url2 = nextNavBtn.dataset?.href || nextNavBtn.getAttribute('data-href');
        nextNavBtn.addEventListener('click', () => { if (url2) window.location.href = url2; });
    }

    // quiz navigation gating: prevent entering quiz page until topics are done
    const quizBtn = getEl('quizBtn');
    if (quizBtn) {
        const quizUrl = quizBtn.dataset?.href || quizBtn.getAttribute('data-href');
        // set initial disabled state if topics incomplete
        if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
            quizBtn.disabled = true;
            quizBtn.style.opacity = '0.6';
            quizBtn.title = 'Complete Topics 1–3 to unlock the quiz';
        } else {
            quizBtn.disabled = false;
            quizBtn.style.opacity = '';
            quizBtn.title = '';
        }

        quizBtn.addEventListener('click', () => {
            if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
                alert('Please complete Topics 1, 2, and 3 before taking the quiz.');
                return;
            }
            if (quizUrl) window.location.href = quizUrl;
        });
    }

    // restore UI for completed topics (works across lesson pages)
    [1,2,3].forEach(i => {
        try {
            if (completedTopics[`topic${i}`]) {
                const btn = getEl(`topic${i}Btn`);
                if (btn) {
                    btn.innerHTML = '✅ Completed — Review';
                    // keep button enabled for review access
                    btn.disabled = false;
                    setCardBorder(btn.closest('.card'), '#4caf50');
                }
            }
        } catch (e) { /* ignore missing elements on some pages */ }
    });

    // if quiz already attempted, switch buttons to show reset
    if (quizAttempted) swapSubmitReset(true);
    if (quizAttempted && typeof quizPassed === 'boolean') {
        const quizCard = getEl('quiz-1');
        setCardBorder(quizCard, quizPassed ? '#4caf50' : '#c62828');
    }

    // Show activity completed state if lessonCompleted
    if (lessonCompleted) {
        const activityCard = getEl('activity-card');
        if (activityCard) setCardBorder(activityCard, '#4caf50');
        if (activityBtn) {
            activityBtn.innerHTML = '✅ Completed — Review';
            activityBtn.disabled = false; // allow review
            activityBtn.style.opacity = '';
        }
    }

    updateProgress();
});


/* ---------- Exports (global for inline HTML handlers) ---------- */
window.openImage = openImage;
window.closeImage = closeImage;
window.completeTopic = completeTopic;
window.checkQuiz = checkQuiz;
window.resetQuiz = resetQuiz;
window.startActivity = startActivity;

