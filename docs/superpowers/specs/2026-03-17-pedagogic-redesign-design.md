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
| AB II | Understanding | Identify connections, conflicts, issues between theory and case/material — including perspectives |
| AB III | Political maturity | Form an illuminated, critical, argued opinion built on AB I + II |

The AB arc is a **tool**, not a mandatory template for every unit. It must be trained periodically on high-Abitur-relevance topics for spaced repetition. 20 units need variety — methods adapt to lesson content and objectives, not the reverse.

### Du-Form

All student-facing instructions use du-form ("Nenne das Konzept", not "Nennen Sie das Konzept").

### No Named External Methods

No "Dreischritt" or similar external method names. The system works directly from AB levels. The scaffold teaches the method by doing it.

---

## Content Type Vocabulary

All blocks use the same CSS/JS primitives. The unit format is the sequence and selection.

### Knowledge Tier (cyan system identity — `--sw`)
- **`sw`** — Sachwissen block. White card, amber left border, `📘 SACHWISSEN` badge in cyan (system color, independent of unit accent). Fachbegriffe in bold accent color. May contain numbered lists with bold accent counters.
- **`einstieg`** — Unit opening hook. Appears once per unit. Amber full border, serif heading. **Always visible** — never locked, not part of the QG unlock chain. Sets context before students enter the knowledge sequence.

### Gating Tier (warm gray, low visual weight)
- **`qg`** — Verständnischeck gate. Warm gray background, minimal mono header. AB I badge per question. Status: Offen / Bestanden. Unlocks next SW block.

### Task Tier (escalating visual weight through the arc)
- **`.auf`** (Aufgabe, AB II) — Standard card, amber left border, AB II badge + operator verb. Medium visual weight, feels like natural continuation of SW. HTML class: `auf`. Unlock behavior: initially hidden; revealed when the preceding QG gate passes. Multiple `.auf` blocks may appear between SW blocks — each is revealed by the same gate.
- **`.uk`** — Urteilskompetenz block (AB III). Visually breaks the pattern: amber full border (2px), inverted amber header (white text on amber), AB III badge. Unlock behavior: hidden until the last QG in the unit passes. Open-ended — no answer-checking; students write their own judgment. Not a gate itself.

**Unlock chain — Arc format example** (other formats use a subset of these block types with no UK block or no SW chain depending on the format):
`sw1` (visible) → `qg1` passes → `sw2` + `auf1` revealed → `qg2` passes → `sw3` + `auf2` revealed → `qg3` passes → `uk1` revealed. IDs follow the pattern `auf{n}` and `uk{n}`. Engine rule: `uk` blocks are treated identically to `sw` blocks in the unlock chain — they have an ID and are revealed when their gate passes. No completion event is fired for `uk` (open-ended).

### Support Tier
- **Operator badge** — Tappable inline badge on every AB II/III task. Shows operator verb + AB level. Tap → tooltip with expected answer structure + sentence starters in du-form.
- **`fb`** (Fachbegriff) — Amber-underlined term in SW blocks. Tap/hover → compact popover with definition + source unit(s).

---

## Arc Visibility: Option B (Escalating Weight)

The arc is implicit — no named phase labels on the page. AB I/II tasks look similar. The UK/AB III block visually breaks the pattern through heavier treatment. Students feel the cognitive shift when they reach it. Pedagogically honest: the arc is always there, not announced.

The sequential unlock system reinforces this intentionally: content is gated, each gate passed reveals the next step. This creates a light "gamey" progression — students earn access to the next block. The satisfaction of unlocking is motivating without making the learning feel like a game rather than study.

---

## Unified UK Block — The AB Arc Made Explicit

The five-step scaffold maps directly to AB I and II:

```
AB I foundation
  1. Kontext       — What does theory / norm / principle say?
  2. Fall          — What does the material / case / verdict show?

AB II foundation
  3. Verbindung    — How do they relate? Where is the conflict or issue?
  4. Abwägung      — What perspectives or dimensions are in play?
                     (stakeholder cards / argument pairs / pros-cons matrix
                      — chosen per task via data-uk attribute)

AB III synthesis
  5. Mein Urteil   — A critical, illuminated, argued opinion built on 1–4
  6. Korrekturvorschlag (optional) — If the case reveals a problem: what
                     would a better solution / policy / ruling look like?
                     Only included when the question explicitly demands it.
```

Students doing QG (AB I) and AB II tasks throughout the unit are already building steps 1–4. The UK block collects, names, and demands the synthesis. The scaffold teaches the thinking without imposing a named external method.

### Step 4 Abwägung Variants (`data-uk`)

The `data-uk` attribute sits on the outer `.uk` element: `<div class="uk" data-uk="pairs">`.

| Value | Shape | Use when |
|---|---|---|
| `pairs` | Argument / Gegenargument pairs | Constitutional judgments, rights trade-offs, any logical opposition |
| `perspektiven` | Stakeholder cards (country, group, institution) | International politics, Entwicklungszusammenarbeit, contested EU policies |
| `matrix` | Pros/cons table with category rows (Wirtschaft, Gesellschaft…) | Multi-dimensional trade-offs, Politische Systeme comparisons |

Outer structure (steps 1–3, 5) is identical across all variants. Only step 4 changes shape. JS reads `data-uk` on `.uk` to render the appropriate step-4 template.

---

## Unit Format Library

Six content-agnostic formats. The format is the sequence and block selection — not new components. All formats use the same block primitives.

| Format | When | Ends with UK block? | Structure |
|---|---|---|---|
| **Arc** | High Abitur relevance, AB training | Yes | SW → QG → `.auf` → UK block |
| **Case dive** | Events, crises, Verfassungsgericht rulings | Yes | Einstieg with material → `.auf` analysis questions → UK block |
| **Comparison** | Two systems, countries, positions | Yes | Side-by-side SW blocks → Abwägungsmatrix UK |
| **Debate setup** | Contested policies, reform proposals | Yes | Perspektiven cards for stakeholders → UK `perspektiven` |
| **Timeline / process** | Historical developments, EU treaty chain | No | Chronological SW blocks → `.auf` open question ("Was hat sich verändert und warum?") |
| **Data reading** | Charts, maps, political cartoons, statistics | Optional | Material-first → guided `.auf` analysis → optional UK if judgment is demanded |

Timeline and Data-reading formats intentionally omit the UK block by default. A UK block may be added to Data-reading when the task explicitly demands a judgment (e.g., "Bewerte die Entwicklung…").

Format declared in unit HTML: `<meta name="unit-format" content="arc">`.

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
