# Quiz Pipeline & New Types — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the JS stack into a PLK central registry, extract quiz logic into focused modules, add 5 new quiz types, migrate all unit HTML to `PLK.*` namespace, and add 6 documentation-only template patterns.

**Architecture:** `engine.js` owns the `window.PLK` registry and slim core only. `quiz-base.js`, `quiz-ext.js`, and `uk-quiz.js` each self-register via `PLK.register({name, init})`. `DOMContentLoaded` in `engine.js` calls `PLK.init()` first (which runs all module `init()` hooks and defines all `PLK.*` functions), then does core setup. All inline `onclick=` in unit HTML migrates to `PLK.fn()`.

**Tech Stack:** Vanilla JS ES5 (no arrow functions, no `const`/`let`, no template literals, no destructuring), no build tools, plain `<script>` tags.

**Spec:** `docs/superpowers/specs/2026-03-22-quiz-pipeline-design.md`

---

## File Map

| File | Action | Responsibility after change |
|---|---|---|
| `js/engine.js` | Major refactor | PLK registry, progress/localStorage, unlock, AB score, einstieg, password, shuffle |
| `js/progress.js` | **Delete** | Absorbed into engine.js |
| `js/quiz-base.js` | **Create** | All existing quiz types (MC, text, olist, Zuordnung, Lückentext, Kategorisierung, Freitext) |
| `js/quiz-ext.js` | **Create** | 5 new quiz types + their state save/restore hooks |
| `js/uk-quiz.js` | Refactor | UK Prüfen — joins registry, closure bug fixed |
| `js/tooltips.js` | No change | Standalone IIFE, reads `window._PLK_*` globals |
| `css/style.css` | Additive only | CSS for 5 new quiz types appended at end |
| `einheiten/3-2_lissabon.html` | Migration | Script tags updated, all `onclick` → `PLK.*` |
| `einheiten/3-3_gesetzgebung.html` | Migration | Same |
| `einheiten/3-3_gesetzgebung.html.bak` | **Delete** | — |
| `einheiten/3-4_mehrebenensystem.html` | Migration | Same |
| `einheiten/3-5_binnenmarkt.html` | Migration | Same |
| `einheiten/_template.html` | Migration + additions | Script tags, namespace, 6 new OPTIONAL patterns, 5 new quiz type examples |

---

## Task 1: Add PLK Registry to engine.js

**Files:**
- Modify: `js/engine.js` — add registry at top of IIFE, update DOMContentLoaded

The PLK object must be defined **before** any `PLK.register(...)` call in other files. Since `engine.js` is loaded first (see spec §6 load order), this is satisfied.

**IMPORTANT ES5 rules for this entire plan:**
- Use `var` not `const`/`let`
- Use `function() {}` not `() =>`
- No template literals — use `'string' + variable + 'string'`
- No spread (`...`) or destructuring

- [ ] **Step 1.1: Add PLK object at the top of the IIFE in engine.js**

Immediately after `;(function () { 'use strict';` (line 17), add:

```javascript
  /* ── PLK Module Registry ──────────────────────────────── */
  window.PLK = {
    _mods: [],
    register: function (mod) { PLK._mods.push(mod); },
    init:     function ()    {
      PLK._mods.forEach(function (m) { if (m.init) m.init(); });
    }
  };
```

- [ ] **Step 1.2: Add PLK.resetUnit() to engine.js**

In the section near `window.chkPw` (around line 102), add:

```javascript
  window.PLK.resetUnit = function () {
    PLK.Progress.clear(typeof CONF !== 'undefined' ? CONF.id : null);
    location.reload();
  };
```

- [ ] **Step 1.3: Update DOMContentLoaded to call PLK.init() first**

Find the `document.addEventListener('DOMContentLoaded', function () {` block (line 1438). Make `PLK.init()` the first statement inside the callback, before `_restoreState()`:

```javascript
  document.addEventListener('DOMContentLoaded', function () {
    PLK.init(); /* run all registered module init() hooks first */

    /* Zustand aus localStorage wiederherstellen */
    _restoreState();
    /* ... rest unchanged ... */
  });
```

Also update the `oRenum` call inside DOMContentLoaded (currently `oRenum(list)`) to `PLK.oRenum(list)` — it will be defined after `PLK.init()` runs.

- [ ] **Step 1.4: Expose Progress as PLK.Progress (keep backward compat)**

Find the `Progress` object in `progress.js`. Add to `engine.js` (after PLK registry block) the full Progress implementation from `progress.js`, wrapped under `PLK.Progress` AND still exposed as `window.Progress` until migration is complete:

```javascript
  /* ── Progress (localStorage) ──────────────────────────── */
  /* Absorbed from progress.js — progress.js will be deleted in Task 4 */
  PLK.Progress = (function () {
    /* === paste the body of progress.js's Progress object here === */
  })();
  window.Progress = PLK.Progress; /* temp shim — removed in Task 4 */
```

Read `js/progress.js` in full before this step to copy the implementation verbatim.

- [ ] **Step 1.5: Open any unit in a browser and verify it still works**

Open `einheiten/3-2_lissabon.html` (with `progress.js` still present). Password unlock, quiz gates, and einstieg should all function identically to before. Check the browser console for errors.

- [ ] **Step 1.6: Commit**

```bash
git add js/engine.js
git commit -m "feat: add PLK central registry to engine.js"
```

---

## Task 2: Create quiz-base.js

**Files:**
- Create: `js/quiz-base.js`
- Modify: `js/engine.js` — remove extracted functions

`quiz-base.js` moves all quiz-interaction functions out of `engine.js`. Each function is assigned onto `PLK` inside the `init()` hook so it is available after `PLK.init()` runs in DOMContentLoaded.

The functions to extract (and their current line numbers in engine.js) are:

| Function | engine.js line | New name |
|---|---|---|
| `window.mcS` | 287 | `PLK.mcS` |
| `window.oMv` | 302 | `PLK.oMv` |
| `window.oRenum` | 323 | `PLK.oRenum` |
| `window.chkQ` | 335 | `PLK.chkQ` |
| `window.rstQ` | 445 | `PLK.rstQ` |
| `window.toggleQg` | 483 | `PLK.toggleQg` |
| `window.retryQg` | 503 | `PLK.retryQg` |
| `window.selC` | 745 | `PLK.selC` |
| `window.slCl` | 763 | `PLK.slCl` |
| `window.frC` | 800 | private `frC` (IIFE-local helper, not on PLK — only called from within quiz-base.js) |
| `window.chkSl` | 814 | `PLK.chkSl` |
| `window.retSl` | 843 | `PLK.retSl` |
| `window.rsSl` | 859 | `PLK.rsSl` |
| `window.zCl` | 885 | `PLK.zCl` |
| `window.uM` | 949 | private `uM` (IIFE-local helper, not on PLK — only called from within quiz-base.js) |
| `window.chkZ` | 964 | `PLK.chkZ` |
| `window.retZ` | 985 | `PLK.retZ` |
| `window.rsZ` | 993 | `PLK.rsZ` |
| `window.kS` | 1020 | `PLK.kS` |
| `window.chkK` | 1035 | `PLK.chkK` |
| `window.retK` | 1056 | `PLK.retK` |
| `window.rsK` | 1066 | `PLK.rsK` |
| `window.rstAllAB` | 1260 | `PLK.rstAllAB` |
| `window.saveAB` | 1474 | `PLK.saveAB` |

**`frC` and `uM` are private helpers:** Do NOT add them to `PLK`. Change them to `var frC = function(...)` / `var uM = function(...)` inside the quiz-base.js IIFE — they are only called by other functions in the same file (e.g. `slCl` calls `frC`; `zCl` and `chkZ` call `uM`).

Also: `window.shR` (line 1085) and `window.upAB` (line 1100) and `window.rcAB` (line 1117) **stay in engine.js** as they are core utilities used by quiz-base and quiz-ext alike — but are exposed on PLK: `PLK.shR`, `PLK.upAB`, `PLK.rcAB`.

- [ ] **Step 2.1: Create js/quiz-base.js scaffold**

```javascript
/* ==========================================================
   Politik-LK — quiz-base.js
   Existing quiz types: MC · text input · ordered list ·
   Zuordnung · Lückentext · Kategorisierung · Freitext
   Requires: engine.js (PLK registry) loaded first.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  PLK.register({
    name: 'quiz-base',
    init: function () {

      /* ── paste extracted functions here, replacing
            "window.X = function" with "PLK.X = function" ── */

    }
  });

})();
```

- [ ] **Step 2.2: Move functions from engine.js into quiz-base.js init()**

Read `js/engine.js` lines 287–1082 (mcS through rsK) and 1260–1486 (rstAllAB, saveAB).

For each function:
1. Copy the JSDoc comment + function body into `quiz-base.js` inside `init()`
2. Change `window.X = function` → `PLK.X = function`
3. Any internal call to another quiz function (e.g. `shR(...)` inside `chkQ`) → `PLK.shR(...)`
4. Remove the function from `engine.js`

**Special: add chkFT (currently missing from engine.js)**

`chkFT` is referenced in the template but not implemented. Add it to `quiz-base.js`:

```javascript
      /* chkFT — Freitext: save non-empty textarea and show feedback */
      PLK.chkFT = function (textareaId, fbId) {
        var ta = document.getElementById(textareaId);
        var fb = document.getElementById(fbId);
        if (!ta) return;
        PLK._saveAbState();
        if (fb) {
          if (ta.value.trim()) {
            fb.textContent = 'Gespeichert.';
            fb.className = 'mc-feedback ok';
          } else {
            fb.textContent = 'Bitte zuerst eine Antwort eingeben.';
            fb.className = 'mc-feedback err';
          }
        }
      };
```

- [ ] **Step 2.3: Update internal references in engine.js**

After extraction, `engine.js` still has internal calls like `shR(...)`, `upAB()`, `rcAB()`. These become `PLK.shR(...)`, `PLK.upAB()`, `PLK.rcAB()` since they remain in engine.js but are now on PLK. Update them.

Also: `_saveAbState` and `_restoreAbState` remain private in engine.js — they are called internally only.

- [ ] **Step 2.4: Verify — open unit without updating script tags yet**

Temporarily add `<script src="../js/quiz-base.js"></script>` after `engine.js` in one unit (e.g. `3-2_lissabon.html`) for local testing only. The unit still uses old `onclick="chkQ(1)"` style, which now fails since `window.chkQ` no longer exists.

To verify the module wired up correctly, open browser console and check:
- `typeof PLK.chkQ === 'function'` → `true`
- `typeof window.chkQ === 'undefined'` → `true`

Revert the temporary script tag change.

- [ ] **Step 2.5: Commit**

```bash
git add js/engine.js js/quiz-base.js
git commit -m "refactor: extract quiz types into quiz-base.js module"
```

---

## Task 3: Refactor uk-quiz.js

**Files:**
- Modify: `js/uk-quiz.js`

`uk-quiz.js` currently wraps itself in an IIFE and exposes `window.selKrit` / `window.submitStage` inside a `_initBlock()` loop that runs per `.uk` block — causing the last block to overwrite the handler for all others.

The fix: `PLK.selKrit(el)` and `PLK.submitStage(el, stageN)` receive the clicked element and walk up to find their `.uk` container, so each call operates on the correct block.

- [ ] **Step 3.1: Read uk-quiz.js in full**

Read `js/uk-quiz.js` before touching it. Understand where `window.selKrit` and `window.submitStage` are assigned and what closure variables they use.

- [ ] **Step 3.2: Add closest() polyfill at top of uk-quiz.js IIFE**

```javascript
  /* Element.closest() polyfill for older browsers */
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (sel) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches ? el.matches(sel) : el.msMatchesSelector(sel)) return el;
        el = el.parentElement || el.parentNode;
      }
      return null;
    };
  }
```

- [ ] **Step 3.3: Rewrite selKrit and submitStage to use el.closest('.uk')**

Find the current `window.selKrit = function(el){ … }` and `window.submitStage = function(btn, stageN){ … }` assignments in the `_initBlock()` loop. Replace with standalone `PLK.selKrit` and `PLK.submitStage` that each start with:

```javascript
      PLK.selKrit = function (el) {
        var block = el.closest('.uk');
        if (!block) return;
        /* === move existing selKrit logic here, replacing
               closure vars with block.querySelector(...) lookups === */
      };

      PLK.submitStage = function (el, stageN) {
        var block = el.closest('.uk');
        if (!block) return;
        /* === move existing submitStage logic here === */
      };
```

