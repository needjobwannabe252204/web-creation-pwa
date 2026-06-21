/* ==========================================================
   lesson-3.js — Lesson 3 (CSS Styling) interactive logic
   ----------------------------------------------------------
   Responsibilities:
     1. Tracks which topics the student has visited/completed
     2. Updates the progress bar on lesson-3.html
     3. Marks the lesson complete when all topics are done
     4. Gates the "Lesson 4" button until the lesson is done
     5. Wires up interactive CSS activities on test-3.1–3.7

   Dependencies:
     utils.js must be loaded before this file.
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   1) STATE
   ---------------------------------------------------------- */

var L3 = {
    /* true when the student completes each topic's activity */
    visitedTopics: {
        topic1: false, topic2: false, topic3: false,
        topic4: false, topic5: false, topic6: false, topic7: false
    },
    activityCompleted: false,   /* set when the student presses the final "Done" button */
    lessonCompleted: false
};

var TOTAL_L3_TOPICS = 7;
var L3_KEY = 'lesson3State';

/* ----------------------------------------------------------
   2) PERSISTENCE
   ---------------------------------------------------------- */

function saveL3State() {
    try {
        localStorage.setItem(L3_KEY, JSON.stringify({
            visitedTopics    : L3.visitedTopics,
            activityCompleted: !!L3.activityCompleted,
            lessonCompleted  : !!L3.lessonCompleted
        }));
    } catch (e) { console.warn('[lesson-3] save failed:', e); }
}

function loadL3State() {
    try {
        var raw = localStorage.getItem(L3_KEY);
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!s) return;
        if (s.visitedTopics) {
            Object.keys(L3.visitedTopics).forEach(function (k) {
                if (s.visitedTopics[k] !== undefined)
                    L3.visitedTopics[k] = !!s.visitedTopics[k];
            });
        }
        if (typeof s.activityCompleted === 'boolean') L3.activityCompleted = s.activityCompleted;
        if (typeof s.lessonCompleted   === 'boolean') L3.lessonCompleted   = s.lessonCompleted;
    } catch (e) { console.warn('[lesson-3] load failed:', e); }
}

function resetL3State() {
    try {
        localStorage.removeItem(L3_KEY);
        L3.visitedTopics = { topic1:false, topic2:false, topic3:false, topic4:false, topic5:false, topic6:false, topic7:false };
        L3.activityCompleted = false;
        L3.lessonCompleted = false;
        applyL3StateToUI();
        saveL3State();
        console.info('[lesson-3] resetL3State: cleared lesson3State from localStorage');
    } catch (e) { console.warn('[lesson-3] resetL3State failed:', e); }
}
window.resetL3State = resetL3State;

/* ----------------------------------------------------------
   3) PROGRESS UI
   ---------------------------------------------------------- */

function updateL3ProgressUI() {
    /* Denominator = 7 topics + 1 for the final activity.
       Topics alone max out at 7/8 = 87%; activity button pushes to 100%. */
    var keys    = Object.keys(L3.visitedTopics);
    var visited = keys.filter(function (k) { return L3.visitedTopics[k]; }).length;
    var total   = keys.length + 1;   /* +1 slot for the activity */
    var completed = visited + (L3.activityCompleted ? 1 : 0);
    var pct     = Math.round((completed / total) * 100);

    var bar  = document.getElementById('lessonProgress');
    var text = document.getElementById('progressText');
    if (bar)  bar.style.width  = pct + '%';
    if (text) text.textContent = 'Progress: ' + pct + '%';
}

function applyL3StateToUI() {
    for (var i = 1; i <= TOTAL_L3_TOPICS; i++) {
        if (!L3.visitedTopics['topic' + i]) continue;
        var btn = document.querySelector('button[data-href="topic-3.' + i + '.html"]');
        if (btn && btn.closest('.card')) {
            btn.closest('.card').style.borderLeft = '6px solid #4caf50';
        }
    }
    /* Restore activity-card green border on page load if already completed */
    if (L3.activityCompleted || L3.lessonCompleted) {
        var actCard = document.getElementById('activity-card');
        if (actCard) setCardBorder(actCard, '#4caf50');
    }
    updateL3ProgressUI();

    /* Update the lesson-3 done button state */
    _updateDoneBtn();
}

