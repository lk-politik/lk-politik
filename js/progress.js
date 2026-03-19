/* ==========================================================
   Politik-LK — progress.js
   localStorage-Modul für Fortschrittsspeicherung
   Wird von engine.js aufgerufen — kein direkter DOM-Zugriff
   ========================================================== */

var Progress = (function () {

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
