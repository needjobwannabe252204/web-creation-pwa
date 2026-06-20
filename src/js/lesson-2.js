/* ==========================================================
   lesson-2.js — Lesson 2 (HTML Basics) interactive logic
   ----------------------------------------------------------
   Responsibilities:
     • Persist per-lesson topic/quiz completion state
     • Render progress bar on the lesson-2.html overview page
     • Drag-and-drop activity  (test-2.1)
     • Multiple-choice quiz    (test-2.2)
     • Code-editor activities  (test-2.3 through test-2.7)
     • Semantic-tags activity  (test-2.8) — global helper exposed

   Architecture:
     • All state lives in one `L2` object (no scattered globals)
     • One DOMContentLoaded handler calls small, focused init fns
     • Page-specific logic is detected by filename, preventing the
       "double handler on wrong page" bug that was in the old code
     • `bindCodeActivity()` eliminates the repeated submit/reset/next
       wiring that existed 5+ times in the original file

   Dependencies:
     utils.js must be loaded before this file.
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   1) STATE
   All mutable lesson state lives here in one place.
   ---------------------------------------------------------- */

var L2 = {
    completedTopics: {
        topic1: false, topic2: false, topic3: false, topic4: false,
        topic5: false, topic6: false, topic7: false, topic8: false,
        quiz: false
    },
    quizPassed    : false,
    quizAttempted : false,
    lessonCompleted: false
};

/* ----------------------------------------------------------
   2) PERSISTENCE
   ---------------------------------------------------------- */

var L2_KEY = 'lesson2State';

function saveL2State() {
    try {
        localStorage.setItem(L2_KEY, JSON.stringify({
            completedTopics: L2.completedTopics,
            quizPassed     : !!L2.quizPassed,
            quizAttempted  : !!L2.quizAttempted,
            lessonCompleted: !!L2.lessonCompleted
        }));
    } catch (e) { console.warn('[lesson-2] save failed:', e); }
}

function loadL2State() {
    try {
        var raw = localStorage.getItem(L2_KEY);
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!s) return;
        if (s.completedTopics) {
            Object.keys(L2.completedTopics).forEach(function (k) {
                if (s.completedTopics[k] !== undefined)
                    L2.completedTopics[k] = !!s.completedTopics[k];
            });
        }
        if (typeof s.quizPassed    === 'boolean') L2.quizPassed    = s.quizPassed;
        if (typeof s.quizAttempted === 'boolean') L2.quizAttempted = s.quizAttempted;
        if (typeof s.lessonCompleted === 'boolean') L2.lessonCompleted = s.lessonCompleted;
    } catch (e) { console.warn('[lesson-2] load failed:', e); }
}

/* ----------------------------------------------------------
   3) PROGRESS UI
   ---------------------------------------------------------- */

function updateProgressUI() {
    var keys      = Object.keys(L2.completedTopics);
    var completed = keys.filter(function (k) { return L2.completedTopics[k]; }).length;
    var pct       = Math.round((completed / keys.length) * 100);
    var bar  = document.getElementById('lessonProgress');
    var text = document.getElementById('progressText');
    if (bar)  bar.style.width  = pct + '%';
    if (text) text.textContent = 'Progress: ' + pct + '%';
}

/* Apply persisted state to whatever page elements exist. */
function applyL2StateToUI() {
    for (var i = 1; i <= 8; i++) {
        if (!L2.completedTopics['topic' + i]) continue;
        var btn = document.querySelector('button[data-href="topic-2.' + i + '.html"]');
        if (btn && btn.closest('.card')) {
            btn.closest('.card').style.borderLeft = '6px solid #4caf50';
        }
    }
    /* Green the first card when we are on a completed topic page */
    try {
        var page = (typeof getCurrentPage === 'function') ? getCurrentPage() : '';
        for (var j = 1; j <= 8; j++) {
            if (page === ('topic-2.' + j + '.html') && L2.completedTopics['topic' + j]) {
                var firstCard = document.querySelector('.card');
                if (firstCard) firstCard.style.borderLeft = '6px solid #4caf50';
            }
        }
    } catch (_) {}
    updateProgressUI();
}