function _updateDoneBtn() {
    var doneBtn = document.getElementById('doneBtn');
    if (!doneBtn) return;
    var allTopicsDone = Object.keys(L3.visitedTopics).every(function (k) {
        return L3.visitedTopics[k];
    });

    if (L3.activityCompleted || L3.lessonCompleted) {
        /* Already completed — show done state, turn card green, show Next */
        doneBtn.textContent = '✅ Lesson Complete!';
        doneBtn.disabled = true;
        var card = document.getElementById('activity-card');
        if (card) setCardBorder(card, '#4caf50');
        var nextBtn = document.getElementById('nextLessonBtn');
        if (nextBtn) nextBtn.style.display = 'inline-block';
    } else if (allTopicsDone) {
        /* Topics all done — unlock the button so the student can click it */
        doneBtn.textContent = '✅ Mark Lesson Complete';
        doneBtn.disabled = false;
        doneBtn.classList.remove('locked');
        /* Wire the click only once using a one-time listener flag */
        if (!doneBtn._l3Wired) {
            doneBtn._l3Wired = true;
            doneBtn.addEventListener('click', function onDoneClick() {
                L3.activityCompleted = true;
                L3.lessonCompleted   = true;
                saveL3State();
                if (typeof markLessonComplete === 'function') markLessonComplete(3);
                var actCard = document.getElementById('activity-card');
                if (actCard) setCardBorder(actCard, '#4caf50');
                doneBtn.textContent = '✅ Lesson Complete!';
                doneBtn.disabled    = true;
                var next = document.getElementById('nextLessonBtn');
                if (next) next.style.display = 'inline-block';
                updateL3ProgressUI();
                showToast('🎉 Lesson 3 complete! Lesson 4 is now unlocked.', 'success', 4000);
            });
        }
    } else {
        doneBtn.textContent = '🔒 Complete Topics First';
        doneBtn.disabled = true;
        doneBtn.classList.add('locked');
    }
}

/* ----------------------------------------------------------
   4b) Overview handlers
   Attach click handlers to the lesson overview's topic buttons
   so clicking "Learn →" marks the topic visited (persisted)
   before navigation occurs.
   ---------------------------------------------------------- */
function initL3OverviewHandlers() {
    document.querySelectorAll('button[data-href]').forEach(function (btn) {
        var href = btn.getAttribute('data-href') || '';
        var m = href.match(/^topic-3\.(\d+)\.html$/);
        if (m) {
            var n = Number(m[1]);
            btn.addEventListener('click', function () {
                try {
                    L3.visitedTopics['topic' + n] = true;
                    saveL3State();
                    applyL3StateToUI();
                } catch (_) {}
                /* navigation is handled by global data-href wiring */
            });
        }
    });
}

/* ----------------------------------------------------------
   4) MARK TOPIC COMPLETED
   ---------------------------------------------------------- */

function markL3TopicVisited(n) {
    var key = 'topic' + n;
    if (!L3.visitedTopics.hasOwnProperty(key)) return;
    L3.visitedTopics[key] = true;

    var allVisited = Object.keys(L3.visitedTopics).every(function (k) {
        return L3.visitedTopics[k];
    });

    /* NOTE: finishing the topics only unlocks Activity 3 — it must NOT
       mark the lesson complete itself. Completion happens exclusively
       when the student presses the "Activity 3" doneBtn below, same
       as Lesson 1 & 2. (Doing it here disabled the button before the
       student ever got to click it.) */
    if (allVisited && !L3.lessonCompleted && !L3.activityCompleted) {
        showToast('🎉 All topics complete! Scroll down to finish Activity 3.', 'success', 4000);
    }

    saveL3State();
    applyL3StateToUI();
}
window.markL3TopicVisited = markL3TopicVisited;

