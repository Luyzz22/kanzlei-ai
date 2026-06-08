# NormPilot 14-Tage-Pilot-Runbook

Status: PR 4 Pilot Hardening

## Scope

Der Pilot ist ein begrenzter Audit-Evidence-Sprint fuer einen klar benannten Tenant. Er nutzt NormPilot Mock-/Review-Flows, Requirement Sets, Evidence Sources, Evidence Matrix, Gap Findings, Corrective Actions und Evidence Pack Export.

Nicht im Scope:

- produktive LLM-Provider Calls
- ERP-/QMS-Schreibintegration
- M365-/SharePoint-Connectoren
- proprietaere Norm-Volltexte
- echte Kundendaten ohne dokumentierte Freigabe
- Cross-Tenant-Auswertung

## Rollen

- Pilot Owner: entscheidet Scope, Erfolgskriterien und Abbruch.
- Tenant Owner/Admin: verwaltet Zugriff, Export und Freigaben.
- Fachreviewer: prueft Mappings, Gaps und Corrective Actions.
- Datenschutz-/Security-Ansprechpartner: prueft Datenfreigabe, AVV/DSFA-Hinweise und Transferstatus.
- Technischer Beobachter: fuehrt Smoke-Checks aus und dokumentiert Befunde.

## Datenfreigabe

Vor Intake muss eine Datenfreigabe vorliegen:

- Daten sind synthetisch oder kundenseitig freigegeben.
- Personenbezug ist entfernt oder dokumentiert.
- Norm-Volltexte sind nicht enthalten.
- Dokumenttitel und Rollenlabels enthalten keine personenbezogenen Pflichtangaben.
- Retention oder Loeschdatum ist gesetzt.
- Freigabeumfang ist im Pilot-Protokoll nachvollziehbar.

## Ablauf

Tag 0:

- Tenant, Rollen und Pilotdaten festlegen.
- `pnpm smoke:normpilot` ausfuehren.
- No-go-Pruefungen dokumentieren.

Tag 1-3:

- Requirement Set und Items anlegen oder importieren.
- Evidence Sources aus freigegebenen Referenzen oder synthetischem Intake erfassen.
- Mock Sprint ausfuehren, falls Demo-/Eval-Daten benoetigt werden.

Tag 4-9:

- Evidence Matrix fachlich pruefen.
- Gap Findings auf Plausibilitaet, Severity und Quellenbindung pruefen.
- Corrective Actions als Entwurf bewerten.
- Review-State nur nach Rollenfreigabe aendern.

Tag 10-12:

- Evidence Pack Export als Markdown und optional CSV pruefen.
- KI-Hinweis, Normlizenz-Hinweis, Quellen, Review-State und Prompt-Metadaten bestaetigen.
- AuditEvent-Metadata-Smoke wiederholen.

Tag 13-14:

- Abschlussreview durch Pilot Owner und Fachreviewer.
- Erfolgskriterien bewerten.
- Retention-/Loeschentscheidung dokumentieren.

## Erfolgskriterien

- Tenant-Isolation-Smoke ist gruen.
- AuditEvent-Metadata enthaelt nur IDs, Counts, Status, Review-State, Severity, Format, Prompt-Versionen, Content-Hash oder Error-Code.
- Export enthaelt KI-Hinweis und Normlizenz-Hinweis.
- Evidence Matrix und Gap-Liste sind fachlich reviewbar.
- Corrective Actions bleiben Entwuerfe bis zur expliziten Freigabe.
- Keine Norm-Volltexte, Kundengeheimnisse oder PII in Logs, Audit-Metadata oder Evals.

## Abbruchkriterien

Der Pilot wird gestoppt, wenn einer dieser Punkte eintritt:

- Cross-Tenant-Read oder Cross-Tenant-Write wird moeglich.
- Produktiver Provider Call wird unerwartet aktiviert.
- Norm-Volltext wird importiert, gespeichert oder exportiert.
- Audit-Metadata enthaelt Kundentext, Anchor, Dokumenttitel oder personenbezogene Owner-Labels.
- Export fehlt KI-Hinweis oder Normlizenz-Hinweis.
- Pilotdaten liegen ausserhalb der dokumentierten Freigabe.

## Abschluss

Der Pilot endet mit einem kurzen Abschlussvermerk:

- Scope und verwendete Datenklassen
- ausgefuehrte Quality Gates
- Review-Ergebnis
- offene Findings
- Retention-/Loeschentscheidung
- Entscheidung, ob ein weiterer Produkt- oder Integrations-PR geplant wird
