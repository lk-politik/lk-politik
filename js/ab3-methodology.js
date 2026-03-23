/* ==========================================================
   Politik-LK — ab3-methodology.js
   AB3-Reflexion Methodik: Step-Block Engine
   7 sequential gated blocks (Etappe 1 + Schritte 1–5 + Schlussfolgerung)
   Requires: engine.js (PLK registry, PLK._shuffleChildren, PLK.Progress)
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

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
     attaches click handlers to .ab3-option and .ab3-submit-btn.
  -------------------------------------------------------- */
  /* Shuffle only prose content between options; letter spans (A/B/C) stay in place. */
  function _shuffleOptionProse(container) {
    var opts = container.querySelectorAll('.ab3-option');
    if (opts.length < 2) return;

    /* Collect swappable payload from each option */
    var payloads = [];
    opts.forEach(function (opt) {
      var textEl  = opt.querySelector('.ab3-opt-text');
      var errorEl = opt.querySelector('.ab3-error');
      payloads.push({
        textHtml:  textEl  ? textEl.innerHTML  : '',
        errorHtml: errorEl ? errorEl.innerHTML : null,
        correct:   opt.hasAttribute('data-correct'),
        summary:   opt.getAttribute('data-summary') || ''
      });
    });

    /* Fisher-Yates shuffle */
    for (var i = payloads.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = payloads[i]; payloads[i] = payloads[j]; payloads[j] = tmp;
    }

    /* Re-apply shuffled payloads, leaving letter spans untouched */
    opts.forEach(function (opt, i) {
      var p      = payloads[i];
      var textEl = opt.querySelector('.ab3-opt-text');
      if (textEl) textEl.innerHTML = p.textHtml;

      var errorEl = opt.querySelector('.ab3-error');
      if (errorEl && p.errorHtml !== null) errorEl.innerHTML = p.errorHtml;

      if (p.correct) {
        opt.setAttribute('data-correct', '');
        opt.setAttribute('data-summary', p.summary);
      } else {
        opt.removeAttribute('data-correct');
        opt.removeAttribute('data-summary');
      }
    });
  }

  function _initBlocks() {
    var blocks = document.querySelectorAll('.ab3-block');
    blocks.forEach(function (block, idx) {
      block.setAttribute('data-step-idx', idx);

      /* Store original section label for reset */
      var sectionEl = block.querySelector('.ab3-header-section');
      if (sectionEl) block.setAttribute('data-section', sectionEl.textContent.trim());

      /* Shuffle prose content within options — letters (A/B/C) stay fixed */
      var optContainer = block.querySelector('.ab3-options');
      if (optContainer) _shuffleOptionProse(optContainer);

      /* Attach selection handler to each option */
      var opts = block.querySelectorAll('.ab3-option');
      opts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          _handleOptionClick(block, idx, opt);
        });
      });

      /* Attach submit handler to Prüfen button */
      var submitBtn = block.querySelector('.ab3-submit-btn');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          _handleSubmit(block, idx);
        });
      }
    });
  }

  /* --------------------------------------------------------
     _handleOptionClick(block, stepIdx, option)
     Marks a selection visually — does NOT validate.
     Validation happens in _handleSubmit via the Prüfen button.
  -------------------------------------------------------- */
  function _handleOptionClick(block, stepIdx, option) {
    /* Ignore if block is done or not active */
    if (block.getAttribute('data-state') !== 'active') return;

    /* Deselect all options and reset their styles */
    var opts = block.querySelectorAll('.ab3-option');
    opts.forEach(function (o) {
      o.removeAttribute('data-selected');
      o.style.borderColor = '';
      o.style.background  = '';
      var errPanel = o.querySelector('.ab3-error');
      if (errPanel) errPanel.classList.remove('visible');
    });

    /* Select this option */
    option.setAttribute('data-selected', '1');

    /* Enable the submit button */
    var submitBtn = block.querySelector('.ab3-submit-btn');
    if (submitBtn) submitBtn.disabled = false;
  }

  /* --------------------------------------------------------
     _handleSubmit(block, stepIdx)
     Validates the currently selected option.
     Called by the "Antwort prüfen" button click.
  -------------------------------------------------------- */
  function _handleSubmit(block, stepIdx) {
    if (block.getAttribute('data-state') !== 'active') return;

    var selectedOpt = block.querySelector('.ab3-option[data-selected]');
    if (!selectedOpt) return;

    if (selectedOpt.hasAttribute('data-correct')) {
      /* ── Correct ── */
      selectedOpt.style.borderColor = 'var(--ok)';
      selectedOpt.style.background  = '#f0fdf4';

      var summary    = selectedOpt.getAttribute('data-summary') || '';
      var answerEl   = selectedOpt.querySelector('.ab3-opt-text');
      var answerHtml = answerEl ? answerEl.innerHTML : '';

      _collapseBlock(block, stepIdx, summary, answerHtml);
      _unlockNext(block, stepIdx);
    } else {
      /* ── Wrong ── */
      selectedOpt.style.borderColor = 'var(--err)';
      selectedOpt.style.background  = '#fff3f3';

      var errPanel = selectedOpt.querySelector('.ab3-error');
      if (errPanel) errPanel.classList.add('visible');
      /* Submit stays enabled — student can pick a different option */
    }
  }

  /* --------------------------------------------------------
     _collapseBlock(block, stepIdx, summary, answerHtml)
     1. Save progress (before DOM change)
     2. Set data-state="done"
     3. Update header to show ✓ badge
     4. Inject .ab3-done-answer panel (correct answer text)
  -------------------------------------------------------- */
  function _collapseBlock(block, stepIdx, summary, answerHtml) {
    /* 1. Save first */
    _saveStep(stepIdx, summary, answerHtml || '');

    /* 2. Set state */
    block.setAttribute('data-state', 'done');

    /* 3. Update header: swap section badge for done badge */
    var sectionBadge = block.querySelector('.ab3-header-section');
    if (sectionBadge) {
      sectionBadge.outerHTML = '<span class="ab3-done-badge">✓ abgeschlossen</span>';
    }

    /* 4. Inject done-answer panel between header and body */
    if (answerHtml) {
      var doneAnswer = document.createElement('div');
      doneAnswer.className = 'ab3-done-answer';
      doneAnswer.innerHTML = answerHtml;
      var header = block.querySelector('.ab3-header');
      if (header && header.nextSibling) {
        block.insertBefore(doneAnswer, header.nextSibling);
      } else if (header) {
        block.appendChild(doneAnswer);
      }
    }

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
      }, 400);
    } else {
      /* Last block completed — activate Arbeitsblatt */
      var abSection = document.getElementById('ab-section');
      if (abSection) {
        abSection.setAttribute('data-state', 'ready');
        setTimeout(function () {
          abSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
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
     _saveStep(stepIdx, summary, answerHtml)
     Persists one completed step to localStorage.
  -------------------------------------------------------- */
  function _saveStep(stepIdx, summary, answerHtml) {
    if (typeof CONF === 'undefined') return;
    var d = PLK.Progress.load(CONF.id) || {};
    if (!d.ab3) d.ab3 = { steps: {}, abGates: {} };
    if (!d.ab3.steps) d.ab3.steps = {};
    d.ab3.steps[stepIdx] = { done: true, summary: summary, answer: answerHtml || '' };
    PLK.Progress.save(CONF.id, d);
  }

  /* --------------------------------------------------------
     _restoreProgress()
     On page load: re-applies done states and done-answer panels
     from localStorage.
     Shuffle already ran in _initBlocks().
     Data is read from localStorage, never from the shuffled DOM.
  -------------------------------------------------------- */
  function _restoreProgress() {
    if (typeof CONF === 'undefined') return;
    var d = PLK.Progress.load(CONF.id);
    if (!d || !d.ab3 || !d.ab3.steps) return;

    var steps = d.ab3.steps;
    var allBlocks = document.querySelectorAll('.ab3-block');

    /* Sort completed step indices ascending */
    var doneIndices = Object.keys(steps)
      .map(function (k) { return parseInt(k, 10); })
      .filter(function (idx) { return steps[idx] && steps[idx].done; })
      .sort(function (a, b) { return a - b; });

    doneIndices.forEach(function (stepIdx) {
      var answerHtml = steps[stepIdx].answer  || '';

      /* Collapse the corresponding block */
      var block = allBlocks[stepIdx];
      if (block) {
        block.setAttribute('data-state', 'done');

        var sectionBadge = block.querySelector('.ab3-header-section');
        if (sectionBadge) {
          sectionBadge.outerHTML = '<span class="ab3-done-badge">✓ abgeschlossen</span>';
        }

        /* Inject done-answer panel */
        if (answerHtml && !block.querySelector('.ab3-done-answer')) {
          var doneAnswer = document.createElement('div');
          doneAnswer.className = 'ab3-done-answer';
          doneAnswer.innerHTML = answerHtml;
          var header = block.querySelector('.ab3-header');
          if (header && header.nextSibling) {
            block.insertBefore(doneAnswer, header.nextSibling);
          } else if (header) {
            block.appendChild(doneAnswer);
          }
        }
      }

    });

    /* Unlock the first non-done block */
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
     PLK.resetAB3()
     Resets the 7 AB3 step blocks to their initial state,
     clears stored progress, and re-locks #ab-section.
     Does NOT touch the UK quiz state.
  -------------------------------------------------------- */
  PLK.resetAB3 = function () {
    if (!confirm('Lerneinheit zurücksetzen? Der Fortschritt der 7 Schritte wird gelöscht.')) return;

    /* Clear localStorage ab3 data */
    if (typeof CONF !== 'undefined') {
      var d = PLK.Progress.load(CONF.id) || {};
      delete d.ab3;
      PLK.Progress.save(CONF.id, d);
    }

    var allBlocks = document.querySelectorAll('.ab3-block');
    allBlocks.forEach(function (block, i) {
      /* Remove done-answer panel */
      var doneAnswer = block.querySelector('.ab3-done-answer');
      if (doneAnswer) doneAnswer.parentNode.removeChild(doneAnswer);

      /* Restore section badge from stored data-section */
      var doneBadge = block.querySelector('.ab3-done-badge');
      if (doneBadge) {
        var sectionText = block.getAttribute('data-section') || '';
        doneBadge.outerHTML = '<span class="ab3-header-section">' + sectionText + '</span>';
      }

      /* Reset data-state */
      block.setAttribute('data-state', i === 0 ? 'active' : 'locked');

      /* Clear option states */
      block.querySelectorAll('.ab3-option').forEach(function (opt) {
        opt.removeAttribute('data-selected');
        opt.style.borderColor = '';
        opt.style.background  = '';
        var errPanel = opt.querySelector('.ab3-error');
        if (errPanel) errPanel.classList.remove('visible');
      });

      /* Disable submit button */
      var btn = block.querySelector('.ab3-submit-btn');
      if (btn) btn.disabled = true;
    });

    /* Re-lock ab-section */
    var abSection = document.getElementById('ab-section');
    if (abSection) abSection.removeAttribute('data-state');
  };

  /* --------------------------------------------------------
     PLK.resetUK(blockId)
     Resets a UK quiz block to its initial state (Stage 1 active,
     stages 2-3 locked, all selections cleared).
     Called by the "↺ Zurücksetzen" button in the template.
  -------------------------------------------------------- */
  PLK.resetUK = function (blockId) {
    var block = document.getElementById(blockId);
    if (!block) return;

    block.classList.remove('uk-complete');
    block.removeAttribute('data-krit-idx');

    /* Reset stage lock states */
    var stages = block.querySelectorAll('.uk-stage');
    stages.forEach(function (stage, i) {
      stage.classList.remove('uk-stage-done');
      if (i > 0) stage.classList.add('uk-stage-locked');
    });

    /* Clear kriterium option states + error text */
    block.querySelectorAll('.uk-krit-opt').forEach(function (o) {
      o.classList.remove('selected', 'correct', 'wrong');
      var errSpan = o.querySelector('.uk-krit-opt-err');
      if (errSpan) errSpan.textContent = '';
    });

    /* Clear step option states */
    block.querySelectorAll('.uk-opt').forEach(function (o) {
      o.classList.remove('selected', 'correct', 'incorrect');
    });

    /* Clear recheck chip states + error messages */
    block.querySelectorAll('.uk-krit-chip').forEach(function (c) {
      c.classList.remove('selected', 'wrong');
    });
    block.querySelectorAll('.uk-krit-recheck-err').forEach(function (el) {
      el.textContent = '';
      el.style.display = 'none';
    });

    /* Disable all submit buttons */
    block.querySelectorAll('.uk-stage-submit').forEach(function (btn) {
      btn.disabled = true;
    });
  };

})();
