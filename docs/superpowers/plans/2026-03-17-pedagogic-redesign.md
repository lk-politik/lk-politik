# Pedagogical Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the redesigned block type vocabulary, UK scaffold, operator badge tooltips, Fachbegriff popovers, knowledge priority system, and new pages (fachbegriffe.html, AB-Training), then apply all conventions to unit 3.5 as reference implementation.

**Architecture:** New CSS classes and a new `js/tooltips.js` are layered onto the existing engine without breaking current functionality. New block types (`.ab2` for AB II tasks, `.uk` for Urteilskompetenz) hook into the existing QG unlock chain via `data-gate` attributes — a purely additive change to `engine.js`. Data is served from three new JSON files under `/data/`.

**Tech Stack:** Vanilla HTML5/CSS3/JS, localStorage, no build tool, GitHub Pages static hosting. Local development requires a static server for JSON fetch (`npx serve .` from project root).

---

> ⚠️ **Naming collision:** `css/style.css` section 17 already uses `.auf` for Arbeitsblatt worksheet task containers (`.auf`, `.auf-h`, `.auf-n`, `.auf-body`). The spec calls the AB II inline task block `.auf` — this plan uses **`.ab2`** instead. All spec references to "AB II task block class" → `.ab2`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `css/style.css` | Modify — append sections 38–42 | New block type styles: `.ab2`, `.uk` (3 variants), `.op-badge`/`.op-tooltip`, priority system |
| `js/tooltips.js` | Create | Operator badge tooltips, Fachbegriff popovers, priority toggle — all new interactive JS |
| `js/engine.js` | Modify — `unlk()` + `_restoreState()` | Unlock `.ab2` and `.uk` blocks via `data-gate` attribute |
| `data/operators.json` | Create | 34 operators: name, AB level, description, du-form sentence starter |
| `data/glossary.json` | Create | Fachbegriffe: term, definition, units array, chapter, AB level |
| `data/units.json` | Create | Unit metadata: id, title, chapter, format, lehrplan ref, accent color |
| `fachbegriffe.html` | Create | Standalone Fachbegriffe reference page — fetches glossary.json |
| `index.html` | Modify | Add AB-Training section with anchors `#ab-training-i/ii/iii` |
| `einheiten/3-5_binnenmarkt.html` | Modify | Reference implementation: data-p on sw, fb on terms, ab2 task, uk block, tooltips.js loaded |
| `tests/visual.html` | Create (dev only, not committed) | Visual test fixture showing all new block types |

---

## Chunk 1: CSS Foundation + Data Files

### Task 1: Visual test fixture

**Files:**
- Create: `tests/visual.html`

