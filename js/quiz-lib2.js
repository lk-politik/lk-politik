/* ==========================================================
   Politik-LK — quiz-lib2.js
   Exercise library Phase 2a:
   Wahr/Falsch · Odd-One-Out · Flashcard Recall · Memory Cards
   Requires: engine.js (PLK registry) loaded first.
   ES5 only — no arrow functions, no const/let.
   ========================================================== */

;(function () {
  'use strict';

  /* ES5 helper — NodeList.forEach is ES6; use this instead */
  function _each(nodeList, fn) {
    Array.prototype.forEach.call(nodeList, fn);
  }

  /* Fisher-Yates shuffle — returns new array, never mutates */
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function _range(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    return a;
  }

  /* Module-level state stores — keyed by aufgabe data-id.
     IMPORTANT: always mutate existing objects, never replace them.
     The restore path uses Object.keys to copy props into existing
     objects so closure references remain valid.                   */
  var _tfState  = {};
  var _oooState = {};
  var _fcrState = {};
  var _mcState  = {};

  /* Render-function registry — keyed by "tf-{id}" etc.
     Populated by each init; used by restore to re-render.        */
  var _lib2Renders = {};

  /* ── Save / restore hooks ──────────────────────────────── */

  function _copyInto(target, source) {
    /* Copy all own properties of source INTO target (shallow).
       Used by restore to update existing state objects in-place
       so closure references stay valid.                          */
    Object.keys(source).forEach(function (k) { target[k] = source[k]; });
  }

  function _saveLib2(ab, state) {
    if (!state.ab) state.ab = {};

    state.ab.tf2 = {};
    _each(ab.querySelectorAll('.tf-wrap[data-aufid]'), function (wrap) {
      var id = wrap.getAttribute('data-aufid');
      if (_tfState[id]) {
        /* Serialise: copy plain data only (no DOM refs) */
        state.ab.tf2[id] = {
          order:    _tfState[id].order.slice(),
          cur:      _tfState[id].cur,
          results:  _tfState[id].results.slice(),
          answered: _tfState[id].answered
        };
      }
    });

    state.ab.ooo = {};
    _each(ab.querySelectorAll('.ooo-wrap[data-aufid]'), function (wrap) {
      var id = wrap.getAttribute('data-aufid');
      if (_oooState[id]) {
        var st = _oooState[id];
        /* roundOrders: per-round shuffled opt indices; lockedIdxs: locked item indices per round */
        state.ab.ooo[id] = {
          order:       st.order.slice(),
          cur:         st.cur,
          results:     st.results.slice(),
          answered:    st.answered,
          hadWrong:    st.hadWrong,
          roundOrders: JSON.parse(JSON.stringify(st.roundOrders)),
          lockedIdxs:  st.lockedIdxs ? st.lockedIdxs.slice() : []
        };
      }
    });

    state.ab.fcr = {};
    _each(ab.querySelectorAll('.fcr-wrap[data-aufid]'), function (wrap) {
      var id = wrap.getAttribute('data-aufid');
      if (_fcrState[id]) {
        var st2 = _fcrState[id];
        var csSnap = [];
        for (var ci = 0; ci < st2.cardStates.length; ci++) {
          var cs = st2.cardStates[ci];
          csSnap.push({ done: cs.done, missed: cs.missed, chosen: cs.chosen,
                        order: cs.order ? cs.order.slice() : null });
        }
        state.ab.fcr[id] = { active: st2.active, cardStates: csSnap };
      }
    });

    state.ab.mc2 = {};
    _each(ab.querySelectorAll('.mc-wrap[data-aufid]'), function (wrap) {
      var id = wrap.getAttribute('data-aufid');
      if (_mcState[id]) {
        var st3 = _mcState[id];
        state.ab.mc2[id] = {
          matched:   st3.matched.slice(),
          moves:     st3.moves,
          cardOrder: st3.cardOrder ? JSON.parse(JSON.stringify(st3.cardOrder)) : null,
          flipped:   st3.flipped  ? st3.flipped.slice()  : []
        };
      }
    });
  }

  function _restoreLib2(ab, saved) {
    if (!saved || !saved.ab) return;

    if (saved.ab.tf2) {
      Object.keys(saved.ab.tf2).forEach(function (id) {
        if (!_tfState[id]) return;
        _copyInto(_tfState[id], saved.ab.tf2[id]);
        if (_lib2Renders['tf-' + id]) _lib2Renders['tf-' + id]();
      });
    }

    if (saved.ab.ooo) {
      Object.keys(saved.ab.ooo).forEach(function (id) {
        if (!_oooState[id]) return;
        _copyInto(_oooState[id], saved.ab.ooo[id]);
        if (_lib2Renders['ooo-' + id]) _lib2Renders['ooo-' + id]();
      });
    }

    if (saved.ab.fcr) {
      Object.keys(saved.ab.fcr).forEach(function (id) {
        if (!_fcrState[id]) return;
        _copyInto(_fcrState[id], saved.ab.fcr[id]);
        if (_lib2Renders['fcr-' + id]) _lib2Renders['fcr-' + id]();
      });
    }

    if (saved.ab.mc2) {
      Object.keys(saved.ab.mc2).forEach(function (id) {
        if (!_mcState[id]) return;
        _copyInto(_mcState[id], saved.ab.mc2[id]);
        if (_lib2Renders['mc-' + id]) _lib2Renders['mc-' + id]();
      });
    }
  }

  function _copyQgAttrs(src, dest) {
    if (!src || !dest || !src.attributes) return;
    _each(src.attributes, function (attr) {
      if (attr && attr.name && attr.name.indexOf('data-qg-') === 0) {
        dest.setAttribute(attr.name, attr.value);
      }
    });
  }

  function _resolveGateWrap(item, selector) {
    if (!item) return null;
    if (item.classList && item.classList.contains(selector.replace('.', ''))) return item;
    return item.querySelector(selector);
  }

  function _saveTfState(id) {
    var st = _tfState[id];
    if (!st) return null;
    return {
      order:    st.order.slice(),
      cur:      st.cur,
      results:  st.results.slice(),
      answered: st.answered
    };
  }

  function _restoreTfState(id, state) {
    if (!id || !state || !_tfState[id]) return;
    _copyInto(_tfState[id], state);
    if (_lib2Renders['tf-' + id]) _lib2Renders['tf-' + id]();
  }

  function _resetTfState(id) {
    if (!id || !_tfState[id]) return;
    var total = _tfState[id].order.length;
    _copyInto(_tfState[id], {
      order: _shuffle(_range(total)),
      cur: 0,
      results: [],
      answered: false
    });
    if (_lib2Renders['tf-' + id]) _lib2Renders['tf-' + id]();
  }

  function _saveOooState(id) {
    var st = _oooState[id];
    if (!st) return null;
    return {
      order:       st.order.slice(),
      cur:         st.cur,
      results:     st.results.slice(),
      answered:    st.answered,
      hadWrong:    st.hadWrong,
      roundOrders: JSON.parse(JSON.stringify(st.roundOrders)),
      lockedIdxs:  st.lockedIdxs ? st.lockedIdxs.slice() : []
    };
  }

  function _restoreOooState(id, state) {
    if (!id || !state || !_oooState[id]) return;
    _copyInto(_oooState[id], state);
    if (_lib2Renders['ooo-' + id]) _lib2Renders['ooo-' + id]();
  }

  function _resetOooState(id) {
    if (!id || !_oooState[id]) return;
    var total = _oooState[id].order.length;
    var prevOrders = _oooState[id].roundOrders || [];
    var roundOrders = [];
    for (var ri = 0; ri < prevOrders.length; ri++) {
      roundOrders[ri] = _shuffle(_range(prevOrders[ri] ? prevOrders[ri].length : 0));
    }
    _copyInto(_oooState[id], {
      order: _shuffle(_range(total)),
      cur: 0,
      results: [],
      answered: false,
      hadWrong: false,
      roundOrders: roundOrders,
      lockedIdxs: []
    });
    if (_lib2Renders['ooo-' + id]) _lib2Renders['ooo-' + id]();
  }

  /* ════════════════════════════════════════════════════════
     1. WAHR / FALSCH
     ════════════════════════════════════════════════════════ */

  function _tfInit(aufgabe) {
    var id    = aufgabe.getAttribute('data-id');
    var total = aufgabe.querySelectorAll('.tf-item').length;

    /* Parse items */
    var data = [];
    _each(aufgabe.querySelectorAll('.tf-item'), function (el) {
      data.push({
        text:    el.textContent.trim(),
        correct: el.getAttribute('data-correct') === 'true',
        explain: el.getAttribute('data-explain') || null
      });
    });

    /* Initialise state — referenced via _tfState[id].xxx everywhere */
    _tfState[id] = { order: _shuffle(_range(total)), cur: 0, results: [], answered: false };

    /* Build DOM */
    var wrap = document.createElement('div');
    wrap.className = 'tf-wrap';
    wrap.setAttribute('data-aufid', id);

    var banner = document.createElement('div');
    banner.className = 'tf-banner';
    banner.innerHTML = '<div class="tf-banner-icon">✓</div>'
      + '<div><strong></strong><span></span></div>';
    wrap.appendChild(banner);

    var prog = document.createElement('div');
    prog.className = 'tf-progress';
    prog.innerHTML = '<span class="tf-prog-label"></span><div class="tf-dots"></div>';
    wrap.appendChild(prog);

    var card = document.createElement('div');
    card.className = 'tf-card';
    var stmt = document.createElement('p');
    stmt.className = 'tf-statement';
    card.appendChild(stmt);
    wrap.appendChild(card);

    var fb = document.createElement('p');
    fb.className = 'tf-feedback';
    wrap.appendChild(fb);

    var btns = document.createElement('div');
    btns.className = 'tf-btns';
    var btnW = document.createElement('button');
    btnW.className = 'tf-btn tf-btn-wahr';
    btnW.textContent = '✓ Wahr';
    var btnF = document.createElement('button');
    btnF.className = 'tf-btn tf-btn-falsch';
    btnF.textContent = '✗ Falsch';
    btns.appendChild(btnW);
    btns.appendChild(btnF);
    wrap.appendChild(btns);

    var explain = document.createElement('div');
    explain.className = 'tf-explain';
    explain.innerHTML = '<strong>Erklärung</strong><span class="tf-explain-text"></span>';
    wrap.appendChild(explain);

    var nextRow = document.createElement('div');
    nextRow.className = 'tf-next';
    var nextBtn = document.createElement('button');
    nextBtn.className = 'tf-next-btn';
    nextBtn.textContent = 'Weiter →';
    nextRow.appendChild(nextBtn);
    wrap.appendChild(nextRow);

    var resetRow = document.createElement('div');
    resetRow.style.cssText = 'text-align:center;margin-top:.5rem';
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost btn-sm';
    resetBtn.textContent = '↺ Neu starten';
    resetRow.appendChild(resetBtn);
    wrap.appendChild(resetRow);

    _copyQgAttrs(aufgabe, wrap);
    aufgabe.parentNode.replaceChild(wrap, aufgabe);

    /* ── Render ── */
    function _tfRender() {
      var st   = _tfState[id];
      if (st.results.length === total) {
        _tfComplete();
        return;
      }
      var item = data[st.order[st.cur]];

      /* Dots */
      var dotsEl = wrap.querySelector('.tf-dots');
      dotsEl.innerHTML = '';
      for (var i = 0; i < total; i++) {
        var d = document.createElement('span');
        d.className = 'tf-dot';
        if (i < st.results.length)     d.className += st.results[i] ? ' tf-dot-correct' : ' tf-dot-wrong';
        else if (i === st.cur)         d.className += ' tf-dot-active';
        dotsEl.appendChild(d);
      }
      wrap.querySelector('.tf-prog-label').textContent = 'Frage ' + (st.cur + 1) + ' von ' + total;

      card.className = 'tf-card';
      stmt.textContent = item.text;
      fb.textContent = '';
      fb.className = 'tf-feedback';
      explain.classList.remove('visible');
      nextRow.classList.remove('visible');
      banner.classList.remove('visible');

      btnW.className = 'tf-btn tf-btn-wahr';
      btnF.className = 'tf-btn tf-btn-falsch';
      btnW.disabled = false;
      btnF.disabled = false;
      btnW.style.display = '';
      btnF.style.display = '';
      /* Reconcile post-answer visual if restored in answered state */
      if (st.answered) {
        btnW.disabled = true;
        btnF.disabled = true;
        var item2 = data[st.order[st.cur]];
        if (item2.correct) btnW.classList.add('tf-sel-correct');
        else               btnF.classList.add('tf-sel-correct');
        if (st.cur < total - 1) nextRow.classList.add('visible');
      }
    }
    _lib2Renders['tf-' + id] = _tfRender;

    function _tfAnswer(answer) {
      var st = _tfState[id];
      if (st.answered) return;
      st.answered = true;

      var item      = data[st.order[st.cur]];
      var isCorrect = (answer === item.correct);
      st.results.push(isCorrect);

      var dots = wrap.querySelectorAll('.tf-dot');
      if (dots[st.cur]) dots[st.cur].className = 'tf-dot ' + (isCorrect ? 'tf-dot-correct' : 'tf-dot-wrong');

      btnW.disabled = true;
      btnF.disabled = true;

      if (isCorrect) {
        card.classList.add('tf-correct');
        fb.textContent = '✓ Richtig!';
        fb.className = 'tf-feedback tf-fb-ok';
        if (answer) btnW.classList.add('tf-sel-correct');
        else        btnF.classList.add('tf-sel-correct');
      } else {
        card.classList.add('tf-wrong');
        fb.textContent = answer ? 'Diese Aussage ist falsch.' : 'Diese Aussage ist richtig.';
        if (answer) btnW.classList.add('tf-sel-wrong');
        else        btnF.classList.add('tf-sel-wrong');
        if (item.correct) btnW.classList.add('tf-sel-correct');
        else              btnF.classList.add('tf-sel-correct');
        /* Show explanation only: item is false AND student answered wrong (Wahr on false) */
        if (!item.correct && item.explain) {
          wrap.querySelector('.tf-explain-text').textContent = item.explain;
          setTimeout(function () { explain.classList.add('visible'); }, 200);
        }
      }

      var isLast = (st.cur === total - 1);
      if (isLast) {
        setTimeout(_tfComplete, 1000);
      } else {
        setTimeout(function () { nextRow.classList.add('visible'); }, 400);
      }
      PLK._saveAbState && PLK._saveAbState();
    }

    function _tfComplete() {
      var st = _tfState[id];
      var correct = 0;
      for (var i = 0; i < st.results.length; i++) { if (st.results[i]) correct++; }
      banner.querySelector('strong').textContent = 'Alle Aussagen bewertet!';
      banner.querySelector('span').textContent   = correct + ' von ' + total + ' richtig eingeschätzt.';
      banner.classList.add('visible');
      nextRow.classList.remove('visible');
      btnW.style.display = 'none';
      btnF.style.display = 'none';
      wrap.querySelector('.tf-prog-label').textContent = 'Fertig!';
    }

    function _tfReset() {
      var st = _tfState[id];
      st.order    = _shuffle(_range(total));
      st.cur      = 0;
      st.results  = [];
      st.answered = false;
      _tfRender();
      PLK._saveAbState && PLK._saveAbState();
    }

    btnW.addEventListener('click', function () { _tfAnswer(true); });
    btnF.addEventListener('click', function () { _tfAnswer(false); });
    nextBtn.addEventListener('click', function () {
      var _st = _tfState[id];
      _st.cur++;
      _st.answered = false;
      _tfRender();
      PLK._saveAbState && PLK._saveAbState();
    });
    resetBtn.addEventListener('click', _tfReset);

    _tfRender();
  }

  /* ════════════════════════════════════════════════════════
     2. ODD-ONE-OUT
     ════════════════════════════════════════════════════════ */

  function _oooInit(aufgabe) {
    var id    = aufgabe.getAttribute('data-id');
    var total = aufgabe.querySelectorAll('.ooo-round').length;

    /* Parse rounds */
    var data = [];
    _each(aufgabe.querySelectorAll('.ooo-round'), function (round) {
      var opts = [];
      _each(round.querySelectorAll('.ooo-opt'), function (opt) {
        opts.push({
          label:   opt.textContent.trim(),
          emoji:   opt.getAttribute('data-emoji') || '',
          sub:     opt.getAttribute('data-sub')   || '',
          odd:     opt.hasAttribute('data-odd'),
          explain: opt.getAttribute('data-explain') || null
        });
      });
      data.push({ question: round.getAttribute('data-question') || '', opts: opts });
    });

    /* Precompute per-round shuffled opt orders and store in state.
       roundOrders[roundDataIdx] = shuffled index array             */
    var initOrders = [];
    for (var ri = 0; ri < data.length; ri++) {
      initOrders.push(_shuffle(_range(data[ri].opts.length)));
    }

    _oooState[id] = {
      order:       _shuffle(_range(total)),
      cur:         0,
      results:     [],
      answered:    false,
      hadWrong:    false,
      roundOrders: initOrders,  /* [roundIdx] = [shuffled opt indices] */
      lockedIdxs:  []           /* opt indices locked wrong in current round */
    };

    /* Build DOM */
    var wrap = document.createElement('div');
    wrap.className = 'ooo-wrap';
    wrap.setAttribute('data-aufid', id);

    var banner = document.createElement('div');
    banner.className = 'ooo-banner';
    banner.innerHTML = '<div class="ooo-banner-icon">✓</div>'
      + '<div><strong></strong><span></span></div>';
    wrap.appendChild(banner);

    var prog = document.createElement('div');
    prog.className = 'ooo-progress';
    prog.innerHTML = '<span class="ooo-prog-label"></span><div class="ooo-dots"></div>';
    wrap.appendChild(prog);

    var question = document.createElement('div');
    question.className = 'ooo-question';
    wrap.appendChild(question);

    var grid = document.createElement('div');
    grid.className = 'ooo-grid';
    wrap.appendChild(grid);

    var fbEl = document.createElement('p');
    fbEl.className = 'ooo-feedback';
    wrap.appendChild(fbEl);

    var explain = document.createElement('div');
    explain.className = 'ooo-explain';
    explain.innerHTML = '<strong>Warum?</strong><span class="ooo-explain-text"></span>';
    wrap.appendChild(explain);

    var nextRow = document.createElement('div');
    nextRow.className = 'ooo-next';
    var nextBtn = document.createElement('button');
    nextBtn.className = 'ooo-next-btn';
    nextBtn.textContent = 'Weiter →';
    nextRow.appendChild(nextBtn);
    wrap.appendChild(nextRow);

    var resetRow = document.createElement('div');
    resetRow.style.cssText = 'text-align:center;margin-top:.5rem';
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost btn-sm';
    resetBtn.textContent = '↺ Neu starten';
    resetRow.appendChild(resetBtn);
    wrap.appendChild(resetRow);

    _copyQgAttrs(aufgabe, wrap);
    aufgabe.parentNode.replaceChild(wrap, aufgabe);

    var _wrongTapTimer = null;

    function _oooRender() {
      var st    = _oooState[id];
      var rIdx  = st.order[st.cur];
      var round = data[rIdx];
      var ord   = st.roundOrders[rIdx]; /* saved shuffled order for this round */

      /* Dots */
      var dotsEl = wrap.querySelector('.ooo-dots');
      dotsEl.innerHTML = '';
      for (var i = 0; i < total; i++) {
        var d = document.createElement('span');
        d.className = 'ooo-dot';
        if (i < st.results.length)  d.className += st.results[i] ? ' ooo-dot-correct' : ' ooo-dot-wrong';
        else if (i === st.cur)      d.className += ' ooo-dot-active';
        dotsEl.appendChild(d);
      }
      wrap.querySelector('.ooo-prog-label').textContent = 'Runde ' + (st.cur + 1) + ' von ' + total;

      question.innerHTML = round.question;
      grid.className = round.opts.length === 3 ? 'ooo-grid ooo-grid-3' : 'ooo-grid';
      grid.innerHTML = '';

      ord.forEach(function (optIdx, displayPos) {
        var opt  = round.opts[optIdx];
        var item = document.createElement('div');
        item.className = 'ooo-item';
        /* Mark as locked if this optIdx was wrong-tapped before tab-switch */
        if (st.lockedIdxs.indexOf(optIdx) !== -1) {
          item.className += ' ooo-locked';
        }
        item.innerHTML = '<span class="ooo-emoji">' + opt.emoji + '</span>'
          + '<div class="ooo-label">' + opt.label + '</div>'
          + '<div class="ooo-sub">'   + opt.sub   + '</div>'
          + '<span class="ooo-badge">Außenseiter</span>';
        item.addEventListener('click', (function (o, el, oIdx) {
          return function () { _oooPick(o, el, round, oIdx); };
        })(opt, item, optIdx));
        grid.appendChild(item);
      });

      fbEl.textContent = '';
      explain.classList.remove('visible');
      nextRow.classList.remove('visible');
      banner.classList.remove('visible');

      /* Reconcile post-answer visual if restored in answered state */
      if (st.results.length > st.cur) {
        st.answered = true;
        var oddOptIdx = -1;
        for (var oi = 0; oi < round.opts.length; oi++) {
          if (round.opts[oi].odd) { oddOptIdx = oi; break; }
        }
        var items = grid.querySelectorAll('.ooo-item');
        ord.forEach(function (optIdx, pos) {
          items[pos].classList.add('ooo-locked');
          if (optIdx === oddOptIdx) items[pos].classList.add('ooo-reveal-odd');
          else                      items[pos].classList.add('ooo-reveal-belongs');
        });
        if (st.cur < total - 1) nextRow.classList.add('visible');
      }
    }
    _lib2Renders['ooo-' + id] = _oooRender;

    function _oooPick(opt, el, round, optIdx) {
      var st = _oooState[id];
      if (st.answered) return;

      if (!opt.odd) {
        el.classList.add('ooo-wrong-flash', 'ooo-locked');
        setTimeout(function () { el.classList.remove('ooo-wrong-flash'); }, 400);
        st.lockedIdxs.push(optIdx);

        if (_wrongTapTimer) clearTimeout(_wrongTapTimer);
        fbEl.textContent = 'Das gehört zur Gruppe — such weiter.';
        st.hadWrong = true;
        _wrongTapTimer = setTimeout(function () {
          fbEl.textContent = '';
          _wrongTapTimer = null;
        }, 1500);
        return;
      }

      /* Correct */
      st.answered = true;
      if (_wrongTapTimer) { clearTimeout(_wrongTapTimer); _wrongTapTimer = null; }
      fbEl.textContent = '';

      var firstAttempt = !st.hadWrong;
      st.results.push(firstAttempt ? 1 : 0);
      st.hadWrong  = false;
      st.lockedIdxs = [];

      var dots = wrap.querySelectorAll('.ooo-dot');
      if (dots[st.cur]) {
        dots[st.cur].className = 'ooo-dot ' + (firstAttempt ? 'ooo-dot-correct' : 'ooo-dot-wrong');
      }

      el.classList.add('ooo-reveal-odd');
      _each(grid.querySelectorAll('.ooo-item:not(.ooo-reveal-odd):not(.ooo-locked)'),
        function (other) { other.classList.add('ooo-reveal-belongs', 'ooo-locked'); });
      _each(grid.querySelectorAll('.ooo-item'), function (i2) { i2.classList.add('ooo-locked'); });

      if (opt.explain) {
        wrap.querySelector('.ooo-explain-text').textContent = opt.explain;
        setTimeout(function () { explain.classList.add('visible'); }, 300);
      }

      var isLast = (st.cur === total - 1);
      setTimeout(function () {
        if (isLast) _oooComplete();
        else nextRow.classList.add('visible');
      }, isLast ? 1000 : 500);

      PLK._saveAbState && PLK._saveAbState();
    }

    function _oooComplete() {
      var st = _oooState[id];
      var correct = 0;
      for (var i = 0; i < st.results.length; i++) correct += st.results[i];
      banner.querySelector('strong').textContent = 'Alle Runden abgeschlossen!';
      banner.querySelector('span').textContent   =
        correct + ' von ' + total + ' Runden beim ersten Versuch erkannt.';
      banner.classList.add('visible');
      nextRow.classList.remove('visible');
      wrap.querySelector('.ooo-prog-label').textContent = 'Fertig!';
    }

    function _oooReset() {
      if (_wrongTapTimer) { clearTimeout(_wrongTapTimer); _wrongTapTimer = null; }
      var newOrders = [];
      for (var ri = 0; ri < data.length; ri++) {
        newOrders.push(_shuffle(_range(data[ri].opts.length)));
      }
      var st = _oooState[id];
      st.order       = _shuffle(_range(total));
      st.cur         = 0;
      st.results     = [];
      st.answered    = false;
      st.hadWrong    = false;
      st.roundOrders = newOrders;
      st.lockedIdxs  = [];
      _oooRender();
      PLK._saveAbState && PLK._saveAbState();
    }

    nextBtn.addEventListener('click', function () {
      var st = _oooState[id];
      st.cur++;
      st.answered   = false;
      st.hadWrong   = false;
      st.lockedIdxs = [];
      /* Generate fresh shuffled order for new round */
      var rIdx = st.order[st.cur];
      st.roundOrders[rIdx] = _shuffle(_range(data[rIdx].opts.length));
      _oooRender();
      PLK._saveAbState && PLK._saveAbState();
    });
    resetBtn.addEventListener('click', _oooReset);

    _oooRender();
  }

  /* ════════════════════════════════════════════════════════
     3. FLASHCARD RECALL
     ════════════════════════════════════════════════════════ */

  function _fcrInit(aufgabe) {
    var id   = aufgabe.getAttribute('data-id');
    var data = [];

    _each(aufgabe.querySelectorAll('.fcr-card'), function (cel) {
      var choices = [];
      _each(cel.querySelectorAll('.fcr-choice'), function (ch) {
        choices.push(ch.textContent.trim());
      });
      data.push({
        term:    cel.getAttribute('data-term'),
        correct: parseInt(cel.getAttribute('data-correct'), 10),
        choices: choices
      });
    });
    var total = data.length;

    /* Init state */
    var initCardStates = [];
    for (var i = 0; i < total; i++) {
      initCardStates.push({ done: false, missed: false, chosen: null, order: null });
    }
    _fcrState[id] = { cardStates: initCardStates, active: null };

    /* Build DOM */
    var wrap = document.createElement('div');
    wrap.className = 'fcr-wrap';
    wrap.setAttribute('data-aufid', id);

    var banner = document.createElement('div');
    banner.className = 'fcr-banner';
    banner.innerHTML = '<div class="fcr-banner-icon">🎉</div>'
      + '<div><strong>Alle Begriffe richtig erkannt!</strong>'
      + '<span>Die Definitionen werden jetzt angezeigt.</span></div>';
    wrap.appendChild(banner);

    var gridEl = document.createElement('div');
    gridEl.className = 'fcr-grid';
    wrap.appendChild(gridEl);

    var panelEl = document.createElement('div');
    panelEl.className = 'fcr-panel';
    panelEl.innerHTML = '<div class="fcr-panel-empty">Begriff antippen zum Starten</div>'
      + '<div class="fcr-panel-content" style="display:none"></div>';
    wrap.appendChild(panelEl);

    var resetRow = document.createElement('div');
    resetRow.style.cssText = 'text-align:center;margin-top:.75rem';
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost btn-sm';
    resetBtn.textContent = '↺ Zurücksetzen';
    resetRow.appendChild(resetBtn);
    wrap.appendChild(resetRow);

    _copyQgAttrs(aufgabe, wrap);
    aufgabe.parentNode.replaceChild(wrap, aufgabe);

    function _getOrder(i) {
      var st = _fcrState[id];
      if (!st.cardStates[i].order) st.cardStates[i].order = _shuffle([0, 1, 2]);
      return st.cardStates[i].order;
    }

    function _allDone() {
      var cs = _fcrState[id].cardStates;
      for (var i = 0; i < total; i++) { if (!cs[i].done) return false; }
      return true;
    }

    function _fcrRender() {
      var st        = _fcrState[id];
      var completed = _allDone();

      /* Grid */
      gridEl.innerHTML = '';
      for (var i = 0; i < total; i++) {
        (function (idx) {
          var cs  = st.cardStates[idx];
          var d   = data[idx];
          var div = document.createElement('div');
          var cls = 'fcr-card';
          if (cs.done)                                cls += ' fcr-done';
          else if (cs.missed)                         cls += ' fcr-missed';
          else if (idx === st.active && !cs.done)     cls += ' fcr-active';
          if (completed)                              cls += ' fcr-expanded';
          div.className = cls;

          var termEl = document.createElement('div');
          termEl.className   = 'fcr-term';
          termEl.textContent = d.term;
          div.appendChild(termEl);

          var statusEl = document.createElement('div');
          statusEl.className = 'fcr-status';
          if (completed)         statusEl.textContent = '';
          else if (cs.done)      statusEl.textContent = '✓ Richtig';
          else if (cs.missed)    statusEl.textContent = '✗ Nochmal';
          else if (idx === st.active) statusEl.textContent = '▶ Aktiv';
          else                   statusEl.textContent = 'Antippen';
          div.appendChild(statusEl);

          var defEl = document.createElement('div');
          defEl.className   = 'fcr-def';
          defEl.textContent = d.choices[d.correct];
          div.appendChild(defEl);

          if (!cs.done) {
            div.addEventListener('click', function () { _fcrOpen(idx); });
          }
          gridEl.appendChild(div);
        })(i);
      }

      /* Panel */
      var empty   = panelEl.querySelector('.fcr-panel-empty');
      var content = panelEl.querySelector('.fcr-panel-content');
      if (completed) { panelEl.classList.add('fcr-folded'); return; }
      panelEl.classList.remove('fcr-folded');

      if (st.active === null) {
        empty.style.display   = '';
        content.style.display = 'none';
        return;
      }
      empty.style.display   = 'none';
      content.style.display = '';
      content.innerHTML = '';

      var d2  = data[st.active];
      var cs2 = st.cardStates[st.active];
      var ord = _getOrder(st.active);

      var termLabel = document.createElement('div');
      termLabel.className   = 'fcr-panel-term';
      termLabel.textContent = d2.term + ' — welche Definition stimmt?';
      content.appendChild(termLabel);

      ord.forEach(function (srcIdx) {
        var btn = document.createElement('button');
        btn.className   = 'fcr-choice';
        btn.textContent = d2.choices[srcIdx];
        if (cs2.chosen !== null) {
          if (srcIdx === d2.correct)                                    btn.classList.add('fcr-ch-correct');
          else if (srcIdx === cs2.chosen && cs2.chosen !== d2.correct)  btn.classList.add('fcr-ch-wrong');
          else                                                           btn.classList.add('fcr-ch-locked');
        }
        btn.addEventListener('click', (function (si) {
          return function () { _fcrPick(si); };
        })(srcIdx));
        content.appendChild(btn);
      });

      /* Banner */
      if (_allDone()) banner.classList.add('visible');
      else            banner.classList.remove('visible');
    }
    _lib2Renders['fcr-' + id] = _fcrRender;

    function _fcrOpen(idx) {
      var st = _fcrState[id];
      if (st.cardStates[idx].done) return;
      st.active = idx;
      st.cardStates[idx].chosen = null;
      st.cardStates[idx].order  = null; /* reshuffle on open */
      _fcrRender();
    }

    function _fcrPick(srcIdx) {
      var st = _fcrState[id];
      if (st.active === null) return;
      var cs = st.cardStates[st.active];
      if (cs.chosen !== null) return;
      cs.chosen = srcIdx;
      _fcrRender();

      if (srcIdx === data[st.active].correct) {
        cs.done   = true;
        cs.missed = false;
        setTimeout(function () {
          var next = null;
          for (var i = 0; i < total; i++) { if (!_fcrState[id].cardStates[i].done) { next = i; break; } }
          _fcrState[id].active = next;
          _fcrRender();
          if (_allDone()) setTimeout(function () { banner.classList.add('visible'); }, 300);
          PLK._saveAbState && PLK._saveAbState();
        }, 900);
      } else {
        cs.missed = true;
        setTimeout(function () {
          cs.chosen = null;
          cs.order  = null;
          _fcrRender();
          PLK._saveAbState && PLK._saveAbState();
        }, 1800);
      }
      PLK._saveAbState && PLK._saveAbState();
    }

    function _fcrReset() {
      var st = _fcrState[id];
      for (var i = 0; i < total; i++) {
        _copyInto(st.cardStates[i], { done: false, missed: false, chosen: null, order: null });
      }
      st.active = null;
      panelEl.classList.remove('fcr-folded');
      banner.classList.remove('visible');
      _fcrRender();
      PLK._saveAbState && PLK._saveAbState();
    }

    resetBtn.addEventListener('click', _fcrReset);
    _fcrRender();
  }

  /* ════════════════════════════════════════════════════════
     4. MEMORY CARDS
     ════════════════════════════════════════════════════════ */

  function _glossaryEmoji(term) {
    return (window._PLK_GLOSSARY && window._PLK_GLOSSARY[term] &&
            window._PLK_GLOSSARY[term].emoji) || '📌';
  }

  function _mcInitials(name) {
    var parts = name.trim().split(/\s+/);
    if (parts.length < 2) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  }

  function _mcInit(aufgabe) {
    var id    = aufgabe.getAttribute('data-id');
    var pairs = [];

    _each(aufgabe.querySelectorAll('.mc-pair'), function (el, idx) {
      var p = { id: idx, match: el.getAttribute('data-match') || '' };
      if (el.hasAttribute('data-term')) {
        p.type = 'term'; p.term = el.getAttribute('data-term');
      } else if (el.hasAttribute('data-person')) {
        p.type = 'person';
        p.person = el.getAttribute('data-person');
        p.name   = el.getAttribute('data-name') || el.getAttribute('data-person');
      } else {
        p.type = 'label'; p.label = el.getAttribute('data-label') || '';
      }
      pairs.push(p);
    });
    var total = pairs.length;

    /* Build initial card order */
    var initOrder = [];
    for (var i = 0; i < total; i++) {
      initOrder.push({ pairId: i, side: 'blue' });
      initOrder.push({ pairId: i, side: 'grey' });
    }
    initOrder = _shuffle(initOrder);

    _mcState[id] = { matched: [], moves: 0, cardOrder: initOrder, flipped: [] };

    /* Build DOM */
    var wrap = document.createElement('div');
    wrap.className = 'mc-wrap';
    wrap.setAttribute('data-aufid', id);

    var banner = document.createElement('div');
    banner.className = 'mc-banner';
    banner.innerHTML = '<div class="mc-banner-icon">🎉</div>'
      + '<div><strong>Alle Paare gefunden!</strong><span class="mc-banner-moves"></span></div>';
    wrap.appendChild(banner);

    var statusBar = document.createElement('div');
    statusBar.className = 'mc-status';
    statusBar.innerHTML = '<span>Züge: <strong class="mc-moves-count">0</strong></span>'
      + '<span class="mc-pairs-left"><span class="mc-pairs-num">' + total + '</span> Paare noch offen</span>';
    wrap.appendChild(statusBar);

    var gridEl = document.createElement('div');
    gridEl.className = 'mc-grid';
    wrap.appendChild(gridEl);

    var resetRow = document.createElement('div');
    resetRow.style.cssText = 'text-align:center';
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost btn-sm';
    resetBtn.textContent = '↺ Neu mischen';
    resetRow.appendChild(resetBtn);
    wrap.appendChild(resetRow);

    _copyQgAttrs(aufgabe, wrap);
    aufgabe.parentNode.replaceChild(wrap, aufgabe);

    /* Runtime-only state (not persisted: locked) */
    var _flipped = []; /* DOM refs — mirrored by st.flipped ({pairId,side}) */
    var _locked  = false;

    function _mcBuildFront(pair, side) {
      var front = document.createElement('div');
      front.className = 'mc-face mc-front ' + (side === 'blue' ? 'mc-is-blue' : 'mc-is-grey');
      var inner = document.createElement('div');

      if (side === 'grey') {
        var defLbl = document.createElement('div');
        defLbl.className   = 'mc-card-label';
        defLbl.textContent = 'Aufgabe / Rolle';
        inner.appendChild(defLbl);
        var matchText = document.createElement('div');
        matchText.className   = 'mc-card-text';
        matchText.textContent = pair.match;
        inner.appendChild(matchText);
      } else if (pair.type === 'term') {
        var lbl = document.createElement('div');
        lbl.className   = 'mc-card-label';
        lbl.textContent = 'Begriff';
        inner.appendChild(lbl);
        var emojiEl = document.createElement('div');
        emojiEl.style.fontSize = '1.3rem';
        emojiEl.textContent    = _glossaryEmoji(pair.term);
        inner.appendChild(emojiEl);
        var termText = document.createElement('div');
        termText.className   = 'mc-card-text';
        termText.textContent = pair.term;
        inner.appendChild(termText);
      } else if (pair.type === 'person') {
        var lbl2 = document.createElement('div');
        lbl2.className   = 'mc-card-label';
        lbl2.textContent = 'Person';
        inner.appendChild(lbl2);
        var photoWrap = document.createElement('div');
        photoWrap.className = 'mc-photo-wrap';
        var initials = _mcInitials(pair.name);
        var img = document.createElement('img');
        /* path: ../data/persons/ (units are one level deep in einheiten/) */
        img.src = '../data/persons/' + pair.person + '.jpg';
        img.alt = pair.name;
        img.onerror = (function (pw, ini) {
          return function () {
            this.style.display = 'none';
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 40 40');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '20'); circle.setAttribute('cy', '20');
            circle.setAttribute('r',  '20'); circle.setAttribute('fill', '#bfdbfe');
            svg.appendChild(circle);
            var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', '20'); txt.setAttribute('y', '26');
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('font-size',   '13');
            txt.setAttribute('font-weight', 'bold');
            txt.setAttribute('fill', '#1e40af');
            txt.textContent = ini;
            svg.appendChild(txt);
            pw.appendChild(svg);
          };
        })(photoWrap, initials);
        photoWrap.appendChild(img);
        inner.appendChild(photoWrap);
        var nameText = document.createElement('div');
        nameText.className   = 'mc-card-text';
        nameText.style.fontSize = '.65rem';
        nameText.textContent = pair.name;
        inner.appendChild(nameText);
      } else {
        var lbl3 = document.createElement('div');
        lbl3.className   = 'mc-card-label';
        lbl3.textContent = 'Vertrag';
        inner.appendChild(lbl3);
        var emojiEl2 = document.createElement('div');
        emojiEl2.style.fontSize = '1.2rem';
        emojiEl2.textContent    = '📜';
        inner.appendChild(emojiEl2);
        var labelText = document.createElement('div');
        labelText.className   = 'mc-card-text';
        labelText.textContent = pair.label;
        inner.appendChild(labelText);
      }

      front.appendChild(inner);
      return front;
    }

    function _mcRenderGrid() {
      var st = _mcState[id];
      _flipped = [];
      _locked  = false;
      gridEl.innerHTML = '';

      st.cardOrder.forEach(function (c) {
        var pair  = pairs[c.pairId];
        var scene = document.createElement('div');
        scene.className = 'mc-scene';

        var card = document.createElement('div');
        card.className = 'mc-card';
        card.setAttribute('data-pair-id', c.pairId);
        card.setAttribute('data-side',    c.side);

        var back = document.createElement('div');
        back.className = 'mc-face mc-back';
        back.innerHTML = '<span class="mc-back-icon">★</span>';
        card.appendChild(back);
        card.appendChild(_mcBuildFront(pair, c.side));

        if (st.matched.indexOf(c.pairId) !== -1) {
          card.classList.add('mc-flipped', 'mc-matched');
        }

        card.addEventListener('click', function () { _mcFlip(card); });
        scene.appendChild(card);
        gridEl.appendChild(scene);
      });

      /* Restore face-up cards from saved state */
      if (st.flipped && st.flipped.length) {
        _each(gridEl.querySelectorAll('.mc-card'), function (card) {
          var pId  = parseInt(card.getAttribute('data-pair-id'), 10);
          var side = card.getAttribute('data-side');
          for (var fi = 0; fi < st.flipped.length; fi++) {
            if (st.flipped[fi].pairId === pId && st.flipped[fi].side === side) {
              card.classList.add('mc-flipped');
              _flipped.push(card);
              break;
            }
          }
        });
        if (_flipped.length === 2) {
          _locked = true;
          _mcCheck();
        }
      }

      _mcUpdateStatus();
    }
    _lib2Renders['mc-' + id] = _mcRenderGrid;

    function _mcUpdateStatus() {
      var st = _mcState[id];
      wrap.querySelector('.mc-moves-count').textContent = st.moves;
      wrap.querySelector('.mc-pairs-num').textContent   = total - st.matched.length;
    }

    function _mcFlip(card) {
      if (_locked) return;
      var st     = _mcState[id];
      var pairId = parseInt(card.getAttribute('data-pair-id'), 10);
      if (st.matched.indexOf(pairId) !== -1) return;
      if (card.classList.contains('mc-flipped')) return;
      if (_flipped.length === 2) return;

      card.classList.add('mc-flipped');
      _flipped.push(card);
      st.flipped.push({ pairId: pairId, side: card.getAttribute('data-side') });

      if (_flipped.length === 2) {
        _locked = true;
        st.moves++;
        _mcUpdateStatus();
        _mcCheck();
      }
    }

    function _mcCheck() {
      var st   = _mcState[id];
      var a    = _flipped[0];
      var b    = _flipped[1];
      var aPId = parseInt(a.getAttribute('data-pair-id'), 10);
      var bPId = parseInt(b.getAttribute('data-pair-id'), 10);
      var aSide = a.getAttribute('data-side');
      var bSide = b.getAttribute('data-side');

      if (aPId === bPId && aSide !== bSide) {
        a.classList.add('mc-matched');
        b.classList.add('mc-matched');
        st.matched.push(aPId);
        _flipped = [];
        st.flipped = [];
        _locked  = false;
        _mcUpdateStatus();
        PLK._saveAbState && PLK._saveAbState();
        if (st.matched.length === total) {
          setTimeout(function () {
            wrap.querySelector('.mc-banner-moves').textContent = st.moves + ' Züge benötigt.';
            banner.classList.add('visible');
          }, 300);
        }
      } else {
        a.classList.add('mc-no-match');
        b.classList.add('mc-no-match');
        PLK._saveAbState && PLK._saveAbState();
        setTimeout(function () {
          a.classList.remove('mc-flipped', 'mc-no-match');
          b.classList.remove('mc-flipped', 'mc-no-match');
          _flipped = [];
          st.flipped = [];
          _locked  = false;
          PLK._saveAbState && PLK._saveAbState();
        }, 2000);
      }
    }

    function _mcReset() {
      var st = _mcState[id];
      var raw = [];
      for (var i = 0; i < total; i++) {
        raw.push({ pairId: i, side: 'blue' });
        raw.push({ pairId: i, side: 'grey' });
      }
      st.cardOrder = _shuffle(raw);
      st.matched   = [];
      st.moves     = 0;
      st.flipped   = [];
      banner.classList.remove('visible');
      _mcRenderGrid();
      PLK._saveAbState && PLK._saveAbState();
    }

    resetBtn.addEventListener('click', _mcReset);
    _mcRenderGrid();
  }

  /* ── Module registration ──────────────────────────────── */

  PLK.register({
    name: 'quiz-lib2',
    init: function () {
      PLK._saveLib2State    = _saveLib2;
      PLK._restoreLib2State = _restoreLib2;

      if (PLK.registerQgType) {
        PLK.registerQgType(['wahr-falsch', 'true-false', 'tf'], {
          check: function (item) {
            var wrap = _resolveGateWrap(item, '.tf-wrap');
            if (!wrap) return { ok: false };
            var id = wrap.getAttribute('data-aufid');
            var st = id ? _tfState[id] : null;
            var total = st ? st.order.length : 0;
            var ok = total > 0
              && st.results.length === total
              && st.results.every(function (v) { return !!v; });
            return { ok: ok };
          },
          reset: function (item) {
            var wrap = _resolveGateWrap(item, '.tf-wrap');
            if (!wrap) return;
            _resetTfState(wrap.getAttribute('data-aufid'));
          },
          save: function (item) {
            var wrap = _resolveGateWrap(item, '.tf-wrap');
            return wrap ? _saveTfState(wrap.getAttribute('data-aufid')) : null;
          },
          restore: function (item, state) {
            var wrap = _resolveGateWrap(item, '.tf-wrap');
            if (!wrap) return;
            _restoreTfState(wrap.getAttribute('data-aufid'), state);
          }
        });

        PLK.registerQgType(['odd-one-out', 'ooo'], {
          check: function (item) {
            var wrap = _resolveGateWrap(item, '.ooo-wrap');
            if (!wrap) return { ok: false };
            var id = wrap.getAttribute('data-aufid');
            var st = id ? _oooState[id] : null;
            var total = st ? st.order.length : 0;
            var ok = total > 0
              && st.results.length === total
              && st.results.every(function (v) { return !!v; });
            return { ok: ok };
          },
          reset: function (item) {
            var wrap = _resolveGateWrap(item, '.ooo-wrap');
            if (!wrap) return;
            _resetOooState(wrap.getAttribute('data-aufid'));
          },
          save: function (item) {
            var wrap = _resolveGateWrap(item, '.ooo-wrap');
            return wrap ? _saveOooState(wrap.getAttribute('data-aufid')) : null;
          },
          restore: function (item, state) {
            var wrap = _resolveGateWrap(item, '.ooo-wrap');
            if (!wrap) return;
            _restoreOooState(wrap.getAttribute('data-aufid'), state);
          }
        });
      }

      _each(document.querySelectorAll(
        '.aufgabe[data-type="wahr-falsch"],'
        + '.aufgabe[data-type="odd-one-out"],'
        + '.aufgabe[data-type="flashcard-recall"],'
        + '.aufgabe[data-type="memory-cards"]'
      ), function (auf) {
        var t = auf.getAttribute('data-type');
        if      (t === 'wahr-falsch')      _tfInit(auf);
        else if (t === 'odd-one-out')      _oooInit(auf);
        else if (t === 'flashcard-recall') _fcrInit(auf);
        else if (t === 'memory-cards')     _mcInit(auf);
      });
    }
  });

})();
