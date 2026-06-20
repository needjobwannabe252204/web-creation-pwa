Lesson 2 — PAGE_CONFIG README

Overview

This project uses a centralized per-page configuration object in `src/js/lesson-2.js` called `PAGE_CONFIG` to control code-activity bindings for the Test pages (test-2.3 .. test-2.7).

Goal

Make it easy to change submit/reset/next/result IDs, success messages, validation logic, and starter editor content without editing multiple places.

Where to edit

- Main implementation: `src/js/lesson-2.js`
  - `PAGE_CONFIG` — mapping from page filename -> config object
  - `RESET_VALS` — starter editor values keyed by short ids (e.g. '24')

PAGE_CONFIG keys

Each entry for a page should include these properties:

- `submitId` (string): the `id` of the Submit button in the page HTML.
- `resetId`  (string): the `id` of the Reset button (optional).
- `nextId`   (string): the `id` of the Next button (optional).
- `resultId` (string): the `id` of the result element. If omitted, the binder will auto-detect common ids.
- `validate` (function): a function reference that receives `(editorEl, outputEl)` and returns `{ok: boolean, error?: string}`.
- `successMsg` (string): message displayed on success.
- `topicNum` (number): topic index used for progress tracking.
- `resetKey` (string): key used to look up starter content in `RESET_VALS`.

Example `PAGE_CONFIG` entry

{
  'test-2.4.html': {
    submitId: 'imageSubmit',
    resetId:  'imageReset',
    nextId:   'imageNext',
    resultId: 'imageResult',
    validate: validateImage, // function already in lesson-2.js
    successMsg: '✅ Activity complete — image displayed correctly.',
    topicNum: 4,
    resetKey: '24'
  }
}

How to add a new test page

1. Add or update the HTML page under `src/html/lesson-2/`.
   - Ensure the Submit/Reset/Next buttons use predictable `id` values (matching `submitId`, etc.).
   - For Next buttons, include `class="btn btn-primary"` and `data-href="topic-2.X.html"` so navigation styling and path are predictable.
   - Result areas should have an `id` (e.g. `result`, `imageResult`, `linkResult`). The script will add `quiz-result` + `success`/`error` classes automatically.

2. Add starter content to `RESET_VALS` in `src/js/lesson-2.js` using a short key (e.g. '28').

3. Add a `PAGE_CONFIG` entry (filename -> config) in `src/js/lesson-2.js` using the same resetKey.

4. If you need a new validator, add a function in `lesson-2.js` following the signature `(editorEl, outputEl) => { ok: boolean, error?: string }` and reference it from the `validate` property.

Testing changes

- Open the page in your browser (e.g. `src/html/lesson-2/test-2.4.html`) and run the activity. On success the result area will display the `successMsg` and receive the `.quiz-result.success` classes.
- The Next button should appear and have the `.btn-primary` style when shown.

Notes

- `bindCodeActivity()` centralizes the submit/reset/next wiring. Editing `PAGE_CONFIG` is usually enough to change behavior for a page.
- The `enhanceNavButtons()` helper ensures `.nav-buttons button` elements get consistent `.btn` and `.btn-primary` styling at load time.

If you want, I can also add a short example section in this README showing how to add a validator function and a minimal HTML snippet to match the config.
