# UI Structural Refinements — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply four cross-unit UI improvements to unit 3.5: two-zone LZ pills and chips, ghost tool row for password/reset, single-row centered Aufgabe card header, and 3-stage sequential UK block.

**Architecture:** All changes are in three shared files (`css/style.css`, `js/uk-quiz.js`) plus one HTML unit (`einheiten/3-5_binnenmarkt.html`). CSS is written first (new classes), then HTML updated (new structure), then JS rewritten (stage logic). No build steps, no dependencies. Vanilla HTML/CSS/ES5 only.

**Tech Stack:** HTML5, CSS3 (custom properties), ES5 JavaScript (no arrow functions, no const/let, no modules), localStorage via existing Progress API.

**ES5 constraint — critical:** All JS must use `var`, `function`, and `forEach`. No arrow functions `() =>`, no `const`/`let`, no template literals, no spread, no optional chaining.

**No Gedankenstriche rule:** All student-facing text (LZ texts, answer options, error messages, labels) must avoid em dashes (—) and en dashes (–). Use commas, colons, or restructured sentences instead.

---

## File Structure

| File | What changes |
|------|-------------|
| `css/style.css` | Add new CSS sections: LZ pill/chip (Section 46), tool row (Section 47), Aufgabe header update (patch Section 27), UK stage (Section 48). Patch existing `.auf-h`, `.auf-n`, `.auf-tags` rules. |
| `js/uk-quiz.js` | Full rewrite: replace `_checkAllSelected` + global `chkUK` with `_checkStageReady` + `_submitStage` + `_getActiveStage`. Update `ERROR_LABELS`. |
| `einheiten/3-5_binnenmarkt.html` | (a) LZ list in unit header — two-zone pills. (b) Password area — new tool row. (c) Aufgabe card headers — single-row layout. (d) UK block — 3-stage sequential structure. |

---

## Chunk 1: CSS additions and Aufgabe header patch

### Task 1: CSS — LZ pill (unit top) and LZ chip (card headers)

The existing `.lz-pill` is a plain monospace pill. Replace it with a two-zone container. Add new `.lz-chip` pattern for card headers.

**Files:**
- Modify: `css/style.css` — patch `.lz-pill`, add `.lz-pill-id`, `.lz-pill-text`, `.lz-chip`, `.lz-chip-id`, `.lz-chip-text`

- [ ] **Step 1: Confirm `--accB` token exists**

  Search `:root` in `css/style.css` for `--accB`. If it is absent (it is not defined by default — only `--acc`, `--accL`, `--accG` are set per unit), add it to the global `:root` block in `style.css`:
  ```css
  --accB: rgba(0,0,0,.12);
  ```
  This provides a neutral fallback. Per-unit inline styles may override with a tinted value (e.g. `--accB: rgba(180,83,9,.18)` for unit 3.5) but the fallback is sufficient for the initial pass.

- [ ] **Step 2: Read current `.lz-pill` CSS**

  Open `css/style.css` and find lines ~1898-1905 (Section "Lernziel-Pills"). Note current `.lz-pill` and `.lz-tag` rules.

- [ ] **Step 3: Replace `.lz-pill` and add new LZ classes**

  Replace the existing `.lz-list` / `.lz-pill` / `.lz-tag` block with:

  ```css
  /* Lernziel-Pills (unit header — full text, two-zone) */
  .lz-list { display: flex; flex-direction: column; gap: .55rem; margin-top: .9rem; }
  .lz-pill {
    display: inline-flex; align-items: stretch; border-radius: 6px;
    overflow: hidden; align-self: flex-start;
    border: 1px solid rgba(0,0,0,.08);
  }
  .lz-pill-id {
    font-family: var(--ff-mono); font-size: .72rem; font-weight: 700;
    background: var(--acc); color: #fff;
    padding: .3em .7em; letter-spacing: .04em; white-space: nowrap;
    display: flex; align-items: center;
  }
  .lz-pill-text {
    font-family: var(--ff-body); font-size: .8rem;
    background: var(--accL); color: var(--ink2);
    padding: .3em .75em; line-height: 1.4;
  }

  /* Lernziel-Chip (card headers — abbreviated, two-zone) */
  .lz-chip {
    display: inline-flex; align-items: stretch; border-radius: 4px;
    overflow: hidden; border: 1px solid var(--accB);
  }
  .lz-chip-id {
    font-family: var(--ff-mono); font-size: .6rem; font-weight: 700;
    background: var(--acc); color: #fff;
    padding: .2em .45em; letter-spacing: .04em;
    display: flex; align-items: center;
  }
  .lz-chip-text {
    font-family: var(--ff-mono); font-size: .6rem; font-weight: 500;
    background: var(--accL); color: var(--acc);
    padding: .2em .5em;
    display: flex; align-items: center;
  }

  /* Klausur badge (replaces .lz-tag) */
  .klausur-tag {
    font-family: var(--ff-mono); font-size: .6rem; font-weight: 600;
    padding: .18em .55em; border-radius: 4px; letter-spacing: .04em;
    background: var(--gold-l); color: var(--gold);
    border: 1px solid rgba(146,64,14,.15); white-space: nowrap;
  }
  ```

  Note: keep `.lz-tag` and `.lz-tag.ex` rules unchanged below this block — they may be used elsewhere. Add the new block immediately after the old `.lz-pill` block.

- [ ] **Step 4: Verify no syntax errors**

  Open `einheiten/3-5_binnenmarkt.html` in a browser. Page should load without layout breakage (LZ pills will still look old until HTML is updated in Task 5, but no errors).

  **Important:** Since `.lz-list` switches from horizontal `flex-wrap` to vertical `flex-direction: column`, all other unit HTML files will temporarily show stacked pills in the old single-zone markup. This is expected — they will be corrected in the follow-on HTML pass for each unit. Do not treat this as a bug.

- [ ] **Step 5: Commit**

  ```bash
  git add css/style.css
  git commit -m "style: add two-zone LZ pill and chip CSS classes"
  ```

