/* ==========================================================
   Politik-LK — tooltips.js
   Operator badge tooltips · Fachbegriff popovers
   Requires: css/style.css sections 40-42
   Load after engine.js in unit HTML files.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Shared state ──────────────────────────────────────── */
  var _operators  = null;  // Loaded from data/operators.json
  var _glossary   = null;  // Loaded from data/glossary.json
  var _activeTooltip = null;  // Currently visible tooltip element

  /* ── Base path (resolve from script src: …/js/tooltips.js → …/) ── */
  var _base = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/js\/tooltips\.js.*$/i, '');
    // Fallback: guess from document location
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
    /* Prefer script-injected globals (work on file:// protocol) */
    if (window._PLK_OPERATORS) { _operators = window._PLK_OPERATORS; }
    else { _fetchJSON('data/operators.json', function (data) { _operators = data; }); }

    if (window._PLK_GLOSSARY) { _glossary = window._PLK_GLOSSARY; }
    else { _fetchJSON('data/glossary.json',  function (data) { _glossary  = data; }); }
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

  /* ── Tooltip positioning ───────────────────────────────── */

  function _positionTooltip(tooltip, anchor) {
    var r    = anchor.getBoundingClientRect();
    var tw   = 280;
    // position:fixed is viewport-relative — do NOT add window.scrollY/scrollX
    var top  = r.bottom + 8;
    var left = r.left;

    // Keep within viewport
    if (left + tw > window.innerWidth - 16) {
      left = window.innerWidth - tw - 16;
    }
    if (left < 8) left = 8;

    tooltip.style.top  = top + 'px';
    tooltip.style.left = left + 'px';
  }

  function _closeTooltip() {
    if (_activeTooltip) {
      _activeTooltip.remove();
      _activeTooltip = null;
    }
  }

  /* ── Operator badge tooltips ────────────────────────────── */

  function _initOpBadges() {
    document.querySelectorAll('.op-badge').forEach(function (badge) {
      badge.addEventListener('click', function (e) {
        e.stopPropagation();

        // Toggle: close if same badge clicked again
        if (_activeTooltip && _activeTooltip.dataset.for === badge.dataset.op) {
          _closeTooltip();
          return;
        }
        _closeTooltip();

        var opName = badge.dataset.op;
        var op = _opByName(opName);

        var tooltip = document.createElement('div');
        tooltip.className = 'op-tooltip';
        tooltip.dataset.for = opName;

        if (_operators === null) {
          // Data still loading
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

        var entry = _glossary === null ? null : _termByName(termText);
        var tooltip = document.createElement('div');
        tooltip.className = 'fb-tooltip';
        tooltip.dataset.for = 'fb-' + termText;

        if (_glossary === null) {
          tooltip.innerHTML = '<div class="fb-tooltip-term">' + termText + '</div>' +
            '<div class="fb-tooltip-def">Lade Daten \u2026</div>';
        } else if (!entry) {
          tooltip.innerHTML = '<div class="fb-tooltip-term">' + termText + '</div>' +
            '<div class="fb-tooltip-def">Definition nicht gefunden.</div>';
        } else {
          var unitLinks = entry.units.map(function (u) { return 'Einheit ' + u; }).join(', ');
          var abLabel   = entry.ab ? ' \u00b7 AB ' + ['', 'I', 'II', 'III'][entry.ab] : '';
          tooltip.innerHTML =
            '<div class="fb-tooltip-term">' + entry.term + abLabel + '</div>' +
            '<div class="fb-tooltip-def">' + entry.def + '</div>' +
            '<div class="fb-tooltip-units">\u2192 ' + unitLinks + '</div>';
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

    // Close tooltips on outside click
    document.addEventListener('click', function (e) {
      if (_activeTooltip && !_activeTooltip.contains(e.target)) {
        _closeTooltip();
      }
    });
  });

})();