/**
 * Mark a topic complete, save, and refresh the UI.
 * Idempotent — safe to call multiple times.
 * @param {number} n - topic number 1–8
 */
function markTopicCompleted(n) {
    var key = 'topic' + n;
    if (!L2.completedTopics.hasOwnProperty(key)) {
        console.warn('[lesson-2] Unknown topic key:', key); return;
    }
    if (L2.completedTopics[key]) return; /* already done */
    L2.completedTopics[key] = true;
    saveL2State();
    applyL2StateToUI();
}
window.markTopicCompleted = markTopicCompleted; /* expose for inline HTML handlers */

/* ----------------------------------------------------------
   4) CODE RUNNER
   Any page with #editor + #output + #runBtn gets live preview.
   Only one listener is attached, solving the triple-listener bug.
   ---------------------------------------------------------- */

function initCodeRunner() {
    var editorEl = document.getElementById('editor');
    var outputEl = document.getElementById('output');
    var runBtn   = document.getElementById('runBtn');
    if (!runBtn || !editorEl || !outputEl) return;

    if (typeof autoResizeTextarea === 'function') autoResizeTextarea(editorEl);

    runBtn.addEventListener('click', function () {
        outputEl.innerHTML = editorEl.value;
        /* Prevent preview links from navigating away from the lesson */
        outputEl.querySelectorAll('a').forEach(function (a) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
        });
        /* Hide any leftover result badge when the student re-runs */
        var resultIds = ['result','linkResult','imageResult','listResult','formResult','headingResult'];
        resultIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    });
}

/* ----------------------------------------------------------
   5) DRAG-AND-DROP  (test-2.1)
   Pointer-event based — works on desktop and touch.
   All variables are scoped inside initDragAndDrop().
   ---------------------------------------------------------- */

function initDragAndDrop() {
    var tagBank   = document.getElementById('tagBank') || document.querySelector('.tag-bank');
    var dropBoxes = document.querySelectorAll('.drop-box');
    var tags      = document.querySelectorAll('.tag');
    if (!tagBank || !dropBoxes.length || !tags.length) return;

    var currentTag = null; /* scoped — not a global */

    function moveTo(x, y) {
        currentTag.style.left = (x - 40) + 'px';
        currentTag.style.top  = (y - 20) + 'px';
    }

    function startDrag(e) {
        currentTag = e.currentTarget;
        currentTag.classList.add('dragging');
        moveTo(e.clientX, e.clientY);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup',   onStop);
    }

    function onMove(e) { if (currentTag) moveTo(e.clientX, e.clientY); }

    function onStop(e) {
        if (!currentTag) return;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup',   onStop);

        /* Temporarily hide the dragged tag for the hit test */
        currentTag.style.visibility = 'hidden';
        var below = document.elementFromPoint(e.clientX, e.clientY);
        currentTag.style.visibility = '';

        var box = below && below.closest('.drop-box');
        currentTag.classList.remove('dragging');
        currentTag.style.left = '';
        currentTag.style.top  = '';

        if (box) {
            /* Displace any tag already in the target box back to the bank */
            var existing = box.querySelector('.tag');
            if (existing) tagBank.appendChild(existing);
            box.appendChild(currentTag);
        }
        currentTag = null;
    }

    tags.forEach(function (tag) { tag.addEventListener('pointerdown', startDrag); });

    /* ---- Submit / Reset ---- */
    var submitBtn = document.getElementById('quizSubmit');
    var resetBtn  = document.getElementById('quizReset');
    var resultEl  = document.getElementById('quizResult');
    var nextBtn   = document.getElementById('quizNext');
    if (nextBtn)  nextBtn.style.display  = 'none';
    if (resetBtn) resetBtn.style.display = 'none';

    function allFilled() {
        return Array.from(dropBoxes).every(function (b) { return b.firstElementChild; });
    }

    function submit() {
        if (!allFilled()) {
            showToast('Place all tags into the boxes first.', 'info'); return;
        }
        var score = 0;
        dropBoxes.forEach(function (box) {
            var t = box.firstElementChild;
            if (t && t.dataset.tag === box.dataset.answer) score++;
        });
        var total  = dropBoxes.length;
        var passed = score === total;
        if (resultEl) {
            resultEl.textContent = passed
                ? '🎉 Perfect! ' + score + '/' + total
                : '🏆 Score: ' + score + '/' + total + ' — try again!';
            resultEl.classList.remove('error', 'success', 'quiz-result');
            resultEl.classList.add('quiz-result', passed ? 'success' : 'error');
            resultEl.style.display = 'block';
        }
        L2.quizAttempted = true;
        L2.quizPassed    = passed;
        L2.completedTopics.quiz = true;
        if (passed) L2.completedTopics.topic1 = true;
        saveL2State(); applyL2StateToUI();
        if (submitBtn) submitBtn.style.display = 'none';
        if (resetBtn)  resetBtn.style.display  = 'inline-block';
        if (nextBtn)   nextBtn.style.display   = 'inline-block';
    }

    function reset() {
        document.querySelectorAll('.tag').forEach(function (t) {
            t.classList.remove('dragging');
            t.style.left = ''; t.style.top = '';
            tagBank.appendChild(t);
        });
        dropBoxes.forEach(function (b) { b.innerHTML = ''; });
        if (resultEl) { resultEl.textContent = ''; resultEl.style.display = 'none'; }
        if (resetBtn)  resetBtn.style.display  = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-block';
        if (nextBtn)   nextBtn.style.display   = 'none';
        L2.quizAttempted = false; L2.quizPassed = false;
        L2.completedTopics.quiz = false;
        saveL2State(); applyL2StateToUI();
    }

    if (submitBtn) submitBtn.addEventListener('click', submit);
    if (resetBtn)  resetBtn.addEventListener('click',  reset);
}

