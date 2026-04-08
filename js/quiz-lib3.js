/* ==========================================================
   Politik-LK — quiz-lib3.js
   Game-style exercises: Crossword · Word-Reveal
   Requires: engine.js (PLK registry + PLK.upAB + PLK._saveAbState)
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  function _each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  /* ─── Crossword ─────────────────────────────────────────── */

  /**
   * Grid data format (JSON in data-slot="crossword-grid-data"):
   * {
   *   rows: 10, cols: 10,
   *   cells: [ { r: 0, c: 3, letter: "E", num: 1 }, ... ],
   *   clues: {
   *     across: [ { num: 1, clue: "Hint text", answer: "EUROPA", r: 0, c: 3, len: 6 } ],
   *     down:   [ { num: 2, clue: "Hint text", answer: "PARLAMENT", r: 0, c: 5, len: 9 } ]
   *   }
   * }
   */

  function _buildGrid(wrapper) {
    var dataEl = wrapper.querySelector('.crossword-grid');
    if (!dataEl || dataEl.querySelector('table')) return null;

    var raw = dataEl.textContent.trim();
    if (!raw) return null;

    var data;
    try { data = JSON.parse(raw); }
    catch (e) { console.warn('[quiz-lib3] Invalid crossword grid JSON:', e); return null; }

    dataEl.textContent = '';
    dataEl.setAttribute('data-grid', raw);

    var table = document.createElement('table');
    table.className = 'cw-table';

    var cellMap = {};
    (data.cells || []).forEach(function (cell) {
      cellMap[cell.r + ',' + cell.c] = cell;
    });

    for (var r = 0; r < data.rows; r++) {
      var tr = document.createElement('tr');
      for (var c = 0; c < data.cols; c++) {
        var td = document.createElement('td');
        var cell = cellMap[r + ',' + c];
        if (cell) {
          td.className = 'cw-cell';
          if (cell.num) {
            var numSpan = document.createElement('span');
            numSpan.className = 'cw-num';
            numSpan.textContent = cell.num;
            td.appendChild(numSpan);
          }
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.maxLength = 1;
          inp.className = 'cw-input';
          inp.setAttribute('data-r', r);
          inp.setAttribute('data-c', c);
          inp.setAttribute('data-letter', cell.letter.toUpperCase());
          inp.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
            _advanceFocus(this, wrapper);
          });
          inp.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !this.value) {
              _retreatFocus(this, wrapper);
            }
          });
          td.appendChild(inp);
        } else {
          td.className = 'cw-black';
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    dataEl.appendChild(table);
    return data;
  }

  function _advanceFocus(inp, wrapper) {
    var inputs = wrapper.querySelectorAll('.cw-input');
    for (var i = 0; i < inputs.length - 1; i++) {
      if (inputs[i] === inp) { inputs[i + 1].focus(); return; }
    }
  }

  function _retreatFocus(inp, wrapper) {
    var inputs = wrapper.querySelectorAll('.cw-input');
    for (var i = 1; i < inputs.length; i++) {
      if (inputs[i] === inp) { inputs[i - 1].focus(); return; }
    }
  }

  function _evalCrossword(wrapper) {
    var inputs = wrapper.querySelectorAll('.cw-input');
    var correct = 0;
    var total = inputs.length;
    _each(inputs, function (inp) {
      var expected = (inp.getAttribute('data-letter') || '').toUpperCase();
      var given = (inp.value || '').toUpperCase();
      inp.classList.remove('ok', 'err');
      if (given === expected) {
        inp.classList.add('ok');
        inp.disabled = true;
        correct++;
      } else if (given) {
        inp.classList.add('err');
      }
    });
    return { correct: correct, total: total };
  }

  function _saveCrossword(wrapper) {
    var values = {};
    _each(wrapper.querySelectorAll('.cw-input'), function (inp) {
      var key = inp.getAttribute('data-r') + ',' + inp.getAttribute('data-c');
      if (inp.value) values[key] = inp.value;
    });
    return values;
  }

  function _restoreCrossword(wrapper, saved) {
    if (!saved) return;
    _each(wrapper.querySelectorAll('.cw-input'), function (inp) {
      var key = inp.getAttribute('data-r') + ',' + inp.getAttribute('data-c');
      if (saved[key]) {
        inp.value = saved[key];
        var expected = (inp.getAttribute('data-letter') || '').toUpperCase();
        if (inp.value.toUpperCase() === expected) {
          inp.classList.add('ok');
          inp.disabled = true;
        }
      }
    });
  }

  function _resetCrossword(wrapper) {
    _each(wrapper.querySelectorAll('.cw-input'), function (inp) {
      inp.value = '';
      inp.disabled = false;
      inp.classList.remove('ok', 'err');
    });
  }

  /* ─── Word-Reveal ───────────────────────────────────────── */

  /**
   * Word data format (JSON in data-slot="quiz-word-data"):
   * [ { word: "SUBSIDIARITÄT", hint: "Prinzip der EU-Kompetenzverteilung" }, ... ]
   */

  function _buildWordReveal(wrapper) {
    var dataEl = wrapper.querySelector('[data-slot="quiz-word-data"]');
    if (!dataEl) dataEl = wrapper;
    if (wrapper.querySelector('.wr-word')) return null;

    var raw = dataEl.textContent.trim();
    if (!raw) return null;

    var words;
    try { words = JSON.parse(raw); }
    catch (e) { console.warn('[quiz-lib3] Invalid word-reveal JSON:', e); return null; }

    dataEl.textContent = '';
    dataEl.setAttribute('data-words', raw);

    var container = document.createElement('div');
    container.className = 'wr-container';

    words.forEach(function (entry, idx) {
      var wordDiv = document.createElement('div');
      wordDiv.className = 'wr-word';
      wordDiv.setAttribute('data-idx', idx);

      if (entry.hint) {
        var hint = document.createElement('div');
        hint.className = 'wr-hint';
        hint.textContent = entry.hint;
        wordDiv.appendChild(hint);
      }

      var letters = document.createElement('div');
      letters.className = 'wr-letters';

      var word = (entry.word || '').toUpperCase();
      for (var i = 0; i < word.length; i++) {
        var span = document.createElement('span');
        span.className = 'wr-letter';
        span.setAttribute('data-letter', word[i]);
        span.textContent = '_';
        span.addEventListener('click', function () {
          if (this.classList.contains('revealed')) return;
          this.textContent = this.getAttribute('data-letter');
          this.classList.add('revealed');
          _checkWordComplete(this.closest('.wr-word'));
          if (PLK._saveAbState) PLK._saveAbState();
        });
        letters.appendChild(span);
      }

      wordDiv.appendChild(letters);
      container.appendChild(wordDiv);
    });

    var revealAllBtn = document.createElement('button');
    revealAllBtn.className = 'btn-secondary btn-sm wr-reveal-all';
    revealAllBtn.textContent = 'Alle aufdecken';
    revealAllBtn.addEventListener('click', function () {
      _each(wrapper.querySelectorAll('.wr-letter:not(.revealed)'), function (span) {
        span.textContent = span.getAttribute('data-letter');
        span.classList.add('revealed');
      });
      _each(wrapper.querySelectorAll('.wr-word'), function (w) {
        w.classList.add('complete');
      });
      if (PLK._saveAbState) PLK._saveAbState();
    });
    container.appendChild(revealAllBtn);

    (dataEl === wrapper ? wrapper : dataEl).appendChild(container);
    return words;
  }

  function _checkWordComplete(wordDiv) {
    if (!wordDiv) return;
    var unrevealed = wordDiv.querySelectorAll('.wr-letter:not(.revealed)');
    if (unrevealed.length === 0) wordDiv.classList.add('complete');
  }

  function _saveWordReveal(wrapper) {
    var revealed = {};
    _each(wrapper.querySelectorAll('.wr-word'), function (wordDiv) {
      var idx = wordDiv.getAttribute('data-idx');
      revealed[idx] = [];
      _each(wordDiv.querySelectorAll('.wr-letter'), function (span, i) {
        if (span.classList.contains('revealed')) revealed[idx].push(i);
      });
    });
    return revealed;
  }

  function _restoreWordReveal(wrapper, saved) {
    if (!saved) return;
    _each(wrapper.querySelectorAll('.wr-word'), function (wordDiv) {
      var idx = wordDiv.getAttribute('data-idx');
      if (!saved[idx]) return;
      var letters = wordDiv.querySelectorAll('.wr-letter');
      saved[idx].forEach(function (i) {
        if (letters[i]) {
          letters[i].textContent = letters[i].getAttribute('data-letter');
          letters[i].classList.add('revealed');
        }
      });
      _checkWordComplete(wordDiv);
    });
  }

  function _resetWordReveal(wrapper) {
    _each(wrapper.querySelectorAll('.wr-letter'), function (span) {
      span.textContent = '_';
      span.classList.remove('revealed');
    });
    _each(wrapper.querySelectorAll('.wr-word'), function (w) {
      w.classList.remove('complete');
    });
  }

  /* ─── Save/Restore hooks for engine.js ──────────────────── */

  function _saveLib3(ab, state) {
    if (!state.ab) state.ab = {};
    state.ab.crossword = {};
    _each(ab.querySelectorAll('.crossword[id]'), function (cw) {
      state.ab.crossword[cw.id] = _saveCrossword(cw);
    });
    state.ab.wordReveal = {};
    _each(ab.querySelectorAll('.word-reveal'), function (wr, i) {
      var key = wr.id || ('wr' + i);
      state.ab.wordReveal[key] = _saveWordReveal(wr);
    });
  }

  function _restoreLib3(ab, saved) {
    if (!saved || !saved.ab) return;
    if (saved.ab.crossword) {
      Object.keys(saved.ab.crossword).forEach(function (id) {
        var cw = document.getElementById(id);
        if (cw) _restoreCrossword(cw, saved.ab.crossword[id]);
      });
    }
    if (saved.ab.wordReveal) {
      Object.keys(saved.ab.wordReveal).forEach(function (key) {
        var wr = document.getElementById(key);
        if (wr) _restoreWordReveal(wr, saved.ab.wordReveal[key]);
      });
    }
  }

  /* ─── Register ──────────────────────────────────────────── */

  PLK.register({
    name: 'quiz-lib3',
    init: function () {

      /* Expose save/restore hooks */
      PLK._saveLib3State    = _saveLib3;
      PLK._restoreLib3State = _restoreLib3;

      /* Build all crossword grids on page */
      _each(document.querySelectorAll('.crossword'), function (cw) {
        _buildGrid(cw);
      });

      /* Build all word-reveal widgets on page */
      _each(document.querySelectorAll('.word-reveal'), function (wr) {
        _buildWordReveal(wr);
      });

      /* ── PLK.checkCrossword(el) ── */
      PLK.checkCrossword = function (el) {
        var cw = el.closest('.crossword');
        if (!cw) return;
        var result = _evalCrossword(cw);
        var scoreEl = cw.querySelector('.crossword-points');
        if (scoreEl) scoreEl.textContent = 'Punkte: ' + result.correct + '/' + result.total;
        if (result.correct === result.total) {
          cw.classList.add('cw-complete');
        }
        if (PLK._saveAbState) PLK._saveAbState();
      };

      /* ── PLK.resetCrossword(el) ── */
      PLK.resetCrossword = function (el) {
        var cw = el.closest('.crossword');
        if (!cw) return;
        _resetCrossword(cw);
        cw.classList.remove('cw-complete');
        var scoreEl = cw.querySelector('.crossword-points');
        if (scoreEl) scoreEl.textContent = 'Punkte: 0';
        if (PLK._saveAbState) PLK._saveAbState();
      };

      /* ── PLK.revealAllWords(el) ── */
      PLK.revealAllWords = function (el) {
        var wr = el.closest('.word-reveal');
        if (!wr) return;
        _each(wr.querySelectorAll('.wr-letter:not(.revealed)'), function (span) {
          span.textContent = span.getAttribute('data-letter');
          span.classList.add('revealed');
        });
        _each(wr.querySelectorAll('.wr-word'), function (w) {
          w.classList.add('complete');
        });
        if (PLK._saveAbState) PLK._saveAbState();
      };

      /* ── PLK.resetWordReveal(el) ── */
      PLK.resetWordReveal = function (el) {
        var wr = el.closest('.word-reveal');
        if (!wr) return;
        _resetWordReveal(wr);
        if (PLK._saveAbState) PLK._saveAbState();
      };

    } /* /init */
  });

})();
