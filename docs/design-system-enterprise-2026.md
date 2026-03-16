# KanzleiAI Design System Enterprise 2026

## 1) Designziel für KanzleiAI
KanzleiAI soll visuell und strukturell als deutsches Enterprise-SaaS für Kanzleien erkennbar sein: ruhig, präzise, belastbar und vertrauenswürdig. Das UI muss juristische Arbeitsrealität abbilden (Mandat, Vertrag, Freigabe, Nachweis, Governance) und gleichzeitig für tägliche Nutzung effizient bleiben.

## 2) Kurz-Audit des aktuellen Zustands (priorisiert)

### Priorität A (hoch)
1. Uneinheitliche Intro-Bereiche: manche Seiten starten mit einfachen Überschriften, andere mit Karten/Meta-Blöcken.
2. Statusdarstellung ist nicht systematisch: Badges, Farben und Tonalität variieren je Seite.
3. Hinweisboxen haben unterschiedliche Stilmittel und semantische Schärfe.
4. Workspace-Dokumente und Detailseite sind funktional, wirken aber visuell noch zu isoliert gegenüber Trust-/Public-Flächen.

### Priorität B (mittel)
1. Fehlende standardisierte Prozessdarstellung (z. B. Review/Freigabe-Flows).
2. CTA-Bereiche sind bisher inkonsistent (Buttons vs. Plain Links).
3. Tabellen-Kontext (Einordnung, Zustand, Nächste Schritte) ist nicht immer klar getrennt.

### Priorität C (niedrig)
1. Public-Navigation kann später schrittweise stärker an die Enterprise-Sprache angenähert werden.
2. Einzelne ältere Content-Seiten (Datenschutz/AVV/KI-Transparenz) benötigen mittelfristig harmonisierte Sektionstemplates.

## 3) Abstrahierte Inspirationsprinzipien
- Klare vertikale Informationsarchitektur mit großzügigen Abständen.
- Dezente Flächen und Borders statt dominanter Effekte.
- Starkes H1/H2-System und kompakte Fachtexte.
- Statuskommunikation als erster Orientierungspunkt.
- Ruhige, prüffähige Module statt Marketing-Inszenierung.

## 4) Farbrollen (Bedeutung statt Einzelwerte)
- **Neutralfläche**: Standard-Sektionen, lesefokussiert, sachlich.
- **Info-Akzent (Blau)**: Orientierung, Einordnung, Plattformhinweise.
- **Erfolg (Grün)**: freigegeben, geprüft, stabil.
- **Warnung (Amber)**: ausstehend, in Prüfung, Nacharbeit nötig.
- **Risiko (Rose/Rot)**: markierte Abweichungen, erhöhte Aufmerksamkeit.
- **Dark Tech Block (Schiefer dunkel)**: technische/architekturelle Einordnung, kontrollierter Kontrast.

## 5) Typografie-Hierarchie
- **H1**: Produkt-/Seitenkontext, 32–40 px, semibold, tight tracking.
- **H2**: Abschnittsebene, 20–24 px, semibold.
- **H3**: Modul-/Card-Titel, 16–18 px, semibold.
- **Body**: 14–16 px, gute Zeilenhöhe, fachlich präzise.
- **Meta/Eyebrow**: uppercase, kleines Tracking, sparsam einsetzen.

## 6) Layout-Prinzipien
- Max-Width-Container pro Seitentyp (Workspace/Trust ähnlich, Public optional enger).
- Wiederkehrendes Muster: Intro → Kernmodule → Vertiefung → nächster Schritt.
- Sektionen klar trennen, keine visuelle Überladung.
- Jede Seite beantwortet sichtbar: **Worum geht es? Was ist der Status? Was kommt als Nächstes?**

## 7) Sektionstypen
1. **Section Intro**: Eyebrow, Titel, präziser Untertext.
2. **Info Panel**: fachliche Einordnung oder Governance-Hinweis.
3. **Feature Card Grid**: Domänen/Kontrollbereiche/Artefakte.
4. **Process Flow**: strukturierte Schrittfolge.
5. **CTA Panel**: nächste Aktion, ohne aggressive Vertriebssprache.

## 8) Card-Muster
- Einheitlich: `rounded-xl`, `border`, helle Fläche, moderate Innenabstände.
- Titel immer klar, Beschreibung kompakt, optional Meta-Zeile.
- Keine künstliche 3D-Optik oder schwere Schatten.

## 9) Badge-Muster
- Badges sind semantisch: neutral, info, success, warning, risk.
- Format: kleine, gut lesbare Pill-Badges mit Border + leichter Fläche.
- Statusbegriffe fachlich und deutschsprachig.

## 10) Tabellen-Muster
- Tabelle immer mit einordnendem Intro/Toolbar kombinieren.
- Kopfzeilen klar, Zeilen ruhig, Hover nur dezent.
- Status-/Prüfstatus als Badges konsistent zu Karten/Details.

## 11) Hinweis-/Compliance-Boxen
- Keine Alarmrhetorik; sachliche Einordnung.
- Zweck: Ausbaustand, regulatorischer Kontext, Zuständigkeiten.
- Immer handlungsorientiert formulieren (nächster Schritt oder Ansprechpartner).

## 12) Dark Feature / Tech Block
- Nutzung nur für technische Vertrauenssignale (Architektur, Protokollierung, Isolation, Härtung).
- Textkontrast hoch, Inhalt präzise, keine Werbeclaims.

## 13) CTA-Muster
- Ein primärer, ggf. ein sekundärer Pfad.
- Beschriftung konkret (z. B. „Nachweise einsehen“, „Zur Dokumentenliste“).
- Keine verkaufsgetriebene Sprache.

## 14) Do / Don’t
### Do
- Deutschsprachig, präzise, belastbar.
- Kompakte Abschnitte mit klaren Überschriften.
- Einheitliche UI-Bausteine über Public/Workspace/Admin/Trust.

### Don’t
- Keine 1:1-Übernahme fremder Layout-/Wortmuster.
- Keine überzogenen Sicherheits- oder Zertifizierungsclaims.
- Keine visuelle Unruhe durch viele konkurrierende Akzentfarben.

## 15) Bereichsregeln

### Public / Trust
- Vertrauens- und Nachweiskommunikation priorisieren.
- Strukturierte Domänenkarten und überprüfbare Aussagen.

### Workspace
- Operative Klarheit: Status, Verantwortlichkeit, Kontext, nächste Schritte.
- Tabellen und Detailseiten müssen direkt zusammenpassen.

### Admin / Governance
- Kontroll- und Rollenbezug sichtbar machen.
- Prüfbare Module statt Marketing-Elemente.

### Compliance-/Trust-Detailseiten
- Rechts- und Sicherheitskontext präzise und nüchtern.
- Bei sensiblen Aussagen immer faktenbasiert und nachvollziehbar.
