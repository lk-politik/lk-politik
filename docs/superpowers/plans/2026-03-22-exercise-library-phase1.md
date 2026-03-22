# Exercise Library Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a universal exercise library (three-tier: template → index → detail files) plus a new `quiz-lib.js` module with 6 new interactive exercise types for the Politik-LK learning platform.

**Architecture:** New `js/quiz-lib.js` PLK module registers 6 exercise types (Timeline, Flashcard, Slider, Def-Match, Sort-Buckets, Build-a-Concept) following the exact same IIFE + `PLK.register()` pattern as `quiz-ext.js`. State persistence via new `PLK._saveLibState`/`PLK._restoreLibState` bridge hooks added to `engine.js`. Documentation lives in `einheiten/_exercises.html` (index) and `einheiten/_ex/*.html` (one detail file per type).

**Tech Stack:** Vanilla ES5 JavaScript (no const/let/arrow functions/template literals/NodeList.forEach), HTML5, CSS3. No build step, no npm, no test framework. All verification is manual browser inspection.

---

## File Map

| File | Action |
|---|---|
| `js/engine.js` | Add 2 hook calls at lines 790 and 871 |
| `css/style.css` | Append CSS sections 51–57 at end of file |
| `js/quiz-lib.js` | **Create** — new PLK module, 6 exercise types |
| `einheiten/_template.html` | Remove 5 exercise OPTIONAL blocks (lines 1277–1423); add pointer comment; add optional `quiz-lib.js` script reference |
| `einheiten/_exercises.html` | **Create** — index of all exercise types |
| `einheiten/_ex/` | **Create directory** |
| `einheiten/_ex/mc-radio.html` | **Create** — Radio MC detail |
| `einheiten/_ex/mc-checkbox.html` | **Create** — Checkbox MC detail |
| `einheiten/_ex/gap-chips.html` | **Create** — Lückentext chips detail |
| `einheiten/_ex/gap-dropdown.html` | **Create** — Dropdown Lückentext detail |
| `einheiten/_ex/order-list.html` | **Create** — Sequence ordering detail |
| `einheiten/_ex/zuordnung.html` | **Create** — Zuordnung click-pairs detail |
| `einheiten/_ex/zuordnung-table.html` | **Create** — Zuordnung-Tabelle detail |
| `einheiten/_ex/kategorisierung.html` | **Create** — Kategorisierung detail |
| `einheiten/_ex/markieren.html` | **Create** — Markieren detail |
| `einheiten/_ex/spot-error.html` | **Create** — Spot the Error detail |
| `einheiten/_ex/selbsteinschaetzung.html` | **Create** — Selbsteinschätzung detail |
| `einheiten/_ex/freitext.html` | **Create** — Freitext detail |
| `einheiten/_ex/uk-pruefen.html` | **Create** — UK Prüfen detail |
| `einheiten/_ex/timeline.html` | **Create** — Timeline detail |
| `einheiten/_ex/flashcard.html` | **Create** — Flashcard detail |
| `einheiten/_ex/slider.html` | **Create** — Slider detail |
| `einheiten/_ex/def-match.html` | **Create** — Def-Match detail |
| `einheiten/_ex/sort-buckets.html` | **Create** — Sort Buckets detail |
| `einheiten/_ex/build-concept.html` | **Create** — Build-a-Concept detail |

---

## Task 1: engine.js — Add quiz-lib state bridge hooks

**Files:**
- Modify: `js/engine.js:790-791` (save hook)
- Modify: `js/engine.js:871` (restore hook)

This task is 2 one-line additions. No testing beyond browser console verification.

- [ ] **Step 1.1: Open `js/engine.js` and locate line 790**

  The section looks like this (read lines 786–793 to confirm):
  ```javascript
      var existing = PLK.Progress.load(CONF.id) || {};
      existing.ab = state;
      /* quiz-ext types — must run before Progress.save so ext sub-keys are included */
      if (PLK._saveExtState) PLK._saveExtState(ab, state);
      PLK.Progress.save(CONF.id, existing);
  ```

- [ ] **Step 1.2: Insert the quiz-lib save hook**

  After line 790 (`if (PLK._saveExtState)...`), insert one new line so the block becomes:
  ```javascript
      /* quiz-ext types — must run before Progress.save so ext sub-keys are included */
      if (PLK._saveExtState) PLK._saveExtState(ab, state);
      if (PLK._saveLibState) PLK._saveLibState(ab, state);
      PLK.Progress.save(CONF.id, existing);
  ```

- [ ] **Step 1.3: Locate line 871 and insert the quiz-lib restore hook**

  The section looks like (read lines 869–873 to confirm):
  ```javascript
      /* quiz-ext types */
      if (PLK._restoreExtState) PLK._restoreExtState(ab, saved);
  }
  ```

  Insert one new line after `_restoreExtState`:
  ```javascript
      /* quiz-ext types */
      if (PLK._restoreExtState) PLK._restoreExtState(ab, saved);
      if (PLK._restoreLibState) PLK._restoreLibState(ab, saved);
  }
  ```

- [ ] **Step 1.4: Verify**

  Open any unit HTML in a browser (e.g. `einheiten/3-2_lissabon.html`). Open dev console. Run:
  ```javascript
  PLK._saveLibState  // should be undefined (quiz-lib.js not yet loaded)
  PLK._restoreLibState  // should be undefined
  ```
  No errors should appear. This is correct — the hooks fire only when quiz-lib.js is loaded.

- [ ] **Step 1.5: Commit**
  ```
  git add js/engine.js
  git commit -m "feat: add quiz-lib state bridge hooks to engine.js"
  ```

---

## Task 2: css/style.css — Sections 51–57

**Files:**
- Modify: `css/style.css` (append at end)

CSS variables available: `--bg`, `--card`, `--input-bg`, `--ink`, `--ink2`, `--ink3`, `--border`, `--border-l`, `--ok`, `--ok-l`, `--err`, `--err-l`, `--acc`, `--accL`, `--accG`, `--r`, `--r-sm`.

