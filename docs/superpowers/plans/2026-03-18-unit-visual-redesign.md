# Unit Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full visual redesign spec across `css/style.css`, `js/engine.js`, and `einheiten/3-5_binnenmarkt.html` — collapsible Einstieg with chip check, QG indent + collapse/retry, section divider gradient rule, and typography scale.

**Architecture:** CSS states are driven by `data-state` attributes set by JS. All new behaviour (QG collapse, Einstieg check) extends `engine.js` via new `window`-scoped functions following the existing pattern (no new files). HTML changes are confined to `3-5_binnenmarkt.html` as the reference unit; the same changes apply to future units when authored.

**Tech Stack:** Vanilla HTML5, CSS3 custom properties, vanilla JS (ES5), `localStorage` via `Progress` API, no build tools, no test framework. All verification is manual browser testing.

---

## Chunk 1: CSS Changes

### Task 1: CSS tokens + typography scale

**Files:**
- Modify: `css/style.css:19-57` (`:root`)
- Modify: `css/style.css:287-293` (`.sw-title`)
- Modify: `css/style.css:553-566` (`.qg-head`)
- Modify: `css/style.css:599-605` (`.qi-t` primary rule)
- Modify: `css/style.css:1623` (`.qi-t` duplicate rule — must also be updated)
- Modify: `css/style.css:648-661` (`.mco`)

- [ ] **Step 1: Add `--ok-border` token to `:root` (~line 36)**

Find in `:root`:
```css
  --ok:        #2d7a4f;
  --ok-l:      #eaf4ee;
```
Change to:
```css
  --ok:        #2d7a4f;
  --ok-l:      #eaf4ee;
  --ok-border: #a5d4b8;
```

- [ ] **Step 2: Update `.sw-title` font-size from `1rem` to `0.92rem` (~line 289)**

Change:
```css
.sw-title {
  font-family: var(--ff-head);
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.25;
}
```
to:
```css
.sw-title {
  font-family: var(--ff-head);
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.25;
}
```

- [ ] **Step 3: Update `.qi-t` to Fraunces bold (~line 599)**

Change:
```css
.qi-t {
  font-size: .875rem;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.55;
  margin-bottom: .6rem;
}
```
to:
```css
.qi-t {
  font-family: var(--ff-head);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.55;
  margin-bottom: .6rem;
}
```

- [ ] **Step 4: Fix duplicate `.qi-t` rule (~line 1623)**

There is a second `.qi-t` rule later in the file (`font-size: .9rem; font-weight: 500`). Because it appears after the primary rule, it wins by cascade. Update it to match:

```css
.qi-t { font-family: var(--ff-head); font-size: 0.85rem; font-weight: 600; margin-bottom: .6rem; line-height: 1.55; }
```

- [ ] **Step 5: Update `.mco` font-size to `0.77rem` (~line 656)**

The `.mco` rule has `font-size: .875rem`. Change that one property:
```css
  font-size: 0.77rem;
```

- [ ] **Step 6: Update `.qg-head` — add cursor + user-select (~line 553)**

The existing `.qg-head` has `color: var(--ink2)` and no cursor. The new design makes the header clickable and uses cyan for the label (handled via `.qg-label` in Task 3, so only cursor + user-select need to be added here):

Add to the existing `.qg-head` rule:
```css
  cursor: pointer;
  user-select: none;
```

- [ ] **Step 6: Add vertical rhythm spacing — add after section 13 `.qg-locked` block (~line 618)**

```css
/* Breathing room between completed check and next knowledge block */
.qg-wrapper + .sw {
  margin-top: 1.75rem;
}

/* Tight coupling: QG visually sub-part of the SW block above */
.sw + .qg-wrapper {
  margin-top: 0.5rem;
}
```

- [ ] **Step 7: Verify in browser**

Open `einheiten/3-5_binnenmarkt.html`. Check:
- QG question text is visibly rounder/warmer (Fraunces serif)
- SW block title is fractionally smaller than before
- MC answer options are slightly smaller than the question text

- [ ] **Step 8: Commit**

```bash
git add css/style.css
git commit -m "style: --ok-border token, sw-title/qi-t/mco typography, vertical rhythm"
```

---

### Task 2: Section divider redesign

**Files:**
- Modify: `css/style.css:1118-1148` (section 24)
- Modify: `einheiten/3-5_binnenmarkt.html` (3 occurrences of `.section-divider`)

The current CSS uses `::before` / `::after` flex lines with a plain `1px var(--border)` rule. The new design uses a single centered `::before` pseudo-element with a gradient accent rule and a `.section-divider-inner` span for the label.

- [ ] **Step 1: Delete the old `::before, ::after` combined rule (lines 1142–1148)**

The old divider uses a separate combined selector block that must be deleted independently from the main rule:
```css
.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
```
Delete this block entirely. It is separate from the `.section-divider {}` rule above it.

- [ ] **Step 2: Replace the remaining `.section-divider` rules (lines 1121–1141)**

