# Unit Visual Redesign — Design Spec
**Date:** 2026-03-18
**Scope:** Visual hierarchy and interaction redesign for the three core module types: Einstieg, Sachwissen + Verständnischeck, Arbeitsblatt

All decisions confirmed interactively via browser mockups.

---

## 1. Einstieg

### Purpose
Entry hook — not learning material. Sets context, activates prior knowledge, anchors the unit topic. Decorative relative to the Sachwissen phase.

### Visual Design
- **Outer frame:** full `--acc` border (2px solid) + `--acc` background on the header strip
- **Header strip:** accent background, white text. Badge "EINSTIEG" in `rgba(255,255,255,.18)` pill. Title in Fraunces bold white. Status pill `rgba(255,255,255,.15)`. Chevron in `rgba(255,255,255,.7)`.
- **Body zone:** `--accL` (soft tint) background. Inner content cards are `rgba(255,255,255,.7)` with `rgba(--acc,.18)` border — semi-transparent white on the tint, not monotone.
- The contrast between the full-color header and the soft-tint body avoids being too aggressive while clearly differentiating from white knowledge blocks.

### Format
Flexible per unit — authored independently. Known formats:
- **Video + questions:** short embed + 2–3 MC questions after watching
- **Situation cards + chip selection:** scenario texts, students identify topic/Freiheiten by clicking chips

Other formats may be added per unit. The outer shell (collapsible block with header + body + check) is always the same.

### States
| State | Behavior |
|---|---|
| Open | Full block visible. Chips/MC available. Submit disabled until all answered. |
| Passed | Auto-collapses to a single green strip. Header turns `--ok` green (border + background). "↺ Nochmal ansehen" link in the strip. |
| Re-opened | Full block visible again, answers reset. Header stays `--ok` green. Badge still reads "EINSTIEG", status pill still reads "Bestanden" (same pattern as QG retry — achievement not undone). No additional note. |

### Gate Behavior
The Einstieg does **not** gate any other block. Sachwissen blocks are visible immediately on page load. Einstieg completion is purely a UI/UX signal — it does not affect `progress.js` gate logic or any `data-gate` attribute. No changes to the unlock chain are required.

### LZ Pills
Always in the unit header above the Einstieg — never inside the block. They persist throughout the full session regardless of scroll position.

---

## 2. Sachwissen (`.sw`)

### Visual Design — unchanged structure, refined typography
- White card, `border-left: 4px solid var(--acc)`, `border-radius: var(--r)`
- **`.sw-title`:** Fraunces, **0.92rem**, font-weight 600 — sets the visual baseline that the quiz question matches

### Content
Unchanged. `.sw-body p` at 0.9rem DM Sans, `--ink2`, line-height 1.85.

---

## 3. Verständnischeck (`.qg`)

### Hierarchy Signal
The check is **not** a sibling block — it is a sub-part of the Sachwissen block above it. Two mechanisms signal this:

1. **Indent:** `padding-left: 1.1rem` on a wrapper div, creating visible subordination
2. **Connector line:** `::before` pseudo-element at `left: 0.45rem`, `width: 2px`, `background: linear-gradient(to bottom, var(--acc) 60%, transparent)` — a fading vertical accent line connecting the check to the knowledge block above

### Panel Design
- Background: `--input-bg`
- Border: `1px solid var(--border-l)`, `border-radius: var(--r-sm)`
- Header: `display:flex`, mono label "✓ VERSTÄNDNISCHECK" in `--sw` cyan, status pill, chevron. Clickable to collapse/expand.

### Status Pill
Format: **"Block N: Offen"** / **"Block N: Bestanden"**
- Offen: `--gold-l` background, `--gold` text
- Bestanden: `--ok-l` background, `--ok` text

### Question Text (`.qi-t`)
- Font: Fraunces, **0.85rem**, font-weight 600
- Matches `sw-title` in visual weight — engages without dominating
- Answers stay DM Sans 0.77rem, `--ink2` — clearly subordinate

### States
| State | Visual | Behavior |
|---|---|---|
| 1 — Offen | Panel open, `--input-bg`, gold pill | Questions visible, submit disabled until all answered |
| 2 — Bestanden | Panel collapsed, green border+bg (`--ok-l`, `--ok-border`) | Only header + "↺ Wiederholen & zurücksetzen" link visible. Auto-collapses on pass. |
| 3 — Wiederholen | Panel open, still green header + "Bestanden" pill | Answers reset. Chevron closes immediately — no obligation to re-answer. |

The "Bestanden" status is permanent in the header (State 3 keeps it green) — the student's achievement is not undone by opening.

---

## 4. Arbeitsblatt Section Separator

### Requirement
Visually strong phase break between the Sachwissen phase and the Arbeitsblatt phase, without adding another block/card to the feed.

### Design: Full-width gradient rule with centered Fraunces label
```
─ ─ ─ ─ ─ ─ ─ ─  📝 Arbeitsblatt  ─ ─ ─ ─ ─ ─ ─ ─
```

Implementation:
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
}
.section-divider-inner {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  background: var(--bg);   /* page background — punches through the line */
  padding: 0 1rem;
  font-family: var(--ff-head);
  font-size: 1rem;
  font-weight: 700;
  color: var(--acc);
}
```

No box, no card, no padding block. Just a typographic section title floating on a full-width accent rule.

---

## 5. Page Flow Summary

```
unit-header
  ├─ label (Einheit X.Y)
  ├─ h1 (unit title)
  ├─ lz-pills (always visible)
  └─ controls (priority toggle, reset button)