- [ ] **Step 2.1: Append all 7 CSS sections to end of `css/style.css`**

  Append exactly the following block:

  ```css
  /* =====================================================
     51. Timeline (.tl-wrap / .tl-chip / .tl-slot)
     Click-to-place event chips into chronological slots
     ===================================================== */

  .tl-wrap { margin: .75rem 0; }

  .tl-bank {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    padding: .75rem;
    background: var(--input-bg);
    border: 1px solid var(--border-l);
    border-radius: var(--r);
    margin-bottom: .75rem;
    min-height: 2.75rem;
  }

  .tl-chip {
    background: var(--card);
    border: 1.5px solid var(--acc);
    color: var(--acc);
    border-radius: var(--r-sm);
    padding: .3rem .75rem;
    font-size: .82rem;
    cursor: pointer;
    user-select: none;
    transition: background .12s;
  }
  .tl-chip:hover     { background: var(--accG); }
  .tl-chip.active    { background: var(--accL); font-weight: 600; }

  .tl-slots {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
  }

  .tl-slot {
    flex: 1;
    min-width: 110px;
    min-height: 3.5rem;
    border: 2px dashed var(--border);
    border-radius: var(--r);
    padding: .4rem .65rem;
    font-size: .8rem;
    color: var(--ink3);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: .25rem;
    transition: border-color .12s, background .12s;
  }
  .tl-slot:hover  { border-color: var(--acc); background: var(--accG); }
  .tl-slot.filled { border-style: solid; border-color: var(--border); }
  .tl-slot.ok     { border-color: var(--ok);  background: var(--ok-l); }
  .tl-slot.err    { border-color: var(--err); background: var(--err-l); }

  /* =====================================================
     52. Flashcard (.fc-set / .fc-card / .fc-inner)
     CSS 3D flip: term front, definition back
     ===================================================== */

  .fc-set {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: .75rem 0;
  }

  .fc-card {
    perspective: 800px;
    width: 240px;
    min-height: 140px;
    cursor: pointer;
  }

  .fc-inner {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 140px;
    transition: transform .45s;
    transform-style: preserve-3d;
  }
  .fc-card.fc-flipped .fc-inner { transform: rotateY(180deg); }

  .fc-front,
  .fc-back {
    position: absolute;
    inset: 0;
    min-height: 140px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: var(--r);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: .5rem;
  }

  .fc-front {
    background: var(--card);
    border: 1.5px solid var(--acc);
  }
  .fc-back {
    background: var(--accL);
    border: 1.5px solid var(--acc);
    transform: rotateY(180deg);
  }

  .fc-term {
    font-weight: 600;
    font-size: .9rem;
    color: var(--ink);
    flex: 1;
    display: flex;
    align-items: center;
  }
  .fc-def {
    font-size: .84rem;
    color: var(--ink2);
    line-height: 1.55;
    flex: 1;
  }

  .fc-flip-btn {
    background: transparent;
    border: 1px solid var(--acc);
    color: var(--acc);
    border-radius: var(--r-sm);
    padding: .25rem .65rem;
    font-size: .75rem;
    cursor: pointer;
    align-self: flex-end;
    transition: background .12s;
  }
  .fc-flip-btn:hover { background: var(--accG); }

  /* =====================================================
     53. Slider Estimation (.sldr-wrap / .sldr-input)
     Range input with tolerance-band correctness check
     ===================================================== */

  .sldr-wrap {
    background: var(--input-bg);
    border: 1px solid var(--border-l);
    border-radius: var(--r);
    padding: 1rem 1.25rem;
    margin: .75rem 0;
  }

  .sldr-q {
    font-size: .88rem;
    color: var(--ink2);
    margin-bottom: .75rem;
  }

  .sldr-row {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .sldr-lo,
  .sldr-hi {
    font-size: .78rem;
    color: var(--ink3);
    white-space: nowrap;
  }

  .sldr-input {
    flex: 1;
    accent-color: var(--acc);
    cursor: pointer;
  }
  .sldr-input.correct { accent-color: var(--ok); }
  .sldr-input.wrong   { accent-color: var(--err); }

  .sldr-val {
    font-size: .85rem;
    font-weight: 600;
    color: var(--acc);
    text-align: center;
    margin-top: .4rem;
  }

  /* =====================================================
     54. Definition → Term Match (.dm-wrap)
     Two-panel click-to-pair matching
     ===================================================== */

  .dm-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .75rem;
    margin: .75rem 0;
  }

  .dm-def,
  .dm-term {
    background: var(--input-bg);
    border: 1.5px solid var(--border-l);
    border-radius: var(--r-sm);
    padding: .6rem .85rem;
    font-size: .85rem;
    color: var(--ink2);
    cursor: pointer;
    transition: border-color .12s, background .12s;
    margin-bottom: .4rem;
  }
  .dm-def:hover,
  .dm-term:hover   { border-color: var(--acc); background: var(--accG); }

  .dm-def.dm-active,
  .dm-term.dm-active { border-color: var(--acc); background: var(--accL); font-weight: 600; }

  .dm-def.paired,
  .dm-term.paired  { border-style: dashed; cursor: default; opacity: .75; }

  .dm-def.ok,
  .dm-term.ok  { border-color: var(--ok);  background: var(--ok-l);  color: var(--ok); }
  .dm-def.err,
  .dm-term.err { border-color: var(--err); background: var(--err-l); color: var(--err); }

  /* =====================================================
     55. Sort into Buckets (.sb-wrap / .sb-chip / .sb-bucket)
     Select a chip then click a bucket to place it
     ===================================================== */

  .sb-wrap { margin: .75rem 0; }

  .sb-bank {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    padding: .75rem;
    background: var(--input-bg);
    border: 1px solid var(--border-l);
    border-radius: var(--r);
    margin-bottom: .75rem;
    min-height: 2.75rem;
  }

  .sb-chip {
    background: var(--card);
    border: 1.5px solid var(--border);
    border-radius: var(--r-sm);
    padding: .3rem .75rem;
    font-size: .82rem;
    color: var(--ink2);
    cursor: pointer;
    user-select: none;
    transition: background .12s, border-color .12s;
  }
  .sb-chip:hover  { border-color: var(--acc); background: var(--accG); }
  .sb-chip.active { border-color: var(--acc); background: var(--accL); font-weight: 600; }
  .sb-chip.ok     { border-color: var(--ok);  background: var(--ok-l);  color: var(--ok); }
  .sb-chip.err    { border-color: var(--err); background: var(--err-l); color: var(--err); }

  .sb-buckets {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
  }

  .sb-bucket {
    flex: 1;
    min-width: 160px;
    border: 2px dashed var(--border);
    border-radius: var(--r);
    cursor: pointer;
    transition: border-color .12s, background .12s;
    overflow: hidden;
  }
  .sb-bucket:hover { border-color: var(--acc); background: var(--accG); }

  .sb-bucket-label {
    background: var(--border-l);
    padding: .35rem .75rem;
    font-size: .78rem;
    font-weight: 600;
    color: var(--ink3);
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .sb-bucket-items {
    padding: .5rem;
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
    min-height: 2.5rem;
  }

  /* =====================================================
     56. Build-a-Concept (.bc-wrap / .bc-chip)
     Toggle chips to identify concept components
     ===================================================== */

  .bc-wrap {
    background: var(--input-bg);
    border: 1px solid var(--border-l);
    border-radius: var(--r);
    padding: 1rem 1.25rem;
    margin: .75rem 0;
  }

  .bc-prompt {
    font-size: .88rem;
    color: var(--ink2);
    margin-bottom: .75rem;
  }

  .bc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
  }

  .bc-chip {
    background: var(--card);
    border: 1.5px solid var(--border);
    border-radius: var(--r-sm);
    padding: .35rem .8rem;
    font-size: .84rem;
    color: var(--ink2);
    cursor: pointer;
    user-select: none;
    transition: background .12s, border-color .12s;
  }
  .bc-chip:hover       { border-color: var(--acc); background: var(--accG); }
  .bc-chip.bc-selected { border-color: var(--acc); background: var(--accL); color: var(--acc); font-weight: 600; }
  .bc-chip.bc-correct  { border-color: var(--ok);  background: var(--ok-l);  color: var(--ok);  cursor: default; }
  .bc-chip.bc-wrong    { border-color: var(--err); background: var(--err-l); color: var(--err); cursor: default; }

  /* =====================================================
     57. Spot the Error modifier (.mark-text.spot-error)
     Red-tinted framing for error-finding exercises
     ===================================================== */

  .mark-text.spot-error {
    background: #fff8f8;
    border-color: var(--err);
    cursor: crosshair;
  }
  ```

