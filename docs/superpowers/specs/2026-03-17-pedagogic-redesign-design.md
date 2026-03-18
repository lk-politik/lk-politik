# SLP Politik-LK — Pedagogical Redesign
**Date:** 2026-03-17
**Scope:** Full didactic and visual redesign of the digital learning unit system

---

## Background

Chapter 3 covers 20 units on the EU. The same system must work across all chapters:
- Europäische Union (Chapter 3, 20 units — current focus)
- Gesellschaft im Wandel
- Grundwerte und Grundrechte in der politischen Ordnung der BRD
- Internationale Politik
- Wirtschaft
- Entwicklungszusammenarbeit
- Politische Systeme

The core problem: all blocks share the same visual pattern → reading fatigue, no cognitive signposting, and the most important competency (Urteilskompetenz / AB III) has no dedicated scaffold.

---

## Core Pedagogical Model

### The AB Arc

AB levels are **cumulative**, not parallel. Each builds on the previous:

| Level | Competency | What students do |
|---|---|---|
| AB I | Facts | State what theory, norm, or material says |
| AB II | Understanding + Explaining | Identify connections, conflicts, and issues between theory and case/material (including perspectives) — and articulate them clearly in writing |
| AB III | Political maturity | Form an illuminated, critical, argued opinion built on AB I + II |

The AB arc is a **tool**, not a mandatory template for every unit. It must be trained periodically on high-Abitur-relevance topics for spaced repetition. 20 units need variety — methods adapt to lesson content and objectives, not the reverse.

### Lesson Mode

Every unit is designed for one of two primary modes. **Mode is declared by the content author and determines which blocks are included in the digital unit.** Format (Arc, Case dive, etc.) is independent of mode — the same topic can be taught in either mode.

#### Soziales Lernen (social / analog)

Goal: develop political competencies through cooperation, role play, expert work, structured debate, or simulation. These are the high-engagement lessons students find most motivating.

- The **digital unit is a knowledge scaffold only**: `einstieg` + `sw` + `qg` blocks. Students work through it quickly to reach the required knowledge base.
- The analog social activity (Expertenmethode, Rollenspiel, Fishbowl-Debatte, Karusselldiskussion, etc.) follows immediately and is described in teacher notes — **not** in the HTML.
- No `ab2`, no `uk`, no Arbeitsblatt exercises in the HTML. The social activity IS the exercise.
- Time management priority: minimize time on digital blocks so maximum time goes to the social activity.

#### AB-Training (formal competency)

Goal: train Abitur-relevant writing competencies. Students produce full written responses in their notebooks. Time-intensive — one full lesson or more.

Three sub-modes, used in progression as the year advances:

| Sub-mode | What it trains | Blocks included |
|---|---|---|
| **AB I + II** | Knowledge recall + written analysis | `sw` → `qg` → `ab2` → Arbeitsblatt |
| **AB III** | Full judgment scaffold | `sw` → `qg` → `ab2` → `uk` (interactive + written synthesis in notebook) |
| **Kombiniert** | Full arc, used when approaching Abitur | Complete sequence: all block types |

In AB-Training mode, the `uk` interactive block is used **in class together** — students work through the MCQ to identify the correct argumentation structure, then write their own full-text judgment (Einleitung → Hauptteil → Schlussfolgerung) in their notebooks using the scaffold as a guide.

**Author decision rule:** default to Soziales Lernen unless the unit is explicitly designated as AB-Training. Most units in the 20-unit chapter should be social — AB-Training units are scheduled deliberately for spaced repetition of exam competencies.

### Du-Form

All student-facing instructions use du-form ("Nenne das Konzept", not "Nennen Sie das Konzept").

### No Named External Methods

No "Dreischritt" or similar external method names. The system works directly from AB levels. The scaffold teaches the method by doing it.

---

## Content Type Vocabulary

All blocks use the same CSS/JS primitives. The unit format is the sequence and selection.