---

### Task 2: CSS — Tool row (password + reset)

New ghost row style that fades to 70% opacity and brightens on hover. Replaces the current `.pw-input` card style for the tool area.

**Files:**
- Modify: `css/style.css` — add new tool row section after existing `.pw-input` block (~line 1295)

- [ ] **Step 1: Locate the end of the `.pw-input` CSS block**

  Find the `.pw-input.master` rules (~line 1289-1294). Add the new block immediately after.

- [ ] **Step 2: Add tool row CSS**

  ```css
  /* Tool row (password + reset — ghost inline style) */
  .tool-row {
    display: flex; align-items: center; gap: .45rem;
    padding: .5rem 0; margin-top: .6rem;
    opacity: .7; transition: opacity .2s;
  }
  .tool-row:hover { opacity: 1; }
  .tool-label {
    font-family: var(--ff-mono); font-size: .6rem; font-weight: 600;
    color: var(--ink3); letter-spacing: .07em; text-transform: uppercase;
    white-space: nowrap; flex-shrink: 0;
  }
  .tool-input {
    font-family: var(--ff-mono); font-size: .78rem;
    background: transparent; border: none;
    border-bottom: 1.5px solid var(--border);
    padding: .2em .35em; flex: 1; min-width: 100px;
    color: var(--ink); outline: none;
  }
  .tool-input:focus { border-bottom-color: var(--acc); }
  .tool-btn-unlock {
    font-family: var(--ff-mono); font-size: .65rem; font-weight: 600;
    background: transparent; border: 1px solid var(--border); color: var(--ink2);
    padding: .25em .65em; border-radius: 4px; cursor: pointer; white-space: nowrap;
  }
  .tool-btn-unlock:hover { border-color: var(--acc); color: var(--acc); }
  .tool-btn-reset {
    font-family: var(--ff-mono); font-size: .65rem;
    background: transparent; border: none; color: var(--ink3);
    cursor: pointer; padding: .25em .3em; white-space: nowrap;
  }
  .tool-btn-reset:hover { color: var(--ink2); }
  ```

- [ ] **Step 3: Verify**

  Browser reload — no layout change expected yet (HTML unchanged). No console errors.

- [ ] **Step 4: Commit**

  ```bash
  git add css/style.css
  git commit -m "style: add ghost tool row CSS for password and reset"
  ```

---

### Task 3: CSS — Aufgabe card header patch

The current `.auf-h` uses `align-items: flex-start` with tags nested inside `.auf-m` below the title. New design: single row, `align-items: center`, tags on the right, `.auf-m` wrapper removed.

**Files:**
- Modify: `css/style.css` — patch `.auf-h`, `.auf-n`, `.auf-tags`, `.auf-i`; add `.auf-title`

- [ ] **Step 1: Find the current Aufgabe card CSS**

  Locate `.auf-n` (~line 1891), `.auf-h` (~line 1892), `.auf-m h2` (~line 1893), `.auf-tags` (~line 1894), `.auf-i` (~line 1895). These are the rules to patch.

  **Note on naming:** `css/style.css` also contains `.auf-head`, `.auf-num`, `.auf-pts`, `.auf-body`, `.auf-task` at lines ~1083-1116. These are **different class names** used by a different card type (exam/test cards). They do not appear in any HTML file and do not conflict with `.auf-h`, `.auf-n`, `.auf-m`. Do not touch those rules — only patch `.auf-n`, `.auf-h`, `.auf-m h2`, `.auf-tags`, `.auf-i`.

- [ ] **Step 2: Replace those rules**

  Replace the block from `.auf-n` through `.auf-i` (lines ~1891-1895) with:

  ```css
  .auf-h {
    display: flex; align-items: center; gap: .75rem;
    padding: .65rem 1.1rem;
    background: var(--accG); border-bottom: 1px solid var(--accB);
    margin-bottom: 0;
  }
  .auf-n {
    font-family: var(--ff-mono); font-size: 1.25rem; font-weight: 800;
    color: var(--acc); flex-shrink: 0; line-height: 1;
  }
  .auf-title {
    font-family: var(--ff-head); font-size: 1.05rem; font-weight: 700;
    color: var(--ink); flex: 1; margin: 0; line-height: 1;
  }
  .auf-tags { display: flex; align-items: center; gap: .35rem; flex-shrink: 0; }
  .auf-i { font-size: .85rem; color: var(--ink2); margin-bottom: .75rem; line-height: 1.6; }
  ```

  Remove `.auf-m h2` — it will no longer exist in the HTML.

- [ ] **Step 3: Verify**

  Open unit in browser. Existing Aufgabe cards should still render (slightly differently — tags will shift once HTML is updated). No layout crash.

- [ ] **Step 4: Commit**

  ```bash
  git add css/style.css
  git commit -m "style: update Aufgabe card header to single-row centered layout"
  ```

---

### Task 4: CSS — UK stage sequential

New CSS classes for the 3-stage reveal: stage wrapper, locked state, done state, header, footer, submit button, and summary row.

**Files:**
- Modify: `css/style.css` — add UK stage section at end of UK block CSS (~after line 2700)

- [ ] **Step 1: Find the end of the existing UK CSS**

  Search for `.uk-complete` or `.uk-validate-row` in `css/style.css` to find where existing UK CSS ends. Note the line number.

