/* ==========================================================
   Politik-LK — quiz-base.js
   Existing quiz types: MC · text input · ordered list ·
   Zuordnung · Lückentext · Kategorisierung · Freitext
   Requires: engine.js (PLK registry + PLK.shR + PLK.upAB)
             loaded before this file.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ── Private helpers (not on PLK) ── */

  /**
   * frC(value, bankId)
   * Chip in Bank wieder freigeben (nach Entfernen aus Slot).
   */
  var frC = function (value, bankId) {
    var bank = bankId ? document.getElementById(bankId) : null;
    if (!bank) return;
    var chip = bank.querySelector('[data-v="' + value + '"][data-used="1"]');
    if (chip) {
      chip.classList.remove('used', 'selected');
      chip.removeAttribute('data-used');
    }
  };

  /**
   * uM(taskNr, leftId)
   * Zuordnung aufheben.
   */
  var uM = function (taskNr, leftId) {
    var _zMap = PLK._qs.zMap;
    if (!_zMap[taskNr] || !_zMap[taskNr][leftId]) return;
    var rightId  = _zMap[taskNr][leftId];
    delete _zMap[taskNr][leftId];

    var leftEl  = document.querySelector('[data-task="' + taskNr + '"][data-z="l"][data-id="' + leftId + '"]');
    var rightEl = document.querySelector('[data-task="' + taskNr + '"][data-z="r"][data-id="' + rightId + '"]');
    if (leftEl)  { leftEl.classList.remove('matched', 'correct', 'wrong'); PLK._zVisConn(taskNr, leftId, null); }
    if (rightEl) rightEl.classList.remove('matched', 'correct', 'wrong');
  };

  PLK.register({
    name: 'quiz-base',
    init: function () {

      /* --------------------------------------------------------
         mcS(el) — Multiple-Choice Auswahl
         Markiert ausgewählte Option visuell.
      -------------------------------------------------------- */
      PLK.mcS = function (el) {
        var name  = el.name;
        var group = document.querySelectorAll('input[name="' + name + '"]');
        group.forEach(function (inp) {
          var item = inp.closest('.mco');
          if (item) item.classList.remove('selected');
        });
        var item = el.closest('.mco');
        if (item) item.classList.add('selected');
      };

      /* --------------------------------------------------------
         oMv(arrow, direction) — Reihenfolge-Item verschieben
         direction: -1 (nach oben) oder +1 (nach unten)
      -------------------------------------------------------- */
      PLK.oMv = function (arrow, direction) {
        var item   = arrow.closest('.oitem');
        var list   = item ? item.closest('.olist') : null;
        if (!list) return;

        var items  = Array.from(list.querySelectorAll('.oitem'));
        var idx    = items.indexOf(item);
        var target = items[idx + direction];
        if (!target) return;

        if (direction === -1) {
          list.insertBefore(item, target);
        } else {
          list.insertBefore(target, item);
        }
        PLK.oRenum(list);
      };

      /* --------------------------------------------------------
         oRenum(list) — Nummerierung nach Verschiebung aktualisieren
      -------------------------------------------------------- */
      PLK.oRenum = function (list) {
        var items = list.querySelectorAll('.oitem');
        items.forEach(function (item, i) {
          var num = item.querySelector('.oitem-num');
          if (num) num.textContent = (i + 1) + '.';
        });
      };

      function _isModuleQgChild(el) {
        return !!(PLK._closestQgItem && PLK._closestQgItem(el));
      }

      function _getGateItems(gate) {
        return PLK._getGateItems ? PLK._getGateItems(gate) : [];
      }

      /* --------------------------------------------------------
         chkQ(gateNr, questionCount)
         Prüft ein Quiz-Gate. Gibt Feedback, schaltet bei Erfolg frei.
      -------------------------------------------------------- */
      PLK.chkQ = function (gateNr, questionCount) {
        var gate   = document.getElementById('qg' + gateNr);
        if (!gate) return;
        /* data-passed guard removed: CSS visibility controls button access;
           allowing re-evaluation lets users check answers after restoration. */

        var total  = 0;
        var correct = 0;

        /* -- MC-Fragen prüfen -- */
        var mcGroups = {};
        gate.querySelectorAll('.mco input[type="radio"], .mco input[type="checkbox"]').forEach(function (inp) {
          if (_isModuleQgChild(inp)) return;
          if (!mcGroups[inp.name]) mcGroups[inp.name] = [];
          mcGroups[inp.name].push(inp);
        });

        Object.keys(mcGroups).forEach(function (name) {
          total++;
          var inputs  = mcGroups[name];
          var allOk   = true;
          var anyWrong = false;

          inputs.forEach(function (inp) {
            var item     = inp.closest('.mco');
            var expected = item ? item.getAttribute('data-correct') === '1' : false;
            item && item.classList.remove('correct', 'wrong');

            if (inp.checked && !expected) { anyWrong = true; }
            if (!inp.checked && expected) { anyWrong = true; }
          });

          /* Visuelles Feedback */
          inputs.forEach(function (inp) {
            var item     = inp.closest('.mco');
            var expected = item ? item.getAttribute('data-correct') === '1' : false;
            if (inp.checked) {
              item && item.classList.add(expected ? 'correct' : 'wrong');
            } else if (expected) {
              item && item.classList.add('wrong');
            }
          });

          if (!anyWrong) correct++;
        });

        /* -- Texteingaben prüfen -- */
        gate.querySelectorAll('.qinp input[data-answers], .qinp textarea[data-answers]').forEach(function (inp) {
          if (_isModuleQgChild(inp)) return;
          total++;
          var answers = inp.getAttribute('data-answers').split('|').map(function (s) { return s.trim().toLowerCase(); });
          var val     = inp.value.trim().toLowerCase();
          var fb      = inp.closest('.qinp') ? inp.closest('.qinp').querySelector('.qinp-feedback') : null;

          /* Accept if any keyword appears anywhere in the student's answer */
          var isCorrect = val.length > 0 && answers.some(function (a) { return val.indexOf(a) !== -1; });
          if (isCorrect) {
            correct++;
            inp.style.borderColor = 'var(--ok)';
            if (fb) { fb.className = 'qinp-feedback ok'; fb.textContent = '✓ Richtig'; }
          } else {
            inp.style.borderColor = 'var(--err)';
            if (fb) { fb.className = 'qinp-feedback err'; fb.textContent = '✗ Nicht ganz — überprüfe deine Antwort.'; }
          }
        });

        /* -- Reihenfolge-Aufgaben prüfen -- */
        gate.querySelectorAll('.olist[data-correct]').forEach(function (list) {
          if (_isModuleQgChild(list)) return;
          total++;
          var expected = list.getAttribute('data-correct').split(',').map(function (s) { return s.trim(); });
          var items    = list.querySelectorAll('.oitem');
          var order    = Array.from(items).map(function (item) { return item.getAttribute('data-id') || ''; });
          var ok       = JSON.stringify(expected) === JSON.stringify(order);

          items.forEach(function (item) {
            item.classList.remove('correct', 'wrong');
            item.classList.add(ok ? 'correct' : 'wrong');
          });
          if (ok) correct++;
        });

        _getGateItems(gate).forEach(function (item) {
          total++;
          var type = item.getAttribute('data-qg-type');
          var handler = type ? PLK._qgTypes[type] : null;
          var result = handler && handler.check ? handler.check(item, gateNr, gate) : null;
          if (result && result.ok) correct++;
        });

        /* -- Feedback anzeigen -- */
        var fbEl = PLK._getGateFeedbackEl ? PLK._getGateFeedbackEl(gateNr, gate) : document.getElementById('qfb' + gateNr);
        if (fbEl) {
          fbEl.style.display = 'block';
          if (correct === total) {
            fbEl.className = 'mc-feedback ok';
            fbEl.textContent = '✓ Alle Antworten richtig!';
          } else {
            fbEl.className = 'mc-feedback err';
            fbEl.textContent = correct + ' von ' + total + ' richtig. Versuche es nochmal!';
          }
        }

        /* -- Bei vollem Erfolg: Gate bestanden -- */
        if (correct === total && total > 0) {
          gate.setAttribute('data-passed', '1');
          gate.setAttribute('data-state', 'passed');
          /* Update status pill to "Block N: Bestanden" */
          var pill = document.getElementById('qg' + gateNr + 's');
          if (pill) {
            pill.textContent = 'Block ' + gateNr + ': Bestanden';
            pill.className = 'qg-status pass';
          }
          PLK._qs.qgPass[gateNr] = true;
          PLK._saveGates();
          PLK._saveGateAnswers(gateNr, gate);
          PLK.unlk(gateNr);
        }
      };

      /* --------------------------------------------------------
         rstQ(gateNr) — Gate zurücksetzen (nur wenn nicht bestanden)
      -------------------------------------------------------- */
      PLK.rstQ = function (gateNr) {
        if (PLK._qs.qgPass[gateNr]) return;
        var gate = document.getElementById('qg' + gateNr);
        if (!gate) return;

        /* MC zurücksetzen */
        gate.querySelectorAll('.mco input').forEach(function (inp) {
          if (_isModuleQgChild(inp)) return;
          inp.checked = false;
          var item = inp.closest('.mco');
          if (item) item.classList.remove('selected', 'correct', 'wrong');
        });

        /* Texteingaben */
        gate.querySelectorAll('.qinp input, .qinp textarea').forEach(function (inp) {
          if (_isModuleQgChild(inp)) return;
          inp.value = '';
          inp.style.borderColor = '';
          var fb = inp.closest('.qinp') ? inp.closest('.qinp').querySelector('.qinp-feedback') : null;
          if (fb) { fb.className = 'qinp-feedback'; fb.textContent = ''; }
        });

        /* Reihenfolge-Feedback */
        gate.querySelectorAll('.oitem').forEach(function (item) {
          if (_isModuleQgChild(item)) return;
          item.classList.remove('correct', 'wrong');
        });

        _getGateItems(gate).forEach(function (item) {
          var type = item.getAttribute('data-qg-type');
          var handler = type ? PLK._qgTypes[type] : null;
          if (handler && handler.reset) handler.reset(item);
        });

        /* Gesamt-Feedback */
        var fbEl = PLK._getGateFeedbackEl ? PLK._getGateFeedbackEl(gateNr, gate) : document.getElementById('qfb' + gateNr);
        if (fbEl) { fbEl.style.display = 'none'; fbEl.textContent = ''; }
      };

      /* --------------------------------------------------------
         toggleQg(gateNr) — Collapse/expand a passed QG panel
         passed       → passed-open  (expand, keep answers — view only)
         passed-open  → passed       (collapse)
         retry        → passed       (collapse)
         open         → no-op        (cannot collapse before passing)
         Only retryQg() / the retry link resets answers.
      -------------------------------------------------------- */
      PLK.toggleQg = function (gateNr) {
        var gate = document.getElementById('qg' + gateNr);
        if (!gate) return;
        var state = gate.getAttribute('data-state') || 'open';
        if (state === 'passed') {
          /* Expand to view saved answers — no reset */
          gate.setAttribute('data-state', 'passed-open');
        } else if (state === 'passed-open') {
          /* Collapse back */
          gate.setAttribute('data-state', 'passed');
        } else if (state === 'retry') {
          gate.setAttribute('data-state', 'passed');
        }
        /* state === 'open': no-op — cannot collapse before passing */
      };

      /* --------------------------------------------------------
         retryQg(gateNr) — Expand from the retry link (same as
         clicking the header in passed state)
      -------------------------------------------------------- */
      PLK.retryQg = function (gateNr) {
        var gate = document.getElementById('qg' + gateNr);
        if (!gate) return;
        var state = gate.getAttribute('data-state') || 'open';
        if (state === 'passed' || state === 'passed-open') {
          PLK._resetQgForRetry(gateNr, gate);
          gate.setAttribute('data-state', 'retry');
        }
      };

      /* ── LÜCKENTEXT — Chip-Bank + Slots ── */

      function _clearSelectedSlot() {
        if (PLK._sc.s && PLK._sc.s.el) PLK._sc.s.el.classList.remove('selected');
        PLK._sc.s = null;
      }

      function _slotBankId(slot, fallbackBankId) {
        if (!slot) return fallbackBankId || null;
        if (slot.closest('[data-bankid]')) return slot.closest('[data-bankid]').getAttribute('data-bankid');
        return slot.getAttribute('data-bank') || fallbackBankId || null;
      }

      function _placeSelectedChip(slot) {
        if (!slot || !PLK._sc.v) return;

        var prev = slot.getAttribute('data-v');
        var bankId = _slotBankId(slot, PLK._sc.v.bankId);
        if (prev) frC(prev, bankId);

        slot.textContent  = PLK._sc.v.value;
        slot.setAttribute('data-v', PLK._sc.v.value);
        slot.classList.add('filled');
        slot.classList.remove('selected', 'correct', 'wrong');

        PLK._sc.v.el.classList.add('used');
        PLK._sc.v.el.classList.remove('selected');
        PLK._sc.v.el.setAttribute('data-used', '1');
        PLK._sc.v = null;
        _clearSelectedSlot();
        PLK._scheduleAbSave();
      }

      /**
       * selC(chip, bankId)
       * Chip auswählen oder abwählen.
       */
      PLK.selC = function (chip, bankId) {
        /* Bereits ausgewählten Chip deselecten */
        if (PLK._sc.v && PLK._sc.v.el === chip) {
          chip.classList.remove('selected');
          PLK._sc.v = null;
          return;
        }
        /* Anderen Chip deselecten */
        if (PLK._sc.v) PLK._sc.v.el.classList.remove('selected');

        chip.classList.add('selected');
        PLK._sc.v = { el: chip, value: chip.getAttribute('data-v'), bankId: bankId };

        if (PLK._sc.s && PLK._sc.s.el) {
          _placeSelectedChip(PLK._sc.s.el);
        }
      };

      /**
       * slCl(slot)
       * Slot anklicken: ausgewählten Chip einsetzen oder vorhandenen entfernen.
       */
      PLK.slCl = function (slot) {
        if (PLK._sc.v) {
          _placeSelectedChip(slot);
          return;
        }

        if (PLK._sc.s && PLK._sc.s.el === slot) {
          _clearSelectedSlot();
          return;
        }

        _clearSelectedSlot();

        if (!slot.getAttribute('data-v')) {
          slot.classList.add('selected');
          PLK._sc.s = { el: slot };
        } else {
          /* Kein Chip ausgewählt → belegten Slot leeren */
          var val = slot.getAttribute('data-v');
          if (val) {
            var bankId = _slotBankId(slot, null);
            frC(val, bankId);
            slot.textContent = '';
            slot.removeAttribute('data-v');
            slot.classList.remove('filled', 'correct', 'wrong');
          }
          PLK._scheduleAbSave();
        }
      };

      /**
       * chkSl(aufgabeId, bankId, total, resultId, retryId)
       * Lückentext prüfen. Jeder Slot trägt data-a=korrekte_Antwort.
       */
      PLK.chkSl = function (aufgabeId, bankId, total, resultId, retryId) {
        var container = document.getElementById(aufgabeId);
        if (!container) return;

        var abScores = PLK._qs.abScores;
        var correct = 0;
        container.querySelectorAll('.slot').forEach(function (slot) {
          var given    = (slot.getAttribute('data-v') || '').trim().toLowerCase();
          var expected = (slot.getAttribute('data-a') || '').trim().toLowerCase();
          slot.classList.remove('correct', 'wrong');
          if (!given) return;
          if (given === expected) { slot.classList.add('correct'); correct++; }
          else                    { slot.classList.add('wrong'); }
        });

        var pts = Math.round((correct / total) * (abScores[aufgabeId + '_max'] || total));
        abScores[aufgabeId] = pts;
        PLK.shR(resultId, correct, total);

        var retry = document.getElementById(retryId);
        if (retry) retry.style.display = correct < total ? 'inline-flex' : 'none';

        PLK.upAB();
        PLK._saveAbState();
      };

      /**
       * retSl(aufgabeId, bankId)
       * Nur falsche Slots zurücksetzen.
       */
      PLK.retSl = function (aufgabeId, bankId) {
        var container = document.getElementById(aufgabeId);
        if (!container) return;
        _clearSelectedSlot();
        container.querySelectorAll('.slot.wrong').forEach(function (slot) {
          var val = slot.getAttribute('data-v');
          if (val) frC(val, bankId);
          slot.textContent = '';
          slot.removeAttribute('data-v');
          slot.classList.remove('filled', 'wrong');
        });
      };

      /**
       * rsSl(aufgabeId, bankId)
       * Alle Slots zurücksetzen.
       */
      PLK.rsSl = function (aufgabeId, bankId) {
        var container = document.getElementById(aufgabeId);
        if (!container) return;
        _clearSelectedSlot();
        container.querySelectorAll('.slot').forEach(function (slot) {
          var val = slot.getAttribute('data-v');
          if (val) frC(val, bankId);
          slot.textContent = '';
          slot.removeAttribute('data-v');
          slot.classList.remove('filled', 'correct', 'wrong');
        });
        if (PLK._sc.v) { PLK._sc.v.el.classList.remove('selected'); PLK._sc.v = null; }
      };

      /* ── ZUORDNUNG — links-rechts Matching ── */

      /**
       * zCl(el, taskNr)
       * Klick auf ein Zuordnungs-Element.
       * Links-Elemente: data-z="l" data-id="..."
       * Rechts-Elemente: data-z="r" data-id="..."
       */
      PLK.zCl = function (el, taskNr) {
        var _zSel = PLK._qs.zSel;
        var _zMap = PLK._qs.zMap;
        var side = el.getAttribute('data-z');
        var id = el.getAttribute('data-id');

        if (_zSel[taskNr] && _zSel[taskNr].el === el) {
          el.classList.remove('selected');
          _zSel[taskNr] = null;
          return;
        }

        if (!_zSel[taskNr]) {
          el.classList.add('selected');
          _zSel[taskNr] = { side: side, id: id, el: el };
          return;
        }

        if (_zSel[taskNr].side === side) {
          _zSel[taskNr].el.classList.remove('selected');
          el.classList.add('selected');
          _zSel[taskNr] = { side: side, id: id, el: el };
          return;
        }

        if (!_zMap[taskNr]) _zMap[taskNr] = {};

        var leftId  = side === 'l' ? id : _zSel[taskNr].id;
        var rightId = side === 'r' ? id : _zSel[taskNr].id;
        var leftEl  = side === 'l' ? el : _zSel[taskNr].el;
        var rightEl = side === 'r' ? el : _zSel[taskNr].el;

        /* Bereits vorhandene Zuordnung aufheben */
        var existingRight = _zMap[taskNr][leftId];
        if (existingRight) {
          var oldRight = document.querySelector('[data-task="' + taskNr + '"][data-z="r"][data-id="' + existingRight + '"]');
          if (oldRight) oldRight.classList.remove('matched');
        }
        /* Bereits rechts zugeordnetes linkes Element suchen */
        Object.keys(_zMap[taskNr]).forEach(function (lId) {
          if (_zMap[taskNr][lId] === rightId && lId !== leftId) {
            delete _zMap[taskNr][lId];
            var oldLeft = document.querySelector('[data-task="' + taskNr + '"][data-z="l"][data-id="' + lId + '"]');
            if (oldLeft) { oldLeft.classList.remove('matched'); PLK._zVisConn(taskNr, lId, null); }
          }
        });

        _zMap[taskNr][leftId] = rightId;
        leftEl.classList.remove('selected');
        rightEl.classList.remove('selected');
        leftEl.classList.add('matched');
        rightEl.classList.add('matched');
        _zSel[taskNr] = null;
        PLK._zVisConn(taskNr, leftId, rightId);
        PLK._scheduleAbSave();
      };

      /**
       * chkZ(taskNr, aufgabeId)
       * Zuordnungen prüfen. Jedes linke Element trägt data-correct=rightId.
       */
      PLK.chkZ = function (taskNr, aufgabeId) {
        var _zMap = PLK._qs.zMap;
        var abScores = PLK._qs.abScores;
        var lefts = document.querySelectorAll('[data-task="' + taskNr + '"][data-z="l"]');
        var total = lefts.length, correct = 0;

        lefts.forEach(function (el) {
          var id       = el.getAttribute('data-id');
          var expected = el.getAttribute('data-correct');
          var given    = _zMap[taskNr] ? _zMap[taskNr][id] : null;
          el.classList.remove('correct', 'wrong');

          if (given === expected) { el.classList.add('correct'); correct++; }
          else                    { el.classList.add('wrong'); }
        });

        abScores[aufgabeId] = correct;
        PLK.shR(aufgabeId + '-result', correct, total);
        PLK.upAB();
        PLK._saveAbState();
      };

      /** retZ(taskNr, aufgabeId) — Nur falsche Zuordnungen zurücksetzen */
      PLK.retZ = function (taskNr, aufgabeId) {
        var lefts = document.querySelectorAll('[data-task="' + taskNr + '"][data-z="l"].wrong');
        lefts.forEach(function (el) { uM(taskNr, el.getAttribute('data-id')); });
        var res = document.getElementById(aufgabeId + '-result');
        if (res) res.style.display = 'none';
      };

      /** rsZ(taskNr, aufgabeId) — Alle Zuordnungen zurücksetzen */
      PLK.rsZ = function (taskNr, aufgabeId) {
        var _zMap = PLK._qs.zMap;
        if (_zMap[taskNr]) {
          Object.keys(_zMap[taskNr]).forEach(function (id) { uM(taskNr, id); });
        }
        var res = document.getElementById(aufgabeId + '-result');
        if (res) res.style.display = 'none';
      };

      /* ── KATEGORISIERUNG — Buttons pro Item ── */

      /**
       * kS(button, value)
       * Kategorie-Button auswählen. Ein Button pro Item aktiv.
       */
      PLK.kS = function (button, value) {
        var _kSel = PLK._qs.kSel;
        var item   = button.closest('.k-item');
        if (!item) return;
        var itemId = item.getAttribute('data-id');

        item.querySelectorAll('.k-btn').forEach(function (btn) { btn.classList.remove('selected'); });
        button.classList.add('selected');
        _kSel[itemId] = value;
        PLK._scheduleAbSave();
      };

      /**
       * chkK(aufgabeId)
       * Kategorisierung prüfen. Jedes .k-item trägt data-correct=wert.
       */
      PLK.chkK = function (aufgabeId) {
        var _kSel = PLK._qs.kSel;
        var abScores = PLK._qs.abScores;
        var items = document.querySelectorAll('#' + aufgabeId + ' .k-item');
        var total = items.length, correct = 0;

        items.forEach(function (item) {
          var id       = item.getAttribute('data-id');
          var expected = item.getAttribute('data-correct');
          var given    = _kSel[id];
          item.classList.remove('correct', 'wrong', 'missed');

          if (given === undefined)                       { item.classList.add('missed'); }
          else if (given === expected)                   { item.classList.add('correct'); correct++; }
          else                                           { item.classList.add('wrong'); }
        });

        abScores[aufgabeId] = correct;
        PLK.shR(aufgabeId + '-result', correct, total);
        PLK.upAB();
        PLK._saveAbState();
      };

      /** retK(aufgabeId) — Falsche und fehlende Kategorien zurücksetzen */
      PLK.retK = function (aufgabeId) {
        var _kSel = PLK._qs.kSel;
        document.querySelectorAll('#' + aufgabeId + ' .k-item.wrong, #' + aufgabeId + ' .k-item.missed').forEach(function (item) {
          item.classList.remove('wrong', 'missed');
          var id = item.getAttribute('data-id');
          delete _kSel[id];
          item.querySelectorAll('.k-btn').forEach(function (btn) { btn.classList.remove('selected'); });
        });
      };

      /** rsK(aufgabeId) — Alle Kategorien zurücksetzen */
      PLK.rsK = function (aufgabeId) {
        var _kSel = PLK._qs.kSel;
        document.querySelectorAll('#' + aufgabeId + ' .k-item').forEach(function (item) {
          item.classList.remove('correct', 'wrong', 'missed');
          var id = item.getAttribute('data-id');
          delete _kSel[id];
          item.querySelectorAll('.k-btn').forEach(function (btn) { btn.classList.remove('selected'); });
        });
        var res = document.getElementById(aufgabeId + '-result');
        if (res) res.style.display = 'none';
      };

      /**
       * rstAllAB()
       * Gesamtes Arbeitsblatt zurücksetzen (nach Bestätigung).
       */
      PLK.rstAllAB = function () {
        if (!confirm('Alle Arbeitsblatt-Eingaben zurücksetzen?')) return;

        /* Clear shared state objects in-place (cannot reassign engine.js locals) */
        var abScores = PLK._qs.abScores;
        var _kSel    = PLK._qs.kSel;
        var _zMap    = PLK._qs.zMap;
        var _zSel    = PLK._qs.zSel;
        Object.keys(abScores).forEach(function (k) { delete abScores[k]; });
        Object.keys(_kSel).forEach(function (k) { delete _kSel[k]; });
        Object.keys(_zMap).forEach(function (k) { delete _zMap[k]; });
        Object.keys(_zSel).forEach(function (k) { delete _zSel[k]; });
        if (PLK._sc.v) { PLK._sc.v.el.classList.remove('selected'); }
        if (PLK._sc.s && PLK._sc.s.el) { PLK._sc.s.el.classList.remove('selected'); }
        PLK._sc.v = null;
        PLK._sc.s = null;

        /* Alle Inputs leeren */
        var ab = document.getElementById('arbeitsblatt');
        if (!ab) return;

        ab.querySelectorAll('input[type="text"], textarea').forEach(function (el) {
          el.value = ''; el.style.borderColor = '';
        });
        ab.querySelectorAll('.slot').forEach(function (slot) {
          slot.textContent = ''; slot.removeAttribute('data-v');
          slot.classList.remove('filled', 'correct', 'wrong', 'selected');
        });
        ab.querySelectorAll('.chip').forEach(function (chip) {
          chip.classList.remove('used', 'selected'); chip.removeAttribute('data-used');
        });
        ab.querySelectorAll('.mco, .k-item').forEach(function (el) {
          el.classList.remove('correct', 'wrong', 'selected', 'matched');
        });
        ab.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function (inp) {
          inp.checked = false;
        });
        ab.querySelectorAll('.k-btn, .z-l, .z-r').forEach(function (el) {
          el.classList.remove('selected', 'matched', 'correct', 'wrong');
        });
        ab.querySelectorAll('.mc-feedback, .qinp-feedback').forEach(function (el) {
          el.style.display = 'none'; el.textContent = '';
        });
        ab.querySelectorAll('.z-badge').forEach(function (el) { el.textContent = ''; });

        PLK.upAB();
        PLK._saveAbState();
      };

      /**
       * saveAB(hintId)
       * Speichert Arbeitsblatt-Eingaben explizit (z.B. über Speichern-Button).
       * Zeigt kurz eine Bestätigung an falls hintId angegeben.
       */
      PLK.saveAB = function (hintId) {
        PLK._saveAbState();
        if (hintId) {
          var hint = document.getElementById(hintId);
          if (hint) {
            hint.textContent = 'Gespeichert';
            hint.style.color = 'var(--ok)';
            setTimeout(function () { hint.textContent = ''; }, 2000);
          }
        }
      };

      /* chkFT — Freitext: save non-empty textarea and show feedback */
      PLK.chkFT = function (textareaId, fbId) {
        var ta = document.getElementById(textareaId);
        var fb = document.getElementById(fbId);
        if (!ta) return;
        PLK._saveAbState();
        if (fb) {
          if (ta.value.trim()) {
            fb.textContent = 'Gespeichert.';
            fb.className = 'mc-feedback ok';
          } else {
            fb.textContent = 'Bitte zuerst eine Antwort eingeben.';
            fb.className = 'mc-feedback err';
          }
        }
      };

    }
  });

})();
