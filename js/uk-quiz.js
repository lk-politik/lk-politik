;(function () {
  'use strict';

  /* Element.closest() polyfill for older browsers */
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (sel) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches ? el.matches(sel) : el.msMatchesSelector(sel)) return el;
        el = el.parentElement || el.parentNode;
      }
      return null;
    };
  }

  /* ==========================================================
     Politik-LK — uk-quiz.js
     Sequential Urteilskompetenz block — 3-stage reveal
     Stage 1: Einleitung (Kriterium + AB I)
     Stage 2: Hauptteil (Recheck #1 + AB II)
     Stage 3: Schlussfolgerung (Recheck #2 + AB III)
     Kriterium: must be correct to advance stage 1.
     AB step options: any selection suffices (reflection, not tested).
     Recheck chips: must match stored krit-idx to advance stages 2 and 3.
     ES5 only — no arrow functions, no const/let.
     ========================================================== */

  /* ── Error label map ────────────────────────────────────── */
  var ERROR_LABELS = {
    'irrelevant':   'RICHTIG ABER IRRELEVANT',
    'unstructured': 'RICHTIG ABER UNSTRUKTURIERT',
    'factual':      'UNSACHLICHKEIT',
    'knowledge':    'SACHWISSEN SCHWACH',
    'chain':        'ZUSAMMENHANG UNKLAR',
    'verdict':      'WERTURTEIL OHNE ANALYSE',
    'sided':        'EINSEITIG',
    'descriptive':  'DESKRIPTIV STATT ANALYTISCH',
    'overreach':    'ÜBERGENERALISIERUNG',
    /* legacy keys kept for backwards compat */
    'level':        'AB-EBENE FALSCH',
    'step':         'FALSCHER SCHRITT',
    'vague':        'MASSSTAB ZU VAGE'
  };

  /* ── Fisher-Yates shuffle (in-place) ────────────────────── */
  function _shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function _each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  PLK.register({
    name: 'uk-quiz',
    init: function () {

      /* Shuffle options in each step's .uk-opts list for every block */
      _each(document.querySelectorAll('.uk'), function (block) {
        _each(block.querySelectorAll('[data-step] .uk-opts'), function (ul) {
          var items = Array.prototype.slice.call(ul.querySelectorAll('.uk-opt'));
          _each(_shuffle(items), function (li) { ul.appendChild(li); });
        });

        /* Recheck chip listeners — one block at a time so .uk-krit-chip
           clicks stay scoped to the right block */
        _each(block.querySelectorAll('.uk-krit-chip'), function (chip) {
          chip.addEventListener('click', function () {
            var recheck = chip.closest('.uk-krit-recheck');
            if (!recheck) return;
            _each(recheck.querySelectorAll('.uk-krit-chip'), function (c) {
              c.classList.remove('selected', 'wrong');
            });
            var rErr = recheck.querySelector('.uk-krit-recheck-err');
            if (rErr) { rErr.textContent = ''; rErr.style.display = 'none'; }
            var stage = chip.closest('.uk-stage');
            if (stage) {
              var fErr = stage.querySelector('.uk-stage-krit-err');
              if (fErr) { fErr.textContent = ''; fErr.style.display = 'none'; }
            }
            chip.classList.add('selected');
            _checkStageReady(block);
          });
        });

        /* Option click listeners */
        _each(block.querySelectorAll('.uk-opt'), function (opt) {
          opt.addEventListener('click', function () { _onOptClick(block, opt); });
        });
      });

      /* ── Kriterium selection (global, no closure-clobber) ── */
      PLK.selKrit = function (el) {
        var block = el.closest('.uk');
        if (!block) return;
        var parent = el.closest('.uk-krit-opts');
        if (!parent) return;
        _each(parent.querySelectorAll('.uk-krit-opt'), function (o) {
          o.classList.remove('selected', 'wrong');
          var errSpan = o.querySelector('.uk-krit-opt-err');
          if (errSpan) errSpan.textContent = '';
        });
        el.classList.add('selected');

        /* Store selected krit-idx on the block element so submitStage
           can retrieve it later without a closure variable */
        block.setAttribute('data-krit-idx', el.getAttribute('data-msidx'));

        /* Recheck chips are NOT pre-selected — students must confirm
           their Kriterium independently in each subsequent stage. */

        _checkStageReady(block);
      };

      /* ── Per-stage submit (global, no closure-clobber) ───── */
      PLK.submitStage = function (el, stageN) {
        var block = el.closest('.uk');
        if (!block) return;
        var kritIdx = block.getAttribute('data-krit-idx');
        _submitStage(block, el, stageN, kritIdx);
      };

    }
  });

  /* ── Get the currently active (not locked, not done) stage ── */
  function _getActiveStage(block) {
    var stages = block.querySelectorAll('.uk-stage');
    for (var i = 0; i < stages.length; i++) {
      var s = stages[i];
      if (!s.classList.contains('uk-stage-locked') &&
          !s.classList.contains('uk-stage-done')) {
        return s;
      }
    }
    return null;
  }

  /* ── Enable/disable the active stage's proceed button ───── */
  function _checkStageReady(block) {
    var stage = _getActiveStage(block);
    if (!stage) return;

    var btn = stage.querySelector('.uk-stage-submit');
    if (!btn) return;

    var allReady = true;

    /* Kriterium must be selected (stage 1) */
    var kritOpts = stage.querySelector('.uk-krit-opts');
    if (kritOpts) {
      if (!kritOpts.querySelector('.uk-krit-opt.selected')) allReady = false;
    }

    /* Every step in this stage must have a selection */
    _each(stage.querySelectorAll('[data-step] .uk-opts'), function (pool) {
      if (!pool.querySelector('.uk-opt.selected, .uk-opt.correct')) {
        allReady = false;
      }
    });

    btn.disabled = !allReady;
  }

  /* ── Option click handler ─────────────────────────────── */
  function _onOptClick(block, opt) {
    if (opt.classList.contains('correct')) return;

    var step = opt.closest('[data-step]');
    if (!step) return;

    var pool = step.querySelector('.uk-opts');
    if (!pool) return;

    _each(pool.querySelectorAll('.uk-opt'), function (o) {
      o.classList.remove('selected', 'incorrect');
      _clearErrorNodes(o);
    });

    opt.classList.add('selected');
    _checkStageReady(block);
  }

  function _clearErrorNodes(opt) {
    var chip = opt.querySelector('.uk-error-chip');
    if (chip) chip.remove();
    var errp = opt.querySelector('.uk-error-text');
    if (errp) errp.remove();
  }

  /* ── Per-stage submit and validation ─────────────────── */
  function _submitStage(block, btn, stageNum, kritIdx) {
    var stage = block.querySelector('.uk-stage[data-stage="' + stageNum + '"]');
    if (!stage) return;

    var allCorrect = true;

    /* Validate Kriterium (stage 1 only) */
    var kritOpts = stage.querySelector('.uk-krit-opts');
    if (kritOpts) {
      var kritOpt = kritOpts.querySelector('.uk-krit-opt.selected');
      if (!kritOpt || kritOpt.getAttribute('data-correct') !== 'true') {
        allCorrect = false;
        if (kritOpt) {
          kritOpt.classList.remove('selected');
          kritOpt.classList.add('wrong');
          var errEl = kritOpt.querySelector('.uk-krit-opt-err');
          if (errEl) {
            var errType = kritOpt.getAttribute('data-error') || '';
            var errText = kritOpt.getAttribute('data-errtext') || '';
            errEl.textContent = (ERROR_LABELS[errType] || 'FEHLER') +
                                (errText ? ': ' + errText : '');
          }
        }
      } else {
        kritOpt.classList.remove('selected');
        kritOpt.classList.add('correct');
      }
    }

    /* Validate recheck chip (stages 2 and 3) */
    var recheck = stage.querySelector('.uk-krit-recheck');
    if (recheck) {
      var selChip = recheck.querySelector('.uk-krit-chip.selected');
      var recheckMsidx = selChip ? selChip.getAttribute('data-msidx') : null;
      var expectedMsidx = (kritIdx !== null) ? String(kritIdx) : null;

      if (recheckMsidx !== expectedMsidx) {
        allCorrect = false;
        _each(recheck.querySelectorAll('.uk-krit-chip'), function (chip) {
          if (chip.getAttribute('data-msidx') !== expectedMsidx) {
            chip.classList.add('wrong');
          }
        });
        var rErr = recheck.querySelector('.uk-krit-recheck-err');
        if (rErr) {
          rErr.textContent = selChip
            ? 'Dieser Maßstab stimmt nicht mit deinem Kriterium aus der Einleitung überein.'
            : 'Bitte bestätige zuerst dein Kriterium aus der Einleitung.';
          rErr.style.display = 'block';
        }
        var footerErr = stage.querySelector('.uk-stage-krit-err');
        if (footerErr) {
          footerErr.textContent = selChip
            ? '⚠ Kriterium stimmt nicht überein'
            : '⚠ Kriterium bestätigen';
          footerErr.style.display = 'inline';
        }
      }
    }

    /* AB step options: mark selected as correct (any selection passes) */
    _each(stage.querySelectorAll('[data-step] .uk-opts'), function (pool) {
      var selected = pool.querySelector('.uk-opt.selected');
      if (selected) {
        selected.classList.remove('selected');
        selected.classList.add('correct');
      }
    });

    if (!allCorrect) {
      /* Re-disable button; _checkStageReady re-enables once errors are fixed */
      btn.disabled = true;
      return;
    }

    /* Stage passed — clear footer error and show compact done view */
    var footerErrClear = stage.querySelector('.uk-stage-krit-err');
    if (footerErrClear) { footerErrClear.textContent = ''; footerErrClear.style.display = 'none'; }
    stage.classList.add('uk-stage-done');

    var nextNum = stageNum + 1;
    var nextStage = block.querySelector('.uk-stage[data-stage="' + nextNum + '"]');
    if (nextStage) {
      nextStage.classList.remove('uk-stage-locked');
      _checkStageReady(block);
    } else {
      /* All stages complete */
      block.classList.add('uk-complete');
    }
  }

})();