- [ ] **Step 2: Add UK stage CSS after existing UK rules**

  ```css
  /* UK — Sequential stage reveal */
  .uk-stage { border-top: 1px solid var(--border); }
  .uk-stage.uk-stage-locked {
    opacity: .15; pointer-events: none;
    filter: blur(2px); transform: scale(.99);
    transition: opacity .3s, filter .3s, transform .3s;
  }
  .uk-stage.uk-stage-done { display: none; }

  .uk-stage-header {
    display: flex; align-items: center; gap: .6rem;
    padding: .55rem 1.1rem; border-bottom: 1px solid var(--border);
    background: #f8fafc;
  }
  .uk-stage-tag {
    font-family: var(--ff-mono); font-size: .6rem; font-weight: 700;
    color: #fff; padding: .18em .55em; border-radius: 4px;
    letter-spacing: .05em; text-transform: uppercase; white-space: nowrap;
  }
  .uk-stage-tag[data-ab="1"] { background: var(--ab1-acc); }
  .uk-stage-tag[data-ab="2"] { background: var(--ab2-acc); }
  .uk-stage-tag[data-ab="3"] { background: var(--ab3-acc); }
  .uk-stage-title {
    font-family: var(--ff-head); font-size: .82rem; font-weight: 600;
    color: var(--ink2);
  }

  .uk-stage-footer {
    padding: .65rem 1.1rem; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end;
  }
  .uk-stage-submit {
    font-family: var(--ff-mono); font-size: .72rem; font-weight: 600;
    background: var(--acc); color: #fff;
    border: none; border-radius: 6px;
    padding: .4em 1.1em; cursor: pointer; letter-spacing: .03em;
    transition: opacity .15s;
  }
  .uk-stage-submit:disabled { opacity: .35; cursor: default; }
  .uk-stage-submit:not(:disabled):hover { opacity: .88; }

  /* Summary row shown when stage is done */
  .uk-stage-summary {
    display: none; align-items: center; gap: .6rem;
    padding: .5rem 1.1rem; background: #f8fafc;
    border-top: 1px solid var(--border);
  }
  .uk-stage-summary-check {
    font-size: .85rem; color: var(--ab3-acc); flex-shrink: 0;
  }
  .uk-stage-summary-label {
    font-family: var(--ff-mono); font-size: .65rem; font-weight: 600;
    color: var(--ink3); letter-spacing: .05em; text-transform: uppercase;
  }
  .uk-stage-summary-krit {
    font-family: var(--ff-mono); font-size: .65rem;
    color: var(--ink3); margin-left: auto;
  }
  ```

- [ ] **Step 3: Verify CSS tokens exist**

  Search `css/style.css` for `--ab1-acc`, `--ab2-acc`, `--ab3-acc` in the `:root` block. These should exist from the previous implementation plan. If missing, add to `:root`:

  ```css
  --ab1-acc: #1d4ed8; --ab1-accL: rgba(29,78,216,.08); --ab1-accB: rgba(29,78,216,.2);
  --ab2-acc: #7c3aed; --ab2-accL: rgba(124,58,237,.08); --ab2-accB: rgba(124,58,237,.2);
  --ab3-acc: #16a34a; --ab3-accL: rgba(22,163,74,.08);  --ab3-accB: rgba(22,163,74,.2);
  --rf-acc: #dc2626;
  ```

- [ ] **Step 4: Browser check**

  Reload unit — no visual change expected yet. No errors.

- [ ] **Step 5: Commit**

  ```css
  git add css/style.css
  git commit -m "style: add UK sequential stage CSS"
  ```

---

### Task 5: HTML — Unit header (LZ pills + tool row)

Replace the simple `.lz-pill` spans with two-zone divs and merge password + reset into a single `.tool-row`.

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html` — lines 64-84 (unit header area)

- [ ] **Step 1: Replace the LZ list HTML**

  Current (lines 64-68):
  ```html
  <div class="lz-list">
    <span class="lz-pill">LZ1: Vier Freiheiten im Binnenmarkt erläutern</span>
    <span class="lz-pill">LZ2: Vorteile des Binnenmarktes darlegen</span>
    <span class="lz-pill">LZ3: Herausforderungen diskutieren</span>
  </div>
  ```

  Replace with:
  ```html
  <div class="lz-list">
    <div class="lz-pill">
      <span class="lz-pill-id">LZ 1</span>
      <span class="lz-pill-text">Die vier Grundfreiheiten des EU-Binnenmarkts erläutern und an Beispielen aus der Grenzregion Perl veranschaulichen</span>
    </div>
    <div class="lz-pill">
      <span class="lz-pill-id">LZ 2</span>
      <span class="lz-pill-text">Wirtschaftliche Vorteile des Binnenmarkts darlegen und mit Daten aus dem Fallmaterial belegen</span>
    </div>
    <div class="lz-pill">
      <span class="lz-pill-id">LZ 3</span>
      <span class="lz-pill-text">Herausforderungen des Binnenmarkts (Sozialdumping, Brain Drain, Steuerwettbewerb) diskutieren und bewerten</span>
    </div>
  </div>
  ```

- [ ] **Step 2: Remove the reset button from inside `<header>`**

  The existing HTML has two separate password-related areas:
  - Lines 69-74 (inside `<header class="unit-header">`): an inline-styled `<div>` containing the reset `<button>`.
  - Lines 77-84 (outside `<header>`, a sibling `<div class="pw-input" id="pw-wrap">`): the password input and Freischalten button.

  **Action A:** Delete lines 69-74 (the inline-styled reset div inside `<header>`). This removes the reset button from inside the header. Do not remove the closing `</header>` tag.

  **Action B:** Replace `<div class="pw-input" id="pw-wrap">` ... `</div>` (lines 77-84) with the new tool row. Keep `pw-wrap` in its current position (after `</header>`, outside it):

  ```html
  <div id="pw-wrap">
    <div class="tool-row">
      <span class="tool-label">Zugang</span>
      <input class="tool-input" type="password" id="pw-field" placeholder="Passwort eingeben">
      <button class="tool-btn-unlock" onclick="chkPw('pw-field','pw-hint')">Freischalten</button>
      <button class="tool-btn-reset"
              onclick="if(confirm('Fortschritt zurücksetzen?')){Progress.clear(CONF.id);location.reload();}">
        ↺ Einheit zurücksetzen
      </button>
    </div>
    <span class="pw-hint" id="pw-hint"></span>
  </div>
  ```

  The `.pw-input` class is intentionally dropped from the wrapper — the new `.tool-row` provides all necessary styling. The `id="pw-wrap"` is kept in place for any DOM queries that reference it.

- [ ] **Step 3: Visual check**

  Open in browser. LZ section should show two-zone pills (solid accent ID + light background text). The password row should appear as a ghost row with faded labels, inputs, and buttons. Hover should brighten to full opacity.

- [ ] **Step 4: Check password unlock still works**

  Enter an incorrect password — should see the `pw-hint` error in red. The row styling shouldn't interfere with password logic (chkPw uses IDs only).

- [ ] **Step 5: Commit**

  ```bash
  git add einheiten/3-5_binnenmarkt.html
  git commit -m "feat: LZ two-zone pills and ghost tool row in unit header"
  ```

---

### Task 6: HTML — Aufgabe card headers

Replace the stacked layout (number + title+tags column) with a single centered row.

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html` — Aufgabe 1 (~lines 591-601) and Aufgabe 2 (~lines 629-639)