/* ----------------------------------------------------------
   5) CSS EDITOR LIVE PREVIEW (Run button)
   Applied to test-3.2 through test-3.7 which all use the
   same #editor -> #previewStyle -> #previewBox pattern.

   SCOPING: Student CSS is injected ONLY inside #previewBox so
   it cannot bleed into the instructions, card text, header, or
   any other page element. Every selector the student writes gets
   prefixed with "#previewBox" automatically.
   ---------------------------------------------------------- */

/**
 * Prefix every CSS selector in a raw CSS string with a given scope.
 * Handles: regular rules, @media blocks (recursed), @keyframes (passed through).
 */
function _scopeCSS(css, scope) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    var out = '';
    var i = 0;
    var len = css.length;

    while (i < len) {
        var ws = css.slice(i).match(/^\s+/);
        if (ws) { out += ws[0]; i += ws[0].length; continue; }

        if (css[i] === '@') {
            var atEnd  = css.indexOf('{', i);
            var atSemi = css.indexOf(';', i);
            if (atSemi !== -1 && (atEnd === -1 || atSemi < atEnd)) {
                out += css.slice(i, atSemi + 1);
                i = atSemi + 1;
                continue;
            }
            if (atEnd !== -1) {
                out += css.slice(i, atEnd + 1);
                i = atEnd + 1;
                var depth = 1, inner = '';
                while (i < len && depth > 0) {
                    if (css[i] === '{') depth++;
                    else if (css[i] === '}') { depth--; if (depth === 0) break; }
                    inner += css[i++];
                }
                out += _scopeCSS(inner, scope);
                out += '}';
                i++;
                continue;
            }
        }

        var braceOpen = css.indexOf('{', i);
        if (braceOpen === -1) { out += css.slice(i); break; }

        var selectorStr = css.slice(i, braceOpen);
        var prefixed = selectorStr.split(',').map(function(sel) {
            sel = sel.trim();
            if (!sel) return '';
            if (/^(html|body)(\s|$|:|\[)/i.test(sel)) {
                var rest = sel.replace(/^(html|body)/i, '').trim();
                return rest ? scope + ' ' + rest : scope;
            }
            return scope + ' ' + sel;
        }).filter(Boolean).join(', ');

        out += prefixed;
        i = braceOpen;

        var d = 1;
        out += css[i++];
        while (i < len && d > 0) {
            if (css[i] === '{') d++;
            else if (css[i] === '}') d--;
            out += css[i++];
        }
    }
    return out;
}

function initCSSRunner() {
    var runBtn   = document.getElementById('runBtn');
    var editor   = document.getElementById('editor');
    var styleTag = document.getElementById('previewStyle');
    if (!runBtn || !editor || !styleTag) return;

    runBtn.addEventListener('click', function () {
        var raw    = editor.value || '';
        var scoped = _scopeCSS(raw, '#previewBox');
        styleTag.textContent = scoped;
        showToast('Preview updated!', 'info', 1500);
    });

    if (typeof autoResizeTextarea === 'function') {
        autoResizeTextarea(editor);
    }
}

/* Special runner for test-3.7: renders student CSS inside a narrow iframe
   so @media (max-width: 600px) actually fires against a 400px viewport. */
function initMediaQueryRunner() {
    var runBtn = document.getElementById('runBtn');
    var editor = document.getElementById('editor');
    var frame  = document.getElementById('previewBox');
    if (!runBtn || !editor || !frame) return;

    function renderFrame() {
        var css = editor.value || '';
        var doc = frame.contentDocument || frame.contentWindow.document;
        doc.open();
        doc.write(
            '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
            '<style>' +
            '  body { margin: 0; padding: 16px; font-family: sans-serif; color: #111; background: #fff; transition: background-color 0.3s; }' +
            '  p { margin: 0; }' +
            '</style>' +
            '<style>' + css + '</style>' +
            '</head><body>' +
            '<p>This box is 400px wide — your media query fires here! ✅</p>' +
            '</body></html>'
        );
        doc.close();
    }

    runBtn.addEventListener('click', function () {
        renderFrame();
        showToast('Preview updated!', 'info', 1500);
    });

    if (typeof autoResizeTextarea === 'function') {
        autoResizeTextarea(editor);
    }
}

