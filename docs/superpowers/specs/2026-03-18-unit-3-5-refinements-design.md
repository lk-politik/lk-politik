# Unit 3.5 Refinements — Design Spec
**Date:** 2026-03-18
**Scope:** Five targeted changes to `einheiten/3-5_binnenmarkt.html`, `css/style.css`, `js/uk-quiz.js`, and `js/tooltips.js` — based on review of the live unit.

All decisions confirmed interactively via browser mockups.

---

## 1. Ranking Exercise — CSS Size Fix

### Problem
The ordering/ranking question (`.olist`) is significantly larger than MC questions (`.mco`) because each item carries up/down arrow buttons. The visual weight is inconsistent.

### Fix
Reduce padding on `.oitem` and shrink `.oarr-btn` to match the overall size of MC option rows.

**Location:** `css/style.css` section 16, line ~1010. Current value: `.oitem { padding: .7rem 1rem; }`.

Target metrics (match `.mco` visual weight):
- `.oitem` padding: reduce from `.7rem 1rem` to `.35rem .75rem`
- `.oarr-btn`: reduce to `1.4rem × 1.4rem`, font-size `0.65rem`
- `.oitem` font-size: `0.82rem` (matches `.mco` text)

No JS changes required.

---

## 2. Prüfungsrelevanz — Always-On + Corner Ribbon

### Current state
- Toggle button in unit header: `◇ Prüfungsrelevanz anzeigen`
- JS in `tooltips.js` toggles `prio-active` class on `<body>`
- CSS rules gated on `body.prio-active`

### New behaviour
Always-on. No toggle. Priority is always visible.

No `<body>` class change is required — the `body.prio-active` CSS class is simply removed as a prefix, making the rules unconditional. The `<body>` element itself needs no attribute or class modification.

### Changes required

**`js/tooltips.js`:**
- Delete the `_initPriorityToggle()` function entirely
- Remove the call to `_initPriorityToggle()` in the init block

**HTML (`3-5_binnenmarkt.html`):**
- Delete the `<button class="prio-toggle-btn">` element from the unit header controls

**`css/style.css` — section 39:**
- Remove the `body.prio-active` prefix from all rules in the Prüfungsrelevanz section
  → `body.prio-active .sw[data-p="core"] ...` becomes `.sw[data-p="core"] ...`
  → `body.prio-active .sw[data-p="ctx"] ...` becomes `.sw[data-p="ctx"] ...`
  → etc.

### Corner ribbon design

Replace the existing `::before` diamond marker on `.sw-head` with a corner ribbon on the `core` blocks:

```css
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
```

`ctx` blocks remain muted (reduced opacity — existing rules, now always active).

---

## 3. Progressive Visibility — Lock Fix

### Problem
At page load, QG2, QG3, and the "Analysieren AB II" exercise (`#ab2-1`) are visible even though the student hasn't progressed. They should be locked/greyed until their gate condition is met.

### Root cause
The `.qg-wrapper` div (added in the recent redesign) does not carry the `locked` class — only the inner `.qg` does. The wrapper is always fully visible.

Additionally, `#ab2-1` may be missing its initial `locked` class.

### Fix

**HTML (`3-5_binnenmarkt.html`):**
- `<div class="qg-wrapper">` for qg2 → `<div class="qg-wrapper locked">`
- `<div class="qg-wrapper">` for qg3 → `<div class="qg-wrapper locked">`
- Verify `#ab2-1` has `class="... locked"` at initial state

The DOM structure is:
```html
<div class="qg-wrapper locked">        <!-- ← receives locked class -->
  <div id="qg2" class="qg locked">    <!-- ← inner QG, also starts locked -->
    ...
  </div>
</div>
```

**`js/engine.js` — `_unlockBlock(gateNr, animate)` function (line ~531):**

The actual unlock logic lives in `_unlockBlock`, not `unlk`. The function already removes `locked` from `nextGate = document.getElementById('qg' + (gateNr + 1))`. After that removal, also unlock the wrapper:

```javascript
// After: nextGate.classList.remove('locked');
var wrapper = nextGate.closest('.qg-wrapper');
if (wrapper) wrapper.classList.remove('locked');
// (and the animate branch: wrapper.classList.add('unlocking') / setTimeout remove)
```