- [ ] **Step 1: Create the tests directory and visual.html**

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Visual Test — New Block Types</title>
<link rel="stylesheet" href="../css/style.css">
<style>:root{--acc:#b45309;--accG:rgba(180,83,9,.08)}</style>
</head>
<body style="padding:2rem;background:var(--bg)">

<h2 style="font-family:var(--ff-head);margin-bottom:1rem">AB2 Block</h2>
<div class="ab2" id="ab2-test">
  <div class="ab2-head">
    <span class="op-badge" data-op="analysieren">analysieren · AB II</span>
    Aufgabe 1
  </div>
  <div class="ab2-body">
    <p>Analysiere das Schaubild im Kontext des Binnenmarkts.</p>
  </div>
</div>

<h2 style="font-family:var(--ff-head);margin:2rem 0 1rem">UK Block — pairs variant</h2>
<div class="uk" id="uk-test" data-uk="pairs">
  <div class="uk-head">
    <span class="op-badge" data-op="beurteilen">beurteilen · AB III</span>
    Urteilskompetenz
  </div>
  <div class="uk-body">
    <div class="uk-step"><span class="uk-step-label">1. Kontext</span><p>Was sagt die Theorie?</p></div>
    <div class="uk-step"><span class="uk-step-label">2. Fall</span><p>Was zeigt das Material?</p></div>
    <div class="uk-step"><span class="uk-step-label">3. Verbindung</span><p>Wo liegt der Konflikt?</p></div>
    <div class="uk-step uk-abwaegung">
      <span class="uk-step-label">4. Abwägung</span>
      <div class="uk-pairs">
        <div class="uk-pair"><span class="uk-pair-label">Argument</span><p>Der Binnenmarkt fördert Wachstum…</p></div>
        <div class="uk-pair uk-pair-contra"><span class="uk-pair-label">Gegenargument</span><p>Jedoch führt er zu Sozialdumping…</p></div>
      </div>
    </div>
    <div class="uk-step uk-urteil"><span class="uk-step-label">5. Mein Urteil</span><p>Dein begründetes Urteil…</p></div>
  </div>
</div>

<h2 style="font-family:var(--ff-head);margin:2rem 0 1rem">Priority System</h2>
<button id="prio-toggle" style="margin-bottom:1rem">Prüfungsrelevanz anzeigen</button>
<div class="sw" data-p="core"><div class="sw-head"><span class="sw-label">📘 SACHWISSEN</span><span class="sw-title">Core Block</span></div><div class="sw-body"><p>Dieser Block ist prüfungsrelevant.</p></div></div>
<div class="sw" data-p="imp" style="margin-top:.75rem"><div class="sw-head"><span class="sw-label">📘 SACHWISSEN</span><span class="sw-title">Important Block</span></div><div class="sw-body"><p>Normaler Block.</p></div></div>
<div class="sw" data-p="ctx" style="margin-top:.75rem"><div class="sw-head"><span class="sw-label">📘 SACHWISSEN</span><span class="sw-title">Context Block</span></div><div class="sw-body"><p>Nur illustrativ.</p></div></div>

<script>
document.getElementById('prio-toggle').addEventListener('click', function() {
  document.body.classList.toggle('prio-active');
});
</script>
</body>
</html>
```

- [ ] **Step 2: Open `tests/visual.html` in browser (via `npx serve .` from project root, then navigate to `/tests/visual.html`)**

Expected: Page loads with CSS; new classes `.ab2`, `.uk`, `.op-badge` show unstyled (no CSS yet for them). Verify no errors in browser console.

---

### Task 2: AB2 block CSS

**Files:**
- Modify: `css/style.css` — append after line 1682

- [ ] **Step 1: Open css/style.css and append section 38**

```css
/* =====================================================
   38. AB II Task Block (.ab2)
   Inline analysis task — escalating visual weight
   part of the arc, between SW blocks
   ===================================================== */

.ab2 {
  background: var(--card);
  border: 1px solid var(--border-l);
  border-left: 4px solid var(--acc);
  border-radius: var(--r);
  overflow: hidden;
  margin-bottom: var(--gap);
}

.ab2-head {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .6rem 1rem;
  background: var(--accG);
  font-family: var(--ff-mono);
  font-size: .72rem;
  font-weight: 600;
  color: var(--acc);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.ab2-body {
  padding: .9rem 1.1rem;
  font-size: .9rem;
  line-height: 1.65;
  color: var(--ink2);
}

.ab2-body p { margin-bottom: .5rem; }
.ab2-body p:last-child { margin-bottom: 0; }
```

- [ ] **Step 2: Reload `tests/visual.html` and verify**

Expected: `.ab2` block shows as a white card with amber left border (4px), amber ghost background on header, mono uppercase label. Looks like a natural extension of the `.sw` style but slightly heavier.

---

### Task 3: UK block base CSS

**Files:**
- Modify: `css/style.css` — append after section 38

- [ ] **Step 1: Append section 39**

```css
/* =====================================================
   39. Urteilskompetenz Block (.uk)
   AB III scaffold — visually breaks the arc pattern
   Amber full border, inverted header
   ===================================================== */

.uk {
  background: var(--card);
  border: 2px solid var(--acc);
  border-radius: var(--r);
  overflow: hidden;
  margin-bottom: var(--gap);
}

.uk-head {
  display: flex;
  align-items: center;
  gap: .65rem;
  padding: .75rem 1.1rem;
  background: var(--acc);
  color: #fff;
  font-family: var(--ff-mono);
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}

/* Operator badge inside uk-head inherits white text */
.uk-head .op-badge {
  background: rgba(255,255,255,.2);
  color: #fff;
  border-color: rgba(255,255,255,.3);
}

.uk-body {
  padding: .25rem 0;
}

/* Steps */
.uk-step {
  padding: .75rem 1.1rem;
  border-bottom: 1px solid var(--border-l);
  font-size: .9rem;
  line-height: 1.65;
}

.uk-step:last-child { border-bottom: none; }

.uk-step-label {
  display: block;
  font-family: var(--ff-mono);
  font-size: .68rem;
  font-weight: 700;
  color: var(--acc);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: .35rem;
}

.uk-step p { color: var(--ink2); margin-bottom: .4rem; }
.uk-step p:last-child { margin-bottom: 0; }

/* Urteil step — slightly heavier treatment */
.uk-urteil {
  background: var(--accG);
}

.uk-urteil .uk-step-label { font-size: .72rem; }

/* ── Step 4 variant: pairs ──────────────────────── */
.uk[data-uk="pairs"] .uk-pairs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
  margin-top: .35rem;
}

@media (max-width: 600px) {
  .uk[data-uk="pairs"] .uk-pairs { grid-template-columns: 1fr; }
}

.uk-pair {
  background: rgba(45,122,79,.07);
  border-left: 3px solid var(--ok);
  border-radius: var(--r-sm);
  padding: .6rem .8rem;
}

.uk-pair-contra {
  background: rgba(184,50,50,.06);
  border-left-color: var(--err);
}

.uk-pair-label {
  display: block;
  font-family: var(--ff-mono);
  font-size: .63rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  margin-bottom: .25rem;
}

.uk-pair .uk-pair-label { color: var(--ok); }
.uk-pair-contra .uk-pair-label { color: var(--err); }

/* ── Step 4 variant: perspektiven ──────────────── */
.uk[data-uk="perspektiven"] .uk-perspektiven {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .6rem;
  margin-top: .35rem;
}

@media (max-width: 600px) {
  .uk[data-uk="perspektiven"] .uk-perspektiven { grid-template-columns: 1fr; }
}

.uk-perspektiv {
  background: var(--input-bg);
  border: 1px solid var(--border-l);
  border-radius: var(--r-sm);
  padding: .6rem .8rem;
}

.uk-perspektiv-label {
  display: block;
  font-family: var(--ff-mono);
  font-size: .63rem;
  font-weight: 700;
  color: var(--acc);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: .25rem;
}

/* ── Step 4 variant: matrix ────────────────────── */
.uk[data-uk="matrix"] .uk-matrix {
  width: 100%;
  border-collapse: collapse;
  margin-top: .35rem;
  font-size: .85rem;
}

.uk-matrix th, .uk-matrix td {
  padding: .45rem .7rem;
  border: 1px solid var(--border);
  text-align: left;
}

.uk-matrix thead tr { background: var(--input-bg); }
.uk-matrix th:first-child { min-width: 100px; }
.uk-matrix .uk-matrix-pro { background: rgba(45,122,79,.05); }
.uk-matrix .uk-matrix-con { background: rgba(184,50,50,.04); }
.uk-matrix th.pro { color: var(--ok); }
.uk-matrix th.con { color: var(--err); }
```

- [ ] **Step 2: Add the perspektiven and matrix variants to tests/visual.html**

Append before `</body>`:
```html
<h2 style="font-family:var(--ff-head);margin:2rem 0 1rem">UK Block — perspektiven variant</h2>
<div class="uk" data-uk="perspektiven">
  <div class="uk-head">⚖️ Urteilskompetenz</div>
  <div class="uk-body">
    <div class="uk-step"><span class="uk-step-label">1. Kontext</span><p>Was sagt die Theorie?</p></div>
    <div class="uk-step"><span class="uk-step-label">2. Fall</span><p>Was zeigt das Material?</p></div>
    <div class="uk-step"><span class="uk-step-label">3. Verbindung</span><p>Wo liegt der Konflikt?</p></div>
    <div class="uk-step uk-abwaegung">
      <span class="uk-step-label">4. Abwägung</span>
      <div class="uk-perspektiven">
        <div class="uk-perspektiv"><span class="uk-perspektiv-label">🇫🇷 Frankreich</span><p>Der Binnenmarkt nützt uns…</p></div>
        <div class="uk-perspektiv"><span class="uk-perspektiv-label">🇵🇱 Polen</span><p>Für uns bedeutet das…</p></div>
        <div class="uk-perspektiv"><span class="uk-perspektiv-label">👷 Arbeitnehmer</span><p>Ich sehe das kritisch…</p></div>
        <div class="uk-perspektiv"><span class="uk-perspektiv-label">Deine Position</span><p>Nach Abwägung…</p></div>
      </div>
    </div>
    <div class="uk-step uk-urteil"><span class="uk-step-label">5. Mein Urteil</span><p>Urteil…</p></div>
  </div>
</div>

<h2 style="font-family:var(--ff-head);margin:2rem 0 1rem">UK Block — matrix variant</h2>
<div class="uk" data-uk="matrix">
  <div class="uk-head">⚖️ Urteilskompetenz</div>
  <div class="uk-body">
    <div class="uk-step"><span class="uk-step-label">1. Kontext</span><p>Was sagt die Theorie?</p></div>
    <div class="uk-step"><span class="uk-step-label">2. Fall</span><p>Was zeigt das Material?</p></div>
    <div class="uk-step"><span class="uk-step-label">3. Verbindung</span><p>Wo liegt der Konflikt?</p></div>
    <div class="uk-step uk-abwaegung">
      <span class="uk-step-label">4. Abwägung</span>
      <table class="uk-matrix">
        <thead><tr><th></th><th class="pro">Vorteile</th><th class="con">Risiken</th></tr></thead>
        <tbody>
          <tr><td>Wirtschaft</td><td class="uk-matrix-pro">…</td><td class="uk-matrix-con">…</td></tr>
          <tr><td>Gesellschaft</td><td class="uk-matrix-pro">…</td><td class="uk-matrix-con">…</td></tr>
        </tbody>
      </table>
    </div>
    <div class="uk-step uk-urteil"><span class="uk-step-label">5. Mein Urteil</span><p>Urteil…</p></div>
  </div>
</div>
```

- [ ] **Step 3: Reload visual test, verify all three UK variants render correctly**

Expected:
- `pairs` — two-column green/red cards
- `perspektiven` — two-column neutral cards
- `matrix` — full-width table with green/red column headers

---

### Task 4: Operator badge CSS

**Files:**
- Modify: `css/style.css` — append section 40

- [ ] **Step 1: Append section 40**

```css
/* =====================================================
   40. Operator Badge + Tooltip (.op-badge, .op-tooltip)
   Tappable badge on AB II/III tasks — shows operator
   description and sentence starter on click
   ===================================================== */

.op-badge {
  display: inline-flex;
  align-items: center;
  gap: .3em;
  padding: .18em .55em;
  background: var(--accG);
  color: var(--acc);
  border: 1px solid rgba(180,83,9,.25);
  border-radius: 4px;
  font-family: var(--ff-mono);
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .06em;
  cursor: pointer;
  user-select: none;
  transition: background .15s;
  text-transform: lowercase;
}

.op-badge:hover { background: rgba(180,83,9,.14); }
.op-badge::after { content: ' ▾'; font-size: .65rem; }

/* Tooltip container — positioned by JS */
.op-tooltip {
  position: fixed;
  z-index: 900;
  background: var(--card);
  border: 1px solid var(--border);
  border-top: 3px solid var(--acc);
  border-radius: var(--r);
  padding: .85rem 1rem;
  max-width: 280px;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  font-size: .82rem;
  line-height: 1.55;
  color: var(--ink2);
}

.op-tooltip-op {
  font-family: var(--ff-mono);
  font-size: .72rem;
  font-weight: 700;
  color: var(--acc);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: .4rem;
}

.op-tooltip-desc { margin-bottom: .55rem; }

.op-tooltip-starter {
  background: var(--input-bg);
  border-left: 3px solid var(--acc);
  padding: .4rem .65rem;
  font-style: italic;
  font-size: .8rem;
  color: var(--ink);
  border-radius: 0 4px 4px 0;
  margin-bottom: .55rem;
}

.op-tooltip-link {
  display: block;
  font-family: var(--ff-mono);
  font-size: .68rem;
  color: var(--sw);
  text-decoration: none;
  margin-top: .35rem;
}

.op-tooltip-link:hover { text-decoration: underline; }
```

- [ ] **Step 2: Reload visual test**

Expected: `.op-badge` elements render as compact amber mono badges with a small `▾` indicator. No tooltip yet (JS not written).

---

### Task 5: Priority system CSS

**Files:**
- Modify: `css/style.css` — append section 41

- [ ] **Step 1: Append section 41**

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

- [ ] **Step 2: Update tests/visual.html — replace the manual button with proper class**

Change the priority toggle button:
```html
<button class="prio-toggle-btn" id="prio-toggle">◇ Prüfungsrelevanz anzeigen</button>
```

- [ ] **Step 3: Reload visual test and click the toggle**

Expected: On toggle click, `body` gets `.prio-active`. Core block shows `◆` before header. Context block dims. Important block unchanged.

---

### Task 6: Fachbegriff inline CSS

**Files:**
- Modify: `css/style.css` — append section 42

- [ ] **Step 1: Append section 42**

```css
/* =====================================================
   42. Fachbegriff Inline Tooltip (.fb, .fb-tooltip)
   Amber-underlined terms in SW blocks
   Tap/hover → compact popover with definition
   ===================================================== */

.fb {
  color: var(--acc);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
  cursor: pointer;
}

.fb-tooltip {
  position: fixed;
  z-index: 901;
  background: var(--card);
  border: 1px solid var(--border);
  border-top: 3px solid var(--sw);
  border-radius: var(--r);
  padding: .75rem .9rem;
  max-width: 260px;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  font-size: .82rem;
  line-height: 1.55;
  color: var(--ink2);
}

.fb-tooltip-term {
  font-family: var(--ff-mono);
  font-size: .7rem;
  font-weight: 700;
  color: var(--sw);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: .35rem;
}

.fb-tooltip-def { margin-bottom: .4rem; }

.fb-tooltip-units {
  font-family: var(--ff-mono);
  font-size: .65rem;
  color: var(--ink3);
}
```

- [ ] **Step 2: Commit CSS foundation**

```bash
git add css/style.css tests/visual.html
git commit -m "feat: add new block type CSS — ab2, uk (3 variants), op-badge, priority system, fb tooltip"
```

---

### Task 7: Data files — operators.json

**Files:**
- Create: `data/operators.json`

- [ ] **Step 1: Create `data/` directory and `operators.json`**

```json
[
  {
    "name": "nennen",
    "ab": 1,
    "description": "Sachverhalte, Begriffe oder Beispiele ohne Erklärung aufzählen.",
    "starter": "Nenne zunächst …: erstens …, zweitens …, drittens …"
  },
  {
    "name": "beschreiben",
    "ab": 1,
    "description": "Sachverhalte, Strukturen oder Vorgänge in eigenen Worten sachlich darstellen.",
    "starter": "Beschreibe, indem du zunächst … und anschließend … darstellst."
  },
  {
    "name": "darstellen",
    "ab": 1,
    "description": "Einen Sachverhalt strukturiert und geordnet wiedergeben.",
    "starter": "Stelle dar, wie … aufgebaut ist: Zunächst …, dann …, schließlich …"
  },
  {
    "name": "erklären",
    "ab": 1,
    "description": "Ursachen, Zusammenhänge oder Funktionsweisen verständlich machen.",
    "starter": "Erkläre, warum … gilt: … führt dazu, dass …, weil …"
  },
  {
    "name": "wiedergeben",
    "ab": 1,
    "description": "Inhalte eines Textes oder Materials mit eigenen Worten zusammenfassen.",
    "starter": "Gib den Inhalt wieder: Der Text/Das Material zeigt, dass …"
  },
  {
    "name": "charakterisieren",
    "ab": 1,
    "description": "Wesentliche Merkmale eines Sachverhalts oder einer Position hervorheben.",
    "starter": "Charakterisiere … durch seine wesentlichen Merkmale: …"
  },
  {
    "name": "zusammenfassen",
    "ab": 1,
    "description": "Die Kernaussagen eines Textes oder Vorgangs kompakt wiedergeben.",
    "starter": "Zusammenfassend lässt sich sagen: …"
  },
  {
    "name": "definieren",
    "ab": 1,
    "description": "Einen Begriff präzise und vollständig bestimmen.",
    "starter": "Unter … versteht man …, das sich von … unterscheidet durch …"
  },
  {
    "name": "skizzieren",
    "ab": 1,
    "description": "Einen Überblick über die wesentlichen Aspekte geben, ohne Details.",
    "starter": "Skizziere die wichtigsten Aspekte: Erstens …, zweitens …"
  },
  {
    "name": "erläutern",
    "ab": 2,
    "description": "Einen Sachverhalt detailliert und nachvollziehbar im Kontext des Materials erklären — Theorie und Beispiel verbinden.",
    "starter": "Erläutere, indem du zunächst den Begriff … darstellst und ihn anschließend am Beispiel … konkretisierst."
  },
  {
    "name": "analysieren",
    "ab": 2,
    "description": "Ein Material oder eine Position systematisch auf seine Bestandteile, Ursachen und Wirkungen untersuchen.",
    "starter": "Analysiere das Material, indem du zunächst … identifizierst und dann den Zusammenhang mit … herausarbeitest."
  },
  {
    "name": "begründen",
    "ab": 2,
    "description": "Eine Aussage mit sachlichen Argumenten und Belegen stützen.",
    "starter": "Begründe deine Aussage mit Bezug auf …: Weil …, folgt daraus, dass …"
  },
  {
    "name": "belegen",
    "ab": 2,
    "description": "Eine These durch konkrete Beispiele oder Textstellen nachweisen.",
    "starter": "Belege die These durch folgendes Beispiel aus dem Material: …"
  },
  {
    "name": "einordnen",
    "ab": 2,
    "description": "Einen Sachverhalt in einen größeren Zusammenhang (historisch, theoretisch, politisch) stellen.",
    "starter": "Ordne … in den Kontext von … ein: … steht im Zusammenhang mit …, weil …"
  },
  {
    "name": "untersuchen",
    "ab": 2,
    "description": "Einen Sachverhalt gezielt auf bestimmte Aspekte hin prüfen und herausarbeiten.",
    "starter": "Untersuche … im Hinblick auf …: Zunächst zeigt sich, dass …, was darauf hindeutet, dass …"
  },
  {
    "name": "vergleichen",
    "ab": 2,
    "description": "Gemeinsamkeiten und Unterschiede zwischen zwei oder mehr Sachverhalten herausarbeiten.",
    "starter": "Vergleiche … und …: Beide haben gemeinsam, dass …, unterscheiden sich jedoch darin, dass …"
  },
  {
    "name": "auswerten",
    "ab": 2,
    "description": "Informationen aus Materialien (Grafiken, Texte, Daten) gezielt herausarbeiten und interpretieren.",
    "starter": "Werte das Material aus: Das Material zeigt …, was bedeutet, dass …"
  },
  {
    "name": "herausarbeiten",
    "ab": 2,
    "description": "Wesentliche Aspekte, Positionen oder Strukturen aus einem Material explizit benennen.",
    "starter": "Arbeite heraus, welche … im Material erkennbar sind: … deutet darauf hin, dass …"
  },
  {
    "name": "anwenden",
    "ab": 2,
    "description": "Theoretisches Wissen auf einen konkreten Fall oder ein Material übertragen.",
    "starter": "Wende … auf den vorliegenden Fall an: Das Konzept … bedeutet hier konkret, dass …"
  },
  {
    "name": "nachweisen",
    "ab": 2,
    "description": "Mithilfe von Belegen aus dem Material eine Aussage als zutreffend bestätigen.",
    "starter": "Weise nach, dass …: Das Material zeigt auf Zeile/Abschnitt … deutlich, dass …"
  },
  {
    "name": "überprüfen",
    "ab": 2,
    "description": "Eine Aussage oder These anhand von Kriterien und Material auf ihre Richtigkeit prüfen.",
    "starter": "Überprüfe die These … anhand des Materials: Die These trifft zu/nicht zu, weil …"
  },
  {
    "name": "beurteilen",
    "ab": 3,
    "description": "Auf Basis von Sachwissen und Materialanalyse zu einem sachlich begründeten Urteil kommen — ohne persönliche Wertung.",
    "starter": "Beurteile, indem du zunächst den theoretischen Kontext (AB I) nennst, den Fall analysierst (AB II) und dann urteilst: Insgesamt ist … zu beurteilen als …, weil …"
  },
  {
    "name": "bewerten",
    "ab": 3,
    "description": "Einen Sachverhalt vor dem Hintergrund eigener oder gesellschaftlicher Werte einschätzen und begründen.",
    "starter": "Bewerte … aus der Perspektive von …: Positiv ist …, kritisch zu sehen ist …, insgesamt überwiegt …"
  },
  {
    "name": "erörtern",
    "ab": 3,
    "description": "Argumente für und gegen eine These systematisch abwägen und zu einem begründeten Ergebnis kommen.",
    "starter": "Erörtere, indem du zunächst Argumente für … darstellst (weil …), dann Gegenargumente nennst (jedoch …) und abschließend urteilst: …"
  },
  {
    "name": "diskutieren",
    "ab": 3,
    "description": "Verschiedene Positionen zu einer Frage darstellen, gegeneinander abwägen und eine eigene Einschätzung entwickeln.",
    "starter": "Diskutiere die Frage, indem du verschiedene Perspektiven darstellst: Einerseits …, andererseits …, letztendlich …"
  },
  {
    "name": "stellung nehmen",
    "ab": 3,
    "description": "Eine klare, begründete Position zu einem Sachverhalt oder einer These einnehmen.",
    "starter": "Nimm Stellung: Ich vertrete die Position, dass …, weil … Das Gegenargument … entkräfte ich damit, dass …"
  },
  {
    "name": "prüfen",
    "ab": 3,
    "description": "Einen Sachverhalt, eine These oder eine Entscheidung anhand von Kriterien kritisch hinterfragen.",
    "starter": "Prüfe, ob … den Kriterien von … entspricht: Einerseits erfüllt … das Kriterium … (weil …), andererseits verletzt … das Kriterium … (weil …)"
  },
  {
    "name": "entwickeln",
    "ab": 3,
    "description": "Ausgehend von einer Analyse eine neue Lösung, ein Konzept oder eine Position konstruktiv ausarbeiten.",
    "starter": "Entwickle einen Vorschlag, indem du zunächst das Problem benennst (…), dann Kriterien aufstellst (…) und schließlich eine begründete Lösung formulierst (…)."
  },
  {
    "name": "entwerfen",
    "ab": 3,
    "description": "Eine konkrete Lösung, ein Konzept oder ein Szenario strukturiert und begründet skizzieren.",
    "starter": "Entwerfe …, indem du ausgehend von … folgende Lösung vorschlägst: …"
  },
  {
    "name": "gestalten",
    "ab": 3,
    "description": "Ein Produkt, einen Text oder eine Darstellung zielgerichtet und begründet anfertigen.",
    "starter": "Gestalte …, indem du … berücksichtigst und die Entscheidung begründest: …"
  },
  {
    "name": "abwägen",
    "ab": 3,
    "description": "Vor- und Nachteile oder konkurrierende Positionen systematisch gegeneinander aufwiegen.",
    "starter": "Wäge ab: Für … spricht …, dagegen spricht …. Unter Berücksichtigung von … überwiegt …"
  },
  {
    "name": "urteilen",
    "ab": 3,
    "description": "Zu einem sachlich fundierten, argumentativ begründeten Urteil kommen — der Kern der Urteilskompetenz.",
    "starter": "Urteile auf Basis von AB I und AB II: Mein Urteil lautet …, weil … Das Gegenargument … berücksichtige ich, komme aber dennoch zu dem Schluss, dass …"
  },
  {
    "name": "vorschlagen",
    "ab": 3,
    "description": "Eine konkrete Maßnahme, Alternative oder Verbesserung begründet empfehlen.",
    "starter": "Schlage vor: Um … zu verbessern, wäre … sinnvoll, weil … Dies würde … bewirken."
  }
]
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "const d=require('./data/operators.json'); console.log('operators:', d.length, '| AB I:', d.filter(o=>o.ab===1).length, '| AB II:', d.filter(o=>o.ab===2).length, '| AB III:', d.filter(o=>o.ab===3).length)"
```

Expected output: `operators: 33 | AB I: 9 | AB II: 12 | AB III: 12`

> ⚠️ The spec says 34 operators (AB I: 9, AB II: 12, AB III: 13). The current JSON has 33 — one AB III operator is missing. Cross-check with the teacher's official operator sheet, add the missing entry, then update the expected output above. The JSON structure is final; only content needs adjustment.

- [ ] **Step 3: Commit**

```bash
git add data/operators.json
git commit -m "feat: add operators.json with 33 operators across AB I/II/III"
```

---

### Task 8: Data files — glossary.json

**Files:**
- Create: `data/glossary.json`

- [ ] **Step 1: Create `data/glossary.json` with unit 3.5 Fachbegriffe**

```json
[
  {
    "term": "Binnenmarkt",
    "def": "Ein gemeinsamer Wirtschaftsraum, in dem Waren, Personen, Dienstleistungen und Kapital frei zirkulieren können — die vier Grundfreiheiten. Der EU-Binnenmarkt besteht seit dem 1. Januar 1993.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 1
  },
  {
    "term": "Vier Grundfreiheiten",
    "def": "Die vier Kernfreiheiten des EU-Binnenmarkts: freier Warenverkehr, freier Personenverkehr, freier Dienstleistungsverkehr und freier Kapitalverkehr.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 1
  },
  {
    "term": "Sozialdumping",
    "def": "Das Phänomen, dass Unternehmen oder Arbeitnehmer aus Ländern mit niedrigen Lohn- und Sozialstandards in Ländern mit höheren Standards zu geringeren Kosten anbieten, was dort Löhne und Arbeitsbedingungen unter Druck setzt.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 2
  },
  {
    "term": "Brain Drain",
    "def": "Die Abwanderung gut ausgebildeter Fachkräfte aus wirtschaftlich schwächeren Regionen in stärkere, was die Herkunftsregion weiter schwächt.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 2
  },
  {
    "term": "Steuerwettbewerb",
    "def": "Der Wettbewerb zwischen Staaten um Unternehmensansiedlungen durch niedrige Steuersätze, was Steuereinnahmen anderer Staaten untergräbt.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 2
  },
  {
    "term": "Cassis-de-Dijon-Prinzip",
    "def": "Grundsatz des EuGH (1979): Ein in einem EU-Mitgliedstaat rechtmäßig hergestelltes und vertriebenes Produkt darf in allen anderen Mitgliedstaaten verkauft werden. Basis des gegenseitigen Anerkennungsprinzips.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 2
  },
  {
    "term": "LuxLeaks",
    "def": "Enthüllungsskandal (2014): Luxemburg hatte geheime Steuerdeals mit über 300 Unternehmen geschlossen, die effektive Steuersätze unter 1 % ermöglichten — ein Beispiel für schädlichen Steuerwettbewerb innerhalb der EU.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 2
  },
  {
    "term": "Entsenderichtlinie",
    "def": "EU-Richtlinie, die Mindestarbeitsbedingungen (u.a. Mindestlohn des Gastlandes) für Arbeitnehmer festlegt, die vorübergehend in einen anderen EU-Staat entsandt werden.",
    "units": ["3-5"],
    "chapter": 3,
    "ab": 2
  }
]
```

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "const d=require('./data/glossary.json'); console.log('terms:', d.length)"
```

Expected: `terms: 8`

- [ ] **Step 3: Commit**

```bash
git add data/glossary.json
git commit -m "feat: add glossary.json with unit 3.5 Fachbegriffe"
```

---

### Task 9: Data files — units.json

**Files:**
- Create: `data/units.json`

- [ ] **Step 1: Create `data/units.json`**

```json
[
  {
    "id": "3-2",
    "num": "3.2",
    "title": "Die EU nach dem Vertrag von Lissabon",
    "chapter": 3,
    "format": "arc",
    "lehrplan": "SK 3.2 / UK 3.2",
    "accent": "#2d5986",
    "status": "pending"
  },
  {
    "id": "3-3",
    "num": "3.3",
    "title": "Organe und Institutionen der EU",
    "chapter": 3,
    "format": "arc",
    "lehrplan": "SK 3.3 / UK 3.3",
    "accent": "#2d5986",
    "status": "pending"
  },
  {
    "id": "3-4",
    "num": "3.4",
    "title": "Demokratiedefizit der EU",
    "chapter": 3,
    "format": "debate",
    "lehrplan": "SK 3.4 / UK 3.4",
    "accent": "#2d5986",
    "status": "pending"
  },
  {
    "id": "3-5",
    "num": "3.5",
    "title": "Der Europäische Binnenmarkt",
    "chapter": 3,
    "format": "arc",
    "lehrplan": "SK 3.5 / UK 3.5",
    "accent": "#b45309",
    "status": "active"
  }
]
```

> Fill in remaining units as they are built. Format values: `arc`, `case-dive`, `comparison`, `debate`, `timeline`, `data-reading`.

- [ ] **Step 2: Verify + commit**

```bash
node -e "const d=require('./data/units.json'); console.log('units:', d.length, '| active:', d.filter(u=>u.status==='active').length)"
git add data/units.json
git commit -m "feat: add units.json with chapter 3 unit metadata"
```

---

## Chunk 2: JS Interactive Systems + Engine

### Task 10: Create js/tooltips.js skeleton

**Files:**
- Create: `js/tooltips.js`

- [ ] **Step 1: Create the file with IIFE structure and data loading**

```javascript
/* ==========================================================
   Politik-LK — tooltips.js
   Operator badge tooltips · Fachbegriff popovers · Priority toggle
   Requires: css/style.css sections 40-42
   Load after engine.js in unit HTML files.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Shared state ──────────────────────────────────────── */
  var _operators  = null;  // Loaded from /data/operators.json
  var _glossary   = null;  // Loaded from /data/glossary.json
  var _activeTooltip = null;  // Currently visible tooltip element

  /* ── Data loading ──────────────────────────────────────── */

  function _fetchJSON(path, cb) {
    fetch(path)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + path);
        return r.json();
      })
      .then(cb)
      .catch(function (e) { console.warn('[tooltips.js]', e); });
  }

  function _loadData() {
    _fetchJSON('/data/operators.json', function (data) { _operators = data; });
    _fetchJSON('/data/glossary.json',  function (data) { _glossary  = data; });
  }

  function _opByName(name) {
    if (!_operators) return null;
    return _operators.find(function (o) { return o.name === name; }) || null;
  }

  function _termByName(name) {
    if (!_glossary) return null;
    var lower = name.toLowerCase();
    return _glossary.find(function (g) { return g.term.toLowerCase() === lower; }) || null;
  }

  /* ── Tooltip positioning ───────────────────────────────── */

  function _positionTooltip(tooltip, anchor) {
    var r    = anchor.getBoundingClientRect();
    var tw   = 280;
    // position:fixed is viewport-relative — do NOT add window.scrollY/scrollX
    var top  = r.bottom + 8;
    var left = r.left;

    // Keep within viewport
    if (left + tw > window.innerWidth - 16) {
      left = window.innerWidth - tw - 16;
    }
    if (left < 8) left = 8;

    tooltip.style.top  = top + 'px';
    tooltip.style.left = left + 'px';
  }

  function _closeTooltip() {
    if (_activeTooltip) {
      _activeTooltip.remove();
      _activeTooltip = null;
    }
  }

  /* ── Init ───────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    _loadData();
    _initOpBadges();
    _initFbTerms();
    _initPriorityToggle();

    // Close tooltips on outside click
    document.addEventListener('click', function (e) {
      if (_activeTooltip && !_activeTooltip.contains(e.target)) {
        _closeTooltip();
      }
    });
  });

  // Placeholder init functions — defined in subsequent tasks
  function _initOpBadges() {}
  function _initFbTerms()  {}
  function _initPriorityToggle() {}

})();
```

- [ ] **Step 2: Add `<script src="../js/tooltips.js"></script>` to tests/visual.html (after the inline script)**

- [ ] **Step 3: Open visual test with local server (`npx serve .` → http://localhost:3000/tests/visual.html)**

Expected: No console errors. `tooltips.js` loads, `_loadData()` fetches both JSON files (check Network tab: 200 OK for both).

---

### Task 11: Operator badge tooltip

**Files:**
- Modify: `js/tooltips.js` — replace `_initOpBadges`

- [ ] **Step 1: Replace the `_initOpBadges` placeholder**

```javascript
function _initOpBadges() {
  document.querySelectorAll('.op-badge').forEach(function (badge) {
    badge.addEventListener('click', function (e) {
      e.stopPropagation();

      // Toggle: close if same badge clicked again
      if (_activeTooltip && _activeTooltip.dataset.for === badge.dataset.op) {
        _closeTooltip();
        return;
      }
      _closeTooltip();

      var opName = badge.dataset.op;
      var op = _opByName(opName);

      var tooltip = document.createElement('div');
      tooltip.className = 'op-tooltip';
      tooltip.dataset.for = opName;

      if (_operators === null) {
        // Data still loading
        tooltip.innerHTML = '<p style="color:var(--ink3);font-size:.8rem">Lade Daten …</p>';
      } else if (!op) {
        tooltip.innerHTML = '<p style="color:var(--ink3);font-size:.8rem">Operator nicht gefunden.</p>';
      } else {
        var abRoman = ['', 'I', 'II', 'III'][op.ab];
        var abLabel = abRoman ? ('AB ' + abRoman) : ('AB ' + op.ab);
        var anchor  = op.ab === 1 ? '#ab-training-i' : op.ab === 2 ? '#ab-training-ii' : '#ab-training-iii';
        tooltip.innerHTML =
          '<div class="op-tooltip-op">' + op.name + ' · ' + abLabel + '</div>' +
          '<div class="op-tooltip-desc">' + op.description + '</div>' +
          '<div class="op-tooltip-starter">' + op.starter + '</div>' +
          '<a class="op-tooltip-link" href="/index.html' + anchor + '">→ ' + abLabel + ' Leitfaden</a>';
      }

      document.body.appendChild(tooltip);
      _positionTooltip(tooltip, badge);
      _activeTooltip = tooltip;
    });
  });
}
```

- [ ] **Step 2: Reload visual test (server must be running for JSON fetch)**

Expected: Clicking `.op-badge[data-op="analysieren"]` shows tooltip with description and sentence starter for "analysieren". Clicking outside closes it. Clicking same badge again closes it.

- [ ] **Step 3: Verify edge case — unknown operator**

Add `<span class="op-badge" data-op="unknown">unknown ▾</span>` temporarily to visual.html. Click it.

Expected: Tooltip shows "Operator nicht gefunden." message. Remove the test element.

---

### Task 12: Fachbegriff popover

**Files:**
- Modify: `js/tooltips.js` — replace `_initFbTerms`

- [ ] **Step 1: Add fb terms to tests/visual.html for testing**

Append inside the SW block in the visual test:
```html
<div class="sw" style="margin-top:1.5rem">
  <div class="sw-head"><span class="sw-label">📘 SACHWISSEN</span><span class="sw-title">Fachbegriff Test</span></div>
  <div class="sw-body"><p>Der <strong class="fb">Binnenmarkt</strong> basiert auf den <strong class="fb">Vier Grundfreiheiten</strong>.</p></div>
</div>
```

- [ ] **Step 2: Replace the `_initFbTerms` placeholder**

```javascript
function _initFbTerms() {
  document.querySelectorAll('strong.fb').forEach(function (term) {
    term.addEventListener('click', function (e) {
      e.stopPropagation();

      var termText = term.textContent.trim();
      if (_activeTooltip && _activeTooltip.dataset.for === 'fb-' + termText) {
        _closeTooltip();
        return;
      }
      _closeTooltip();

      var entry = _glossary === null ? null : _termByName(termText);
      var tooltip = document.createElement('div');
      tooltip.className = 'fb-tooltip';
      tooltip.dataset.for = 'fb-' + termText;

      if (_glossary === null) {
        tooltip.innerHTML = '<div class="fb-tooltip-term">' + termText + '</div>' +
          '<div class="fb-tooltip-def">Lade Daten …</div>';
      } else if (!entry) {
        tooltip.innerHTML = '<div class="fb-tooltip-term">' + termText + '</div>' +
          '<div class="fb-tooltip-def">Definition nicht gefunden.</div>';
      } else {
        var unitLinks = entry.units.map(function (u) { return 'Einheit ' + u; }).join(', ');
        var abLabel   = entry.ab ? ' · AB ' + ['', 'I', 'II', 'III'][entry.ab] : '';
        tooltip.innerHTML =
          '<div class="fb-tooltip-term">' + entry.term + abLabel + '</div>' +
          '<div class="fb-tooltip-def">' + entry.def + '</div>' +
          '<div class="fb-tooltip-units">→ ' + unitLinks + '</div>';
      }

      document.body.appendChild(tooltip);
      _positionTooltip(tooltip, term);
      _activeTooltip = tooltip;
    });
  });
}
```

- [ ] **Step 3: Reload visual test**

Expected: Clicking `<strong class="fb">Binnenmarkt</strong>` shows popover with definition and "→ Einheit 3-5". Clicking "Vier Grundfreiheiten" shows its definition. Outside click closes.

---

### Task 13: Priority toggle

**Files:**
- Modify: `js/tooltips.js` — replace `_initPriorityToggle`

- [ ] **Step 1: Replace the `_initPriorityToggle` placeholder**

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
    btn.textContent = '◆ Prüfungsrelevanz aktiv';
  }

  btn.addEventListener('click', function () {
    var active = document.body.classList.toggle('prio-active');
    localStorage.setItem(storageKey, active ? '1' : '0');
    btn.textContent = active ? '◆ Prüfungsrelevanz aktiv' : '◇ Prüfungsrelevanz anzeigen';
  });
}
```

- [ ] **Step 2: Update tests/visual.html priority toggle button text to match initial state**

Change button text to: `◇ Prüfungsrelevanz anzeigen`

- [ ] **Step 3: Test toggle in browser**

Expected:
- Click → body gets `.prio-active`, button text changes, core block shows `◆`, ctx block dims
- Reload page → state is restored from localStorage
- Click again → state clears

- [ ] **Step 4: Commit JS tooltips file**

```bash
git add js/tooltips.js tests/visual.html
git commit -m "feat: add tooltips.js — operator badge tooltips, fb popovers, priority toggle"
```

---

### Task 14: Engine — unlock ab2 and uk blocks

**Files:**
- Modify: `js/engine.js` — update `unlk()` and `_restoreState()`

First, read engine.js lines 400–465 (the `unlk` function and gate restore logic) to understand the exact implementation before editing.

- [ ] **Step 1: Locate `window.unlk` in engine.js and add data-gate handling**

Find `_unlockBlock(gateNr, true);` inside `window.unlk` — it is the first line of the function body. Add the data-gate unlock block immediately **after** `_unlockBlock(gateNr, true);` and **before** `_updateProgressBar();`:

```javascript
// Unlock new block types (ab2, uk) declared with data-gate attribute
document.querySelectorAll('[data-gate="' + gateNr + '"].locked').forEach(function (el) {
  el.classList.remove('locked');
  el.classList.add('unlocking');
  setTimeout(function () { el.classList.remove('unlocking'); }, 600);
});
```

- [ ] **Step 2: Locate `_restoreState` and add data-gate restore after existing gate restore logic**

Find where `_restoreState` restores gate states (the loop over `qgPass`) and add after it:

```javascript
// Restore data-gate blocks for already-passed gates.
// Note: qgPass keys are integers (set as qgPass[gateNr] where gateNr is a number).
// When serialised to JSON and reloaded, they become string keys like "1", "2", "3".
// parseInt handles both numeric and string keys correctly.
Object.keys(qgPass).forEach(function (key) {
  if (qgPass[key]) {
    var gateNr = parseInt(key, 10);
    document.querySelectorAll('[data-gate="' + gateNr + '"]').forEach(function (el) {
      el.classList.remove('locked');
    });
  }
});
```

- [ ] **Step 3: Add a test block to tests/visual.html to verify unlock**

```html
<h2 style="font-family:var(--ff-head);margin:2rem 0 1rem">Unlock Test (ab2 + uk with data-gate)</h2>
<button onclick="simulateGatePass(1)">Simulate Gate 1 Pass</button>
<button onclick="simulateGatePass(3)">Simulate Gate 3 Pass</button>

