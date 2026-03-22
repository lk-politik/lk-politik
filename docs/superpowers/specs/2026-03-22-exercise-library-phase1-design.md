# Exercise Library Phase 1 — Design Spec
**Date:** 2026-03-22
**Project:** Politik-LK Digitale Lerneinheiten
**Status:** Approved for implementation

---

## 1. Goal

Build a universal exercise library from which Claude can select the best-fitting types when authoring new units. Phase 1 covers 6 genuinely new lightweight types (plus Spot the Error which reuses existing code). All types integrate with the existing PLK module system, ES5 constraint applies throughout.

The library is a three-tier reference system:
- `einheiten/_template.html` → structure skeleton only, points to exercises index
- `einheiten/_exercises.html` → index of all available exercise types
- `einheiten/_ex/<type>.html` → one detail file per type with full copy-paste HTML, JS signatures, CSS classes, state key, and a worked Politik-LK example

---

## 2. File Changes Summary

| File | Action |
|---|---|
| `einheiten/_template.html` | Remove all exercise HTML snippets; add comment pointing to `_exercises.html` |
| `einheiten/_exercises.html` | **New** — index of all exercise types (existing + new) |
| `einheiten/_ex/` | **New directory** — one detail file per type |
| `einheiten/_ex/mc-radio.html` | Existing: Radio MC |
| `einheiten/_ex/mc-checkbox.html` | Existing: Checkbox MC |
| `einheiten/_ex/gap-chips.html` | Existing: Lückentext (chip-slot) |
| `einheiten/_ex/gap-dropdown.html` | Existing: Dropdown Lückentext |
| `einheiten/_ex/order-list.html` | Existing: Sequence Ordering |
| `einheiten/_ex/zuordnung.html` | Existing: Zuordnung (click-pairs) |
| `einheiten/_ex/zuordnung-table.html` | Existing: Zuordnung-Tabelle (radio matrix) |
| `einheiten/_ex/kategorisierung.html` | Existing: Kategorisierung |
| `einheiten/_ex/markieren.html` | Existing: Markieren |
| `einheiten/_ex/spot-error.html` | Existing JS (Markieren), new CSS modifier + framing doc |
| `einheiten/_ex/selbsteinschaetzung.html` | Existing: Selbsteinschätzung |
| `einheiten/_ex/freitext.html` | Existing: Freitext |
| `einheiten/_ex/uk-pruefen.html` | Existing: UK Prüfen |
| `einheiten/_ex/timeline.html` | **New** |
| `einheiten/_ex/flashcard.html` | **New** |
| `einheiten/_ex/slider.html` | **New** |
| `einheiten/_ex/def-match.html` | **New** |
| `einheiten/_ex/sort-buckets.html` | **New** |
| `einheiten/_ex/build-concept.html` | **New** |
| `js/quiz-lib.js` | **New** — PLK module for 6 new types |
| `js/engine.js` | Additive — two new hook calls: `PLK._saveLibState` and `PLK._restoreLibState` |
| `css/style.css` | Additive — CSS for 6 new types + spot-error modifier |

---

## 3. Three-Tier Library Structure

### 3.1 `_template.html` Changes

All `<!-- OPTIONAL -->` exercise HTML blocks are removed. Replaced with a single comment:

```html
<!-- ═══════════════════════════════════════════════════════════════
     EXERCISE TYPES: see einheiten/_exercises.html for all patterns.
     Copy the HTML snippet from the matching _ex/<type>.html file.
     ═══════════════════════════════════════════════════════════════ -->
```

Everything else in `_template.html` is unchanged: CONF block, gate structure, script load order, progress/reset boilerplate.

### 3.2 `_exercises.html` — Index File

One card per exercise type. Each card contains:
- **Name** and **file** (`_ex/<type>.html`)
- **When to use** — 1-sentence pedagogical guidance
- **Interaction** — the core mechanic in 3 words
- **JS module** — which file provides the functions