This fix must be applied in **two places** in `engine.js`:

**1. In `_unlockBlock()` itself (line ~531) — live unlock on pass (animate may be true):**
```javascript
// After: nextGate.classList.remove('locked');
var wrapper = nextGate.closest('.qg-wrapper');
if (wrapper) {
  wrapper.classList.remove('locked');
  if (animate) {
    wrapper.classList.add('unlocking');
    setTimeout(function () { wrapper.classList.remove('unlocking'); }, 600);
  }
}
```

**2. In `_restoreState()` (line ~221) — inside the forEach loop, directly after `_unlockBlock(nr, false)`:**
```javascript
// After: _unlockBlock(nr, false);
var restoredGate = document.getElementById('qg' + (nr + 1));
if (restoredGate) {
  var restoredWrapper = restoredGate.closest('.qg-wrapper');
  if (restoredWrapper) restoredWrapper.classList.remove('locked');
}
```
Note: no `classList.add('unlocking')` here — `_restoreState` always uses `animate = false`.

**`css/style.css`:**
- `.qg-wrapper.locked` currently has no explicit CSS rule. The existing `.sw.locked` rule (`opacity: .15; pointer-events: none; filter: blur(3px); transform: scale(.98)`) does not cascade to `.qg-wrapper`. Add an explicit rule:

```css
.qg-wrapper.locked {
  opacity: .15;
  pointer-events: none;
  filter: blur(3px);
  transform: scale(.98);
}
```

### Gruppenarbeit
Gruppenarbeit is already outside `#arbeitsblatt` (confirmed at line 879 of HTML). No structural changes needed — it is always visible by default.

---

## 4. Gruppenarbeit — Arbeitszeit Fix

### Problem
Current tag `Arbeitszeit: 15 min` only counts the group work phase. It omits presentations (4 × 3 min = 12 min) and discussion (10 min), and provides no buffer.

### Calculation formula (applies to all future units)
```
base = work_time + (groups × presentation_per_group) + discussion_time
     = 15 + (4 × 3) + 10 = 37 min

round_up_5 = ceil(base / 5) × 5 = 40 min

safety_low  = ceil(round_up_5 × 1.10 / 5) × 5 = 45 min   (10% margin)
safety_high = ceil(round_up_5 × 1.15 / 5) × 5 = 50 min   (15% margin, incl. instructions/Q&A)

display = "ca. {safety_low}–{safety_high} Min"
        = "ca. 45–50 Min"
```

The 15% upper bound accounts for: explaining the task, distributing materials, answering student questions, transition time.

### HTML change (`3-5_binnenmarkt.html`)
Replace the ablauf-tag block:

```html
<!-- Current -->
<span class="ablauf-tag">Arbeitszeit: 15 min</span>
<span class="ablauf-tag">Präsentation: 3 min / Gruppe</span>
<span class="ablauf-tag">Diskussion: 10 min</span>

<!-- New -->
<span class="ablauf-tag">Gruppenarbeit: 15 min</span>
<span class="ablauf-tag">Präsentation: 3 min / Gruppe</span>
<span class="ablauf-tag">Diskussion: 10 min</span>
<span class="ablauf-tag">Gesamt: ca. 45–50 Min</span>
```

---

## 5. AB Block — Full Redesign (UK Block)

### Overview
The Urteilskompetenz block (`#uk1`, `data-uk="pairs"`) is restructured around a methodology color system and a repositioned Kriterium that frames each section rather than following it.

### 5.1 Methodology Color Tokens

These are **fixed methodology colors** — not unit accent colors. Add inside the existing `:root { }` block in `css/style.css` (or add a new `:root { }` block in the UK section if no suitable `:root` is nearby). They must be on `:root` to be accessible by all `.uk-krit-opt`, `.uk-step`, etc. selectors.

```css
/* Methodology color tokens — fixed, not per-unit */
--rf-acc:  #dc2626;   /* Roter Faden / Kriterium */
--rf-bg:   #fef2f2;
--rf-bdr:  #fca5a5;
--rf-txt:  #7f1d1d;

--ab1-acc: #1d4ed8;   /* AB I — Sachwissen */
--ab1-bg:  #eff6ff;
--ab1-bdr: #bfdbfe;

--ab2-acc: #7c3aed;   /* AB II — Analyse */
--ab2-bg:  #f5f3ff;
--ab2-bdr: #ddd6fe;

--ab3-acc: #16a34a;   /* AB III — Urteil */
--ab3-bg:  #f0fdf4;
--ab3-bdr: #bbf7d0;
```