einstieg                     ← full accent frame, collapsible, no gate
  ├─ header (accent bg)
  └─ body (accL tint, white inner cards + check)

[collapsed to green strip after pass]

sw block 1                   ← white card, left accent border
  └─ qg 1 (indented, connector line)
       ├─ open: questions visible
       └─ passed: collapsed green strip

sw block 2
  └─ qg 2

sw block N
  └─ qg N

─────────── 📝 Arbeitsblatt ───────────    ← gradient rule, Fraunces label, no box

[locked until all QGs pass]

auf 1 (zuordnung / kategorisierung / etc.)
auf 2
uk block (AB III — final exercise)
```

---

## 6. What Does Not Change

- `.sw` card structure and content styling
- `.qg` question types (MC, text input, ordering)
- Gate logic (localStorage progress, `data-gate` unlock chain)
- `.uk` interactive block design (already redesigned)
- `.auf` exercise card structure
- Breakpoint / responsive behavior

## 6b. Existing Rules Being Replaced

The following existing CSS rules in `css/style.css` are **replaced** (not added alongside) by this redesign:

- **`.einstieg`** (section 9, ~lines 349–387): current rule is a plain white card with no collapse/state logic. Replaced with the collapsible accent-framed block described in Section 1.
- **`.section-divider`** (existing rule): replaced with the gradient-rule + Fraunces label design described in Section 4. The existing DOM structure (`<div class="section-divider">Arbeitsblatt</div>`) needs updating to `<div class="section-divider"><span class="section-divider-inner">📝 Arbeitsblatt</span></div>`.

---

## 7. CSS Token Reference

### Size conflicts with issue #1 — resolved

Issue #1 proposed `.sw-title` at 1rem, `.qi-t` as DM Sans, and `.mco` at 0.875rem. All three were overridden by visual testing:
- `.sw-title` at **0.92rem** reads better against the 0.9rem body (just enough lift without crowding)
- `.qi-t` in **Fraunces** (not DM Sans) was explicitly approved to make the question engaging
- Answer text including `.mco` at **0.77rem** was confirmed in mockup as the correct subordination size

---

## 8. Full Typography Scale

Merges the approved mockup decisions with issue #1. Supersedes the issue's table where there is a conflict.

| Element | Size | Family | Weight | Color | Notes |
|---------|------|--------|--------|-------|-------|
| Unit title (`h1`) | `clamp(1.5rem, 3.5vw, 2rem)` | Fraunces | 800 | `--ink` | |
| Einstieg title (`h2` inside header) | 1.2rem | Fraunces | 700 | white | |
| Aufgabe number (`.auf-n`) | 1.6rem | Fraunces | 800 | `--acc` | |
| Section divider label | 1rem | Fraunces | 700 | `--acc` | |
| SW block title (`.sw-title`) | 0.92rem | Fraunces | 600 | `--ink` | |
| Quiz question (`.qi-t`) | 0.85rem | Fraunces | 600 | `--ink` | |
| Body text (`.sw-body p`) | 0.9rem | DM Sans | 400 | `--ink2` | `line-height: 1.85` |
| Answer options (`.mco`, option labels) | 0.77rem | DM Sans | 400 | `--ink2` | |
| Text input | 0.8rem | IBM Plex Mono | 400 | `--ink` | |
| QG header label ("✓ VERSTÄNDNISCHECK") | 0.72rem | IBM Plex Mono | 600 | `--sw` | |
| System badges (`.sw-label`, `.qi-n`, EINSTIEG badge, status pills) | 0.68–0.72rem | IBM Plex Mono | 600 | varies (see Section 3) | |
| LZ pills | 0.68rem | IBM Plex Mono | 600 | `--acc` | Distinct component in unit header, always visible |

**Font-family roles:**
- **Fraunces** — chapter markers, headings, titles: warmth, invitation
- **DM Sans** — content, instructions, options: readable, neutral
- **IBM Plex Mono** — labels, badges, meta, numbers: precision, system signals

---

## 9. Vertical Rhythm

Additions from issue #1, consistent with the approved layout.

- `.qg + .sw`: `margin-top: 1.75rem` — breathing room between a completed check and the next knowledge block
- `.sw + .qg-wrapper`: `margin-top: 0.5rem` — tight coupling, subordination preserved
- Einstieg `.example` (situation cards): slight left indent (`padding-left: 0.75rem`) + `border-left: 2px solid color-mix(in srgb, var(--acc) 30%, transparent)` — vignette feel, not a full card border

---

One new token must be added to `:root` in `css/style.css` (currently used inline only):

| Token | Value | Usage |
|---|---|---|
| `--acc` | per-unit | Einstieg frame, connector line, separator, situation card vignette border |
| `--accL` | per-unit | Einstieg body background |
| `--ok` | `#2d7a4f` | Passed state icon color, text |
| `--ok-l` | `#eaf4ee` | Passed state background |
| `--ok-border` | `#a5d4b8` | Passed state border color — **new token, add to `:root`** |
| `--input-bg` | `#faf8f4` | QG panel background |
| `--ff-head` | Fraunces | sw-title, qi-t, separator label |
| `--ff-mono` | IBM Plex Mono | All status labels, badges, qi-n |
| `--r-sm` | `6px` | QG panel border-radius |
| `--sw` | existing | QG header label color (cyan) — referenced in Section 8, defined in existing `:root` |