These are now defined once (not per block) and find their context dynamically.

- [ ] **Step 3.4: Wrap in PLK.register**

Replace the existing IIFE pattern:
```javascript
;(function(){ … })();
```
with:
```javascript
;(function(){
  'use strict';

  /* closest() polyfill here */

  PLK.register({
    name: 'uk-quiz',
    init: function () {
      PLK.selKrit     = function (el) { … };
      PLK.submitStage = function (el, stageN) { … };
    }
  });

})();
```

Remove `_initBlock()` and any DOMContentLoaded listener that called it — the init() hook replaces that.

- [ ] **Step 3.5: Verify multi-block behavior**

Open `einheiten/3-2_lissabon.html` (which has a UK Prüfen section). Temporarily add the updated `uk-quiz.js` script tag and call `PLK.selKrit` / `PLK.submitStage` from the console against different `.uk` elements to verify each operates on the correct block.

- [ ] **Step 3.6: Commit**

```bash
git add js/uk-quiz.js
git commit -m "refactor: uk-quiz.js joins PLK registry, fix multi-block closure bug"
```

---

## Task 4: Namespace Migration

**Files:**
- Modify: all 4 unit HTML files + `_template.html`
- Delete: `js/progress.js`, `einheiten/3-3_gesetzgebung.html.bak`

This is the high-impact step. All `onclick="fn()"` → `onclick="PLK.fn()"` across every unit. Done with targeted find-replace, not manual edits.

- [ ] **Step 4.1: Update script tags in all 5 HTML files**

In each of `3-2_lissabon.html`, `3-3_gesetzgebung.html`, `3-4_mehrebenensystem.html`, `3-5_binnenmarkt.html`, and `_template.html`:

**Remove:**
```html
<script src="../js/progress.js"></script>
```

**Change** the existing script block order to:
```html
<script src="../js/engine.js"></script>
<script src="../js/quiz-base.js"></script>
<script src="../js/quiz-ext.js"></script>
<script src="../js/uk-quiz.js"></script>
<script src="../data/glossary.js"></script>
<script src="../data/operators.js"></script>
<script src="../data/units.js"></script>
<script src="../js/tooltips.js"></script>
```

Note: `quiz-ext.js` does not exist yet — that is fine; it will be created in Task 5. The script tag should be added now so migration is complete.

- [ ] **Step 4.2: Migrate inline onclick/onchange — automated find-replace**

Run these replacements in sequence across all 5 HTML files. Use the Edit tool's `replace_all: true` or a PowerShell command per file:

```powershell
# Run for each file:
$f = 'einheiten\3-2_lissabon.html'
$content = Get-Content $f -Raw
$replacements = @(
  @('onclick="chkPw(',       'onclick="PLK.chkPw('),
  @('onclick="toggleEinstieg(', 'onclick="PLK.toggleEinstieg('),
  @('onclick="selEinstieg(', 'onclick="PLK.selEinstieg('),
  @('onclick="chkEinstieg(', 'onclick="PLK.chkEinstieg('),
  @('onclick="retryEinstieg(', 'onclick="PLK.retryEinstieg('),
  @('onclick="toggleQg(',    'onclick="PLK.toggleQg('),
  @('onchange="mcS(',        'onchange="PLK.mcS('),
  @('onclick="oMv(',         'onclick="PLK.oMv('),
  @('onclick="chkQ(',        'onclick="PLK.chkQ('),
  @('onclick="rstQ(',        'onclick="PLK.rstQ('),
  @('onclick="retryQg(',     'onclick="PLK.retryQg('),
  @('onclick="selC(',        'onclick="PLK.selC('),
  @('onclick="slCl(',        'onclick="PLK.slCl('),
  @('onclick="chkSl(',       'onclick="PLK.chkSl('),
  @('onclick="retSl(',       'onclick="PLK.retSl('),
  @('onclick="rsSl(',        'onclick="PLK.rsSl('),
  @('onclick="zCl(',         'onclick="PLK.zCl('),
  @('onclick="chkZ(',        'onclick="PLK.chkZ('),
  @('onclick="retZ(',        'onclick="PLK.retZ('),
  @('onclick="rsZ(',         'onclick="PLK.rsZ('),
  @('onclick="kS(',          'onclick="PLK.kS('),
  @('onclick="chkK(',        'onclick="PLK.chkK('),
  @('onclick="retK(',        'onclick="PLK.retK('),
  @('onclick="rsK(',         'onclick="PLK.rsK('),
  @('onclick="chkFT(',       'onclick="PLK.chkFT('),
  @('onclick="saveAB(',      'onclick="PLK.saveAB('),
  @('onclick="rstAllAB(',    'onclick="PLK.rstAllAB('),
  @('onclick="selKrit(',     'onclick="PLK.selKrit('),
  @('onclick="submitStage(', 'onclick="PLK.submitStage('),
  @('onclick="retZ(',        'onclick="PLK.retZ(')
)
foreach ($r in $replacements) { $content = $content.Replace($r[0], $r[1]) }
Set-Content $f $content -NoNewline
```

Repeat for all 5 HTML files.

- [ ] **Step 4.3: Migrate Progress.clear reset buttons**

Find-replace the inline reset button pattern in all 5 files:

**Find:** `Progress.clear(CONF.id);location.reload();`
**Replace:** `PLK.resetUnit();`

The surrounding `if(confirm('…')){…}` remains unchanged.

- [ ] **Step 4.4: Full browser test — all 4 units (before deleting anything)**

Open each unit. For each:
1. Enter password → units unlock ✓
2. Complete einstieg ✓
3. Answer quiz gate questions, submit → gate passes, next block unlocks ✓
4. Complete one AB task ✓
5. Refresh page → answers restored ✓
6. Click reset button → confirm dialog → page resets ✓
7. Check browser console — zero errors

Fix any errors before proceeding to the cleanup steps below.

- [ ] **Step 4.5: Remove window.Progress shim from engine.js**

Only after the browser test passes: in engine.js, remove the `window.Progress = PLK.Progress;` line added in Task 1.4.

- [ ] **Step 4.6: Delete progress.js and .bak**

