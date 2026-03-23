/* ==========================================================
   Politik-LK — quiz-ext.js
   New quiz types: Checkbox MC · Dropdown Lückentext ·
   Selbsteinschätzung · Zuordnung-Tabelle · Markieren
   Requires: engine.js (PLK registry + PLK.shR + PLK.upAB
             + PLK._saveAbState) and quiz-base.js loaded first.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ES5 helper — NodeList.forEach is ES6; use this instead */
  function _each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  /* ── Internal save/restore (extend state.ab blob) ──────── */

  function _saveExt(ab, state) {
    /* Called from engine.js _saveAbState — if PLK._saveExtState exists */
    if (!state.ab) state.ab = {};

    /* Dropdown slots — keyed by wrapId + slotIndex per spec §4.6.
       AUTHORING RULE: every group of .drop-slot elements must be inside a
       container element that has an id="" attribute (the same id passed to
       PLK.chkDrop(wrapId, ...)). */
    state.ab.drop = {};
    _each(ab.querySelectorAll('.drop-slot'), function (sel, pageIdx) {
      var ancestor = sel.parentElement;
      while (ancestor && ancestor !== ab && !ancestor.id) {
        ancestor = ancestor.parentElement;
      }
      var wrapId = (ancestor && ancestor !== ab && ancestor.id)
        ? ancestor.id
        : (console.warn('PLK: .drop-slot has no id\'d ancestor — state will not restore'), 'drop' + pageIdx);
      if (!state.ab.drop[wrapId]) state.ab.drop[wrapId] = {};
      var siblings = ancestor ? ancestor.querySelectorAll('.drop-slot') : [sel];
      var idx = Array.prototype.indexOf.call(siblings, sel);
      state.ab.drop[wrapId][idx < 0 ? pageIdx : idx] = sel.value;
    });

    /* Selbsteinschätzung */
    state.ab.self = {};
    _each(ab.querySelectorAll('.self-wrap[id]'), function (wrap) {
      var active = wrap.querySelector('.self-btn.active');
      if (active) state.ab.self[wrap.id] = active.getAttribute('data-v');
    });

    /* Zuordnung-Tabelle */
    state.ab.zt = {};
    _each(ab.querySelectorAll('.zt-table[id] tbody tr'), function (row, i) {
      var tableId = row.closest('.zt-table').id;
      if (!state.ab.zt[tableId]) state.ab.zt[tableId] = {};
      var checked = row.querySelector('input[type="radio"]:checked');
      if (checked) state.ab.zt[tableId][i] = checked.value;
    });

    /* Markieren */
    state.ab.mk = {};
    _each(ab.querySelectorAll('.mark-text[id]'), function (wrap) {
      state.ab.mk[wrap.id] = {};
      _each(wrap.querySelectorAll('.mk'), function (span, i) {
        state.ab.mk[wrap.id][i] = span.classList.contains('mk-selected') ? 1 : 0;
      });
    });
  }

  function _restoreExt(ab, saved) {
    if (!saved || !saved.ab) return;

    /* Dropdown — nested state.ab.drop[wrapId][slotIndex] per spec §4.6 */
    if (saved.ab.drop) {
      Object.keys(saved.ab.drop).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var slots = wrap.querySelectorAll('.drop-slot');
        var vals  = saved.ab.drop[wrapId];
        Object.keys(vals).forEach(function (idx) {
          var slot = slots[parseInt(idx, 10)];
          if (slot) slot.value = vals[idx];
        });
      });
    }

    /* Selbsteinschätzung */
    if (saved.ab.self) {
      Object.keys(saved.ab.self).forEach(function (wrapperId) {
        var wrap = document.getElementById(wrapperId);
        if (!wrap) return;
        var v = saved.ab.self[wrapperId];
        _each(wrap.querySelectorAll('.self-btn'), function (btn) {
          if (btn.getAttribute('data-v') === v) btn.classList.add('active');
        });
        wrap.classList.add('done');
      });
    }

    /* Zuordnung-Tabelle */
    if (saved.ab.zt) {
      Object.keys(saved.ab.zt).forEach(function (tableId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        var rows = table.querySelectorAll('tbody tr');
        var vals = saved.ab.zt[tableId];
        Object.keys(vals).forEach(function (idx) {
          var row = rows[parseInt(idx, 10)];
          if (!row) return;
          _each(row.querySelectorAll('input[type="radio"]'), function (radio) {
            if (radio.value === vals[idx]) radio.checked = true;
          });
        });
      });
    }

    /* Markieren */
    if (saved.ab.mk) {
      Object.keys(saved.ab.mk).forEach(function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var spans = wrap.querySelectorAll('.mk');
        var vals = saved.ab.mk[wrapId];
        Object.keys(vals).forEach(function (idx) {
          if (vals[idx] && spans[parseInt(idx, 10)]) {
            spans[parseInt(idx, 10)].classList.add('mk-selected');
          }
        });
      });
    }
  }

  function _resolveRoot(item) {
    if (!item) return null;
    return PLK._resolveQgTarget ? (PLK._resolveQgTarget(item, null) || item) : item;
  }

  function _evalDrop(wrap) {
    if (!wrap) return { correct: 0, total: 0 };
    var slots = wrap.querySelectorAll('.drop-slot[data-a]');
    var correct = 0;
    _each(slots, function (sel) {
      var expected = (sel.getAttribute('data-a') || '').toLowerCase().trim();
      var given    = (sel.value || '').toLowerCase().trim();
      sel.classList.remove('ok', 'err');
      if (given === expected) {
        sel.classList.add('ok');
        sel.disabled = true;
        correct++;
      } else {
        sel.disabled = false;
        if (given) sel.classList.add('err');
      }
    });
    return { correct: correct, total: slots.length };
  }

  function _saveDrop(wrap) {
    var values = [];
    if (!wrap) return { values: values };
    _each(wrap.querySelectorAll('.drop-slot'), function (sel) {
      values.push(sel.value);
    });
    return { values: values };
  }

  function _restoreDrop(wrap, state) {
    if (!wrap || !state || !state.values) return;
    var slots = wrap.querySelectorAll('.drop-slot');
    state.values.forEach(function (val, idx) {
      if (slots[idx]) slots[idx].value = val;
    });
    _evalDrop(wrap);
  }

  function _resetDrop(wrap) {
    if (!wrap) return;
    _each(wrap.querySelectorAll('.drop-slot'), function (sel) {
      sel.value = '';
      sel.classList.remove('ok', 'err');
      sel.disabled = false;
    });
  }

  function _evalZT(table) {
    if (!table) return { correct: 0, total: 0 };
    var rows = table.querySelectorAll('tbody tr[data-correct]');
    var correct = 0;
    _each(rows, function (row) {
      var expected = row.getAttribute('data-correct');
      var checked  = row.querySelector('input[type="radio"]:checked');
      row.classList.remove('ok', 'err');
      if (checked && checked.value === expected) {
        row.classList.add('ok');
        correct++;
      } else if (checked) {
        row.classList.add('err');
      }
    });
    return { correct: correct, total: rows.length };
  }

  function _saveZT(table) {
    var values = {};
    if (!table) return { values: values };
    _each(table.querySelectorAll('tbody tr'), function (row, i) {
      var checked = row.querySelector('input[type="radio"]:checked');
      if (checked) values[i] = checked.value;
    });
    return { values: values };
  }

  function _restoreZT(table, state) {
    if (!table || !state || !state.values) return;
    var rows = table.querySelectorAll('tbody tr');
    Object.keys(state.values).forEach(function (idx) {
      var row = rows[parseInt(idx, 10)];
      if (!row) return;
      _each(row.querySelectorAll('input[type="radio"]'), function (radio) {
        radio.checked = radio.value === state.values[idx];
      });
    });
    _evalZT(table);
  }

  function _resetZT(table) {
    if (!table) return;
    _each(table.querySelectorAll('input[type="radio"]'), function (r) {
      r.checked = false;
    });
    _each(table.querySelectorAll('tbody tr'), function (row) {
      row.classList.remove('ok', 'err');
    });
  }

  function _markExpectedCount(wrap) {
    return wrap ? wrap.querySelectorAll('.mk[data-correct="1"]').length : 0;
  }

  function _evalMark(wrap) {
    if (!wrap) return { correct: 0, total: 0 };
    var spans = wrap.querySelectorAll('.mk');
    var correct = 0;
    var total = _markExpectedCount(wrap);
    _each(spans, function (span) {
      var isCorrect  = span.getAttribute('data-correct') === '1';
      var isSelected = span.classList.contains('mk-selected');
      span.classList.remove('ok', 'err', 'mk-selected');
      if (isCorrect && isSelected) {
        span.classList.add('ok');
        correct++;
      } else if (!isCorrect && isSelected) {
        span.classList.add('err');
      } else if (isCorrect && !isSelected) {
        span.classList.add('err');
      }
    });
    return { correct: correct, total: total };
  }

  function _saveMark(wrap) {
    var selected = {};
    if (!wrap) return { selected: selected };
    _each(wrap.querySelectorAll('.mk'), function (span, i) {
      if (span.classList.contains('mk-selected') || span.classList.contains('ok')) selected[i] = 1;
    });
    return { selected: selected };
  }

  function _restoreMark(wrap, state) {
    if (!wrap || !state || !state.selected) return;
    var spans = wrap.querySelectorAll('.mk');
    Object.keys(state.selected).forEach(function (idx) {
      if (spans[parseInt(idx, 10)]) spans[parseInt(idx, 10)].classList.add('mk-selected');
    });
    _evalMark(wrap);
  }

  function _resetMark(wrap) {
    if (!wrap) return;
    _each(wrap.querySelectorAll('.mk'), function (span) {
      span.classList.remove('mk-selected', 'ok', 'err');
    });
  }

  PLK.register({
    name: 'quiz-ext',
    init: function () {

      /* Expose hooks for engine.js _saveAbState / _restoreAbState */
      PLK._saveExtState    = _saveExt;
      PLK._restoreExtState = _restoreExt;

      /* ── 1. Checkbox MC ── */
      /* Checkbox MC uses PLK.chkQ from quiz-base.js for checking.
         This function only handles visual state on change. */
      PLK.mcsCbx = function (el) {
        var li = el.parentElement ? el.parentElement.parentElement : null;
        if (!li) return;
        if (el.checked) {
          li.classList.add('sel');
        } else {
          li.classList.remove('sel');
        }
      };

      /* ── 2. Dropdown Lückentext ── */
      PLK.chkDrop = function (wrapId, n, fbId, retryId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var result = _evalDrop(wrap);
        PLK.shR(fbId, result.correct, n);
        PLK._saveAbState();
        if (result.correct === n) {
          PLK.upAB();
          if (retryId) {
            var btn = document.getElementById(retryId);
            if (btn) btn.style.display = 'none';
          }
        } else if (retryId) {
          var retBtn = document.getElementById(retryId);
          if (retBtn) retBtn.style.display = '';
        }
      };

      PLK.rstDrop = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _resetDrop(wrap);
        PLK._saveAbState();
      };

      /* ── 3. Selbsteinschätzung ── */
      PLK.chkSelf = function (btn) {
        var wrap = btn.closest('.self-wrap');
        if (!wrap || wrap.classList.contains('done')) return;
        _each(wrap.querySelectorAll('.self-btn'), function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        wrap.classList.add('done');
        PLK.upAB();
        PLK._saveAbState();
      };

      /* ── 4. Zuordnung-Tabelle ── */
      PLK.selZT = function (radio) {
        var row = radio.closest('tr');
        if (!row) return;
        row.classList.remove('ok', 'err');
      };

      PLK.chkZT = function (tableId, fbId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        var result = _evalZT(table);
        PLK.shR(fbId, result.correct, result.total);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstZT = function (tableId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        _resetZT(table);
        PLK._saveAbState();
      };

      /* ── 5. Markieren ── */
      PLK.mkCl = function (span) {
        if (span.classList.contains('ok') || span.classList.contains('err')) return;
        span.classList.toggle('mk-selected');
        PLK._saveAbState();
      };

      PLK.chkMark = function (wrapId, n, fbId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        var result = _evalMark(wrap);
        PLK.shR(fbId, result.correct, n || result.total);
        PLK.upAB();
        PLK._saveAbState();
      };

      PLK.rstMark = function (wrapId) {
        var wrap = document.getElementById(wrapId);
        if (!wrap) return;
        _resetMark(wrap);
        PLK._saveAbState();
      };

      if (PLK.registerQgType) {
        PLK.registerQgType(['drop', 'dropdown', 'gap-dropdown'], {
          check: function (item) {
            var wrap = _resolveRoot(item, '.drop-slot') || item;
            var result = _evalDrop(wrap);
            return { ok: result.total > 0 && result.correct === result.total };
          },
          reset: function (item) {
            _resetDrop(_resolveRoot(item, '.drop-slot') || item);
          },
          save: function (item) {
            return _saveDrop(_resolveRoot(item, '.drop-slot') || item);
          },
          restore: function (item, state) {
            _restoreDrop(_resolveRoot(item, '.drop-slot') || item, state);
          }
        });

        PLK.registerQgType(['zt', 'zuordnung-table'], {
          check: function (item) {
            var table = _resolveRoot(item, '.zt-table') || item;
            var result = _evalZT(table);
            return { ok: result.total > 0 && result.correct === result.total };
          },
          reset: function (item) {
            _resetZT(_resolveRoot(item, '.zt-table') || item);
          },
          save: function (item) {
            return _saveZT(_resolveRoot(item, '.zt-table') || item);
          },
          restore: function (item, state) {
            _restoreZT(_resolveRoot(item, '.zt-table') || item, state);
          }
        });

        PLK.registerQgType(['mark', 'markieren'], {
          check: function (item) {
            var wrap = _resolveRoot(item, '.mark-text') || item;
            var result = _evalMark(wrap);
            return { ok: result.total > 0 && result.correct === result.total };
          },
          reset: function (item) {
            _resetMark(_resolveRoot(item, '.mark-text') || item);
          },
          save: function (item) {
            return _saveMark(_resolveRoot(item, '.mark-text') || item);
          },
          restore: function (item, state) {
            _restoreMark(_resolveRoot(item, '.mark-text') || item, state);
          }
        });
      }

    } /* /init */
  });

})();