/* ----------------------------------------------------------
   6) VALIDATORS — return { ok, error? }
   ---------------------------------------------------------- */

function validateCSSSyntax(editorEl) {
    /* test-3.2: p { color: blue; } */
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase().replace(/\s+/g, ' ');
    if (!code.includes('p') || !code.includes('color'))
        return { ok: false, error: 'Your rule must target the <p> element and set its color.' };
    if (!code.includes('blue'))
        return { ok: false, error: 'Set the color value to blue.' };
    if (!code.includes('{') || !code.includes('}'))
        return { ok: false, error: 'Remember the curly braces { } around your declaration.' };
    return { ok: true };
}

function validateCSSColor(editorEl) {
    /* test-3.3: .box { background-color: purple; } */
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase().replace(/\s+/g, ' ');
    if (!code.includes('.box'))
        return { ok: false, error: 'Use the class selector .box to target the element.' };
    if (!code.includes('background-color'))
        return { ok: false, error: 'Set the background-color property.' };
    if (!code.includes('purple'))
        return { ok: false, error: 'Set the background-color value to purple.' };
    return { ok: true };
}

function validateCSSFont(editorEl) {
    /* test-3.4: p { font-family: Arial; font-size: 18px; } */
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase().replace(/\s+/g, ' ');
    if (!code.includes('font-family'))
        return { ok: false, error: 'Add the font-family property.' };
    if (!code.includes('arial'))
        return { ok: false, error: 'Set font-family to Arial.' };
    if (!code.includes('font-size'))
        return { ok: false, error: 'Add the font-size property.' };
    if (!code.includes('18px'))
        return { ok: false, error: 'Set font-size to 18px.' };
    return { ok: true };
}

function validateCSSBoxModel(editorEl) {
    /* test-3.5: .box { padding: 10px; border: 2px solid black; margin: 15px; } */
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase().replace(/\s+/g, ' ');
    if (!code.includes('padding') || !code.includes('10px'))
        return { ok: false, error: 'Set padding to 10px.' };
    if (!code.includes('border') || !code.includes('2px') || !code.includes('solid') || !code.includes('black'))
        return { ok: false, error: 'Set border to 2px solid black.' };
    if (!code.includes('margin') || !code.includes('15px'))
        return { ok: false, error: 'Set margin to 15px.' };
    return { ok: true };
}

function validateCSSFlex(editorEl) {
    /* test-3.6: .flex-container { display: flex; justify-content: center; gap: 16px; } */
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase().replace(/\s+/g, ' ');
    if (!code.includes('display') || !code.includes('flex'))
        return { ok: false, error: 'Set display to flex.' };
    if (!code.includes('justify-content') || !code.includes('center'))
        return { ok: false, error: 'Set justify-content to center.' };
    if (!code.includes('gap') || !code.includes('16px'))
        return { ok: false, error: 'Set gap to 16px.' };
    return { ok: true };
}

function validateMediaQuery(editorEl) {
    /* test-3.7: @media (max-width: 600px) { body { background-color: lightblue; } } */
    if (!editorEl) return { ok: false, error: 'Editor not found.' };
    var code = (editorEl.value || '').toLowerCase().replace(/\s+/g, ' ');
    if (!code.includes('@media'))
        return { ok: false, error: 'Your answer must use a @media rule.' };
    if (!code.includes('max-width') || !code.includes('600px'))
        return { ok: false, error: 'Set the breakpoint to max-width: 600px.' };
    if (!code.includes('background-color') || !code.includes('lightblue'))
        return { ok: false, error: 'Inside the media query, set body background-color to lightblue.' };
    return { ok: true };
}

/* ----------------------------------------------------------
   7) ACTIVITY BINDER — reusable for all CSS editor tests
   ---------------------------------------------------------- */

