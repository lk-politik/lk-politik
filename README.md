# Politik-LK Digitale Lerneinheiten — SLP Perl

Digitale Lerneinheiten für den Politik-Leistungskurs (GOS) am
**Deutsch-Luxemburgischen Schengen-Lyzeum Perl (SLP)**.

## Projekt

Interaktive HTML-Lerneinheiten mit Quiz-Engine, Arbeitsblättern und
Fortschrittsspeicherung. Ausgeliefert über GitHub Pages, kein Backend.

## Tech-Stack

- **Frontend:** HTML5 / CSS3 / Vanilla JS
- **Hosting:** GitHub Pages (statisch)
- **Kein Backend**, kein Build-Tool, kein Framework
- **Zielgeräte:** iPad Safari, Desktop Chrome/Edge

## Projektstruktur

```
Politik-LK/
├── index.html          # Startseite & Kapitelübersicht
├── css/
│   └── style.css       # Gemeinsames CSS für alle Einheiten
├── js/
│   ├── engine.js       # Quiz-Engine, Arbeitsblatt-Engine, Passwort-System
│   └── progress.js     # Fortschrittsspeicherung via localStorage
├── img/                # Bilder, Karten, Fotos
├── einheiten/          # Eine HTML-Datei pro Lerneinheit (nur Inhalt)
├── legacy/             # Alte standalone HTML-Dateien als Referenz
└── README.md
```

## Status

**Migration** von standalone HTML-Dateien (CSS/JS inline) auf
Online-Format mit gemeinsamer CSS/JS-Engine.

Jede Einheit unter `einheiten/` bindet `css/style.css`, `js/engine.js`
und `js/progress.js` ein — kein inline CSS/JS mehr.
