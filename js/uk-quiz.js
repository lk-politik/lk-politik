/* ==========================================================
   Politik-LK — uk-quiz.js
   Interactive Urteilskompetenz block — select-all then validate
   Structure: Einleitung → Hauptteil → Schlussfolgerung
   Load after engine.js and tooltips.js in unit HTML files.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Error label map ────────────────────────────────── */
  var ERROR_LABELS = {
    'level':   'AB-EBENE FALSCH',
    'step':    'FALSCHER SCHRITT',
    'chain':   'KETTE UNTERBROCHEN',
    'massStab': 'KEIN MAßSTAB',
    'vague':   'MAßSTAB ZU VAGE',
    'sided':   'MAßSTAB EINSEITIG',
    'factual': 'KEINE BEWERTUNGSFRAGE',
    'verdict': 'MAßSTAB ANTIZIPIERT URTEIL'
  };

  /* ── Init ───────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.uk').forEach(_initBlock);
  });

  function _initBlock(block) {
    _renderRecheckSlots(block);

    block.querySelectorAll('.uk-opt').forEach(function (opt) {
      opt.addEventListener('click', function () { _onOptClick(block, opt); });
    });
  }

  /* ── Render re-check slots from Maßstab pool ─────────── */

  function _renderRecheckSlots(block) {
    var pool = block.querySelector('[data-step="massStab"] .uk-opts-pool');
    if (!pool) return;

    block.querySelectorAll('.uk-opts-recheck').forEach(function (slot) {
      pool.querySelectorAll('.uk-opt').forEach(function (src) {
        var li = document.createElement('li');
        li.className = 'uk-opt uk-opt-recheck';
        li.dataset.msidx = src.dataset.msidx || '';
        var textEl = src.querySelector('.uk-opt-text');
        li.innerHTML = '<span class="uk-opt-text">' +
          (textEl ? textEl.textContent.trim() : '') + '</span>';

        li.addEventListener('click', function () {
          if (li.classList.contains('correct')) return;
          // Clear siblings in this slot
          slot.querySelectorAll('.uk-opt-recheck').forEach(function (r) {
            r.classList.remove('selected', 'incorrect');
            _clearErrorNodes(r);
          });
          li.classList.add('selected');
          _checkAllSelected(block);
        });

        slot.appendChild(li);
      });
    });
  }

  /* ── Option click handler ──────────────────────────── */

  function _onOptClick(block, opt) {
    if (opt.classList.contains('correct')) return;
    if (opt.classList.contains('uk-opt-recheck')) return; // handled by its own listener

    var step = opt.closest('[data-step]');
    if (!step) return;

    // Deselect + clear error state for siblings in this step's main pool
    var pool = step.querySelector('.uk-opts, .uk-opts-pool');
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

    block.querySelectorAll('[data-step]').forEach(function (step) {
      var pool = step.querySelector('.uk-opts, .uk-opts-pool');
      if (!pool) return;
      if (!pool.querySelector('.uk-opt.selected, .uk-opt.correct')) {
        allDone = false;
      }
    });

    block.querySelectorAll('.uk-opts-recheck').forEach(function (slot) {
      if (!slot.querySelector('.uk-opt.selected, .uk-opt.correct')) {
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

    // Read selected Maßstab index
    var msPool = block.querySelector('[data-step="massStab"] .uk-opts-pool');
    var selMs  = msPool ? msPool.querySelector('.uk-opt.selected, .uk-opt.correct') : null;
    var msIdx  = selMs ? selMs.dataset.msidx : null;

    var allCorrect = true;

    // Validate main step pools
    block.querySelectorAll('[data-step]').forEach(function (step) {
      var pool = step.querySelector('.uk-opts, .uk-opts-pool');
      if (!pool) return;
      var sel = pool.querySelector('.uk-opt.selected');
      if (!sel) return; // already .correct — skip

      var correct = sel.dataset.correct === 'true';
      if (!correct) allCorrect = false;

      sel.classList.remove('selected');
      sel.classList.add(correct ? 'correct' : 'incorrect');

      if (!correct) {
        _appendError(sel, sel.dataset.error || 'chain', sel.dataset.errtext || '');
      }
    });

    // Validate re-check slots
    block.querySelectorAll('.uk-recheck').forEach(function (recheck) {
      var slot = recheck.querySelector('.uk-opts-recheck');
      if (!slot) return;
      var sel = slot.querySelector('.uk-opt.selected');
      if (!sel) return;

      var matches = msIdx !== null && sel.dataset.msidx === msIdx;
      if (!matches) allCorrect = false;

      sel.classList.remove('selected');
      sel.classList.add(matches ? 'correct' : 'incorrect');

      if (!matches) {
        _appendError(sel, 'chain',
          'Du hast ein anderes Kriterium gew\u00e4hlt als in der Einleitung. ' +
          'Die Argumentation muss durchg\u00e4ngig auf demselben Ma\u00dfstab basieren.');
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
      btn.disabled = true; // re-enabled by _checkAllSelected when user re-selects
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