- [ ] **Step 2.2: Verify CSS loads without errors**

  Open `einheiten/3-2_lissabon.html` in browser. Open dev console — no CSS parse errors. Open browser inspector and search for `.tl-wrap` in the computed styles panel; it should be defined.

- [ ] **Step 2.3: Commit**
  ```
  git add css/style.css
  git commit -m "feat: add CSS sections 51-57 for quiz-lib exercise types"
  ```

---

## Task 3: js/quiz-lib.js — Create the PLK module

**Files:**
- Create: `js/quiz-lib.js`

ES5 strict mode throughout. Follow quiz-ext.js exactly: IIFE wrapper, `_each()` helper, private save/restore functions, `PLK.register({name, init})`.

- [ ] **Step 3.1: Create `js/quiz-lib.js` with complete content**

  ```javascript
  /* ==========================================================
     Politik-LK — quiz-lib.js
     Exercise library: Timeline · Flashcard · Slider ·
     Definition-Term Match · Sort into Buckets · Build-a-Concept
     Requires: engine.js (PLK registry + PLK.shR + PLK.upAB
               + PLK._saveAbState) loaded first.
     ES5 only — no arrow functions, no const/let.
     ========================================================== */

  ;(function () {
    'use strict';

    /* ES5 helper — NodeList.forEach is ES6; use this instead */
    function _each(nodeList, fn) {
      Array.prototype.forEach.call(nodeList, fn);
    }

    /* ── State save/restore ──────────────────────────────────── */

    function _saveLib(ab, state) {
      if (!state.ab) state.ab = {};

      /* Timeline — per-slot: which chip data-id is placed there */
      state.ab.tl = {};
      _each(ab.querySelectorAll('.tl-wrap[id]'), function (wrap) {
        state.ab.tl[wrap.id] = {};
        _each(wrap.querySelectorAll('.tl-slot'), function (slot, i) {
          var chip = slot.querySelector('.tl-chip');
          if (chip) state.ab.tl[wrap.id][i] = chip.getAttribute('data-id');
        });
      });

      /* Flashcard — per-card: whether it has been flipped (seen) */
      state.ab.fc = {};
      _each(ab.querySelectorAll('.fc-card.fc-flipped[id]'), function (card) {
        state.ab.fc[card.id] = 'seen';
      });

      /* Slider — per-wrap: array of current slider values */
      state.ab.sldr = {};
      _each(ab.querySelectorAll('.sldr-wrap[id]'), function (wrap) {
        state.ab.sldr[wrap.id] = [];
        _each(wrap.querySelectorAll('.sldr-input'), function (inp, i) {
          state.ab.sldr[wrap.id][i] = inp.value;
        });
      });

      /* Def-Match — per-wrap: {termId → defId} pairing map */
      state.ab.dm = {};
      _each(ab.querySelectorAll('.dm-wrap[id]'), function (wrap) {
        state.ab.dm[wrap.id] = {};
        _each(wrap.querySelectorAll('.dm-term[data-paired]'), function (term) {
          state.ab.dm[wrap.id][term.getAttribute('data-id')] =
            term.getAttribute('data-paired');
        });
      });

      /* Sort Buckets — per-wrap: array indexed by data-order → bucketId */
      state.ab.sb = {};
      _each(ab.querySelectorAll('.sb-wrap[id]'), function (wrap) {
        state.ab.sb[wrap.id] = [];
        _each(wrap.querySelectorAll('.sb-chip[data-order]'), function (chip) {
          var bucket = chip.parentElement;
          while (bucket && !bucket.classList.contains('sb-bucket')) {
            bucket = bucket.parentElement;
          }
          var idx = parseInt(chip.getAttribute('data-order'), 10);
          state.ab.sb[wrap.id][idx] =
            bucket ? bucket.getAttribute('data-bucket-id') : null;
        });
      });

      /* Build-a-Concept — per-wrap: array indexed by chip position → 0/1 */
      state.ab.bc = {};
      _each(ab.querySelectorAll('.bc-wrap[id]'), function (wrap) {
        state.ab.bc[wrap.id] = [];
        _each(wrap.querySelectorAll('.bc-chip'), function (chip, i) {
          state.ab.bc[wrap.id][i] =
            chip.classList.contains('bc-selected') ? 1 : 0;
        });
      });
    }

    function _restoreLib(ab, saved) {
      if (!saved || !saved.ab) return;

      /* Timeline */
      if (saved.ab.tl) {
        Object.keys(saved.ab.tl).forEach(function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var bank     = wrap.querySelector('.tl-bank');
          var slots    = wrap.querySelectorAll('.tl-slot');
          var slotData = saved.ab.tl[wrapId];
          if (!bank) return;
          Object.keys(slotData).forEach(function (idx) {
            var chipId = slotData[idx];
            if (!chipId) return;
            var chip = bank.querySelector('.tl-chip[data-id="' + chipId + '"]');
            if (!chip) return;
            var slot = slots[parseInt(idx, 10)];
            if (!slot) return;
            slot.appendChild(chip);
            slot.classList.add('filled');
          });
        });
      }

      /* Flashcard */
      if (saved.ab.fc) {
        Object.keys(saved.ab.fc).forEach(function (cardId) {
          var card = document.getElementById(cardId);
          if (card) card.classList.add('fc-flipped');
        });
      }

      /* Slider */
      if (saved.ab.sldr) {
        Object.keys(saved.ab.sldr).forEach(function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var inputs = wrap.querySelectorAll('.sldr-input');
          var vals   = saved.ab.sldr[wrapId];
          vals.forEach(function (v, i) {
            if (inputs[i]) {
              inputs[i].value = v;
              PLK.sldrLive(inputs[i]);
            }
          });
        });
      }

      /* Def-Match */
      if (saved.ab.dm) {
        Object.keys(saved.ab.dm).forEach(function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var pairings = saved.ab.dm[wrapId];
          Object.keys(pairings).forEach(function (termId) {
            var defId  = pairings[termId];
            var termEl = wrap.querySelector('.dm-term[data-id="' + termId + '"]');
            var defEl  = wrap.querySelector('.dm-def[data-id="'  + defId  + '"]');
            if (!termEl || !defEl) return;
            termEl.setAttribute('data-paired', defId);
            defEl.setAttribute('data-paired',  termId);
            termEl.classList.add('paired');
            defEl.classList.add('paired');
          });
        });
      }

      /* Sort Buckets */
      if (saved.ab.sb) {
        Object.keys(saved.ab.sb).forEach(function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var placements = saved.ab.sb[wrapId];
          placements.forEach(function (bucketId, order) {
            if (!bucketId) return;
            var chip = wrap.querySelector(
              '.sb-chip[data-order="' + order + '"]'
            );
            if (!chip) return;
            var bucket = wrap.querySelector(
              '.sb-bucket[data-bucket-id="' + bucketId + '"]'
            );
            if (!bucket) return;
            var itemsDiv = bucket.querySelector('.sb-bucket-items');
            if (itemsDiv) itemsDiv.appendChild(chip);
          });
        });
      }

      /* Build-a-Concept */
      if (saved.ab.bc) {
        Object.keys(saved.ab.bc).forEach(function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var vals  = saved.ab.bc[wrapId];
          var chips = wrap.querySelectorAll('.bc-chip');
          vals.forEach(function (v, i) {
            if (chips[i] && v) chips[i].classList.add('bc-selected');
          });
        });
      }
    }

    /* ── Module registration ─────────────────────────────────── */

    PLK.register({
      name: 'quiz-lib',
      init: function () {

        /* Expose state hooks for engine.js */
        PLK._saveLibState    = _saveLib;
        PLK._restoreLibState = _restoreLib;

        /* Store original slider default values at init time */
        _each(document.querySelectorAll('.sldr-input'), function (inp) {
          if (!inp.hasAttribute('data-default')) {
            inp.setAttribute('data-default', inp.value);
          }
        });

        /* Assign stable data-order to each chip in Sort Bucket banks */
        _each(document.querySelectorAll('.sb-bank'), function (bank) {
          _each(bank.querySelectorAll('.sb-chip'), function (chip, i) {
            chip.setAttribute('data-order', i);
          });
        });

        /* ── 1. Timeline ─────────────────────────────────────── */

        var _tlActive = null; /* currently selected chip */

        PLK.tlSel = function (el) {
          if (_tlActive) _tlActive.classList.remove('active');
          if (_tlActive === el) { _tlActive = null; return; }
          el.classList.add('active');
          _tlActive = el;
        };

        PLK.tlDrop = function (slotEl) {
          if (!_tlActive) return;
          /* If slot already filled, move existing chip back to bank first */
          var existing = slotEl.querySelector('.tl-chip');
          if (existing) {
            var wrap = slotEl;
            while (wrap && !wrap.classList.contains('tl-wrap')) {
              wrap = wrap.parentElement;
            }
            var bank = wrap ? wrap.querySelector('.tl-bank') : null;
            if (bank) bank.appendChild(existing);
          }
          slotEl.appendChild(_tlActive);
          slotEl.classList.add('filled');
          _tlActive.classList.remove('active');
          _tlActive = null;
          PLK._saveAbState();
        };

        PLK.chkTL = function (wrapId, fbId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var slots   = wrap.querySelectorAll('.tl-slot');
          var correct = 0;
          _each(slots, function (slot) {
            var chip     = slot.querySelector('.tl-chip');
            var placed   = chip ? chip.getAttribute('data-id') : null;
            var expected = slot.getAttribute('data-correct');
            slot.classList.remove('ok', 'err');
            if (placed && placed === expected) {
              slot.classList.add('ok');
              correct++;
            } else if (placed) {
              slot.classList.add('err');
            }
          });
          PLK.shR(fbId, correct, slots.length);
          PLK.upAB();
          PLK._saveAbState();
        };

        PLK.rstTL = function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var bank = wrap.querySelector('.tl-bank');
          if (!bank) return;
          _each(wrap.querySelectorAll('.tl-slot .tl-chip'), function (chip) {
            chip.classList.remove('active');
            bank.appendChild(chip);
          });
          _each(wrap.querySelectorAll('.tl-slot'), function (slot) {
            slot.classList.remove('filled', 'ok', 'err');
          });
          if (_tlActive) { _tlActive = null; }
          PLK._saveAbState();
        };

        /* ── 2. Flashcard ────────────────────────────────────── */

        PLK.fcFlip = function (el) {
          var card = el;
          while (card && !card.classList.contains('fc-card')) {
            card = card.parentElement;
          }
          if (!card) return;
          card.classList.toggle('fc-flipped');
          PLK._saveAbState();
        };

        PLK.rstFC = function (setId) {
          var set = document.getElementById(setId);
          if (!set) return;
          _each(set.querySelectorAll('.fc-card'), function (card) {
            card.classList.remove('fc-flipped');
          });
          PLK._saveAbState();
        };

        /* ── 3. Slider Estimation ────────────────────────────── */

        PLK.sldrLive = function (el) {
          var wrap = el;
          while (wrap && !wrap.classList.contains('sldr-wrap')) {
            wrap = wrap.parentElement;
          }
          if (!wrap) return;
          var display = wrap.querySelector('.sldr-val');
          if (display) display.textContent = el.value;
        };

        PLK.chkSlider = function (wrapId, fbId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var inputs  = wrap.querySelectorAll('.sldr-input');
          var correct = 0;
          _each(inputs, function (inp) {
            var val    = parseInt(inp.value, 10);
            var target = parseInt(inp.getAttribute('data-correct'), 10);
            var tol    = parseInt(inp.getAttribute('data-tol') || '5', 10);
            inp.classList.remove('correct', 'wrong');
            if (Math.abs(val - target) <= tol) {
              inp.classList.add('correct');
              correct++;
            } else {
              inp.classList.add('wrong');
            }
          });
          PLK.shR(fbId, correct, inputs.length);
          /* Show correct value for each wrong slider (spec §4.3) */
          var fbEl = document.getElementById(fbId);
          if (fbEl) {
            _each(inputs, function (inp) {
              if (inp.classList.contains('wrong')) {
                var note = document.createElement('span');
                note.style.cssText =
                  'display:block;font-size:.8rem;margin-top:.3rem;color:var(--ink3)';
                note.textContent =
                  'Richtig: ' + inp.getAttribute('data-correct');
                fbEl.appendChild(note);
              }
            });
          }
          PLK.upAB();
          PLK._saveAbState();
        };

        PLK.rstSlider = function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          _each(wrap.querySelectorAll('.sldr-input'), function (inp) {
            var def = inp.getAttribute('data-default') || inp.defaultValue;
            inp.value = def;
            inp.classList.remove('correct', 'wrong');
            PLK.sldrLive(inp);
          });
          PLK._saveAbState();
        };

        /* ── 4. Definition → Term Match ─────────────────────── */

        PLK.dmSel = function (el, side) {
          /* Ignore already-paired items */
          if (el.hasAttribute('data-paired')) return;
          var wrap = el;
          while (wrap && !wrap.classList.contains('dm-wrap')) {
            wrap = wrap.parentElement;
          }
          if (!wrap) return;
          var sideClass  = (side === 'def') ? 'dm-def'  : 'dm-term';
          var otherClass = (side === 'def') ? 'dm-term' : 'dm-def';
          var otherActive = wrap.querySelector(
            '.' + otherClass + '.dm-active'
          );
          if (otherActive) {
            /* Complete the pair */
            var defEl  = (side === 'def')  ? el : otherActive;
            var termEl = (side === 'term') ? el : otherActive;
            defEl.setAttribute('data-paired',  termEl.getAttribute('data-id'));
            termEl.setAttribute('data-paired', defEl.getAttribute('data-id'));
            defEl.classList.remove('dm-active');
            termEl.classList.remove('dm-active');
            defEl.classList.add('paired');
            termEl.classList.add('paired');
            PLK._saveAbState();
          } else {
            /* Deselect same side, then select this one */
            _each(wrap.querySelectorAll('.' + sideClass + '.dm-active'),
              function (e) { e.classList.remove('dm-active'); }
            );
            el.classList.add('dm-active');
          }
        };

        PLK.chkDM = function (wrapId, fbId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var terms   = wrap.querySelectorAll('.dm-term');
          var correct = 0;
          _each(terms, function (term) {
            var paired   = term.getAttribute('data-paired');
            var expected = term.getAttribute('data-correct-def');
            term.classList.remove('ok', 'err');
            var defEl = paired
              ? wrap.querySelector('.dm-def[data-id="' + paired + '"]')
              : null;
            if (defEl) defEl.classList.remove('ok', 'err');
            if (paired && paired === expected) {
              term.classList.add('ok');
              if (defEl) defEl.classList.add('ok');
              correct++;
            } else if (paired) {
              term.classList.add('err');
              if (defEl) defEl.classList.add('err');
            }
          });
          PLK.shR(fbId, correct, terms.length);
          PLK.upAB();
          PLK._saveAbState();
        };

        PLK.rstDM = function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          _each(wrap.querySelectorAll('.dm-def, .dm-term'), function (el) {
            el.removeAttribute('data-paired');
            el.classList.remove('paired', 'dm-active', 'ok', 'err');
          });
          PLK._saveAbState();
        };

        /* ── 5. Sort into Buckets ────────────────────────────── */

        var _sbActive = null; /* currently selected chip */

        PLK.sbSel = function (el) {
          if (_sbActive) _sbActive.classList.remove('active');
          if (_sbActive === el) { _sbActive = null; return; }
          el.classList.add('active');
          _sbActive = el;
        };

        PLK.sbDrop = function (bucketEl) {
          if (!_sbActive) return;
          var itemsDiv = bucketEl.querySelector('.sb-bucket-items') || bucketEl;
          _sbActive.classList.remove('active');
          itemsDiv.appendChild(_sbActive);
          _sbActive = null;
          PLK._saveAbState();
        };

        PLK.chkSB = function (wrapId, fbId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var chips   = wrap.querySelectorAll('.sb-chip');
          var correct = 0;
          _each(chips, function (chip) {
            var expected = chip.getAttribute('data-correct');
            var bucket   = chip.parentElement;
            while (bucket && !bucket.classList.contains('sb-bucket')) {
              bucket = bucket.parentElement;
            }
            var placed = bucket ? bucket.getAttribute('data-bucket-id') : null;
            chip.classList.remove('ok', 'err');
            if (placed && placed === expected) {
              chip.classList.add('ok');
              correct++;
            } else if (placed) {
              chip.classList.add('err');
            }
          });
          PLK.shR(fbId, correct, chips.length);
          PLK.upAB();
          PLK._saveAbState();
        };

        PLK.rstSB = function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var bank = wrap.querySelector('.sb-bank');
          if (!bank) return;
          _each(wrap.querySelectorAll('.sb-bucket-items .sb-chip'),
            function (chip) {
              chip.classList.remove('ok', 'err', 'active');
              bank.appendChild(chip);
            }
          );
          if (_sbActive) { _sbActive = null; }
          PLK._saveAbState();
        };

        /* ── 6. Build-a-Concept ──────────────────────────────── */

        PLK.bcTog = function (el) {
          if (el.classList.contains('bc-correct') ||
              el.classList.contains('bc-wrong')) return;
          el.classList.toggle('bc-selected');
          PLK._saveAbState();
        };

        PLK.chkBC = function (wrapId, fbId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          var chips   = wrap.querySelectorAll('.bc-chip');
          var correct = 0;
          _each(chips, function (chip) {
            var shouldSelect = chip.getAttribute('data-correct') === '1';
            var isSelected   = chip.classList.contains('bc-selected');
            chip.classList.remove('bc-selected', 'bc-correct', 'bc-wrong');
            if (shouldSelect === isSelected) {
              chip.classList.add('bc-correct');
              correct++;
            } else {
              chip.classList.add('bc-wrong');
            }
          });
          PLK.shR(fbId, correct, chips.length);
          PLK.upAB();
          PLK._saveAbState();
        };

        PLK.rstBC = function (wrapId) {
          var wrap = document.getElementById(wrapId);
          if (!wrap) return;
          _each(wrap.querySelectorAll('.bc-chip'), function (chip) {
            chip.classList.remove('bc-selected', 'bc-correct', 'bc-wrong');
          });
          PLK._saveAbState();
        };

      } /* /init */
    });

  })();
  ```