/* ----------------------------------------------------------
   6) HEADING QUIZ  (test-2.2)
   ---------------------------------------------------------- */

/* Update this map when quiz questions change */
var HEADING_ANSWERS = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'd' };

function initHeadingQuiz() {
    var form      = document.getElementById('quizForm');
    var submitBtn = document.getElementById('headingSubmit');
    if (!form || !submitBtn) return;

    var resetBtn = document.getElementById('headingReset');
    var resultEl = document.getElementById('headingResult');
    var nextBtn  = document.getElementById('headingNext');
    if (nextBtn)  nextBtn.style.display  = 'none';
    if (resultEl) resultEl.style.display = 'none';

    function allAnswered() {
        return Object.keys(HEADING_ANSWERS).every(function (k) {
            return form.querySelector('input[name="' + k + '"]:checked');
        });
    }

    function grade() {
        if (!allAnswered()) {
            showToast('Answer all questions before submitting.', 'info'); return;
        }
        var score = 0;
        Object.keys(HEADING_ANSWERS).forEach(function (k) {
            var chosen = form.querySelector('input[name="' + k + '"]:checked');
            if (chosen && chosen.value === HEADING_ANSWERS[k]) score++;
        });
        var total  = Object.keys(HEADING_ANSWERS).length;
        var passed = score >= 3;
        if (resultEl) {
            resultEl.innerHTML = score === total ? '🎉 Excellent! ' + score + '/' + total
                               : score >= 3     ? '👍 Good Job! '  + score + '/' + total
                               :                  '📚 Keep practising — ' + score + '/' + total;
            resultEl.classList.remove('error', 'success', 'quiz-result');
            resultEl.classList.add('quiz-result', passed ? 'success' : 'error');
            resultEl.style.display = 'block';
        }
        L2.quizAttempted = true; L2.quizPassed = passed;
        L2.completedTopics.quiz = true;
        if (passed) L2.completedTopics.topic2 = true;
        saveL2State(); applyL2StateToUI();
        submitBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (nextBtn)  nextBtn.style.display  = 'inline-block';
    }

    function resetQ() {
        form.querySelectorAll('input[type="radio"]').forEach(function (r) { r.checked = false; });
        if (resultEl) { resultEl.innerHTML = ''; resultEl.style.display = 'none'; }
        if (resetBtn)  resetBtn.style.display  = 'none';
        submitBtn.style.display = 'inline-block';
        if (nextBtn) nextBtn.style.display = 'none';
        L2.quizAttempted = false; L2.quizPassed = false;
        L2.completedTopics.quiz = false;
        saveL2State(); applyL2StateToUI();
    }

    submitBtn.addEventListener('click', grade);
    if (resetBtn) resetBtn.addEventListener('click', resetQ);
}

