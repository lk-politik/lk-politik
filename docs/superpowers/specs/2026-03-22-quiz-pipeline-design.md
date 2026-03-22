# Quiz Pipeline & New Types — Design Spec
**Date:** 2026-03-22
**Project:** Politik-LK Digitale Lerneinheiten
**Status:** Approved for implementation

---

## 1. Goal

Refactor the monolithic JS stack into a registered module pipeline, extract all quiz logic from `engine.js` into focused files, add 5 new interactive quiz/exercise types, and document 6 existing template patterns. All public functions move to the `PLK.*` namespace; all existing unit HTML is updated accordingly.

---

## 2. Architecture — Central Registry

`engine.js` defines and owns the global `PLK` object:

```javascript
window.PLK = {
  _mods: [],
  register: function(mod) { PLK._mods.push(mod); },
  init:     function()    { PLK._mods.forEach(function(m){ if (m.init) m.init(); }); }
};
```

Every other module (quiz-base, quiz-ext, uk-quiz, and any future module) ends with:

```javascript
PLK.register({ name: 'module-name', init: function() { … } });
```

`engine.js` fires `PLK.init()` once on `DOMContentLoaded`, running all registered `init()` hooks in load order. Public functions are assigned onto `PLK` inside `init()`; private helpers remain local to each file's IIFE.

**Adding a future module:** create the file, call `PLK.register(...)`, add one `<script>` tag where needed. No other files change.

---

## 3. Module Split

### 3.1 `engine.js` — Slim Core

Absorbs `progress.js` (which is deleted). Contains:

- `window.PLK` registry + `PLK.init()`
- Progress / localStorage: `PLK.Progress.save()`, `PLK.Progress.load()`, `PLK.Progress.clear()`
- Unit reset: `PLK.resetUnit()` — calls `PLK.Progress.clear(CONF.id)` then `location.reload()`. Does **not** prompt for confirmation; the calling HTML wraps it in `if(confirm('…'))`. **All unit HTML reset buttons call this instead of the old inline `Progress.clear(CONF.id);location.reload()` expression.**
- Gate unlock: `PLK.unlk(n)`
- AB score counter: `PLK.upAB()`, `PLK.rcAB()`
- Result renderer: `PLK.shR(id, correct, total)` — shared by quiz-base and quiz-ext
- Einstieg: `PLK.toggleEinstieg()`, `PLK.selEinstieg(el, n)`, `PLK.chkEinstieg()`, `PLK.retryEinstieg()`
- Password: `PLK.chkPw(fieldId, hintId)`
- Chip shuffle helper: `PLK._shuffleChildren(el)`
- Console admin utilities (not called from HTML, dev-only): `PLK.setMasterPw()`, `PLK.setStuPw()`, `PLK.regenerateAllPw()`
- AB state save/restore: `PLK._saveAbState()`, `PLK._restoreAbState()` — extended to cover quiz-ext types (see §4.6)
- DOMContentLoaded → `PLK.init()`

### 3.2 `quiz-base.js` — Existing Quiz Types

Registers as `'quiz-base'`. Contains all current quiz functions, moved verbatim from `engine.js`, re-exposed on `PLK`:

| Function | Purpose |
|---|---|
| `PLK.toggleQg(n)` | Open/close quiz gate panel |
| `PLK.mcS(el)` | Radio MC — mark selection |
| `PLK.chkQ(n)` | Check quiz gate (radio MC + checkbox MC + text input + ordered list) |
| `PLK.rstQ(n)` | Reset quiz gate |
| `PLK.retryQg(n)` | Retry quiz gate |
| `PLK.oMv(el, dir)` | Move ordered-list item up/down |
| `PLK.oRenum(list)` | Renumber ordered-list items after move |
| `PLK.zCl(el, n)` | Zuordnung — click handler |
| `PLK.chkZ(n, id)` | Zuordnung — check |
| `PLK.retZ(n, id)` | Zuordnung — retry wrong |
| `PLK.rsZ(n, id)` | Zuordnung — reset |
| `PLK.selC(el, bankId)` | Lückentext — select chip |
| `PLK.slCl(el)` | Lückentext — click slot |
| `PLK.chkSl(wrapId, bankId, n, fbId, retryId)` | Lückentext — check |
| `PLK.retSl(wrapId, bankId)` | Lückentext — retry wrong |
| `PLK.rsSl(wrapId, bankId)` | Lückentext — reset |
| `PLK.kS(el, code)` | Kategorisierung — select category |
| `PLK.chkK(listId)` | Kategorisierung — check |
| `PLK.retK(listId)` | Kategorisierung — retry wrong |
| `PLK.rsK(listId)` | Kategorisierung — reset |
| `PLK.chkFT(textareaId, fbId)` | Freitext — save/score |
| `PLK.saveAB(hintId)` | Freitext — explicit save button |
| `PLK.rstAllAB()` | Reset all AB answers |