- [ ] **Step 3.2: Add `quiz-lib.js` to a test unit temporarily**

  In `einheiten/3-2_lissabon.html`, add one line after the quiz-ext.js script tag (for testing only — remove after Task 3):
  ```html
  <script src="../js/quiz-lib.js"></script>
  ```

- [ ] **Step 3.3: Verify PLK.* functions registered**

  Open `einheiten/3-2_lissabon.html` in browser. Open console. Run:
  ```javascript
  typeof PLK.tlSel       // "function"
  typeof PLK.fcFlip      // "function"
  typeof PLK.chkSlider   // "function"
  typeof PLK.dmSel       // "function"
  typeof PLK.sbSel       // "function"
  typeof PLK.bcTog       // "function"
  typeof PLK._saveLibState    // "function"
  typeof PLK._restoreLibState // "function"
  ```
  All must return `"function"`. No console errors.

- [ ] **Step 3.4: Remove temporary script tag from 3-2_lissabon.html**

  Remove the `quiz-lib.js` script tag added in Step 3.2.

- [ ] **Step 3.5: Commit**
  ```
  git add js/quiz-lib.js
  git commit -m "feat: add quiz-lib.js PLK module with 6 new exercise types"
  ```

---

## Task 4: _template.html — Remove exercise blocks, update script reference

