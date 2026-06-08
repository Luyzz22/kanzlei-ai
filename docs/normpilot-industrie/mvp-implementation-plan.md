# NormPilot Industrie — MVP Implementation Plan

Status: Kickoff
Branch: `feat/normpilot-industrie-kickoff`

## Ziel

NormPilot Industrie startet als Audit Evidence Sprint für deutsche Industrie-KMU. Das MVP erzeugt aus vorhandenen Kundendokumenten und kundeneigenen Checklisten eine Evidence Matrix, Gap-Liste, Maßnahmenliste und ein Audit Evidence Pack.

## Produktgrenze

NormPilot ist ein Copilot. KI-Ergebnisse sind Review-Entwürfe und keine autonome Audit- oder Zertifizierungsentscheidung.

Pflicht-Hinweis für KI-Ausgaben:

> ⚠️ KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Maßnahmenumsetzung durch Fachverantwortlichen prüfen.

## Leitplanken

- Keine proprietären Norm-Volltexte in Code, Prompts, Seeds, Tests oder Dokumentation.
- Nur kundeneigene Checklisten, Kurzreferenzen und Dokumentfundstellen verwenden.
- Keine echten Kundendaten in Tests oder Beispielinhalten.
- Mandantentrennung über `tenantId` und Row-Level Security.
- Keine personenbezogenen Daten in Logs oder Fehlermeldungen.
- LLM-Provider- und Transfer-Policy je Tenant respektieren.
- Analyse, Review und Export per AuditEvent protokollieren.
- Retention- und Löschstrategie dokumentieren.

## MVP-Domänenmodell

Additive Prisma-Modelle:

1. `NormPilotRequirementSet` — kundeneigener Anforderungskatalog.
2. `NormPilotRequirementItem` — prüfbare Anforderung mit Kurzreferenz.
3. `NormPilotEvidenceSource` — Nachweisquelle aus Upload/Import.
4. `NormPilotEvidenceMapping` — Mapping Anforderung zu Evidence mit Status, Confidence, Fundstelle und Review-State.
5. `NormPilotGapFinding` — Gap mit Severity, Beschreibung, Empfehlung und Quellenbasis.
6. `NormPilotCorrectiveAction` — Maßnahme mit Owner, Frist, Status und Review-State.
7. `NormPilotEvidencePackExport` — Export mit Quellen, Reviews, Modell-/Prompt-Metadaten.

Statuswerte Evidence Mapping: `COVERED`, `PARTIAL`, `MISSING`, `CONFLICTING`, `NOT_APPLICABLE`, `NEEDS_REVIEW`.

Severity-Werte: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.

## Pipeline V1

1. Intake: Dokumente und Requirement Set vorbereiten.
2. Extraktion: Nachweiskandidaten mit Fundstellen extrahieren.
3. Mapping: Kandidaten gegen Requirement Items mappen.
4. Gap-Analyse: offene oder schwach belegte Punkte priorisieren.
5. Maßnahmenentwurf: konkrete Maßnahmen mit Rollenplatzhalter und Akzeptanzkriterien erzeugen.
6. Export: Markdown/CSV zuerst, PDF später.

Prompt-Keys:

- `normpilot.evidence_extraction.default`
- `normpilot.evidence_mapping.default`
- `normpilot.gap_analysis.default`
- `normpilot.corrective_action.default`
- `normpilot.audit_questions.default`

## Evidence Pack Mindestinhalt

- Deckblatt mit KI-Hinweis.
- Scope und Requirement Set.
- Evidence Matrix.
- Gap-Liste.
- Maßnahmenliste.
- Review-Status.
- Quellenreferenzen und Fundstellen.
- Prompt-Versionen, Provider/Modell, Zeitstempel, Input-Hash.
- Hinweis bei fehlender kundenseitiger Normgrundlage: `Diesen Abschnitt bitte direkt in der Norm prüfen.`

## Umsetzungsschritte

### PR 1 — Projektgrundlage

- Bestehende Analyse-, Dokumenten- und Audit-Patterns im Repo identifizieren.
- Additive Datenmodelle und RLS-Entwurf erstellen.
- Zod-Schemas für NormPilot-Domain-Outputs erstellen.
- Mock-Eval-Daten ohne Norm-Volltexte anlegen.

### PR 2 — Pipeline und Prompts

- Prompt-Registry-Einträge erstellen.
- Pipeline-Funktionen mit Mock-Modus bauen.
- AuditEvents für Analyse-Start, Analyse-Ende und Findings schreiben.
- Unit Tests und Evals anbinden.

### PR 3 — UI und Review

- Dashboard-Einstieg `/dashboard/normpilot`.
- Evidence Matrix Table.
- Gap-Liste mit Severity und Review-State.
- Review-Aktionen: akzeptieren, ablehnen, anpassen.
- Export-Button für Markdown/CSV.

### PR 4 — Pilot-Hardening

- Retention-Dokumentation.
- DSFA/AVV-Ergänzungen für NormPilot.
- Tenant-Isolation-Smoke-Test.
- Runbook für 14-Tage-Pilot.

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Zusätzliche Tests: Zod-Schemas, Severity-Mapping, Evidence-Matrix-Mapping, Tenant-Isolation und Export-Inhalt.
