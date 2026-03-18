/* ==========================================================
   Politik-LK — uk-quiz.js
   Interactive Urteilskompetenz block — select-all then validate
   Structure: Einleitung → Hauptteil → Schlussfolgerung
   Maßstab/Kriterium: inline <select> dropdown (not a separate step)
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

    // Main criterion dropdown
    var mainSel = block.querySelector('.uk-kriterium-sel[data-role="main"]');
    if (mainSel) {
      // Shuffle main options
      var opts = Array.from(mainSel.querySelectorAll('option[data-msidx]'));
      _shuffle(opts).forEach(function (opt) { mainSel.appendChild(opt); });

      // Clone options into each recheck dropdown (independently shuffled)
      block.querySelectorAll('.uk-kriterium-sel[data-role="recheck"]').forEach(function (recheckSel) {
        var clones = opts.map(function (opt) { return opt.cloneNode(true); });
        _shuffle(clones).forEach(function (opt) { recheckSel.appendChild(opt); });

        recheckSel.addEventListener('change', function () {
          _clearKriteriumWrapError(recheckSel.closest('.uk-kriterium'));
          _checkAllSelected(block);
        });
      });

      mainSel.addEventListener('change', function () {
        _clearKriteriumWrapError(mainSel.closest('.uk-kriterium'));
        _checkAllSelected(block);
      });
    }

    // Option click handlers
    block.querySelectorAll('.uk-opt').forEach(function (opt) {
      opt.addEventListener('click', function () { _onOptClick(block, opt); });
    });
  }

  function _clearKriteriumWrapError(wrap) {
    if (!wrap) return;
    wrap.classList.remove('invalid', 'valid');
    var err = wrap.querySelector('.uk-kriterium-error');
    if (err) { err.textContent = ''; err.style.display = 'none'; }
  }

  function _clearKriteriumError(block) {
    block.querySelectorAll('.uk-kriterium').forEach(function (wrap) {
      _clearKriteriumWrapError(wrap);
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

    // Main criterion dropdown must have a value
    var mainSel = block.querySelector('.uk-kriterium-sel[data-role="main"]');
    if (mainSel && !mainSel.value) allDone = false;

    // All recheck dropdowns must have a value
    block.querySelectorAll('.uk-kriterium-sel[data-role="recheck"]').forEach(function (sel) {
      if (!sel.value) allDone = false;
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

    // Validate main criterion dropdown
    var mainSel = block.querySelector('.uk-kriterium-sel[data-role="main"]');
    var mainMsidx = null;
    if (mainSel) {
      var mainOpt = mainSel.options[mainSel.selectedIndex];
      var msCorrect = mainOpt && mainOpt.dataset.correct === 'true';
      mainMsidx = mainOpt ? mainOpt.dataset.msidx : null;
      var mainWrap = mainSel.closest('.uk-kriterium');

      if (!msCorrect) {
        allCorrect = false;
        if (mainWrap) {
          mainWrap.classList.add('invalid');
          mainWrap.classList.remove('valid');
          var errEl = mainWrap.querySelector('.uk-kriterium-error');
          if (errEl && mainOpt) {
            var label = ERROR_LABELS[mainOpt.dataset.error] || 'FEHLER';
            errEl.textContent = label + (mainOpt.dataset.errtext ? ' — ' + mainOpt.dataset.errtext : '');
            errEl.style.display = 'block';
          }
        }
      } else {
        if (mainWrap) { mainWrap.classList.add('valid'); mainWrap.classList.remove('invalid'); }
      }
    }

    // Validate recheck dropdowns — must match main msidx
    block.querySelectorAll('.uk-kriterium-sel[data-role="recheck"]').forEach(function (recheckSel) {
      var recheckOpt = recheckSel.options[recheckSel.selectedIndex];
      var matches = recheckOpt && recheckOpt.dataset.msidx === mainMsidx;
      var recheckWrap = recheckSel.closest('.uk-kriterium');

      if (!matches) {
        allCorrect = false;
        if (recheckWrap) {
          recheckWrap.classList.add('invalid');
          recheckWrap.classList.remove('valid');
          var rErr = recheckWrap.querySelector('.uk-kriterium-error');
          if (rErr) {
            rErr.textContent = 'ROTER FADEN VERLOREN — Du hast ein anderes Kriterium gewählt als in der Einleitung.';
            rErr.style.display = 'block';
          }
        }
      } else {
        if (recheckWrap) { recheckWrap.classList.add('valid'); recheckWrap.classList.remove('invalid'); }
      }
    });

    // Validate step options
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