- [ ] **Step 1: Update Aufgabe 1 header**

  Current:
  ```html
  <div class="auf-h">
    <div class="auf-n">01</div>
    <div class="auf-m">
      <h2>Die vier Freiheiten zuordnen</h2>
      <div class="auf-tags">
        <span class="lz-tag ex">LZ1</span>
        <span class="lz-tag">Klausurrelevant</span>
      </div>
    </div>
  </div>
  ```

  Replace with:
  ```html
  <div class="auf-h">
    <div class="auf-n">01</div>
    <h2 class="auf-title">Die vier Freiheiten zuordnen</h2>
    <div class="auf-tags">
      <span class="lz-chip">
        <span class="lz-chip-id">LZ 1</span>
        <span class="lz-chip-text">Grundfreiheiten erläutern</span>
      </span>
      <span class="klausur-tag">Klausur</span>
    </div>
  </div>
  ```

- [ ] **Step 2: Update Aufgabe 2 header**

  Current (Aufgabe 2 tags reference LZ2 and LZ3 only — no Klausur badge in the original, intentionally omitted here too):
  ```html
  <div class="auf-h">
    <div class="auf-n">02</div>
    <div class="auf-m">
      <h2>Vorteil oder Herausforderung?</h2>
      <div class="auf-tags">
        <span class="lz-tag ex">LZ2</span>
        <span class="lz-tag ex">LZ3</span>
      </div>
    </div>
  </div>
  ```

  Replace with (check what LZ2 and LZ3 short forms should be):
  ```html
  <div class="auf-h">
    <div class="auf-n">02</div>
    <h2 class="auf-title">Vorteil oder Herausforderung?</h2>
    <div class="auf-tags">
      <span class="lz-chip">
        <span class="lz-chip-id">LZ 2</span>
        <span class="lz-chip-text">Vorteile darlegen</span>
      </span>
      <span class="lz-chip">
        <span class="lz-chip-id">LZ 3</span>
        <span class="lz-chip-text">Herausforderungen diskutieren</span>
      </span>
    </div>
  </div>
  ```

- [ ] **Step 3: Visual check**

  Reload unit. Both Aufgabe cards should show: number on left (1.25rem mono), title centered and large (1.05rem Fraunces), chips + badge on right — all on the same horizontal baseline. No stacking.

- [ ] **Step 4: Commit**

  ```bash
  git add einheiten/3-5_binnenmarkt.html
  git commit -m "feat: single-row Aufgabe card headers with right-aligned LZ chips"
  ```

---

## Chunk 2: JS rewrite and UK HTML restructure

### Task 7: JS — uk-quiz.js sequential stage logic

Rewrite `uk-quiz.js` to support 3-stage sequential reveal. Replace the all-at-once `chkUK` with per-stage `submitStage`. Keep `selKrit`, chip click handlers, and option click handlers; update their completion checks to be stage-aware.

**Files:**
- Modify: `js/uk-quiz.js` — full rewrite (251 lines → similar size)

- [ ] **Step 1: Read the current uk-quiz.js in full**

  Read `js/uk-quiz.js` to understand all existing functions before rewriting.