Remove:
```css
.section-divider { ... }
.section-divider span { ... }
```

Replace with:
```css
.section-divider {
  position: relative;
  text-align: center;
  margin: 2rem 0 1.5rem;
}

.section-divider::before {
  content: '';
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--acc) 20%, var(--acc) 80%, transparent);
  transform: translateY(-50%);
}

.section-divider-inner {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  background: var(--bg);
  padding: 0 1rem;
  font-family: var(--ff-head);
  font-size: 1rem;
  font-weight: 700;
  color: var(--acc);
}
```

- [ ] **Step 4: Update the three `section-divider` elements in the HTML**

`einheiten/3-5_binnenmarkt.html` has three of these (lines ~529, 835, 906).

Line ~529 — Arbeitsblatt:
```html
<div class="section-divider">Arbeitsblatt</div>
```
→
```html
<div class="section-divider"><span class="section-divider-inner">📝 Arbeitsblatt</span></div>
```

Line ~835 — Gruppenarbeit:
```html
<div class="section-divider">Gruppenarbeit</div>
```
→
```html
<div class="section-divider"><span class="section-divider-inner">Gruppenarbeit</span></div>
```

Line ~906 — Quellenverzeichnis:
```html
<div class="section-divider">Quellenverzeichnis</div>
```
→
```html
<div class="section-divider"><span class="section-divider-inner">Quellenverzeichnis</span></div>
```

- [ ] **Step 5: Verify in browser**

Scroll to the Arbeitsblatt separator. Check:
- Gradient accent rule spans the full width, fading to transparent at both edges
- "📝 Arbeitsblatt" label is centered, Fraunces, accent-colored, on a `var(--bg)` background that punches through the rule
- No visible box or card around it

- [ ] **Step 6: Commit**

```bash
git add css/style.css einheiten/3-5_binnenmarkt.html
git commit -m "style: section-divider gradient rule + Fraunces label"
```

---

### Task 3: QG wrapper + state CSS

**Files:**
- Modify: `css/style.css` — add after section 13 (`.qg-locked` block, ~line 618)

The `.qg-wrapper` creates the indentation and connector line that signal the QG is a sub-part of the SW block above it. QG states (open / passed / retry) are driven by `data-state` attribute set by JS in Task 6. The CSS rules here are inert until Task 6 is implemented; DevTools verification is manual.

- [ ] **Step 1: Add `.qg-wrapper` and connector line CSS**

After the vertical rhythm rules added in Task 1, add:

```css
/* ----------------------------------------------------------
   QG hierarchy wrapper — indent + connector line
   ---------------------------------------------------------- */

/* Creates visible subordination to SW block above */
.qg-wrapper {
  position: relative;
  padding-left: 1.1rem;
  margin-bottom: var(--gap);
}

/* Fading vertical accent line connecting QG to SW above */
.qg-wrapper::before {
  content: '';
  position: absolute;
  left: 0.45rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--acc) 60%, transparent);
}

/* QG inside wrapper loses its own bottom margin (wrapper handles spacing) */
.qg-wrapper .qg {
  margin-bottom: 0;
  border-radius: var(--r-sm);
}
```

- [ ] **Step 2: Add QG state CSS (passed + retry)**

Continue adding:

```css
/* ----------------------------------------------------------
   QG states — passed / retry
   ---------------------------------------------------------- */

/* Passed: green border + background */
.qg[data-state="passed"],
.qg[data-state="retry"] {
  border-color: var(--ok-border);
  background: var(--ok-l);
}

.qg[data-state="passed"] .qg-head,
.qg[data-state="retry"] .qg-head {
  background: var(--ok-l);
  border-bottom-color: var(--ok-border);
}

/* Passed: body hidden (collapsed strip) */
.qg[data-state="passed"] .qg-body {
  display: none;
}

/* Retry link — visible only in passed state */
.qg-retry-link {
  display: none;
  padding: .45rem 1.25rem .7rem;
  font-size: .8rem;
}

.qg[data-state="passed"] .qg-retry-link {
  display: block;
}
```

- [ ] **Step 3: Add `.qg-label` and `.qg-chevron` CSS**

Continue adding:

```css
/* QG header sub-elements */
.qg-label {
  font-family: var(--ff-mono);
  font-size: .7rem;
  font-weight: 600;
  color: var(--sw);
  text-transform: uppercase;
  letter-spacing: .1em;
}

.qg-chevron {
  font-size: .75rem;
  color: var(--ink3);
  flex-shrink: 0;
  margin-left: auto;
  transition: transform .2s;
}

/* Status pill — override existing .qg-head .qg-status to ensure font */
.qg-status {
  font-family: var(--ff-mono);
  font-size: .68rem;
  font-weight: 600;
  padding: .18em .6em;
  border-radius: 4px;
}
```

Note: The `.qg-status.pend` and `.qg-status.pass` color rules already exist in the CSS (~line 576–577) and remain unchanged.

- [ ] **Step 4: Verify CSS-only rendering (no JS yet)**

