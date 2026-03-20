# Maintenance Notes — Politik-LK Digital Learning Units

## Data Files: Dual Format (JSON + JS)

The `data/` directory contains both `.json` and `.js` versions of the same data:

- `glossary.json` / `glossary.js` — Fachbegriffe definitions
- `operators.json` / `operators.js` — Operator definitions (AB I–III)
- `units.json` — Unit metadata (source of truth for index.html)

### Why both formats?

Chrome blocks XHR/fetch on `file://` protocol. The `.js` files wrap the same data in global variables (`_PLK_GLOSSARY`, `_PLK_OPERATORS`) loaded via `<script>` tags, which work everywhere.

### When adding/editing glossary or operator entries:

1. Edit the `.json` file (canonical format)
2. Copy the updated data into the corresponding `.js` file, wrapped in `var _PLK_GLOSSARY = [...]` or `var _PLK_OPERATORS = [...]`
3. Both files must stay in sync

### Unit HTML script loading order:

```html
<script src="../js/progress.js"></script>
<script src="../js/engine.js"></script>
<script src="../data/glossary.js"></script>
<script src="../data/operators.js"></script>
<script src="../js/tooltips.js"></script>
```

`glossary.js` and `operators.js` must load **before** `tooltips.js`.

## Index (index.html)

- Inline `SECTIONS` array holds the full unit catalog with hrefs
- On load, `units.json` is fetched and merged — overriding `title`, `status`, `accent`
- To activate/deactivate a unit: edit `units.json` (`status: "active"` or `"pending"`)
- Inline fallback: 3-3 is set to `active` so it renders even if JSON fetch fails

## Glossary Keyword Guidelines

- Keywords must be **LZ-focused**: core concepts students need to achieve the Lernziel
- Illustrative examples (e.g. LuxLeaks, Cassis-de-Dijon) belong in Sachwissen text but NOT in the glossary
- Less is more — students are already overwhelmed
- Tag keywords in HTML with `<strong class="fb">term</strong>`
- Each keyword entry needs: term, def, units[], chapter, ab level

## ES5 Constraint

All JavaScript must be ES5-only:
- No `const`, `let`, arrow functions, template literals, spread syntax, `class`, `import/export`
- No `Array.includes()`, `String.includes()` — use `.indexOf() !== -1`
- No `[...new Set()]` — use `Object.keys()` approach
- No `fetch()` for critical paths — use XHR or script tag globals
