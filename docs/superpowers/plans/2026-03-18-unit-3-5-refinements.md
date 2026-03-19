# Unit 3.5 Refinements — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply five targeted refinements to unit 3.5 (Binnenmarkt): ranking item sizing, Prüfungsrelevanz always-on with corner ribbon, progressive visibility lock fix, Gruppenarbeit time calculation fix, and full AB methodology block redesign.

**Architecture:** Static GitHub Pages site — no build step, vanilla HTML5/CSS3/ES5. All changes are direct edits to `css/style.css`, `js/engine.js`, `js/tooltips.js`, `js/uk-quiz.js`, and `einheiten/3-5_binnenmarkt.html`. The AB block redesign (Tasks 6–7) is the most complex change: it replaces a `<select>` Kriterium with card + chip components, adds methodology color coding, and rewrites `uk-quiz.js` validation logic accordingly.

**Tech Stack:** HTML5, CSS3 custom properties, ES5 vanilla JS, localStorage for persistence, GitHub Pages hosting.

---

## File Map

| File | Tasks | What changes |
|------|-------|-------------|
| `css/style.css` | 1, 2 | `.oitem` sizing; `.qg-wrapper.locked` rule; Prüfungsrelevanz always-on + ribbon; methodology tokens; UK AB-level coloring; Leitfrage/Kriterium/recheck CSS |
| `js/tooltips.js` | 1 | Delete `_initPriorityToggle()` and its call site |
| `js/engine.js` | 3 | `_unlockBlock` + `_restoreState` both gain `.qg-wrapper` wrapper unlock |
| `einheiten/3-5_binnenmarkt.html` | 4, 5, 6 | Delete prio button; add `locked` to qg2/qg3 wrappers; fix ablauf-tags; full UK block HTML restructure |
| `js/uk-quiz.js` | 7 | Replace `<select>` logic with `.uk-krit-opt` card + chip handlers; rewrite `_checkAllSelected` and `chkUK` |

---

## Chunk 1: CSS + tooltips.js + engine.js + simple HTML fixes

---

### Task 1: CSS sizing, lock rule, Prüfungsrelevanz + tooltips.js cleanup

**Files:**
- Modify: `css/style.css` — section 16 (`.oitem`), near line 1899 (`.sw.locked`), section 41 (lines 2204–2278)
- Modify: `js/tooltips.js` — lines 157–184

---

- [ ] **Step 1: Fix `.oitem` padding and font-size (css/style.css line 1017)**

  Open `css/style.css`. Find the `.oitem` rule starting at line 1010. Change only the `padding` property and add `font-size`:

  ```css
  /* BEFORE */
  .oitem {
    display: flex;
    align-items: center;
    gap: .75rem;
    background: var(--input-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--r-sm);
    padding: .7rem 1rem;
    cursor: grab;
    transition: border-color .15s, box-shadow .15s;
    touch-action: none;
  }

  /* AFTER */
  .oitem {
    display: flex;
    align-items: center;
    gap: .75rem;
    background: var(--input-bg);
    border: 1.5px solid var(--border);
    border-radius: var(--r-sm);
    padding: .35rem .75rem;
    font-size: .82rem;
    cursor: grab;
    transition: border-color .15s, box-shadow .15s;
    touch-action: none;
  }
  ```

  **Note on naming:** The spec refers to "`.oarr-btn`" but the actual CSS selector in this codebase is `.oab` (section 30, line ~1624). They are the same element. The plan uses the codebase name `.oab`.

  Also reduce `.oab` font-size from `.7rem` to `.65rem` (line ~1634). The `width` and `height` are already `1.4rem × 1.4rem` — no change needed there:

  ```css
  /* BEFORE */
  .oab {
    width: 1.4rem;
    height: 1.4rem;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--card, #fff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .7rem;
    transition: border-color .15s, background .15s;
  }

  /* AFTER — only font-size changes */
  .oab {
    width: 1.4rem;
    height: 1.4rem;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--card, #fff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .65rem;
    transition: border-color .15s, background .15s;
  }
  ```

---

- [ ] **Step 2: Add `.qg-wrapper.locked` CSS rule (near line 1899)**

  Find the `.sw.locked` rule at line 1899:

  ```css
  .sw.locked    { opacity: .15; pointer-events: none; filter: blur(3px); transform: scale(.98); }
  ```

  Add a new rule directly after it:

  ```css
  .sw.locked    { opacity: .15; pointer-events: none; filter: blur(3px); transform: scale(.98); }
  .qg-wrapper.locked { opacity: .15; pointer-events: none; filter: blur(3px); transform: scale(.98); }
  ```

---