**`PLK.chkQ()` and checkbox MC:** The current `chkQ` logic already iterates over both `type="radio"` and `type="checkbox"` inputs in the same `mcGroups` loop. Checkbox MC questions (§4.1) use `data-correct="1"` on `<li class="mco">` items identically to radio MC — no changes to `chkQ` are needed. `PLK.mcsCbx()` handles visual state only, matching the role of `PLK.mcS()` for radios.

### 3.3 `quiz-ext.js` — New Types (see §4)

Registers as `'quiz-ext'`. Contains 5 new interactive types.

### 3.4 `uk-quiz.js` — UK Prüfen

Converted to `PLK.register(...)` pattern. **The closure-clobber bug is fixed as part of this conversion:** the current `_initBlock()` loop re-assigns `window.selKrit` and `window.submitStage` for each block, so on multi-block pages the last block wins. The fix is to pass the block's root element into the handler:

```html
<!-- HTML after fix -->
onclick="PLK.selKrit(this)"
onclick="PLK.submitStage(this, 1)"
```

`PLK.selKrit(el)` and `PLK.submitStage(el, stageN)` walk up from `el` to find the containing `.uk` block (`el.closest('.uk')`), so each call operates on the correct block regardless of how many `.uk` blocks exist on the page. `el.closest()` is used since it is supported in all target browsers; a fallback polyfill is included in `uk-quiz.js` for safety.

Public surface:
- `PLK.selKrit(el)` — select criterion option
- `PLK.submitStage(el, stageN)` — advance stage

All other helpers remain private to its IIFE.

---

## 4. New Quiz Types (`quiz-ext.js`)

### 4.1 Checkbox MC — "Select all that apply"

**HTML pattern:**
```html
<ul class="mco-list" id="q1_1c">
  <li class="mco" data-correct="1">
    <label><input type="checkbox" name="q1_1c" onchange="PLK.mcsCbx(this)"> Richtige Antwort A</label>
  </li>
  <li class="mco">
    <label><input type="checkbox" name="q1_1c" onchange="PLK.mcsCbx(this)"> Falsche Antwort</label>
  </li>
  <li class="mco" data-correct="1">
    <label><input type="checkbox" name="q1_1c" onchange="PLK.mcsCbx(this)"> Richtige Antwort B</label>
  </li>
</ul>
```

**Functions:** `PLK.mcsCbx(el)` marks visual state on the parent `<li>`. Checkbox questions are checked by `PLK.chkQ()` alongside radio questions — no separate check function needed (see §3.2 note).

### 4.2 Dropdown Lückentext

**HTML pattern:**
```html
<p>Die EU hat <select class="drop-slot" data-a="27" data-bank="bk3">
  <option value="">—</option>
  <option value="15">15</option>
  <option value="27">27</option>
  <option value="31">31</option>
</select> Mitgliedstaaten.</p>
```

**Functions:** `PLK.chkDrop(wrapId, n, fbId, retryId)` — iterates `.drop-slot` elements, compares `.value` to `data-a`. `PLK.rstDrop(wrapId)` resets all selects. Same scoring model as chip-slot Lückentext.

### 4.3 Selbsteinschätzung — Confidence scale

**HTML pattern:**
```html
<div class="self-wrap" id="self1" data-pts="1">
  <div class="self-q">Ich kann erklären, wie das OGV funktioniert.</div>
  <div class="self-opts">
    <button class="self-btn" data-v="1" onclick="PLK.chkSelf(this)">gar nicht</button>
    <button class="self-btn" data-v="2" onclick="PLK.chkSelf(this)">kaum</button>
    <button class="self-btn" data-v="3" onclick="PLK.chkSelf(this)">gut</button>
    <button class="self-btn" data-v="4" onclick="PLK.chkSelf(this)">sicher ✓</button>
  </div>
</div>
```

**Function:** `PLK.chkSelf(btn)` — saves selected level to localStorage keyed by wrapper id, marks `.self-wrap` done, awards `data-pts` on any selection. Not graded — completion only. State is restored on page reload via the extended `_restoreAbState()` (see §4.6).

### 4.4 Zuordnung-Tabelle — Radio matrix

**HTML pattern:**
```html
<table class="zt-table" id="zt1">
  <thead><tr>
    <th></th><th>Supranational</th><th>Intergouvernemental</th><th>National</th>
  </tr></thead>
  <tbody>
    <tr data-correct="Supranational">
      <td>Europäische Kommission</td>
      <td><input type="radio" name="zt1_r1" onclick="PLK.selZT(this)" value="Supranational"></td>
      <td><input type="radio" name="zt1_r1" onclick="PLK.selZT(this)" value="Intergouvernemental"></td>
      <td><input type="radio" name="zt1_r1" onclick="PLK.selZT(this)" value="National"></td>
    </tr>
  </tbody>
</table>
<button onclick="PLK.chkZT('zt1','zt1-result')">Überprüfen</button>
```

**Functions:** `PLK.selZT(el)` marks visual state on the row. `PLK.chkZT(tableId, fbId)` — compares each row's checked radio value to `data-correct`. 1 pt per correct row. `PLK.rstZT(tableId)` resets.