/* ----------------------------------------------------------
   7) CODE-EDITOR ACTIVITY BINDER  (test-2.3 to test-2.7)
   Instead of copy-pasting the same submit/reset/next pattern
   five times, pass a config object to this one function.
   ---------------------------------------------------------- */

function bindCodeActivity(cfg) {
    var submitEl = document.getElementById(cfg.submitId);
    if (!submitEl) return; /* Not present on this page */

    var resetEl  = cfg.resetId ? document.getElementById(cfg.resetId) : null;
    var nextEl   = cfg.nextId  ? document.getElementById(cfg.nextId)  : null;
    var resultEl = cfg.resultId ? document.getElementById(cfg.resultId) : null;
    /* Fallback result element auto-detection */
    if (!resultEl) {
        var ids = ['result','linkResult','imageResult','listResult','formResult'];
        for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i]);
            if (el) { resultEl = el; break; }
        }
    }
    var editorEl = document.getElementById('editor');
    var outputEl = document.getElementById('output');

    function onSubmit() {
        var res = cfg.validate(editorEl, outputEl);
        if (!res.ok) {
            showToast(res.error || 'Check your code and try again.', 'error', 4000); return;
        }
        if (resultEl) {
            resultEl.innerHTML = cfg.successMsg || '✅ Activity complete!';
            resultEl.classList.remove('error');
            resultEl.classList.add('success', 'quiz-result');
            resultEl.style.display = 'block';
        }
        submitEl.style.display = 'none';
        if (resetEl) resetEl.style.display = 'inline-block';
        if (nextEl)  nextEl.style.display  = 'inline-block';
        markTopicCompleted(cfg.topicNum);
    }

    function onReset() {
        if (editorEl && cfg.getResetValue) editorEl.value = cfg.getResetValue();
        if (outputEl) outputEl.innerHTML = '';
        if (resultEl) {
            resultEl.innerHTML = '';
            resultEl.classList.remove('success', 'error');
            resultEl.style.display = 'none';
        }
        submitEl.style.display = 'inline-block';
        if (resetEl) resetEl.style.display = 'none';
        if (nextEl)  nextEl.style.display  = 'none';
        /* Un-mark so student can redo */
        L2.completedTopics['topic' + cfg.topicNum] = false;
        saveL2State(); applyL2StateToUI();
    }

    submitEl.addEventListener('click', onSubmit);
    if (resetEl) resetEl.addEventListener('click', onReset);
}

/* ----------------------------------------------------------
   7a) VALIDATORS — pure functions: (editorEl, outputEl) -> {ok, error?}
   ---------------------------------------------------------- */

function validateLinks(editorEl, outputEl) {
    if (!outputEl) return { ok: false, error: 'Output area not found.' };
    var doc     = new DOMParser().parseFromString(outputEl.innerHTML || '', 'text/html');
    var anchors = Array.from(doc.querySelectorAll('a'));
    if (!anchors.length)  return { ok: false, error: 'No <a> tag found. Add one linking to Google, Facebook, or YouTube.' };
    if (anchors.length>1) return { ok: false, error: 'Include exactly one <a> tag.' };
    var href    = (anchors[0].getAttribute('href') || '').toLowerCase();
    var allowed = ['https://www.google.com','https://www.facebook.com','https://www.youtube.com'];
    if (!allowed.some(function(k){return href.includes(k);}))
        return { ok: false, error: 'Link must point to Google, Facebook, or YouTube.' };
    return { ok: true };
}