<div class="ab2 locked" data-gate="1" style="margin-top:1rem">
  <div class="ab2-head"><span class="op-badge" data-op="analysieren">analysieren · AB II</span> Aufgabe 1</div>
  <div class="ab2-body"><p>Dieser Block wird durch Gate 1 freigeschaltet.</p></div>
</div>

<div class="uk locked" data-gate="3" data-uk="pairs" style="margin-top:1rem">
  <div class="uk-head">⚖️ Urteilskompetenz</div>
  <div class="uk-body">
    <div class="uk-step uk-urteil"><span class="uk-step-label">5. Mein Urteil</span><p>Freigeschaltet durch Gate 3.</p></div>
  </div>
</div>

<script>
function simulateGatePass(n) {
  // Simulate what unlk(n) does for data-gate elements
  document.querySelectorAll('[data-gate="' + n + '"].locked').forEach(function(el) {
    el.classList.remove('locked');
    el.classList.add('unlocking');
    setTimeout(function() { el.classList.remove('unlocking'); }, 600);
  });
}
</script>
```

- [ ] **Step 4: Test in browser**

Expected:
- Initially: ab2 and uk blocks show as locked (`.locked` CSS hides them with opacity/display)
- Click "Simulate Gate 1 Pass" → ab2 block fades in
- Click "Simulate Gate 3 Pass" → uk block fades in

- [ ] **Step 5: Commit**

```bash
git add js/engine.js
git commit -m "feat: extend engine.js unlock chain for data-gate block types (ab2, uk)"
```

---

## Chunk 3: New Pages + Reference Implementation

### Task 15: fachbegriffe.html

**Files:**
- Create: `fachbegriffe.html`

- [ ] **Step 1: Create the page**

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fachbegriffe — Politik-LK</title>
<link rel="stylesheet" href="css/style.css">
<style>
:root { --acc: #2d5986; --accL: #e8f0f8; --accG: rgba(45,89,134,.08); }

.fb-page-filter {
  display: flex;
  gap: .6rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.fb-filter-btn {
  font-family: var(--ff-mono);
  font-size: .7rem;
  font-weight: 600;
  padding: .3em .8em;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--card);
  color: var(--ink3);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: .08em;
  transition: all .15s;
}

.fb-filter-btn:hover,
.fb-filter-btn.active {
  background: var(--accG);
  border-color: var(--acc);
  color: var(--acc);
}

.fb-list { list-style: none; padding: 0; }

.fb-entry {
  background: var(--card);
  border: 1px solid var(--border-l);
  border-left: 4px solid var(--sw);
  border-radius: var(--r);
  padding: .85rem 1.1rem;
  margin-bottom: .75rem;
}

.fb-entry-term {
  font-family: var(--ff-mono);
  font-size: .8rem;
  font-weight: 700;
  color: var(--sw);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: .3rem;
  display: flex;
  align-items: center;
  gap: .5rem;
}

.fb-ab-badge {
  font-size: .65rem;
  background: var(--swB);
  color: var(--sw);
  padding: .1em .5em;
  border-radius: 3px;
}

.fb-entry-def {
  font-size: .88rem;
  color: var(--ink2);
  line-height: 1.6;
  margin-bottom: .4rem;
}

.fb-entry-units {
  font-family: var(--ff-mono);
  font-size: .68rem;
  color: var(--ink3);
}

.fb-empty {
  color: var(--ink3);
  font-style: italic;
  padding: 2rem 0;
  text-align: center;
}

#fb-search {
  width: 100%;
  max-width: 420px;
  padding: .55rem .85rem;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-family: var(--ff-body);
  font-size: .9rem;
  background: var(--card);
  color: var(--ink);
  margin-bottom: 1.25rem;
}

#fb-search:focus { outline: none; border-color: var(--sw); }
</style>
</head>
<body>

<div class="page-wrap">

  <nav class="breadcrumb">
    <a href="index.html">Startseite</a>
    <span class="sep">›</span>
    <span class="current">Fachbegriffe</span>
  </nav>

  <div class="unit-header" style="text-align:left;border-bottom:none;padding-left:0">
    <h1>Fachbegriffe</h1>
    <p class="sub">Alle Fachbegriffe alphabetisch — klicke einen Begriff für die Definition an.</p>
  </div>

  <input type="search" id="fb-search" placeholder="Begriff suchen …" autocomplete="off">

  <div class="fb-page-filter" id="fb-filters">
    <button class="fb-filter-btn active" data-filter="all">Alle Kapitel</button>
    <!-- Chapter buttons rendered by JS -->
  </div>

  <ul class="fb-list" id="fb-list">
    <li class="fb-empty">Lade Fachbegriffe …</li>
  </ul>

</div>

<script src="js/progress.js"></script>
<script>
(function () {
  var _all    = [];
  var _filter = 'all';
  var _search = '';

  var listEl    = document.getElementById('fb-list');
  var filtersEl = document.getElementById('fb-filters');
  var searchEl  = document.getElementById('fb-search');

  function _render() {
    var items = _all.filter(function (g) {
      var matchChapter = _filter === 'all' || String(g.chapter) === _filter;
      var matchSearch  = !_search || g.term.toLowerCase().includes(_search) || g.def.toLowerCase().includes(_search);
      return matchChapter && matchSearch;
    });

    // Sort alphabetically
    items.sort(function (a, b) { return a.term.localeCompare(b.term, 'de'); });

    if (!items.length) {
      listEl.innerHTML = '<li class="fb-empty">Keine Begriffe gefunden.</li>';
      return;
    }

    listEl.innerHTML = items.map(function (g) {
      var abLabel = g.ab ? ' <span class="fb-ab-badge">AB ' + ['','I','II','III'][g.ab] + '</span>' : '';
      var unitLinks = g.units.map(function (u) { return 'Einheit ' + u; }).join(', ');
      return '<li class="fb-entry">' +
        '<div class="fb-entry-term">' + g.term + abLabel + '</div>' +
        '<div class="fb-entry-def">' + g.def + '</div>' +
        '<div class="fb-entry-units">→ ' + unitLinks + '</div>' +
        '</li>';
    }).join('');
  }

  function _buildFilters(data) {
    var chapters = [...new Set(data.map(function (g) { return g.chapter; }))].sort();
    chapters.forEach(function (ch) {
      var btn = document.createElement('button');
      btn.className = 'fb-filter-btn';
      btn.dataset.filter = String(ch);
      btn.textContent = 'Kapitel ' + ch;
      btn.addEventListener('click', function () {
        _filter = btn.dataset.filter;
        filtersEl.querySelectorAll('.fb-filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        _render();
      });
      filtersEl.appendChild(btn);
    });

    filtersEl.querySelector('[data-filter="all"]').addEventListener('click', function () {
      _filter = 'all';
      filtersEl.querySelectorAll('.fb-filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      _render();
    });
  }

  searchEl.addEventListener('input', function () {
    _search = searchEl.value.trim().toLowerCase();
    _render();
  });

  fetch('/data/glossary.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _all = data;
      _buildFilters(data);
      _render();
    })
    .catch(function () {
      listEl.innerHTML = '<li class="fb-empty">Fachbegriffe konnten nicht geladen werden.</li>';
    });
})();
</script>

</body>
</html>
```