Open `einheiten/3-5_binnenmarkt.html` in the browser. Using DevTools, manually set `data-state="passed"` on `#qg1`. Verify:
- QG body disappears, header turns green/light green
- `.qg-retry-link` becomes visible with green-tinted background
Remove the manual attribute before continuing.

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "style: qg-wrapper indent+connector, QG passed/retry state CSS"
```

---

### Task 4: Einstieg CSS redesign

**Files:**
- Modify: `css/style.css:347-432` (section 9, Einstieg)

The current `.einstieg` is a plain white card. The new design is a two-zone block: full-accent header strip + soft-tint body with semi-transparent inner cards. Three states driven by `data-state` set by JS in Task 8. The state CSS is inert until Task 8 is implemented; use DevTools manually to verify states.

- [ ] **Step 1: Replace section 9 Einstieg CSS (lines ~349–432)**

Keep `.lk-note` and `.lk-note strong` rules entirely unchanged.
Remove: `.einstieg`, `.einstieg h2`, `.einstieg p`, `.einstieg-head`, `.example`, `.example::before`.
Replace with:

```css
/* ----------------------------------------------------------
   9. Einstieg-Box (.einstieg) — collapsible accent block
   ---------------------------------------------------------- */

.einstieg {
  border: 2px solid var(--acc);
  border-radius: var(--r);
  margin-bottom: var(--gap);
  overflow: hidden;
  transition: border-color .2s;
}

/* Header strip: full accent background */
.einstieg-header {
  background: var(--acc);
  padding: .85rem 1.25rem;
  display: flex;
  align-items: center;
  gap: .6rem;
  cursor: pointer;
  user-select: none;
}

.einstieg-header:hover {
  filter: brightness(1.05);
}

/* "EINSTIEG" mono badge */
.einstieg-badge {
  font-family: var(--ff-mono);
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  background: rgba(255,255,255,.18);
  color: #fff;
  padding: .18em .6em;
  border-radius: 4px;
  flex-shrink: 0;
}

/* Fraunces title in header */
.einstieg-title {
  font-family: var(--ff-head);
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  flex: 1;
}

/* Status pill: Offen / Bestanden */
.einstieg-status-pill {
  font-family: var(--ff-mono);
  font-size: .68rem;
  font-weight: 600;
  padding: .18em .6em;
  border-radius: 4px;
  background: rgba(255,255,255,.15);
  color: #fff;
  flex-shrink: 0;
}

/* Chevron */
.einstieg-chevron {
  color: rgba(255,255,255,.7);
  font-size: .8rem;
  flex-shrink: 0;
}

/* Body: soft accent tint */
.einstieg-body {
  background: var(--accL);
  padding: 1.25rem 1.5rem;
}

.einstieg-body > p {
  font-size: .9rem;
  color: var(--ink2);
  line-height: 1.75;
  margin-bottom: .75rem;
}

/* Inner situation cards: semi-transparent white on the tint */
/* Note: rgba(var(--acc), 0.18) is invalid CSS — use color-mix instead */
.einstieg-card {
  background: rgba(255,255,255,.7);
  border: 1px solid color-mix(in srgb, var(--acc) 18%, transparent);
  border-radius: var(--r-sm);
  padding: .85rem 1rem;
  margin-top: .75rem;
  font-size: .9rem;
  color: var(--ink2);
  line-height: 1.65;
}

/* Freedom selection chips */
.einstieg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  margin-top: .6rem;
}

.e-chip {
  font-family: var(--ff-mono);
  font-size: .7rem;
  font-weight: 500;
  padding: .28em .8em;
  border: 1.5px solid var(--border);
  border-radius: 99px;
  background: rgba(255,255,255,.8);
  color: var(--ink2);
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
}

.e-chip:hover {
  border-color: var(--acc);
  background: #fff;
}

.e-chip.selected {
  border-color: var(--acc);
  background: var(--acc);
  color: #fff;
}

.e-chip.correct {
  border-color: var(--ok);
  background: var(--ok);
  color: #fff;
}

.e-chip.wrong {
  border-color: var(--err);
  background: var(--err-l);
  color: var(--err);
}

/* Retry strip — visible below header when passed */
.einstieg-retry {
  display: none;
  padding: .5rem 1.25rem .75rem;
  background: var(--ok-l);
  font-size: .8rem;
}

/* --- Passed state --- */
.einstieg[data-state="passed"] {
  border-color: var(--ok-border);
}

.einstieg[data-state="passed"] .einstieg-header {
  background: var(--ok);
}

.einstieg[data-state="passed"] .einstieg-body {
  display: none;
}

.einstieg[data-state="passed"] .einstieg-retry {
  display: block;
}

/* --- Re-opened state (still passed, body visible, answers reset) --- */
.einstieg[data-state="re-opened"] {
  border-color: var(--ok-border);
}

.einstieg[data-state="re-opened"] .einstieg-header {
  background: var(--ok);
}

.einstieg[data-state="re-opened"] .einstieg-retry {
  display: none;
}

