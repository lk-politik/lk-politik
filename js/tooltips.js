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
  /* Blue → teal → green spectrum for structural/procedural categories.
     Grey, yellow, black, silver for the remaining types.
     No red or red-adjacent colours.                              */
  var CAT_COLORS = {
    'Vertrag':           '#1e3a8a',  /* navy blue   — binding treaties      */
    'Institution':       '#1d4ed8',  /* blue        — official bodies       */
    'Posten':            '#3b82f6',  /* light blue  — persons/offices       */
    'Verfahren':         '#0891b2',  /* teal        — procedures/flow       */
    'Befugnis':          '#166534',  /* green       — competences/powers    */
    'Instrument':        '#16a34a',  /* light green — policy tools          */
    'Rechtsakt':         '#6b7280',  /* grey        — legal acts            */
    'Integrationsstufe': '#ca8a04',  /* gold/yellow — integration levels    */
    'Phänomen':          '#111827',  /* near-black  — observable phenomena  */
    'Prinzip':           '#94a3b8'   /* silver      — foundational          */
  };

  /* Expose so fachbegriffe.html and other pages can reuse */
  window._PLK_CAT_COLORS = CAT_COLORS;

  function _catColor(cat) { return CAT_COLORS[cat] || '#6b7280'; }

  /* ── Shared state ──────────────────────────────────────── */
  var _operators     = null;
  var _glossary      = null;
  var _units         = null;
  var _activeTooltip = null;

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
    return _glossary.find(function (g) { return g.term.toLowerCase() === lower; }) || null;
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
    }
  }

  /* ── Build unit-reference chips for the tooltip ─────────── */

  function _unitRefsHtml(unitIds) {
    if (!unitIds || !unitIds.length) return '';
    return unitIds.map(function (id) {
      var unit  = _unitById(id);
      var num   = unit ? unit.num   : id;
      var title = unit ? unit.title : ('Einheit ' + id);
      if (unit && unit.status === 'active' && unit.file) {
        var href = _base + 'einheiten/' + unit.file;
        return '<a class="fb-tooltip-unit-chip" href="' + href + '" title="' + title + '">' + num + '</a>';
      }
      return '<span class="fb-tooltip-unit-chip locked" title="' + title + '">' + num + '</span>';
    }).join('');
  }

  /* ── Show helpers ───────────────────────────────────────── */

  function _showFbTooltip(anchor, termText) {
    var entry   = _glossary === null ? null : _termByName(termText);
    var tooltip = document.createElement('div');
    tooltip.className   = 'fb-tooltip';
    tooltip.dataset.for = 'fb-' + termText;

    if (_glossary === null) {
      tooltip.innerHTML =
        '<div class="fb-tooltip-header">' +
          '<span class="fb-tooltip-term">' + termText + '</span>' +
        '</div>' +
        '<div class="fb-tooltip-def">Lade Daten \u2026</div>';

    } else if (!entry) {
      tooltip.innerHTML =
        '<div class="fb-tooltip-header">' +
          '<span class="fb-tooltip-term">' + termText + '</span>' +
        '</div>' +
        '<div class="fb-tooltip-def">Definition nicht gefunden.</div>';

    } else {
      var color = _catColor(entry.cat);
      tooltip.style.borderTopColor = color;

      var catHtml = entry.cat
        ? '<span class="fb-tooltip-cat" style="color:' + color + ';background:' + color + '18">' + entry.cat + '</span>'
        : '';

      var indexHref = _base + 'fachbegriffe.html?q=' + encodeURIComponent(entry.term);
      var unitRefs  = _unitRefsHtml(entry.units);

      tooltip.innerHTML =
        '<div class="fb-tooltip-header">' +
          '<span class="fb-tooltip-term" style="color:' + color + '">' + entry.term + '</span>' +
          catHtml +
        '</div>' +
        '<div class="fb-tooltip-def">' + entry.def + '</div>' +
        '<div class="fb-tooltip-footer">' +
          '<div class="fb-tooltip-units">' + unitRefs + '</div>' +
          '<a class="fb-tooltip-index-link" href="' + indexHref + '">Alle Begriffe \u2192</a>' +
        '</div>';
    }

    document.body.appendChild(tooltip);
    _positionTooltip(tooltip, anchor);
    _activeTooltip = tooltip;
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

    /* Sort longer terms first — prevents partial matches in combined regex */
    var terms = _glossary.slice().sort(function (a, b) {
      return b.term.length - a.term.length;
    });
    var pattern = terms.map(function (g) {
      return g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|');
    var re = new RegExp('(' + pattern + ')', 'gi');

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
        s.textContent = m[1];
        frag.appendChild(s);
        last = m.index + m[1].length;
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

    /* Single delegated handler for all tooltip interactions.
       No per-element listeners needed — works for auto-tagged
       terms too, without any re-initialization.               */
    document.addEventListener('click', function (e) {
      var t = e.target;

      /* strong.fb → glossary tooltip */
      if (t.tagName === 'STRONG' && t.className && t.className.indexOf('fb') !== -1) {
        e.stopPropagation();
        var termText = t.textContent.trim();
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