**Files:**
- Modify: `einheiten/_template.html:1277-1425`

The 5 exercise OPTIONAL blocks (Checkbox MC, Dropdown Lückentext, Selbsteinschätzung, Zuordnung-Tabelle, Markieren — lines 1277–1424) are removed and replaced with a single pointer comment. A commented-out `quiz-lib.js` script reference is added to the load order.

- [ ] **Step 4.1: Remove the 5 exercise OPTIONAL blocks**

  Delete the entire block from the first exercise comment to the closing `</div><!-- /#arbeitsblatt -->`:

  Find and remove everything from:
  ```html
      <!-- ─────────────────────────────────────────────────────────────
           OPTIONAL: Checkbox MC — "select all that apply" (AB I–II)
  ```
  Through to (but NOT including) `</div><!-- /#arbeitsblatt -->` (which stays):
  ```html
      </div><!-- /#arbeitsblatt -->
  ```

  Replace the removed block with:
  ```html

      <!-- ═══════════════════════════════════════════════════════════════
           EXERCISE TYPES: see einheiten/_exercises.html for all patterns.
           Copy the HTML snippet from the matching _ex/<type>.html file.
           ═══════════════════════════════════════════════════════════════ -->

    </div><!-- /#arbeitsblatt -->
  ```

- [ ] **Step 4.2: Add optional quiz-lib.js script reference**

  Find the existing script block near the end of the file:
  ```html
  <script src="../js/quiz-base.js"></script>
  <script src="../js/quiz-ext.js"></script>
  <script src="../js/uk-quiz.js"></script>
  ```

  Replace with:
  ```html
  <script src="../js/quiz-base.js"></script>
  <script src="../js/quiz-ext.js"></script>
  <!-- OPTIONAL: add quiz-lib.js when using Timeline/Flashcard/Slider/DefMatch/SortBuckets/BuildConcept -->
  <!-- <script src="../js/quiz-lib.js"></script> -->
  <script src="../js/uk-quiz.js"></script>
  ```

