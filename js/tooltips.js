/* ==========================================================
   Politik-LK — tooltips.js
   Operator badge tooltips · Fachbegriff popovers
   Auto-tags glossary terms in prose at runtime.
   Requires: css/style.css sections 40-42
   Load after engine.js in unit HTML files.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Category colour palette ────────────────────────────── */
  /* Colours grouped by super-category:
     Akteure      = blue family   (political actors)
     Rechtsrahmen = green family  (dark → light, bridging to Konzepte)
     Konzepte     = amber→yellow→pink (Struktur/Prinzip/Modell/Phänomen)  */
  var CAT_COLORS = {
    /* ── Akteure (blue) ─────────────────────────────────────── */
    'Organisation':      '#1e3a8a',  /* navy — most structural              */
    'Institution':       '#2563eb',  /* blue — operational bodies            */
    'Posten':            '#60a5fa',  /* sky — role / function                */
    'Person':            '#0891b2',  /* turquoise — individual, cool-toned   */
    /* ── Rechtsrahmen (green, dark → light) ─────────────────── */
    'Vertrag':           '#166534',  /* dark green — foundational treaties   */
    'Rechtsnorm':        '#16a34a',  /* green — binding law                  */
    'Verfahren':         '#65a30d',  /* lime-green — procedural, bridges     */
    /* ── Konzepte (amber → yellow → pink) ─────────────────── */
    'Struktur':          '#b45309',  /* amber — permanence                   */
    'Prinzip':           '#ca8a04',  /* yellow — conceptual truth            */
    'Modell':            '#eab308',  /* bright yellow — theoretical models   */
    'Phänomen':          '#db2777'   /* pink — unexpected, distinct          */
  };

  /* Expose so fachbegriffe.html and other pages can reuse */
  window._PLK_CAT_COLORS = CAT_COLORS;

  function _catColor(cat) { return CAT_COLORS[cat] || '#6b7280'; }

  /* Categories with special badge rendering */
  var CAT_SPECIAL = {
    'Struktur': { bg: '#292524', fg: '#fff' },        /* near-black bg, white text — permanence */
    'Prinzip':  { bg: '#fefce8', fg: '#854d0e', border: '#e5d5a0' }  /* cream bg, dark yellow text — conceptual truth */
  };

  /* Category descriptions — used in glossary page group headers */
  var CAT_DESCRIPTIONS = {
    'Organisation':  'Überstaatliche oder internationale Zusammenschlüsse mit eigener Struktur und Mitgliedschaft.',
    'Institution':   'Organe und Einrichtungen innerhalb eines politischen Systems, die eine bestimmte Funktion ausüben.',
    'Posten':        'Politische Ämter und Funktionen, unabhängig von der Person, die sie besetzt.',
    'Person':        'Historische oder aktuelle Einzelpersonen mit politischer Bedeutung.',
    'Vertrag':       'Völkerrechtliche oder verfassungsrechtliche Grundlagentexte, die Rechte, Pflichten und Strukturen festlegen.',
    'Rechtsnorm':    'Konkrete Rechtsakte, Vorschriften oder kodifizierte Regeln, die aus einem Vertrag oder Gesetz hervorgehen.',
    'Verfahren':     'Formalisierte Abläufe und Prozesse der politischen Entscheidungsfindung.',
    'Struktur':      'Dauerhafte reale Ordnungssysteme, die den Rahmen politischen, wirtschaftlichen oder gesellschaftlichen Handelns bilden.',
    'Prinzip':       'Normative Leitideen und Grundsätze, die politisches Handeln legitimieren oder begrenzen.',
    'Modell':        'Theoretische Erklärungsrahmen, Denkschulen und analytische Konzepte, die Wirklichkeit deuten, aber nicht selbst Wirklichkeit sind.',
    'Phänomen':      'Beobachtbare politische, gesellschaftliche oder wirtschaftliche Entwicklungen und Muster.'
  };
  window._PLK_CAT_DESCRIPTIONS = CAT_DESCRIPTIONS;

  /* Chapter colour map — used for unit-reference chips in tooltips */
  var CHAPTER_COLORS = { 3: '#2563eb' };   /* EU = blue */
  var CHAPTER_TEXT   = { 3: '#fde68a' };   /* EU chips = gold text on blue */

  /* ── Shared state ──────────────────────────────────────── */
  var _operators     = null;
  var _glossary      = null;
  var _units         = null;
  var _activeTooltip = null;
  var _tooltipAnchor = null;   /* original anchor element for in-place replacement */
  var _tooltipStack  = [];     /* history stack for back-navigation in nested tooltips */

  /* ── Base path (resolve from script src) ──────────────── */
  var _base = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/js\/tooltips\.js.*$/i, '');
    var p = location.pathname;
    if (p.indexOf('/einheiten/') !== -1) return '../';
    return './';
  })();

  /* ── Data loading ──────────────────────────────────────── */

  function _fetchJSON(path, cb) {
    var url = /^https?:|^\//.test(path) ? path : _base + path;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
        try { cb(JSON.parse(xhr.responseText)); }
        catch (e) { console.warn('[tooltips.js] parse error', e); }
      }
    };
    xhr.onerror = function () { console.warn('[tooltips.js] failed to load', url); };
    xhr.send();
  }

  function _loadData() {
    if (window._PLK_OPERATORS) { _operators = window._PLK_OPERATORS; }
    else { _fetchJSON('data/operators.json', function (d) { _operators = d; }); }

    if (window._PLK_GLOSSARY) {
      _glossary = window._PLK_GLOSSARY;
      /* sync path: glossary already available — auto-tag happens in DOMContentLoaded */
    } else {
      _fetchJSON('data/glossary.json', function (d) {
        _glossary = d;
        _autoTagTerms(); /* async path: tag once data arrives */
      });
    }

    if (window._PLK_UNITS) { _units = window._PLK_UNITS; }
    else { _fetchJSON('data/units.json', function (d) { _units = d; }); }
  }

  function _opByName(name) {
    if (!_operators) return null;
    return _operators.find(function (o) { return o.name === name; }) || null;
  }

  function _termByName(name) {
    if (!_glossary) return null;
    var lower = name.toLowerCase();
    /* Try exact term match first */
    var exact = _glossary.find(function (g) { return g.term.toLowerCase() === lower; });
    if (exact) return exact;
    /* Fallback: check abbreviations */
    return _glossary.find(function (g) {
      if (!g.abbr) return false;
      if (typeof g.abbr === 'string') return g.abbr.toLowerCase() === lower;
      return g.abbr.some(function (a) { return a.toLowerCase() === lower; });
    }) || null;
  }

  function _unitById(id) {
    if (!_units) return null;
    return _units.find(function (u) { return u.id === id; }) || null;
  }

  /* ── Tooltip positioning ───────────────────────────────── */

  function _positionTooltip(tooltip, anchor) {
    var r   = anchor.getBoundingClientRect();
    var tw  = tooltip.offsetWidth;
    var top = r.bottom + 8;
    var left = r.left;

    if (left + tw > window.innerWidth - 16) {
      left = window.innerWidth - tw - 16;
    }
    if (left < 8) left = 8;

    var th = tooltip.offsetHeight;
    if (top + th > window.innerHeight - 12) {
      top = r.top - th - 8;
      if (top < 8) top = 8;
    }

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
  }

  function _closeTooltip() {
    if (_activeTooltip) {
      _activeTooltip.remove();
      _activeTooltip = null;
      _tooltipAnchor = null;
      _tooltipStack  = [];
    }
  }

  /* ── Build unit-reference chips for the tooltip ─────────── */

  function _unitRefsHtml(unitIds) {
    if (!unitIds || !unitIds.length) return '';
    return unitIds.map(function (id) {
      var unit  = _unitById(id);
      var num   = unit ? unit.num   : id;
      var title = unit ? unit.title : ('Einheit ' + id);
      var ch    = parseInt(id, 10);  /* chapter number from unit-id prefix */
      var bg    = CHAPTER_COLORS[ch] || '';
      var fg    = CHAPTER_TEXT[ch]   || '';
      var cStyle = bg
        ? 'color:' + fg + ';background:' + bg + ';border-color:' + bg
        : '';
      if (unit && unit.status === 'active' && unit.file) {
        var href = _base + 'einheiten/' + unit.file;
        return '<a class="fb-tooltip-unit-chip" href="' + href + '" title="' + title + '"' +
          (cStyle ? ' style="' + cStyle + '"' : '') + '>' + num + '</a>';
      }
      var lStyle = bg
        ? 'color:' + bg + '80;border-color:' + bg + '40;background:' + bg + '10'
        : '';
      return '<span class="fb-tooltip-unit-chip locked" title="' + title + '"' +
        (lStyle ? ' style="' + lStyle + '"' : '') + '>' + num + '</span>';
    }).join('');
  }

  /* ── Show helpers ───────────────────────────────────────── */

  /* Tag glossary terms inside a definition string as clickable fb spans */
  /* German adjective ending regex (shared with _autoTagTerms) */
  var _ADJ_END = /^(.*?)(e|en|em|er|es)$/i;
  function _flexPattern(term) {
    var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.split(/(\s+)/).map(function (tok) {
      if (/^\s+$/.test(tok)) return tok;
      var raw = tok.replace(/\\(.)/g, '$1');
      var m = _ADJ_END.exec(raw);
      if (m && m[1].length >= 2) {
        var stem = m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return stem + '(?:e|en|em|er|es)';
      }
      return tok;
    }).join('');
  }

  function _tagDefsInline(defText, excludeTerm) {
    if (!_glossary || !_glossary.length) return defText;
    var exLower = excludeTerm.toLowerCase();
    var inlineEntries = [];

    _glossary.forEach(function (g) {
      if (g.term.toLowerCase() !== exLower) {
        inlineEntries.push({ pattern: _flexPattern(g.term), term: g.term });
      }
      if (g.abbr) {
        var abbrs = typeof g.abbr === 'string' ? [g.abbr] : g.abbr;
        abbrs.forEach(function (a) {
          if (a.toLowerCase() !== exLower) {
            inlineEntries.push({ pattern: _flexPattern(a), term: g.term });
          }
        });
      }
    });

    inlineEntries.sort(function (a, b) { return b.pattern.length - a.pattern.length; });
    var patterns = inlineEntries.map(function (e) { return e.pattern; });
    if (!patterns.length) return defText;
    var re = new RegExp('\\b(' + patterns.join('|') + ')([a-zäöüß]*)', 'gi');
    return defText.replace(re, function (full, base, suffix) {
      /* Resolve matched text to glossary term */
      var resolved = null;
      for (var i = 0; i < inlineEntries.length; i++) {
        var testRe = new RegExp('^' + inlineEntries[i].pattern + '$', 'i');
        if (testRe.test(base)) { resolved = inlineEntries[i].term; break; }
      }
      var needsFb = (resolved && resolved.toLowerCase() !== base.toLowerCase()) || suffix;
      var fbVal = resolved || base;
      var attr = needsFb ? ' data-fb="' + fbVal + '"' : '';
      return '<strong class="fb" style="cursor:pointer"' + attr + '>' + base + suffix + '</strong>';
    });
  }

  /* Inline SVG flags for glossary tooltip headers */
  var _FLAGS = {
    eu: '<svg viewBox="0 0 24 16" style="width:16px;height:11px;vertical-align:middle;margin-right:.3rem"><rect width="24" height="16" rx="1.5" fill="#003399"/><g fill="#FC0" transform="translate(12,8)"><circle r=".7" cx="0" cy="-3.5"/><circle r=".7" cx="1.75" cy="-3.03"/><circle r=".7" cx="3.03" cy="-1.75"/><circle r=".7" cx="3.5" cy="0"/><circle r=".7" cx="3.03" cy="1.75"/><circle r=".7" cx="1.75" cy="3.03"/><circle r=".7" cx="0" cy="3.5"/><circle r=".7" cx="-1.75" cy="3.03"/><circle r=".7" cx="-3.03" cy="1.75"/><circle r=".7" cx="-3.5" cy="0"/><circle r=".7" cx="-3.03" cy="-1.75"/><circle r=".7" cx="-1.75" cy="-3.03"/></g></svg>',
    de: '<svg viewBox="0 0 16 11" style="width:16px;height:11px;vertical-align:middle;margin-right:.3rem"><rect width="16" height="11" fill="#FC0"/><rect width="16" height="3.67" fill="#000"/><rect y="7.33" width="16" height="3.67" fill="#D00"/></svg>',
    lu: '<svg viewBox="0 0 16 11" style="width:16px;height:11px;vertical-align:middle;margin-right:.3rem"><rect width="16" height="3.67" fill="#EF3340"/><rect y="3.67" width="16" height="3.67" fill="#fff"/><rect y="7.33" width="16" height="3.67" fill="#00A3E0"/></svg>',
    mt: '<svg viewBox="0 0 16 11" style="width:16px;height:11px;vertical-align:middle;margin-right:.3rem"><rect width="8" height="11" fill="#fff"/><rect x="8" width="8" height="11" fill="#CF142B"/></svg>',
    pt: '<svg viewBox="0 0 16 11" style="width:16px;height:11px;vertical-align:middle;margin-right:.3rem"><rect width="6" height="11" fill="#006600"/><rect x="6" width="10" height="11" fill="#FF0000"/></svg>',
    ee: '<svg viewBox="0 0 16 11" style="width:16px;height:11px;vertical-align:middle;margin-right:.3rem"><rect width="16" height="3.67" fill="#0072CE"/><rect y="3.67" width="16" height="3.67" fill="#000"/><rect y="7.33" width="16" height="3.67" fill="#fff"/></svg>'
  };

  function _flagSvg(code) { return code && _FLAGS[code] ? _FLAGS[code] : ''; }

  /* Build the inner HTML for a fb-tooltip given a glossary entry */
  function _fbTooltipHtml(entry, termText, showBack) {
    if (_glossary === null) {
      return '<div class="fb-tooltip-header">' +
        '<span class="fb-tooltip-term">' + termText + '</span>' +
      '</div>' +
      '<div class="fb-tooltip-def">Lade Daten \u2026</div>';
    }
    if (!entry) {
      return '<div class="fb-tooltip-header">' +
        '<span class="fb-tooltip-term">' + termText + '</span>' +
      '</div>' +
      '<div class="fb-tooltip-def">Definition nicht gefunden.</div>';
    }

    var color = _catColor(entry.cat);

    var sp = CAT_SPECIAL[entry.cat];
    var catStyle = sp
      ? 'color:' + sp.fg + ';background:' + sp.bg + (sp.border ? ';border:1px solid ' + sp.border : '')
      : 'color:' + color + ';background:' + color + '18';
    var catHtml = entry.cat
      ? '<span class="fb-tooltip-cat" style="' + catStyle + '">' + entry.cat + '</span>'
      : '';

    var termColor = color;
    var indexHref = _base + 'fachbegriffe.html?q=' + encodeURIComponent(entry.term);
    var unitRefs  = _unitRefsHtml(entry.units);
    var taggedDef = _tagDefsInline(entry.def, entry.term);

    var backHtml = showBack
      ? '<span class="fb-tooltip-back" style="cursor:pointer;font-size:.7rem;color:var(--acc);margin-right:.5rem">\u2190 zur\u00fcck</span>'
      : '';

    var flagHtml = _flagSvg(entry.flag);
    var temporalHtml = entry.temporal
      ? '<span style="font-size:.65rem;color:#d97706;margin-left:.4rem;vertical-align:middle" title="Zeitgebundene Information — siehe Aktualit\u00e4tsindex">\u231b</span>'
      : '';
    var basisHtml = entry.basis
      ? '<span style="font-size:.6rem;color:#ca8a04;margin-left:.35rem;vertical-align:middle" title="Lehrplan-Basisbegriff">\u2605</span>'
      : '';

    /* Cross-link: Person → Posten (with seit date) */
    var crossLinkHtml = '';
    if (entry.posten) {
      var seitStr = entry.seit ? ('Seit ' + entry.seit + ' \u2192 ') : '\u25b8 ';
      crossLinkHtml = '<div style="margin-top:.3rem;font-size:.8rem;color:var(--ink3)">' +
        seitStr + '<strong class="fb" style="cursor:pointer" data-fb="' + entry.posten + '">' + entry.posten + '</strong>' +
        '</div>';
    }
    /* Reverse cross-link: Posten → current Person (with seit date) */
    if (entry.person) {
      var pSeitStr = entry.personSeit ? ('Seit ' + entry.personSeit + ' \u2192 ') : '\u25b8 ';
      crossLinkHtml = '<div style="margin-top:.3rem;font-size:.8rem;color:var(--ink3)">' +
        pSeitStr + '<strong class="fb" style="cursor:pointer" data-fb="' + entry.person + '">' + entry.person + '</strong>' +
        '</div>';
    }

    return '<div class="fb-tooltip-header">' +
        backHtml +
        (entry.emoji ? '<span style="margin-right:.35rem;font-size:1.1rem;vertical-align:middle">' + entry.emoji + '</span>' : '') +
        flagHtml +
        '<span class="fb-tooltip-term" style="color:' + termColor + '">' + entry.term + '</span>' +
        temporalHtml +
        basisHtml +
        catHtml +
      '</div>' +
      '<div class="fb-tooltip-def">' + taggedDef + '</div>' +
      crossLinkHtml +
      '<div class="fb-tooltip-footer">' +
        '<div class="fb-tooltip-units">' + unitRefs + '</div>' +
        '<a class="fb-tooltip-index-link" href="' + indexHref + '">Alle Begriffe \u2192</a>' +
      '</div>';
  }

  function _applyTooltipBorderColor(tooltip, entry) {
    if (!entry) return;
    var color = _catColor(entry.cat);
    tooltip.style.borderTopColor = color;
  }

  function _showFbTooltip(anchor, termText) {
    var entry   = _glossary === null ? null : _termByName(termText);
    var tooltip = document.createElement('div');
    tooltip.className   = 'fb-tooltip';
    tooltip.dataset.for = 'fb-' + termText;

    tooltip.innerHTML = _fbTooltipHtml(entry, termText, false);
    _applyTooltipBorderColor(tooltip, entry);

    document.body.appendChild(tooltip);
    _positionTooltip(tooltip, anchor);
    _activeTooltip = tooltip;
    _tooltipAnchor = anchor;
    _tooltipStack  = [];
  }

  /* Replace tooltip content in-place (for nested term clicks) */
  function _replaceFbTooltip(termText) {
    if (!_activeTooltip) return;
    /* Push current state onto stack */
    _tooltipStack.push({
      html: _activeTooltip.innerHTML,
      borderColor: _activeTooltip.style.borderTopColor,
      forAttr: _activeTooltip.dataset.for
    });
    var entry = _termByName(termText);
    _activeTooltip.innerHTML = _fbTooltipHtml(entry, termText, true);
    _activeTooltip.dataset.for = 'fb-' + termText;
    _applyTooltipBorderColor(_activeTooltip, entry);
  }

  /* Go back one step in tooltip history */
  function _tooltipGoBack() {
    if (!_activeTooltip || !_tooltipStack.length) return;
    var prev = _tooltipStack.pop();
    _activeTooltip.innerHTML = prev.html;
    _activeTooltip.style.borderTopColor = prev.borderColor;
    _activeTooltip.dataset.for = prev.forAttr;
  }

  function _showOpTooltip(anchor, opName) {
    var op      = _opByName(opName);
    var tooltip = document.createElement('div');
    tooltip.className   = 'op-tooltip';
    tooltip.dataset.for = opName;

    if (_operators === null) {
      tooltip.innerHTML = '<p style="color:var(--ink3);font-size:.8rem">Lade Daten \u2026</p>';
    } else if (!op) {
      tooltip.innerHTML = '<p style="color:var(--ink3);font-size:.8rem">Operator nicht gefunden.</p>';
    } else {
      var abRoman = ['', 'I', 'II', 'III'][op.ab];
      var abLabel = abRoman ? ('AB ' + abRoman) : ('AB ' + op.ab);
      var anchor2 = op.ab === 1 ? '#ab-training-i' : op.ab === 2 ? '#ab-training-ii' : '#ab-training-iii';
      tooltip.innerHTML =
        '<div class="op-tooltip-op">' + op.name + ' \u00b7 ' + abLabel + '</div>' +
        '<div class="op-tooltip-desc">' + op.description + '</div>' +
        '<div class="op-tooltip-starter">' + op.starter + '</div>' +
        '<a class="op-tooltip-link" href="/index.html' + anchor2 + '">\u2192 ' + abLabel + ' Leitfaden</a>';
    }

    document.body.appendChild(tooltip);
    _positionTooltip(tooltip, anchor);
    _activeTooltip = tooltip;
  }

  /* ── Auto-tag glossary terms in prose ──────────────────── */
  /* Scans all text nodes in the page-wrap and wraps any
     untagged glossary term occurrence with <strong class="fb">.
     Uses event delegation, so no re-init needed afterward.    */

  function _autoTagTerms() {
    if (!_glossary || !_glossary.length) return;

    /* Build combined list of terms + abbreviations, mapping each to its base term */
    var abbrMap = {};   /* lowercase match → glossary term (for abbreviations) */

    var allEntries = []; /* { pattern: regexStr, term: glossaryTerm, isAbbr: bool } */

    _glossary.forEach(function (g) {
      allEntries.push({ pattern: _flexPattern(g.term), term: g.term, isAbbr: false });
      if (g.abbr) {
        var abbrs = typeof g.abbr === 'string' ? [g.abbr] : g.abbr;
        abbrs.forEach(function (a) {
          abbrMap[a.toLowerCase()] = g.term;
          allEntries.push({ pattern: _flexPattern(a), term: g.term, isAbbr: true });
        });
      }
    });

    /* Sort longer patterns first — prevents partial matches in combined regex */
    allEntries.sort(function (a, b) { return b.pattern.length - a.pattern.length; });

    var pattern = allEntries.map(function (e) { return e.pattern; }).join('|');
    /* Match pattern + optional trailing lowercase suffix (German noun inflection) */
    /* \b prevents matching "EP" inside "Rezept", "Konzept" etc. */
    var re = new RegExp('\\b(' + pattern + ')([a-zäöüß]*)', 'gi');

    /* Build a lookup: given a matched string, find its glossary term */
    function _resolveMatch(matchedText) {
      var lower = matchedText.toLowerCase();
      /* Check abbrMap first (explicit abbreviations) */
      if (abbrMap[lower]) return abbrMap[lower];
      /* Try each entry's pattern to find the parent term */
      for (var i = 0; i < allEntries.length; i++) {
        var testRe = new RegExp('^' + allEntries[i].pattern + '$', 'i');
        if (testRe.test(lower) || testRe.test(matchedText)) {
          return allEntries[i].term;
        }
      }
      return null;
    }

    /* ── Skip zone detection ── */
    var SKIP_TAGS = {
      BUTTON: 1, A: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1,
      SCRIPT: 1, STYLE: 1, NAV: 1, FOOTER: 1,
      H1: 1, H2: 1, H3: 1, H4: 1
    };
    var SKIP_IDS = { 'arbeitsblatt': 1, 'pw-wrap': 1 };
    /* Regex matches any class on the ancestor that disqualifies the zone */
    var SKIP_CLS = /(?:^| )(qg|einstieg|auf-h|ab-header|chip-bank|chip|olist|oitem|mco-list|mco|k-item|k-btn|uk-opt|uk-krit-opt|uk-krit-chip|uk-step-q|uk-krit-q|zi|zlist|zarr|e-chip|einstieg-chips|lz-pill|lz-chip-text|klausur-tag|src-list|breadcrumb|unit-header|page-footer|progress-wrap|fb-tooltip|op-tooltip|op-badge|slot)(?= |$)/;

    function _inSkipZone(textNode) {
      var n = textNode.parentElement;
      while (n && n !== document.body) {
        if (SKIP_TAGS[n.tagName]) return true;
        if (n.tagName === 'STRONG' && n.className && n.className.indexOf('fb') !== -1) return true;
        if (n.id && SKIP_IDS[n.id]) return true;
        if (n.className && SKIP_CLS.test(n.className)) return true;
        n = n.parentElement;
      }
      return false;
    }

    /* Collect all eligible text nodes up-front (TreeWalker is fast) */
    var root   = document.querySelector('.page-wrap') || document.body;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes  = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() && !_inSkipZone(node)) nodes.push(node);
    }

    /* Replace matching text nodes with fragment containing strong.fb wrappers */
    nodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      re.lastIndex = 0;
      if (!re.test(text)) { re.lastIndex = 0; return; }
      re.lastIndex = 0;

      var frag = document.createDocumentFragment();
      var last = 0, m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        }
        var s = document.createElement('strong');
        s.className = 'fb';
        var baseTerm = m[1];
        var suffix   = m[2] || '';
        s.textContent = baseTerm + suffix;
        /* data-fb: resolve to glossary term (handles abbreviations + inflected adjectives) */
        var resolved = _resolveMatch(baseTerm);
        if (resolved && resolved.toLowerCase() !== baseTerm.toLowerCase()) {
          s.setAttribute('data-fb', resolved);
        } else if (suffix) {
          /* Suffix-only inflection (noun ending): store unsuffixed form */
          s.setAttribute('data-fb', resolved || baseTerm);
        }
        frag.appendChild(s);
        last = m.index + baseTerm.length + suffix.length;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      re.lastIndex = 0;
      /* Only replace if we actually wrapped something */
      if (frag.childNodes.length > 1 || (frag.firstChild && frag.firstChild.nodeType !== 3)) {
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });
  }

  /* ── Init ───────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    _loadData();
    _autoTagTerms(); /* sync path: window._PLK_GLOSSARY already set by script tag */

    /* Close tooltip on scroll — fixes the "stuck tooltip" bug */
    var _scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (!_activeTooltip) return;
      if (_scrollTimer) clearTimeout(_scrollTimer);
      _scrollTimer = setTimeout(function () { _closeTooltip(); }, 80);
    }, true);

    /* Single delegated handler for all tooltip interactions.
       No per-element listeners needed — works for auto-tagged
       terms too, without any re-initialization.               */
    document.addEventListener('click', function (e) {
      var t = e.target;

      /* Back button inside tooltip */
      if (t.className && t.className.indexOf('fb-tooltip-back') !== -1) {
        e.stopPropagation();
        _tooltipGoBack();
        return;
      }

      /* strong.fb inside an active tooltip → replace content in-place */
      if (t.tagName === 'STRONG' && t.className && t.className.indexOf('fb') !== -1
          && _activeTooltip && _activeTooltip.contains(t)) {
        e.stopPropagation();
        var nestedTerm = t.getAttribute('data-fb') || t.textContent.trim();
        _replaceFbTooltip(nestedTerm);
        return;
      }

      /* strong.fb in page → glossary tooltip */
      if (t.tagName === 'STRONG' && t.className && t.className.indexOf('fb') !== -1) {
        e.stopPropagation();
        var termText = t.getAttribute('data-fb') || t.textContent.trim();
        if (_activeTooltip && _activeTooltip.dataset.for === 'fb-' + termText) {
          _closeTooltip(); return;
        }
        _closeTooltip();
        _showFbTooltip(t, termText);
        return;
      }

      /* .op-badge → operator tooltip */
      if (t.className && t.className.indexOf('op-badge') !== -1) {
        e.stopPropagation();
        var opName = t.dataset.op;
        if (_activeTooltip && _activeTooltip.dataset.for === opName) {
          _closeTooltip(); return;
        }
        _closeTooltip();
        _showOpTooltip(t, opName);
        return;
      }

      /* Outside click → close active tooltip */
      if (_activeTooltip && !_activeTooltip.contains(t)) {
        _closeTooltip();
      }
    });
  });

})();