/* .lk-note and .lk-note strong — UNCHANGED from existing rules below */
```

- [ ] **Step 2: Update `.example` vignette style**

The `.example` class in the current Einstieg will be replaced by `.einstieg-card` in Task 7. After that change, `.example` is only used outside the Einstieg (Sachwissen blocks, other pages). The spec (Section 9) defines the new vignette treatment for all `.example` elements. Find the `.example` rule and replace with:

```css
.example {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-left: 2px solid color-mix(in srgb, var(--acc) 30%, transparent);
  border-radius: var(--r-sm);
  padding: .75rem 1rem .75rem 1.25rem;
  margin-top: .75rem;
  font-size: .9rem;
  color: var(--ink2);
  line-height: 1.7;
}
```

Remove the `.example::before` rule (the "Beispiel:" label is dropped; the vignette border replaces it as the visual signal).

- [ ] **Step 3: Verify CSS-only in browser**

Open `einheiten/3-5_binnenmarkt.html`. The Einstieg HTML is still the old structure, so you'll see broken layout — this is expected. Use DevTools to apply a rough `data-state="passed"` to the Einstieg div and confirm border turns green. Remove before continuing.

- [ ] **Step 4: Commit**

```bash
git add css/style.css
git commit -m "style: einstieg collapsible accent block CSS, e-chip states, example vignette"
```

---

## Chunk 2: HTML + JS Changes

### Task 5: HTML — QG structural overhaul

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html` — qg1 (~line 197), qg2 (~line 318), qg3 (~line 466)

Three changes per QG:
1. Wrap in `.qg-wrapper`
2. Replace `.qg-head` content with new format (label + status pill + chevron)
3. Add `.qg-retry-link` as last child of `.qg`

- [ ] **Step 1: Update qg1**

Current opening:
```html
  <div class="qg" id="qg1">
    <div class="qg-head">🔓 Verständnischeck — Block 1<span class="qg-status pend" id="qg1s">Offen</span></div>
    <div class="qg-body">
```

Replace with:
```html
  <div class="qg-wrapper">
  <div class="qg" id="qg1">
    <div class="qg-head" onclick="toggleQg(1)">
      <span class="qg-label">✓ VERSTÄNDNISCHECK</span>
      <span class="qg-status pend" id="qg1s">Block 1: Offen</span>
      <span class="qg-chevron">▾</span>
    </div>
    <div class="qg-body">
```

Add retry link and closing wrapper tags immediately before the closing `</div>` of the `.qg` block (which is the line after `</div>` closing `.qg-body`):
```html
    <div class="qg-retry-link" id="qg1-retry">
      <a href="#" onclick="retryQg(1); return false">↺ Wiederholen &amp; zurücksetzen</a>
    </div>
  </div><!-- /.qg -->
  </div><!-- /.qg-wrapper -->
```

- [ ] **Step 2: Update qg2 (same pattern)**

Current opening (~line 318):
```html
  <div class="qg locked" id="qg2">
    <div class="qg-head">🔓 Verständnischeck — Block 2<span class="qg-status pend" id="qg2s">Offen</span></div>
```

Replace with:
```html
  <div class="qg-wrapper">
  <div class="qg locked" id="qg2">
    <div class="qg-head" onclick="toggleQg(2)">
      <span class="qg-label">✓ VERSTÄNDNISCHECK</span>
      <span class="qg-status pend" id="qg2s">Block 2: Offen</span>
      <span class="qg-chevron">▾</span>
    </div>
```

Add before closing `</div>` of `.qg`:
```html
    <div class="qg-retry-link" id="qg2-retry">
      <a href="#" onclick="retryQg(2); return false">↺ Wiederholen &amp; zurücksetzen</a>
    </div>
  </div><!-- /.qg -->
  </div><!-- /.qg-wrapper -->
```

- [ ] **Step 3: Update qg3 (same pattern)**

Current opening (~line 466):
```html
  <div class="qg locked" id="qg3">
    <div class="qg-head">🔓 Verständnischeck — Block 3<span class="qg-status pend" id="qg3s">Offen</span></div>
```

Replace with:
```html
  <div class="qg-wrapper">
  <div class="qg locked" id="qg3">
    <div class="qg-head" onclick="toggleQg(3)">
      <span class="qg-label">✓ VERSTÄNDNISCHECK</span>
      <span class="qg-status pend" id="qg3s">Block 3: Offen</span>
      <span class="qg-chevron">▾</span>
    </div>
```

Add before closing `</div>` of `.qg`:
```html
    <div class="qg-retry-link" id="qg3-retry">
      <a href="#" onclick="retryQg(3); return false">↺ Wiederholen &amp; zurücksetzen</a>
    </div>
  </div><!-- /.qg -->
  </div><!-- /.qg-wrapper -->
```

- [ ] **Step 4: Verify in browser (CSS from Tasks 1–3 already in place)**