Exercises grouped into three sections: **Auswahl & Zuordnung**, **Eingabe & Schätzen**, **Selbstreflexion & Bewertung**.

### 3.3 `einheiten/_ex/` — Detail Files

Each detail file (plain HTML, no `<head>` boilerplate needed — just content) contains:

1. **When to use** — 2–3 sentences with example learning objective fit
2. **HTML pattern** — complete copy-paste snippet with `FILL:` comments for parameterization
3. **JS functions** — each function signature with parameter descriptions
4. **CSS classes** — list of classes used and their visual role
5. **State save/restore key** — the `state.ab.*` sub-key used
6. **Worked example** — a concrete Politik-LK exercise using the type

Existing types (mc-radio, gap-chips, etc.) get detail files written from their current usage in the units — no JS changes needed.

---

## 4. New Exercise Types (`js/quiz-lib.js`)

Registers as `'quiz-lib'`. Added after quiz-ext.js in script load order.

### 4.1 Timeline Placement

Student clicks event chips and places them into labelled year/period slots.

**HTML pattern:**
```html
<div class="tl-wrap" id="tl1">
  <!-- Chip bank -->
  <div class="tl-bank" id="tl1-bank">
    <span class="tl-chip" data-id="a" onclick="PLK.tlSel(this)">Vertrag von Maastricht</span>
    <span class="tl-chip" data-id="b" onclick="PLK.tlSel(this)">Brexit-Referendum</span>
  </div>
  <!-- Slots -->
  <div class="tl-slots">
    <div class="tl-slot" data-correct="b" data-label="2016" onclick="PLK.tlDrop(this)">2016</div>
    <div class="tl-slot" data-correct="a" data-label="1992" onclick="PLK.tlDrop(this)">1992</div>
  </div>
</div>
<button onclick="PLK.chkTL('tl1','tl1-result')">Überprüfen</button>
<button onclick="PLK.rstTL('tl1')">Zurücksetzen</button>
<div id="tl1-result"></div>
```

**Functions:**
- `PLK.tlSel(el)` — selects a chip from the bank (sets active chip)
- `PLK.tlDrop(el)` — places active chip into clicked slot
- `PLK.chkTL(wrapId, fbId)` — compares each slot's placed chip `data-id` to `data-correct`; 1 pt per correct slot
- `PLK.rstTL(wrapId)` — returns all chips to bank, clears slots

**State key:** `state.ab.tl[wrapId][slotIndex]` → chip `data-id` placed there

### 4.2 Flashcard Recall

CSS flip animation: term on front, definition on back. Optional active recall mode: student types answer before flipping.

**HTML pattern:**
```html
<div class="fc-set" id="fc1">
  <div class="fc-card" id="fc1_1">
    <div class="fc-inner">
      <div class="fc-front">
        <div class="fc-term">Subsidiaritätsprinzip</div>
        <button class="fc-flip-btn" onclick="PLK.fcFlip(this)">Aufdecken</button>
      </div>
      <div class="fc-back">
        <div class="fc-def">Entscheidungen sollen auf der kleinstmöglichen politischen Ebene getroffen werden.</div>
        <button class="fc-flip-btn" onclick="PLK.fcFlip(this)">Zurück</button>
      </div>
    </div>
  </div>
</div>
<button onclick="PLK.rstFC('fc1')">Zurücksetzen</button>
```

**Functions:**
- `PLK.fcFlip(el)` — toggles `.fc-flipped` on parent `.fc-card`; marks card as seen in state
- `PLK.rstFC(setId)` — resets all cards in set to front-face

**Scoring:** Flashcard does not award AB points. Seeing/flipping a card is completion tracking only — `PLK.upAB()` is never called. This is intentional: flashcards are a review tool, not a graded activity.

**State key:** `state.ab.fc[cardId]` → `'seen'` (sufficient — no scoring, completion tracking only)

### 4.3 Slider Estimation

`<input type="range">` with a correct answer and a tolerance band. Live value display. On check: shows correct value, colors the track.