- [ ] **Step 2: Test in browser (server must be running)**

Open `http://localhost:3000/fachbegriffe.html`.

Expected:
- 8 entries load and display alphabetically
- Search for "Sozialdumping" → single result
- Chapter filter "Kapitel 3" → all 8 entries (same as All)
- Empty search → all entries

- [ ] **Step 3: Commit**

```bash
git add fachbegriffe.html
git commit -m "feat: add fachbegriffe.html with alphabetical list, chapter filter, and search"
```

---

### Task 16: AB-Training section in index.html

**Files:**
- Modify: `index.html` — add section before the unit sections

- [ ] **Step 1: Read index.html lines 320–340 to find the right insertion point**

Find the `<main>` or first `<section>` tag after the site header. Add the AB-Training section after the site header and before the unit list sections.

- [ ] **Step 2: Insert the AB-Training section HTML**

```html
<!-- ═══════════════ AB-TRAINING ═══════════════ -->
<section class="ab-training-section" style="margin-bottom:2rem">
  <div style="font-family:var(--ff-mono);font-size:.72rem;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.12em;margin-bottom:1rem">
    📐 AB-Leitfaden
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem">

    <!-- AB I -->
    <div id="ab-training-i" style="background:var(--card);border:1px solid var(--border-l);border-left:4px solid var(--sw);border-radius:var(--r);padding:1rem">
      <div style="font-family:var(--ff-mono);font-size:.7rem;font-weight:700;color:var(--sw);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">AB I · Wissen zeigen</div>
      <p style="font-size:.85rem;color:var(--ink2);margin-bottom:.6rem">Du stellst Sachverhalte dar, ohne sie zu bewerten. Zeige, dass du weißt, <em>was</em> gilt.</p>
      <p style="font-size:.78rem;color:var(--ink3);font-family:var(--ff-mono)">Operatoren: nennen · beschreiben · erklären · darstellen</p>
      <div style="margin-top:.75rem;background:var(--input-bg);border-left:3px solid var(--sw);padding:.5rem .7rem;font-size:.8rem;font-style:italic;color:var(--ink)">
        „Nenne die vier Grundfreiheiten des Binnenmarkts."
      </div>
    </div>

    <!-- AB II -->
    <div id="ab-training-ii" style="background:var(--card);border:1px solid var(--border-l);border-left:4px solid var(--acc);border-radius:var(--r);padding:1rem">
      <div style="font-family:var(--ff-mono);font-size:.7rem;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">AB II · Verstehen + Erklären</div>
      <p style="font-size:.85rem;color:var(--ink2);margin-bottom:.6rem">Du stellst Verbindungen her: Wie hängen Theorie und Material zusammen? Wo liegt der Konflikt oder die Frage? Und kannst du das klar formulieren?</p>
      <p style="font-size:.78rem;color:var(--ink3);font-family:var(--ff-mono)">Operatoren: erläutern · analysieren · einordnen · vergleichen</p>
      <div style="margin-top:.75rem;background:var(--input-bg);border-left:3px solid var(--acc);padding:.5rem .7rem;font-size:.8rem;font-style:italic;color:var(--ink)">
        „Erläutere, indem du zunächst das Konzept darstellst und es dann am Beispiel konkretisierst."
      </div>
    </div>

    <!-- AB III -->
    <div id="ab-training-iii" style="background:var(--card);border:2px solid var(--acc);border-radius:var(--r);overflow:hidden">
      <div style="background:var(--acc);padding:.6rem 1rem;font-family:var(--ff-mono);font-size:.7rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.1em">AB III · Politisch urteilen</div>
      <div style="padding:1rem">
        <p style="font-size:.85rem;color:var(--ink2);margin-bottom:.75rem">Du bildest ein begründetes, kritisches Urteil — aufbauend auf AB I und AB II. Das ist der Kern der Urteilskompetenz.</p>
        <div style="font-family:var(--ff-mono);font-size:.68rem;color:var(--acc);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">Die 5 Schritte:</div>
        <ol style="padding-left:1.25rem;font-size:.82rem;color:var(--ink2);line-height:1.7">
          <li><strong style="color:var(--acc)">Kontext</strong> — Was sagt die Theorie/Norm?</li>
          <li><strong style="color:var(--acc)">Fall</strong> — Was zeigt das Material?</li>
          <li><strong style="color:var(--acc)">Verbindung</strong> — Wo liegt der Konflikt?</li>
          <li><strong style="color:var(--acc)">Abwägung</strong> — Welche Perspektiven gibt es?</li>
          <li><strong style="color:var(--acc)">Urteil</strong> — Deine begründete Einschätzung.</li>
        </ol>
        <div style="margin-top:.75rem;background:var(--accG);border-left:3px solid var(--acc);padding:.5rem .7rem;font-size:.8rem;font-style:italic;color:var(--ink)">
          „Mein Urteil lautet …, weil … Das Gegenargument … berücksichtige ich, komme aber dennoch zu dem Schluss, dass …"
        </div>
        <p style="font-family:var(--ff-mono);font-size:.68rem;color:var(--ink3);margin-top:.6rem">Operatoren: beurteilen · bewerten · erörtern · urteilen</p>
      </div>
    </div>

  </div>
</section>
<!-- ═══════════════ /AB-TRAINING ═══════════════ -->
```

