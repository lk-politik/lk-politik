/* ==========================================================
   Politik-LK — ab3-methodology.js
   AB3-Reflexion Methodik: Step-Block Engine
   7 sequential gated blocks (Etappe 1 + Schritte 1–5 + Schlussfolgerung)
   Requires: engine.js (PLK registry, PLK._shuffleChildren, PLK.Progress)
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* Step metadata — indexed 0–6 */
  var STEP_COLORS = ['#6366f1','#3b82f6','#0ea5e9','#10b981','#f59e0b','#f97316','#8b5cf6'];
  var STEP_TINTS  = ['#eef2ff','#eff6ff','#f0f9ff','#f0fdf4','#fffbeb','#fff7ed','#faf5ff'];
  var STEP_LABELS = ['Etappe 1','Schritt 1','Schritt 2','Schritt 3','Schritt 4','Schritt 5','Schluss'];
  var STEP_NAMES  = ['Frage analysieren','Kriterium festlegen','Theoretischer Kontext',
                     'Fallmaterial','Verbindungen','Abwägung','Schlussfolgerung'];

  PLK.register({
    name: 'ab3-methodology',
    init: function () {
      _initBlocks();
      _restoreProgress();
    }
  });

  /* --------------------------------------------------------
     _initBlocks()
     Queries all .ab3-block elements, shuffles options in each,
     attaches click handlers to .ab3-option elements.
  -------------------------------------------------------- */
  function _initBlocks() {
    var blocks = document.querySelectorAll('.ab3-block');
    blocks.forEach(function (block, idx) {
      block.setAttribute('data-step-idx', idx);

      /* Shuffle options */
      var optContainer = block.querySelector('.ab3-options');
      if (optContainer) PLK._shuffleChildren(optContainer);

      /* Attach click handler to each option */
      var opts = block.querySelectorAll('.ab3-option');
      opts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          _handleOptionClick(block, idx, opt);
        });
      });
    });
  }

  /* --------------------------------------------------------
     _handleOptionClick(block, stepIdx, option)
     Processes a student click on an option.
  -------------------------------------------------------- */
  function _handleOptionClick(block, stepIdx, option) {
    /* Ignore clicks if block is not active */
    if (block.getAttribute('data-state') !== 'active') return;
    /* Ignore clicks if already answered correctly */
    if (block.querySelector('.ab3-option[data-correct][data-selected]')) return;

    /* Mark as selected */
    option.setAttribute('data-selected', '1');

    if (option.hasAttribute('data-correct')) {
      /* ── Correct ── */
      var row = option.querySelector('.ab3-option-row');
      if (row) { row.style.borderColor = 'var(--ok)'; }
      option.style.borderColor = 'var(--ok)';
      option.style.background = '#f0fdf4';

      var summary = option.getAttribute('data-summary') || '';
      _collapseBlock(block, stepIdx, summary);
      _unlockNext(block, stepIdx);
    } else {
      /* ── Wrong ── */
      option.style.borderColor = 'var(--err)';
      option.style.background = '#fff3f3';

      var errPanel = option.querySelector('.ab3-error');
      if (errPanel) errPanel.classList.add('visible');
    }
  }

  /* --------------------------------------------------------
     _collapseBlock(block, stepIdx, summary)
     1. Save progress (before DOM change)
     2. Set data-state="done"
     3. Update header to show ✓ badge
     4. Append Kontext entry in all SUBSEQUENT blocks
  -------------------------------------------------------- */
  function _collapseBlock(block, stepIdx, summary) {
    /* 1. Save first */
    _saveStep(stepIdx, summary);

    /* 2. Set state */
    block.setAttribute('data-state', 'done');

    /* 3. Update header: swap section badge for done badge */
    var sectionBadge = block.querySelector('.ab3-header-section');
    if (sectionBadge) {
      sectionBadge.outerHTML = '<span class="ab3-done-badge">✓ abgeschlossen</span>';
    }

    /* 4. Append Kontext entry to all subsequent blocks */
    var allBlocks = document.querySelectorAll('.ab3-block');
    allBlocks.forEach(function (b) {
      var bIdx = parseInt(b.getAttribute('data-step-idx'), 10);
      if (bIdx > stepIdx) {
        _appendKontextEntry(b, stepIdx, summary);
      }
    });
  }

  /* --------------------------------------------------------
     _appendKontextEntry(block, stepIdx, summary)
     Creates and appends one colored Kontext entry to .ab3-kontext.
  -------------------------------------------------------- */
  function _appendKontextEntry(block, stepIdx, summary) {
    var kontext = block.querySelector('.ab3-kontext');
    if (!kontext) return;

    /* Remove placeholder if present */
    var ph = kontext.querySelector('.ab3-kontext-placeholder');
    if (ph) ph.parentNode.removeChild(ph);

    var color = STEP_COLORS[stepIdx] || '#94a3b8';
    var tint  = STEP_TINTS[stepIdx]  || '#f8fafc';
    var label = STEP_LABELS[stepIdx] || ('Schritt ' + (stepIdx + 1));
    var name  = STEP_NAMES[stepIdx]  || '';

    var entry = document.createElement('div');
    entry.className = 'ab3-kontext-entry';
    entry.setAttribute('data-for-step', stepIdx);
    entry.innerHTML =
      '<div class="ab3-kontext-head" style="background:' + color + '">' +
        '<span class="ab3-kontext-label">' + label + ' \u2713</span>' +
        '<span class="ab3-kontext-name">' + name + '</span>' +
      '</div>' +
      '<div class="ab3-kontext-body" style="background:' + tint + '">' + _esc(summary) + '</div>';

    kontext.appendChild(entry);
  }

  /* --------------------------------------------------------
     _unlockNext(block, stepIdx)
     Finds the next locked block and activates it.
     If no next block exists (last step), scrolls to #ab-section.
  -------------------------------------------------------- */
  function _unlockNext(block, stepIdx) {
    var nextBlock = _findNextLocked(block);
    if (nextBlock) {
      nextBlock.setAttribute('data-state', 'active');
      setTimeout(function () {
        nextBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } else {
      /* Last block completed — activate Arbeitsblatt */
      var abSection = document.getElementById('ab-section');
      if (abSection) {
        abSection.setAttribute('data-state', 'ready');
        setTimeout(function () {
          abSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    }
  }

  /* --------------------------------------------------------
     _findNextLocked(block)
     Returns the next .ab3-block[data-state="locked"] sibling,
     or null if none exists.
  -------------------------------------------------------- */
  function _findNextLocked(block) {
    var all = document.querySelectorAll('.ab3-block');
    var found = false;
    for (var i = 0; i < all.length; i++) {
      if (found && all[i].getAttribute('data-state') === 'locked') {
        return all[i];
      }
      if (all[i] === block) found = true;
    }
    return null;
  }

  /* --------------------------------------------------------
     _saveStep(stepIdx, summary)
     Persists one completed step to localStorage.
  -------------------------------------------------------- */
  function _saveStep(stepIdx, summary) {
    if (typeof CONF === 'undefined') return;
    var d = PLK.Progress.load(CONF.id) || {};
    if (!d.ab3) d.ab3 = { steps: {}, abGates: {} };
    if (!d.ab3.steps) d.ab3.steps = {};
    d.ab3.steps[stepIdx] = { done: true, summary: summary };
    PLK.Progress.save(CONF.id, d);
  }

  /* --------------------------------------------------------
     _restoreProgress()
     On page load: re-applies done states and Kontext entries
     from localStorage. Shuffle already ran in _initBlocks().
     Summary strings are read from localStorage, never from
     the (now-shuffled) DOM.
  -------------------------------------------------------- */
  function _restoreProgress() {
    if (typeof CONF === 'undefined') return;
    var d = PLK.Progress.load(CONF.id);
    if (!d || !d.ab3 || !d.ab3.steps) return;

    var steps = d.ab3.steps;
    var allBlocks = document.querySelectorAll('.ab3-block');

    /* Sort completed step indices ascending so Kontext entries are appended in order */
    var doneIndices = Object.keys(steps)
      .map(function (k) { return parseInt(k, 10); })
      .filter(function (idx) { return steps[idx] && steps[idx].done; })
      .sort(function (a, b) { return a - b; });

    doneIndices.forEach(function (stepIdx) {
      var summary = steps[stepIdx].summary || '';

      /* Collapse the corresponding block */
      var block = allBlocks[stepIdx];
      if (block) {
        block.setAttribute('data-state', 'done');
        var sectionBadge = block.querySelector('.ab3-header-section');
        if (sectionBadge) {
          sectionBadge.outerHTML = '<span class="ab3-done-badge">✓ abgeschlossen</span>';
        }
      }

      /* Append Kontext entry to all subsequent blocks */
      allBlocks.forEach(function (b) {
        var bIdx = parseInt(b.getAttribute('data-step-idx'), 10);
        if (bIdx > stepIdx) {
          /* Only add if not already present */
          if (!b.querySelector('.ab3-kontext-entry[data-for-step="' + stepIdx + '"]')) {
            _appendKontextEntry(b, stepIdx, summary);
          }
        }
      });
    });

    /* Unlock the first non-done block if all previous are done */
    var lastDone = doneIndices.length > 0 ? Math.max.apply(null, doneIndices) : -1;
    allBlocks.forEach(function (b) {
      var bIdx = parseInt(b.getAttribute('data-step-idx'), 10);
      if (bIdx === lastDone + 1 && b.getAttribute('data-state') === 'locked') {
        b.setAttribute('data-state', 'active');
      }
    });

    /* If all 7 steps done, activate ab-section */
    if (doneIndices.length >= 7) {
      var abSection = document.getElementById('ab-section');
      if (abSection) abSection.setAttribute('data-state', 'ready');
    }
  }

  /* --------------------------------------------------------
     _esc(str) — minimal HTML escaping for text injected into innerHTML
  -------------------------------------------------------- */
  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