- [ ] **Step 2: Write the new uk-quiz.js**

  Replace the entire file with:

  ```javascript
  /* ==========================================================
     Politik-LK — uk-quiz.js
     Sequential Urteilskompetenz block — 3-stage reveal
     Stage 1: Einleitung (Kriterium + AB I)
     Stage 2: Hauptteil (Recheck #1 + AB II)
     Stage 3: Schlussfolgerung (Recheck #2 + AB III)
     Kriterium: must be correct to advance stage 1.
     AB step options: any selection suffices (reflection, not tested).
     Recheck chips: must match _kritIdx to advance stages 2 and 3.
     Load after engine.js in unit HTML files.
     ES5 only — no arrow functions, no const/let.
     ========================================================== */

  ;(function () {
    'use strict';

    /* ── Error label map ────────────────────────────────────── */
    var ERROR_LABELS = {
      'irrelevant':   'RICHTIG ABER IRRELEVANT',
      'unstructured': 'RICHTIG ABER UNSTRUKTURIERT',
      'factual':      'UNSACHLICHKEIT',
      'knowledge':    'SACHWISSEN SCHWACH',
      'chain':        'ZUSAMMENHANG UNKLAR',
      'verdict':      'WERTURTEIL OHNE ANALYSE',
      'sided':        'EINSEITIG',
      'descriptive':  'DESKRIPTIV STATT ANALYTISCH',
      'overreach':    'ÜBERGENERALISIERUNG',
      /* legacy keys kept for backwards compat */
      'level':        'AB-EBENE FALSCH',
      'step':         'FALSCHER SCHRITT',
      'vague':        'MASSSTAB ZU VAGE'
    };

    /* ── Fisher-Yates shuffle (in-place) ────────────────────── */
    function _shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }

    /* ── Init ───────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.uk').forEach(_initBlock);
    });

    function _initBlock(block) {
      /* Shuffle options in each step's .uk-opts list */
      block.querySelectorAll('[data-step] .uk-opts').forEach(function (ul) {
        var items = Array.from(ul.querySelectorAll('.uk-opt'));
        _shuffle(items).forEach(function (li) { ul.appendChild(li); });
      });

      /* _kritIdx: closure variable — tracks selected Kriterium msidx.
         Note: window.selKrit and window.submitStage are assigned here.
         If multiple .uk blocks exist on a page, the last _initBlock wins.
         Unit 3.5 has one .uk block — safe. */
      var _kritIdx = null;

      /* ── Kriterium selection ─────────────────────────────── */
      window.selKrit = function (el) {
        var parent = el.closest('.uk-krit-opts');
        if (!parent) return;
        parent.querySelectorAll('.uk-krit-opt').forEach(function (o) {
          o.classList.remove('selected', 'wrong');
          var errSpan = o.querySelector('.uk-krit-opt-err');
          if (errSpan) errSpan.textContent = '';
        });
        el.classList.add('selected');
        _kritIdx = el.getAttribute('data-msidx');

        /* Pre-select matching chip in all recheck blocks */
        block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
          recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
            chip.classList.toggle('selected', chip.getAttribute('data-msidx') === _kritIdx);
          });
        });

        _checkStageReady(block);
      };

      /* ── Recheck chip click ───────────────────────────────── */
      block.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var recheck = chip.closest('.uk-krit-recheck');
          if (!recheck) return;
          recheck.querySelectorAll('.uk-krit-chip').forEach(function (c) {
            c.classList.remove('selected', 'wrong');
          });
          var rErr = recheck.querySelector('.uk-krit-recheck-err');
          if (rErr) { rErr.textContent = ''; rErr.style.display = 'none'; }
          chip.classList.add('selected');
          _kritIdx = chip.getAttribute('data-msidx');
          _checkStageReady(block);
        });
      });

      /* ── Option click ────────────────────────────────────── */
      block.querySelectorAll('.uk-opt').forEach(function (opt) {
        opt.addEventListener('click', function () { _onOptClick(block, opt); });
      });

      /* ── Per-stage submit ────────────────────────────────── */
      window.submitStage = function (btn, stageNum) {
        _submitStage(block, btn, stageNum, _kritIdx);
      };
    }

    /* ── Get the currently active (not locked, not done) stage ── */
    function _getActiveStage(block) {
      var stages = block.querySelectorAll('.uk-stage');
      for (var i = 0; i < stages.length; i++) {
        var s = stages[i];
        if (!s.classList.contains('uk-stage-locked') &&
            !s.classList.contains('uk-stage-done')) {
          return s;
        }
      }
      return null;
    }

    /* ── Enable/disable the active stage's proceed button ───── */
    function _checkStageReady(block) {
      var stage = _getActiveStage(block);
      if (!stage) return;

      var btn = stage.querySelector('.uk-stage-submit');
      if (!btn) return;

      var allReady = true;

      /* Kriterium must be selected (stage 1) */
      var kritOpts = stage.querySelector('.uk-krit-opts');
      if (kritOpts) {
        if (!kritOpts.querySelector('.uk-krit-opt.selected')) allReady = false;
      }

      /* Recheck chip must be selected (stages 2+) */
      var recheck = stage.querySelector('.uk-krit-recheck');
      if (recheck) {
        if (!recheck.querySelector('.uk-krit-chip.selected')) allReady = false;
      }

      /* Every step in this stage must have a selection */
      stage.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
        if (!pool.querySelector('.uk-opt.selected, .uk-opt.correct')) {
          allReady = false;
        }
      });

      btn.disabled = !allReady;
    }

    /* ── Option click handler ─────────────────────────────── */
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
      _checkStageReady(block);
    }

    function _clearErrorNodes(opt) {
      var chip = opt.querySelector('.uk-error-chip');
      if (chip) chip.remove();
      var errp = opt.querySelector('.uk-error-text');
      if (errp) errp.remove();
    }

    /* ── Per-stage submit and validation ─────────────────── */
    function _submitStage(block, btn, stageNum, _kritIdx) {
      var stage = block.querySelector('.uk-stage[data-stage="' + stageNum + '"]');
      if (!stage) return;

      var allCorrect = true;

      /* Validate Kriterium (stage 1 only) */
      var kritOpts = stage.querySelector('.uk-krit-opts');
      if (kritOpts) {
        var kritOpt = kritOpts.querySelector('.uk-krit-opt.selected');
        if (!kritOpt || kritOpt.getAttribute('data-correct') !== 'true') {
          allCorrect = false;
          if (kritOpt) {
            kritOpt.classList.remove('selected');
            kritOpt.classList.add('wrong');
            var errEl = kritOpt.querySelector('.uk-krit-opt-err');
            if (errEl) {
              var errType  = kritOpt.getAttribute('data-error') || '';
              var errText  = kritOpt.getAttribute('data-errtext') || '';
              errEl.textContent = (ERROR_LABELS[errType] || 'FEHLER') +
                                  (errText ? ': ' + errText : '');
            }
          }
        } else {
          kritOpt.classList.remove('selected');
          kritOpt.classList.add('correct');
        }
      }

      /* Validate recheck chip (stages 2 and 3) */
      var recheck = stage.querySelector('.uk-krit-recheck');
      if (recheck) {
        var selChip = recheck.querySelector('.uk-krit-chip.selected');
        var recheckMsidx = selChip ? selChip.getAttribute('data-msidx') : null;
        var expectedMsidx = (_kritIdx !== null) ? String(_kritIdx) : null;

        if (recheckMsidx !== expectedMsidx) {
          allCorrect = false;
          recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
            if (chip.getAttribute('data-msidx') !== expectedMsidx) {
              chip.classList.add('wrong');
            }
          });
          var rErr = recheck.querySelector('.uk-krit-recheck-err');
          if (rErr) {
            rErr.textContent = 'Dieser Maßstab stimmt nicht mit deiner Wahl überein. Überprüfe dein Kriterium.';
            rErr.style.display = 'block';
          }
        }
      }

      /* AB step options: mark selected as correct (any selection passes) */
      stage.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
        var selected = pool.querySelector('.uk-opt.selected');
        if (selected) {
          selected.classList.remove('selected');
          selected.classList.add('correct');
        }
      });

      if (!allCorrect) {
        /* Re-disable button; _checkStageReady re-enables once errors are fixed */
        btn.disabled = true;
        return;
      }

      /* Stage passed — collapse and unlock next */
      stage.classList.add('uk-stage-done');

      var summaryRow = block.querySelector('.uk-stage-summary[data-stage="' + stageNum + '"]');
      if (summaryRow) summaryRow.style.display = 'flex';

      var nextNum = stageNum + 1;
      var nextStage = block.querySelector('.uk-stage[data-stage="' + nextNum + '"]');
      if (nextStage) {
        nextStage.classList.remove('uk-stage-locked');
        _checkStageReady(block);
      } else {
        /* All stages complete */
        block.classList.add('uk-complete');
      }
    }

    /* ── Error display helpers ───────────────────────────── */
  })();
  ```

