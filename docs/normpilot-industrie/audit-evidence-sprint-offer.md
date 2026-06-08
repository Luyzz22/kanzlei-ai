# NormPilot Audit Evidence Sprint Offer

Status: Release v0.1 GTM Freeze

## Angebot

Der NormPilot Audit Evidence Sprint ist ein 14-Tage-Pilot fuer Industrie-KMU,
die ihre Audit-Readiness aus vorhandenen Dokumenten und kundeneigenen
Checklisten schneller sichtbar machen wollen.

## Preisrahmen

Pilot-Fixpreis:

- 2.500 bis 4.500 EUR netto

Der konkrete Preis haengt ab von:

- Anzahl der Evidence Sources.
- Umfang der Requirement Items.
- Datenfreigabe- und Pseudonymisierungsaufwand.
- gewuenschtem Abschlussbericht.

Optional kann der Pilotpreis auf ein spaeteres Setup- oder Enterprise-Paket
angerechnet werden.

## Scope

Enthalten:

- 1 Tenant.
- 1 Requirement Set.
- 5 bis 20 freigegebene oder synthetische Evidence Sources.
- Evidence Matrix.
- Gap-Liste.
- Corrective Actions als Entwurf.
- Markdown/CSV Evidence Pack.
- Human Review.
- Abschlussbericht mit Findings, Grenzen und Next Steps.

Nicht enthalten:

- produktive LLM-Provider Calls ohne separate Freigabe.
- ERP-/QMS-Schreibintegration.
- M365-/SharePoint-Connectoren.
- proprietaere Norm-Volltexte.
- PDF-Export.
- produktive Datenmigration.

## Erfolgskriterien

Der Pilot gilt als erfolgreich, wenn:

- Evidence Matrix fachlich reviewbar ist.
- Gap-Liste die wichtigsten Nachweislaecken priorisiert.
- Corrective Actions als Entwurf verwertbar sind.
- Evidence Pack Quellen, Review-State, KI-Hinweis und Normlizenz-Hinweis
  enthaelt.
- Tenant-Isolation- und Audit-Metadata-Smokes gruen sind.
- Keine Norm-Volltexte oder nicht freigegebenen Kundendaten verarbeitet wurden.

## Datenfreigabe

Vor Start erforderlich:

- Datenliste mit Scope.
- Klassifikation der Dokumente.
- Freigabestatus der Dokumente.
- Pseudonymisierungsstatus.
- Ausschluss proprietaerer Norm-Volltexte.
- Retention- oder Loeschdatum.

## Abbruchkriterien

Der Sprint wird gestoppt, wenn:

- Cross-Tenant-Read oder Cross-Tenant-Write moeglich wird.
- produktive Provider Calls unerwartet aktiviert werden.
- Norm-Volltexte importiert, gespeichert oder exportiert werden.
- Audit-Metadata Kundentexte, Anchors, Dokumenttitel oder Owner-Labels enthaelt.
- Pilotdaten ausserhalb der Freigabe liegen.
- Export-Hinweise fehlen.

## Ablauf

Tag 0:

- Kickoff, Tenant, Datenfreigabe, Rollen und Erfolgskriterien festlegen.

Tag 1 bis 3:

- Requirement Set und Evidence Sources vorbereiten.

Tag 4 bis 9:

- Evidence Matrix, Gaps und Corrective Actions pruefen.

Tag 10 bis 12:

- Evidence Pack erstellen und fachlich reviewen.

Tag 13 bis 14:

- Abschlussbericht, Go/No-Go fuer naechste Phase und Retention-Entscheidung.

## Positionierung

NormPilot ist kein ERP-Ersatz, kein QMS-Monolith und kein Normtext-Viewer.
NormPilot ist ein fokussierter Evidence Copilot fuer Audit-Readiness,
Quellenbindung und Human Review.