- [ ] **Step 4.3: Verify template still renders**

  Open `einheiten/_template.html` in browser (or any existing unit). No JS errors in console. Page structure intact.

- [ ] **Step 4.4: Commit**
  ```
  git add einheiten/_template.html
  git commit -m "refactor: remove exercise snippets from _template.html, add _exercises.html pointer"
  ```

---

## Task 5: `einheiten/_ex/` — Detail files for existing exercise types

**Files:**
- Create: `einheiten/_ex/` directory (13 files)

Each file is a **plain HTML fragment** (no `<html>/<head>/<body>` wrapper). Structure for every file:

```html
<!-- _ex/TYPE.html — Politik-LK Exercise Library -->
<h2>TYPE NAME</h2>

<h3>Wann verwenden?</h3>
<p>PEDAGOGICAL GUIDANCE 2-3 sentences. Learning objective fit. Example: "Geeignet für…"</p>

<h3>Interaktion</h3>
<p>CORE MECHANIC in one sentence.</p>

<h3>JS-Modul</h3>
<p><code>FILENAME.js</code> — Functions: <code>PLK.fnA()</code>, <code>PLK.fnB()</code></p>

<h3>HTML-Pattern</h3>
<pre><code>FULL COPY-PASTE HTML WITH FILL: COMMENTS</code></pre>

<h3>CSS-Klassen</h3>
<ul>
  <li><code>.classname</code> — role</li>
</ul>

<h3>State-Schlüssel</h3>
<p><code>state.ab.KEY</code> — description of what is stored</p>

<h3>Vollständiges Beispiel (Politik-LK)</h3>
<pre><code>WORKED EXAMPLE WITH REAL GERMAN POLITICAL CONTENT</code></pre>
```

To write accurate content, read the existing units for real examples:
- `einheiten/3-2_lissabon.html` — has: Zuordnung, Lückentext chips, Kategorisierung, Markieren
- `einheiten/3-3_gesetzgebung.html` — has: Radio MC, Ordered list, Freitext
- `einheiten/3-4_mehrebenensystem.html` — has: UK Prüfen
- `einheiten/3-5_binnenmarkt.html` — has: Dropdown Lückentext, Selbsteinschätzung, Zuordnung-Tabelle
- `einheiten/_template.html` — has: Checkbox MC pattern

The JS function signatures come from the source files:
- `js/quiz-base.js` — mc-radio, mc-checkbox, gap-chips, order-list, zuordnung, kategorisierung, freitext
- `js/quiz-ext.js` — gap-dropdown, selbsteinschaetzung, zuordnung-table, markieren
- `js/uk-quiz.js` — uk-pruefen

- [ ] **Step 5.1: Create `einheiten/_ex/mc-radio.html`**

  Radio MC: `PLK.mcS(el)`, `PLK.chkQ(n)`, `PLK.rstQ(n)`, `PLK.retryQg(n)`. State key: `state.gates[n]`. Example from 3-3_gesetzgebung.html.

- [ ] **Step 5.2: Create `einheiten/_ex/mc-checkbox.html`**

  Checkbox MC: `PLK.mcsCbx(el)`, `PLK.chkQ(n)`, `PLK.rstQ(n)`. `data-correct="1"` on each correct `<li class="mco">`. State key: `state.gates[n]`. Example from _template.html.

- [ ] **Step 5.3: Create `einheiten/_ex/gap-chips.html`**

  Chip-slot Lückentext: `PLK.selC(el, bankId)`, `PLK.slCl(el)`, `PLK.chkSl(wrapId, bankId, n, fbId, retryId)`, `PLK.retSl(wrapId, bankId)`, `PLK.rsSl(wrapId, bankId)`. State key: `state.ab.slots[wrapId][slotIndex]`. Example from 3-2_lissabon.html.

- [ ] **Step 5.4: Create `einheiten/_ex/gap-dropdown.html`**

  Dropdown Lückentext: `PLK.chkDrop(wrapId, n, fbId, retryId)`, `PLK.rstDrop(wrapId)`. `data-a` on each `.drop-slot`. State key: `state.ab.drop[wrapId][slotIndex]`. Example from 3-5_binnenmarkt.html.

- [ ] **Step 5.5: Create `einheiten/_ex/order-list.html`**

  Sequence ordering: `PLK.oMv(el, dir)`, `PLK.chkQ(n)`, `PLK.rstQ(n)`. List items have `data-correct` order. Example from 3-3_gesetzgebung.html.

- [ ] **Step 5.6: Create `einheiten/_ex/zuordnung.html`**

  Click-pairs Zuordnung: `PLK.zCl(el, n)`, `PLK.chkZ(n, id)`, `PLK.retZ(n, id)`, `PLK.rsZ(n, id)`. State key: `state.ab.texts` (indirect via AB). Example from 3-2_lissabon.html.

- [ ] **Step 5.7: Create `einheiten/_ex/zuordnung-table.html`**

  Radio matrix: `PLK.selZT(el)`, `PLK.chkZT(tableId, fbId)`, `PLK.rstZT(tableId)`. `data-correct` on each `<tr>`. State key: `state.ab.zt[tableId][rowIndex]`. Example from 3-5_binnenmarkt.html.

- [ ] **Step 5.8: Create `einheiten/_ex/kategorisierung.html`**

  Category assignment: `PLK.kS(el, cat)`, `PLK.chkK(listId)`, `PLK.retK(listId)`, `PLK.rsK(listId)`. State key: `state.ab.texts` (indirect). Example from 3-2_lissabon.html.

- [ ] **Step 5.9: Create `einheiten/_ex/markieren.html`**

  Click-to-tag words: `PLK.mkCl(el)`, `PLK.chkMark(wrapId, n, fbId)`, `PLK.rstMark(wrapId)`. `data-correct="1"` + `data-n` on wrap. State key: `state.ab.mk[wrapId][spanIndex]`. Example from 3-2_lissabon.html.

- [ ] **Step 5.10: Create `einheiten/_ex/spot-error.html`**

  Spot the Error — SAME JS as Markieren (no new functions). Only difference: add `spot-error` CSS class to `.mark-text` div. Document this explicitly: "Kein neues JS — benutzt `PLK.mkCl()`, `PLK.chkMark()`, `PLK.rstMark()` aus quiz-ext.js". Include CSS modifier note.

- [ ] **Step 5.11: Create `einheiten/_ex/selbsteinschaetzung.html`**

  Confidence scale: `PLK.chkSelf(btn)`. `data-v="1–4"` on buttons. Not graded. State key: `state.ab.self[wrapperId]`. Example from 3-5_binnenmarkt.html.

