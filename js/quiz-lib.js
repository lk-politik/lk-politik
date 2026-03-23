/* ==========================================================
   Politik-LK — quiz-lib.js
   Exercise library: Timeline · Flashcard · Slider ·
   Definition-Term Match · Sort into Buckets · Build-a-Concept
   Requires: engine.js (PLK registry + PLK.shR + PLK.upAB
             + PLK._saveAbState) loaded first.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ES5 helper — NodeList.forEach is ES6; use this instead */
  function _each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  /* ── State save/restore ──────────────────────────────────── */

  function _saveLib(ab, state) {
    if (!state.ab) state.ab = {};

    /* Timeline — per-slot: which chip data-id is placed there */
    state.ab.tl = {};
    _each(ab.querySelectorAll('.tl-wrap[id]'), function (wrap) {
      state.ab.tl[wrap.id] = {};
      _each(wrap.querySelectorAll('.tl-slot'), function (slot, i) {
        var chip = slot.querySelector('.tl-chip');
        if (chip) state.ab.tl[wrap.id][i] = chip.getAttribute('data-id');
      });
    });

    /* Flashcard — per-card: whether it has been flipped (seen) */
    state.ab.fc = {};
    _each(ab.querySelectorAll('.fc-card.fc-flipped[id]'), function (card) {
      state.ab.fc[card.id] = 'seen';
    });

    /* Slider — per-wrap: array of current slider values */
    state.ab.sldr = {};
    _each(ab.querySelectorAll('.sldr-wrap[id]'), function (wrap) {
      state.ab.sldr[wrap.id] = [];
      _each(wrap.querySelectorAll('.sldr-input'), function (inp, i) {
        state.ab.sldr[wrap.id][i] = inp.value;
      });
    });

    /* Def-Match — per-wrap: {termId → defId} pairing map */
    state.ab.dm = {};
    _each(ab.querySelectorAll('.dm-wrap[id]'), function (wrap) {
      state.ab.dm[wrap.id] = {};
      _each(wrap.querySelectorAll('.dm-term[data-paired]'), function (term) {
        state.ab.dm[wrap.id][term.getAttribute('data-id')] =
          term.getAttribute('data-paired');
      });
    });

    /* Sort Buckets — per-wrap: array indexed by data-order → bucketId */
    state.ab.sb = {};
    _each(ab.querySelectorAll('.sb-wrap[id]'), function (wrap) {
      state.ab.sb[wrap.id] = [];
      _each(wrap.querySelectorAll('.sb-chip[data-order]'), function (chip) {
        var bucket = chip.parentElement;
        while (bucket && !bucket.classList.contains('sb-bucket')) {
          bucket = bucket.parentElement;
        }
        var idx = parseInt(chip.getAttribute('data-order'), 10);
        state.ab.sb[wrap.id][idx] =
          bucket ? bucket.getAttribute('data-bucket-id') : null;
      });
    });

    /* Build-a-Concept — per-wrap: array indexed by chip position → 0/1 */
    state.ab.bc = {};
    _each(ab.querySelectorAll('.bc-wrap[id]'), function (wrap) {
      state.ab.bc[wrap.id] = [];
      _each(wrap.querySelectorAll('.bc-chip'), function (chip, i) {
        state.ab.bc[wrap.id][i] =
          chip.classList.contains('bc-selected') ? 1 : 0;
      });
    });
  }

  function _restoreLib(ab, saved) {
    if (!saved || !saved.ab) return;

    /* Timeline */
    if (saved.ab.tl) {
      Object.keys(saved.ab.tl).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var bank     = wrap.querySelector('.tl-bank');
        var slots    = wrap.querySelectorAll('.tl-slot');
        var slotData = saved.ab.tl[wrapId];
        if (!bank) return;
        Object.keys(slotData).forEach(function (idx) {
          var chipId = slotData[idx];
          if (!chipId) return;
          var chip = bank.querySelector('.tl-chip[data-id="' + chipId + '"]');
          if (!chip) return;
          var slot = slots[parseInt(idx, 10)];
          if (!slot) return;
          slot.appendChild(chip);
          slot.classList.add('filled');
        });
      });
    }

    /* Flashcard */
    if (saved.ab.fc) {
      Object.keys(saved.ab.fc).forEach(function (cardId) {
        var card = document.getElementById(cardId);
        if (card) card.classList.add('fc-flipped');
      });
    }

    /* Slider */
    if (saved.ab.sldr) {
      Object.keys(saved.ab.sldr).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var inputs = wrap.querySelectorAll('.sldr-input');
        var vals   = saved.ab.sldr[wrapId];
        vals.forEach(function (v, i) {
          if (inputs[i]) {
            inputs[i].value = v;
            /* Inline equivalent of PLK.sldrLive — safe before init runs */
            var display = inputs[i].parentNode &&
              inputs[i].parentNode.querySelector('.sldr-val');
            if (!display) {
              var sldrWrap = inputs[i].parentElement;
              while (sldrWrap && !sldrWrap.classList.contains('sldr-wrap')) {
                sldrWrap = sldrWrap.parentElement;
              }
              if (sldrWrap) display = sldrWrap.querySelector('.sldr-val');
            }
            if (display) display.textContent = inputs[i].value;
          }
        });
      });
    }

    /* Def-Match */
    if (saved.ab.dm) {
      Object.keys(saved.ab.dm).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var pairings = saved.ab.dm[wrapId];
        Object.keys(pairings).forEach(function (termId) {
          var defId  = pairings[termId];
          var termEl = wrap.querySelector('.dm-term[data-id="' + termId + '"]');
          var defEl  = wrap.querySelector('.dm-def[data-id="'  + defId  + '"]');
          if (!termEl || !defEl) return;
          termEl.setAttribute('data-paired', defId);
          defEl.setAttribute('data-paired',  termId);
          termEl.classList.add('paired');
          defEl.classList.add('paired');
        });
      });
    }

    /* Sort Buckets */
    if (saved.ab.sb) {
      Object.keys(saved.ab.sb).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var placements = saved.ab.sb[wrapId];
        placements.forEach(function (bucketId, order) {
          if (!bucketId) return;
          var chip = wrap.querySelector(
            '.sb-chip[data-order="' + order + '"]'
          );
          if (!chip) return;
          var bucket = wrap.querySelector(
            '.sb-bucket[data-bucket-id="' + bucketId + '"]'
          );
          if (!bucket) return;
          var itemsDiv = bucket.querySelector('.sb-bucket-items');
          if (itemsDiv) itemsDiv.appendChild(chip);
        });
      });
    }

    /* Build-a-Concept */
    if (saved.ab.bc) {
      Object.keys(saved.ab.bc).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var vals  = saved.ab.bc[wrapId];
        var chips = wrap.querySelectorAll('.bc-chip');
        vals.forEach(function (v, i) {
          if (chips[i] && v) chips[i].classList.add('bc-selected');
        });
      });
    }
  }

  /* ── Module registration ─────────────────────────────────── */

  function _scoreAbFromWrap(wrap, correct, total) {
    if (!wrap || !total || !PLK._qs || !PLK._qs.abScores) return;
    var task = wrap;
    while (task && (!task.classList || !task.classList.contains('auf') || !task.id)) {
      task = task.parentElement;
    }
    if (!task || !task.id) return;
    var abScores = PLK._qs.abScores;
    var max = abScores[task.id + '_max'] || total;
    abScores[task.id] = Math.round((correct / total) * max);
  }

  PLK.register({
    name: 'quiz-lib',
    init: function () {

      /* Expose state hooks for engine.js */
      PLK._saveLibState    = _saveLib;
      PLK._restoreLibState = _restoreLib;

      /* Store original slider default values at init time */
      _each(document.querySelectorAll('.sldr-input'), function (inp) {
        if (!inp.hasAttribute('data-default')) {
          inp.setAttribute('data-default', inp.value);
        }
      });

      /* Assign stable data-order to each chip in Sort Bucket banks */
      _each(document.querySelectorAll('.sb-bank'), function (bank) {
        _each(bank.querySelectorAll('.sb-chip'), function (chip, i) {
          chip.setAttribute('data-order', i);
        });
      });

      /* ── 1. Timeline ─────────────────────────────────────── */

      var _tlActive = null; /* currently selected chip */

      PLK.tlSel = function (el) {
        if (_tlActive) _tlActive.classList.remove('active');
        if (_tlActive === el) { _tlActive = null; return; }
        el.classList.add('active');
        _tlActive = el;
      };

      PLK.tlDrop = function (slotEl) {
        if (!_tlActive) return;
        /* Guard: active chip must belong to the same tl-wrap as the slot */
        var chipWrap = _tlActive.parentElement;
        while (chipWrap && !chipWrap.classList.contains('tl-wrap')) {
          chipWrap = chipWrap.parentElement;
        }
        var slotWrap = slotEl;
        while (slotWrap && !slotWrap.classList.contains('tl-wrap')) {
          slotWrap = slotWrap.parentElement;
        }
        if (!chipWrap || !slotWrap || chipWrap !== slotWrap) return;
        /* If slot already filled, move existing chip back to bank first */
        var existing = slotEl.querySelector('.tl-chip');
        if (existing) {
          var bank = slotWrap.querySelector('.tl-bank');
          if (bank) bank.appendChild(existing);
        }
        slotEl.appendChild(_tlActive);
        slotEl.classList.add('filled');
        _tlActive.classList.remove('active');
        _tlActive = null;
        PLK._saveAbState();
      };

      PLK.chkTL = function (wrapId, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var slots   = wrap.querySelectorAll('.tl-slot');
        var correct = 0;
        _each(slots, function (slot) {
          var chip     = slot.querySelector('.tl-chip');
          var placed   = chip ? chip.getAttribute('data-id') : null;
          var expected = slot.getAttribute('data-correct');
          slot.classList.remove('ok', 'err');
          if (placed && placed === expected) {
            slot.classList.add('ok');
            correct++;
          } else if (placed) {
            slot.classList.add('err');
          }
        });
        _scoreAbFromWrap(wrap, correct, slots.length);
        PLK.shR(fbId, correct, slots.length);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstTL = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var bank = wrap.querySelector('.tl-bank');
        if (!bank) return;
        _each(wrap.querySelectorAll('.tl-slot .tl-chip'), function (chip) {
          chip.classList.remove('active');
          bank.appendChild(chip);
        });
        _each(wrap.querySelectorAll('.tl-slot'), function (slot) {
          slot.classList.remove('filled', 'ok', 'err');
        });
        if (_tlActive) { _tlActive = null; }
        PLK._saveAbState();
      };

      /* ── 2. Flashcard ────────────────────────────────────── */

      PLK.fcFlip = function (el) {
        var card = el;
        while (card && !card.classList.contains('fc-card')) {
          card = card.parentElement;
        }
        if (!card) return;
        card.classList.toggle('fc-flipped');
        PLK._saveAbState();
      };

      PLK.rstFC = function (setId) {
        var set = document.getElementById(setId);
        if (!set) return;
        _each(set.querySelectorAll('.fc-card'), function (card) {
          card.classList.remove('fc-flipped');
        });
        PLK._saveAbState();
      };

      /* ── 3. Slider Estimation ────────────────────────────── */

      PLK.sldrLive = function (el) {
        var wrap = el;
        while (wrap && !wrap.classList.contains('sldr-wrap')) {
          wrap = wrap.parentElement;
        }
        if (!wrap) return;
        var display = wrap.querySelector('.sldr-val');
        if (display) display.textContent = el.value;
      };

      PLK.chkSlider = function (wrapId, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var inputs  = wrap.querySelectorAll('.sldr-input');
        var correct = 0;
        _each(inputs, function (inp) {
          var val    = parseInt(inp.value, 10);
          var target = parseInt(inp.getAttribute('data-correct'), 10);
          var tol    = parseInt(inp.getAttribute('data-tol') || '5', 10);
          inp.classList.remove('correct', 'wrong');
          if (Math.abs(val - target) <= tol) {
            inp.classList.add('correct');
            correct++;
          } else {
            inp.classList.add('wrong');
          }
        });
        _scoreAbFromWrap(wrap, correct, inputs.length);
        PLK.shR(fbId, correct, inputs.length);
        /* Show correct value for each wrong slider (spec §4.3) */
        var fbEl = document.getElementById(fbId);
        if (fbEl) {
          /* Remove any correction spans from a previous check */
          _each(fbEl.querySelectorAll('.sldr-correction'), function (old) {
            old.parentNode.removeChild(old);
          });
          _each(inputs, function (inp) {
            if (inp.classList.contains('wrong')) {
              var note = document.createElement('span');
              note.className = 'sldr-correction';
              note.style.cssText =
                'display:block;font-size:.8rem;margin-top:.3rem;color:var(--ink3)';
              note.textContent =
                'Richtig: ' + inp.getAttribute('data-correct');
              fbEl.appendChild(note);
            }
          });
        }
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstSlider = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _each(wrap.querySelectorAll('.sldr-input'), function (inp) {
          var def = inp.getAttribute('data-default') || inp.defaultValue;
          inp.value = def;
          inp.classList.remove('correct', 'wrong');
          PLK.sldrLive(inp);
        });
        PLK._saveAbState();
      };

      /* ── 4. Definition → Term Match ─────────────────────── */

      PLK.dmSel = function (el, side) {
        /* Ignore already-paired items */
        if (el.hasAttribute('data-paired')) return;
        var wrap = el;
        while (wrap && !wrap.classList.contains('dm-wrap')) {
          wrap = wrap.parentElement;
        }
        if (!wrap) return;
        var sideClass  = (side === 'def') ? 'dm-def'  : 'dm-term';
        var otherClass = (side === 'def') ? 'dm-term' : 'dm-def';
        var otherActive = wrap.querySelector(
          '.' + otherClass + '.dm-active'
        );
        if (otherActive) {
          /* Complete the pair */
          var defEl  = (side === 'def')  ? el : otherActive;
          var termEl = (side === 'term') ? el : otherActive;
          defEl.setAttribute('data-paired',  termEl.getAttribute('data-id'));
          termEl.setAttribute('data-paired', defEl.getAttribute('data-id'));
          defEl.classList.remove('dm-active');
          termEl.classList.remove('dm-active');
          defEl.classList.add('paired');
          termEl.classList.add('paired');
          PLK._saveAbState();
        } else {
          /* Deselect same side, then select this one */
          _each(wrap.querySelectorAll('.' + sideClass + '.dm-active'),
            function (e) { e.classList.remove('dm-active'); }
          );
          el.classList.add('dm-active');
        }
      };

      PLK.chkDM = function (wrapId, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var terms   = wrap.querySelectorAll('.dm-term');
        var correct = 0;
        _each(terms, function (term) {
          var paired   = term.getAttribute('data-paired');
          var expected = term.getAttribute('data-correct-def');
          term.classList.remove('ok', 'err');
          var defEl = paired
            ? wrap.querySelector('.dm-def[data-id="' + paired + '"]')
            : null;
          if (defEl) defEl.classList.remove('ok', 'err');
          if (paired && paired === expected) {
            term.classList.add('ok');
            if (defEl) defEl.classList.add('ok');
            correct++;
          } else if (paired) {
            term.classList.add('err');
            if (defEl) defEl.classList.add('err');
          }
        });
        _scoreAbFromWrap(wrap, correct, terms.length);
        PLK.shR(fbId, correct, terms.length);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstDM = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _each(wrap.querySelectorAll('.dm-def, .dm-term'), function (el) {
          el.removeAttribute('data-paired');
          el.classList.remove('paired', 'dm-active', 'ok', 'err');
        });
        PLK._saveAbState();
      };

      /* ── 5. Sort into Buckets ────────────────────────────── */

      var _sbActive = null; /* currently selected chip */

      PLK.sbSel = function (el) {
        if (_sbActive) _sbActive.classList.remove('active');
        if (_sbActive === el) { _sbActive = null; return; }
        el.classList.add('active');
        _sbActive = el;
      };

      PLK.sbDrop = function (bucketEl) {
        if (!_sbActive) return;
        /* Guard: active chip must belong to the same sb-wrap as the bucket */
        var chipWrap = _sbActive.parentElement;
        while (chipWrap && !chipWrap.classList.contains('sb-wrap')) {
          chipWrap = chipWrap.parentElement;
        }
        var bucketWrap = bucketEl;
        while (bucketWrap && !bucketWrap.classList.contains('sb-wrap')) {
          bucketWrap = bucketWrap.parentElement;
        }
        if (!chipWrap || !bucketWrap || chipWrap !== bucketWrap) return;
        var itemsDiv = bucketEl.querySelector('.sb-bucket-items') || bucketEl;
        _sbActive.classList.remove('active');
        itemsDiv.appendChild(_sbActive);
        _sbActive = null;
        PLK._saveAbState();
      };

      PLK.chkSB = function (wrapId, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var chips   = wrap.querySelectorAll('.sb-chip');
        var correct = 0;
        _each(chips, function (chip) {
          var expected = chip.getAttribute('data-correct');
          var bucket   = chip.parentElement;
          while (bucket && !bucket.classList.contains('sb-bucket')) {
            bucket = bucket.parentElement;
          }
          var placed = bucket ? bucket.getAttribute('data-bucket-id') : null;
          chip.classList.remove('ok', 'err');
          if (placed && placed === expected) {
            chip.classList.add('ok');
            correct++;
          } else if (placed) {
            chip.classList.add('err');
          }
        });
        _scoreAbFromWrap(wrap, correct, chips.length);
        PLK.shR(fbId, correct, chips.length);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstSB = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var bank = wrap.querySelector('.sb-bank');
        if (!bank) return;
        _each(wrap.querySelectorAll('.sb-bucket-items .sb-chip'),
          function (chip) {
            chip.classList.remove('ok', 'err', 'active');
            bank.appendChild(chip);
          }
        );
        if (_sbActive) { _sbActive = null; }
        PLK._saveAbState();
      };

      /* ── 6. Build-a-Concept ──────────────────────────────── */

      PLK.bcTog = function (el) {
        if (el.classList.contains('bc-correct') ||
            el.classList.contains('bc-wrong')) return;
        el.classList.toggle('bc-selected');
        PLK._saveAbState();
      };

      PLK.chkBC = function (wrapId, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var chips   = wrap.querySelectorAll('.bc-chip');
        var correct = 0;
        _each(chips, function (chip) {
          var shouldSelect = chip.getAttribute('data-correct') === '1';
          var isSelected   = chip.classList.contains('bc-selected');
          chip.classList.remove('bc-selected', 'bc-correct', 'bc-wrong');
          if (shouldSelect === isSelected) {
            chip.classList.add('bc-correct');
            correct++;
          } else {
            chip.classList.add('bc-wrong');
          }
        });
        _scoreAbFromWrap(wrap, correct, chips.length);
        PLK.shR(fbId, correct, chips.length);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstBC = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _each(wrap.querySelectorAll('.bc-chip'), function (chip) {
          chip.classList.remove('bc-selected', 'bc-correct', 'bc-wrong');
        });
        PLK._saveAbState();
      };

    } /* /init */
  });

})();