Open `einheiten/3-5_binnenmarkt.html`. Check:
- QG blocks are visually indented with the left accent connector line
- Header shows "✓ VERSTÄNDNISCHECK" in cyan, "Block N: Offen" gold pill, chevron
- Clicking headers has no visible effect yet (JS not added)
- No JavaScript errors in the browser console

- [ ] **Step 5: Commit**

```bash
git add einheiten/3-5_binnenmarkt.html
git commit -m "html: wrap QGs in qg-wrapper, new header format with retry link"
```

---

### Task 6: JS — QG collapse/expand/retry

**Files:**
- Modify: `js/engine.js`

Three additions: (a) new `toggleQg` / `retryQg` / `_resetQgForRetry` functions, (b) auto-collapse in `chkQ` on pass, (c) state restore in `_restoreState`.

- [ ] **Step 1: Add QG collapse functions after `window.rstQ` (~line 409)**

Insert before `window.unlk`:

```javascript
  /* --------------------------------------------------------
     toggleQg(gateNr) — Collapse/expand a passed QG panel
     passed  → retry  (expand, reset answers)
     retry   → passed (collapse)
     open    → no-op  (cannot collapse before passing)
  -------------------------------------------------------- */
  window.toggleQg = function (gateNr) {
    var gate = document.getElementById('qg' + gateNr);
    if (!gate) return;
    var state = gate.getAttribute('data-state') || 'open';
    if (state === 'passed') {
      _resetQgForRetry(gateNr, gate);
      gate.setAttribute('data-state', 'retry');
    } else if (state === 'retry') {
      /* Spec: "Chevron closes immediately — no obligation to re-answer."
         Collapse back to passed without requiring a new submission. */
      gate.setAttribute('data-state', 'passed');
    }
    /* state === 'open': no-op — cannot collapse before passing */
  };

  /* --------------------------------------------------------
     retryQg(gateNr) — Expand from the retry link (same as
     clicking the header in passed state)
  -------------------------------------------------------- */
  window.retryQg = function (gateNr) {
    var gate = document.getElementById('qg' + gateNr);
    if (!gate) return;
    var state = gate.getAttribute('data-state') || 'open';
    if (state === 'passed') {
      _resetQgForRetry(gateNr, gate);
      gate.setAttribute('data-state', 'retry');
    }
  };

  /* Resets answers inside a QG (bypasses qgPass guard — gate stays passed).
     Known limitation: .olist DOM order is NOT restored. The engine never
     stores original item order, so shuffled ordering tasks will show the
     student's last arrangement. This matches existing rstQ behaviour.
     qgPass[gateNr] and data-passed are NOT cleared — gate stays unlocked. */
  function _resetQgForRetry(gateNr, gate) {
    gate.querySelectorAll('.mco input').forEach(function (inp) {
      inp.checked = false;
      var item = inp.closest('.mco');
      if (item) item.classList.remove('selected', 'correct', 'wrong');
    });
    gate.querySelectorAll('.qinp input, .qinp textarea').forEach(function (inp) {
      inp.value = '';
      inp.style.borderColor = '';
      var fb = inp.closest('.qinp') ? inp.closest('.qinp').querySelector('.qinp-feedback') : null;
      if (fb) { fb.className = 'qinp-feedback'; fb.textContent = ''; }
    });
    gate.querySelectorAll('.oitem').forEach(function (item) {
      item.classList.remove('correct', 'wrong');
    });
    var fbEl = document.getElementById('qfb' + gateNr);
    if (fbEl) { fbEl.style.display = 'none'; fbEl.textContent = ''; }
  }
```

- [ ] **Step 2: Auto-collapse + update pill on pass in `chkQ` (~line 370)**

Find:
```javascript
    if (correct === total && total > 0) {
      gate.setAttribute('data-passed', '1');
      qgPass[gateNr] = true;
      _saveGates();
      unlk(gateNr);
    }
```

Replace with:
```javascript
    if (correct === total && total > 0) {
      gate.setAttribute('data-passed', '1');
      gate.setAttribute('data-state', 'passed');
      /* Update status pill to "Block N: Bestanden" */
      var pill = document.getElementById('qg' + gateNr + 's');
      if (pill) {
        pill.textContent = 'Block ' + gateNr + ': Bestanden';
        pill.className = 'qg-status pass';
      }
      qgPass[gateNr] = true;
      _saveGates();
      unlk(gateNr);
    }
```

- [ ] **Step 3: Restore `data-state` + pill in `_restoreState` (~line 191)**

In `_restoreState`, find the first `Object.keys(saved.gates).forEach` block:
```javascript
          var gate = document.getElementById(key);
          if (gate) gate.setAttribute('data-passed', '1');
```

Replace with:
```javascript
          /* NOTE: _saveGates stores qgPass which uses integer keys.
             After JSON round-trip these become string keys like "1", "2".
             key.replace('qg','') is a no-op; nr is the correct integer.
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
```

- [ ] **Step 4: Verify in browser**