- [ ] **Step 3: Open index.html in browser**

Expected: AB-Training section shows three cards side by side (or stacked on narrow viewports). Anchor links `#ab-training-i`, `#ab-training-ii`, `#ab-training-iii` scroll to the respective cards.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add AB-Training section to index.html with AB I/II/III guides and anchors"
```

---

### Task 17: Unit 3.5 reference implementation

**Files:**
- Modify: `einheiten/3-5_binnenmarkt.html`

Read the full current state of the file before making any changes.

- [ ] **Step 1: Add `data-p` priority attributes to the three SW blocks**

Find each `<div class="sw" id="sw1">` (and sw2, sw3) and add `data-p`:
- `sw1` (Binnenmarkt definition, founding date, integration stages) — exam core: `data-p="core"`
- `sw2` (the four freedoms with Cassis example) — exam core: `data-p="core"`
- `sw3` (advantages + Sozialdumping/Brain Drain/Steuerwettbewerb) — important: `data-p="imp"`

```html
<div class="sw" id="sw1" data-p="core">
<div class="sw" id="sw2" data-p="core">
<div class="sw" id="sw3" data-p="imp">
```

- [ ] **Step 2: Add `class="fb"` to Fachbegriffe in SW blocks**

The `<strong>` text in the HTML must exactly match the `"term"` field in `glossary.json`. Where the existing HTML text differs, rename the visible text to match. Changes needed:

**In sw1** — The existing `<strong>Europäischer Binnenmarkt</strong>` wraps two words. Replace with:
```html
Der <strong class="fb">Binnenmarkt</strong> ist ein Wirtschaftsraum …
```
(Remove the adjective "Europäischer" from inside the `<strong>` — the glossary term is "Binnenmarkt".)

**In sw2:**
- `<strong>Cassis-de-Dijon-Entscheidung</strong>` → rename to `<strong class="fb">Cassis-de-Dijon-Prinzip</strong>` (the glossary term is "Prinzip", the pedagogically correct name for the legal principle derived from the ruling)
- Find `<strong>Entsenderichtlinie</strong>` and add `class="fb"` — text matches exactly

**In sw3:**
- `<strong>Sozialdumping</strong>` → add `class="fb"` — matches exactly
- `<strong>Brain Drain</strong>` → add `class="fb"` — matches exactly
- `<strong>Steuerwettbewerb</strong>` → add `class="fb"` — matches exactly
- `<strong>LuxLeaks-Skandal</strong>` → rename to `<strong class="fb">LuxLeaks</strong>` (glossary term is "LuxLeaks"; remove "-Skandal" from the `<strong>` text)

- [ ] **Step 3: Add the priority toggle button to the unit header**

After the `.lz-list` div in the unit header, add:
```html
<div style="margin-top:.75rem">
  <button class="prio-toggle-btn">◇ Prüfungsrelevanz anzeigen</button>