function validateImage(editorEl, outputEl) {
    if (!outputEl) return { ok: false, error: 'Output area not found.' };
    var doc  = new DOMParser().parseFromString(outputEl.innerHTML || '', 'text/html');
    var imgs = Array.from(doc.querySelectorAll('img'));
    if (!imgs.length)   return { ok: false, error: 'No <img> tag found.' };
    if (imgs.length > 1) return { ok: false, error: 'Include exactly one <img> tag.' };
    if (!imgs[0].getAttribute('src')) return { ok: false, error: 'Image is missing a src attribute.' };
    return { ok: true };
}

function validateList(editorEl, outputEl) {
    if (!outputEl) return { ok: false, error: 'Output area not found.' };
    var doc = new DOMParser().parseFromString(outputEl.innerHTML || '', 'text/html');
    var ols = Array.from(doc.querySelectorAll('ol'));
    if (!ols.length)    return { ok: false, error: 'No <ol> found. Use <ol> to create a numbered list.' };
    if (ols.length > 1) return { ok: false, error: 'Include exactly one <ol>.' };
    return { ok: true };
}

function validateTable(editorEl, outputEl) {
    /* Check raw source to avoid false-positive from browser-implied rows */
    var raw = editorEl ? (editorEl.value || '').toLowerCase() : '';
    if (!raw.includes('<tr')) return { ok: false, error: 'No <tr> found. Use <tr> to create table rows.' };
    if (!outputEl) return { ok: false, error: 'Output area not found.' };
    var doc = new DOMParser().parseFromString(outputEl.innerHTML || '', 'text/html');
    if (!doc.querySelectorAll('tr').length) return { ok: false, error: 'No table rows visible in preview.' };
    return { ok: true };
}

function validateForm(editorEl) {
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase();
    if (!code.includes('for="username"') && !code.includes("for='username'"))
        return { ok: false, error: 'Fill the first blank with username (for="username").' };
    if (!code.includes('for="email"') && !code.includes("for='email'"))
        return { ok: false, error: 'Fill the second blank with email (for="email").' };
    if (!code.includes('type="text"') && !code.includes("type='text'"))
        return { ok: false, error: 'Add an <input type="text"> for the username field.' };
    if (!code.includes('type="email"') && !code.includes("type='email'"))
        return { ok: false, error: 'Add an <input type="email"> for the email field.' };
    return { ok: true };
}

/* ----------------------------------------------------------
   7b) SEMANTIC HTML VALIDATOR  (test-2.8)
   Exposed globally so the inline onclick in the HTML still works.
   ---------------------------------------------------------- */

function checkSemanticTags() {
    var editorEl   = document.getElementById('editor');
    var feedbackEl = document.getElementById('feedback');
    var outputEl   = document.getElementById('output');
    if (!editorEl || !feedbackEl) return;

    var code     = editorEl.value;
    var required = ['header','nav','main','section','article','aside','footer'];
    var missing  = required.filter(function (tag) {
        return !code.includes('<' + tag) || !code.includes('</' + tag + '>');
    });

    if (missing.length) {
        feedbackEl.className = 'feedback error';
        feedbackEl.innerHTML = '❌ Missing or incorrect tag(s): ' + missing.join(', ');
        if (outputEl) outputEl.srcdoc = '';
        return;
    }

    feedbackEl.className = 'feedback success';
    feedbackEl.innerHTML = '✅ Great job! All required semantic tags are present.';
    if (outputEl) outputEl.srcdoc = code;
    markTopicCompleted(8);
}
window.checkSemanticTags = checkSemanticTags;

/* ----------------------------------------------------------
   8) RESET DEFAULTS
   Editor starter content for each activity.
   Centralised here so they're easy to update.
   ---------------------------------------------------------- */

var RESET_VALS = {
    '23': '',
    '24': '<img ____="https://picsum.photos/400/250" alt="Beautiful Image">',
    '25': '<____>\n    <li>Plan</li>\n    <li>Code</li>\n    <li>Test</li>\n</ol>',
    '26': '<____>\n    <td>John</td>\n    <td>15</td>\n</tr>\n</table>',
    '27': '<form>\n\n    <label for="____">\n        Username:\n    </label>\n    <input type="text">\n\n    <label for="____">\n        Email:\n    </label>\n    <input type="email">\n\n</form>'
};