- [ ] **Step 5.12: Create `einheiten/_ex/freitext.html`**

  Free text input: `PLK.chkFT(textareaId, fbId)`, `PLK.saveAB(hintId)`. State key: `state.ab.texts[textareaId]`. Example from 3-3_gesetzgebung.html.

- [ ] **Step 5.13: Create `einheiten/_ex/uk-pruefen.html`**

  UK Prüfen multi-stage: `PLK.selKrit(el)`, `PLK.submitStage(el, stageN)`. `onclick="PLK.selKrit(this)"` and `onclick="PLK.submitStage(this, 1)"`. Block root must have class `.uk`. Example from 3-4_mehrebenensystem.html.

- [ ] **Step 5.14: Commit**
  ```
  git add einheiten/_ex/
  git commit -m "docs: add _ex/ detail files for all 13 existing exercise types"
  ```

---

## Task 6: `einheiten/_ex/` — Detail files for 6 new exercise types

**Files:**
- Create: 6 files in `einheiten/_ex/`

The HTML patterns, function signatures, CSS classes, and state keys all come directly from the spec at `docs/superpowers/specs/2026-03-22-exercise-library-phase1-design.md` sections 4.1–4.7.

For the worked examples, invent real Politik-LK content (EU Gesetzgebung, Binnenmarkt, Lissabon-Vertrag domain) — don't use placeholder text.

- [ ] **Step 6.1: Create `einheiten/_ex/timeline.html`**

  Functions: `PLK.tlSel(el)`, `PLK.tlDrop(el)`, `PLK.chkTL(wrapId, fbId)`, `PLK.rstTL(wrapId)`. State: `state.ab.tl[wrapId][slotIndex]`. JS module: `quiz-lib.js`.

  Worked example: EU-Vertragsgeschichte — Vertrag von Rom (1957), Maastricht (1992), Amsterdam (1997), Lissabon (2007).

- [ ] **Step 6.2: Create `einheiten/_ex/flashcard.html`**

  Functions: `PLK.fcFlip(el)`, `PLK.rstFC(setId)`. No AB points — completion tracking only. State: `state.ab.fc[cardId]`. JS module: `quiz-lib.js`.

  Note on scoring: "Kein AB-Punkt — Flashcards sind ein Übungsformat, keine benotete Aktivität."

  Worked example: EU-Fachbegriffe — Subsidiaritätsprinzip, Verhältnismäßigkeit, Supranationalität.

- [ ] **Step 6.3: Create `einheiten/_ex/slider.html`**

  Functions: `PLK.sldrLive(el)`, `PLK.chkSlider(wrapId, fbId)`, `PLK.rstSlider(wrapId)`. `data-correct`, `data-tol` (default 5). Reset uses `data-default` set at init. State: `state.ab.sldr[wrapId][sliderIndex]`. JS module: `quiz-lib.js`.

  Worked example: QMV-Schwelle im Rat der EU (55% der Mitglieder, 65% Bevölkerung).

- [ ] **Step 6.4: Create `einheiten/_ex/def-match.html`**

  Functions: `PLK.dmSel(el, side)`, `PLK.chkDM(wrapId, fbId)`, `PLK.rstDM(wrapId)`. `data-id` on each `.dm-def` and `.dm-term`. `data-correct-def` on each `.dm-term`. State: `state.ab.dm[wrapId]`. JS module: `quiz-lib.js`.

  Worked example: EU-Organe und ihre Kernfunktion (Kommission/Initiativrecht, Rat/Regierungsvertretung, EP/Demokratische Kontrolle).

- [ ] **Step 6.5: Create `einheiten/_ex/sort-buckets.html`**

  Functions: `PLK.sbSel(el)`, `PLK.sbDrop(bucketEl)`, `PLK.chkSB(wrapId, fbId)`, `PLK.rstSB(wrapId)`. `data-correct` = bucket-id on each `.sb-chip`. `data-order` assigned automatically at init. State: `state.ab.sb[wrapId][order]`. JS module: `quiz-lib.js`.

  Worked example: Binnenmarkt — Vor- und Nachteile für Deutschland sortieren (Freizügigkeit, Exportmarkt, Regulierungsdichte, Wettbewerbsdruck).

- [ ] **Step 6.6: Create `einheiten/_ex/build-concept.html`**

  Functions: `PLK.bcTog(el)`, `PLK.chkBC(wrapId, fbId)`, `PLK.rstBC(wrapId)`. `data-correct="1"` on correct chips, nothing on distractors. State: `state.ab.bc[wrapId][chipIndex]`. JS module: `quiz-lib.js`.

  Worked example: Ordentliches Gesetzgebungsverfahren — welche Organe sind beteiligt? (EP ✓, Rat ✓, Kommission ✓ / EuGH ✗, EZB ✗, Europäischer Rat ✗).

- [ ] **Step 6.7: Commit**
  ```
  git add einheiten/_ex/
  git commit -m "docs: add _ex/ detail files for 6 new quiz-lib exercise types"
  ```

---

## Task 7: `einheiten/_exercises.html` — Exercise index

**Files:**
- Create: `einheiten/_exercises.html`

This is the index file that Claude reads to choose exercise types. It must be self-contained, fast to scan, and unambiguous about when to use each type.

- [ ] **Step 7.1: Create `einheiten/_exercises.html`**

  The file is a styled HTML document (with `<html>/<head>/<body>`) that can be opened in a browser as a reference. Use the same CSS variables and visual style as the units (link to `../css/style.css`).

  Structure:
  ```
  <title>Politik-LK — Exercise Library</title>
  <link rel="stylesheet" href="../css/style.css">
  + unit accent override style block

  <h1>Exercise Library</h1>
  <p>Übersicht aller Aufgabentypen…</p>

  <!-- Section A: Auswahl & Zuordnung (12 types) -->
  <h2>A — Auswahl & Zuordnung</h2>
  [card grid]

  <!-- Section B: Eingabe & Schätzen (4 types) -->
  <h2>B — Eingabe & Schätzen</h2>
  [card grid]

  <!-- Section C: Selbstreflexion & Bewertung (3 types) -->
  <h2>C — Selbstreflexion & Bewertung</h2>
  [card grid]
  ```

  Each exercise card must contain:
  - **Name** (bold)
  - **File** link: `_ex/TYPE.html`
  - **Wann verwenden** — 1 sentence
  - **Interaktion** — 2–3 word label (e.g. "Chip → Slot")
  - **JS-Modul** — `quiz-base.js` / `quiz-ext.js` / `quiz-lib.js` / `uk-quiz.js`

  Section A types (in order):
  1. Radio MC — `_ex/mc-radio.html` — quiz-base.js
  2. Checkbox MC — `_ex/mc-checkbox.html` — quiz-ext.js
  3. Zuordnung — `_ex/zuordnung.html` — quiz-base.js
  4. Zuordnung-Tabelle — `_ex/zuordnung-table.html` — quiz-ext.js
  5. Kategorisierung — `_ex/kategorisierung.html` — quiz-base.js
  6. Markieren — `_ex/markieren.html` — quiz-ext.js
  7. Spot the Error — `_ex/spot-error.html` — quiz-ext.js (reuses Markieren)
  8. Sort into Buckets — `_ex/sort-buckets.html` — quiz-lib.js
  9. Build-a-Concept — `_ex/build-concept.html` — quiz-lib.js
  10. Timeline — `_ex/timeline.html` — quiz-lib.js
  11. Definition → Term Match — `_ex/def-match.html` — quiz-lib.js
  12. Sequence Ordering — `_ex/order-list.html` — quiz-base.js

  Section B types:
  1. Freitext — `_ex/freitext.html` — quiz-base.js
  2. Lückentext (Chips) — `_ex/gap-chips.html` — quiz-base.js
  3. Lückentext (Dropdown) — `_ex/gap-dropdown.html` — quiz-ext.js
  4. Slider Estimation — `_ex/slider.html` — quiz-lib.js

  Section C types:
  1. Selbsteinschätzung — `_ex/selbsteinschaetzung.html` — quiz-ext.js
  2. UK Prüfen — `_ex/uk-pruefen.html` — uk-quiz.js
  3. Flashcard — `_ex/flashcard.html` — quiz-lib.js