</div>
```

- [ ] **Step 4: Add an AB II task block after QG2**

The ab2-1 block has `data-gate="2"` — it unlocks when gate 2 passes. Place it **after the closing `</div>` of `qg2`** and **before the opening `<div>` of `sw3`**. This way it appears in the natural reading flow at the moment it unlocks.

```html
<!-- AB II Task: Analysiere Grundfreiheiten -->
<div class="ab2 locked" id="ab2-1" data-gate="2">
  <div class="ab2-head">
    <span class="op-badge" data-op="analysieren">analysieren · AB II</span>
    Aufgabe 1
  </div>
  <div class="ab2-body">
    <p>Analysiere, welche der vier Grundfreiheiten in den folgenden Alltagsbeispielen aus der Grenzregion Perl–Schengen eine Rolle spielt. Begründe deine Zuordnung mit Bezug auf das Sachwissen aus Block 2.</p>
    <ol>
      <li>Ein luxemburgischer Arzt eröffnet eine Praxis in Trier.</li>
      <li>Ein saarländisches Unternehmen überweist Investitionskapital nach Polen.</li>
      <li>Eine polnische Bauarbeiterin arbeitet zwei Monate auf einer deutschen Baustelle.</li>
    </ol>
  </div>
</div>
```

- [ ] **Step 5: Add the UK block after the last QG (qg3)**

After the closing `</div>` of `qg3` (the last quiz gate), before `#arbeitsblatt`, add:

```html
<!-- UK Block: Urteilskompetenz -->
<div class="uk locked" id="uk1" data-gate="3" data-uk="pairs">
  <div class="uk-head">
    <span class="op-badge" data-op="beurteilen">beurteilen · AB III</span>
    Urteilskompetenz — Binnenmarkt
  </div>
  <div class="uk-body">
    <div class="uk-step">
      <span class="uk-step-label">1. Kontext</span>
      <p>Der EU-Binnenmarkt basiert auf den vier Grundfreiheiten und ermöglicht freie Zirkulation von Waren, Personen, Dienstleistungen und Kapital. Ziel ist wirtschaftliche Integration und gemeinsamer Wohlstand.</p>
    </div>
    <div class="uk-step">
      <span class="uk-step-label">2. Fall</span>
      <p>Tatsächlich zeigen sich in der Praxis erhebliche Probleme: Sozialdumping durch Entsendung von Niedriglohnarbeitern, Brain Drain aus osteuropäischen Ländern und Steuerwettbewerb (Stichwort LuxLeaks).</p>
    </div>
    <div class="uk-step">
      <span class="uk-step-label">3. Verbindung</span>
      <p>Die Theorie verspricht Wohlstand für alle — die Praxis zeigt, dass der Binnenmarkt asymmetrisch wirkt: Stärkere Volkswirtschaften profitieren mehr, während schwächere Länder und Arbeitnehmer Nachteile tragen können.</p>
    </div>
    <div class="uk-step uk-abwaegung">
      <span class="uk-step-label">4. Abwägung</span>
      <div class="uk-pairs">
        <div class="uk-pair">
          <span class="uk-pair-label">Argumente dafür</span>
          <p>Günstigere Preise, größere Auswahl, Wirtschaftswachstum, Erasmus+, Arbeitsplätze durch grenzüberschreitende Unternehmen.</p>
        </div>
        <div class="uk-pair uk-pair-contra">
          <span class="uk-pair-label">Argumente dagegen</span>
          <p>Sozialdumping, Brain Drain aus ärmeren Regionen, Steuerwettbewerb schädigt öffentliche Haushalte.</p>
        </div>
      </div>
    </div>
    <div class="uk-step uk-urteil">
      <span class="uk-step-label">5. Mein Urteil</span>
      <p>Beurteile: Überwiegen die Vorteile des Binnenmarkts die Nachteile? Beziehe dich auf mindestens zwei konkrete Beispiele aus dem Sachwissen und formuliere eine begründete Position.</p>
    </div>
  </div>
</div>
```

