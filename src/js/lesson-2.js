const runBtn = document.getElementById("runBtn");

function handleRunClick() {
    try {
        const editor = document.getElementById("editor");
        const output = document.getElementById("output");
        if (!editor || !output) {
            console.warn('runBtn clicked but editor/output not found');
            return;
        }
        output.innerHTML = editor.value;
        // Ensure any links in the output open in a new tab and don't navigate away
        try {
            output.querySelectorAll('a').forEach(a => { a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); });
        } catch (e) { /* ignore */ }
        const completeBtn = document.getElementById('completeBtn');
        if (completeBtn) completeBtn.style.display = 'inline-block';
        // Note: per-activity validators (submit buttons) perform grading.
        // The Run button only renders the editor content to the `output` area
        // so students can preview changes. Do not perform activity grading here.
        console.log('lesson-2: run executed');
    } catch (e) { console.error('runBtn handler error', e); }
}

if (runBtn) runBtn.addEventListener('click', handleRunClick);

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

// Helper: set card border by finding a button with matching data-href
function setCardBorderColorForButtonHref(href, color) {
    try {
        const btn = document.querySelector(`button[data-href="${href}"]`);
        if (!btn) return;
        const card = btn.closest('.card');
        if (!card) return;
        card.style.borderLeft = color ? `6px solid ${color}` : '';
    } catch (e) { /* ignore */ }
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

/*
    Helper: mark a topic completed programmatically.
    Usage from pages: `markTopicCompleted(6)` will set topic6=true,
    save state and update UI. This is safe to call multiple times.
*/
function markTopicCompleted(n) {
        try {
                const key = `topic${n}`;
                if (completedTopics2[key]) return; // already done
                completedTopics2[key] = true;
                saveLesson2State();
                applyLesson2StateToUI();
        } catch (e) { console.warn('markTopicCompleted error', e); }
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

    /* Auto-resize textareas so they grow with content height.
       Targets `.code-editor` textareas and falls back to any textarea.
    */
    (function setupAutoResizeTextareas(){
        const areas = Array.from(document.querySelectorAll('textarea.code-editor, textarea'));
        if (!areas.length) return;
        areas.forEach(a => {
            a.style.overflow = 'hidden';
            const resize = () => {
                a.style.height = 'auto';
                // add 2px to avoid scrollbar flicker on some browsers
                a.style.height = (a.scrollHeight + 2) + 'px';
            };
            // init
            resize();
            // update on input
            a.addEventListener('input', resize, { passive: true });
            // optional: also resize on window/font changes
            window.addEventListener('resize', resize);
        });
    })();

    // If page contains the tag-bank activity, bind its handlers; otherwise skip activity setup
    if (tagBank && dropBoxes.length > 0) {
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
    }

    // === Table activity (test-2.6) ===
    const tableSubmit = document.getElementById('tableSubmit');
    const tableReset = document.getElementById('tableReset');
    const tableNext = document.getElementById('tableNext');
    const tableReturn = document.getElementById('tableReturn');
    const tableResult = document.getElementById('result');
    const tableEditor = document.getElementById('editor');
    const tableOutput = document.getElementById('output');
    const tableRun = document.getElementById('runBtn');

    function checkTable() {
        if (!tableOutput) return { ok: false, error: 'output missing' };
        // First check the raw editor text for an explicit <tr tag to avoid
        // passing due to browser-implied table rows when HTML is malformed.
        const raw = tableEditor ? (tableEditor.value || '') : '';
        if (!raw.toLowerCase().includes('<tr')) {
            return { ok: false, error: 'No <tr> tag found. Use <tr> to create rows.' };
        }
        // Parse and confirm the browser produced at least one <tr> element.
        const parser = new DOMParser();
        const doc = parser.parseFromString(tableOutput.innerHTML || '', 'text/html');
        const trs = Array.from(doc.querySelectorAll('tr'));
        if (trs.length === 0) {
            if (window && window.console) console.log('lesson-2: tableOutput.innerHTML=', tableOutput.innerHTML);
            return { ok: false, error: 'No table rows found after parsing.' };
        }
        return { ok: true };
    }

    if (tableRun) {
        tableRun.addEventListener('click', () => {
            if (!tableEditor || !tableOutput) return;
            tableOutput.innerHTML = tableEditor.value;
            // run quick validation and show hint in tableResult if present
            if (tableResult) tableResult.style.display = 'none';
        });
    }

    if (tableSubmit) {
        tableSubmit.addEventListener('click', () => {
            const res = checkTable();
            if (!res.ok) {
                alert(res.error || 'Invalid submission — please try again.');
                return;
            }
            if (tableResult) {
                tableResult.innerHTML = '✅ Activity complete — table rows look good.';
                tableResult.classList.remove('error');
                tableResult.classList.add('success');
                tableResult.style.display = 'block';
            }
            if (tableSubmit) tableSubmit.style.display = 'none';
            if (tableReset) tableReset.style.display = 'inline-block';
            if (tableNext) tableNext.style.display = 'inline-block';

            // mark topic 6 completed
            completedTopics2.topic6 = true;
            saveLesson2State();
            if (window && window.console) console.log('lesson-2: saved lesson2State', localStorage.getItem('lesson2State'));
            applyLesson2StateToUI();
        });
    }

    if (tableReset) {
        tableReset.addEventListener('click', () => {
            if (tableEditor) tableEditor.value = '<____>\n    <td>John</td>\n    <td>15</td>\n</tr>\n</table>';
            if (tableOutput) tableOutput.innerHTML = '';
            if (tableResult) { tableResult.innerHTML = ''; tableResult.classList.remove('success','error'); tableResult.style.display = 'none'; }
            if (tableReset) tableReset.style.display = 'none';
            if (tableNext) tableNext.style.display = 'none';
            if (tableSubmit) tableSubmit.style.display = 'inline-block';

            completedTopics2.topic6 = false;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }

    // If this page is test-2.7.html it re-uses the `tableSubmit` controls
    // but the activity expects a form (username/email). Override
    // behavior on that specific page to validate the form instead of tables.
    const path = (window.location.pathname || window.location.href || '').toLowerCase();
    const isTest27 = path.endsWith('test-2.7.html') || path.includes('test-2.7.html');
    if (isTest27) {
        function checkFormActivityFor27() {
            if (!tableEditor) return { ok: false, error: 'Editor not found.' };
            const code = (tableEditor.value || '').toLowerCase();

            const hasUsernameLabel = code.includes('for="username"') || code.includes("for='username'");
            const hasEmailLabel = code.includes('for="email"') || code.includes("for='email'");
            const hasTextInput = code.includes('type="text"') || code.includes("type='text'");
            const hasEmailInput = code.includes('type="email"') || code.includes("type='email'");

            if (hasUsernameLabel && hasEmailLabel && hasTextInput && hasEmailInput) {
                return { ok: true };
            }

            return { ok: false, error: 'Make sure both labels are completed correctly (username and email) and include text/email inputs.' };
        }

        if (tableRun) {
            tableRun.addEventListener('click', () => {
                if (!tableEditor || !tableOutput) return;
                tableOutput.innerHTML = tableEditor.value;
                if (tableResult) tableResult.style.display = 'none';
            });
        }

        if (tableSubmit) {
            tableSubmit.addEventListener('click', () => {
                const res = checkFormActivityFor27();
                if (!res.ok) {
                    alert(res.error || 'Invalid submission — please try again.');
                    return;
                }
                if (tableResult) {
                    tableResult.innerHTML = '✅ Activity complete — form looks good.';
                    tableResult.classList.remove('error');
                    tableResult.classList.add('success');
                    tableResult.style.display = 'block';
                }
                if (tableSubmit) tableSubmit.style.display = 'none';
                if (tableReset) tableReset.style.display = 'inline-block';
                if (tableNext) tableNext.style.display = 'inline-block';

                // mark topic 7 completed
                completedTopics2.topic7 = true;
                saveLesson2State();
                applyLesson2StateToUI();
            });
        }

        if (tableReset) {
            tableReset.addEventListener('click', () => {
                if (tableEditor) tableEditor.value = '<form>\n\n    <label for="____">\n        Username:\n    </label>\n    <input type="text">\n\n    <label for="____">\n        Email:\n    </label>\n    <input type="email">\n\n</form>';
                if (tableOutput) tableOutput.innerHTML = '<p>Your form will appear here...</p>';
                if (tableResult) { tableResult.innerHTML = ''; tableResult.classList.remove('success','error'); tableResult.style.display = 'none'; }
                if (tableReset) tableReset.style.display = 'none';
                if (tableNext) tableNext.style.display = 'none';
                if (tableSubmit) tableSubmit.style.display = 'inline-block';

                completedTopics2.topic7 = false;
                saveLesson2State();
                applyLesson2StateToUI();
            });
        }
    }

    // === Form activity (test-2.7) ===
    const formSubmit = document.getElementById('formSubmit');
    const formReset = document.getElementById('formReset');
    const formResult = document.getElementById('formResult') || document.getElementById('result');
    const formEditor = document.getElementById('editor');
    const formOutput = document.getElementById('output');
    const formRun = document.getElementById('runBtn');
    const formNext = document.getElementById('tableNext');

    // Strict form activity validator for test-2.7
    function checkFormActivity() {
        if (!formEditor) return { ok: false, error: 'Editor not found.' };

        const code = (formEditor.value || '').toLowerCase();

        const hasUsername = code.includes('for="username"') || code.includes("for='username'");
        const hasEmail = code.includes('for="email"') || code.includes("for='email'");
        const hasTextInput = code.includes('type="text"') || code.includes("type='text'");
        const hasEmailInput = code.includes('type="email"') || code.includes("type='email'");

        if (!hasUsername) return { ok: false, error: 'Fill the first blank with username (for="username").' };
        if (!hasEmail) return { ok: false, error: 'Fill the second blank with email (for="email").' };
        if (!hasTextInput) return { ok: false, error: 'Add a text input (type="text").' };
        if (!hasEmailInput) return { ok: false, error: 'Add an email input (type="email").' };

        return { ok: true };
    }

    if (formRun) {
        formRun.addEventListener('click', () => {
            if (!formEditor || !formOutput) return;
            formOutput.innerHTML = formEditor.value;
            if (formResult) formResult.style.display = 'none';
        });
    }

    if (formSubmit) {
        formSubmit.addEventListener('click', () => {
            const res = checkFormActivity();
            if (!res.ok) {
                alert(res.error || 'Invalid submission — please try again.');
                return;
            }
            if (formResult) {
                formResult.innerHTML = '<h3>✅ Correct!</h3><p>You successfully completed the form activity.</p>';
                formResult.classList.remove('error');
                formResult.classList.add('success');
                formResult.style.display = 'block';
            }
            if (formSubmit) formSubmit.style.display = 'none';
            if (formReset) formReset.style.display = 'inline-block';
            if (formNext) formNext.style.display = 'inline-block';

            // mark topic 7 completed
            try { markTopicCompleted(7); } catch (e) { completedTopics2.topic7 = true; saveLesson2State(); applyLesson2StateToUI(); }
            if (window && window.console) console.log('lesson-2: saved lesson2State', localStorage.getItem('lesson2State'));
        });
    }

    if (formReset) {
        formReset.addEventListener('click', () => {
            if (formEditor) formEditor.value = '<form>\n    <label for="username">Username:</label>\n    <input type="text" id="username" name="username">\n    <label for="email">Email:</label>\n    <input type="email" id="email" name="email">\n</form>';
            if (formOutput) formOutput.innerHTML = '';
            if (formResult) { formResult.innerHTML = ''; formResult.classList.remove('success','error'); formResult.style.display = 'none'; }
            if (formReset) formReset.style.display = 'none';
            if (formSubmit) formSubmit.style.display = 'inline-block';

            completedTopics2.topic7 = false;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }


    // === Heading quiz (test-2.2) logic binding ===
    const headingSubmit = document.getElementById('headingSubmit');
    const quizForm = document.getElementById('quizForm');
    const headingResult = document.getElementById('headingResult');
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
        // Debug: log selected values to console to trace grading issues
        const debugSelections = {};
        for (let key of keys) {
            const selected = quizForm.querySelector(`input[name="${key}"]:checked`);
            const val = selected ? selected.value : null;
            debugSelections[key] = val;
            if (selected && selected.value === answers[key]) score++;
        }
        if (window && window.console) console.log('gradeHeadingQuiz selections:', debugSelections, 'score:', score);

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
        }

        // show next (navigation handled globally via data-href/script.js)
        if (headingNext) headingNext.style.display = 'inline-block';
    }

    if (headingSubmit && quizForm && headingResult) {
        headingSubmit.addEventListener('click', gradeHeadingQuiz);
    }
    if (headingResult) headingResult.style.display = 'none';
    // register reset handler once
    if (headingReset) headingReset.addEventListener('click', resetHeadingQuiz);

    // small activity handlers are below (linkSubmit/linkReset) —
    // removed old completeBtn/messageEl block (legacy injection) so
    // behavior is fully handled by linkSubmit/linkReset below.

    // Link activity (test-2.3) submit/reset handling
    const linkSubmit = document.getElementById('linkSubmit');
    const linkReset = document.getElementById('linkReset');
    // Prefer a page-specific result element, but fall back to the global
    // lesson result `#result` used by lesson-1 pages. Ensure we have the
    // same styling by adding the `quiz-result` class when needed.
    let linkResult = document.getElementById('linkResult') || document.getElementById('result') || document.getElementById('link-result');
    if (linkResult && !linkResult.classList.contains('quiz-result')) linkResult.classList.add('quiz-result');
    const linkNext = document.getElementById('linkNext');
    const linkReturn = document.getElementById('linkReturn');
    const editorEl = document.getElementById('editor');
    const outputEl = document.getElementById('output');

    if (editorEl) {
    function autoResize() {
        editorEl.style.height = "auto";
        editorEl.style.height = editorEl.scrollHeight + "px";
    }
    editorEl.addEventListener("input", autoResize);
    autoResize();
    }

    function checkLinks() {
        if (!outputEl) return { ok: false, error: 'output missing' };
        const parser = new DOMParser();
        const doc = parser.parseFromString(outputEl.innerHTML || '', 'text/html');
        const anchors = Array.from(doc.querySelectorAll('a'));

        // Require exactly one anchor
        if (anchors.length === 0) return { ok: false, error: 'No anchor found. Add one <a> tag linking to Google, Facebook or YouTube.' };
        if (anchors.length > 1) return { ok: false, error: 'Please include exactly one anchor. Remove extra <a> tags and try again.' };

        const a = anchors[0];
        const href = (a.getAttribute('href') || '').toLowerCase();
        const allowed = ['google', 'facebook', 'youtube', 'youtu.be'];
        const matches = allowed.find(k => href.includes(k));
        if (!matches) return { ok: false, error: 'Anchor must link to Google, Facebook, or YouTube. Other targets are not accepted.' };

        // success: return which target matched
        return { ok: true, target: matches };
    }

    if (linkSubmit) {
        linkSubmit.addEventListener('click', () => {
            console.log('lesson-2: linkSubmit clicked');
            const result = checkLinks();
            console.log('lesson-2: checkLinks result', result);
            if (!result.ok) {
                alert(result.error || 'Invalid submission — please try again.');
                return;
            }
            if (linkResult) {
                linkResult.innerHTML = '✅ Activity complete — linked to ' + result.target + '.';
                linkResult.classList.remove('error');
                linkResult.classList.add('success');
                linkResult.style.display = 'block';
            }
            if (linkSubmit) linkSubmit.style.display = 'none';
            if (linkReset) linkReset.style.display = 'inline-block';
            if (linkNext) linkNext.style.display = 'inline-block';

            // mark topic 3 completed
            completedTopics2.topic3 = true;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }

    if (linkReset) {
        linkReset.addEventListener('click', () => {
            if (editorEl) editorEl.value = '';
            if (outputEl) outputEl.innerHTML = '';
            if (linkResult) { linkResult.innerHTML = ''; linkResult.classList.remove('success','error'); linkResult.style.display = 'none'; }
            if (linkReset) linkReset.style.display = 'none';
            if (linkNext) linkNext.style.display = 'none';
            if (linkSubmit) linkSubmit.style.display = 'inline-block';
            if (linkResult) { linkResult.innerHTML = ''; linkResult.classList.remove('success','error'); linkResult.style.display = 'none'; }

            completedTopics2.topic3 = false;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }

    // === Image activity (test-2.4) submit/reset handling ===
    const imageSubmit = document.getElementById('imageSubmit');
    const imageReset = document.getElementById('imageReset');
    const imageNext = document.getElementById('imageNext');
    const imageReturn = document.getElementById('imageReturn');
    const imageResult = document.getElementById('result') || document.getElementById('imageResult');

    function checkImage() {
        if (!outputEl) return { ok: false, error: 'output missing' };
        const parser = new DOMParser();
        const doc = parser.parseFromString(outputEl.innerHTML || '', 'text/html');
        const imgs = Array.from(doc.querySelectorAll('img'));
        if (imgs.length === 0) return { ok: false, error: 'No <img> tag found. Add one with a src attribute.' };
        if (imgs.length > 1) return { ok: false, error: 'Please include exactly one <img> tag.' };
        const src = imgs[0].getAttribute('src') || '';
        if (!src) return { ok: false, error: 'Image tag missing src attribute.' };
        return { ok: true, src };
    }

    if (imageSubmit) {
        imageSubmit.addEventListener('click', () => {
            console.log('lesson-2: imageSubmit clicked');
            const result = checkImage();
            console.log('lesson-2: checkImage result', result);
            if (!result.ok) { alert(result.error || 'Invalid submission — please try again.'); return; }
            if (imageResult) {
                imageResult.innerHTML = '✅ Activity complete — image displayed.';
                imageResult.classList.remove('error');
                imageResult.classList.add('success');
                imageResult.style.display = 'block';
            }
            if (imageSubmit) imageSubmit.style.display = 'none';
            if (imageReset) imageReset.style.display = 'inline-block';
            if (imageNext) imageNext.style.display = 'inline-block';

            // mark topic 4 completed
            completedTopics2.topic4 = true;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }

    if (imageReset) {
        imageReset.addEventListener('click', () => {
            if (editorEl) editorEl.value = '<img ____="https://picsum.photos/400/250" alt="Beautiful Image">';
            if (outputEl) outputEl.innerHTML = '';
            if (imageResult) { imageResult.innerHTML = ''; imageResult.classList.remove('success','error'); imageResult.style.display = 'none'; }
            if (imageReset) imageReset.style.display = 'none';
            if (imageNext) imageNext.style.display = 'none';
            if (imageSubmit) imageSubmit.style.display = 'inline-block';

            completedTopics2.topic4 = false;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }

    // === List activity (test-2.5) submit/reset handling ===
    const listSubmit = document.getElementById('listSubmit');
    const listReset = document.getElementById('listReset');
    const listNext = document.getElementById('listNext');
    const listReturn = document.getElementById('listReturn');
    const listResult = document.getElementById('result') || document.getElementById('listResult');

    function checkList() {
        if (!outputEl) return { ok: false, error: 'output missing' };
        const parser = new DOMParser();
        const doc = parser.parseFromString(outputEl.innerHTML || '', 'text/html');
        const ols = Array.from(doc.querySelectorAll('ol'));
        if (ols.length === 0) return { ok: false, error: 'No <ol> found. Use <ol> to create a numbered list.' };
        if (ols.length > 1) return { ok: false, error: 'Please include exactly one <ol>.' };
        return { ok: true };
    }

    if (listSubmit) {
        listSubmit.addEventListener('click', () => {
            console.log('lesson-2: listSubmit clicked');
            const result = checkList();
            console.log('lesson-2: checkList result', result);
            if (!result.ok) { alert(result.error || 'Invalid submission — please try again.'); return; }
            if (listResult) {
                listResult.innerHTML = '✅ Activity complete — list looks good.';
                listResult.classList.remove('error');
                listResult.classList.add('success');
                listResult.style.display = 'block';
            }
            if (listSubmit) listSubmit.style.display = 'none';
            if (listReset) listReset.style.display = 'inline-block';
            if (listNext) listNext.style.display = 'inline-block';

            // mark topic 5 completed
            completedTopics2.topic5 = true;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }

    if (listReset) {
        listReset.addEventListener('click', () => {
            if (editorEl) editorEl.value = '<____>\n    <li>Plan</li>\n    <li>Code</li>\n    <li>Test</li>\n</ol>';
            if (outputEl) outputEl.innerHTML = '';
            if (listResult) { listResult.innerHTML = ''; listResult.classList.remove('success','error'); listResult.style.display = 'none'; }
            if (listReset) listReset.style.display = 'none';
            if (listNext) listNext.style.display = 'none';
            if (listSubmit) listSubmit.style.display = 'inline-block';

            completedTopics2.topic5 = false;
            saveLesson2State();
            applyLesson2StateToUI();
        });
    }
});