- [ ] **Step 3: Update Prüfungsrelevanz section in CSS (section 41, lines 2204–2278)**

  The entire section from the comment header to the end of `.prio-toggle-btn` rules must be replaced. Current content (lines 2204–2278):

  ```css
  /* =====================================================
     41. Knowledge Priority System
     data-p="core|imp|ctx" on .sw blocks
     Toggle activated by .prio-active on body
     Off by default — no visual change until toggled
     ===================================================== */

  /* Core: amber diamond marker before sw-head */
  body.prio-active .sw[data-p="core"] .sw-head::before {
    content: '◆ ';
    color: var(--acc);
    font-size: .7rem;
    font-family: var(--ff-mono);
    margin-right: .2em;
  }

  /* Context: muted treatment */
  body.prio-active .sw[data-p="ctx"] .sw-head {
    opacity: .55;
  }

  body.prio-active .sw[data-p="ctx"] .sw-body {
    opacity: .65;
  }

  body.prio-active .sw[data-p="ctx"] {
    border-left-color: var(--border);
  }

  /* Term-level core override (class="p-core" on <strong>) */
  .p-core {
    /* Same as .sw strong but explicit for term-level override */
    color: var(--acc);
    font-weight: 600;
  }

  body.prio-active strong.p-core::after {
    content: ' ◆';
    font-size: .6rem;
    vertical-align: super;
    color: var(--acc);
    font-family: var(--ff-mono);
    font-weight: 700;
  }

  /* Priority toggle button */
  .prio-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    font-family: var(--ff-mono);
    font-size: .7rem;
    font-weight: 600;
    color: var(--ink3);
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: .25em .65em;
    cursor: pointer;
    transition: all .15s;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .prio-toggle-btn:hover {
    border-color: var(--acc);
    color: var(--acc);
  }

  body.prio-active .prio-toggle-btn {
    background: var(--accG);
    border-color: var(--acc);
    color: var(--acc);
  }
  ```

  Replace entirely with:

  ```css
  /* =====================================================
     41. Knowledge Priority System
     data-p="core|imp|ctx" on .sw blocks
     Always-on — no toggle, no body class needed
     ===================================================== */

  /* Core: corner ribbon "Prüfung" on sw-head */
  .sw[data-p="core"] {
    position: relative;
  }

  .sw[data-p="core"] .sw-head::after {
    content: 'Prüfung';
    position: absolute;
    top: 0;
    right: 0;
    background: var(--acc);
    color: #fff;
    font-family: var(--ff-mono);
    font-size: .58rem;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    padding: .2em .65em;
    border-radius: 0 var(--r) 0 6px;
  }

  /* Context: muted treatment — always active */
  .sw[data-p="ctx"] .sw-head {
    opacity: .55;
  }

  .sw[data-p="ctx"] .sw-body {
    opacity: .65;
  }

  .sw[data-p="ctx"] {
    border-left-color: var(--border);
  }

  /* Term-level core override (class="p-core" on <strong>) */
  .p-core {
    color: var(--acc);
    font-weight: 600;
  }

  strong.p-core::after {
    content: ' ◆';
    font-size: .6rem;
    vertical-align: super;
    color: var(--acc);
    font-family: var(--ff-mono);
    font-weight: 700;
  }

  ```
  (The blank line after the last `}` preserves the separator before section 42's comment header.)

---

- [ ] **Step 4: Delete `_initPriorityToggle` from `js/tooltips.js`**

  In `js/tooltips.js`:

  Delete the entire function (lines 157–176):
  ```javascript
  function _initPriorityToggle() {
    var btn = document.querySelector('.prio-toggle-btn');
    if (!btn) return;

    // Get unit id from CONF if available (set by unit HTML)
    var unitId = (typeof CONF !== 'undefined' && CONF.id) ? CONF.id : 'global';
    var storageKey = 'plk_prio_' + unitId;

    // Restore previous state
    if (localStorage.getItem(storageKey) === '1') {
      document.body.classList.add('prio-active');
      btn.textContent = '\u25c6 Pr\u00fcfungsrelevanz aktiv';
    }

    btn.addEventListener('click', function () {
      var active = document.body.classList.toggle('prio-active');
      localStorage.setItem(storageKey, active ? '1' : '0');
      btn.textContent = active ? '\u25c6 Pr\u00fcfungsrelevanz aktiv' : '\u25c7 Pr\u00fcfungsrelevanz anzeigen';
    });
  }
  ```

  And delete its call on line 184:
  ```javascript
  _initPriorityToggle();
  ```

  Also update the file header comment on line 3 from:
  ```javascript
   * Operator badge tooltips · Fachbegriff popovers · Priority toggle
  ```
  to:
  ```javascript
   * Operator badge tooltips · Fachbegriff popovers
  ```

---

- [ ] **Step 5: Verify visually**

  Open `einheiten/3-5_binnenmarkt.html` in browser.
  - The ranking exercise options should now be visually smaller — similar height to MC options.
  - All `data-p="core"` blocks should show a corner "Prüfung" ribbon (amber background).
  - `data-p="ctx"` blocks should be muted immediately — no toggle needed.
  - No toggle button visible in header.

---

- [ ] **Step 6: Commit**

  ```bash
  git add css/style.css js/tooltips.js
  git commit -m "fix: ranking item sizing, always-on Prüfungsrelevanz with corner ribbon"
  ```

---

### Task 2: CSS — Methodology tokens + UK AB-level coloring + Leitfrage/Kriterium/recheck styles

**Files:**
- Modify: `css/style.css` — `:root` block (line 59), end of section 43 (after line 2582)

---

- [ ] **Step 1: Add methodology color tokens to `:root`**

  In `css/style.css`, find the `:root` block (lines 19–59). Add the methodology tokens just before the closing `}` of `:root` (after the `--gap` line at line 58):

  ```css
    /* Methodology colors — fixed, not per-unit (Roter Faden / AB levels) */
    --rf-acc:  #dc2626;
    --rf-bg:   #fef2f2;
    --rf-bdr:  #fca5a5;
    --rf-txt:  #7f1d1d;

    --ab1-acc: #1d4ed8;
    --ab1-bg:  #eff6ff;
    --ab1-bdr: #bfdbfe;

    --ab2-acc: #7c3aed;
    --ab2-bg:  #f5f3ff;
    --ab2-bdr: #ddd6fe;

    --ab3-acc: #16a34a;
    --ab3-bg:  #f0fdf4;
    --ab3-bdr: #bbf7d0;
  ```

---

- [ ] **Step 2: Add UK AB-level, Leitfrage, Kriterium, and recheck styles after section 43**

  After the last rule in section 44 (`uk-kriterium--recheck` at line ~2578), append the following new CSS block:

  ```css
  /* =====================================================
     45. UK Block — Methodology AB coloring & Leitfrage/Kriterium redesign
     Methodology colors are fixed (not per-unit accent).
     ===================================================== */

  /* Leitfrage banner */
  .uk-leitfrage {
    background: #1e293b;
    padding: .9rem 1.1rem;
    border-bottom: 3px solid var(--rf-acc);
  }
  .uk-leitfrage-label {
    font-family: var(--ff-mono);
    font-size: .58rem;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: .09em;
    text-transform: uppercase;
    margin-bottom: .35rem;
  }
  .uk-leitfrage-text {
    font-family: var(--ff-head);
    font-size: 1.05rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
  }

  /* Kriterium block — first encounter */
  .uk-krit-block {
    background: var(--rf-bg);
    border-bottom: 1px solid var(--rf-bdr);
    padding: .8rem 1.1rem;
  }
  .uk-krit-tag {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-family: var(--ff-mono);
    font-size: .6rem;
    font-weight: 600;
    background: var(--rf-acc);
    color: #fff;
    padding: .18em .6em;
    border-radius: 4px;
    margin-bottom: .45rem;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .uk-krit-q {
    font-family: var(--ff-head);
    font-size: .87rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.35;
    margin-bottom: .55rem;
  }
  .uk-krit-opts {
    display: flex;
    flex-direction: column;
    gap: .35rem;
  }
  .uk-krit-opt {
    display: flex;
    align-items: flex-start;
    gap: .55rem;
    padding: .5rem .75rem;
    border: 1.5px solid var(--rf-bdr);
    border-radius: 6px;
    background: rgba(255,255,255,.75);
    font-size: .82rem;
    color: #374151;
    line-height: 1.4;
    cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .uk-krit-opt.selected {
    border-color: var(--rf-acc);
    background: rgba(220,38,38,.07);
  }
  .uk-krit-opt.correct {
    border-color: var(--rf-acc);
    background: rgba(220,38,38,.12);
    cursor: default;
  }
  .uk-krit-opt.wrong {
    border-color: #fca5a5;
    background: #fef2f2;
    opacity: .6;
    cursor: default;
  }
  .uk-krit-num {
    font-family: var(--ff-mono);
    font-size: .62rem;
    font-weight: 600;
    color: var(--rf-acc);
    min-width: 1.2rem;
    padding-top: .05rem;
    flex-shrink: 0;
  }
  .uk-krit-opt-err {
    display: none;
    width: 100%;
    font-family: var(--ff-mono);
    font-size: .65rem;
    font-weight: 600;
    color: var(--rf-acc);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-top: .3rem;
  }
  .uk-krit-opt.wrong .uk-krit-opt-err {
    display: block;
  }

  /* Kriterium recheck — compact chips */
  .uk-krit-recheck {
    background: var(--rf-bg);
    border-bottom: 1px solid var(--rf-bdr);
    padding: .65rem 1.1rem;
  }
  .uk-krit-recheck-label {
    font-family: var(--ff-mono);
    font-size: .58rem;
    font-weight: 600;
    color: var(--rf-acc);
    letter-spacing: .07em;
    text-transform: uppercase;
    margin-bottom: .4rem;
  }
  .uk-krit-chips {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
  }
  .uk-krit-chip {
    font-size: .75rem;
    padding: .3em .75em;
    border: 1.5px solid var(--rf-bdr);
    border-radius: 99px;
    background: rgba(255,255,255,.8);
    color: var(--rf-txt);
    cursor: pointer;
    transition: background .15s, border-color .15s;
  }
  .uk-krit-chip.selected {
    background: var(--rf-acc);
    color: #fff;
    border-color: var(--rf-acc);
  }
  .uk-krit-chip.wrong {
    opacity: .5;
    cursor: default;
  }
  .uk-krit-recheck-err {
    display: none;
    font-family: var(--ff-mono);
    font-size: .65rem;
    font-weight: 600;
    color: var(--rf-acc);
    letter-spacing: .05em;
    text-transform: uppercase;
    margin-top: .35rem;
  }

  /* Step AB-level coloring */
  .uk-step[data-ab="1"] { background: var(--ab1-bg); border-bottom: 1px solid var(--ab1-bdr); }
  .uk-step[data-ab="2"] { background: var(--ab2-bg); border-bottom: 1px solid var(--ab2-bdr); }
  .uk-step[data-ab="3"] { background: var(--ab3-bg); border-bottom: 1px solid var(--ab3-bdr); }

  .uk-step[data-ab="1"] .uk-ab-tag { background: var(--ab1-acc); color: #fff; }
  .uk-step[data-ab="2"] .uk-ab-tag { background: var(--ab2-acc); color: #fff; }
  .uk-step[data-ab="3"] .uk-ab-tag { background: var(--ab3-acc); color: #fff; }

  .uk-step[data-ab="1"] .uk-opts .uk-opt { border-color: var(--ab1-bdr); }
  .uk-step[data-ab="2"] .uk-opts .uk-opt { border-color: var(--ab2-bdr); }
  .uk-step[data-ab="3"] .uk-opts .uk-opt { border-color: var(--ab3-bdr); }
  ```

---

- [ ] **Step 3: Verify tokens are reachable**

  Confirm in browser that CSS custom properties exist. Open browser devtools → Elements → `html` / `:root`, check that `--rf-acc`, `--ab1-acc`, etc. are listed. (They won't visually affect anything until the HTML uses them.)

---

- [ ] **Step 4: Commit**

  ```bash
  git add css/style.css
  git commit -m "feat: methodology color tokens + UK AB-level coloring + Leitfrage/Kriterium/recheck CSS"
  ```

---

### Task 3: engine.js — QG wrapper unlock fix

**Files:**
- Modify: `js/engine.js` — `_unlockBlock` at line 531, `_restoreState` forEach at line ~202

---

- [ ] **Step 1: Fix `_unlockBlock` to also unlock `.qg-wrapper` (line 531)**

  Find `_unlockBlock` at line 531. Current code (lines 531–549):

  ```javascript
  function _unlockBlock(gateNr, animate) {
    var next = document.getElementById('sw' + (gateNr + 1));
    if (next && next.classList.contains('locked')) {
      next.classList.remove('locked');
      if (animate) {
        next.classList.add('unlocking');
        setTimeout(function () { next.classList.remove('unlocking'); }, 600);
      }
    }
    /* Nächstes Gate freischalten */
    var nextGate = document.getElementById('qg' + (gateNr + 1));
    if (nextGate && nextGate.classList.contains('locked')) {
      nextGate.classList.remove('locked');
      if (animate) {
        nextGate.classList.add('unlocking');
        setTimeout(function () { nextGate.classList.remove('unlocking'); }, 600);
      }
    }
  }
  ```

  Replace with:

  ```javascript
  function _unlockBlock(gateNr, animate) {
    var next = document.getElementById('sw' + (gateNr + 1));
    if (next && next.classList.contains('locked')) {
      next.classList.remove('locked');
      if (animate) {
        next.classList.add('unlocking');
        setTimeout(function () { next.classList.remove('unlocking'); }, 600);
      }
    }
    /* Nächstes Gate freischalten */
    var nextGate = document.getElementById('qg' + (gateNr + 1));
    if (nextGate && nextGate.classList.contains('locked')) {
      nextGate.classList.remove('locked');
      if (animate) {
        nextGate.classList.add('unlocking');
        setTimeout(function () { nextGate.classList.remove('unlocking'); }, 600);
      }
      /* Also unlock the .qg-wrapper parent (added in visual redesign) */
      var wrapper = nextGate.closest('.qg-wrapper');
      if (wrapper) {
        wrapper.classList.remove('locked');
        if (animate) {
          wrapper.classList.add('unlocking');
          setTimeout(function () { wrapper.classList.remove('unlocking'); }, 600);
        }
      }
    }
  }
  ```

---

- [ ] **Step 2: Fix `_restoreState` forEach to also unlock `.qg-wrapper` (line ~221)**

  **Why this fix is needed in addition to Step 1:** The wrapper-unlock code added to `_unlockBlock` in Step 1 is guarded by `if (nextGate && nextGate.classList.contains('locked'))`. On page reload after progress was saved, the HTML still has the initial `locked` class on the inner `.qg` elements, so the guard passes. However, to be safe against any future state where the inner `.qg` might already be unlocked while the wrapper is not, the explicit removal is added directly in `_restoreState` as well. `classList.remove` is idempotent — calling it twice is harmless.

  Find the `_restoreState` forEach block at lines 202–223:

  ```javascript
  if (saved.gates) {
    Object.keys(saved.gates).forEach(function (key) {
      if (saved.gates[key]) {
        var nr = parseInt(key.replace('qg', ''), 10);
        qgPass[nr] = true;
        /* NOTE: _saveGates stores qgPass with integer keys.
           After JSON round-trip these become string keys like "1", "2".
           Use 'qg' + nr to construct the correct element ID. */
        var gateId = 'qg' + nr;
        var gate = document.getElementById(gateId);
        if (gate) {
          gate.setAttribute('data-passed', '1');
          gate.setAttribute('data-state', 'passed');
          var pill = document.getElementById(gateId + 's');
          if (pill) {
            pill.textContent = 'Block ' + nr + ': Bestanden';
            pill.className = 'qg-status pass';
          }
        }
        /* Nächsten Block freischalten ohne Animation */
        _unlockBlock(nr, false);
      }
    });
  }
  ```

  Replace with:

  ```javascript
  if (saved.gates) {
    Object.keys(saved.gates).forEach(function (key) {
      if (saved.gates[key]) {
        var nr = parseInt(key.replace('qg', ''), 10);
        qgPass[nr] = true;
        /* NOTE: _saveGates stores qgPass with integer keys.
           After JSON round-trip these become string keys like "1", "2".
           Use 'qg' + nr to construct the correct element ID. */
        var gateId = 'qg' + nr;
        var gate = document.getElementById(gateId);
        if (gate) {
          gate.setAttribute('data-passed', '1');
          gate.setAttribute('data-state', 'passed');
          var pill = document.getElementById(gateId + 's');
          if (pill) {
            pill.textContent = 'Block ' + nr + ': Bestanden';
            pill.className = 'qg-status pass';
          }
        }
        /* Nächsten Block freischalten ohne Animation */
        _unlockBlock(nr, false);
        /* Also unlock the .qg-wrapper for the next gate (no animation on restore) */
        var restoredGate = document.getElementById('qg' + (nr + 1));
        if (restoredGate) {
          var restoredWrapper = restoredGate.closest('.qg-wrapper');
          if (restoredWrapper) restoredWrapper.classList.remove('locked');
        }
      }
    });
  }
  ```

---

- [ ] **Step 3: Verify**

  Load unit 3.5 in a fresh browser (clear localStorage first: browser devtools → Application → Local Storage → delete `plk_3-5` key).
  - QG2 and QG3 wrappers should appear greyed/blurred at page load.
  - Pass QG1 → QG2 wrapper should visibly unlock (animate).
  - Reload after passing QG1 → QG2 should still be unlocked on restore.

---

- [ ] **Step 4: Commit**

  ```bash
  git add js/engine.js
  git commit -m "fix: unlock .qg-wrapper on gate pass and state restore"
  ```

---

### Task 4: HTML — simple fixes (prio button, qg-wrapper locked, ablauf-tags)

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html` — lines 70, 347, 504, 888–891

---

- [ ] **Step 1: Delete the prio-toggle-btn (line 70)**

  Find and delete the following line (line 70):
  ```html
  <button class="prio-toggle-btn">◇ Prüfungsrelevanz anzeigen</button>
  ```

  The surrounding `<div style="...">` contains this button AND the reset button. After deletion the div should only have the reset button:
  ```html
  <div style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
    <button class="btn btn-ghost btn-sm"
            onclick="if(confirm('Fortschritt zurücksetzen?')){Progress.clear(CONF.id);location.reload();}">
  ```

---

- [ ] **Step 2: Add `locked` to qg2 wrapper (line ~347)**

  Find:
  ```html
  <!-- QUIZ-GATE 2 -->
  <div class="qg-wrapper">
  <div class="qg locked" id="qg2">
  ```

  Replace:
  ```html
  <!-- QUIZ-GATE 2 -->
  <div class="qg-wrapper locked">
  <div class="qg locked" id="qg2">
  ```

---

- [ ] **Step 3: Add `locked` to qg3 wrapper (line ~504)**

  Find:
  ```html
  <!-- QUIZ-GATE 3 -->
  <div class="qg-wrapper">
  <div class="qg locked" id="qg3">
  ```

  Replace:
  ```html
  <!-- QUIZ-GATE 3 -->
  <div class="qg-wrapper locked">
  <div class="qg locked" id="qg3">
  ```

---

- [ ] **Step 4: Fix ablauf-tags (lines 888–891)**

  Find:
  ```html
  <span class="ablauf-tag">4 Gruppen à 4 Schüler</span>
  <span class="ablauf-tag">Arbeitszeit: 15 min</span>
  <span class="ablauf-tag">Präsentation: 3 min / Gruppe</span>
  <span class="ablauf-tag">Diskussion: 10 min</span>
  ```

  Replace:
  ```html
  <span class="ablauf-tag">4 Gruppen à 4 Schüler</span>
  <span class="ablauf-tag">Gruppenarbeit: 15 min</span>
  <span class="ablauf-tag">Präsentation: 3 min / Gruppe</span>
  <span class="ablauf-tag">Diskussion: 10 min</span>
  <span class="ablauf-tag">Gesamt: ca. 45–50 Min</span>
  ```

---

- [ ] **Step 5: Verify**

  Open unit 3.5 in browser. Confirm:
  - No "Prüfungsrelevanz anzeigen" button in header.
  - At page load (cleared state): QG2 and QG3 visually greyed.
  - Ablauf section shows 5 tags, last one reads "Gesamt: ca. 45–50 Min".

---

- [ ] **Step 6: Commit**

  ```bash
  git add einheiten/3-5_binnenmarkt.html
  git commit -m "fix: qg-wrapper locked, delete prio button, ablauf Gesamt tag"
  ```

---

## Chunk 2: UK block HTML restructure + JS rewrite

---

### Task 5: No-op checkpoint — verify CSS and engine are in place

Before touching the UK HTML, confirm that Tasks 1–4 are committed and the CSS classes from Task 2 exist (`.uk-krit-block`, `.uk-krit-opt`, `.uk-krit-recheck`, etc.). If any earlier task is incomplete, complete it first.

- [ ] Run in browser: open devtools → console, confirm no JS errors from the earlier changes.
- [ ] Confirm `--rf-acc` is defined on `:root` via devtools.

---

### Task 6: HTML — UK block restructure

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html` — `<div class="uk-body">` contents (lines ~717–873)

This task replaces the entire `<div class="uk-body"> ... </div><!-- /uk-body -->` inner content with the new methodology-structured layout.

---

- [ ] **Step 1: Replace the entire `.uk-body` inner content**

  Find the opening tag (line ~717):
  ```html
        <div class="uk-body">
  ```
  and its closing tag (line ~874):
  ```html
        </div><!-- /uk-body -->
  ```

  Replace everything BETWEEN those two tags (not including the tags themselves) with the following:

  ```html

        <!-- Leitfrage banner -->
        <div class="uk-leitfrage">
          <div class="uk-leitfrage-label">Leitfrage</div>
          <div class="uk-leitfrage-text">Überwiegen die Vorteile des EU-Binnenmarkts seine sozialen Kosten?</div>
        </div>

        <!-- Kriterium — erste Begegnung, volle Karten -->
        <div class="uk-krit-block">
          <span class="uk-krit-tag">🔴 Kriterium — Maßstab festlegen</span>
          <div class="uk-krit-q">Welcher Maßstab ist geeignet, um die Leitfrage zu beantworten?</div>
          <div class="uk-krit-opts">
            <div class="uk-krit-opt" data-msidx="0" data-correct="true"  data-error="" data-errtext=""
                 onclick="selKrit(this)">
              <span class="uk-krit-num">A</span>
              Sichert der Binnenmarkt Effizienz und sozialen Ausgleich für alle Mitglieder?
              <span class="uk-krit-opt-err"></span>
            </div>
            <div class="uk-krit-opt" data-msidx="1" data-correct="false" data-error="sided"
                 data-errtext="Dieser Maßstab erfasst nur die Wachstumsperspektive — soziale Konsequenzen bleiben außen vor."
                 onclick="selKrit(this)">
              <span class="uk-krit-num">B</span>
              Fördert der Binnenmarkt gleichmäßiges BIP-Wachstum in allen Mitgliedstaaten?
              <span class="uk-krit-opt-err"></span>
            </div>
            <div class="uk-krit-opt" data-msidx="2" data-correct="false" data-error="vague"
                 data-errtext="Ein Beschäftigungsmaßstab greift zu kurz — er ignoriert Lohnentwicklung, soziale Standards und Verteilungswirkungen."
                 onclick="selKrit(this)">
              <span class="uk-krit-num">C</span>
              Schafft der Binnenmarkt per Saldo mehr Arbeitsplätze als er verdrängt?
              <span class="uk-krit-opt-err"></span>
            </div>
          </div>
        </div>

        <!-- ── EINLEITUNG ──────────────────────────────── -->
        <div class="uk-section">
          <div class="uk-section-lbl">Einleitung</div>

          <!-- Step 1: Theoretischer Kontext (AB I) -->
          <div class="uk-step" data-step="kontext" data-ab="1">
            <div class="uk-step-header">
              <span class="uk-ab-tag">AB I — Theoretischer Kontext</span>
            </div>
            <p class="uk-step-q">Welche theoretische Grundlage hilft, die Leitfrage einzuordnen?</p>
            <ul class="uk-opts">
              <li class="uk-opt"
                  data-error="step"
                  data-errtext="Du beschreibst hier Fallbeispiele aus der Praxis — die gehören in 'Material &amp; Fall'. Der theoretische Kontext beschreibt, was Theorie und Normen sagen.">
                <span class="uk-opt-text">Sozialdumping, Brain Drain und Steuerwettbewerb zeigen, dass der Binnenmarkt in der Praxis asymmetrisch wirkt und nicht alle Mitglieder gleich profitieren.</span>
              </li>
              <li class="uk-opt" data-correct="true">
                <span class="uk-opt-text">Der Binnenmarkt basiert auf den vier Grundfreiheiten — er ist ein Regelwerk für wirtschaftliche Integration, das durch einheitliche Standards gemeinsamen Wohlstand sichern soll.</span>
              </li>
            </ul>
          </div>

          <!-- Step 2: Material & Fall (AB I) -->
          <div class="uk-step" data-step="fall" data-ab="1">
            <div class="uk-step-header">
              <span class="uk-ab-tag">AB I — Material &amp; Fall</span>
            </div>
            <p class="uk-step-q">Welche Aussage gibt die Fallbeispiele sachlich wieder, die für die Leitfrage relevant sind?</p>
            <ul class="uk-opts">
              <li class="uk-opt" data-correct="true">
                <span class="uk-opt-text">Sozialdumping durch Entsendung von Niedriglohnkräften, Brain Drain aus Osteuropa und Steuervermeidung durch Konzerne (LuxLeaks) zeigen konkrete Spannungen im Binnenmarkt.</span>
              </li>
              <li class="uk-opt"
                  data-error="level"
                  data-errtext="Du formulierst bereits ein Urteil über den Binnenmarkt. Hier sollen zunächst die Fallbeispiele sachlich dargestellt werden — das Urteil kommt in der Schlussfolgerung.">
                <span class="uk-opt-text">Der Binnenmarkt schadet strukturell den schwächeren EU-Ländern und Arbeitnehmern in Hochlohnländern — eine Reform ist unvermeidlich.</span>
              </li>
            </ul>
          </div>

        </div><!-- /Einleitung -->

        <!-- Kriterium recheck #1 — leitet AB II ein -->
        <div class="uk-krit-recheck">
          <div class="uk-krit-recheck-label">🔴 Roter Faden — Kriterium bestätigen</div>
          <div class="uk-krit-chips">
            <div class="uk-krit-chip" data-msidx="0">Effizienz + sozialer Ausgleich</div>
            <div class="uk-krit-chip" data-msidx="1">BIP-Wachstum aller Mitglieder</div>
            <div class="uk-krit-chip" data-msidx="2">Netto-Beschäftigungseffekt</div>
          </div>
          <div class="uk-krit-recheck-err"></div>
        </div>

        <!-- ── HAUPTTEIL ───────────────────────────────── -->
        <div class="uk-section">
          <div class="uk-section-lbl">Hauptteil</div>

          <!-- Step 3: Verbindung & Konflikte (AB II) -->
          <div class="uk-step" data-step="verbindung" data-ab="2">
            <div class="uk-step-header">
              <span class="uk-ab-tag">AB II — Verbindung &amp; Konflikte</span>
            </div>
            <p class="uk-step-q">Wo geraten Theorie und Fallbeispiele in Konflikt, gemessen am Kriterium der Leitfrage?</p>
            <ul class="uk-opts">
              <li class="uk-opt"
                  data-error="chain"
                  data-errtext="Du listest Sachverhalte nebeneinander, ohne den Widerspruch zu benennen. Zeige, wo Anspruch und Wirklichkeit auseinanderfallen.">
                <span class="uk-opt-text">Der Binnenmarkt hat die vier Grundfreiheiten geschaffen. Gleichzeitig entstehen Probleme wie Sozialdumping, Brain Drain und Steuerwettbewerb.</span>
              </li>
              <li class="uk-opt" data-correct="true">
                <span class="uk-opt-text">Die vier Grundfreiheiten versprechen gemeinsamen Wohlstand — die Praxis zeigt jedoch asymmetrische Ergebnisse: Stärkere Volkswirtschaften profitieren strukturell mehr, während Sozialdumping und Steuervermeidung auf Kosten schwächerer Akteure gehen.</span>
              </li>
            </ul>
          </div>

          <!-- Step 4: Abwägung (AB II) -->
          <div class="uk-step" data-step="abwaegung" data-ab="2">
            <div class="uk-step-header">
              <span class="uk-ab-tag">AB II — Abwägung</span>
            </div>
            <p class="uk-step-q">Welche Perspektive überwiegt bei der Beantwortung der Leitfrage?</p>
            <ul class="uk-opts">
              <li class="uk-opt" data-correct="true">
                <span class="uk-opt-text">Unternehmen und exportstarke Staaten sehen den Binnenmarkt als Wachstumsmotor. Arbeitnehmer in Hochlohnländern und ärmere Regionen erleben Lohndruck und Abwanderung. Beide Perspektiven müssen am gewählten Kriterium gemessen werden.</span>
              </li>
              <li class="uk-opt"
                  data-error="sided"
                  data-errtext="Du berücksichtigst nur eine Seite. Eine Abwägung zeigt, wie verschiedene Akteure dieselbe Realität unterschiedlich erleben und bewerten.">
                <span class="uk-opt-text">Der Binnenmarkt belastet Arbeitnehmer in allen EU-Ländern durch Lohndruck und verschlechterte Arbeitsbedingungen — das überwiegt die wirtschaftlichen Vorteile deutlich.</span>
              </li>
            </ul>
          </div>

        </div><!-- /Hauptteil -->

        <!-- Kriterium recheck #2 — leitet AB III ein -->
        <div class="uk-krit-recheck">
          <div class="uk-krit-recheck-label">🔴 Roter Faden — Urteil mit Kriterium verknüpfen</div>
          <div class="uk-krit-chips">
            <div class="uk-krit-chip" data-msidx="0">Effizienz + sozialer Ausgleich</div>
            <div class="uk-krit-chip" data-msidx="1">BIP-Wachstum aller Mitglieder</div>
            <div class="uk-krit-chip" data-msidx="2">Netto-Beschäftigungseffekt</div>
          </div>
          <div class="uk-krit-recheck-err"></div>
        </div>

        <!-- ── SCHLUSSFOLGERUNG ────────────────────────── -->
        <div class="uk-section">
          <div class="uk-section-lbl">Schlussfolgerung</div>

          <!-- Step 5: Begründetes Urteil (AB III) -->
          <div class="uk-step" data-step="urteil" data-ab="3">
            <div class="uk-step-header">
              <span class="uk-ab-tag">AB III — Begründetes Urteil</span>
            </div>
            <p class="uk-step-q">Welches Urteil beantwortet die Leitfrage überzeugend und verweist auf das Kriterium?</p>
            <ul class="uk-opts">
              <li class="uk-opt"
                  data-error="chain"
                  data-errtext="Das Urteil ist inhaltlich nachvollziehbar, verweist aber nicht auf das Kriterium aus der Einleitung. Das Urteil muss aus dem Kriterium folgen — das ist der rote Faden.">
                <span class="uk-opt-text">Der Binnenmarkt hat Stärken und Schwächen. Insgesamt überwiegen die wirtschaftlichen Vorteile, aber eine schrittweise Reform wäre sinnvoll.</span>
              </li>
              <li class="uk-opt" data-correct="true">
                <span class="uk-opt-text">Gemessen am Kriterium — sozialer Ausgleich und Effizienz für alle — erfüllt der Binnenmarkt seinen Anspruch nur teilweise. Solange Sozialdumping und Steuervermeidung strukturell möglich bleiben, sind verbindliche Sozialstandards und koordinierte Steuerpolitik notwendige Konsequenzen.</span>
              </li>
            </ul>
          </div>

        </div><!-- /Schlussfolgerung -->

        <!-- ── VALIDATE ────────────────────────────────── -->
        <div class="uk-validate-row">
          <button class="uk-submit" disabled onclick="chkUK(this)">Argumentation prüfen</button>
          <span class="uk-submit-hint">Wähle für jeden Schritt eine Antwort, ein Kriterium und bestätige den roten Faden.</span>
        </div>

  ```

---

- [ ] **Step 2: Verify HTML structure in browser**

  Open unit 3.5 in browser. The UK block should now show:
  - A dark Leitfrage banner at the top
  - A red-background Kriterium block with 3 card options (A/B/C)
  - Blue-background AB I steps (Einleitung section)
  - A red recheck chip row
  - Purple-background AB II steps (Hauptteil section)
  - A second red recheck chip row
  - Green-background AB III step (Schlussfolgerung section)
  - Submit button still disabled (no JS yet — clicks on cards/chips do nothing)

---

- [ ] **Step 3: Commit**

  ```bash
  git add einheiten/3-5_binnenmarkt.html
  git commit -m "feat: UK block HTML — Leitfrage banner, krit-opt cards, recheck chips, AB-level coloring"
  ```

---

### Task 7: js/uk-quiz.js — UK validation logic rewrite

**Files:**
- Modify: `js/uk-quiz.js` — full file rewrite

---

- [ ] **Step 1: Rewrite `js/uk-quiz.js`**

  Replace the entire contents of `js/uk-quiz.js` with:

  ```javascript
  /* ==========================================================
     Politik-LK — uk-quiz.js
     Interactive Urteilskompetenz block — select-all then validate
     Structure: Leitfrage → Kriterium → Einleitung → Hauptteil → Schlussfolgerung
     Kriterium: card click (replaces <select> dropdown)
     Recheck: compact chips pre-selected on Kriterium card click
     Options per step: 2 (shuffled on init)
     Load after engine.js and tooltips.js in unit HTML files.
     ========================================================== */

  ;(function () {
    'use strict';

    /* ── Error label map ────────────────────────────────── */
    var ERROR_LABELS = {
      'level':   'AB-EBENE FALSCH',
      'step':    'FALSCHER SCHRITT',
      'chain':   'KETTE UNTERBROCHEN',
      'vague':   'MAßSTAB ZU VAGE',
      'sided':   'MAßSTAB EINSEITIG',
      'factual': 'KEINE BEWERTUNGSFRAGE',
      'verdict': 'MAßSTAB ANTIZIPIERT URTEIL'
    };

    /* ── Fisher-Yates shuffle (in-place) ───────────────── */
    function _shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }

    /* ── Init ───────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.uk').forEach(_initBlock);
    });

    function _initBlock(block) {
      // Shuffle options in each step's .uk-opts list
      block.querySelectorAll('[data-step] .uk-opts').forEach(function (ul) {
        var items = Array.from(ul.querySelectorAll('.uk-opt'));
        _shuffle(items).forEach(function (li) { ul.appendChild(li); });
      });

      // ── Kriterium selection ─────────────────────────────
      // _kritIdx is a closure variable scoped to this block instance.
      // window.selKrit is assigned here so inline onclick="selKrit(this)" can reach it.
      // Note: if multiple .uk blocks exist on a page, the last _initBlock call wins.
      // Unit 3.5 has one .uk block, so this is safe.
      var _kritIdx = null;

      window.selKrit = function (el) {
        var parent = el.closest('.uk-krit-opts');
        if (!parent) return;
        // Single-select: remove selected and wrong from all siblings (clears previous error state)
        parent.querySelectorAll('.uk-krit-opt').forEach(function (o) {
          o.classList.remove('selected', 'wrong');
          var errSpan = o.querySelector('.uk-krit-opt-err');
          if (errSpan) errSpan.textContent = '';
        });
        el.classList.add('selected');
        _kritIdx = el.getAttribute('data-msidx');

        // Pre-select matching chip in all recheck blocks
        block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
          recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
            chip.classList.toggle('selected', chip.getAttribute('data-msidx') === _kritIdx);
          });
        });

        _checkAllSelected(block);
      };

      // Recheck chip click handlers
      block.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var recheck = chip.closest('.uk-krit-recheck');
          if (!recheck) return;
          recheck.querySelectorAll('.uk-krit-chip').forEach(function (c) {
            c.classList.remove('selected');
          });
          chip.classList.add('selected');
          _kritIdx = chip.getAttribute('data-msidx');
          _checkAllSelected(block);
        });
      });

      // Option click handlers
      block.querySelectorAll('.uk-opt').forEach(function (opt) {
        opt.addEventListener('click', function () { _onOptClick(block, opt); });
      });
    }

    /* ── Option click handler ──────────────────────────── */

    function _onOptClick(block, opt) {
      if (opt.classList.contains('correct')) return;

      var step = opt.closest('[data-step]');
      if (!step) return;

      var pool = step.querySelector('.uk-opts');
      if (!pool) return;

      pool.querySelectorAll('.uk-opt').forEach(function (o) {
        o.classList.remove('selected', 'incorrect');
        _clearErrorNodes(o);
      });

      opt.classList.add('selected');
      _checkAllSelected(block);
    }

    function _clearErrorNodes(opt) {
      var chip = opt.querySelector('.uk-error-chip');
      if (chip) chip.remove();
      var errp = opt.querySelector('.uk-error-text');
      if (errp) errp.remove();
    }

    /* ── All-selected check → enable/disable submit ──────── */

    function _checkAllSelected(block) {
      var allDone = true;

      // Kriterium card must be selected
      if (!block.querySelector('.uk-krit-opt.selected')) allDone = false;

      // Each recheck block must have at least one chip selected
      // (mismatch validation is deferred to chkUK — here we only check presence)
      block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
        if (!recheck.querySelector('.uk-krit-chip.selected')) allDone = false;
      });

      // Each step's .uk-opts must have a selection or correct answer
      block.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
        if (!pool.querySelector('.uk-opt.selected, .uk-opt.correct')) {
          allDone = false;
        }
      });

      var btn = block.querySelector('.uk-submit');
      if (btn) btn.disabled = !allDone;
    }

    /* ── Validation ─────────────────────────────────────── */

    window.chkUK = function (btn) {
      var block = btn.closest('.uk');
      if (!block) return;

      var allCorrect = true;

      // ── Validate Kriterium card selection ──────────────
      var kritOpt = block.querySelector('.uk-krit-opt.selected');
      var mainMsidx = null;

      if (!kritOpt) {
        allCorrect = false;
      } else {
        var msCorrect = kritOpt.getAttribute('data-correct') === 'true';
        mainMsidx = kritOpt.getAttribute('data-msidx');

        if (!msCorrect) {
          allCorrect = false;
          kritOpt.classList.remove('selected');
          kritOpt.classList.add('wrong');
          var errEl = kritOpt.querySelector('.uk-krit-opt-err');
          if (errEl) {
            var errType  = kritOpt.getAttribute('data-error') || '';
            var errText  = kritOpt.getAttribute('data-errtext') || '';
            var errLabel = ERROR_LABELS[errType] || 'FEHLER';
            errEl.textContent = errLabel + (errText ? ' — ' + errText : '');
          }
        } else {
          kritOpt.classList.remove('selected');
          kritOpt.classList.add('correct');
        }
      }

      // ── Validate recheck chips — must match mainMsidx ──
      block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
        var selChip = recheck.querySelector('.uk-krit-chip.selected');
        var recheckMsidx = selChip ? selChip.getAttribute('data-msidx') : null;

        if (recheckMsidx !== mainMsidx) {
          allCorrect = false;
          // Mark non-matching chips as wrong; correct chip stays
          recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
            if (chip.getAttribute('data-msidx') !== mainMsidx) {
              chip.classList.add('wrong');
            }
          });
          var rErr = recheck.querySelector('.uk-krit-recheck-err');
          if (rErr) {
            rErr.textContent = 'ROTER FADEN VERLOREN — Du hast ein anderes Kriterium gewählt als in der Einleitung.';
            rErr.style.display = 'block';
          }
        }
      });

      // ── Validate step options ───────────────────────────
      block.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
        var selected = pool.querySelector('.uk-opt.selected');
        if (!selected) return; // already .correct — skip

        var correct = selected.dataset.correct === 'true';
        if (!correct) allCorrect = false;

        selected.classList.remove('selected');
        selected.classList.add(correct ? 'correct' : 'incorrect');

        if (!correct) {
          _appendError(selected, selected.dataset.error || 'chain', selected.dataset.errtext || '');
        }
      });

      // ── Outcome ─────────────────────────────────────────
      if (allCorrect) {
        block.classList.add('uk-complete');
        btn.disabled = true;
        btn.textContent = '\u2713 Abgeschlossen';
        var hint = block.querySelector('.uk-submit-hint');
        if (hint) hint.textContent = 'Vollst\u00e4ndige Argumentation \u2014 gut gemacht.';
      } else {
        btn.textContent = 'Erneut pr\u00fcfen';
        btn.disabled = true;
      }
    };

    /* ── Error display helpers ──────────────────────────── */

    function _appendError(opt, type, text) {
      var chip = document.createElement('span');
      chip.className = 'uk-error-chip';
      chip.textContent = ERROR_LABELS[type] || type.toUpperCase();
      opt.appendChild(chip);

      if (text) {
        var p = document.createElement('p');
        p.className = 'uk-error-text';
        p.textContent = text;
        opt.appendChild(p);
      }
    }

  })();
  ```

---

- [ ] **Step 2: Verify full UK block interaction**

  Open unit 3.5 in browser:

  1. Submit button is disabled.
  2. Click Kriterium card A — it highlights, recheck chips in both rows auto-select "Effizienz + sozialer Ausgleich". Submit still disabled (steps not answered).
  3. Click correct option in each step.
  4. Click correct chip in both recheck rows (auto-selected, just confirm).
  5. Submit button enables. Click "Argumentation prüfen".
  6. All options + krit card + chips should show correct state. Header turns green. ✓

  Also test error path:
  1. Select wrong Kriterium card (B or C).
  2. Select wrong options in steps.
  3. Click submit — wrong krit card shows error text, wrong step options show error chips.

---

- [ ] **Step 3: Commit**

  ```bash
  git add js/uk-quiz.js
  git commit -m "feat: uk-quiz.js — Kriterium card + chip interaction, AB methodology validation"
  ```

---

## Final Verification

- [ ] Load unit 3.5 fresh (cleared localStorage). Confirm:
  - QG2 and QG3 are greyed out.
  - Ranking exercise items are the same visual weight as MC options.
  - Prüfungs blocks show corner ribbon. Context blocks are muted.
  - UK block shows: dark Leitfrage banner → red Kriterium cards → blue/purple/green AB steps → recheck chips.
  - Full UK flow works end-to-end (see Task 7 Step 2).
  - Gruppenarbeit shows "Gesamt: ca. 45–50 Min" tag.
  - Pass QG1 → QG2 and QG3 unlock in sequence. Reload confirms unlock is persisted.
