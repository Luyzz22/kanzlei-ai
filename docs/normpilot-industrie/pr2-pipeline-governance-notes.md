# NormPilot PR 2 Pipeline and Prompt Governance Notes

Status: PR 2 Pipeline Foundation

## Ziel

PR 2 ergaenzt eine mockbare NormPilot Pipeline V1 fuer den Audit Evidence
Sprint. Sie bleibt bewusst library-only: keine UI, keine Server Actions, keine
API Routes, keine DB-Writes, keine produktiven Provider Calls und keine
separate `NormPilotAnalysisRun`-Tabelle.

## Pipeline V1

Die Pipeline besteht aus fuenf Stufen:

1. Evidence Extraction
2. Evidence Mapping
3. Gap Analysis
4. Corrective Action Draft
5. Evidence Pack Summary

`runNormPilotPipeline(input, { mock: true })` erzeugt deterministische Outputs
aus Case-ID, Requirement-Code und Evidence-Source-Titel. Provider Calls sind in
PR 2 deaktiviert und werfen bei nicht gesetztem Mock-Modus einen expliziten
Fehler.

## Prompt Governance

Prompt Defaults liegen in `src/lib/ai/prompt-registry/normpilot-defaults.ts`.

- Bundle: `normpilot.audit_evidence_sprint.default`
- Version: `2026-06-08`
- Keys:
  - `normpilot.evidence_extraction.default`
  - `normpilot.evidence_mapping.default`
  - `normpilot.gap_analysis.default`
  - `normpilot.corrective_action.default`
  - `normpilot.audit_questions.default`

Die Prompts trennen Systemregeln, kundeneigene Checklisten und Dokumentinhalt.
Dokumentinhalt ist Daten, nie Anweisung. Proprietaere Norm-Volltexte sind
ausgeschlossen.

## Policy Layer

`src/lib/normpilot/policy.ts` bereitet Tenant-, Provider- und
Pseudonymisierungsentscheidungen vor. Default-Sensitivity ist `confidential`;
personenbezogene Daten werden konservativ angenommen, ausser ein Case ist
synthetisch oder anonymisiert.

Der Layer schreibt keine Logs mit PII und fuehrt keine DB-Abfragen aus. Spaetere
Server-Integration kann die bestehenden KanzleiAI Governance Settings laden und
als Input uebergeben.

## AuditEvent-Katalog

PR 2 definiert nur Konstanten, keine Schreibpfade:

- `normpilot.pipeline.started`
- `normpilot.pipeline.completed`
- `normpilot.pipeline.failed`
- `normpilot.evidence.extracted`
- `normpilot.evidence.mapped`
- `normpilot.gap.generated`
- `normpilot.corrective_action.drafted`
- `normpilot.mapping.reviewed`
- `normpilot.gap.reviewed`
- `normpilot.corrective_action.reviewed`
- `normpilot.evidence_pack.requested`
- `normpilot.evidence_pack.generated`
- `normpilot.evidence_pack.failed`

## Compliance Impact

- EU AI Act: NormPilot bleibt `limited_risk`; alle KI-Ausgaben sind Entwuerfe
  mit `reviewState=UNGEPRUEFT`.
- DSGVO: Anchors sind auf 280 Zeichen begrenzt; Pipeline speichert keine
  Volltexte und bewertet Drittlandtransfer/Pseudonymisierung.
- GoBD: Evidence Pack Summary enthaelt Locator, Hash, Prompt-Metadaten und
  Review-State als Grundlage fuer spaetere AuditEvents.
- Normlizenz: Keine Norm-Volltexte in Code, Prompts, Tests, Evals oder Doku.
  Bei fehlender kundenseitiger Grundlage gilt: `Diesen Abschnitt bitte direkt
  in der Norm pruefen.`