Open `einheiten/3-5_binnenmarkt.html`. Complete QG 1 correctly:
1. Answer all 4 questions correctly → QG 1 auto-collapses to green strip
2. Pill reads "Block 1: Bestanden" in green
3. "↺ Wiederholen & zurücksetzen" link is visible
4. Click link → QG expands, answers are reset, pill still reads "Block 1: Bestanden" (green)
5. Click header → QG collapses back
6. Reload page → QG 1 still shows as collapsed/passed (restored from localStorage)
7. Click the unit "↺ Zurücksetzen" button → confirm → QG returns to open state after reload

- [ ] **Step 5: Commit**

```bash
git add js/engine.js
git commit -m "feat: QG auto-collapse on pass, toggle/retry, pill update, state restore"
```

---

### Task 7: HTML — Einstieg structural overhaul

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html:101-156` (`.einstieg` block)

The current Einstieg is a static card with teacher note, situation cards, and an `aufloesung-box` (password-only). The new structure has a collapsible header + interactive chip selection per situation. The `aufloesung-box` is removed (answers are validated by the chip check instead).

- [ ] **Step 1: Replace the entire `.einstieg` block (lines ~101–156)**

The block starts with `<div class="einstieg">` and ends with `</div>` closing the einstieg. Replace in full with:

```html
  <!-- ================================================================
       EINSTIEG
       ================================================================ -->
  <div class="einstieg" id="einstieg">
    <div class="einstieg-header" onclick="toggleEinstieg()">
      <span class="einstieg-badge">EINSTIEG</span>
      <span class="einstieg-title">🚀 Einstieg: Dein Alltag im Binnenmarkt</span>
      <span class="einstieg-status-pill" id="einstieg-status">Offen</span>
      <span class="einstieg-chevron">▾</span>
    </div>
    <div class="einstieg-body" id="einstieg-body">

      <div class="lk-note">
        <strong>Hinweis Lehrkraft</strong>
        Starten Sie die Stunde mit diesen Alltagsbeispielen aus der Grenzregion Perl/Schengen.
        Die Schüler ordnen jeder Situation eine der vier Freiheiten zu und klicken auf den
        entsprechenden Chip. Erst wenn alle vier richtig sind, erscheint die Bestätigung.
      </div>

      <p style="margin-top:.75rem"><strong>Ordne jeder Situation die richtige EU-Freiheit zu:</strong></p>

      <div class="einstieg-card" data-sit="1" data-answer="person">
        <strong>Situation 1:</strong> Ihr lebt in Deutschland und eure Eltern arbeiten in Luxemburg.
        Jeden Morgen fahren sie über die Grenze, ohne angehalten zu werden. Niemand kontrolliert
        ihren Pass oder fragt nach einer Arbeitserlaubnis.
        <div class="einstieg-chips">
          <button class="e-chip" data-v="ware"   onclick="selEinstieg(this, 1)">🛒 Warenverkehr</button>
          <button class="e-chip" data-v="person" onclick="selEinstieg(this, 1)">🚶 Personenverkehr</button>
          <button class="e-chip" data-v="dienst" onclick="selEinstieg(this, 1)">🔧 Dienstleistungsverkehr</button>
          <button class="e-chip" data-v="kapital" onclick="selEinstieg(this, 1)">💶 Kapitalverkehr</button>
        </div>
      </div>

      <div class="einstieg-card" data-sit="2" data-answer="ware">
        <strong>Situation 2:</strong> Ihr fahrt mit euren Eltern nach Luxemburg zum Tanken, weil das
        Benzin dort günstiger ist. Oder ihr kauft beim Supermarkt in Frankreich Lebensmittel, die es
        im deutschen Supermarkt nicht gibt. Ihr bringt alles einfach mit nach Hause. Kein Zoll, keine
        Kontrolle.
        <div class="einstieg-chips">
          <button class="e-chip" data-v="ware"   onclick="selEinstieg(this, 2)">🛒 Warenverkehr</button>
          <button class="e-chip" data-v="person" onclick="selEinstieg(this, 2)">🚶 Personenverkehr</button>
          <button class="e-chip" data-v="dienst" onclick="selEinstieg(this, 2)">🔧 Dienstleistungsverkehr</button>
          <button class="e-chip" data-v="kapital" onclick="selEinstieg(this, 2)">💶 Kapitalverkehr</button>
        </div>
      </div>

      <div class="einstieg-card" data-sit="3" data-answer="dienst">
        <strong>Situation 3:</strong> Ein deutscher Handwerker renoviert eine Wohnung in Luxemburg.
        Er darf das, ohne dort eine eigene Firma gründen zu müssen. Und er ist günstiger als ein
        luxemburgischer Handwerker, weil die Lohnkosten in Deutschland niedriger sind.
        <div class="einstieg-chips">
          <button class="e-chip" data-v="ware"   onclick="selEinstieg(this, 3)">🛒 Warenverkehr</button>
          <button class="e-chip" data-v="person" onclick="selEinstieg(this, 3)">🚶 Personenverkehr</button>
          <button class="e-chip" data-v="dienst" onclick="selEinstieg(this, 3)">🔧 Dienstleistungsverkehr</button>
          <button class="e-chip" data-v="kapital" onclick="selEinstieg(this, 3)">💶 Kapitalverkehr</button>
        </div>
      </div>

      <div class="einstieg-card" data-sit="4" data-answer="kapital">
        <strong>Situation 4:</strong> Eure Eltern arbeiten in Luxemburg, aber ihr Gehalt wird auf
        ein deutsches Bankkonto überwiesen. Das Geld fließt automatisch über die Grenze, ohne
        Gebühren und ohne Genehmigung.
        <div class="einstieg-chips">
          <button class="e-chip" data-v="ware"   onclick="selEinstieg(this, 4)">🛒 Warenverkehr</button>
          <button class="e-chip" data-v="person" onclick="selEinstieg(this, 4)">🚶 Personenverkehr</button>
          <button class="e-chip" data-v="dienst" onclick="selEinstieg(this, 4)">🔧 Dienstleistungsverkehr</button>
          <button class="e-chip" data-v="kapital" onclick="selEinstieg(this, 4)">💶 Kapitalverkehr</button>
        </div>
      </div>

      <div style="margin-top:1rem;padding-top:.75rem;border-top:1px solid rgba(0,0,0,.08)">
        <button class="btn btn-primary btn-sm" id="einstieg-btn" onclick="chkEinstieg()" disabled>Prüfen →</button>
      </div>

    </div><!-- /.einstieg-body -->
    <div class="einstieg-retry" id="einstieg-retry">
      <a href="#" onclick="retryEinstieg(); return false">↺ Nochmal ansehen</a>
    </div>
  </div><!-- /#einstieg -->
