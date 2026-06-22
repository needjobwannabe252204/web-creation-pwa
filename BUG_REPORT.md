# PWA Bug Report & Analysis

## Issues Found During Code Crawl

### 🔴 **CRITICAL ISSUES**

#### 1. **Lesson 4 has no reset button** (script.js)
- **Problem**: Lessons 1, 2, 3 have reset buttons, but Lesson 4 (Final Project) doesn't
- **Impact**: Users can't reset the final project, stuck with old progress
- **Location**: `index.html` line 96, `script.js` (missing `_initResetLesson4Button`)
- **Fix**: Add reset logic for Lesson 4
- **Severity**: HIGH

#### 2. **Missing prerequisite validation for dev mode** (devtools.js)
- **Problem**: Dev mode bypasses ALL gates but doesn't warn when enabling it
- **Impact**: Dev testing could accidentally enable and forget to disable, affecting end users
- **Location**: `devtools.js` line 201-211
- **Fix**: Add a persistent visual indicator when dev mode is on
- **Severity**: MEDIUM

### 🟡 **IMPORTANT ISSUES**

#### 3. **localStorage quota not handled** (utils.js)
- **Problem**: No try-catch for QuotaExceededError when saving progress
- **Impact**: If device storage full, saves fail silently, user progress lost
- **Location**: `utils.js` lines 180, 283, 345
- **Example**: `localStorage.setItem()` without quota checking
- **Fix**: Add quota exceeded handler with user notification
- **Severity**: HIGH

#### 4. **No accessibility labels for forms** (profile.html & lesson pages)
- **Problem**: Form inputs may be missing `<label>` elements
- **Impact**: Screen readers can't identify fields properly
- **Location**: All lesson HTML files
- **Fix**: Audit and add proper `<label>` tags
- **Severity**: MEDIUM

#### 5. **Missing fetch error recovery** (sw.js line 184-192)
- **Problem**: Network fetch failures in stale-while-revalidate don't log errors
- **Impact**: Hard to debug why assets fail to load
- **Location**: `sw.js` line 192
- **Fix**: Add error logging for debugging
- **Severity**: LOW

### 🟢 **WARNINGS & BEST PRACTICES**

#### 6. **No prefers-reduced-motion support**
- **Problem**: No CSS media query handling for users with vestibular disorders
- **Impact**: Animation-heavy UI could cause discomfort
- **Location**: `src/css/style.css`
- **Fix**: Add `@media (prefers-reduced-motion: reduce)` rules
- **Severity**: MEDIUM (accessibility)

#### 7. **Lesson gate refresh inefficient** (script.js line 352-396)
- **Problem**: `initLessonGates()` re-queries all buttons on every refresh
- **Impact**: Performance hit during rapid state changes
- **Location**: `script.js` line 352
- **Fix**: Cache button references or use event delegation
- **Severity**: LOW

#### 8. **Toast notifications can stack infinitely** (utils.js)
- **Problem**: No limit on concurrent toasts, can accumulate
- **Impact**: UI clutter if user triggers many errors quickly
- **Location**: `utils.js` line 64-134
- **Fix**: Queue toasts or limit to max 3 concurrent
- **Severity**: LOW

---

## Testing Checklist

- [ ] Reset button works for all 4 lessons
- [ ] Dev mode toggle shows persistent indicator
- [ ] localStorage quota error shows user-friendly message
- [ ] Offline lesson pages load correctly (cached)
- [ ] Service worker update detection works
- [ ] Screen reader can access all form inputs
- [ ] Animations respect prefers-reduced-motion
- [ ] No error console logs on first visit
- [ ] Navigation works with network errors

---

## Files to Review

1. `src/html/lesson-4/lesson-4.html` - Add reset button support
2. `devtools.js` - Add persistent dev mode indicator
3. `utils.js` - Add localStorage quota handling
4. `src/css/style.css` - Add accessibility media queries
5. All lesson HTML files - Audit form label accessibility
