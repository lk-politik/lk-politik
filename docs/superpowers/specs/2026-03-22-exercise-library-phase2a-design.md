# Exercise Library Phase 2a — Design Spec

## Goal

Add four new interactive exercise types to the PLK exercise library: True/False, Odd-One-Out, Flashcard Recall, and Memory Card Game. These ship as a separate optional file (`quiz-lib2.js`) that units include alongside the existing `quiz-lib.js` when needed.

## Architecture

### New file: `js/quiz-lib2.js`

Same conventions as `quiz-lib.js`:
- All four types registered via `PLK.register({name, init})`
- **State hooks:** uses `PLK._saveLib2State` / `PLK._restoreLib2State` (distinct names from `quiz-lib.js`'s `PLK._saveLibState` / `PLK._restoreLibState`) to avoid collision when both files are loaded simultaneously. Engine.js must be updated to also call these hooks alongside the Phase 1 hooks.
- ES5 only — no `const`/`let`, no arrow functions, no template literals, no `NodeList.forEach`
- Fisher-Yates shuffle used wherever randomisation is needed

Units load it optionally:
```html
<script src="../js/quiz-lib2.js"></script>  <!-- after quiz-lib.js, only when needed -->
```

#### `_glossaryEmoji(term)` helper (defined in quiz-lib2.js)

A private helper used only by Memory Card rendering:
```javascript
function _glossaryEmoji(term) {
  return (window._PLK_GLOSSARY && window._PLK_GLOSSARY[term] &&
          window._PLK_GLOSSARY[term].emoji) || '📌';
}
```
Called **only** for `data-term` cards. Returns the glossary emoji, or `'📌'` as a neutral fallback if the term is not in the glossary.

### CSS: `css/style.css`

Four new sections appended (sections 58–61), one per exercise type, following the existing section-comment convention.

### `engine.js` update

Phase 1 already added these two lines to engine.js (they must not be duplicated):
```javascript
if (PLK._saveLibState)    PLK._saveLibState(ab, state);   // exists — DO NOT add again
if (PLK._restoreLibState) PLK._restoreLibState(ab, saved); // exists — DO NOT add again
```

Phase 2a adds **only** the two new lines immediately after each existing one:
```javascript
// After the existing _saveLibState call (save path):
if (PLK._saveLib2State) PLK._saveLib2State(ab, state);

// After the existing _restoreLibState call (restore path):
if (PLK._restoreLib2State) PLK._restoreLib2State(ab, saved);
```

### Documentation files

| File | Change |
|------|--------|
| `einheiten/_template.html` | Add optional `quiz-lib2.js` script comment |
| `einheiten/_ex/truefalse.html` | New detail page |
| `einheiten/_ex/oddoneout.html` | New detail page |
| `einheiten/_ex/flashcard-recall.html` | New detail page |
| `einheiten/_ex/memory-cards.html` | New detail page |
| `einheiten/_exercises.html` | Four new exercise cards in existing sections |

---

## Exercise Type Specifications

### 1. True/False (`wahr-falsch`)

**HTML contract:**

```html
<div class="aufgabe" data-type="wahr-falsch" data-id="auf1">
  <div class="tf-item" data-correct="true">
    Das Europäische Parlament wird direkt von den EU-Bürgern gewählt.
  </div>
  <div class="tf-item" data-correct="false"
       data-explain="Der Europäische Rat gibt Leitlinien vor, hat aber keine Gesetzgebungsbefugnis.">
    Der Europäische Rat beschließt EU-Gesetze.
  </div>
</div>
```

- `data-correct`: `"true"` or `"false"` — the correct answer
- `data-explain` (optional): only valid on `data-correct="false"` items. Shown only when the student tapped "Wahr" on a false statement (wrong answer on a false item). Ignored on `data-correct="true"` items even if the attribute is present — no explanation panel appears for wrong answers on true statements; the red/green button highlights are the sole feedback in that case.

**Behaviour:**

1. Items shuffled on init and on reset
2. One statement displayed at a time in a full-width card
3. Two large tap buttons: ✓ Wahr / ✗ Falsch
4. After tap: both buttons disabled; correct button highlighted green, wrong button (if tapped) highlighted red — these highlights remain visible until the student advances or completion fires
5. If answer was wrong AND item has `data-correct="false"` AND `data-explain` is present: explanation panel slides in below buttons
6. "Weiter →" button appears 400 ms after answer tap — except on the last item
7. Last item: buttons stay highlighted (same as any other item); no "Weiter →" button appears; completion fires automatically 1 000 ms after the answer tap. No other visual change happens during that 1 000 ms window.
8. Completion banner shows score (correct / total); "↺ Neu starten" resets and reshuffles
9. Progress dots row at top: grey → cyan (active) → green (correct) / red (wrong)

**State saved:** current index, results array, shuffled order — restored on tab return.

---

### 2. Odd-One-Out (`odd-one-out`)

**HTML contract:**

```html
<div class="aufgabe" data-type="odd-one-out" data-id="auf2">
  <div class="ooo-round"
       data-question="Welches Organ ist &lt;strong&gt;nicht&lt;/strong&gt; an der Gesetzgebung beteiligt?">
    <div class="ooo-opt" data-emoji="🗳️" data-sub="Wählt Gesetze mit">Europäisches Parlament</div>
    <div class="ooo-opt" data-emoji="📋" data-sub="Ministerrat">Rat der EU</div>
    <div class="ooo-opt" data-emoji="⚙️" data-sub="Initiativrecht">Europäische Kommission</div>
    <div class="ooo-opt" data-emoji="👑" data-sub="Gipfeltreffen der Staatschefs" data-odd="true"
         data-explain="Der Europäische Rat gibt politische Leitlinien vor, beschließt aber keine Gesetze.">
      Europäischer Rat
    </div>
  </div>
</div>
```

- Exactly one `data-odd="true"` per round
- `data-explain` (optional): explanation shown after correct identification
- Supports 3 or 4 options per round; grid adjusts (4 → 2×2, 3 → 3-column single row)

**Behaviour:**

1. Rounds shuffled; items within each round shuffled
2. Question text displayed above the grid
3. Wrong tap: card shakes red for 400 ms, then returns to default styling (normal border, normal background) but remains non-interactive (pointer-events none, opacity 0.45). A feedback text "Das gehört zur Gruppe" appears and is cleared after 1 500 ms — or immediately when the correct card is tapped, whichever comes first (cancel the feedback timer on correct tap). This means a student who exhausts all wrong cards is left with only the correct card tappable — this is intentional (process of elimination is a valid strategy).
4. Correct tap: odd card gets red border + "Außenseiter" badge; remaining non-locked cards fade to green; explanation panel slides in (if present)
5. "Weiter →" appears 500 ms after correct tap — except on last round
6. Last round: completion triggered 1 000 ms after correct tap
7. Completion banner shows score: 1 point per round where the odd card was identified on the first tap. Subsequent correct taps (after wrong guesses) score 0 for that round. Format: "X von Y Runden beim ersten Versuch erkannt."
8. "↺ Neu starten" resets all rounds and reshuffles

**State saved:** current round index, results, per-round wrong-guessed item indices — restored on tab return.

---

### 3. Flashcard Recall (`flashcard-recall`)

**HTML contract:**

```html
<div class="aufgabe" data-type="flashcard-recall" data-id="auf3">
  <div class="fcr-card" data-term="Subsidiaritätsprinzip" data-correct="0">
    <div class="fcr-choice">Entscheidungen auf der niedrigsten geeigneten Ebene — die EU handelt nur, wenn Mitgliedstaaten überfordert sind.</div>
    <div class="fcr-choice">Alle Mitgliedstaaten erhalten gleiche Stimmrechte im Ministerrat, unabhängig von ihrer Größe.</div>
    <div class="fcr-choice">Die EU muss Gesetze mit Zweidrittelmehrheit des Europäischen Parlaments verabschieden.</div>
  </div>
</div>
```

- `data-correct`: zero-based index of the correct `.fcr-choice` child, **in source (DOM) order, before any shuffling**. The implementer must store the shuffled index array (e.g., `[2, 0, 1]`) alongside the card state, and identify the correct answer by matching the displayed choice's source index against `data-correct` — not by its rendered position. On each reshuffle a new array is generated and stored, replacing the old one.
- Three choices per card (exactly)

**Behaviour:**

1. All term cards displayed simultaneously in a 2-column grid
2. Card states: default (grey border) → active (blue, choice panel open) → done (green, `done: true`) → missed (red border, re-tappable)
3. Tap a card → choice panel opens below grid, choices rendered in shuffled order
4. Correct choice: card's `done` flag set to `true`, card turns green; panel auto-advances to next card where `done === false` after 900 ms
5. Wrong choice: correct choice highlighted green, wrong choice highlighted red; card's `missed` flag set to `true`, card border turns red; choices reshuffle after 1 800 ms; card remains tappable
6. **"All done"** means all cards have `done === true`. Cards with `missed: true` that are later answered correctly transition to `done: true` — a missed card that is eventually answered correctly is still "done." Completion requires every card to be `done`.
7. On completion: choice panel folds away (CSS `max-height` transition to 0); each card expands to show term + the text of the correct choice below it
8. Completion banner; "↺ Zurücksetzen" resets all `done`/`missed` flags and reshuffles all choice orders
9. Choices reshuffled on every card open and on every reset (Fisher-Yates applied to `[0,1,2]` index array)

**State saved:** per-card `done`, `missed`, `chosen`, shuffled choice order — restored on tab return.

---

### 4. Memory Card Game (`memory-cards`)

**HTML contract:**

```html
<div class="aufgabe" data-type="memory-cards" data-id="auf4">

  <!-- Mode A: glossary term ↔ competency text -->
  <div class="mc-pair"
       data-term="Europäisches Parlament"
       data-match="Wählt Gesetze mit, kontrolliert die Kommission, genehmigt den Haushalt.">
  </div>

  <!-- Mode B: person ↔ role (photo from data/persons/<key>.jpg) -->
  <div class="mc-pair"
       data-person="von-der-leyen"
       data-name="Ursula von der Leyen"
       data-match="Präsidentin der Europäischen Kommission">
  </div>

  <!-- Mode C: non-glossary label ↔ objective (neutral 📜) -->
  <div class="mc-pair"
       data-label="Vertrag von Maastricht"
       data-match="Gründung der EU; Einführung der Unionsbürgerschaft (1992).">
  </div>

</div>
```

**Blue card rendering (term/person/label side):**

| Attribute present | Emoji/image | Display |
|-------------------|-------------|---------|
| `data-term` | `_glossaryEmoji(term)` — see helper above | emoji + term name |
| `data-person` + `data-name` | `<img>` from `data/persons/<key>.jpg` | photo circle + name |
| `data-label` | Always `📜` (hardcoded) | `📜` + label text |

`_glossaryEmoji()` is called **only** for `data-term` cards. `data-label` cards always get `📜` directly — `_glossaryEmoji()` is never called for them.

**Person card image fallback:** The `<img>` element has an `onerror` handler that:
1. Hides the broken `<img>` element (`this.style.display = 'none'`)
2. Appends a sibling `<svg>` element (inline) showing a coloured circle with the initials of `data-name`. Initials are always the **first character of the first word + first character of the last word** of `data-name`, uppercased (e.g., "Ursula von der Leyen" → "UL", "António Costa" → "AC", "Kaja Kallas" → "KK"). This two-character rule applies regardless of how many words are in the name.

**Grey card rendering (match side):** `data-match` text only, no emoji.

**Behaviour:**

1. All pairs (blue + grey) expanded into a flat array of individual cards, then shuffled (Fisher-Yates) into a single 2-column grid. With N pairs: 2N cards total.
2. Cards start face-down
3. Tap one card → flips face-up, highlighted
4. Tap a second card → match check:
   - **Match:** both stay face-up, border turns green, pair is permanently matched
   - **No match:** both remain face-up and visible for 2 000 ms (students can read both), then flip back face-down; move counter increments on every second-card tap regardless of outcome
5. Cannot flip a third card while two are face-up (taps ignored during the 2 000 ms wait)
6. Completion banner when all pairs matched; shows total move count; "↺ Neu mischen" reshuffles grid

**Card identity:** Each `.mc-pair` element is assigned a **pair ID** equal to its zero-based source index (0, 1, 2, …). Each rendered card carries a `data-pair-id` attribute (the pair ID) and a `data-side` attribute (`"blue"` or `"grey"`). Together `data-pair-id` + `data-side` uniquely identify every card in the grid and in saved state.

**State saved:** array of matched pair IDs, pair IDs of currently face-up card(s) (at most 2), move count, full shuffled card order (array of `{pairId, side}` objects) — restored on tab return.

---

## File Structure Summary

```
js/
  quiz-lib2.js           ← new
  engine.js              ← 2 additional hook calls for _saveLib2State / _restoreLib2State

css/
  style.css              ← sections 58–61 appended

einheiten/
  _template.html         ← quiz-lib2.js optional script comment added
  _exercises.html        ← 4 new exercise cards
  _ex/
    truefalse.html       ← new
    oddoneout.html       ← new
    flashcard-recall.html ← new
    memory-cards.html    ← new

data/
  persons/               ← new directory
    von-der-leyen.jpg    ← download from Wikimedia Commons (CC-BY-SA): File:Ursula_von_der_Leyen_(51558021872).jpg
    metsola.jpg          ← File:Roberta_Metsola_2022.jpg
    costa.jpg            ← File:António_Costa_2022_(cropped).jpg
    kallas.jpg           ← File:Kaja_Kallas_2023.jpg
```

## Notes

- `data/persons/` images are downloaded once manually from Wikimedia Commons (CC-BY-SA licensed). Automated fetching is blocked by Wikipedia's bot protection.
- All exercise types degrade gracefully if `quiz-lib2.js` is absent — engine ignores unknown `data-type` values.
- iPad/touchscreen is the primary interaction surface — all interactions are tap-based, no drag-and-drop.
- `quiz-lib2.js` and `quiz-lib.js` may be loaded together in the same unit without conflict: they use separate state hook names (`_saveLib2State` vs `_saveLibState`).