```bash
rm js/progress.js
rm einheiten/3-3_gesetzgebung.html.bak
```

- [ ] **Step 4.7: Commit**

```bash
git add js/engine.js einheiten/3-2_lissabon.html einheiten/3-3_gesetzgebung.html \
        einheiten/3-4_mehrebenensystem.html einheiten/3-5_binnenmarkt.html \
        einheiten/_template.html
git rm js/progress.js einheiten/3-3_gesetzgebung.html.bak
git commit -m "refactor: migrate all units to PLK namespace, delete progress.js"
```

---

## Task 5: CSS for quiz-ext Types

**Files:**
- Modify: `css/style.css` — append new sections at end

All five new quiz types need CSS. Append to the end of `style.css` (after the last existing section).

- [ ] **Step 5.1: Append CSS for Checkbox MC**

No new CSS needed — checkbox MC reuses existing `.mco-list` and `.mco` styles. The checkbox `<input type="checkbox">` inherits from existing `.mco label` layout.

- [ ] **Step 5.2: Append CSS for Dropdown Lückentext**

```css
/* =====================================================
   43. Dropdown Lückentext (.drop-slot)
   Inline <select> used inside prose text
   ===================================================== */

.drop-slot {
  display: inline-block;
  font-family: var(--ff-body);
  font-size: .88rem;
  color: var(--ink);
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: .15rem .5rem;
  cursor: pointer;
  min-width: 6rem;
  vertical-align: baseline;
}

.drop-slot:focus { outline: 2px solid var(--acc); outline-offset: 1px; }
.drop-slot.ok  { border-color: var(--ok);  background: var(--ok-l);  color: var(--ok); }
.drop-slot.err { border-color: var(--err); background: var(--err-l); color: var(--err); }
```

- [ ] **Step 5.3: Append CSS for Selbsteinschätzung**

```css
/* =====================================================
   44. Selbsteinschätzung (.self-wrap)
   4-point confidence scale — completion only, not graded
   ===================================================== */

.self-wrap {
  background: var(--card);
  border: 1px solid var(--border-l);
  border-radius: var(--r);
  padding: 1rem 1.25rem;
  margin: var(--gap) 0;
}

.self-q {
  font-size: .9rem;
  color: var(--ink);
  margin-bottom: .75rem;
  line-height: 1.5;
}

.self-opts {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}

.self-btn {
  font-family: var(--ff-body);
  font-size: .78rem;
  padding: .35rem .85rem;
  border: 1.5px solid var(--border);
  border-radius: 20px;
  background: var(--bg);
  color: var(--ink2);
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
}

.self-btn:hover { border-color: var(--acc); color: var(--acc); }

.self-btn.active {
  border-color: var(--acc);
  background: var(--accL);
  color: var(--acc);
  font-weight: 600;
}

.self-wrap.done .self-btn.active {
  border-color: var(--ok);
  background: var(--ok-l);
  color: var(--ok);
}
```

- [ ] **Step 5.4: Append CSS for Zuordnung-Tabelle**

```css
/* =====================================================
   45. Zuordnung-Tabelle (.zt-table)
   Radio matrix — one selection per row
   ===================================================== */

.zt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .85rem;
  margin: .75rem 0;
}

.zt-table th {
  padding: .5rem .75rem;
  background: var(--bg);
  font-family: var(--ff-mono);
  font-size: .65rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ink3);
  font-weight: 600;
  border-bottom: 2px solid var(--border-l);
  text-align: center;
}

.zt-table th:first-child { text-align: left; }

.zt-table td {
  padding: .55rem .75rem;
  border-bottom: 1px solid var(--border-l);
  color: var(--ink2);
  vertical-align: middle;
  text-align: center;
}

.zt-table td:first-child { text-align: left; color: var(--ink); font-weight: 500; }

.zt-table tr.ok  td { background: var(--ok-l);  }
.zt-table tr.err td { background: var(--err-l); }

.zt-table input[type="radio"] { cursor: pointer; width: 1.1rem; height: 1.1rem; }
```

- [ ] **Step 5.5: Append CSS for Markieren**

```css
/* =====================================================
   46. Markieren (.mark-text, .mk)
   Click to tag words/phrases in a text
   ===================================================== */

.mark-text {
  background: var(--input-bg);
  border: 1px solid var(--border-l);
  border-radius: var(--r);
  padding: 1rem 1.25rem;
  font-size: .9rem;
  line-height: 2;
  margin: .75rem 0;
}

.mk {
  cursor: pointer;
  border-radius: 3px;
  padding: .05rem .2rem;
  border-bottom: 2px solid transparent;
  transition: background .12s, border-color .12s;
}

.mk:hover { background: var(--accG); border-bottom-color: var(--acc); }

.mk.mk-selected {
  background: var(--accL);
  border-bottom-color: var(--acc);
  color: var(--acc);
  font-weight: 600;
}

.mk.ok  { background: var(--ok-l);  border-bottom-color: var(--ok);  color: var(--ok);  }
.mk.err { background: var(--err-l); border-bottom-color: var(--err); color: var(--err); }
```

- [ ] **Step 5.6: Commit**

```bash
git add css/style.css
git commit -m "feat: add CSS for quiz-ext types (dropdown, selbsteinschätzung, zt-table, markieren)"
```

---

## Task 6: Create quiz-ext.js with All 5 New Types

**Files:**
- Create: `js/quiz-ext.js`

All five types live in one file. The file also contains the `_saveExtState()` / `_restoreExtState()` hooks that integrate with `engine.js`'s `_saveAbState()` / `_restoreAbState()`.

- [ ] **Step 6.1: Create js/quiz-ext.js scaffold**