**HTML pattern:**
```html
<div class="sldr-wrap" id="sldr1">
  <div class="sldr-q">Wie viel Prozent der EU-Gesetze werden im ordentlichen Gesetzgebungsverfahren beschlossen?</div>
  <div class="sldr-row">
    <span class="sldr-lo">0 %</span>
    <input type="range" class="sldr-input" min="0" max="100" value="50"
           data-correct="80" data-tol="10"
           oninput="PLK.sldrLive(this)">
    <span class="sldr-hi">100 %</span>
  </div>
  <div class="sldr-val">50 %</div>
</div>
<button onclick="PLK.chkSlider('sldr1','sldr1-result')">Überprüfen</button>
<button onclick="PLK.rstSlider('sldr1')">Zurücksetzen</button>
<div id="sldr1-result"></div>
```

`data-correct` = correct numeric value. `data-tol` = ± tolerance (default 5 if omitted).

**Functions:**
- `PLK.sldrLive(el)` — updates `.sldr-val` display on input event
- `PLK.chkSlider(wrapId, fbId)` — checks each `.sldr-input`, correct if `|value - data-correct| <= data-tol`; shows correct value in feedback
- `PLK.rstSlider(wrapId)` — resets all sliders to their original `value` attribute (stored as `data-default` on each input at init time)

**State key:** `state.ab.sldr[wrapId][sliderIndex]` → numeric value

### 4.4 Definition → Term Match

Two-panel click matching: definitions on left, term bank on right. Click a definition to select it, then click a term to pair them. Paired items visually linked with a connector.

**HTML pattern:**
```html
<div class="dm-wrap" id="dm1">
  <div class="dm-defs">
    <div class="dm-def" data-id="d1" onclick="PLK.dmSel(this,'def')">Hat das alleinige Initiativrecht für EU-Gesetze.</div>
    <div class="dm-def" data-id="d2" onclick="PLK.dmSel(this,'def')">Vertritt die nationalen Regierungen der Mitgliedstaaten.</div>
  </div>
  <div class="dm-terms">
    <div class="dm-term" data-id="t1" data-correct-def="d1" onclick="PLK.dmSel(this,'term')">Europäische Kommission</div>
    <div class="dm-term" data-id="t2" data-correct-def="d2" onclick="PLK.dmSel(this,'term')">Rat der EU</div>
  </div>
</div>
<button onclick="PLK.chkDM('dm1','dm1-result')">Überprüfen</button>
<button onclick="PLK.rstDM('dm1')">Zurücksetzen</button>
<div id="dm1-result"></div>
```

`data-correct-def` on each term identifies which definition it matches.

**Functions:**
- `PLK.dmSel(el, side)` — selects a def or term; if both sides have a selection, pairs them (sets `data-paired` attributes, adds visual connection class)
- `PLK.chkDM(wrapId, fbId)` — checks each term's `data-paired` value against `data-correct-def`; 1 pt per correct pair
- `PLK.rstDM(wrapId)` — clears all pairings

**State key:** `state.ab.dm[wrapId]` → `{termId: defId, …}` map of pairings

### 4.5 Sort into Buckets

Freestanding item chips; click to select, click a bucket to place. Distinct from Kategorisierung (which assigns items from a fixed column list). Best for pro/con, 2–4 category sorts.

**HTML pattern:**
```html
<div class="sb-wrap" id="sb1">
  <div class="sb-bank" id="sb1-bank">
    <span class="sb-chip" data-correct="pro" onclick="PLK.sbSel(this)">Freizügigkeit für alle EU-Bürger</span>
    <span class="sb-chip" data-correct="con" onclick="PLK.sbSel(this)">Höhere Regulierungsdichte</span>
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
<button onclick="PLK.chkSB('sb1','sb1-result')">Überprüfen</button>
<button onclick="PLK.rstSB('sb1')">Zurücksetzen</button>
<div id="sb1-result"></div>
```