### Knowledge Tier (cyan system identity — `--sw`)
- **`sw`** — Sachwissen block. White card, amber left border, `📘 SACHWISSEN` badge in cyan (system color, independent of unit accent). Fachbegriffe (`<strong class="fb">`) in bold amber underline. May contain numbered lists with bold accent counters. `data-p="core|imp|ctx"` for priority tagging.
- **`einstieg`** — Unit opening hook. Appears once per unit. Amber full border, serif heading. **Always visible** — never locked, not part of the QG unlock chain. Sets context before students enter the knowledge sequence.

### Gating Tier (warm gray, low visual weight)
- **`qg`** — Verständnischeck gate. Warm gray background, minimal mono header. AB I badge per question. Status: Offen / Bestanden. Unlocks next SW block (and any `ab2` or `uk` blocks carrying `data-gate="N"` where N = this gate's number).

### Task Tier — Main Arc (escalating visual weight through the arc)

- **`.ab2`** (AB-II-Analyse) — Arc-integrated AB II analysis task. White card, amber 4px left border, `AB II` badge + operator verb. A single open-ended prompt — students write a free-text response; no auto-validation. HTML class: `ab2`. **Unlock behavior:** `data-gate="N"` attribute; revealed when QG gate N passes. One `.ab2` block typically appears between two SW blocks. IDs follow pattern `ab2-{n}`.

- **`.uk`** — Urteilskompetenz block (AB III). Visually breaks the pattern: amber full border (2px), inverted amber header (white text on amber background). **Unlock behavior:** `data-gate="N"` on the final gate; always the last block in the unit. **Interactive MCQ** — not open-ended text. Structured as Einleitung → Hauptteil → Schlussfolgerung with 6 named steps (see UK Block section below). Students select one option per step from 3 choices; one correct, two distractors with typed error labels. Submit validates all at once. IDs follow pattern `uk{n}`.

**Unlock chain — Arc format example:**
`sw1` (visible) → `qg1` passes → `sw2` + `ab2-1` revealed → `qg2` passes → `sw3` + `ab2-2` revealed → `qg3` passes → `uk1` revealed. Multiple blocks can share the same `data-gate` value and all reveal simultaneously when that gate passes.

### Arbeitsblatt Tier (separate section, unlocks when all QGs pass)

The `#arbeitsblatt` section is gated as a whole — it unlocks once every `qg` in the unit is passed. Within it, exercises use two classes:

- **`.auf`** (Aufgabe — Arbeitsblatt exercise) — Numbered task card (`.auf-n` large serif number, `.auf-h` header, `.auf-tags` with LZ/Klausurrelevant pills). Three subtypes, selected by the author; all use the `.auf` wrapper:
  - **`zuordnung`** — Chip-bank matching. A pool of draggable chips (`<span class="chip">`) and target slots (`<span class="slot">`). Validated with `chkSl()`. Use for concept→example mapping (e.g., four freedoms to cases).
  - **`kategorisierung`** — Binary or multi-column sort. Each item has N buttons; student picks the correct category. Validated with `chkK()`. Use for Vorteil/Herausforderung, Pro/Contra, etc.
  - **`lückentext`** — Fill-in-the-blank. Inline input fields; validated against correct values. Use for recalling definitions or completing causal chains.

- **`.reflexion`** (Reflexionsaufgabe) — Open-ended written response prompt. No textarea — students write on paper or in a separate tool. Has a word-count guidance and a structured task prompt. Not auto-validated. AB II or AB III level depending on the prompt. Use when the unit calls for an extended personal reflection that sits outside the main AB arc.

### Support Tier
- **Operator badge** — `<span class="op-badge" data-op="erläutern">erläutern · AB II ▾</span>` on every `.ab2` and `.uk` task. Tap → tooltip with expected answer structure + sentence starters in du-form. Source: `/data/operators.json`.
- **`fb`** (Fachbegriff) — `<strong class="fb">Begriff</strong>` in SW blocks. Amber dotted underline. Tap/hover → compact popover with definition + source unit(s). Source: `/data/glossary.json`.

---

## Arc Visibility: Option B (Escalating Weight)

The arc is implicit — no named phase labels on the page. AB I/II tasks look similar. The UK/AB III block visually breaks the pattern through heavier treatment. Students feel the cognitive shift when they reach it. Pedagogically honest: the arc is always there, not announced.

The sequential unlock system reinforces this intentionally: content is gated, each gate passed reveals the next step. This creates a light "gamey" progression — students earn access to the next block. The satisfaction of unlocking is motivating without making the learning feel like a game rather than study.

---

## Unified UK Block — Interactive AB III Scaffold

The UK block is a **fully interactive MCQ quiz** — not a text prompt. It mirrors the formal essay structure students learn for Abitur: **Einleitung → Hauptteil → Schlussfolgerung**. The 6 named steps live within that frame.

### Structure and Steps

```
EINLEITUNG
  Step 1 — Theoretischer Kontext (AB I)
           What does theory / norm / principle say?
  Step 2 — Maßstab / Kriterium (AB III)
           Choose an evaluative criterion from a pool (~7 options).
           Multiple valid choices; invalid options carry typed error labels.
           This criterion is the "roter Faden" — re-checked at steps 4 and 6.

HAUPTTEIL
  Step 3 — Material & Fall (AB I)
           What do the case material / statistics / verdict show?
  Step 4 — Verbindung & Konflikte (AB II)
           Where does theory collide with case? What is the central tension?
           [Maßstab re-check here — student selects criterion again]
  Step 5 — Abwägung von Perspektiven (AB II)
           How do different actors / stakeholders see the same facts?

SCHLUSSFOLGERUNG
  Step 6 — Begründetes Urteil (AB III)
           Criterion-based judgment built explicitly on steps 1–5.
           [Maßstab re-check here — student selects criterion again]
```

### Interaction Mechanic

- Each step offers **3 options** (one correct, two distractors with typed error labels and explanatory text).
- The Maßstab step uses a **pool** (`uk-opts-pool`) — all options selectable, not mutually exclusive in layout, but only one can be selected at a time.
- Re-check slots (`.uk-opts-recheck`, empty in HTML) are **cloned from the Maßstab pool** by JS at init. Students must pick the same criterion at steps 4 and 6 to demonstrate "roter Faden."
- **Select all, then validate** — the submit button (`uk-submit`) is disabled until every step (including re-checks) has a selection. On submit, `chkUK()` validates all at once.
- Wrong options get an error chip (`uk-error-chip`) with a label from the error taxonomy (see below) plus an explanatory paragraph.
- All correct → block gets `.uk-complete`, button text becomes "✓ Abgeschlossen".

### Error Taxonomy

| `data-error` | Label shown | Meaning |
|---|---|---|
| `level` | AB-EBENE FALSCH | Content is at the wrong AB level (e.g., a judgment where a fact is asked) |
| `step` | FALSCHER SCHRITT | Content is correct but belongs to a different step |
| `chain` | KETTE UNTERBROCHEN | No explicit link to prior step or to Maßstab |
| `massStab` | KEIN MAßSTAB | No evaluative criterion present |
| `vague` | MAßSTAB ZU VAGE | Criterion too vague to guide judgment |
| `sided` | MAßSTAB EINSEITIG | Criterion considers only one perspective |
| `factual` | KEINE BEWERTUNGSFRAGE | Criterion is a factual question, not normative |
| `verdict` | MAßSTAB ANTIZIPIERT URTEIL | Criterion already contains the conclusion |

### `data-uk` Variants

The `data-uk` attribute on the outer `.uk` element declares the Abwägung shape. This informs content authoring — the same 6-step structure applies in all variants; only the framing of step 5 changes.

| Value | Step 5 framing | Use when |
|---|---|---|
| `pairs` | Argument / Gegenargument pairs | Constitutional judgments, rights trade-offs, any binary opposition |
| `perspektiven` | Stakeholder cards (country, group, institution) | International politics, Entwicklungszusammenarbeit, contested EU policies |
| `matrix` | Multi-dimensional pros/cons (Wirtschaft, Gesellschaft…) | Politische Systeme comparisons, multi-actor trade-offs |

### Authoring the UK Block

Each step needs **exactly 3 options**: one `data-correct="true"`, two with `data-error="<type>"` and `data-errtext="<explanation in du-form>"`. The Maßstab pool needs ~7 options: 2–3 valid (`data-correct="true"`) and 4–5 invalid with distinct error types. Re-check slots are **empty in HTML** — JS fills them from the Maßstab pool on DOMContentLoaded. Do not author content into `.uk-opts-recheck`.

---

## Unit Format Library

Six content-agnostic formats. **Format describes content structure. Lesson mode (Soziales Lernen vs. AB-Training) is decided separately** and determines which blocks from the structure are included in the digital unit. All formats use the same block primitives.

| Format | Content type | Natural lesson mode | Social activity examples | AB-Training blocks |
|---|---|---|---|---|
| **Arc** | Concept + analysis + judgment | AB-Training (primary) | — | `sw` → `qg` → `ab2` → `uk` (pairs/perspektiven/matrix) |
| **Case dive** | Event, crisis, court ruling | Either | Investigative groups, press conference simulation | `einstieg` → `ab2` analysis questions → `uk` (pairs) |
| **Comparison** | Two systems, countries, positions | Either | Expertenmethode (one group per system), gallery walk | Side-by-side `sw` blocks → `ab2` → `uk` (matrix) |
| **Debate setup** | Contested policy, reform proposal | Soziales Lernen (primary) | Rollenspiel, Fishbowl-Debatte, Karusselldiskussion | `sw` → `qg` → `uk` (perspektiven) |
| **Timeline / process** | Historical development, treaty chain | Soziales Lernen (primary) | Ordering activity, expert timeline, gallery walk | Chronological `sw` blocks → `ab2` open analysis |
| **Data reading** | Chart, map, political cartoon, statistics | Either | Group interpretation, silent analysis + discussion | Material-first → `ab2` guided analysis → optional `uk` |

**Block selection by mode:**
- **Soziales Lernen**: `einstieg` + `sw` + `qg` only. Analog activity in teacher notes.
- **AB-Training**: Full format structure including `ab2`, `uk`, and Arbeitsblatt exercises.
- `uk` is omitted in Timeline/process format regardless of mode (no judgment demanded by structure). Add only if the specific unit topic explicitly requires a Urteil.

Format declared in unit HTML: `<meta name="unit-format" content="arc">`.
Lesson mode declared in unit HTML: `<meta name="lesson-mode" content="sozial|ab-training">`.

---

## Knowledge Priority System

Three levels. Author-tagged, student-activatable.

| Level | HTML attribute | Meaning | Visual (when toggle ON) |
|---|---|---|---|
| `core` | `data-p="core"` | Must know precisely for Abitur | Amber diamond `◆` before block header |
| `imp` | `data-p="imp"` | Relevant, supports core knowledge | No extra marker (default) |
| `ctx` | `data-p="ctx"` | Illustrative, enriching, not exam-tested | Muted — lighter header treatment |

**Block level:** `data-p` on `.sw` element sets the default for all content inside.

**Term override:** `<strong class="p-core">Begriff</strong>` within an `imp` block marks a single term as core. Covers mixed blocks without re-tagging everything.

**Toggle off (default):** All SW blocks look identical regardless of `data-p` — no markers, no muting. Priority tagging is invisible. Reading is uncluttered.

**Toggle on:** `core` blocks gain the amber diamond marker; `ctx` blocks gain the muted (lighter header color, reduced opacity on body text) treatment; `imp` blocks remain unchanged.

**Toggle:** "Prüfungsrelevanz anzeigen" button in unit header. Off by default. State persists in `localStorage` per unit.

---

## Operator Badge System

Every AB II and AB III task carries an operator badge:

```html
<span class="op-badge" data-op="erläutern">erläutern · AB II ▾</span>
```

Tap/click opens a compact tooltip:
- What the operator expects (1–2 sentences)
- A sentence starter in du-form
- AB level reminder

Data source: `/data/operators.json` (root-relative path). All JSON fetches in JS use root-relative paths (`/data/…`) so they resolve correctly regardless of whether the calling file is in `/einheiten/`, `/js/`, or the project root. Same convention applies to `/data/glossary.json` and `/data/units.json`. 34 operators total across AB I (9), AB II (12), AB III (13).

Entry structure:
```json
{
  "name": "erläutern",
  "ab": 2,
  "description": "Erkläre einen Sachverhalt detailliert und nachvollziehbar im Kontext.",
  "starter": "Erläutere zunächst den theoretischen Kontext von … indem du …"
}
```

---

## Fachbegriffe System

Two surfaces, one data source (`data/glossary.json`).

**Inline tooltip:** `<strong class="fb">Begriff</strong>` in SW blocks. Amber underline. Tap/hover → popover with definition + source unit(s). No page navigation required.

**`fachbegriffe.html`:** Standalone reference page. Alphabetical, filterable by chapter/topic. Each entry: term, definition, source unit(s), AB level of first examination. Used for exam review.

Glossary entry:
```json
{
  "term": "Subsidiaritätsprinzip",
  "def": "Politische Entscheidungen sollen auf der niedrigstmöglichen Ebene getroffen werden.",
  "units": ["3-5", "3-7"],
  "chapter": 3,
  "ab": 2
}
```

The `chapter` field is an integer matching the chapter number (1, 2, 3…). Used by `fachbegriffe.html` to populate the chapter filter. Chapter is explicitly authored in the glossary — not derived from the unit ID — to support terms that appear across multiple chapters.

Author cost: add `class="fb"` to `<strong>` tags already present in SW blocks.

---

## AB-Training Section (Startseite)

Three entries in a dedicated section on `index.html`, always accessible:

- **AB I — Wissen zeigen:** What Nennen/Beschreiben/Erklären expects. Sentence starters.
- **AB II — Analysieren:** How to confront theory with material. What "im Kontext von" means in practice. Sentence starters.
- **AB III — Urteilen:** The five-step UK arc explained. What a "begründetes Urteil" looks like vs. a mere opinion. Annotated example.

Operator badge tooltips for AB III operators include a text link at the bottom of the tooltip HTML: `<a href="/index.html#ab-training-iii">→ AB III Leitfaden</a>`. This navigates to the AB-Training section anchor on the Startseite. AB I and AB II tooltips link to their respective anchors (`#ab-training-i`, `#ab-training-ii`).

---

## Data Architecture

All JSON files use root-relative paths (`/data/…`) in all JS fetch calls.

| File | Purpose | Consumed by |
|---|---|---|
| `/data/operators.json` | 34 operators, AB level, description, sentence starter | Operator badge JS tooltips |
| `/data/glossary.json` | Fachbegriffe, definitions, unit sources, chapter, AB level | Inline fb tooltips + fachbegriffe.html |
| `/data/units.json` | Unit metadata: title, chapter, format, Lehrplan ref | Startseite navigation, filtering |

`units.json` entry structure:
```json
{
  "id": "3-5",
  "title": "Der Europäische Binnenmarkt",
  "chapter": 3,
  "format": "arc",
  "lehrplan": "SK 3.5 / UK 3.5",
  "accent": "#b45309"
}
```

Priority tagging lives in HTML attributes — no JSON needed. JS reads `data-p` and `class="p-core"` at runtime for the toggle.

---

## Implementation Sequence

1. **CSS** — UK block (unified, 3 step-4 variants), operator badge, priority system (diamond marker, muted ctx, toggle visibility classes)
2. **JS** — operator tooltip, fb popover, priority toggle (localStorage), unlock engine updates for new block types
3. **Data files** — `operators.json`, `glossary.json`, `units.json`
4. **New pages** — `fachbegriffe.html`, AB-Training section on `index.html`
5. **Unit 3.5 update** — apply all new conventions to the existing unit as reference implementation
6. **Remaining units** — author content in Claude Opus, integrate with coding Claude

---

## What Does Not Change

- Static GitHub Pages, vanilla HTML5/CSS3/JS, no build tool, no backend
- Sequential unlock logic (SW → QG → next SW)
- Font stack: Fraunces / DM Sans / IBM Plex Mono
- Per-unit accent color via `--acc` CSS custom property
- `--sw: #0891b2` system cyan for Sachwissen badge (independent of unit accent)