```javascript
/* ==========================================================
   Politik-LK — quiz-ext.js
   New quiz types: Checkbox MC · Dropdown Lückentext ·
   Selbsteinschätzung · Zuordnung-Tabelle · Markieren
   Requires: engine.js (PLK registry + PLK.shR + PLK.upAB)
             and quiz-base.js loaded before this file.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Internal save/restore (extend state.ab blob) ──────── */

  /* ES5 helper — NodeList.forEach is ES6; use this instead */
  function _each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  function _saveExt(ab, state) {
    /* Called from engine.js _saveAbState — if PLK._saveExtState exists */
    if (!state.ab) state.ab = {};

    /* Dropdown slots — keyed by "wrapId:slotIndex" composite.
       wrapId = id of the nearest id'd ancestor element (the chkDrop container).
       This matches spec §4.6: state.ab.drop[wrapId][slotIndex].
       AUTHORING RULE: every group of .drop-slot elements must be inside a
       container element that has an id="" attribute (the same id passed to
       PLK.chkDrop(wrapId, ...)). The container id must be unique on the page. */
    state.ab.drop = {};
    _each(ab.querySelectorAll('.drop-slot'), function (sel, pageIdx) {
      /* Walk up the DOM until we find an element with an id that is not the
         ab wrapper itself. Fallback to pageIdx if no id'd ancestor found. */
      var ancestor = sel.parentElement;
      while (ancestor && ancestor !== ab && !ancestor.id) {
        ancestor = ancestor.parentElement;
      }
      var wrapId = (ancestor && ancestor !== ab && ancestor.id)
        ? ancestor.id
        : (console.warn('PLK: .drop-slot has no id\'d ancestor — state will not restore'), 'drop' + pageIdx);
      if (!state.ab.drop[wrapId]) state.ab.drop[wrapId] = {};
      /* Slot index within the wrapper */
      var siblings = ancestor ? ancestor.querySelectorAll('.drop-slot') : [sel];
      var idx = Array.prototype.indexOf.call(siblings, sel);
      state.ab.drop[wrapId][idx < 0 ? pageIdx : idx] = sel.value;
    });

    /* Selbsteinschätzung */
    state.ab.self = {};
    _each(ab.querySelectorAll('.self-wrap[id]'), function (wrap) {
      var active = wrap.querySelector('.self-btn.active');
      if (active) state.ab.self[wrap.id] = active.getAttribute('data-v');
    });

    /* Zuordnung-Tabelle */
    state.ab.zt = {};
    _each(ab.querySelectorAll('.zt-table[id] tbody tr'), function (row, i) {
      var tableId = row.closest('.zt-table').id;
      if (!state.ab.zt[tableId]) state.ab.zt[tableId] = {};
      var checked = row.querySelector('input[type="radio"]:checked');
      if (checked) state.ab.zt[tableId][i] = checked.value;
    });

    /* Markieren */
    state.ab.mk = {};
    _each(ab.querySelectorAll('.mark-text[id]'), function (wrap) {
      state.ab.mk[wrap.id] = {};
      _each(wrap.querySelectorAll('.mk'), function (span, i) {
        state.ab.mk[wrap.id][i] = span.classList.contains('mk-selected') ? 1 : 0;
      });
    });
  }

  function _restoreExt(ab, saved) {
    if (!saved || !saved.ab) return;

    /* Dropdown — nested state.ab.drop[wrapId][slotIndex] per spec §4.6 */
    if (saved.ab.drop) {
      Object.keys(saved.ab.drop).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var slots = wrap.querySelectorAll('.drop-slot');
        var vals  = saved.ab.drop[wrapId];
        Object.keys(vals).forEach(function (idx) {
          var slot = slots[parseInt(idx, 10)];
          if (slot) slot.value = vals[idx];
        });
      });
    }

    /* Selbsteinschätzung */
    if (saved.ab.self) {
      Object.keys(saved.ab.self).forEach(function (wrapperId) {
        var wrap = document.getElementById(wrapperId);
        if (!wrap) return;
        var v = saved.ab.self[wrapperId];
        _each(wrap.querySelectorAll('.self-btn'), function (btn) {
          if (btn.getAttribute('data-v') === v) btn.classList.add('active');
        });
        wrap.classList.add('done');
      });
    }

    /* Zuordnung-Tabelle */
    if (saved.ab.zt) {
      Object.keys(saved.ab.zt).forEach(function (tableId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        var rows = table.querySelectorAll('tbody tr');
        var vals = saved.ab.zt[tableId];
        Object.keys(vals).forEach(function (idx) {
          var row = rows[parseInt(idx, 10)];
          if (!row) return;
          _each(row.querySelectorAll('input[type="radio"]'), function (radio) {
            if (radio.value === vals[idx]) radio.checked = true;
          });
        });
      });
    }

    /* Markieren */
    if (saved.ab.mk) {
      Object.keys(saved.ab.mk).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var spans = wrap.querySelectorAll('.mk');
        var vals = saved.ab.mk[wrapId];
        Object.keys(vals).forEach(function (idx) {
          if (vals[idx] && spans[parseInt(idx, 10)]) {
            spans[parseInt(idx, 10)].classList.add('mk-selected');
          }
        });
      });
    }
  }

  PLK.register({
    name: 'quiz-ext',
    init: function () {

      /* Expose hooks for engine.js _saveAbState / _restoreAbState */
      PLK._saveExtState   = _saveExt;
      PLK._restoreExtState = _restoreExt;

      /* ── 1. Checkbox MC ── */
      PLK.mcsCbx = function (el) {
        var li = el.parentElement ? el.parentElement.parentElement : null;
        if (!li) return;
        if (el.checked) {
          li.classList.add('sel');
        } else {
          li.classList.remove('sel');
        }
      };
      /* Note: chkQ in quiz-base.js already handles checkbox inputs
         in its mcGroups loop — no separate chkCbx needed. */

      /* ── 2. Dropdown Lückentext ── */
      PLK.chkDrop = function (wrapId, n, fbId, retryId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var slots = wrap.querySelectorAll('.drop-slot[data-a]');
        var correct = 0;
        _each(slots, function (sel) {
          var expected = sel.getAttribute('data-a').toLowerCase().trim();
          var given    = sel.value.toLowerCase().trim();
          sel.classList.remove('ok', 'err');
          if (given === expected) {
            sel.classList.add('ok');
            sel.disabled = true;
            correct++;
          } else if (given) {
            sel.classList.add('err');
          }
        });
        PLK.shR(fbId, correct, n);
        PLK._saveAbState();
        if (correct === n) {
          PLK.upAB();
          if (retryId) {
            var btn = document.getElementById(retryId);
            if (btn) btn.style.display = 'none';
          }
        } else if (retryId) {
          var retBtn = document.getElementById(retryId);
          if (retBtn) retBtn.style.display = '';
        }
      };

      PLK.rstDrop = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _each(wrap.querySelectorAll('.drop-slot'), function (sel) {
          sel.value = '';
          sel.classList.remove('ok', 'err');
          sel.disabled = false;
        });
        PLK._saveAbState();
      };

      /* ── 3. Selbsteinschätzung ── */
      PLK.chkSelf = function (btn) {
        var wrap = btn.closest('.self-wrap');
        if (!wrap || wrap.classList.contains('done')) return;
        _each(wrap.querySelectorAll('.self-btn'), function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        wrap.classList.add('done');
        PLK.upAB();
        PLK._saveAbState();
      };

      /* ── 4. Zuordnung-Tabelle ── */
      PLK.selZT = function (radio) {
        var row = radio.closest('tr');
        if (!row) return;
        row.classList.remove('ok', 'err');
      };

      PLK.chkZT = function (tableId, fbId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        var rows = table.querySelectorAll('tbody tr[data-correct]');
        var correct = 0;
        _each(rows, function (row) {
          var expected = row.getAttribute('data-correct');
          var checked  = row.querySelector('input[type="radio"]:checked');
          row.classList.remove('ok', 'err');
          if (checked && checked.value === expected) {
            row.classList.add('ok');
            correct++;
          } else if (checked) {
            row.classList.add('err');
          }
        });
        PLK.shR(fbId, correct, rows.length);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstZT = function (tableId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        _each(table.querySelectorAll('input[type="radio"]'), function (r) {
          r.checked = false;
        });
        _each(table.querySelectorAll('tbody tr'), function (row) {
          row.classList.remove('ok', 'err');
        });
        PLK._saveAbState();
      };

      /* ── 5. Markieren ── */
      PLK.mkCl = function (span) {
        if (span.classList.contains('ok') || span.classList.contains('err')) return;
        span.classList.toggle('mk-selected');
        PLK._saveAbState();
      };

      PLK.chkMark = function (wrapId, n, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var spans = wrap.querySelectorAll('.mk');
        var correct = 0;
        _each(spans, function (span) {
          var isCorrect = span.getAttribute('data-correct') === '1';
          var isSelected = span.classList.contains('mk-selected');
          span.classList.remove('ok', 'err', 'mk-selected');
          if (isCorrect && isSelected) {
            span.classList.add('ok');
            correct++;
          } else if (!isCorrect && isSelected) {
            span.classList.add('err');
          } else if (isCorrect && !isSelected) {
            span.classList.add('err'); /* missed */
          }
        });
        PLK.shR(fbId, correct, n);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstMark = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _each(wrap.querySelectorAll('.mk'), function (span) {
          span.classList.remove('mk-selected', 'ok', 'err');
        });
        PLK._saveAbState();
      };

    } /* /init */
  });

})();
```

