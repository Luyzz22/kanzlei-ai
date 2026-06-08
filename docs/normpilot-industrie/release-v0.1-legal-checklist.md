# NormPilot Release v0.1 Legal Checklist

Status: Release Freeze

## Ziel

Diese Checklist deckt die rechtlichen Livegang-Punkte fuer
`normpilot-industrie.de`, `www.normpilot-industrie.de` und
`app.normpilot-industrie.de` ab. Sie ersetzt keine Rechtsberatung und muss vor
Livegang durch die verantwortliche Stelle final freigegeben werden.

## Zu pruefende Seiten

- `/impressum`
- `/datenschutz`
- `/avv`
- `/cookie-einstellungen`
- `/ki-transparenz`
- `/sicherheit-compliance`

## Domain-Faehigkeit

Vor Livegang bestaetigen:

- Impressum gilt ausdruecklich fuer `normpilot-industrie.de`,
  `www.normpilot-industrie.de` und `app.normpilot-industrie.de`.
- Datenschutzerklaerung nennt NormPilot oder beschreibt die Verarbeitung
  produktneutral so, dass NormPilot abgedeckt ist.
- AVV/Subprozessoren-Liste deckt Vercel, Datenbank, Storage und optionale
  E-Mail-/Payment-Dienste korrekt ab.
- KI-Transparenz nennt NormPilot als limited-risk Copilot mit Human Review,
  falls NormPilot oeffentlich beworben wird.

## NormPilot Pilotverarbeitung

Die Datenschutzerklaerung und AVV-Unterlagen sollen diese Verarbeitung abdecken:

- Evidence Mapping.
- kurze Anchors mit maximal 280 Zeichen.
- Locator fuer Quellen/Fundstellen.
- Hashes fuer Evidence und Exporte.
- Review-State und Freigabeentscheidungen.
- Gap Findings und Corrective Action Drafts.
- Evidence Pack Retention ueber vorhandene Governance Settings.

Ausgeschlossen oder nur nach Freigabe:

- proprietaere Norm-Volltexte.
- echte Kundendaten ohne dokumentierte Freigabe.
- personenbezogene Daten in Audit-Metadata.
- produktive LLM-Provider Calls fuer NormPilot.

## Cookies und Tracking

Fuer v0.1:

- technisch notwendige Auth-Cookies erlaubt.
- Analytics/Tracking deaktiviert oder nur nach Consent.
- Keine Demo-/Pilot-Messung mit personenbezogenen Rohdaten.
- Cookie-Einstellungen muessen erreichbar sein.

## AVV und DSFA-Hinweise

Vor Pilot mit kundenseitig freigegebenen Daten:

- AVV/DPA-Status mit Pilotkunden klaeren.
- Datenfreigabe dokumentieren.
- Datenkategorien und Zwecke dokumentieren.
- Pseudonymisierung vor Intake pruefen.
- Retention oder Loeschdatum festlegen.
- Drittlandtransfer pruefen, falls spaeter Provider Calls aktiviert werden.

## Normlizenz-Grenzen

Vor Livegang bestaetigen:

- Keine proprietaeren Norm-Volltexte in App, Doku, Evals oder Demo-Daten.
- Kundeneigene Checklisten und Kurzreferenzen sind erlaubt.
- Export enthaelt Normlizenz-Hinweis.
- Bei unklarer Normgrundlage bleibt der Hinweis erhalten:
  `Diesen Abschnitt bitte direkt in der Norm pruefen.`

## Go/No-Go Legal

Go:

- Impressum, Datenschutz, AVV, Cookie und KI-Transparenz sind domainfaehig.
- Pilotdatenfreigabe ist dokumentiert.
- Kein Tracking ohne Consent.
- Keine Norm-Volltexte.
- Keine produktiven Provider Calls fuer NormPilot.

No-Go:

- Legal-Seiten nennen nur alte Domain ohne Geltung fuer NormPilot-Domain.
- AVV/Subprozessoren-Liste ist falsch oder unvollstaendig.
- Tracking aktiv ohne Consent.
- Kundendaten oder Norm-Volltexte in Demo-Daten.
- Fehlender KI-/Normlizenz-Hinweis in Export oder UI.
