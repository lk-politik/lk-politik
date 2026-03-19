# Index Page Redesign — Design Spec

**Goal:** Replace the current index.html with a clean chapter accordion that shows only existing units, unlocks them sequentially, and removes the Lehrkraft dashboard.

**Architecture:** Pure HTML/CSS/ES5 inline — no new files, no build step. All changes confined to `index.html`. Reuses `js/progress.js`. `js/engine.js` is removed from index (it self-inits on unit pages only — not needed here).

**Tech Stack:** HTML5, CSS3 custom properties, ES5 JavaScript (`var`, `function`, no arrow functions, no `const`/`let`, no `Object.values`), localStorage via existing `Progress` API.

---

## What is removed

- AB-Leitfaden section (`.ab-training-section`) — methodology becomes its own chapter
- Lehrkraft section (`#lk-section`), password input, dashboard panel, all associated JS (`lkChkPw`, `lkRenderTable`, `lkRegenPw`, `lkClearAll`, `_DEFAULT_MASTER`, `_PW_STORE_KEY`, `_STU_STORE_PFX`)
- Unit card grid layout (`.unit-card`, `.units-grid`, `_makeCard`)
- Placeholder chapter rows
- `<script src="js/engine.js">` tag

## What is added / changed

### Global progress bar
- Single bar above the chapter list
- Denominator = units with `status !== 'pending'` (rendered units only)
- Value = count of rendered units where `Progress.load(id)` is non-null and `.unlocked === true`, divided by total rendered unit count × 100
- Label: "Gesamtfortschritt" · percentage on the right

### Chapter accordion
- `SECTIONS` data array retained; only chapters where at least one unit has `status !== 'pending'` are rendered
- One chapter open at a time; clicking an open chapter closes it; clicking again reopens
- Chapter row: chevron · chapter name · rendered-unit count · aggregate progress bar + %
- Aggregate progress = average of per-unit progress percentages across rendered (non-pending) units in that chapter only. A chapter is only rendered when at least one unit qualifies, so the denominator is always ≥ 1; no zero-division guard is needed.

### Unit list (inside open chapter)
- Only units with `status !== 'pending'` are listed
- `id` field (e.g. `'3-5'`) is passed directly to `Progress.load()` — not `num` (e.g. `'3.5'`)
- **First rendered unit** in each chapter: always unlocked
- **Subsequent units**: unlocked only if `Progress.load(prevId)` is non-null AND `.unlocked === true`
- **Unlocked unit**: rendered as `<a>` with full opacity, progress bar, `&#8594;` arrow
- **Locked unit**: rendered as `<div>` with `opacity: .4`, `pointer-events: none`, Unicode lock `&#128274;`

### Per-unit progress calculation (ES5)
```javascript
var prog = Progress.load(u.id);
var pct = 0;
if (prog) {
  if (prog.unlocked) {
    pct = 100;
  } else if (prog.gates) {
    var keys = Object.keys(prog.gates);  /* ES5 — not Object.values */
    var done = 0;
    for (var k = 0; k < keys.length; k++) { if (prog.gates[keys[k]]) done++; }
    pct = keys.length ? Math.round(done / keys.length * 100) : 0;
  }
}
```

### Data model (SECTIONS)
- Each unit object retains: `id`, `num`, `title`, `sk`, `uk`, `href`, `status`, `color`
- `stuPw` and `special` fields dropped (no longer needed)
- Units with `status: 'pending'` remain in the array for future use but are never rendered

### CSS (inline `<style>` block)
New classes, old card classes removed:
- `.global-progress`, `.prog-bar`, `.prog-bar-fill`, `.global-progress-pct`
- `.chapters`, `.chapter`, `.chapter.open`, `.chapter-row`, `.chapter-icon`, `.chapter-name`, `.chapter-meta`, `.chapter-prog`
- `.unit-list`, `.unit-row`, `.unit-row.locked`, `.unit-num`, `.unit-title`, `.unit-prog`, `.unit-prog-pct`, `.unit-arrow`, `.unit-lock`
- Existing: `.site-header`, `.school-label`, `.page-footer` — kept as-is

---

## Unit availability (current state)

Only one unit currently exists:
- `3.5` — `einheiten/3-5_binnenmarkt.html` — `status: 'active'`

All others remain `status: 'pending'` and are not rendered. As new units are built and their `status` changed to `'active'`, they appear automatically in the accordion.

---

## Sequential unlock example

Given Kapitel 3 with units [3.2, 3.3, 3.5] all `status: 'active'`:
- 3.2 always unlocked (first rendered unit)
- 3.3 unlocked only if `Progress.load('3-2')` is non-null and `.unlocked === true`
- 3.5 unlocked only if `Progress.load('3-3')` is non-null and `.unlocked === true`

Today with only 3.5 active: 3.5 is first rendered unit in its chapter → always unlocked.