- [ ] **Step 3: Verify the file loads without errors**

  Open `einheiten/3-5_binnenmarkt.html` in browser. Open DevTools console. Should see no JS errors on load. The existing UK block HTML still uses the old structure — the new `submitStage` function won't be called yet, and `chkUK` no longer exists. The old submit button will silently fail if clicked (expected — HTML update comes next).

- [ ] **Step 4: Commit**

  ```bash
  git add js/uk-quiz.js
  git commit -m "feat: uk-quiz.js sequential stage logic — replaces all-at-once chkUK"
  ```

---

### Task 8: HTML — UK sequential restructure

Replace the existing UK block HTML with the 3-stage sequential structure. Stage 1 is open; stages 2 and 3 start locked.

**CSS dependency note:** All `.uk-stage*` CSS classes were written in Task 4 of Chunk 1. Specifically: `.uk-stage-summary { display: none; ... }` hides summary rows on load; `.uk-stage.uk-stage-locked` applies blur/opacity. Confirm Task 4 was executed before running the interaction tests in Step 3.

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html` — lines ~711-889 (the entire `<div class="uk" id="uk1">` block)

- [ ] **Step 1: Read the current UK block**

  Read lines 711-889 in the HTML file to understand all existing data attributes, error types, and content before rewriting.

- [ ] **Step 2: Replace the entire `.uk#uk1` block**

  Replace `<div class="uk" id="uk1" data-uk="pairs">` through `</div><!-- /uk#uk1 -->` with the following. Note all student-facing text has em/en dashes removed and replaced with commas or colons:

  ```html
  <div class="uk" id="uk1" data-uk="pairs">
    <div class="uk-head">
      <span class="op-badge" data-op="beurteilen">beurteilen · AB III</span>
      Urteilskompetenz — Binnenmarkt
    </div>
    <div class="uk-body">

      <!-- Leitfrage banner -->
      <div class="uk-leitfrage">
        <div class="uk-leitfrage-label">Leitfrage</div>
        <div class="uk-leitfrage-text">Überwiegen die Vorteile des EU-Binnenmarkts seine sozialen Kosten?</div>
      </div>

      <!-- ── STAGE 1: Einleitung (Kriterium + AB I) ──────── -->
      <div class="uk-stage" data-stage="1">
        <div class="uk-stage-header">
          <span class="uk-stage-tag" data-ab="1">AB I</span>
          <span class="uk-stage-title">Einleitung: Kontext, Kriterium und Material</span>
        </div>

        <!-- Kriterium -->
        <div class="uk-krit-block">
          <span class="uk-krit-tag">Kriterium festlegen</span>
          <div class="uk-krit-q">Welcher Maßstab ist geeignet, um die Leitfrage zu beantworten?</div>
          <div class="uk-krit-opts">
            <div class="uk-krit-opt" data-msidx="0" data-correct="true" data-error="" data-errtext=""
                 onclick="selKrit(this)">
              <span class="uk-krit-num">A</span>
              Sichert der Binnenmarkt Effizienz und sozialen Ausgleich für alle Mitglieder?
              <span class="uk-krit-opt-err"></span>
            </div>
            <div class="uk-krit-opt" data-msidx="1" data-correct="false" data-error="sided"
                 data-errtext="Dieser Maßstab erfasst nur die Wachstumsperspektive. Soziale Konsequenzen bleiben außen vor."
                 onclick="selKrit(this)">
              <span class="uk-krit-num">B</span>
              Fördert der Binnenmarkt gleichmäßiges BIP-Wachstum in allen Mitgliedstaaten?
              <span class="uk-krit-opt-err"></span>
            </div>
            <div class="uk-krit-opt" data-msidx="2" data-correct="false" data-error="vague"
                 data-errtext="Ein Beschäftigungsmaßstab greift zu kurz. Er ignoriert Lohnentwicklung, soziale Standards und Verteilungswirkungen."
                 onclick="selKrit(this)">
              <span class="uk-krit-num">C</span>
              Schafft der Binnenmarkt per Saldo mehr Arbeitsplätze als er verdrängt?
              <span class="uk-krit-opt-err"></span>
            </div>
          </div>
        </div>

        <!-- AB I Step 1: Theoretischer Kontext -->
        <div class="uk-step" data-step="kontext" data-ab="1">
          <div class="uk-step-header">
            <span class="uk-ab-tag">AB I: Theoretischer Kontext</span>
          </div>
          <p class="uk-step-q">Welche theoretische Grundlage hilft, die Leitfrage einzuordnen?</p>
          <ul class="uk-opts">
            <li class="uk-opt"
                data-error="step"
                data-errtext="Du beschreibst Fallbeispiele aus der Praxis. Diese gehören in Schritt 2 (Material und Fall). Der theoretische Kontext beschreibt, was Theorie und Normen sagen.">
              <span class="uk-opt-text">Sozialdumping, Brain Drain und Steuerwettbewerb zeigen, dass der Binnenmarkt in der Praxis asymmetrisch wirkt und nicht alle Mitglieder gleich profitieren.</span>
            </li>
            <li class="uk-opt" data-correct="true">
              <span class="uk-opt-text">Der Binnenmarkt basiert auf den vier Grundfreiheiten. Er ist ein Regelwerk für wirtschaftliche Integration, das durch einheitliche Standards gemeinsamen Wohlstand sichern soll.</span>
            </li>
          </ul>
        </div>

        <!-- AB I Step 2: Material und Fall -->
        <div class="uk-step" data-step="fall" data-ab="1">
          <div class="uk-step-header">
            <span class="uk-ab-tag">AB I: Material und Fall</span>
          </div>
          <p class="uk-step-q">Welche Aussage gibt die Fallbeispiele sachlich wieder, die für die Leitfrage relevant sind?</p>
          <ul class="uk-opts">
            <li class="uk-opt" data-correct="true">
              <span class="uk-opt-text">Sozialdumping durch Entsendung von Niedriglohnkräften, Brain Drain aus Osteuropa und Steuervermeidung durch Konzerne (LuxLeaks) zeigen konkrete Spannungen im Binnenmarkt.</span>
            </li>
            <li class="uk-opt"
                data-error="level"
                data-errtext="Du formulierst bereits ein Urteil über den Binnenmarkt. Hier sollen die Fallbeispiele zunächst sachlich dargestellt werden. Das Urteil kommt erst in der Schlussfolgerung.">
              <span class="uk-opt-text">Der Binnenmarkt schadet strukturell den schwächeren EU-Ländern und Arbeitnehmern in Hochlohnländern. Eine Reform ist unvermeidlich.</span>
            </li>
          </ul>
        </div>

        <!-- Stage 1 proceed -->
        <div class="uk-stage-footer">
          <button class="uk-stage-submit" disabled onclick="submitStage(this, 1)">
            Weiter zum Hauptteil
          </button>
        </div>
      </div><!-- /Stage 1 -->

      <!-- Stage 1 summary (shown when stage 1 complete) -->
      <div class="uk-stage-summary" data-stage="1">
        <span class="uk-stage-summary-check">✓</span>
        <span class="uk-stage-summary-label">AB I — Einleitung</span>
        <span class="uk-stage-summary-krit">Kriterium ✓</span>
      </div>

      <!-- ── STAGE 2: Hauptteil (Recheck #1 + AB II) ─────── -->
      <div class="uk-stage uk-stage-locked" data-stage="2">
        <div class="uk-stage-header">
          <span class="uk-stage-tag" data-ab="2">AB II</span>
          <span class="uk-stage-title">Hauptteil: Verbindung, Konflikte und Abwägung</span>
        </div>

        <!-- Recheck #1 -->
        <div class="uk-krit-recheck">
          <div class="uk-krit-recheck-label">Roter Faden: Kriterium bestätigen</div>
          <div class="uk-krit-chips">
            <div class="uk-krit-chip" data-msidx="0">Effizienz und sozialer Ausgleich</div>
            <div class="uk-krit-chip" data-msidx="1">BIP-Wachstum aller Mitglieder</div>
            <div class="uk-krit-chip" data-msidx="2">Netto-Beschäftigungseffekt</div>
          </div>
          <div class="uk-krit-recheck-err"></div>
        </div>

        <!-- AB II Step 3: Verbindung und Konflikte -->
        <div class="uk-step" data-step="verbindung" data-ab="2">
          <div class="uk-step-header">
            <span class="uk-ab-tag">AB II: Verbindung und Konflikte</span>
          </div>
          <p class="uk-step-q">Wo geraten Theorie und Fallbeispiele in Konflikt, gemessen am Kriterium der Leitfrage?</p>
          <ul class="uk-opts">
            <li class="uk-opt"
                data-error="chain"
                data-errtext="Du listest Sachverhalte nebeneinander, ohne den Widerspruch zu benennen. Zeige, wo Anspruch und Wirklichkeit auseinanderfallen.">
              <span class="uk-opt-text">Der Binnenmarkt hat die vier Grundfreiheiten geschaffen. Gleichzeitig entstehen Probleme wie Sozialdumping, Brain Drain und Steuerwettbewerb.</span>
            </li>
            <li class="uk-opt" data-correct="true">
              <span class="uk-opt-text">Die vier Grundfreiheiten versprechen gemeinsamen Wohlstand, die Praxis zeigt jedoch asymmetrische Ergebnisse. Stärkere Volkswirtschaften profitieren strukturell mehr, während Sozialdumping und Steuervermeidung auf Kosten schwächerer Akteure gehen.</span>
            </li>
          </ul>
        </div>

        <!-- AB II Step 4: Abwägung -->
        <div class="uk-step" data-step="abwaegung" data-ab="2">
          <div class="uk-step-header">
            <span class="uk-ab-tag">AB II: Abwägung</span>
          </div>
          <p class="uk-step-q">Welche Perspektive überwiegt bei der Beantwortung der Leitfrage?</p>
          <ul class="uk-opts">
            <li class="uk-opt" data-correct="true">
              <span class="uk-opt-text">Unternehmen und exportstarke Staaten sehen den Binnenmarkt als Wachstumsmotor. Arbeitnehmer in Hochlohnländern und ärmere Regionen erleben dagegen Lohndruck und Abwanderung, sodass beide Perspektiven am gewählten Kriterium gemessen werden müssen.</span>
            </li>
            <li class="uk-opt"
                data-error="sided"
                data-errtext="Du berücksichtigst nur eine Seite. Eine Abwägung zeigt, wie verschiedene Akteure dieselbe Realität unterschiedlich erleben und bewerten.">
              <span class="uk-opt-text">Der Binnenmarkt belastet Arbeitnehmer in allen EU-Ländern durch Lohndruck und verschlechterte Arbeitsbedingungen, sodass die wirtschaftlichen Vorteile eindeutig überwiegen.</span>
            </li>
          </ul>
        </div>

        <!-- Stage 2 proceed -->
        <div class="uk-stage-footer">
          <button class="uk-stage-submit" disabled onclick="submitStage(this, 2)">
            Weiter zur Schlussfolgerung
          </button>
        </div>
      </div><!-- /Stage 2 -->

      <!-- Stage 2 summary -->
      <div class="uk-stage-summary" data-stage="2">
        <span class="uk-stage-summary-check">✓</span>
        <span class="uk-stage-summary-label">AB II — Hauptteil</span>
      </div>

      <!-- ── STAGE 3: Schlussfolgerung (Recheck #2 + AB III) -->
      <div class="uk-stage uk-stage-locked" data-stage="3">
        <div class="uk-stage-header">
          <span class="uk-stage-tag" data-ab="3">AB III</span>
          <span class="uk-stage-title">Schlussfolgerung: Begründetes Urteil</span>
        </div>

        <!-- Recheck #2 -->
        <div class="uk-krit-recheck">
          <div class="uk-krit-recheck-label">Roter Faden: Urteil mit Kriterium verknüpfen</div>
          <div class="uk-krit-chips">
            <div class="uk-krit-chip" data-msidx="0">Effizienz und sozialer Ausgleich</div>
            <div class="uk-krit-chip" data-msidx="1">BIP-Wachstum aller Mitglieder</div>
            <div class="uk-krit-chip" data-msidx="2">Netto-Beschäftigungseffekt</div>
          </div>
          <div class="uk-krit-recheck-err"></div>
        </div>

        <!-- AB III Step 5: Begründetes Urteil -->
        <div class="uk-step" data-step="urteil" data-ab="3">
          <div class="uk-step-header">
            <span class="uk-ab-tag">AB III: Begründetes Urteil</span>
          </div>
          <p class="uk-step-q">Welches Urteil beantwortet die Leitfrage überzeugend und verweist auf das Kriterium?</p>
          <ul class="uk-opts">
            <li class="uk-opt"
                data-error="chain"
                data-errtext="Das Urteil ist inhaltlich nachvollziehbar, verweist aber nicht auf das Kriterium aus der Einleitung. Das Urteil muss aus dem Kriterium folgen: das ist der rote Faden.">
              <span class="uk-opt-text">Der Binnenmarkt hat Stärken und Schwächen. Insgesamt überwiegen die wirtschaftlichen Vorteile, aber eine schrittweise Reform wäre sinnvoll.</span>
            </li>
            <li class="uk-opt" data-correct="true">
              <span class="uk-opt-text">Gemessen am Kriterium, sozialer Ausgleich und Effizienz für alle, erfüllt der Binnenmarkt seinen Anspruch nur teilweise. Solange Sozialdumping und Steuervermeidung strukturell möglich bleiben, sind verbindliche Sozialstandards und koordinierte Steuerpolitik notwendige Konsequenzen.</span>
            </li>
          </ul>
        </div>

        <!-- Stage 3 proceed (final) -->
        <div class="uk-stage-footer">
          <button class="uk-stage-submit" disabled onclick="submitStage(this, 3)">
            Argumentation abschließen
          </button>
        </div>
      </div><!-- /Stage 3 -->

    </div><!-- /uk-body -->
  </div><!-- /uk#uk1 -->
  ```