### 5.2 Leitfrage Banner

A dark banner at the top of the UK block body, anchored with a red bottom border connecting visually to the first Kriterium block.

```css
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
```

HTML position: first child of `.uk-body`, before any `.uk-section`.

### 5.3 Kriterium Block — First Encounter (Full Cards)

Replaces the current `<select>` dropdown. Appears once, before the Einleitung AB I steps. 3 options, exactly 1 correct (marked `data-correct="true"`).

**Sample HTML:**
```html
<div class="uk-krit-block">
  <span class="uk-krit-tag">🔴 Kriterium — Maßstab festlegen</span>
  <div class="uk-krit-q">Welcher Maßstab ist geeignet, um die Leitfrage zu beantworten?</div>
  <div class="uk-krit-opts">
    <div class="uk-krit-opt" data-msidx="0" data-correct="true"  onclick="selKrit(this)">
      <span class="uk-krit-num">A</span>Sichert der Binnenmarkt Effizienz und sozialen Ausgleich für alle Mitglieder?
    </div>
    <div class="uk-krit-opt" data-msidx="1" data-correct="false" onclick="selKrit(this)">
      <span class="uk-krit-num">B</span>Fördert der Binnenmarkt gleichmäßiges BIP-Wachstum in allen Mitgliedstaaten?
    </div>
    <div class="uk-krit-opt" data-msidx="2" data-correct="false" onclick="selKrit(this)">
      <span class="uk-krit-num">C</span>Schafft der Binnenmarkt per Saldo mehr Arbeitsplätze als er verdrängt?
    </div>
  </div>
</div>
```

```css
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
.uk-krit-opt.correct  { border-color: var(--rf-acc); background: rgba(220,38,38,.12); }
.uk-krit-opt.wrong    { border-color: #fca5a5; background: #fef2f2; opacity: .6; }
.uk-krit-num {
  font-family: var(--ff-mono);
  font-size: .62rem;
  font-weight: 600;
  color: var(--rf-acc);
  min-width: 1.2rem;
  padding-top: .05rem;
  flex-shrink: 0;
}
```

### 5.4 Kriterium Recheck — Compact Chips

Used before AB II steps and before AB III step. Shows the same 3 options as chips. The previously selected chip is shown as active (pre-selected). Student must confirm before the next section unlocks.

```css
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
```

### 5.5 Step Coloring by AB Level

Each step's tag (`uk-ab-tag`) now carries both the AB level and the step name. Background color determined by AB level:

| Step | Tag content | Color token |
|------|------------|-------------|
| Theoretischer Kontext | `AB I — Theoretischer Kontext` | `--ab1-acc` |
| Material & Fall | `AB I — Material & Fall` | `--ab1-acc` |
| Verbindung & Konflikte | `AB II — Verbindung & Konflikte` | `--ab2-acc` |
| Abwägung | `AB II — Abwägung` | `--ab2-acc` |
| Begründetes Urteil | `AB III — Begründetes Urteil` | `--ab3-acc` |

Step background and border color match the AB level token:

```css
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

Each step div gets `data-ab="1|2|3"` attribute in the HTML.

### 5.6 Step Structure — Sub-Questions Reference Leitfrage

Each step's question (`uk-step-q`) must explicitly reference the Leitfrage. Updated questions for unit 3.5:

| Step | Question |
|------|----------|
| AB I — Theoretischer Kontext | Welche theoretische Grundlage hilft, die Leitfrage einzuordnen? |
| AB I — Material & Fall | Welche Aussage gibt die Fallbeispiele sachlich wieder, die für die Leitfrage relevant sind? |
| AB II — Verbindung & Konflikte | Wo geraten Theorie und Fallbeispiele in Konflikt, gemessen am Kriterium der Leitfrage? |
| AB II — Abwägung | Welche Perspektive überwiegt bei der Beantwortung der Leitfrage? |
| AB III — Begründetes Urteil | Welches Urteil beantwortet die Leitfrage überzeugend und verweist auf das Kriterium? |

### 5.7 Block Layout (Full Structure)

```
uk-body
  ├── uk-leitfrage                    ← dark banner, red bottom border
  ├── uk-krit-block                   ← Kriterium, full cards, red theme
  ├── uk-section [Einleitung]
  │     ├── uk-step[data-ab="1"]      AB I — Theoretischer Kontext
  │     └── uk-step[data-ab="1"]      AB I — Material & Fall
  ├── uk-krit-recheck                 ← chips, introduces AB II
  ├── uk-section [Hauptteil]
  │     ├── uk-step[data-ab="2"]      AB II — Verbindung & Konflikte
  │     └── uk-step[data-ab="2"]      AB II — Abwägung
  ├── uk-krit-recheck                 ← chips, introduces AB III
  └── uk-section [Schlussfolgerung]
        └── uk-step[data-ab="3"]      AB III — Begründetes Urteil
```

The `.uk-section-lbl` (Einleitung / Hauptteil / Schlussfolgerung) labels remain.

### 5.8 JS Changes (`uk-quiz.js`)

**`_kritIdx` scope:**
`_kritIdx` is a **closure variable declared inside `_initBlock()`**, not a module-level variable. `_initBlock` is called once per UK block and closes over the block's DOM node. `_checkAllSelected` accesses `_kritIdx` via this closure. Do not hoist it to module scope.

**`selKrit` exposure:**
`selKrit` is called via inline `onclick="selKrit(this)"` in the HTML. It must therefore be assigned to `window`: `window.selKrit = function(el) { ... }` inside `uk-quiz.js`. The closure over `_kritIdx` is achieved by assigning `selKrit` inside `_initBlock`, not as a top-level function.

**Kriterium selection:**
- Remove `<select>` / `_getKriteriumValue()` logic
- Replace with `window.selKrit = function(el)` click handler: single-select (removes `selected` from siblings), sets `selected` on clicked element, stores clicked element's `data-msidx` in closure variable `_kritIdx`; then calls `selKrit`-internal helper to pre-select matching chips in all `.uk-krit-recheck` blocks
- `_checkAllSelected(block)` must include: `_kritIdx !== null` + all step options selected + each `.uk-krit-recheck` block has at least one `.uk-krit-chip.selected` (regardless of which chip — mismatch validation is deferred to `chkUK`)

**Kriterium recheck chips — timing:**
- Recheck chips are **static HTML** (always present in the DOM)
- They are **pre-selected at the moment the student clicks a Kriterium card** (`selKrit`), not on page init
- `selKrit` reads `_kritIdx` (the just-stored value) and adds `selected` class to the chip with matching `data-msidx` in each `.uk-krit-recheck` block
- On chip click: if the student selects a chip whose `data-msidx` ≠ current `_kritIdx` → update `_kritIdx` and flag `ROTER FADEN VERLOREN` error
- Validation in `chkUK`: if any recheck chip's selected `data-msidx` ≠ original correct `data-msidx` → typed error

**Removed:**
- The old `<select class="uk-kriterium-sel">` element and all associated CSS/JS

---

## 6. What Does Not Change

- Einstieg chip-check (keep as-is for student testing)
- QG question content and types
- SW block content
- `.auf` exercise cards
- Gate logic chain (QG1 → QG2 → QG3 → Arbeitsblatt)
- `uk-quiz.js` error taxonomy (level/step/chain/vague/sided/factual/verdict)
- Gruppenarbeit case study content

---

## 7. Files Touched

| File | Changes |
|------|---------|
| `css/style.css` | Ranking item sizing; Prüfungsrelevanz ribbon + always-on rules; methodology color tokens; Leitfrage banner; Kriterium block + recheck CSS; step AB-level coloring |
| `js/tooltips.js` | Delete `_initPriorityToggle()` |
| `js/uk-quiz.js` | Kriterium select → card + chip logic; recheck chip handler; `_checkAllSelected` update |
| `einheiten/3-5_binnenmarkt.html` | Delete toggle button; qg-wrapper locked fix; Arbeitszeit tags; UK block HTML restructure (Leitfrage, Kriterium block, recheck blocks, step data-ab attrs, AB tag text, step questions) |