```

- [ ] **Step 2: Verify structure in browser (CSS from Task 4 already in place)**

Open `einheiten/3-5_binnenmarkt.html`. Check:
- Accent-colored header strip with "EINSTIEG" badge, Fraunces title, "Offen" pill, chevron
- Soft `--accL` tinted body below
- 4 situation cards with chip buttons visible
- "Prüfen →" button is disabled
- No JavaScript errors in console (functions will be added in Task 8)

- [ ] **Step 3: Commit**

```bash
git add einheiten/3-5_binnenmarkt.html
git commit -m "html: einstieg chip-check structure (header strip, body, 4 situation cards)"
```

---

### Task 8: JS — Einstieg check/collapse/retry

**Files:**
- Modify: `js/engine.js`

Three additions: (a) `selEinstieg` / `chkEinstieg` / `toggleEinstieg` / `retryEinstieg` / `_resetEinstiegAnswers`, (b) Einstieg state restore in `_restoreState`.

- [ ] **Step 1: Add Einstieg engine functions to `engine.js`**

Add a new section before the `DOMContentLoaded` handler (~line 917):

```javascript
  /* ==========================================================
     EINSTIEG-ENGINE
     Chip-based check for the Einstieg entry block.
     ========================================================== */

  var _einstiegSel = {};  /* { sitNr: value } — selected chip per situation */

  /**
   * selEinstieg(btn, sitNr)
   * Select a freedom chip for a situation card.
   * Only one chip active per card at a time.
   * Enables the submit button once all 4 situations are answered.
   */
  window.selEinstieg = function (btn, sitNr) {
    var card = btn.closest('.einstieg-card');
    if (!card) return;

    /* Deselect other chips in this card */
    card.querySelectorAll('.e-chip').forEach(function (b) {
      b.classList.remove('selected', 'correct', 'wrong');
    });
    btn.classList.add('selected');
    _einstiegSel[sitNr] = btn.getAttribute('data-v');

    /* Enable submit once all cards answered */
    var allCards = document.querySelectorAll('.einstieg-card');
    var allAnswered = allCards.length > 0 && Array.from(allCards).every(function (c) {
      return !!_einstiegSel[c.getAttribute('data-sit')];
    });
    var submitBtn = document.getElementById('einstieg-btn');
    if (submitBtn) submitBtn.disabled = !allAnswered;
  };

  /**
   * chkEinstieg()
   * Validate all chip selections against data-answer on each card.
   * On all-correct: set data-state="passed", persist, update pill.
   * On wrong: show per-chip correct/wrong colours, leave open.
   */
  window.chkEinstieg = function () {
    var einstieg = document.getElementById('einstieg');
    if (!einstieg) return;

    var cards     = einstieg.querySelectorAll('.einstieg-card');
    var allCorrect = true;

    cards.forEach(function (card) {
      var sitNr    = card.getAttribute('data-sit');
      var expected = card.getAttribute('data-answer');
      var given    = _einstiegSel[sitNr];

      /* Reset chip states */
      card.querySelectorAll('.e-chip').forEach(function (b) {
        b.classList.remove('correct', 'wrong');
      });

      if (given) {
        var selChip = card.querySelector('.e-chip[data-v="' + given + '"]');
        if (given === expected) {
          if (selChip) selChip.classList.add('correct');
        } else {
          if (selChip) selChip.classList.add('wrong');
          allCorrect = false;
        }
      } else {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      einstieg.setAttribute('data-state', 'passed');
      var pill = document.getElementById('einstieg-status');
      if (pill) pill.textContent = 'Bestanden';
      /* Persist Einstieg pass */
      if (typeof CONF !== 'undefined') {
        var existing = Progress.load(CONF.id) || {};
        existing.einstieg = true;
        Progress.save(CONF.id, existing);
      }
    }
  };

  /**
   * toggleEinstieg()
   * Called by clicking the Einstieg header.
   * passed     → re-opened  (expand + reset answers; pill stays "Bestanden")
   * re-opened  → passed     (collapse)
   * open       → no-op      (cannot collapse before passing)
   */
  window.toggleEinstieg = function () {
    var einstieg = document.getElementById('einstieg');
    if (!einstieg) return;
    var state = einstieg.getAttribute('data-state') || 'open';
    if (state === 'passed') {
      _resetEinstiegAnswers(einstieg);
      einstieg.setAttribute('data-state', 're-opened');
    } else if (state === 're-opened') {
      einstieg.setAttribute('data-state', 'passed');
    }
  };

  /**
   * retryEinstieg()
   * Called by the "↺ Nochmal ansehen" link in the retry strip.
   */
  window.retryEinstieg = function () {
    var einstieg = document.getElementById('einstieg');
    if (!einstieg) return;
    var state = einstieg.getAttribute('data-state') || 'open';
    if (state === 'passed') {
      _resetEinstiegAnswers(einstieg);
      einstieg.setAttribute('data-state', 're-opened');
    }
  };

  function _resetEinstiegAnswers(einstieg) {
    _einstiegSel = {};
    einstieg.querySelectorAll('.e-chip').forEach(function (b) {
      b.classList.remove('selected', 'correct', 'wrong');
    });
    var btn = document.getElementById('einstieg-btn');
    if (btn) btn.disabled = true;
  }
```

- [ ] **Step 2: Restore Einstieg state in `_restoreState` (~line 180)**

**Important:** The Einstieg restore must be placed BEFORE the `if (saved.unlocked)` early-return branch (~line 181), not after `if (!saved) return;`. If placed after `if (!saved)`, it is skipped when a teacher unlocked the unit with a password — `saved.unlocked` triggers an early return before the Einstieg block is reached.

In `_restoreState`, find the structure:
```javascript
    if (!saved) return;

    if (saved.unlocked) {
      _unlockAll();
      ...
      return;
    }
```

Insert the Einstieg restore block between `if (!saved) return;` and `if (saved.unlocked)`:

```javascript
    if (!saved) return;

    /* Restore Einstieg passed state — must come before saved.unlocked check */
    if (saved.einstieg) {
      var einstieg = document.getElementById('einstieg');
      if (einstieg) {
        einstieg.setAttribute('data-state', 'passed');
        var pill = document.getElementById('einstieg-status');
        if (pill) pill.textContent = 'Bestanden';
      }
    }

    if (saved.unlocked) {
      ...
```

- [ ] **Step 3: Verify complete Einstieg behavior**

Open `einheiten/3-5_binnenmarkt.html`:

1. **Initial state:** Accent header strip, body open, chips available, "Prüfen →" disabled
2. **Select a chip per situation:** "Prüfen →" enables once all 4 have a selection
3. **Submit with wrong answers:** Wrong chip turns red, correct chip turns green, block stays open
4. **Submit all correct:** Block auto-collapses to green strip — header turns `--ok` green, "Bestanden" in pill, "↺ Nochmal ansehen" visible
5. **Click "Nochmal ansehen":** Block expands, all chips reset (no selection), "Bestanden" pill still green
6. **Click header again while re-opened:** Block collapses back to passed strip
7. **Reload page:** Einstieg still shows as passed (restored from localStorage)
8. **Click "↺ Zurücksetzen" in unit header → confirm:** Einstieg resets to open state after reload

- [ ] **Step 4: Commit**

```bash
git add js/engine.js
git commit -m "feat: einstieg chip check engine, collapse/retry/restore"
```

---

## Post-implementation check

After all 8 tasks are complete, do a full smoke test of the unit:

- [ ] Open `einheiten/3-5_binnenmarkt.html` fresh (clear localStorage first via DevTools → Application → Local Storage → Clear)
- [ ] Complete the Einstieg → collapses green
- [ ] Complete QG 1 → collapses green, SW 2 + QG 2 unlock
- [ ] Complete QG 2 → collapses green, SW 3 + QG 3 unlock
- [ ] Complete QG 3 → collapses green, Arbeitsblatt unlocks
- [ ] Verify Arbeitsblatt separator: gradient rule with "📝 Arbeitsblatt" floating label
- [ ] Reload page → all passed states restored, all locked/unlocked states correct
- [ ] Reset via button → everything returns to initial open state after reload
- [ ] No JavaScript errors in console at any step
