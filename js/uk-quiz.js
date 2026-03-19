/* ==========================================================
   Politik-LK — uk-quiz.js
   Interactive Urteilskompetenz block — select-all then validate
   Structure: Leitfrage → Kriterium → Einleitung → Hauptteil → Schlussfolgerung
   Kriterium: card click (replaces <select> dropdown)
   Recheck: compact chips pre-selected on Kriterium card click
   Options per step: 2 (shuffled on init)
   Load after engine.js and tooltips.js in unit HTML files.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Error label map ────────────────────────────────── */
  var ERROR_LABELS = {
    'level':   'AB-EBENE FALSCH',
    'step':    'FALSCHER SCHRITT',
    'chain':   'KETTE UNTERBROCHEN',
    'vague':   'MAßSTAB ZU VAGE',
    'sided':   'MAßSTAB EINSEITIG',
    'factual': 'KEINE BEWERTUNGSFRAGE',
    'verdict': 'MAßSTAB ANTIZIPIERT URTEIL'
  };

  /* ── Fisher-Yates shuffle (in-place) ───────────────── */
  function _shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  /* ── Init ───────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.uk').forEach(_initBlock);
  });

  function _initBlock(block) {
    // Shuffle options in each step's .uk-opts list
    block.querySelectorAll('[data-step] .uk-opts').forEach(function (ul) {
      var items = Array.from(ul.querySelectorAll('.uk-opt'));
      _shuffle(items).forEach(function (li) { ul.appendChild(li); });
    });

    // ── Kriterium selection ─────────────────────────────
    // _kritIdx is a closure variable scoped to this block instance.
    // window.selKrit is assigned here so inline onclick="selKrit(this)" can reach it.
    // Note: if multiple .uk blocks exist on a page, the last _initBlock call wins.
    // Unit 3.5 has one .uk block, so this is safe.
    var _kritIdx = null;

    window.selKrit = function (el) {
      var parent = el.closest('.uk-krit-opts');
      if (!parent) return;
      // Single-select: remove selected and wrong from all siblings (clears previous error state)
      parent.querySelectorAll('.uk-krit-opt').forEach(function (o) {
        o.classList.remove('selected', 'wrong');
        var errSpan = o.querySelector('.uk-krit-opt-err');
        if (errSpan) errSpan.textContent = '';
      });
      el.classList.add('selected');
      _kritIdx = el.getAttribute('data-msidx');

      // Pre-select matching chip in all recheck blocks
      block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
        recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
          chip.classList.toggle('selected', chip.getAttribute('data-msidx') === _kritIdx);
        });
      });

      _checkAllSelected(block);
    };

    // Recheck chip click handlers
    block.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var recheck = chip.closest('.uk-krit-recheck');
        if (!recheck) return;
        recheck.querySelectorAll('.uk-krit-chip').forEach(function (c) {
          c.classList.remove('selected');
        });
        chip.classList.add('selected');
        _kritIdx = chip.getAttribute('data-msidx');
        _checkAllSelected(block);
      });
    });

    // Option click handlers
    block.querySelectorAll('.uk-opt').forEach(function (opt) {
      opt.addEventListener('click', function () { _onOptClick(block, opt); });
    });
  }

  /* ── Option click handler ──────────────────────────── */

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
    _checkAllSelected(block);
  }

  function _clearErrorNodes(opt) {
    var chip = opt.querySelector('.uk-error-chip');
    if (chip) chip.remove();
    var errp = opt.querySelector('.uk-error-text');
    if (errp) errp.remove();
  }

  /* ── All-selected check → enable/disable submit ──────── */

  function _checkAllSelected(block) {
    var allDone = true;

    // Kriterium card must be selected
    if (!block.querySelector('.uk-krit-opt.selected')) allDone = false;

    // Each recheck block must have at least one chip selected
    // (mismatch validation is deferred to chkUK — here we only check presence)
    block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
      if (!recheck.querySelector('.uk-krit-chip.selected')) allDone = false;
    });

    // Each step's .uk-opts must have a selection or correct answer
    block.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
      if (!pool.querySelector('.uk-opt.selected, .uk-opt.correct')) {
        allDone = false;
      }
    });

    var btn = block.querySelector('.uk-submit');
    if (btn) btn.disabled = !allDone;
  }

  /* ── Validation ─────────────────────────────────────── */

  window.chkUK = function (btn) {
    var block = btn.closest('.uk');
    if (!block) return;

    var allCorrect = true;

    // ── Validate Kriterium card selection ──────────────
    var kritOpt = block.querySelector('.uk-krit-opt.selected');
    var mainMsidx = null;

    if (!kritOpt) {
      allCorrect = false;
    } else {
      var msCorrect = kritOpt.getAttribute('data-correct') === 'true';
      mainMsidx = kritOpt.getAttribute('data-msidx');

      if (!msCorrect) {
        allCorrect = false;
        kritOpt.classList.remove('selected');
        kritOpt.classList.add('wrong');
        var errEl = kritOpt.querySelector('.uk-krit-opt-err');
        if (errEl) {
          var errType  = kritOpt.getAttribute('data-error') || '';
          var errText  = kritOpt.getAttribute('data-errtext') || '';
          var errLabel = ERROR_LABELS[errType] || 'FEHLER';
          errEl.textContent = errLabel + (errText ? ' — ' + errText : '');
        }
      } else {
        kritOpt.classList.remove('selected');
        kritOpt.classList.add('correct');
      }
    }

    // ── Validate recheck chips — must match mainMsidx ──
    block.querySelectorAll('.uk-krit-recheck').forEach(function (recheck) {
      var selChip = recheck.querySelector('.uk-krit-chip.selected');
      var recheckMsidx = selChip ? selChip.getAttribute('data-msidx') : null;

      if (recheckMsidx !== mainMsidx) {
        allCorrect = false;
        // Mark non-matching chips as wrong; correct chip stays
        recheck.querySelectorAll('.uk-krit-chip').forEach(function (chip) {
          if (chip.getAttribute('data-msidx') !== mainMsidx) {
            chip.classList.add('wrong');
          }
        });
        var rErr = recheck.querySelector('.uk-krit-recheck-err');
        if (rErr) {
          rErr.textContent = 'ROTER FADEN VERLOREN — Du hast ein anderes Kriterium gewählt als in der Einleitung.';
          rErr.style.display = 'block';
        }
      }
    });

    // ── Validate step options ───────────────────────────
    block.querySelectorAll('[data-step] .uk-opts').forEach(function (pool) {
      var selected = pool.querySelector('.uk-opt.selected');
      if (!selected) return; // already .correct — skip

      var correct = selected.dataset.correct === 'true';
      if (!correct) allCorrect = false;

      selected.classList.remove('selected');
      selected.classList.add(correct ? 'correct' : 'incorrect');

      if (!correct) {
        _appendError(selected, selected.dataset.error || 'chain', selected.dataset.errtext || '');
      }
    });

    // ── Outcome ─────────────────────────────────────────
    if (allCorrect) {
      block.classList.add('uk-complete');
      btn.disabled = true;
      btn.textContent = '\u2713 Abgeschlossen';
      var hint = block.querySelector('.uk-submit-hint');
      if (hint) hint.textContent = 'Vollst\u00e4ndige Argumentation \u2014 gut gemacht.';
    } else {
      btn.textContent = 'Erneut pr\u00fcfen';
      btn.disabled = true;
    }
  };

  /* ── Error display helpers ──────────────────────────── */

  function _appendError(opt, type, text) {
    var chip = document.createElement('span');
    chip.className = 'uk-error-chip';
    chip.textContent = ERROR_LABELS[type] || type.toUpperCase();
    opt.appendChild(chip);

    if (text) {
      var p = document.createElement('p');
      p.className = 'uk-error-text';
      p.textContent = text;
      opt.appendChild(p);
    }
  }

})();