/* ----------------------------------------------------------
   Per-page configuration for code activities (test-2.3..2.7)
   Makes it easy to change submit/reset/next/result ids and
   validation logic without editing multiple files.
   Keys are page filenames.
   ---------------------------------------------------------- */
var PAGE_CONFIG = {
    'test-2.3.html': {
        submitId: 'linkSubmit', resetId: 'linkReset', nextId: 'linkNext', resultId: 'linkResult',
        validate: validateLinks, successMsg: '✅ Activity complete — link is correct.', topicNum: 3, resetKey: '23'
    },
    'test-2.4.html': {
        submitId: 'imageSubmit', resetId: 'imageReset', nextId: 'imageNext', resultId: 'imageResult',
        validate: validateImage, successMsg: '✅ Activity complete — image displayed correctly.', topicNum: 4, resetKey: '24'
    },
    'test-2.5.html': {
        submitId: 'listSubmit', resetId: 'listReset', nextId: 'listNext', resultId: 'listResult',
        validate: validateList, successMsg: '✅ Activity complete — list looks good.', topicNum: 5, resetKey: '25'
    },
    'test-2.6.html': {
        submitId: 'tableSubmit', resetId: 'tableReset', nextId: 'tableNext', resultId: 'result',
        validate: validateTable, successMsg: '✅ Activity complete — table rows look good.', topicNum: 6, resetKey: '26'
    },
    'test-2.7.html': {
        submitId: 'formSubmit', resetId: 'formReset', nextId: 'tableNext', resultId: 'result',
        validate: function(e){ return validateForm(e); }, successMsg: '✅ Activity complete — form labels are correct.', topicNum: 7, resetKey: '27'
    }
};

function registerPageFromConfig(page) {
    var cfg = PAGE_CONFIG[page];
    if (!cfg) return;
    var bindCfg = {
        submitId: cfg.submitId,
        resetId: cfg.resetId,
        nextId: cfg.nextId,
        resultId: cfg.resultId,
        validate: cfg.validate,
        successMsg: cfg.successMsg,
        topicNum: cfg.topicNum,
        getResetValue: function () { return RESET_VALS[cfg.resetKey] || ''; }
    };
    bindCodeActivity(bindCfg);
}


/* ----------------------------------------------------------
   Helper: Enhance nav buttons
   - Adds consistent classes to navigation buttons (Next/Return)
   - Only affects buttons inside `.nav-buttons` containers so
     run buttons and other controls are untouched.
   ---------------------------------------------------------- */
function enhanceNavButtons() {
    var navBtns = document.querySelectorAll('.nav-buttons button');
    if (!navBtns || !navBtns.length) return;
    navBtns.forEach(function (btn) {
        var txt = (btn.textContent || '').trim().toLowerCase();
        // Add base btn class if missing so appearance is consistent
        if (!btn.classList.contains('btn')) btn.classList.add('btn');
        // Identify Next buttons by text or id and make them primary
        if (txt.includes('next') || txt.indexOf('→') !== -1 || (btn.id && btn.id.toLowerCase().indexOf('next') !== -1)) {
            if (!btn.classList.contains('btn-primary')) btn.classList.add('btn-primary');
        }
    });
}


/* ----------------------------------------------------------
   9) INIT — detect the page and wire only what is needed
   ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {

    loadL2State();
    applyL2StateToUI();
    initCodeRunner(); /* safe on every page — no-ops if elements missing */
    enhanceNavButtons(); /* ensure Next buttons look consistent across tests */

    var page = (typeof getCurrentPage === 'function') ? getCurrentPage() : '';

    if (page === 'test-2.1.html') {
        initDragAndDrop();
    } else if (page === 'test-2.2.html') {
        initHeadingQuiz();
    } else {
        /* For test-2.3 .. test-2.7, use the centralized PAGE_CONFIG */
        registerPageFromConfig(page);
    }
    /* test-2.8 uses an inline onclick that calls checkSemanticTags() directly */
    /* lesson-2.html and topic pages: applyL2StateToUI already handled UI updates */

});