- [ ] **Step 6.2: Wire quiz-ext hooks into engine.js _saveAbState / _restoreAbState**

In `engine.js`, find `function _saveAbState()` (line ~1133) and add at the end of it:

```javascript
    /* quiz-ext types */
    if (PLK._saveExtState) PLK._saveExtState(ab, state);
```

Find `function _restoreAbState(saved)` (line ~1184) and add at the end:

```javascript
    /* quiz-ext types */
    if (PLK._restoreExtState) PLK._restoreExtState(ab, saved);
```

Note: `PLK._saveExtState` is only defined after `PLK.init()` runs, which happens before `_restoreAbState` is called in DOMContentLoaded — so the timing is correct.

Also expose `PLK._saveAbState` so quiz-ext functions can call it:
```javascript
  PLK._saveAbState = _saveAbState; /* expose for use in quiz-base + quiz-ext */
```

Add this line near the end of `engine.js` (after `_saveAbState` is defined, before DOMContentLoaded).

- [ ] **Step 6.3: Browser test each new quiz type**

Create a minimal test page at `einheiten/_quiz-ext-test.html` (copy `_template.html` and add one example of each type). Test in browser:

1. **Checkbox MC**: check multiple boxes, submit via `PLK.chkQ(1)` — correct ones highlighted ✓
2. **Dropdown**: select values, call `PLK.chkDrop('wrap','bk',2,'fb','retry')` — ok/err styling ✓
3. **Selbsteinschätzung**: click a rating — button highlights, done state set ✓
4. **Zuordnung-Tabelle**: select radios, call `PLK.chkZT('zt1','fb')` — row colors ✓
5. **Markieren**: click words, call `PLK.chkMark('mk1',2,'fb')` — ok/err per word ✓
6. **Reload page** → all selections restored from state ✓

Delete `_quiz-ext-test.html` after testing.

- [ ] **Step 6.4: Commit**

```bash
git add js/engine.js js/quiz-ext.js
git commit -m "feat: add quiz-ext.js with 5 new quiz types + state restore"
```

---

## Task 7: Template Additions — 6 Existing Patterns + 5 New Quiz Types

**Files:**
- Modify: `einheiten/_template.html`

Two categories of additions:
1. **6 documentation patterns** (existing code patterns from unit files, added as `<!-- OPTIONAL -->` blocks)
2. **5 new quiz type examples** (template examples with `FILL:` comments)

- [ ] **Step 7.1: Add lk-note and badge-gold patterns**

Find the `<!-- OPTIONAL: unit-specific styles -->` `<style>` block. Add at the end (before closing `</style>`):

```css
    /* ── Teacher note (always visible, subtle) ── */
    /* .lk-note is in style.css — no unit-specific CSS needed */
```

Find the SW block 1 content area. Add before `</div><!-- /block content -->`:

```html
      <!-- ── OPTION: badge badge-gold — Klausurrelevant marker on SW block header ── -->
      <!-- Add to the .sw-head row: -->
      <!-- <span class="badge badge-gold" style="margin-left:auto">Klausurrelevant</span> -->

      <!-- ── OPTION: lk-note — always-visible teacher hint (no JS needed) ── -->
      <!-- Place anywhere inside a .sw block or .auf block -->
      <!-- <div class="lk-note">
        <strong>Hinweis Lehrkraft:</strong> Didaktischer Hinweis oder Musterlösung.
      </div> -->
```

- [ ] **Step 7.2: Add Denkanstöße / Reflexion block pattern**

