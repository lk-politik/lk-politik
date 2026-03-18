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

    // Shuffle <select> dropdown options (skip empty placeholder)
    var sel = block.querySelector('.uk-kriterium-sel');
    if (sel) {
      var opts = Array.from(sel.querySelectorAll('option[data-msidx]'));
      _shuffle(opts).forEach(function (opt) { sel.appendChild(opt); });

      sel.addEventListener('change', function () {
        _updateKriteriumReminders(block, sel);
        _clearKriteriumError(block);
        _checkAllSelected(block);
      });
    }

    // Option click handlers
    block.querySelectorAll('.uk-opt').forEach(function (opt) {
      opt.addEventListener('click', function () { _onOptClick(block, opt); });
    });
  }

  /* ── Criterion reminder update ──────────────────────── */

  function _updateKriteriumReminders(block, sel) {
    var idx = sel.selectedIndex;
    var opt = idx >= 0 ? sel.options[idx] : null;
    var txt = opt && opt.value ? opt.textContent.trim() : null;

    block.querySelectorAll('.uk-kriterium-reminder-val').forEach(function (el) {
      el.innerHTML = txt
        ? '<strong>' + txt + '</strong>'
        : '<em>— noch kein Kriterium gewählt —</em>';
    });
  }

  function _clearKriteriumError(block) {
    var wrap = block.querySelector('.uk-kriterium');
    if (wrap) {
      wrap.classList.remove('invalid', 'valid');
      var err = wrap.querySelector('.uk-kriterium-error');
      if (err) { err.textContent = ''; err.style.display = 'none'; }
    }
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

    // Dropdown criterion must have a value
    var sel = block.querySelector('.uk-kriterium-sel');
    if (sel && !sel.value) allDone = false;

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

    // Validate criterion dropdown
    var sel = block.querySelector('.uk-kriterium-sel');
    if (sel) {
      var selOpt = sel.options[sel.selectedIndex];
      var msCorrect = selOpt && selOpt.dataset.correct === 'true';
      var kriteriumWrap = block.querySelector('.uk-kriterium');

      if (!msCorrect) {
        allCorrect = false;
        if (kriteriumWrap) {
          kriteriumWrap.classList.add('invalid');
          kriteriumWrap.classList.remove('valid');
          var errEl = kriteriumWrap.querySelector('.uk-kriterium-error');
          if (errEl && selOpt) {
            var label = ERROR_LABELS[selOpt.dataset.error] || 'FEHLER';
            errEl.textContent = label + (selOpt.dataset.errtext ? ' — ' + selOpt.dataset.errtext : '');
            errEl.style.display = 'block';
          }
        }
      } else {
        if (kriteriumWrap) {
          kriteriumWrap.classList.add('valid');
          kriteriumWrap.classList.remove('invalid');
        }
      }
    }

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