- [ ] **Step 3: Full interaction test — happy path**

  Open unit in browser. Work through the entire UK block:

  1. Stage 1 visible, stages 2 and 3 muted/blurred.
  2. Select Kriterium option A (correct). Both AB I options now need selection before "Weiter" enables.
  3. Select one option in each AB I step. "Weiter zum Hauptteil" button enables.
  4. Click "Weiter". Stage 1 collapses (display:none). Summary row appears: "✓  AB I — Einleitung  |  Kriterium ✓". Stage 2 unlocks (no longer blurred).
  5. In stage 2: recheck chip matching Kriterium A is pre-selected. Select one option per AB II step. "Weiter" enables.
  6. Click "Weiter". Stage 2 collapses. Summary row appears. Stage 3 unlocks.
  7. In stage 3: recheck chip pre-selected. Select AB III option. "Abschließen" enables.
  8. Click "Abschließen". Block gets `.uk-complete`.

- [ ] **Step 4: Error path tests**

  a. **Wrong Kriterium**: Select option B or C, fill AB I steps, click "Weiter". Kriterium option turns red, error text appears. Button re-disables. Selecting option A re-enables and clears error.

  b. **Wrong recheck chip (stage 2)**: Complete stage 1 correctly. In stage 2, change the chip to a wrong one, fill AB II steps, click "Weiter". Chip shows error. Correct chip re-enables.

  c. **No selection blocking**: Without selecting all items in a stage, the proceed button remains disabled.