After the OPTION G–J section in SW block 1, add:

```html
      <!-- ── OPTION K: Denkanstöße / Reflexion block (discussion prompt) ── -->
      <!-- Inline-styled — no CSS class needed. Replace --de/--eu colours as needed. -->
      <!-- FILL: phase label, Leitfrage, Denkanstöße bullet points -->
      <!-- <div style="background:var(--euL);border-left:3px solid var(--eu);border-radius:6px;padding:1rem 1.25rem;margin-top:1rem">
        <div style="font-family:var(--ff-mono);font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:var(--eu);margin-bottom:.4rem">Phase 1 · Einstieg</div>
        <div style="font-size:.9rem;font-weight:600;color:var(--ink);margin-bottom:.5rem">Leitfrage für diese Phase?</div>
        <p style="font-size:.85rem;color:var(--ink2);line-height:1.65">
          <strong>Denkanstöße:</strong> Erster Denkanstoß.
          Zweiter Denkanstoß.
        </p>
      </div> -->
```

- [ ] **Step 7.3: Add mep-* pyramid and ums-flow patterns**

Read `einheiten/3-4_mehrebenensystem.html` lines ~276–318 for the `mep-*` pyramid code, and `einheiten/3-3_gesetzgebung.html` for `ums-flow`. Add both as commented-out `<!-- OPTIONAL -->` blocks with `FILL:` comments and unit-specific CSS in the `<style>` section.

- [ ] **Step 7.4: Add 5 new quiz type examples to the AB section**

In the `#arbeitsblatt` div, after the Freitext task (Aufgabe 5), add commented-out examples for all 5 new types:

**Checkbox MC:**
```html
    <!-- ─────────────────────────────────────────────────────────────
         OPTIONAL: Checkbox MC — "select all that apply" (AB I–II)
         Uses same mco-list structure as radio MC but with checkboxes.
         Multiple data-correct="1" items allowed.
         Checked via PLK.chkQ(N) — no separate function needed.
         ───────────────────────────────────────────────────────────── -->
    <!--
    <div class="qi">
      <div class="qi-n">Frage X von Y</div>
      <div class="qi-t">Wähle alle zutreffenden Aussagen aus.</div>
      <ul class="mco-list">
        <li class="mco" data-correct="1">
          <label style="display:flex;align-items:center;gap:.6rem;width:100%;cursor:pointer">
            <input type="checkbox" name="q1_Xc" onchange="PLK.mcsCbx(this)"> Richtige Aussage A</label></li>
        <li class="mco">
          <label style="display:flex;align-items:center;gap:.6rem;width:100%;cursor:pointer">
            <input type="checkbox" name="q1_Xc" onchange="PLK.mcsCbx(this)"> Falsche Aussage</label></li>
        <li class="mco" data-correct="1">
          <label style="display:flex;align-items:center;gap:.6rem;width:100%;cursor:pointer">
            <input type="checkbox" name="q1_Xc" onchange="PLK.mcsCbx(this)"> Richtige Aussage B</label></li>
      </ul>
    </div>
    -->
```

**Dropdown Lückentext:**
```html
    <!-- ─────────────────────────────────────────────────────────────
         OPTIONAL: Dropdown Lückentext (AB I)
         FILL: drop-slot data-a (correct value), option values + labels.
               data-a must exactly match one option value.
               PLK.chkDrop(wrapId, n, fbId, retryId)
               n = number of .drop-slot elements.
         ───────────────────────────────────────────────────────────── -->
    <!-- <div class="auf" id="auf6-wrap">
      <div class="auf-h">
        <div class="auf-n">06</div>
        <h2 class="auf-title">Lückentext (Auswahl): Titel</h2>
        <div class="auf-tags">
          <span class="lz-chip"><span class="lz-chip-id">LZ 1</span><span class="lz-chip-text">Zuordnen</span></span>
          <span class="klausur-tag">AB I</span>
        </div>
      </div>
      <p class="auf-i">Wähle den richtigen Begriff aus dem Dropdown-Menü.</p>
      <div class="auf-body" id="auf6-body">
        <div style="background:var(--input-bg);border:1px solid var(--border-l);border-radius:10px;padding:1.5rem 1rem;font-size:.88rem;color:var(--ink2);line-height:2.2">
          Die EU hat
          <select class="drop-slot" data-a="27">
            <option value="">—</option>
            <option value="15">15</option>
            <option value="27">27</option>
            <option value="31">31</option>
          </select>
          Mitgliedstaaten.
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-top:1rem">
          <button class="btn btn-primary" onclick="PLK.chkDrop('auf6-wrap',1,'auf6-result','auf6-retry')">Überprüfen</button>
          <button class="btn btn-ghost btn-sm" id="auf6-retry" style="display:none" onclick="PLK.rstDrop('auf6-wrap')">Zurücksetzen</button>
        </div>
        <div class="mc-feedback" id="auf6-result" style="margin-top:.75rem"></div>
      </div>
    </div> -->
```

**Selbsteinschätzung:**
```html
    <!-- ─────────────────────────────────────────────────────────────
         OPTIONAL: Selbsteinschätzung — Confidence scale (AB II–III)
         Counts 1 AB point on any rating selection. Not graded.
         FILL: id, data-pts, self-q text.
         ───────────────────────────────────────────────────────────── -->
    <!-- <div class="self-wrap" id="self1" data-pts="1">
      <div class="self-q">Ich kann erklären, wie … funktioniert.</div>
      <div class="self-opts">
        <button class="self-btn" data-v="1" onclick="PLK.chkSelf(this)">gar nicht</button>
        <button class="self-btn" data-v="2" onclick="PLK.chkSelf(this)">kaum</button>
        <button class="self-btn" data-v="3" onclick="PLK.chkSelf(this)">gut</button>
        <button class="self-btn" data-v="4" onclick="PLK.chkSelf(this)">sicher ✓</button>
      </div>
    </div> -->
```