- [ ] **Step 6: Add `tooltips.js` to the script loading section**

At the bottom of the file, after `engine.js` is loaded, add:
```html
<script src="../js/tooltips.js"></script>
```

- [ ] **Step 7: Test the full unit end-to-end**

Open `http://localhost:3000/einheiten/3-5_binnenmarkt.html`.

Verify in order:
1. Unit loads correctly — no console errors
2. Priority toggle button visible in header — click it → core SW blocks show `◆`, sw3 is unchanged (imp level)
3. Clicking `<strong class="fb">Sozialdumping</strong>` shows the fb popover with definition
4. Click op-badge on AB II task header → operator tooltip shows for "analysieren"
5. Pass Gate 1 (answer all QG1 questions correctly) → SW2 unlocks
6. Pass Gate 2 → AB2-1 + SW3 both unlock. Open DevTools → Elements and verify DOM order: `qg2` → `ab2-1` → `sw3` (ab2-1 must appear *after* qg2, not before it)
7. Pass Gate 3 → AB worksheet + UK1 both unlock
8. Reload page → all previously unlocked blocks remain visible (localStorage restore works)

- [ ] **Step 8: Commit the reference implementation**

```bash
git add einheiten/3-5_binnenmarkt.html
git commit -m "feat: apply redesign conventions to unit 3.5 — fb terms, ab2 task, uk block, priority tags, tooltips.js"
```

---

### Task 18: Final smoke test + cleanup

- [ ] **Step 1: Open index.html, verify AB-Training section renders and anchors work**

Navigate to `http://localhost:3000/` and:
- Scroll to AB-Training section — three cards visible
- Click a unit card for 3-5 → unit opens
- In operator tooltip for an AB III badge, click "→ AB III Leitfaden" → navigates back to index.html#ab-training-iii

- [ ] **Step 2: Open fachbegriffe.html — end-to-end**

- Search "LuxLeaks" → finds entry
- Filter "Kapitel 3" → 8 entries
- Clear filter → still 8 entries (all are chapter 3)

- [ ] **Step 3: Remove `tests/visual.html` test elements (keep the file for future dev use, but do not commit it to main)**

```bash
git rm tests/visual.html
git commit -m "chore: remove visual test fixture from tracked files"
```

Or add to `.gitignore`:
```
tests/
```

```bash
git add .gitignore
git commit -m "chore: exclude tests/ directory from version control"
```

---

## Implementation Notes for Future Units

When adding a new unit (e.g., `einheiten/3-6_...html`):

1. Follow the unit 3.5 file as template
2. Add `data-p="core|imp|ctx"` to each `.sw` block
3. Add `class="fb"` to `<strong>` Fachbegriffe — and add the terms to `data/glossary.json`
4. Choose a unit format (`arc`, `case-dive`, `comparison`, `debate`, `timeline`, `data-reading`) and set `<meta name="unit-format" content="...">`
5. For Arc format: add one `.ab2` block per content section and one `.uk` block at the end
6. For non-Arc formats: UK block optional — add only when the task explicitly demands judgment
7. Add `<script src="../js/tooltips.js"></script>` before `</body>`
8. Add unit entry to `data/units.json`
9. Add unit entry to `index.html` SECTIONS array
