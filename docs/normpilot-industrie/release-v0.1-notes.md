# NormPilot Release v0.1 Notes

Status: Release Freeze
Branch: `release/normpilot-pilot-v0.1`

## Ziel

NormPilot v0.1 ist ein Pilot-Release fuer den Audit Evidence Sprint. Der Release
buendelt die Ergebnisse aus PR 1 bis PR 4 und friert den Stand fuer Vercel
Deployment, Domain Setup, Pilot-GTM und Demo-Readiness ein.

Der Release bleibt bewusst assistiv: NormPilot strukturiert Evidence,
Gap-Entwuerfe, Corrective Actions und Evidence Packs. Es trifft keine autonome
Audit-, Zertifizierungs- oder Massnahmenentscheidung.

## PR 1: Domain Foundation

PR 1 hat die additive Domain-Grundlage gelegt:

- `NormPilotRequirementSet`
- `NormPilotRequirementItem`
- `NormPilotEvidenceSource`
- `NormPilotEvidenceMapping`
- `NormPilotGapFinding`
- `NormPilotCorrectiveAction`
- `NormPilotEvidencePackExport`

Zusaetzlich enthalten:

- RLS-Strategie fuer alle tenant-bound NormPilot-Tabellen.
- Zod-/TypeScript-Strukturen unter `src/lib/normpilot/`.
- Synthetische Golden Cases unter `evals/normpilot/`.
- Exportstruktur mit KI-Hinweis, Normlizenz-Hinweis, Review-State und
  Prompt-Metadaten.

## PR 2: Pipeline und Prompt Governance

PR 2 hat eine mockbare Pipeline V1 ergaenzt:

- Evidence Extraction.
- Evidence Mapping.
- Gap Analysis.
- Corrective Action Draft.
- Evidence Pack Summary.

Prompt Governance:

- Bundle: `normpilot.audit_evidence_sprint.default`
- Version: `2026-06-08`
- Keys:
  - `normpilot.evidence_extraction.default`
  - `normpilot.evidence_mapping.default`
  - `normpilot.gap_analysis.default`
  - `normpilot.corrective_action.default`
  - `normpilot.audit_questions.default`

Der Mock-Modus ist deterministisch und fuer CI/Evals geeignet. Produktionsnahe
Provider Calls sind in v0.1 nicht aktiviert.

## PR 3: Server Review und Export

PR 3 hat die serverseitigen MVP-Flows verbunden:

- Requirement Set CRUD.
- Requirement Item CRUD und JSON-Import.
- Evidence Source CRUD.
- Evidence Matrix lesen und schreiben.
- Gap-Liste lesen und schreiben.
- Corrective Actions lesen und schreiben.
- Review-State-Transitions.
- Evidence Pack Export als Markdown und CSV.
- Persistierter Mock Sprint mit PR2-Mock-Pipeline.

Alle Core-Zugriffe nutzen Tenant-Kontext und explizite `tenantId`-Filter.
AuditEvents werden fuer Mapping, Gap, Corrective Action, Review und Export
geschrieben.

## PR 4: Pilot Hardening

PR 4 hat den Pilot-Betrieb gehaertet:

- Zentrale Audit-Metadata-Allowlist.
- NormPilot Audit-Writes ohne Kundentexte, Anchors, Dokumenttitel oder
  personenbezogene Owner-Labels in Metadata.
- Offline-Smoke `pnpm smoke:normpilot`.
- CI-Step fuer NormPilot Smoke ohne DB, Netzwerk oder externe Services.
- Pilot-Hardening-Tests.
- Demo-Readiness-Checklist.
- 14-Tage-Pilot-Runbook.

## Release-Grenzen

Nicht enthalten in v0.1:

- keine produktiven LLM-Provider Calls fuer NormPilot
- keine proprietaeren Norm-Volltexte
- keine ERP-/QMS-Schreibintegration
- keine M365-/SharePoint-Connectoren
- kein PDF-Export
- keine neue Prisma-Migration in diesem Release-Freeze
- keine DNS-Aenderungen im Code
- keine breite Landingpage-UI
- keine echten Kundendaten in Doku, Tests, Evals oder Demo-Fixtures

## Deployment-Erwartung

Primaere App-Domain:

- `https://app.normpilot-industrie.de`

Marketing-/Landing-Domain:

- `https://www.normpilot-industrie.de`

Apex Redirect:

- `https://normpilot-industrie.de` -> `https://www.normpilot-industrie.de`

Optional spaeter:

- `https://demo.normpilot-industrie.de`

## Release-Gates

Vor Ready-for-Review oder Production-Freigabe muessen lokal oder in CI gruen
sein:

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:normpilot
pnpm smoke:normpilot
pnpm build
```

Nach Production Deploy:

```bash
pnpm exec prisma migrate deploy
psql "$DATABASE_URL_PSQL" -f db/rls.sql
```

## Compliance Summary

- EU AI Act: NormPilot bleibt `limited_risk`; KI-Inhalte sind Entwuerfe und
  benoetigen Human Review.
- DSGVO: Datenminimierung durch kurze Anchors, Locator, Hashes, Review-State und
  metadata-minimierte AuditEvents.
- GoBD: Review- und Export-Aktionen bleiben auditierbar.
- Normlizenz: Keine Norm-Volltexte; nur kundeneigene Checklisten,
  Kurzreferenzen, Locator und Metadaten.