**Zuordnung-Tabelle:**
```html
    <!-- ─────────────────────────────────────────────────────────────
         OPTIONAL: Zuordnung-Tabelle — Radio matrix (AB I–II)
         FILL: table id, column headers, rows (data-correct = correct column value,
               radio name="tableId_rN" unique per row, radio value = column header).
               PLK.chkZT(tableId, fbId) — 1 pt per correct row.
         ───────────────────────────────────────────────────────────── -->
    <!-- <div class="auf" id="auf7">
      <div class="auf-h">
        <div class="auf-n">07</div>
        <h2 class="auf-title">Zuordnung: Ebenen</h2>
        <div class="auf-tags">
          <span class="lz-chip"><span class="lz-chip-id">LZ 1</span><span class="lz-chip-text">Einordnen</span></span>
          <span class="klausur-tag">AB I</span>
        </div>
      </div>
      <p class="auf-i">Ordne jedes Organ der richtigen Ebene zu.</p>
      <div class="auf-body">
        <table class="zt-table" id="zt1">
          <thead><tr>
            <th></th><th>Spalte A</th><th>Spalte B</th><th>Spalte C</th>
          </tr></thead>
          <tbody>
            <tr data-correct="Spalte A">
              <td>Organ / Begriff 1</td>
              <td><input type="radio" name="zt1_r1" onclick="PLK.selZT(this)" value="Spalte A"></td>
              <td><input type="radio" name="zt1_r1" onclick="PLK.selZT(this)" value="Spalte B"></td>
              <td><input type="radio" name="zt1_r1" onclick="PLK.selZT(this)" value="Spalte C"></td>
            </tr>
            <!-- FILL: add more rows; name="zt1_rN" increments N per row -->
          </tbody>
        </table>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">
          <button class="btn btn-primary" onclick="PLK.chkZT('zt1','zt1-result')">Überprüfen</button>
          <button class="btn btn-ghost btn-sm" onclick="PLK.rstZT('zt1')">Zurücksetzen</button>
        </div>
        <div class="mc-feedback" id="zt1-result" style="margin-top:.75rem"></div>
      </div>
    </div> -->
```

**Markieren:**
```html
    <!-- ─────────────────────────────────────────────────────────────
         OPTIONAL: Markieren — Click to tag words (AB II)
         FILL: wrap id, data-n (number of correct spans),
               mark each taggable word with class="mk",
               mark correct words with data-correct="1".
               PLK.chkMark(wrapId, n, fbId).
         ───────────────────────────────────────────────────────────── -->
    <!-- <div class="auf" id="auf8">
      <div class="auf-h">
        <div class="auf-n">08</div>
        <h2 class="auf-title">Markieren: Titel</h2>
        <div class="auf-tags">
          <span class="lz-chip"><span class="lz-chip-id">LZ 1</span><span class="lz-chip-text">Identifizieren</span></span>
          <span class="klausur-tag">AB II</span>
        </div>
      </div>
      <p class="auf-i">Markiere alle Begriffe, die auf … zutreffen.</p>
      <div class="auf-body">
        <div class="mark-text" id="mk1" data-n="2">
          Satz mit
          <span class="mk" data-correct="1" onclick="PLK.mkCl(this)">richtigem Begriff</span>
          und einem
          <span class="mk" onclick="PLK.mkCl(this)">falschem Begriff</span>
          sowie einem weiteren
          <span class="mk" data-correct="1" onclick="PLK.mkCl(this)">richtigen Begriff</span>.
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">
          <button class="btn btn-primary" onclick="PLK.chkMark('mk1',2,'mk1-result')">Überprüfen</button>
          <button class="btn btn-ghost btn-sm" onclick="PLK.rstMark('mk1')">Zurücksetzen</button>
        </div>
        <div class="mc-feedback" id="mk1-result" style="margin-top:.75rem"></div>
      </div>
    </div> -->
```

- [ ] **Step 7.5: Update all template onclick= calls to PLK.* namespace**

Run the same find-replace from Task 4.2 against `_template.html` (already done in Task 4, verify it's complete).

- [ ] **Step 7.6: Commit**

```bash
git add einheiten/_template.html
git commit -m "docs: add 6 existing patterns + 5 new quiz type examples to _template.html"
```

---

## Task 8: Final Verification and PR

- [ ] **Step 8.1: Full regression test — all 4 units**

For each of `3-2_lissabon.html`, `3-3_gesetzgebung.html`, `3-4_mehrebenensystem.html`, `3-5_binnenmarkt.html`:

1. Open in browser, check console — zero errors ✓
2. Password unlock ✓
3. Einstieg → all questions → submit ✓
4. All 3 quiz gates → pass each → next block unlocks ✓
5. AB: complete Zuordnung, Lückentext, Kategorisierung, UK Prüfen, Freitext ✓
6. Refresh → all AB state restored ✓
7. Reset button → confirm → page resets, progress cleared ✓
8. UK Prüfen on 3-2: complete stage 1, stage 2, stage 3 ✓

- [ ] **Step 8.2: Verify no orphaned `window.fn` calls remain**

```bash
grep -rn "onclick=\"[a-z]" einheiten/ --include="*.html" | grep -v "PLK\." | grep -v "<!--"
```

Expected output: zero lines (all onclick= use PLK.* or are inside HTML comments).

- [ ] **Step 8.3: Verify progress.js is gone and no file references it**

```bash
ls js/progress.js  # should fail
grep -r "progress.js" einheiten/ js/  # should be empty
```

- [ ] **Step 8.4: Push and create PR**

```bash
git push -u origin HEAD
gh pr create \
  --title "feat: PLK module pipeline + 5 new quiz types" \
  --body "$(cat <<'EOF'
## Summary
- Refactors JS stack into PLK central registry (engine.js + quiz-base.js + quiz-ext.js + uk-quiz.js)
- Deletes progress.js (absorbed into engine.js)
- Fixes uk-quiz.js multi-block closure bug via el.closest('.uk')
- Migrates all unit HTML onclick= to PLK.* namespace
- Adds 5 new quiz types: Checkbox MC, Dropdown Lückentext, Selbsteinschätzung, Zuordnung-Tabelle, Markieren
- All new types restore state on page reload via state.ab blob
- Adds 11 new OPTIONAL patterns to _template.html

## Test plan
- [ ] All 4 units: password → einstieg → 3 quiz gates → full AB → refresh → reset
- [ ] No orphaned window.fn() calls (grep check)
- [ ] UK Prüfen multi-block pages: each block operates independently
- [ ] Each new quiz type: interact → check → reload → state restored

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