### 4.5 Markieren — Click to tag words

**HTML pattern:**
```html
<div class="mark-text" id="mk1" data-n="2">
  Die <span class="mk" data-correct="1" onclick="PLK.mkCl(this)">Europäische Kommission</span>
  hat das <span class="mk" onclick="PLK.mkCl(this)">alleinige</span>
  <span class="mk" data-correct="1" onclick="PLK.mkCl(this)">Initiativrecht</span>.
</div>
<button onclick="PLK.chkMark('mk1',2,'mk1-result')">Überprüfen</button>
<button onclick="PLK.rstMark('mk1')">Zurücksetzen</button>
```

**Functions:** `PLK.mkCl(el)` toggles `.mk-selected`. `PLK.chkMark(wrapId, n, fbId)` — all `data-correct="1"` spans selected and no others. `data-n` on wrapper = expected count (used for partial feedback). `PLK.rstMark(wrapId)` resets.

### 4.6 State Restore for New Types

Quiz-ext types store their state inside the existing `state.ab` progress blob (same model as `state.ab.texts`, `state.ab.slots`, etc.) so that `PLK.Progress.clear()` covers cleanup automatically — no separate key management needed.

`PLK._saveAbState()` and `PLK._restoreAbState()` in `engine.js` are extended with the following sub-keys:

| Type | `state.ab` sub-key | What is stored / restored |
|---|---|---|
| Dropdown Lückentext | `state.ab.drop[wrapId][slotIndex]` | Selected `<option>` value per slot |
| Selbsteinschätzung | `state.ab.self[wrapperId]` | Numeric rating (1–4); restore highlights button + marks done |
| Zuordnung-Tabelle | `state.ab.zt[tableId][rowIndex]` | Checked radio value per row |
| Markieren | `state.ab.mk[wrapId][spanIndex]` | Boolean selected state per `.mk` span |

Checkbox MC state is already handled by the existing quiz-gate radio/checkbox restore logic.

---

## 5. Namespace Migration

All `onclick="fn(...)"` and `onchange="fn(...)"` attributes in the following files are updated to `PLK.fn(...)`:

- `einheiten/3-2_lissabon.html`
- `einheiten/3-3_gesetzgebung.html`
- `einheiten/3-4_mehrebenensystem.html`
- `einheiten/3-5_binnenmarkt.html`
- `einheiten/_template.html`

**Additional inline expression migration** — the reset button pattern:
```html
<!-- Before -->
onclick="if(confirm('…')){Progress.clear(CONF.id);location.reload();}"
<!-- After -->
onclick="if(confirm('…')){PLK.resetUnit();}"
```

Migration is done via targeted find-replace per function name, not manual editing.

`progress.js` is deleted. Its `Progress.*` API is re-exposed as `PLK.Progress.*` in `engine.js`. The `CONF` object remains a plain global in each unit's inline `<script>` — no change needed there.

`einheiten/3-3_gesetzgebung.html.bak` is deleted as part of cleanup.

---

## 6. Script Load Order (all units)

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

`tooltips.js` remains a standalone IIFE — it reads `window._PLK_GLOSSARY` etc. and does not join the registry.

---

## 7. Template Additions (documentation only)

Six patterns from existing units added to `_template.html` as `<!-- OPTIONAL -->` blocks with `FILL:` comments:

1. `lk-note` — simple inline teacher note (no JS, CSS in style.css)
2. `badge badge-gold` — Klausurrelevant badge on SW block header
3. `saveAB(hintId)` — explicit save button alongside freitext
4. Denkanstöße / Reflexion block — phase-labeled discussion prompt
5. `mep-*` pyramid — Mehrebenensystem visual hierarchy diagram
6. `ums-flow` / `ums-title` — implementation example wrapper label

---

## 8. File Changes Summary

| File | Action |
|---|---|
| `js/engine.js` | Major refactor — registry + core only; quiz logic extracted; absorbs progress.js |
| `js/progress.js` | **Deleted** — merged into engine.js |
| `js/quiz-base.js` | **New** — all existing quiz types |
| `js/quiz-ext.js` | **New** — 5 new quiz types + state restore hooks |
| `js/uk-quiz.js` | Joins registry; closure-clobber bug fixed via `el.closest('.uk')` |
| `js/tooltips.js` | No change |
| `css/style.css` | Additive only — CSS for 5 new quiz types |
| `einheiten/3-2_lissabon.html` | Namespace migration + script tag update |
| `einheiten/3-3_gesetzgebung.html` | Namespace migration + script tag update |
| `einheiten/3-3_gesetzgebung.html.bak` | **Deleted** |
| `einheiten/3-4_mehrebenensystem.html` | Namespace migration + script tag update |
| `einheiten/3-5_binnenmarkt.html` | Namespace migration + script tag update |
| `einheiten/_template.html` | Namespace migration + new template options + script tag update |
| `docs/superpowers/specs/` | This spec |
