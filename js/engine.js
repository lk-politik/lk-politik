/* ==========================================================
   Politik-LK — engine.js
   Quiz-Engine · Arbeitsblatt-Engine · Passwort-System v2
   progress.js absorbed — PLK.Progress handles localStorage
   ==========================================================
   Jede Einheit definiert CONF im eigenen HTML:
   var CONF = {
     id: '3-5',
     blocks: 3,
     gates: 3,
     abPts: 12,
     stuPw: 'vier-freiheiten&grenzen',
     masterPw: 'PO-LK'          // optional, überschreibt Default
   };
   ========================================================== */

;(function () {
  'use strict';

  /* ── PLK Module Registry ──────────────────────────────── */
  window.PLK = {
    _mods: [],
    _qgTypes: {},
    register: function (mod) { PLK._mods.push(mod); },
    registerQgType: function (names, def) {
      if (!names || !def) return;
      if (!Array.isArray(names)) names = [names];
      names.forEach(function (name) {
        if (name) PLK._qgTypes[name] = def;
      });
    },
    init:     function ()    {
      PLK._mods.forEach(function (m) { if (m.init) m.init(); });
    }
  };

  /* ── Progress (localStorage) ──────────────────────────── */
  /* Absorbed from progress.js — progress.js will be deleted in Task 4 */
  PLK.Progress = (function () {

    var PREFIX = 'plk_';

    /* --------------------------------------------------------
       Interner Helfer: sicheres JSON-Parse
    -------------------------------------------------------- */
    function _parse(raw) {
      try { return raw ? JSON.parse(raw) : null; }
      catch (e) { return null; }
    }

    /* --------------------------------------------------------
       saveProgress(unitId, data)
       data = { gates: {qg1: true, ...}, abPts: 0, unlocked: false, timestamp: ... }
    -------------------------------------------------------- */
    function saveProgress(unitId, data) {
      if (!unitId) return;
      data.timestamp = Date.now();
      try {
        localStorage.setItem(PREFIX + unitId, JSON.stringify(data));
      } catch (e) {
        console.warn('[Progress] Speichern fehlgeschlagen:', e);
      }
    }

    /* --------------------------------------------------------
       loadProgress(unitId)
       Gibt gespeichertes Objekt oder null zurück.
    -------------------------------------------------------- */
    function loadProgress(unitId) {
      if (!unitId) return null;
      return _parse(localStorage.getItem(PREFIX + unitId));
    }

    /* --------------------------------------------------------
       clearProgress(unitId)
       Löscht Fortschritt einer einzelnen Einheit.
    -------------------------------------------------------- */
    function clearProgress(unitId) {
      if (!unitId) return;
      localStorage.removeItem(PREFIX + unitId);
    }

    /* --------------------------------------------------------
       clearAllProgress()
       Löscht den gesamten PLK-Fortschritt (nach Bestätigung).
    -------------------------------------------------------- */
    function clearAllProgress() {
      if (!confirm('Gesamten Lernfortschritt löschen?\nDieser Schritt kann nicht rückgängig gemacht werden.')) return;
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
    }

    /* --------------------------------------------------------
       getAllProgress()
       Gibt Objekt { unitId: data, ... } aller PLK-Einheiten zurück.
       Nützlich für ein späteres Dashboard.
    -------------------------------------------------------- */
    function getAllProgress() {
      var result = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) {
          var id = k.slice(PREFIX.length);
          result[id] = _parse(localStorage.getItem(k));
        }
      }
      return result;
    }

    /* --------------------------------------------------------
       Public API
    -------------------------------------------------------- */
    return {
      save:     saveProgress,
      load:     loadProgress,
      clear:    clearProgress,
      clearAll: clearAllProgress,
      getAll:   getAllProgress
    };

  })();
  /* ==========================================================
     PASSWORT-SYSTEM v2
     ========================================================== */

  var _DEFAULT_MASTER = 'PO-LK';
  var _PW_STORE_KEY   = 'plk_masterPw';
  var _STU_STORE_PFX  = 'plk_stuPw_';

  /* Wortliste für Passwort-Generierung (thematisch neutral) */
  var _WORDS = [
    'atlas','delta','elbe','rhein','mosel','saar','donau','main',
    'karte','markt','zone','raum','recht','vertrag','charta',
    'ebene','stufe','kreis','linie','feld','wert','kraft','grund',
    'brücke','tor','weg','pfad','fluss','ufer','kern','rand'
  ];

  /* Gibt das aktive Masterpasswort zurück */
  function _getMasterPw() {
    var stored = localStorage.getItem(_PW_STORE_KEY);
    return stored || _DEFAULT_MASTER;
  }

  /* Gibt das aktive Schülerpasswort für eine Einheit zurück */
  function _getStuPw(unitId) {
    var stored = localStorage.getItem(_STU_STORE_PFX + unitId);
    return stored || (typeof CONF !== 'undefined' ? CONF.stuPw : null);
  }

  /**
   * setMasterPw(newPw)
   * Überschreibt das Masterpasswort in localStorage.
   * Aufruf z.B. aus der Browser-Konsole: setMasterPw('neues-pw')
   */
  PLK.setMasterPw = function (newPw) {
    if (!newPw) return;
    localStorage.setItem(_PW_STORE_KEY, newPw);
    console.info('[PW] Masterpasswort gespeichert.');
  };

  /**
   * setStuPw(unitId, newPw)
   * Überschreibt das Schülerpasswort einer Einheit in localStorage.
   */
  PLK.setStuPw = function (unitId, newPw) {
    if (!unitId || !newPw) return;
    localStorage.setItem(_STU_STORE_PFX + unitId, newPw);
    console.info('[PW] Schülerpasswort für Einheit ' + unitId + ' gespeichert.');
  };

  /**
   * regenerateAllPw()
   * Generiert neue Schülerpasswörter für alle bekannten Einheiten
   * und gibt eine Übersicht zurück.
   */
  PLK.regenerateAllPw = function () {
    var progress  = PLK.Progress.getAll();
    var unitIds   = Object.keys(progress);
    var generated = {};

    unitIds.forEach(function (id) {
      var w1 = _WORDS[Math.floor(Math.random() * _WORDS.length)];
      var w2 = _WORDS[Math.floor(Math.random() * _WORDS.length)];
      var special = ['!','&','#','@','%'][Math.floor(Math.random() * 5)];
      var pw = w1 + '-' + w2 + special;
      localStorage.setItem(_STU_STORE_PFX + id, pw);
      generated[id] = pw;
    });

    console.table(generated);
    return generated;
  };

  /* --------------------------------------------------------
     Passwort prüfen & Einheit freischalten
  -------------------------------------------------------- */

  window.PLK.resetUnit = function () {
    PLK.Progress.clear(typeof CONF !== 'undefined' ? CONF.id : null);
    location.reload();
  };

  /**
   * chkPw(inputId, hintId)
   * Wird durch das Passwort-Feld aufgerufen (onkeydown Enter / button click).
   * Akzeptiert Schüler- und Masterpasswort gleich.
   * Zeigt bei Treffer das Schülerpasswort neben dem Feld an.
   */
  PLK.chkPw = function (inputId, hintId) {
    var inp  = document.getElementById(inputId);
    var hint = document.getElementById(hintId);
    if (!inp) return;

    var val    = inp.value.trim();
    var master = _getMasterPw();
    var stu    = _getStuPw(CONF.id);
    var match  = (val === master || val === stu);

    if (!match) {
      if (hint) { hint.className = 'pw-hint err'; hint.textContent = 'Falsches Passwort.'; }
      inp.style.borderColor = 'var(--err)';
      return;
    }

    /* Passwort korrekt → alles freischalten */
    _unlockAll();

    /* Schülerpasswort anzeigen (or generic success if none) */
    if (hint) {
      hint.className = 'pw-hint ok';
      hint.textContent = stu ? 'Passwort: ' + stu : '✓ Freigeschalten';
    }

    /* Passwort-Eingabe + Freischalten-Button ausblenden, Reset-Button bleibt */
    var wrap = inp.closest('.pw-input') || document.getElementById('pw-wrap');
    if (wrap) wrap.classList.add('pw-done');

    /* In localStorage speichern */
    _persistUnlock();
  };

  /* Schaltet alle Blöcke, Gates und das Arbeitsblatt sofort frei */
  function _unlockAll() {
    /* Alle locked-Elemente freischalten */
    var locked = document.querySelectorAll('.locked');
    locked.forEach(function (el) {
      el.classList.remove('locked');
    });

    /* UK-Stage-Sperren aufheben */
    document.querySelectorAll('.uk-stage-locked').forEach(function (el) {
      el.classList.remove('uk-stage-locked');
    });

    /* AB3-Blöcke freischalten (data-state="locked" → "active") */
    document.querySelectorAll('.ab3-block[data-state="locked"]').forEach(function (el) {
      el.setAttribute('data-state', 'active');
    });

    /* AB-Section freischalten falls vorhanden */
    var abSection = document.getElementById('ab-section');
    if (abSection) abSection.setAttribute('data-state', 'ready');

    /* Auflösungs-Boxen sichtbar machen */
    var aufls = document.querySelectorAll('.aufloesung-box');
    aufls.forEach(function (el) { el.classList.add('vis'); });

    /* Alle Gates als bestanden markieren */
    if (typeof CONF !== 'undefined') {
      for (var g = 1; g <= CONF.gates; g++) {
        qgPass[g] = true;
        var gate = document.getElementById('qg' + g);
        if (gate) {
          gate.setAttribute('data-passed', '1');
          gate.setAttribute('data-state', 'passed');
        }
        var pill = document.getElementById('qg' + g + 's');
        if (pill) {
          pill.textContent = 'Block ' + g + ': Bestanden';
          pill.className = 'qg-status pass';
        }
      }
    }

    /* Fortschrittsbalken anhand des echten Zustands aktualisieren */
    _updateProgressBar();
  }

  /* Speichert freigeschalteten Zustand */
  function _persistUnlock() {
    if (typeof CONF === 'undefined') return;
    var existing = PLK.Progress.load(CONF.id) || {};
    existing.unlocked = true;
    /* Guard: existing might not have a gates object if only einstieg was saved */
    if (!existing.gates) existing.gates = {};
    for (var g = 1; g <= CONF.gates; g++) {
      existing.gates['qg' + g] = true;
    }
    PLK.Progress.save(CONF.id, existing);
    _updateProgressBar();
  }

  /* --------------------------------------------------------
     Beim Laden: gespeicherten Zustand wiederherstellen
  -------------------------------------------------------- */
  function _restoreState() {
    if (typeof CONF === 'undefined') return;
    var saved = PLK.Progress.load(CONF.id);

    /* Auto-unlock units flagged as freeUnlock (no gate required) */
    if (CONF.freeUnlock && !(saved && saved.unlocked)) {
      _unlockAll();
      _persistUnlock();
      saved = PLK.Progress.load(CONF.id);
    }

    if (!saved) return;

    /* Restore Einstieg passed state — must come before saved.unlocked check */
    if (saved.einstieg) {
      var einstieg = document.getElementById('einstieg');
      if (einstieg) {
        einstieg.setAttribute('data-state', 'passed');
        var pill = document.getElementById('einstieg-status');
        if (pill) pill.textContent = 'Bestanden';
        /* Restore chip selections so correct answers are visible when opened */
        if (saved.einstiegSel) {
          _einstiegSel = saved.einstiegSel;
          Object.keys(saved.einstiegSel).forEach(function (sitNr) {
            var val = saved.einstiegSel[sitNr];
            var chip = einstieg.querySelector('.einstieg-card[data-sit="' + sitNr + '"] .e-chip[data-v="' + val + '"]');
            if (chip) chip.classList.add('correct');
          });
        }
      }
    }

    if (saved.unlocked) {
      _unlockAll();
      /* Passwort-Eingabe + Freischalten-Button ausblenden, Reset-Button bleibt */
      document.querySelectorAll('.pw-input').forEach(function (el) {
        el.classList.add('pw-done');
      });
      var pwWrap = document.getElementById('pw-wrap');
      if (pwWrap) pwWrap.classList.add('pw-done');
      _restoreAbState(saved);
      return;
    }

    /* Einzelne Gates wiederherstellen */
    if (saved.gates) {
      Object.keys(saved.gates).forEach(function (key) {
        if (saved.gates[key]) {
          var nr = parseInt(key.replace('qg', ''), 10);
          qgPass[nr] = true;
          /* NOTE: _saveGates stores qgPass with integer keys.
             After JSON round-trip these become string keys like "1", "2".
             Use 'qg' + nr to construct the correct element ID. */
          var gateId = 'qg' + nr;
          var gate = document.getElementById(gateId);
          if (gate) {
            gate.setAttribute('data-passed', '1');
            gate.setAttribute('data-state', 'passed');
            if (saved.gateAnswers && saved.gateAnswers[nr]) {
              _restoreGateAnswers(nr, gate, saved.gateAnswers[nr]);
            }
            var pill = document.getElementById(gateId + 's');
            if (pill) {
              pill.textContent = 'Block ' + nr + ': Bestanden';
              pill.className = 'qg-status pass';
            }
          }
          /* Nächsten Block freischalten ohne Animation */
          _unlockBlock(nr, false);
          /* Also unlock the .qg-wrapper for the next gate (no animation on restore) */
          var restoredGate = document.getElementById('qg' + (nr + 1));
          if (restoredGate) {
            var restoredWrapper = restoredGate.closest('.qg-wrapper');
            if (restoredWrapper) restoredWrapper.classList.remove('locked');
          }
        }
      });
    }

    // Restore data-gate blocks for already-passed gates.
    // Note: qgPass keys are integers (set as qgPass[gateNr] where gateNr is a number).
    // When serialised to JSON and reloaded, they become string keys like "1", "2", "3".
    // parseInt handles both numeric and string keys correctly.
    if (saved.gates) {
      Object.keys(saved.gates).forEach(function (key) {
        if (saved.gates[key]) {
          var gateNr = parseInt(key, 10);
          document.querySelectorAll('[data-gate="' + gateNr + '"]').forEach(function (el) {
            el.classList.remove('locked');
          });
        }
      });
    }

    /* Wenn alle Gates bestanden → Arbeitsblatt freischalten */
    if (typeof CONF !== 'undefined') {
      var allRestored = true;
      for (var rg = 1; rg <= CONF.gates; rg++) {
        if (!qgPass[rg]) { allRestored = false; break; }
      }
      if (allRestored) {
        var abEl = document.getElementById('arbeitsblatt');
        if (abEl) abEl.classList.remove('locked');
      }
    }

    _updateProgressBar();
    _restoreAbState(saved);
  }

  /* ==========================================================
     QUIZ-ENGINE
     ========================================================== */

  /* Speichert bestandene Gates { 1: true, 2: false, ... } */
  var qgPass = {};
  PLK._qs = { qgPass: qgPass };  /* shared quiz state for quiz-base.js */

  function _matches(el, selector) {
    if (!el || !selector) return false;
    var fn = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
    return fn ? fn.call(el, selector) : false;
  }

  function _closestQgItem(el) {
    while (el) {
      if (el.getAttribute && el.getAttribute('data-qg-type')) return el;
      el = el.parentElement;
    }
    return null;
  }

  function _getGateItems(gate) {
    if (!gate) return [];
    return Array.from(gate.querySelectorAll('[data-qg-type]')).filter(function (el) {
      var parent = el.parentElement;
      while (parent && parent !== gate) {
        if (parent.getAttribute && parent.getAttribute('data-qg-type')) return false;
        parent = parent.parentElement;
      }
      return true;
    });
  }

  function _getGateItemKey(item, fallbackIdx) {
    if (!item) return 'qg-item-' + fallbackIdx;
    return item.getAttribute('data-qg-key')
      || item.id
      || item.getAttribute('data-qg-id')
      || ('qg-item-' + fallbackIdx);
  }

  function _getGateFeedbackEl(gateNr, gate) {
    return document.getElementById('qfb' + gateNr)
      || document.getElementById('qg' + gateNr + 'r')
      || (gate ? gate.querySelector('[data-qg-feedback]') : null);
  }

  function _resolveQgTarget(item, selector) {
    if (!item) return null;
    var targetId = item.getAttribute('data-qg-target');
    var target = targetId ? document.getElementById(targetId) : null;
    if (target) return target;
    if (!selector) return item;
    if (_matches(item, selector)) return item;
    return item.querySelector(selector);
  }

  PLK._closestQgItem = _closestQgItem;
  PLK._getGateItems = _getGateItems;
  PLK._getGateItemKey = _getGateItemKey;
  PLK._getGateFeedbackEl = _getGateFeedbackEl;
  PLK._resolveQgTarget = _resolveQgTarget;

  /* mcS, oMv, oRenum — moved to quiz-base.js (PLK.mcS, PLK.oMv, PLK.oRenum) */

  /* chkQ, rstQ, toggleQg, retryQg — moved to quiz-base.js */

  /* Fisher-Yates shuffle of all children of a parent element */
  PLK._shuffleChildren = function (parent) {
    var items = Array.from(parent.children);
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
    }
    var frag = document.createDocumentFragment();
    items.forEach(function (item) { frag.appendChild(item); });
    parent.appendChild(frag);
  };
  var _shuffleChildren = PLK._shuffleChildren;

  /* Resets answers inside a QG and shuffles option order so students can't
     memorise position. qgPass[gateNr] and data-passed are NOT cleared. */
  function _resetQgForRetry(gateNr, gate) {
    /* Allow re-submission after retry */
    gate.removeAttribute('data-passed');

    gate.querySelectorAll('.mco input').forEach(function (inp) {
      inp.checked = false;
      var item = inp.closest('.mco');
      if (item) item.classList.remove('selected', 'correct', 'wrong');
    });
    gate.querySelectorAll('.qinp input, .qinp textarea').forEach(function (inp) {
      inp.value = '';
      inp.style.borderColor = '';
      var fb = inp.closest('.qinp') ? inp.closest('.qinp').querySelector('.qinp-feedback') : null;
      if (fb) { fb.className = 'qinp-feedback'; fb.textContent = ''; }
    });
    gate.querySelectorAll('.oitem').forEach(function (item) {
      item.classList.remove('correct', 'wrong');
    });
    var fbEl = _getGateFeedbackEl(gateNr, gate);
    if (fbEl) { fbEl.style.display = 'none'; fbEl.textContent = ''; }

    /* Shuffle MC option order */
    gate.querySelectorAll('.mco-list').forEach(function (list) {
      _shuffleChildren(list);
    });
    /* Shuffle ordering task items and re-number */
    gate.querySelectorAll('.olist').forEach(function (list) {
      _shuffleChildren(list);
      PLK.oRenum(list);
    });

    if (PLK._getGateItems) {
      PLK._getGateItems(gate).forEach(function (item) {
        var type = item.getAttribute('data-qg-type');
        var handler = type ? PLK._qgTypes[type] : null;
        if (handler && handler.reset) handler.reset(item);
      });
    }
  }
  PLK._resetQgForRetry = _resetQgForRetry;

  /* --------------------------------------------------------
     unlk(gateNr) — Nächsten Block & Gate freischalten
  -------------------------------------------------------- */
  PLK.unlk = function (gateNr) {
    _unlockBlock(gateNr, true);

    // Unlock new block types (ab2, uk) declared with data-gate attribute
    document.querySelectorAll('[data-gate="' + gateNr + '"].locked').forEach(function (el) {
      el.classList.remove('locked');
      el.classList.add('unlocking');
      setTimeout(function () { el.classList.remove('unlocking'); }, 600);
    });

    _updateProgressBar();

    /* Wenn alle Gates bestanden: Arbeitsblatt freischalten */
    if (typeof CONF !== 'undefined') {
      var allPassed = true;
      for (var g = 1; g <= CONF.gates; g++) {
        if (!qgPass[g]) { allPassed = false; break; }
      }
      if (allPassed) {
        var ab = document.getElementById('arbeitsblatt');
        if (ab) {
          ab.classList.remove('locked');
          ab.classList.add('unlocking');
          setTimeout(function () { ab.classList.remove('unlocking'); }, 600);
        }
        PLK.unlockEwh(CONF.id);
      }
    }
  };

  PLK.unlockEwh = function (unitId) {
    var block = document.querySelector('.ewh-block[data-unit="' + unitId + '"]');
    if (!block) block = document.querySelector('.ewh-block');
    if (block) {
      block.classList.remove('ewh-locked');
      block.classList.add('ewh-unlocked');
    }
    localStorage.setItem('plk_' + unitId + '.ewhUnlocked', '1');
  };

  /* Schaltet den Block nach Gate nr frei (mit oder ohne Animation) */
  function _unlockBlock(gateNr, animate) {
    var next = document.getElementById('sw' + (gateNr + 1));
    if (next && next.classList.contains('locked')) {
      next.classList.remove('locked');
      if (animate) {
        next.classList.add('unlocking');
        setTimeout(function () { next.classList.remove('unlocking'); }, 600);
      }
    }
    /* Nächstes Gate freischalten */
    var nextGate = document.getElementById('qg' + (gateNr + 1));
    if (nextGate && nextGate.classList.contains('locked')) {
      nextGate.classList.remove('locked');
      if (animate) {
        nextGate.classList.add('unlocking');
        setTimeout(function () { nextGate.classList.remove('unlocking'); }, 600);
      }
      /* Also unlock the .qg-wrapper parent (added in visual redesign) */
      var wrapper = nextGate.closest('.qg-wrapper');
      if (wrapper) {
        wrapper.classList.remove('locked');
        if (animate) {
          wrapper.classList.add('unlocking');
          setTimeout(function () { wrapper.classList.remove('unlocking'); }, 600);
        }
      }
    }
  }

  /* --------------------------------------------------------
     Fortschrittsbalken
  -------------------------------------------------------- */
  function _hasEinstieg() {
    return !!document.getElementById('einstieg');
  }

  function _calcProgressPct(saved) {
    if (typeof CONF === 'undefined') return 0;

    var prog = saved || PLK.Progress.load(CONF.id) || {};

    var passed = Object.keys(qgPass).filter(function (k) { return qgPass[k]; }).length;
    var done   = passed;
    var total  = CONF.gates || 0;

    if (_hasEinstieg()) {
      total += 1;
      if (prog.einstieg) done += 1;
    }

    if (CONF.abPts > 0) {
      total += 1;
      done += Math.min((prog.abPts || 0) / CONF.abPts, 1);
    }

    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function _syncProgressMeta(pct) {
    if (typeof CONF === 'undefined') return;

    var existing = PLK.Progress.load(CONF.id);
    if (!existing) {
      if (!pct) return;
      existing = {};
    }

    existing.progressPct = pct;
    existing.complete = pct >= 100;
    PLK.Progress.save(CONF.id, existing);
  }

  function _updateProgressBar() {
    var pct = _calcProgressPct();
    _setProgressBar(pct);
    _syncProgressMeta(pct);
  }

  function _setProgressBar(pct) {
    var bar   = document.querySelector('.progress-bar-fill');
    var label = document.querySelector('.progress-label span:last-child');
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
  }

  /* --------------------------------------------------------
     Gates in localStorage speichern
  -------------------------------------------------------- */
  function _saveGates() {
    if (typeof CONF === 'undefined') return;
    var existing = PLK.Progress.load(CONF.id) || {};
    /* Normalize to "qgN" keys — qgPass uses integer keys but _persistUnlock
       uses "qgN" keys; mixing them causes double-counting on the landing page. */
    var normalized = {};
    Object.keys(qgPass).forEach(function (k) {
      var nr = parseInt(k, 10);
      if (!isNaN(nr) && qgPass[k]) normalized['qg' + nr] = true;
    });
    existing.gates = normalized;
    PLK.Progress.save(CONF.id, existing);
  }
  PLK._saveGates = _saveGates;

  /* Saves answer snapshot for a passed gate so they can be restored on reload */
  function _saveGateAnswers(gateNr, gate) {
    if (typeof CONF === 'undefined') return;
    var snapshot = {};

    /* Text input values */
    var qinpValues = [];
    gate.querySelectorAll('.qinp input[data-answers], .qinp textarea[data-answers]').forEach(function (inp) {
      if (PLK._closestQgItem && PLK._closestQgItem(inp)) return;
      qinpValues.push(inp.value);
    });
    if (qinpValues.length) snapshot.qinpValues = qinpValues;

    /* Which radio/checkbox was checked per group */
    var mcChecked = {};
    var mcGroups = {};
    gate.querySelectorAll('.mco input[type="radio"], .mco input[type="checkbox"]').forEach(function (inp) {
      if (PLK._closestQgItem && PLK._closestQgItem(inp)) return;
      if (!mcGroups[inp.name]) mcGroups[inp.name] = [];
      mcGroups[inp.name].push(inp);
    });
    Object.keys(mcGroups).forEach(function (name) {
      mcGroups[name].forEach(function (inp, idx) {
        if (inp.checked) {
          if (inp.type === 'checkbox') {
            if (!mcChecked[name]) mcChecked[name] = [];
            mcChecked[name].push(idx);
          } else {
            mcChecked[name] = idx;
          }
        }
      });
    });
    if (Object.keys(mcChecked).length) snapshot.mcChecked = mcChecked;

    var olistOrder = {};
    var olistCount = 0;
    gate.querySelectorAll('.olist[data-correct]').forEach(function (list) {
      if (PLK._closestQgItem && PLK._closestQgItem(list)) return;
      olistOrder[list.id || ('olist-' + olistCount)] = Array.from(list.querySelectorAll('.oitem')).map(function (item) {
        return item.getAttribute('data-id') || '';
      });
      olistCount++;
    });
    if (Object.keys(olistOrder).length) snapshot.olistOrder = olistOrder;

    if (PLK._getGateItems) {
      var qgItems = [];
      PLK._getGateItems(gate).forEach(function (item, idx) {
        var type = item.getAttribute('data-qg-type');
        var handler = type ? PLK._qgTypes[type] : null;
        if (!handler || !handler.save) return;
        qgItems.push({
          key: _getGateItemKey(item, idx),
          type: type,
          state: handler.save(item)
        });
      });
      if (qgItems.length) snapshot.qgItems = qgItems;
    }

    var existing = PLK.Progress.load(CONF.id) || {};
    if (!existing.gateAnswers) existing.gateAnswers = {};
    existing.gateAnswers[gateNr] = snapshot;
    PLK.Progress.save(CONF.id, existing);
  }
  PLK._saveGateAnswers = _saveGateAnswers;

  /* Restores answer visuals for a passed gate (gate was 100% correct) */
  function _restoreGateAnswers(gateNr, gate, snapshot) {
    if (!snapshot) return;

    /* Restore text inputs — green border since gate was passed (all correct) */
    if (snapshot.qinpValues) {
      var inputs = Array.from(gate.querySelectorAll('.qinp input[data-answers], .qinp textarea[data-answers]')).filter(function (inp) {
        return !(PLK._closestQgItem && PLK._closestQgItem(inp));
      });
      snapshot.qinpValues.forEach(function (val, i) {
        if (!inputs[i] || !val) return;
        inputs[i].value = val;
        inputs[i].style.borderColor = 'var(--ok)';
        var fb = inputs[i].closest('.qinp') ? inputs[i].closest('.qinp').querySelector('.qinp-feedback') : null;
        if (fb) { fb.className = 'qinp-feedback ok'; fb.textContent = '✓ Richtig'; }
      });
    }

    /* Restore MC selections — correct class since gate was passed */
    if (snapshot.mcChecked) {
      var mcGroups = {};
      gate.querySelectorAll('.mco input[type="radio"], .mco input[type="checkbox"]').forEach(function (inp) {
        if (PLK._closestQgItem && PLK._closestQgItem(inp)) return;
        if (!mcGroups[inp.name]) mcGroups[inp.name] = [];
        mcGroups[inp.name].push(inp);
      });
      Object.keys(snapshot.mcChecked).forEach(function (name) {
        if (Array.isArray(snapshot.mcChecked[name])) {
          snapshot.mcChecked[name].forEach(function (idx) {
            if (mcGroups[name] && mcGroups[name][idx]) {
              mcGroups[name][idx].checked = true;
              var item = mcGroups[name][idx].closest('.mco');
              if (item) item.classList.add('selected', 'correct');
            }
          });
        } else {
          var idx = snapshot.mcChecked[name];
          if (mcGroups[name] && mcGroups[name][idx]) {
            mcGroups[name][idx].checked = true;
            var item = mcGroups[name][idx].closest('.mco');
            if (item) item.classList.add('selected', 'correct');
          }
        }
      });
    }

    /* Restore overall feedback box ("✓ Alle Antworten richtig!") */
    if (snapshot.olistOrder) {
      var olistMap = {};
      var olistCount = 0;
      gate.querySelectorAll('.olist[data-correct]').forEach(function (list) {
        if (PLK._closestQgItem && PLK._closestQgItem(list)) return;
        olistMap[list.id || ('olist-' + olistCount)] = list;
        olistCount++;
      });
      Object.keys(snapshot.olistOrder).forEach(function (key) {
        var list = olistMap[key];
        if (!list) return;
        var itemsById = {};
        Array.from(list.querySelectorAll('.oitem')).forEach(function (item) {
          itemsById[item.getAttribute('data-id') || ''] = item;
        });
        snapshot.olistOrder[key].forEach(function (id) {
          if (itemsById[id]) list.appendChild(itemsById[id]);
        });
        PLK.oRenum(list);
        list.querySelectorAll('.oitem').forEach(function (item) {
          item.classList.remove('wrong');
          item.classList.add('correct');
        });
      });
    }

    if (snapshot.qgItems && PLK._getGateItems) {
      var itemMap = {};
      PLK._getGateItems(gate).forEach(function (item, idx) {
        itemMap[_getGateItemKey(item, idx)] = item;
      });
      snapshot.qgItems.forEach(function (entry) {
        var item = itemMap[entry.key];
        var handler = entry.type ? PLK._qgTypes[entry.type] : null;
        if (item && handler && handler.restore) handler.restore(item, entry.state);
      });
    }

    var fbEl = _getGateFeedbackEl(gateNr, gate);
    if (fbEl) {
      fbEl.style.display = 'block';
      fbEl.className = 'mc-feedback ok';
      fbEl.textContent = '✓ Alle Antworten richtig!';
    }
  }

  /* ==========================================================
     ARBEITSBLATT-ENGINE
     ========================================================== */

  /* Punkte-Speicher: { aufgabeId: pts } */
  var abScores = {};
  PLK._qs.abScores = abScores;

  /* --------------------------------------------------------
     LÜCKENTEXT — Chip-Bank + Slots
  -------------------------------------------------------- */

  var _selectedChip  = null;  /* { el, value, bankId } */
  var _selectedSlot  = null;  /* { el } */
  PLK._sc = { v: _selectedChip, s: _selectedSlot };  /* shared chip/slot selection state */

  /* selC, slCl, frC, chkSl, retSl, rsSl — moved to quiz-base.js */

  /* --------------------------------------------------------
     ZUORDNUNG — links-rechts Matching
  -------------------------------------------------------- */

  var _zSel = {};  /* { taskNr: { leftId, leftEl } } */
  var _zMap = {};  /* { taskNr: { leftId: rightId } } */
  PLK._qs.zSel = _zSel;
  PLK._qs.zMap = _zMap;

  /* zCl, uM, chkZ, retZ, rsZ — moved to quiz-base.js */
  /* _zVisConn stays in engine.js (private), exposed as PLK._zVisConn */
  /* Verbindungslinie visuell darstellen (einfache Badge-Variante) */
  function _zVisConn(taskNr, leftId, rightId) {
    var leftEl = document.querySelector('[data-task="' + taskNr + '"][data-z="l"][data-id="' + leftId + '"]');
    if (!leftEl) return;
    var badge = leftEl.querySelector('.z-badge');
    if (!badge) { badge = document.createElement('span'); badge.className = 'z-badge'; leftEl.appendChild(badge); }
    if (rightId) {
      var rightEl = document.querySelector('[data-task="' + taskNr + '"][data-z="r"][data-id="' + rightId + '"]');
      badge.textContent = rightEl ? '→ ' + rightEl.textContent.trim() : '';
    } else {
      badge.textContent = '';
    }
  }
  PLK._zVisConn = _zVisConn;

  /* --------------------------------------------------------
     KATEGORISIERUNG — Buttons pro Item
  -------------------------------------------------------- */

  var _kSel = {};  /* { itemId: value } */
  PLK._qs.kSel = _kSel;

  /* Auto-save timer — IIFE-scoped so slCl/kS/zCl can trigger debounced saves */
  var _abSaveTimer = null;
  function _scheduleAbSave() {
    var ab = document.getElementById('arbeitsblatt');
    if (!ab || ab.classList.contains('locked')) return;
    clearTimeout(_abSaveTimer);
    _abSaveTimer = setTimeout(_saveAbState, 800);
  }
  PLK._scheduleAbSave = _scheduleAbSave;

  /* kS, chkK, retK, rsK — moved to quiz-base.js */

  /* --------------------------------------------------------
     ARBEITSBLATT — Hilfsfunktionen
  -------------------------------------------------------- */

  /**
   * shR(id, correct, total)
   * Ergebnis-Box anzeigen: gut (≥80%), mittel (≥50%), schlecht (<50%).
   */
  PLK.shR = function (id, correct, total) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    var pct = total > 0 ? correct / total : 0;
    var cls = pct >= 0.8 ? 'ok' : pct >= 0.5 ? 'warn' : 'err';
    el.className = 'mc-feedback ' + cls;
    el.textContent = correct + ' / ' + total + ' richtig' +
      (pct >= 0.8 ? ' — Sehr gut!' : pct >= 0.5 ? ' — Fast da!' : ' — Nochmal versuchen.');
  };

  /**
   * upAB()
   * Arbeitsblatt-Gesamtpunktzahl aktualisieren.
   */
  PLK.upAB = function () {
    if (typeof CONF === 'undefined') return;
    var pts = PLK.rcAB();
    var el  = document.getElementById('ab-score');
    if (el) el.textContent = pts + ' / ' + CONF.abPts;

    /* Fortschritt speichern + Gesamtbalken aktualisieren */
    var existing = PLK.Progress.load(CONF.id) || {};
    existing.abPts = pts;
    PLK.Progress.save(CONF.id, existing);
    _updateProgressBar();
  };

  /**
   * rcAB()
   * Punkte aus abScores summieren.
   */
  PLK.rcAB = function () {
    return Object.keys(abScores).reduce(function (sum, k) {
      if (k.indexOf('_max') === -1) sum += (abScores[k] || 0);
      return sum;
    }, 0);
  };

  /* --------------------------------------------------------
     ARBEITSBLATT — Persistenz (save / restore)
  -------------------------------------------------------- */

  /**
   * _saveAbState()
   * Speichert Slots, Kategorisierungen, Zuordnungen und Texteingaben in localStorage.
   * Wird nach jedem Prüfen und bei Texteingabe (debounced) aufgerufen.
   */
  function _taskLooksChecked(task) {
    if (!task) return false;

    var kItems = task.querySelectorAll('.k-item[data-id]');
    if (kItems.length) {
      return Array.from(kItems).every(function (item) {
        return !!_kSel[item.getAttribute('data-id')];
      });
    }

    var slots = task.querySelectorAll('.slot[data-a]');
    if (slots.length) {
      return Array.from(slots).every(function (slot) {
        return !!slot.getAttribute('data-v');
      });
    }

    var lefts = task.querySelectorAll('[data-z="l"][data-id]');
    if (lefts.length) {
      var taskNr = lefts[0].getAttribute('data-task');
      return Array.from(lefts).every(function (left) {
        return _zMap[taskNr] && _zMap[taskNr][left.getAttribute('data-id')];
      });
    }

    var ptsFields = task.querySelectorAll('textarea[data-pts], input[type="text"][data-pts]');
    if (ptsFields.length) {
      return Array.from(ptsFields).some(function (el) {
        return !!(el.value && el.value.trim());
      });
    }

    return false;
  }

  function _saveAbState() {
    if (typeof CONF === 'undefined') return;
    var ab = document.getElementById('arbeitsblatt');
    if (!ab || ab.classList.contains('locked')) return;

    var state = {};

    /* Text inputs and textareas with ID */
    state.texts = {};
    ab.querySelectorAll('input[type="text"][id], textarea[id]').forEach(function (el) {
      state.texts[el.id] = el.value;
    });
    /* Textareas without ID — save by index */
    ab.querySelectorAll('textarea:not([id])').forEach(function (el, i) {
      if (el.value) state.texts['__ta_' + i] = el.value;
    });

    /* Slot state: values in DOM order per .auf[id] container */
    state.slots = {};
    ab.querySelectorAll('.auf[id]').forEach(function (container) {
      var vals = [];
      var hasContent = false;
      container.querySelectorAll('.slot').forEach(function (slot) {
        var v = slot.getAttribute('data-v') || null;
        vals.push(v);
        if (v) hasContent = true;
      });
      if (hasContent) state.slots[container.id] = vals;
    });

    /* Kategorisierung */
    state.kSel = {};
    Object.keys(_kSel).forEach(function (k) { state.kSel[k] = _kSel[k]; });

    /* Zuordnung */
    state.zMap = {};
    Object.keys(_zMap).forEach(function (k) {
      state.zMap[k] = {};
      Object.keys(_zMap[k]).forEach(function (l) { state.zMap[k][l] = _zMap[k][l]; });
    });

    state.scores = {};
    Object.keys(abScores).forEach(function (k) {
      state.scores[k] = abScores[k];
    });

    state.checked = [];
    ab.querySelectorAll('.mc-feedback').forEach(function (fb) {
      var task = fb.closest('.auf[id]');
      if (!task) return;
      if (!fb.classList.contains('ok') && !fb.classList.contains('warn') && !fb.classList.contains('err')) return;
      if (!fb.textContent || !fb.textContent.trim()) return;
      if (state.checked.indexOf(task.id) === -1) state.checked.push(task.id);
    });

    var existing = PLK.Progress.load(CONF.id) || {};
    existing.ab = state;
    /* quiz-ext types — must run before Progress.save so ext sub-keys are included */
    if (PLK._saveExtState) PLK._saveExtState(ab, state);
    if (PLK._saveLibState) PLK._saveLibState(ab, state);
    if (PLK._saveLib2State) PLK._saveLib2State(ab, state);
    PLK.Progress.save(CONF.id, existing);
  }
  PLK._saveAbState = _saveAbState; /* expose for use in quiz-base + quiz-ext */

  /**
   * _restoreAbState(saved)
   * Stellt Arbeitsblatt-Eingaben aus localStorage wieder her.
   * Wird in _restoreState() nach dem AB-Unlock aufgerufen.
   */
  function _restoreAbState(saved) {
    if (!saved || !saved.ab) return;
    var ab = document.getElementById('arbeitsblatt');
    if (!ab || ab.classList.contains('locked')) return;
    var state = saved.ab;

    /* Restore text inputs and textareas */
    if (state.texts) {
      ab.querySelectorAll('input[type="text"][id], textarea[id]').forEach(function (el) {
        if (state.texts[el.id] !== undefined) el.value = state.texts[el.id];
      });
      ab.querySelectorAll('textarea:not([id])').forEach(function (el, i) {
        var key = '__ta_' + i;
        if (state.texts[key]) el.value = state.texts[key];
      });
    }

    /* Restore chip-slot state */
    if (state.slots) {
      Object.keys(state.slots).forEach(function (aufId) {
        var container = document.getElementById(aufId);
        if (!container) return;
        var slots = container.querySelectorAll('.slot');
        state.slots[aufId].forEach(function (val, i) {
          if (!val || !slots[i]) return;
          slots[i].textContent = val;
          slots[i].setAttribute('data-v', val);
          slots[i].classList.add('filled');
          /* Mark chip as used in bank */
          var bankId = slots[i].getAttribute('data-bank');
          if (bankId) {
            var bank = document.getElementById(bankId);
            if (bank) {
              var chip = bank.querySelector('.chip[data-v="' + val + '"]:not([data-used="1"])');
              if (chip) { chip.classList.add('used'); chip.setAttribute('data-used', '1'); }
            }
          }
        });
      });
    }

    /* Restore kategorisierung selections */
    if (state.kSel) {
      Object.keys(state.kSel).forEach(function (itemId) {
        _kSel[itemId] = state.kSel[itemId];
        var item = ab.querySelector('.k-item[data-id="' + itemId + '"]');
        if (!item) return;
        var val = state.kSel[itemId];
        item.querySelectorAll('.k-btn').forEach(function (btn) {
          btn.classList.remove('selected');
          var m = (btn.getAttribute('onclick') || '').match(/kS\s*\(this\s*,\s*'([^']+)'\)/);
          if (m && m[1] === val) btn.classList.add('selected');
        });
      });
    }

    /* Restore zuordnung mappings */
    if (state.zMap) {
      Object.keys(state.zMap).forEach(function (taskNr) {
        if (!_zMap[taskNr]) _zMap[taskNr] = {};
        Object.keys(state.zMap[taskNr]).forEach(function (leftId) {
          var rightId = state.zMap[taskNr][leftId];
          _zMap[taskNr][leftId] = rightId;
          var leftEl = ab.querySelector('[data-task="' + taskNr + '"][data-z="l"][data-id="' + leftId + '"]');
          var rightEl = ab.querySelector('[data-task="' + taskNr + '"][data-z="r"][data-id="' + rightId + '"]');
          if (leftEl) { leftEl.classList.add('matched'); _zVisConn(taskNr, leftId, rightId); }
          if (rightEl) rightEl.classList.add('matched');
        });
      });
    }

    if (state.scores) {
      Object.keys(state.scores).forEach(function (k) {
        abScores[k] = state.scores[k];
      });
    }

    /* quiz-ext types */
    if (PLK._restoreExtState) PLK._restoreExtState(ab, saved);
    if (PLK._restoreLibState) PLK._restoreLibState(ab, saved);
    if (PLK._restoreLib2State) PLK._restoreLib2State(ab, saved);

    var replayTasks = (state.checked && state.checked.length) ? state.checked.slice() : [];
    if (!replayTasks.length) {
      ab.querySelectorAll('.auf[id]').forEach(function (task) {
        if (_taskLooksChecked(task) && replayTasks.indexOf(task.id) === -1) replayTasks.push(task.id);
      });
    }

    if (replayTasks.length) {
      replayTasks.forEach(function (taskId) {
        var task = document.getElementById(taskId);
        if (!task || !ab.contains(task)) return;
        var btn = task.querySelector('button[onclick*="PLK.chk"]');
        if (btn && btn.click) btn.click();
      });
    } else if (Object.keys(abScores).length) {
      PLK.upAB();
    } else {
      _updateProgressBar();
    }
  }

  /* rstAllAB — moved to quiz-base.js (PLK.rstAllAB) */

  /* ==========================================================
     INIT — beim Laden der Seite
     ========================================================== */
  /* ==========================================================
     EINSTIEG-ENGINE
     Chip-based check for the Einstieg entry block.
     ========================================================== */

  var _einstiegSel = {};  /* { sitNr: value } — selected chip per situation */

  /**
   * selEinstieg(btn, sitNr)
   * Select a freedom chip for a situation card.
   * Only one chip active per card at a time.
   * Enables the submit button once all 4 situations are answered.
   */
  PLK.selEinstieg = function (btn, sitNr) {
    var card = btn.closest('.einstieg-card');
    if (!card) return;

    /* Deselect other chips in this card */
    card.querySelectorAll('.e-chip').forEach(function (b) {
      b.classList.remove('selected', 'correct', 'wrong');
    });
    btn.classList.add('selected');
    _einstiegSel[sitNr] = btn.getAttribute('data-v');

    /* Enable submit once all cards answered */
    var allCards = document.querySelectorAll('.einstieg-card');
    var allAnswered = allCards.length > 0;
    for (var _i = 0; _i < allCards.length; _i++) {
      if (!_einstiegSel[allCards[_i].getAttribute('data-sit')]) {
        allAnswered = false;
        break;
      }
    }
    var submitBtn = document.getElementById('einstieg-btn');
    if (submitBtn) submitBtn.disabled = !allAnswered;
  };

  /**
   * chkEinstieg()
   * Validate all chip selections against data-answer on each card.
   * On all-correct: set data-state="passed", persist, update pill.
   * On wrong: show per-chip correct/wrong colours, leave open.
   */
  PLK.chkEinstieg = function () {
    var einstieg = document.getElementById('einstieg');
    if (!einstieg) return;

    var cards      = einstieg.querySelectorAll('.einstieg-card');
    var allCorrect = true;

    cards.forEach(function (card) {
      var sitNr    = card.getAttribute('data-sit');
      var expected = card.getAttribute('data-answer');
      var given    = _einstiegSel[sitNr];

      /* Reset chip states */
      card.querySelectorAll('.e-chip').forEach(function (b) {
        b.classList.remove('correct', 'wrong');
      });

      if (given) {
        var selChip = card.querySelector('.e-chip[data-v="' + given + '"]');
        if (given === expected) {
          if (selChip) selChip.classList.add('correct');
        } else {
          if (selChip) selChip.classList.add('wrong');
          allCorrect = false;
        }
      } else {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      einstieg.setAttribute('data-state', 'passed');
      var pill = document.getElementById('einstieg-status');
      if (pill) pill.textContent = 'Bestanden';
      /* Persist Einstieg pass + chip selections */
      if (typeof CONF !== 'undefined') {
        var existing = PLK.Progress.load(CONF.id) || {};
        existing.einstieg = true;
        existing.einstiegSel = _einstiegSel;
        PLK.Progress.save(CONF.id, existing);
      }
      _updateProgressBar();
    }
  };

  /**
   * toggleEinstieg()
   * Called by clicking the Einstieg header.
   * passed      → passed-open  (expand, keep correct answers visible)
   * passed-open → passed       (collapse)
   * re-opened   → passed       (collapse)
   * open        → no-op        (cannot collapse before passing)
   * Only retryEinstieg() resets answers.
   */
  PLK.toggleEinstieg = function () {
    var einstieg = document.getElementById('einstieg');
    if (!einstieg) return;
    var state = einstieg.getAttribute('data-state') || 'open';
    if (state === 'passed') {
      einstieg.setAttribute('data-state', 'passed-open');
    } else if (state === 'passed-open' || state === 're-opened') {
      einstieg.setAttribute('data-state', 'passed');
    }
  };

  /**
   * retryEinstieg()
   * Called by the "↺ Nochmal ansehen" link — resets and shuffles chips.
   */
  PLK.retryEinstieg = function () {
    var einstieg = document.getElementById('einstieg');
    if (!einstieg) return;
    var state = einstieg.getAttribute('data-state') || 'open';
    if (state === 'passed' || state === 'passed-open') {
      _resetEinstiegAnswers(einstieg);
      einstieg.setAttribute('data-state', 're-opened');
    }
  };

  function _resetEinstiegAnswers(einstieg) {
    _einstiegSel = {};
    einstieg.querySelectorAll('.e-chip').forEach(function (b) {
      b.classList.remove('selected', 'correct', 'wrong');
    });
    var btn = document.getElementById('einstieg-btn');
    if (btn) btn.disabled = true;
    /* Shuffle chip order within each card so students can't memorise position.
       Skip containers marked data-no-shuffle (e.g. hierarchy exercises). */
    einstieg.querySelectorAll('.einstieg-chips').forEach(function (chips) {
      if (!chips.hasAttribute('data-no-shuffle')) _shuffleChildren(chips);
    });
  }

  /* ── Stale inline-style guard (bfcache + old engine versions) ───────
     Old engine.js set style.display='none' directly on #pw-wrap.
     Clear any leftover inline style so CSS class pw-done is the only
     hide mechanism. Also runs on bfcache-restore via pageshow.        */
  function _clearPwInlineStyle() {
    var pwWrap = document.getElementById('pw-wrap');
    if (pwWrap) pwWrap.style.display = '';
    document.querySelectorAll('.pw-input').forEach(function (el) {
      el.style.display = '';
    });
  }

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      /* bfcache restore — scripts didn't re-run, DOM has stale state */
      _clearPwInlineStyle();
      _restoreState();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    /* Clear any stale inline display from pw-wrap before restoring state */
    _clearPwInlineStyle();

    PLK.init(); /* run all registered module init() hooks first */

    /* Zustand aus localStorage wiederherstellen */
    _restoreState();

    /* EWH-Block sofort anzeigen falls bereits freigeschaltet */
    if (typeof CONF !== 'undefined' && localStorage.getItem('plk_' + CONF.id + '.ewhUnlocked') === '1') {
      var ewhEl = document.querySelector('.ewh-block');
      if (ewhEl) { ewhEl.classList.remove('ewh-locked'); ewhEl.classList.add('ewh-unlocked'); }
    }

    /* Initiales Fortschritts-Update */
    _updateProgressBar();

    /* Enter-Taste in Passwort-Feldern */
    document.querySelectorAll('.pw-input input[type="password"]').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var btn = inp.closest('.pw-input').querySelector('button');
          if (btn) btn.click();
        }
      });
    });

    /* Reihenfolge: initiale Nummerierung setzen */
    document.querySelectorAll('.olist').forEach(function (list) {
      PLK.oRenum(list);
    });

    /* Auto-save Arbeitsblatt text inputs / textareas on change */
    document.addEventListener('input', function (e) {
      var ab = document.getElementById('arbeitsblatt');
      if (ab && !ab.classList.contains('locked') && ab.contains(e.target)) {
        _scheduleAbSave();
      }
    });
  });

  /* saveAB — moved to quiz-base.js (PLK.saveAB) */

})();
