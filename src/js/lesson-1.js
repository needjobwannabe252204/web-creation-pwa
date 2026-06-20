/* ==========================================================
   lesson-1.js — Lesson 1 (Web Dev Tools) interactive logic
   ----------------------------------------------------------
   Responsibilities:
     • Save / load topic + quiz + activity completion state
     • Update the progress bar on lesson-1.html
     • Quiz grading (checkQuiz / resetQuiz)
     • Image lightbox (openImage / closeImage)
     • Activity gate (startActivity — opens VS Code download)

   Dependencies:
     utils.js  — provides getEl, setCardBorder, showToast,
                 markLessonComplete, autoResizeTextarea.
     script.js — provides global navigation and sidebar.
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   1) STATE
   ---------------------------------------------------------- */

var completedTopics = { topic1: false, topic2: false, topic3: false, quiz: false };
var quizPassed      = false;
var quizAttempted   = false;
var lessonCompleted = false;

/* ----------------------------------------------------------
   2) PERSISTENCE
   ---------------------------------------------------------- */

var L1_KEY = 'lesson1State';

function saveState() {
    try {
        localStorage.setItem(L1_KEY, JSON.stringify({
            completedTopics: completedTopics,
            quizPassed     : !!quizPassed,
            quizAttempted  : !!quizAttempted,
            lessonCompleted: !!lessonCompleted
        }));
    } catch (e) { console.warn('[lesson-1] save failed:', e); }
}

function loadState() {
    try {
        var raw = localStorage.getItem(L1_KEY);
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!s) return;
        if (s.completedTopics) {
            Object.keys(completedTopics).forEach(function (k) {
                if (s.completedTopics[k] !== undefined)
                    completedTopics[k] = !!s.completedTopics[k];
            });
        }
        if (typeof s.quizPassed    === 'boolean') quizPassed    = s.quizPassed;
        if (typeof s.quizAttempted === 'boolean') quizAttempted = s.quizAttempted;
        if (typeof s.lessonCompleted === 'boolean') lessonCompleted = s.lessonCompleted;
    } catch (e) { console.warn('[lesson-1] load failed:', e); }
}

/* ----------------------------------------------------------
   3) PROGRESS UI
   ---------------------------------------------------------- */

function updateProgress() {
    var keys      = Object.keys(completedTopics);
    var completed = keys.filter(function (k) { return completedTopics[k]; }).length;
    var pct       = Math.round((completed / keys.length) * 100);

    var bar  = getEl('lessonProgress');
    var text = getEl('progressText');
    if (bar)  bar.style.width  = pct + '%';
    if (text) text.textContent = 'Progress: ' + pct + '%';

    /* Unlock / lock the activity button based on readiness */
    var activityBtn = getEl('activityBtn');
    var nextBtn     = getEl('nextLessonBtn');
    if (!activityBtn) return;

    var ready = completedTopics.topic1 && completedTopics.topic2 &&
                completedTopics.topic3 && quizPassed;
    activityBtn.innerHTML = ready ? '🚀 Install VS Code' : '🔒 Complete Lesson First';
    if (nextBtn) nextBtn.style.display = ready ? 'inline-block' : 'none';
}

/* ----------------------------------------------------------
   4) TOPIC COMPLETION
   ---------------------------------------------------------- */

/**
 * Mark a topic complete.
 * @param {number} topicNumber - 1, 2, or 3.
 */
function completeTopic(topicNumber) {
    completedTopics['topic' + topicNumber] = true;
    var btn = getEl('topic' + topicNumber + 'Btn');
    if (btn) {
        btn.innerHTML = '✅ Completed — Review';
        btn.disabled  = false; /* keep navigable for review */
        setCardBorder(btn.closest('.card'), '#4caf50');
    }
    updateProgress();
    saveState();
}
window.completeTopic = completeTopic;

/* ----------------------------------------------------------
   5) QUIZ
   ---------------------------------------------------------- */

/* Answer key — update when questions change */
var QUIZ_ANSWERS = { q1: 'b', q2: 'a', q3: 'a', q4: 'b', q5: 'a' };
var PASS_SCORE   = 3;

function _allQuestionsAnswered() {
    return Object.keys(QUIZ_ANSWERS).every(function (k) {
        return document.querySelector('input[name="' + k + '"]:checked');
    });
}

function _scoreQuiz() {
    return Object.keys(QUIZ_ANSWERS).reduce(function (acc, k) {
        var chosen = document.querySelector('input[name="' + k + '"]:checked');
        return acc + (chosen && chosen.value === QUIZ_ANSWERS[k] ? 1 : 0);
    }, 0);
}

function _showResult(html, color) {
    var box = getEl('result');
    if (!box) return;
    box.style.display    = 'block';
    box.style.background = color || '';
    box.innerHTML        = html;
}

function _swapQuizButtons(showReset) {
    var s = getEl('submitQuiz');
    var r = getEl('resetQuiz');
    if (s) s.style.display = showReset ? 'none'         : 'inline-block';
    if (r) r.style.display = showReset ? 'inline-block' : 'none';
}

function checkQuiz() {
    /* Topics must be done before the quiz unlocks */
    if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
        showToast('Complete Topics 1, 2, and 3 first.', 'info');
        return;
    }
    if (!_allQuestionsAnswered()) {
        showToast('Answer all questions before submitting.', 'info');
        return;
    }

    var total = Object.keys(QUIZ_ANSWERS).length;
    var score = _scoreQuiz();
    quizAttempted = true;

    if (score >= PASS_SCORE) {
        quizPassed = true;
        completedTopics.quiz = true;
        var label = score === total ? '🎉 Excellent!' : '👍 Good Job!';
        _showResult('🏆 Your Score: ' + score + '/' + total + '<br>' + label, '#2e7d32');
        setCardBorder(getEl('quiz-1') || getEl('quiz-card'), '#4caf50');
    } else {
        quizPassed = false;
        completedTopics.quiz = true; /* attempted even if failed */
        _showResult('🏆 Your Score: ' + score + '/' + total + '<br>📖 Review the lesson and try again.', '#c62828');
        setCardBorder(getEl('quiz-1') || getEl('quiz-card'), '#c62828');
    }

    _swapQuizButtons(true);
    updateProgress();
    saveState();
}

