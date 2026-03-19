/* ==========================================================
   Politik-LK — uk-quiz.js
   Sequential Urteilskompetenz block — 3-stage reveal
   Stage 1: Einleitung (Kriterium + AB I)
   Stage 2: Hauptteil (Recheck #1 + AB II)
   Stage 3: Schlussfolgerung (Recheck #2 + AB III)
   Kriterium: must be correct to advance stage 1.
   AB step options: any selection suffices (reflection, not tested).
   Recheck chips: must match _kritIdx to advance stages 2 and 3.
   Load after engine.js in unit HTML files.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

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

  /* ── Init ───────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.uk').forEach(_initBlock);
  });

  function _initBlock(block) {
    /* Shuffle options in each step's .uk-opts list */
    block.querySelectorAll('[data-step] .uk-opts').forEach(function (ul) {
      var items = Array.from(ul.querySelectorAll('.uk-opt'));
      _shuffle(items).forEach(function (li) { ul.appendChild(li); });
    });

    /* _kritIdx: closure variable — tracks selected Kriterium msidx.
       Note: window.selKrit and window.submitStage are assigned here.
       If multiple .uk blocks exist on a page, the last _initBlock wins.
       Unit 3.5 has one .uk block — safe. */
    var _kritIdx = null;

    /* ── Kriterium selection ─────────────────────────────── */
    window.selKrit = function (el) {
      var parent = el.closest('.uk-krit-opts');
      if (!parent) return;
      parent.querySelectorAll('.uk-krit-opt').forEach(function (o) {
        o.classList.remove('selected', 'wrong');
        var errSpan = o.querySelector('.uk-krit-opt-err');
        if (errSpan) errSpan.textContent = '';
      });
      el.classList.add('selected');
      _kritIdx = el.getAttribute('data-msidx');

      /* Pre-select matching chip in all recheck blocks */
      block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
        recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
          chip.classList.toggle('selected', chip.getAttribute('data-msidx') === _kritIdx);
        });
      });

      _checkStageReady(block);
    };

    /* ── Recheck chip click ───────────────────────────────── */
    block.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var recheck = chip.closest('.uk-krit-recheck');
        if (!recheck) return;
        recheck.querySelectorAll('.uk-krit-chip').forEach(function (c) {
          c.classList.remove('selected', 'wrong');
        });
        var rErr = recheck.querySelector('.uk-krit-recheck-err');
        if (rErr) { rErr.textContent = ''; rErr.style.display = 'none'; }
        chip.classList.add('selected');
        _kritIdx = chip.getAttribute('data-msidx');
        _checkStageReady(block);
      });
    });

    /* ── Option click ────────────────────────────────────── */
    block.querySelectorAll('.uk-opt').forEach(function (opt) {
      opt.addEventListener('click', function () { _onOptClick(block, opt); });
    });

    /* ── Per-stage submit ────────────────────────────────── */
    window.submitStage = function (btn, stageNum) {
      _submitStage(block, btn, stageNum, _kritIdx);
    };
  }

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

    /* Recheck chip must be selected (stages 2+) */
    var recheck = stage.querySelector('.uk-krit-recheck');
    if (recheck) {
      if (!recheck.querySelector('.uk-krit-chip.selected')) allReady = false;
    }

    /* Every step in this stage must have a selection */
    stage.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
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

    pool.querySelectorAll('.uk-opt').forEach(function (o) {
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
  function _submitStage(block, btn, stageNum, _kritIdx) {
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
            var errType  = kritOpt.getAttribute('data-error') || '';
            var errText  = kritOpt.getAttribute('data-errtext') || '';
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
      var expectedMsidx = (_kritIdx !== null) ? String(_kritIdx) : null;

      if (recheckMsidx !== expectedMsidx) {
        allCorrect = false;
        recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
          if (chip.getAttribute('data-msidx') !== expectedMsidx) {
            chip.classList.add('wrong');
          }
        });
        var rErr = recheck.querySelector('.uk-krit-recheck-err');
        if (rErr) {
          rErr.textContent = 'Dieser Maßstab stimmt nicht mit deiner Wahl überein. Überprüfe dein Kriterium.';
          rErr.style.display = 'block';
        }
      }
    }

    /* AB step options: mark selected as correct (any selection passes) */
    stage.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
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

    /* Stage passed — show compact done view */
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

  /* ── Error display helpers ───────────────────────────── */
})();