function bindL3CSSActivity(cfg) {
    var submitEl = document.getElementById(cfg.submitId);
    if (!submitEl) return;

    var resetEl  = cfg.resetId  ? document.getElementById(cfg.resetId)  : null;
    var nextEl   = cfg.nextId   ? document.getElementById(cfg.nextId)   : null;
    var resultEl = cfg.resultId ? document.getElementById(cfg.resultId) : null;
    var editorEl = document.getElementById('editor');

    function onSubmit() {
        var res = cfg.validate(editorEl);
        if (!res.ok) {
            showToast(res.error || 'Check your code and try again.', 'error', 4000);
            return;
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
        markL3TopicVisited(cfg.topicNum);
    }

    function onReset() {
        if (editorEl) editorEl.value = cfg.resetValue || '';
        if (cfg.useIframe) {
            var frame = document.getElementById('previewBox');
            if (frame) {
                var doc = frame.contentDocument || frame.contentWindow.document;
                doc.open(); doc.write('<!DOCTYPE html><html><body></body></html>'); doc.close();
            }
        } else {
            var styleTag = document.getElementById('previewStyle');
            if (styleTag) styleTag.textContent = '';
        }
        if (resultEl) {
            resultEl.innerHTML = '';
            resultEl.classList.remove('success', 'error');
            resultEl.style.display = 'none';
        }
        submitEl.style.display = 'inline-block';
        if (resetEl) resetEl.style.display = 'none';
        if (nextEl)  nextEl.style.display  = 'none';
        /* Allow redo — un-mark the topic */
        L3.visitedTopics['topic' + cfg.topicNum] = false;
        saveL3State();
        applyL3StateToUI();
    }

    submitEl.addEventListener('click', onSubmit);
    if (resetEl) resetEl.addEventListener('click', onReset);
}

/* ----------------------------------------------------------
   8) QUIZ BINDER — for test-3.1 (multiple-choice quiz)
   ---------------------------------------------------------- */

function bindL3Quiz() {
    var submitBtn = document.getElementById('quizSubmit');
    if (!submitBtn) return;

    var resetBtn  = document.getElementById('quizReset');
    var nextBtn   = document.getElementById('quizNext');
    var resultEl  = document.getElementById('quizResult');
    var form      = document.getElementById('quizForm');

    /* Correct answers */
    var answers = { q1: 'b', q2: 'c', q3: 'a' };

    function grade() {
        var score = 0;
        var total = Object.keys(answers).length;
        var allAnswered = true;

        Object.keys(answers).forEach(function (q) {
            var sel = form ? form.querySelector('input[name="' + q + '"]:checked') : null;
            if (!sel) { allAnswered = false; return; }
            if (sel.value === answers[q]) score++;
        });

        if (!allAnswered) {
            showToast('Please answer all questions before submitting.', 'error', 3000);
            return;
        }

        if (score === total) {
            if (resultEl) {
                resultEl.innerHTML = '✅ Perfect score! ' + score + '/' + total + ' — Activity complete!';
                resultEl.classList.remove('error');
                resultEl.classList.add('success', 'quiz-result');
                resultEl.style.display = 'block';
            }
            submitBtn.style.display = 'none';
            if (resetBtn) resetBtn.style.display = 'inline-block';
            if (nextBtn)  nextBtn.style.display  = 'inline-block';
            markL3TopicVisited(1);
        } else {
            if (resultEl) {
                resultEl.innerHTML = '❌ ' + score + '/' + total + ' correct. Review the topic and try again!';
                resultEl.classList.remove('success');
                resultEl.classList.add('error', 'quiz-result');
                resultEl.style.display = 'block';
            }
            showToast(score + '/' + total + ' — Try again!', 'error', 3000);
        }
    }

    function resetQ() {
        if (form) form.reset();
        if (resultEl) {
            resultEl.innerHTML = '';
            resultEl.classList.remove('success', 'error');
            resultEl.style.display = 'none';
        }
        submitBtn.style.display = 'inline-block';
        if (resetBtn) resetBtn.style.display = 'none';
        if (nextBtn)  nextBtn.style.display  = 'none';
        L3.visitedTopics.topic1 = false;
        saveL3State();
        applyL3StateToUI();
    }

    submitBtn.addEventListener('click', grade);
    if (resetBtn) resetBtn.addEventListener('click', resetQ);
}

/* ----------------------------------------------------------
   9) PAGE CONFIG — maps filenames to activity settings
   ---------------------------------------------------------- */

var L3_PAGE_CONFIG = {
    'test-3.2.html': {
        submitId: 'syntaxSubmit', resetId: 'syntaxReset', nextId: 'syntaxNext', resultId: 'syntaxResult',
        validate: validateCSSSyntax,
        successMsg: '✅ Activity complete — CSS syntax is correct!',
        topicNum: 2,
        resetValue: 'p {\n    color: ____;\n}'
    },
    'test-3.3.html': {
        submitId: 'colorSubmit', resetId: 'colorReset', nextId: 'colorNext', resultId: 'colorResult',
        validate: validateCSSColor,
        successMsg: '✅ Activity complete — background color set correctly!',
        topicNum: 3,
        resetValue: '.box {\n    background-color: ____;\n}'
    },
    'test-3.4.html': {
        submitId: 'fontSubmit', resetId: 'fontReset', nextId: 'fontNext', resultId: 'fontResult',
        validate: validateCSSFont,
        successMsg: '✅ Activity complete — font properties set correctly!',
        topicNum: 4,
        resetValue: 'p {\n    font-family: ____;\n    font-size: ____;\n}'
    },
    'test-3.5.html': {
        submitId: 'boxSubmit', resetId: 'boxReset', nextId: 'boxNext', resultId: 'boxResult',
        validate: validateCSSBoxModel,
        successMsg: '✅ Activity complete — box model properties set correctly!',
        topicNum: 5,
        resetValue: '.box {\n    padding: ____;\n    border: ____;\n    margin: ____;\n}'
    },
    'test-3.6.html': {
        submitId: 'flexSubmit', resetId: 'flexReset', nextId: 'flexNext', resultId: 'flexResult',
        validate: validateCSSFlex,
        successMsg: '✅ Activity complete — Flexbox layout applied correctly!',
        topicNum: 6,
        resetValue: '.flex-container {\n    display: ____;\n    justify-content: ____;\n    gap: ____;\n}'
    },
    'test-3.7.html': {
        submitId: 'mediaSubmit', resetId: 'mediaReset', nextId: 'mediaNext', resultId: 'mediaResult',
        validate: validateMediaQuery,
        successMsg: '✅ Activity complete — media query is correct!',
        topicNum: 7,
        useIframe: true,
        resetValue: '@media (max-width: ____) {\n    body {\n        background-color: ____;\n    }\n}'
    }
};

/* ----------------------------------------------------------
   10) INIT
   ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
    loadL3State();
    applyL3StateToUI();

    var page = (typeof getCurrentPage === 'function') ? getCurrentPage() : '';

    /* Highlight first card green if this topic was already completed */
    if (/^topic-3\.\d+\.html$/.test(page)) {
        var topicMatch = page.match(/topic-3\.(\d+)\.html/);
        if (topicMatch) {
            var topicNum = parseInt(topicMatch[1], 10);
            if (L3.visitedTopics['topic' + topicNum]) {
                var firstCard = document.querySelector('.card');
                if (firstCard) firstCard.style.borderLeft = '6px solid #4caf50';
            }
        }
    }

    /* Wire up lesson-3.html done button */
    if (page === 'lesson-3.html') {
        _updateDoneBtn();
        initL3OverviewHandlers();
    }

    /* Wire up test-3.1 quiz */
    if (page === 'test-3.1.html') {
        bindL3Quiz();
    }

    /* Wire up CSS editor activities (test-3.2 through test-3.7) */
    var cfg = L3_PAGE_CONFIG[page];
    if (cfg) {
        if (cfg.useIframe) {
            initMediaQueryRunner();
        } else {
            initCSSRunner();
        }
        bindL3CSSActivity(cfg);
    }
});