- [ ] **Step 7.2: Verify the index renders correctly**

  Open `einheiten/_exercises.html` in browser. All 19 cards visible. Links to `_ex/*.html` files work (file exists check). No broken styles.

- [ ] **Step 7.3: Commit**
  ```
  git add einheiten/_exercises.html
  git commit -m "docs: add _exercises.html exercise library index"
  ```

---

## Task 8: End-to-end verification

No code changes in this task — browser-only verification of the full system.

- [ ] **Step 8.1: Build a minimal test page**

  Create `einheiten/_ex-test.html` (temporary, deleted at end of task):
  ```html
  <!DOCTYPE html>
  <html lang="de">
  <head><meta charset="UTF-8"><title>quiz-lib test</title>
  <link rel="stylesheet" href="../css/style.css">
  <style>:root{--acc:#0891b2;--accL:#e0f2fe;--accG:rgba(8,145,178,.08)}</style>
  </head>
  <body style="max-width:900px;margin:2rem auto;padding:1rem">

  <!-- Timeline test -->
  <h2>Timeline</h2>
  <div class="tl-wrap" id="tl1">
    <div class="tl-bank" id="tl1-bank">
      <span class="tl-chip" data-id="a" onclick="PLK.tlSel(this)">Vertrag von Maastricht</span>
      <span class="tl-chip" data-id="b" onclick="PLK.tlSel(this)">Brexit-Referendum</span>
    </div>
    <div class="tl-slots">
      <div class="tl-slot" data-correct="a" data-label="1992" onclick="PLK.tlDrop(this)">1992</div>
      <div class="tl-slot" data-correct="b" data-label="2016" onclick="PLK.tlDrop(this)">2016</div>
    </div>
  </div>
  <button onclick="PLK.chkTL('tl1','tl1-r')">Prüfen</button>
  <button onclick="PLK.rstTL('tl1')">Reset</button>
  <div id="tl1-r"></div>

  <!-- Slider test -->
  <h2>Slider</h2>
  <div class="sldr-wrap" id="sldr1">
    <div class="sldr-q">EU-Mitgliedstaaten (Anzahl)?</div>
    <div class="sldr-row">
      <span class="sldr-lo">1</span>
      <input type="range" class="sldr-input" min="1" max="50" value="25"
             data-correct="27" data-tol="2" oninput="PLK.sldrLive(this)">
      <span class="sldr-hi">50</span>
    </div>
    <div class="sldr-val">25</div>
  </div>
  <button onclick="PLK.chkSlider('sldr1','sldr1-r')">Prüfen</button>
  <button onclick="PLK.rstSlider('sldr1')">Reset</button>
  <div id="sldr1-r"></div>

  <!-- Sort Buckets test -->
  <h2>Sort Buckets</h2>
  <div class="sb-wrap" id="sb1">
    <div class="sb-bank" id="sb1-bank">
      <span class="sb-chip" data-correct="pro" onclick="PLK.sbSel(this)">Freizügigkeit</span>
      <span class="sb-chip" data-correct="con" onclick="PLK.sbSel(this)">Bürokratie</span>
    </div>
    <div class="sb-buckets">
      <div class="sb-bucket" data-bucket-id="pro" onclick="PLK.sbDrop(this)">
        <div class="sb-bucket-label">Vorteile</div>
        <div class="sb-bucket-items"></div>
      </div>
      <div class="sb-bucket" data-bucket-id="con" onclick="PLK.sbDrop(this)">
        <div class="sb-bucket-label">Nachteile</div>
        <div class="sb-bucket-items"></div>
      </div>
    </div>
  </div>
  <button onclick="PLK.chkSB('sb1','sb1-r')">Prüfen</button>
  <button onclick="PLK.rstSB('sb1')">Reset</button>
  <div id="sb1-r"></div>

  <script>
  var CONF = { id: 'test', blocks: 0, gates: 0, abPts: 10, masterPw: 'PO-LK' };
  </script>
  <script src="../js/engine.js"></script>
  <script src="../js/quiz-base.js"></script>
  <script src="../js/quiz-ext.js"></script>
  <script src="../js/quiz-lib.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 8.2: Test each new exercise type manually**

  Open `_ex-test.html` in browser. For each type:

  **Timeline:** Click "Vertrag von Maastricht" (chips up). Click "1992" slot — chip moves in. Click "Brexit-Referendum", then "2016" slot. Click Prüfen — both slots green. Click Reset — chips return to bank.

  **Slider:** Move slider to ~27. Prüfen → correct (green). Move to 1. Prüfen → wrong (red). Reset → back to 25.

  **Sort Buckets:** Click "Freizügigkeit" (activates). Click "Vorteile" bucket → chip moves. Click "Bürokratie", click "Nachteile" → chip moves. Prüfen → both green. Reset → chips return to bank.

- [ ] **Step 8.3: Test state persistence (reload)**

  On `_ex-test.html`, place a chip in the Timeline slot. Reload the page. The chip should still be in the slot (state restored from localStorage).

  Note: since CONF.id is 'test', state is stored under 'test' key in localStorage. Check in DevTools → Application → LocalStorage.

- [ ] **Step 8.4: Delete test file and commit**
  ```
  git rm einheiten/_ex-test.html
  git commit -m "chore: remove quiz-lib test page"
  ```

  If `_ex-test.html` was never committed, just delete it without git rm.

---

## Final commit checklist

After all tasks complete, verify:
- [ ] `js/quiz-lib.js` exists and has 6 new PLK.* exercise types
- [ ] `js/engine.js` has both lib hook calls (lines ~791 and ~872)
- [ ] `css/style.css` ends with sections 51–57
- [ ] `einheiten/_template.html` has no exercise HTML blocks, has `_exercises.html` pointer comment
- [ ] `einheiten/_exercises.html` exists with all 19 exercise cards
- [ ] `einheiten/_ex/` directory has 19 detail files (13 existing + 6 new)
- [ ] No regressions: open `3-2_lissabon.html`, `3-3_gesetzgebung.html`, `3-5_binnenmarkt.html` — all existing exercises still work
