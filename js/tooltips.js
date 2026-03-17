/* ==========================================================
   Politik-LK — tooltips.js
   Operator badge tooltips · Fachbegriff popovers · Priority toggle
   Requires: css/style.css sections 40-42
   Load after engine.js in unit HTML files.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Shared state ──────────────────────────────────────── */
  var _operators  = null;  // Loaded from /data/operators.json
  var _glossary   = null;  // Loaded from /data/glossary.json
  var _activeTooltip = null;  // Currently visible tooltip element

  /* ── Data loading ──────────────────────────────────────── */

  function _fetchJSON(path, cb) {
    fetch(path)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + path);
        return r.json();
      })
      .then(cb)
      .catch(function (e) { console.warn('[tooltips.js]', e); });
  }

  function _loadData() {
    _fetchJSON('/data/operators.json', function (data) { _operators = data; });
    _fetchJSON('/data/glossary.json',  function (data) { _glossary  = data; });
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

  /* ── Priority toggle ────────────────────────────────────── */

  function _initPriorityToggle() {
    var btn = document.querySelector('.prio-toggle-btn');
    if (!btn) return;

    // Get unit id from CONF if available (set by unit HTML)
    var unitId = (typeof CONF !== 'undefined' && CONF.id) ? CONF.id : 'global';
    var storageKey = 'plk_prio_' + unitId;

    // Restore previous state
    if (localStorage.getItem(storageKey) === '1') {
      document.body.classList.add('prio-active');
      btn.textContent = '\u25c6 Pr\u00fcfungsrelevanz aktiv';
    }

    btn.addEventListener('click', function () {
      var active = document.body.classList.toggle('prio-active');
      localStorage.setItem(storageKey, active ? '1' : '0');
      btn.textContent = active ? '\u25c6 Pr\u00fcfungsrelevanz aktiv' : '\u25c7 Pr\u00fcfungsrelevanz anzeigen';
    });
  }

  /* ── Init ───────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    _loadData();
    _initOpBadges();
    _initFbTerms();
    _initPriorityToggle();

    // Close tooltips on outside click
    document.addEventListener('click', function (e) {
      if (_activeTooltip && !_activeTooltip.contains(e.target)) {
        _closeTooltip();
      }
    });
  });

})();
