# Politik-LK Digitale Lerneinheiten

Digitale Lerneinheiten fuer den Politik-Leistungskurs (GOS) am
Deutsch-Luxemburgischen Schengen-Lyzeum Perl (SLP).

## Projekt

Das Projekt ist eine statische Lernplattform auf Basis von HTML, CSS und
Vanilla JS. Die Einheiten laufen ohne Backend, speichern Lernfortschritt im
Browser und sind fuer iPad Safari sowie Desktop-Browser ausgelegt.

Die aktuelle Architektur ist aus drei Entwicklungslinien entstanden:

- `legacy/` enthaelt die fruehen Standalone-Dateien.
- `3.5` war die erste gemeinsame Site-Vorlage.
- `3.2` und `3.3` sind die am staerksten im Unterricht validierten Runtime-
  Referenzen.
- `3.4` ist abgeschlossen und bildet jetzt die kanonische Basis fuer Look,
  Didaktik, Blockrhythmus und Template-Qualitaet der folgenden Einheiten.

Parallel dazu gibt es einen separaten Methodik-Track fuer AB-Training. Dieser
hat eigene Templates/Module und ist nicht die kanonische Shell fuer normale
Inhaltseinheiten.

## Tech-Stack

- Frontend: HTML5 / CSS3 / Vanilla JS
- Hosting: GitHub Pages / statisches Deployment
- Runtime: ES5-kompatibles Browser-JavaScript, keine Build-Tools
- Speicher: `localStorage`
- Zielgeraete: iPad Safari, Desktop Chrome/Edge

## Architektur

### Kanonische Quellen

- Einheitenshell: [einheiten/_template.html](C:\Users\Redix\Claude-Code\SLP\Politik-LK\einheiten\_template.html)
- Exercise library index: [einheiten/_exercises.html](C:\Users\Redix\Claude-Code\SLP\Politik-LK\einheiten\_exercises.html)
- Exercise detail files: [einheiten/_ex](C:\Users\Redix\Claude-Code\SLP\Politik-LK\einheiten\_ex)
- Architektur-/Statusueberblick: [docs/architecture-status.md](C:\Users\Redix\Claude-Code\SLP\Politik-LK\docs\architecture-status.md)

### Shared runtime

- [js/engine.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\engine.js): PLK registry, progress, unlock flow, worksheet persistence, password utilities
- [js/quiz-base.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\quiz-base.js): bestehende Grundtypen
- [js/quiz-ext.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\quiz-ext.js): erweiterte Grundtypen
- [js/quiz-lib.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\quiz-lib.js): Exercise library Phase 1
- [js/quiz-lib2.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\quiz-lib2.js): Exercise library Phase 2a
- [js/uk-quiz.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\uk-quiz.js): UK scaffold
- [js/tooltips.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\js\tooltips.js): glossary/operator tooltips

### Data model

Die kanonischen Daten liegen in `data/*.json`. Einige Daten haben zusaetzlich
eine `*.js`-Spiegeldatei fuer direkte Script-Einbindung:

- [data/units.json](C:\Users\Redix\Claude-Code\SLP\Politik-LK\data\units.json)
- [data/units.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\data\units.js)
- [data/glossary.json](C:\Users\Redix\Claude-Code\SLP\Politik-LK\data\glossary.json)
- [data/glossary.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\data\glossary.js)
- [data/operators.json](C:\Users\Redix\Claude-Code\SLP\Politik-LK\data\operators.json)
- [data/operators.js](C:\Users\Redix\Claude-Code\SLP\Politik-LK\data\operators.js)

Wenn JSON und JS-Spiegeldatei zusammen existieren, muessen sie synchron
gehalten werden.

## Repository-Struktur

```text
Politik-LK/
|-- index.html
|-- fachbegriffe.html
|-- css/
|   `-- style.css
|-- js/
|   |-- engine.js
|   |-- quiz-base.js
|   |-- quiz-ext.js
|   |-- quiz-lib.js
|   |-- quiz-lib2.js
|   |-- uk-quiz.js
|   `-- tooltips.js
|-- data/
|   |-- units.json / units.js
|   |-- glossary.json / glossary.js
|   `-- operators.json / operators.js
|-- einheiten/
|   |-- _template.html
|   |-- _exercises.html
|   |-- _ex/
|   `-- 3-*.html
|-- legacy/
|-- docs/
`-- tools/
```

## Aktueller Stand

- `3.2` und `3.3` sind didaktisch und technisch stark validiert.
- `3.4` ist die abgeschlossene kanonische Referenzeinheit und der neue
  Mindeststandard fuer Qualitaet, Kohärenz und visuelle Sprache.
- `3.5` bleibt wichtig als historische Prototyp- und Migrationsreferenz, ist
  aber nicht mehr die alleinige Wahrheit fuer das System und muss den `3.4`-
  Standard erben.
- Die Exercise Library und die PLK-Modulstruktur sind bereits vorhanden und
  sollen kuenftige Rework-Kosten reduzieren.

## Arbeitsregeln

- Neue oder ueberarbeitete Einheiten starten von `_template.html`.
- Neue oder ueberarbeitete Einheiten muessen mindestens das Niveau von `3.4`
  in Kohärenz, visueller Sprache und didaktischer Stringenz erreichen.
- Neue Uebungen sollen aus `_exercises.html` und `_ex/` kommen, nicht ad hoc
  in einzelnen Units erfunden werden.
- Wiederverwendbare Interaktionslogik gehoert in `js/`, nicht in einzelne
  Unit-Dateien.
- Wiederverwendbare Visuals gehoeren in `css/style.css`, nicht in unit-lokales
  CSS.
- `legacy/` dient als Inhaltsreferenz, nicht als Architekturvorlage.
