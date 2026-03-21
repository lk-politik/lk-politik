/* ==========================================================
   Politik-LK — tooltips.js
   Operator badge tooltips · Fachbegriff popovers
   Requires: css/style.css sections 40-42
   Load after engine.js in unit HTML files.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Category colour palette ────────────────────────────── */
  /* Two families — grey (formal/structural) and gold (active/principled).
     No red or red-adjacent colours.                              */
  var CAT_COLORS = {
    /* Grey family — dark to medium, formal structures */
    'Institution':       '#111827',  /* near-black — official bodies        */
    'Rechtsakt':         '#1f2937',  /* very dark grey — legal acts         */
    'Vertrag':           '#374151',  /* dark grey — binding treaties        */
    'Verfahren':         '#4b5563',  /* medium-dark grey — procedures       */
    'Befugnis':          '#6b7280',  /* medium grey — competences           */
    /* Gold/amber family — dark to bright, principled/active */
    'Prinzip':           '#a16207',  /* dark gold — foundational principles */
    'Integrationsstufe': '#b45309',  /* dark amber — integration levels     */
    'Posten':            '#ca8a04',  /* gold — official persons/positions   */
    'Instrument':        '#d97706',  /* amber — policy tools                */
    'Phänomen':          '#f59e0b'   /* bright amber — observable phenomena */
  };

  /* Expose so fachbegriffe.html and other pages can reuse */
  window._PLK_CAT_COLORS = CAT_COLORS;

  function _catColor(cat) { return CAT_COLORS[cat] || '#b45309'; }

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

    if (window._PLK_GLOSSARY) { _glossary = window._PLK_GLOSSARY; }
    else { _fetchJSON('data/glossary.json',  function (d) { _glossary  = d; }); }

    if (window._PLK_UNITS) { _units = window._PLK_UNITS; }
    else { _fetchJSON('data/units.json',     function (d) { _units     = d; }); }
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
    var r    = anchor.getBoundingClientRect();
    /* Read actual rendered width — works because tooltip is already in DOM */
    var tw   = tooltip.offsetWidth;
    var top  = r.bottom + 8;
    var left = r.left;

    /* Flip left if it overflows the right edge */
    if (left + tw > window.innerWidth - 16) {
      left = window.innerWidth - tw - 16;
    }
    if (left < 8) left = 8;

    /* Flip above anchor if it overflows the bottom */
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
  /* Compact: show unit number only (e.g. "3.2"), full title in
     the native tooltip (title attr). Scales to 20+ units.      */

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

  /* ── Operator badge tooltips ────────────────────────────── */

  function _initOpBadges() {
    document.querySelectorAll('.op-badge').forEach(function (badge) {
      badge.addEventListener('click', function (e) {
        e.stopPropagation();

        if (_activeTooltip && _activeTooltip.dataset.for === badge.dataset.op) {
          _closeTooltip();
          return;
        }
        _closeTooltip();

        var opName = badge.dataset.op;
        var op     = _opByName(opName);
        var tooltip = document.createElement('div');
        tooltip.className  = 'op-tooltip';
        tooltip.dataset.for = opName;

        if (_operators === null) {
          tooltip.innerHTML = '<p style="color:var(--ink3);font-size:.8rem">Lade Daten \u2026</p>';
        } else if (!op) {
          tooltip.innerHTML = '<p style="color:var(--ink3);font-size:.8rem">Operator nicht gefunden.</p>';
        } else {
          var abRoman = ['', 'I', 'II', 'III'][op.ab];
          var abLabel = abRoman ? ('AB ' + abRoman) : ('AB ' + op.ab);
          var anchor  = op.ab === 1 ? '#ab-training-i' : op.ab === 2 ? '#ab-training-ii' : '#ab-training-iii';
          tooltip.innerHTML =
            '<div class="op-tooltip-op">' + op.name + ' \u00b7 ' + abLabel + '</div>' +
            '<div class="op-tooltip-desc">' + op.description + '</div>' +
            '<div class="op-tooltip-starter">' + op.starter + '</div>' +
            '<a class="op-tooltip-link" href="/index.html' + anchor + '">\u2192 ' + abLabel + ' Leitfaden</a>';
        }

        document.body.appendChild(tooltip);
        _positionTooltip(tooltip, badge);
        _activeTooltip = tooltip;
      });
    });
  }

  /* ── Fachbegriff popovers ───────────────────────────────── */

  function _initFbTerms() {
    document.querySelectorAll('strong.fb').forEach(function (term) {
      term.addEventListener('click', function (e) {
        e.stopPropagation();

        var termText = term.textContent.trim();
        if (_activeTooltip && _activeTooltip.dataset.for === 'fb-' + termText) {
          _closeTooltip();
          return;
        }
        _closeTooltip();

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
        _positionTooltip(tooltip, term);
        _activeTooltip = tooltip;
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    _loadData();
    _initOpBadges();
    _initFbTerms();

    document.addEventListener('click', function (e) {
      if (_activeTooltip && !_activeTooltip.contains(e.target)) {
        _closeTooltip();
      }
    });
  });

})();