function resetQuiz() {
    document.querySelectorAll('#quiz-1 input[type="radio"]').forEach(function (r) {
        r.checked = false;
    });
    var box = getEl('result');
    if (box) { box.innerHTML = ''; box.style.display = 'none'; box.style.background = ''; }

    quizPassed = false; quizAttempted = false; completedTopics.quiz = false;
    setCardBorder(getEl('quiz-1') || getEl('quiz-card'), '');
    _swapQuizButtons(false);
    updateProgress();
    saveState();
}

/* Exposed for inline handlers in test-1.1.html */
window.checkQuiz = checkQuiz;
window.resetQuiz = resetQuiz;

/* ----------------------------------------------------------
   6) IMAGE LIGHTBOX
   ---------------------------------------------------------- */

function openImage(imgOrSrc) {
    var src = typeof imgOrSrc === 'string' ? imgOrSrc : (imgOrSrc && imgOrSrc.src) || '';
    var alt = (typeof imgOrSrc === 'object' && imgOrSrc && imgOrSrc.alt) || '';
    var modal    = getEl('imageModal');
    var modalImg = getEl('modalImage');
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = alt;
    modal.style.display = 'flex';
}

function closeImage() {
    var modal    = getEl('imageModal');
    var modalImg = getEl('modalImage');
    if (!modal) return;
    modal.style.display = 'none';
    if (modalImg) { modalImg.src = ''; modalImg.alt = ''; }
}

window.openImage  = openImage;
window.closeImage = closeImage;

/* ----------------------------------------------------------
   7) ACTIVITY GATE
   Opens the VS Code download page when prerequisites are met.
   ---------------------------------------------------------- */

function startActivity() {
    /* If already completed, allow review without re-checking */
    if (lessonCompleted) {
        window.open('https://code.visualstudio.com/', '_blank');
        return;
    }

    if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
        showToast('📚 Finish Topics 1, 2, and 3 first.', 'info'); return;
    }
    if (!quizAttempted) {
        showToast('📝 Complete the quiz first.', 'info'); return;
    }
    if (!quizPassed) {
        showToast('❌ Score at least ' + PASS_SCORE + '/5 to continue.', 'error'); return;
    }

    lessonCompleted = true;
    saveState();

    /* Write to central store so index.html and lesson-2 can unlock */
    if (typeof markLessonComplete === 'function') {
        markLessonComplete(1);
    }

    /* Update the activity card immediately */
    var activityCard = getEl('activity-card');
    if (activityCard) setCardBorder(activityCard, '#4caf50');
    var activityBtn = getEl('activityBtn');
    if (activityBtn) {
        activityBtn.innerHTML = '✅ Completed — Review';
        activityBtn.disabled  = false;
    }

    window.open('https://code.visualstudio.com/', '_blank');
}
window.startActivity = startActivity;

/* ----------------------------------------------------------
   8) INIT
   ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
    loadState();

    /* ---- Quiz button wiring ---- */
    var submitBtn = getEl('submitQuiz');
    var resetBtn  = getEl('resetQuiz');
    if (submitBtn) submitBtn.style.display = 'inline-block';
    if (resetBtn) {
        resetBtn.style.display = 'none';
        resetBtn.addEventListener('click', resetQuiz);
    }

    /* ---- Quiz gate button ---- */
    var quizBtn = getEl('quizBtn');
    if (quizBtn) {
        var quizUrl = quizBtn.dataset.href || quizBtn.getAttribute('data-href');
        var topicsDone = completedTopics.topic1 && completedTopics.topic2 && completedTopics.topic3;
        quizBtn.disabled      = !topicsDone;
        quizBtn.style.opacity = topicsDone ? '' : '0.6';
        quizBtn.title         = topicsDone ? '' : 'Complete Topics 1–3 to unlock the quiz';

        quizBtn.addEventListener('click', function () {
            if (!completedTopics.topic1 || !completedTopics.topic2 || !completedTopics.topic3) {
                showToast('Complete Topics 1, 2, and 3 before taking the quiz.', 'info');
                return;
            }
            if (quizUrl) window.location.href = quizUrl;
        });
    }

    /* ---- Activity button ---- */
    var activityBtn = getEl('activityBtn');
    if (activityBtn) activityBtn.addEventListener('click', startActivity);

    /* ---- Restore completed topic UI ---- */
    [1, 2, 3].forEach(function (i) {
        if (completedTopics['topic' + i]) {
            var btn = getEl('topic' + i + 'Btn');
            if (btn) {
                btn.innerHTML = '✅ Completed — Review';
                btn.disabled  = false;
                setCardBorder(btn.closest('.card'), '#4caf50');
            }
        }
    });

    /* ---- Restore quiz state ---- */
    if (quizAttempted) {
        _swapQuizButtons(true);
        var quizCard = getEl('quiz-1');
        setCardBorder(quizCard, quizPassed ? '#4caf50' : '#c62828');
    }

    /* ---- Restore activity completion state ---- */
    if (lessonCompleted) {
        var card = getEl('activity-card');
        if (card) setCardBorder(card, '#4caf50');
        if (activityBtn) {
            activityBtn.innerHTML = '✅ Completed — Review';
            activityBtn.disabled  = false;
        }
    }

    updateProgress();
});