- [ ] **Step 5: Commit**

  ```bash
  git add einheiten/3-5_binnenmarkt.html
  git commit -m "feat: UK block 3-stage sequential reveal with per-stage validation"
  ```

---

### Task 9: Final visual QA

Verify all four design areas together with no regressions in other parts of the unit.

**Files:** No changes — read-only verification.

- [ ] **Step 1: LZ pills check**

  Unit header: each LZ shows solid accent panel (LZ 1/2/3) on left, full text on right. Text is readable, no dashes.

- [ ] **Step 2: Tool row check**

  Row is at 70% opacity at rest. Hovering the row brings it to full opacity. Password unlock still works (enter correct password, content unlocks). Reset button still works (confirm dialog, page reloads).

- [ ] **Step 3: Aufgabe card check**

  Cards 01 and 02: number mono-bold on left, title centered in remaining space, LZ chip(s) and Klausur badge on right — all on the same vertical center. Body text is visibly smaller than the title.

- [ ] **Step 4: Einstieg and Gruppenarbeit sections unchanged**

  The Einstieg accordion and Gruppenarbeit/Fallstudien sections below the UK block should render identically to before.

- [ ] **Step 5: UK block complete flow**

  Run through the happy path one more time in a clean browser session (clear localStorage first: `Progress.clear('3-5')` in console, then reload).

- [ ] **Step 6: Final commit if any QA fixes needed**

  ```bash
  git add -p
  git commit -m "fix: QA corrections after UI structural refinements"
  ```