**Functions:**
- `PLK.sbSel(el)` — marks chip as active selection (clears previous)
- `PLK.sbDrop(el)` — moves active chip into clicked bucket's `.sb-bucket-items`
- `PLK.chkSB(wrapId, fbId)` — checks each chip's current bucket against `data-correct`; 1 pt per correct placement
- `PLK.rstSB(wrapId)` — returns all chips to bank

**State key:** `state.ab.sb[wrapId][chipIndex]` → `bucketId` placed in, or `null` if in bank

### 4.6 Build-a-Concept

A set of chips — some correct components of a concept, some distractors. Student toggles which belong. On check: correct selections shown in green, wrong selections and missed items shown.

**HTML pattern:**
```html
<div class="bc-wrap" id="bc1" data-concept="EU-Gesetzgebungsorgane">
  <div class="bc-prompt">Welche Organe sind am ordentlichen Gesetzgebungsverfahren beteiligt?</div>
  <div class="bc-chips">
    <span class="bc-chip" data-correct="1" onclick="PLK.bcTog(this)">Europäisches Parlament</span>
    <span class="bc-chip" data-correct="1" onclick="PLK.bcTog(this)">Rat der EU</span>
    <span class="bc-chip" onclick="PLK.bcTog(this)">Europäischer Gerichtshof</span>
    <span class="bc-chip" data-correct="1" onclick="PLK.bcTog(this)">Europäische Kommission</span>
    <span class="bc-chip" onclick="PLK.bcTog(this)">Europäische Zentralbank</span>
  </div>
</div>
<button onclick="PLK.chkBC('bc1','bc1-result')">Überprüfen</button>
<button onclick="PLK.rstBC('bc1')">Zurücksetzen</button>
<div id="bc1-result"></div>
```

**Functions:**
- `PLK.bcTog(el)` — toggles `.bc-selected` on chip
- `PLK.chkBC(wrapId, fbId)` — all `data-correct="1"` chips must be selected, no others; 1 pt per chip handled correctly
- `PLK.rstBC(wrapId)` — clears all selections

**State key:** `state.ab.bc[wrapId][chipIndex]` → boolean selected state

### 4.7 Spot the Error (no new JS)

Uses `PLK.mkCl()`, `PLK.chkMark()`, `PLK.rstMark()` from quiz-ext.js without modification. The `spot-error.html` detail file documents this reuse. State stored under existing `state.ab.mk`.

The only difference from Markieren is the CSS modifier class and the content framing (find the errors, not find key terms):

```html
<!-- The sole HTML difference: add 'spot-error' to the mark-text div -->
<div class="mark-text spot-error" id="mk1" data-n="2">
  Die <span class="mk" onclick="PLK.mkCl(this)">Europäische Kommission</span>
  hat das <span class="mk" data-correct="1" onclick="PLK.mkCl(this)">alleinige Initiativrecht</span>
  und ist direkt vom <span class="mk" data-correct="1" onclick="PLK.mkCl(this)">Europäischen Parlament</span> gewählt.
</div>
<button onclick="PLK.chkMark('mk1',2,'mk1-result')">Überprüfen</button>
<button onclick="PLK.rstMark('mk1')">Zurücksetzen</button>
```

`.mark-text.spot-error` (CSS section 57) applies a red-tinted background and a crosshair cursor to distinguish the "find errors" framing visually.

---

## 5. CSS Additions (`css/style.css`)

Additive sections appended after existing section 50:

| Section | Classes |
|---|---|
| 51 — Timeline | `.tl-wrap`, `.tl-bank`, `.tl-chip`, `.tl-chip.active`, `.tl-slots`, `.tl-slot`, `.tl-slot.filled` |
| 52 — Flashcard | `.fc-set`, `.fc-card`, `.fc-inner`, `.fc-front`, `.fc-back`, `.fc-card.fc-flipped`, `.fc-term`, `.fc-def`, `.fc-flip-btn` |
| 53 — Slider | `.sldr-wrap`, `.sldr-q`, `.sldr-row`, `.sldr-lo`, `.sldr-hi`, `.sldr-input`, `.sldr-val`, `.sldr-input.correct`, `.sldr-input.wrong` |
| 54 — Def-Match | `.dm-wrap`, `.dm-defs`, `.dm-terms`, `.dm-def`, `.dm-term`, `.dm-def.active`, `.dm-term.active`, `.dm-def.paired`, `.dm-term.paired` |
| 55 — Sort Buckets | `.sb-wrap`, `.sb-bank`, `.sb-chip`, `.sb-chip.active`, `.sb-buckets`, `.sb-bucket`, `.sb-bucket-label`, `.sb-bucket-items` |
| 56 — Build-a-Concept | `.bc-wrap`, `.bc-prompt`, `.bc-chips`, `.bc-chip`, `.bc-chip.bc-selected`, `.bc-chip.bc-correct`, `.bc-chip.bc-wrong` |
| 57 — Spot Error modifier | `.mark-text.spot-error` |

---

## 6. State Save/Restore

quiz-lib.js provides its own private `_saveLib(ab, state)` and `_restoreLib(ab, saved)` functions, exposed on `PLK` as `PLK._saveLibState` / `PLK._restoreLibState`. This is the same bridge pattern as quiz-ext.js.

`engine.js` is extended with two new hook calls alongside the existing quiz-ext hooks:

```javascript
// Inside _saveAbState() — these three lines must appear together in this order:
if (PLK._saveExtState) PLK._saveExtState(ab, state);   // existing
if (PLK._saveLibState) PLK._saveLibState(ab, state);   // new — insert here
PLK.Progress.save(CONF.id, existing);                  // existing — must be last

// Inside _restoreAbState(), at end — append after existing line:
if (PLK._restoreExtState) PLK._restoreExtState(ab, saved);  // existing
if (PLK._restoreLibState) PLK._restoreLibState(ab, saved);  // new — append
```

This ensures quiz-lib state is persisted and restored even if quiz-lib.js is not loaded on a given unit (the guards `if (PLK._saveLibState)` prevent errors).

| Type | `state.ab` sub-key |
|---|---|
| Timeline | `state.ab.tl[wrapId][slotIndex]` → chip `data-id` |
| Flashcard | `state.ab.fc[cardId]` → `'seen'` |
| Slider | `state.ab.sldr[wrapId][sliderIndex]` → numeric value |
| Def-Match | `state.ab.dm[wrapId]` → `{termId: defId}` |
| Sort Buckets | `state.ab.sb[wrapId][chipIndex]` → `bucketId` or `null` |
| Build-a-Concept | `state.ab.bc[wrapId][chipIndex]` → boolean |

---

## 7. Script Load Order (all units, after this spec)

```html
<script src="../js/engine.js"></script>
<script src="../js/quiz-base.js"></script>
<script src="../js/quiz-ext.js"></script>
<script src="../js/quiz-lib.js"></script>
<script src="../js/uk-quiz.js"></script>
<script src="../data/glossary.js"></script>
<script src="../data/operators.js"></script>
<script src="../data/units.js"></script>
<script src="../js/tooltips.js"></script>
```

`quiz-lib.js` is only added to unit HTML files that actually use library types. Units using only existing types do not need this script tag.

---

## 8. `_exercises.html` Index Structure

Three sections, each listing exercise types as cards:

**Section A — Auswahl & Zuordnung**
Radio MC, Checkbox MC, Zuordnung, Zuordnung-Tabelle, Kategorisierung, Markieren, Spot the Error, Sort into Buckets, Build-a-Concept, Timeline, Definition → Term Match, Sequence Ordering

**Section B — Eingabe & Schätzen**
Freitext, Lückentext (Chips), Lückentext (Dropdown), Slider Estimation

**Section C — Selbstreflexion & Bewertung**
Selbsteinschätzung, UK Prüfen, Flashcard

Each card: name, `_ex/<file>.html` link, 1-sentence when-to-use, interaction label, JS module.
