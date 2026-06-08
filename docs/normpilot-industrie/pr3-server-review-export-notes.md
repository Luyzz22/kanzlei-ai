# NormPilot PR 3 Server Review Export Notes

Status: PR 3 Server Integration, Review und Export

## Ziel

PR 3 verbindet die NormPilot-Domain aus PR 1 und die Mock-Pipeline aus PR 2
mit serverseitigen Core-Funktionen, Server Actions und einem minimalen
Dashboard. Der Scope bleibt bewusst MVP: keine produktiven Provider Calls,
keine ERP-/QMS-Schreibintegration, keine M365-/SharePoint-Connectoren, keine
PDF-Exports und keine neue Prisma-Migration.

## Server Integration

Die serverseitige Logik liegt in `src/lib/normpilot/*-core.ts`.

- `access.ts`: Tenant-Rollen und Review-/Export-Rechte.
- `requirement-core.ts`: RequirementSet CRUD, RequirementItem CRUD und JSON-Import.
- `evidence-core.ts`: EvidenceSource CRUD aus Document-Referenz oder synthetischem Intake.
- `matrix-core.ts`: Evidence Matrix lesen und schreiben.
- `gap-core.ts`: Gap-Liste lesen und schreiben.
- `action-core.ts`: Corrective Actions lesen und schreiben.
- `review-core.ts`: Review-State-Transitions.
- `export-core.ts`: Evidence Pack Manifest, Markdown und CSV.
- `sprint-core.ts`: Persistierter Mock Sprint mit PR2-Mock-Pipeline.

Alle DB-Zugriffe laufen ueber `withTenant(tenantId, ...)` und nutzen
zusaetzliche `tenantId`-Filter in den Prisma-Queries.

## Server Actions und UI

PR 3 nutzt Server Actions first unter `src/app/dashboard/normpilot/actions.ts`.
Es werden keine breiten API Routes eingefuehrt.

UI-Minimum:

- `/dashboard/normpilot`: Requirement Sets, Anlage und JSON-Import.
- `/dashboard/normpilot/[requirementSetId]`: Requirement Items, Evidence Sources,
  Evidence Matrix, Gap-Liste, Corrective Actions und Export Preview.

Die UI markiert den Mock Sprint als Entwurfs-/Mock-Modus und zeigt KI-Hinweis,
Normlizenz-Hinweis und Review-State.

## Rechte

- `TenantRole.MEMBER`: lesen, Drafts anlegen, Review-State auf `IN_PRUEFUNG`.
- `TenantRole.OWNER` und `TenantRole.ADMIN`: verwalten, reviewen,
  freigeben/zurueckweisen und exportieren.
- Plattform-`ADMIN` wird nur mit gueltigem TenantMember-Kontext akzeptiert.

## AuditEvents

PR 3 schreibt:

- `normpilot.evidence.mapped`
- `normpilot.gap.generated`
- `normpilot.corrective_action.drafted`
- `normpilot.mapping.reviewed`
- `normpilot.gap.reviewed`
- `normpilot.corrective_action.reviewed`
- `normpilot.evidence_pack.requested`
- `normpilot.evidence_pack.generated`
- `normpilot.evidence_pack.failed`

Weiter vorbereitet, aber in PR 3 nicht produktiv geschrieben:

- `normpilot.pipeline.started`
- `normpilot.pipeline.completed`
- `normpilot.pipeline.failed`
- `normpilot.evidence.extracted`

Audit-Metadata enthaelt nur IDs, Status, Counts, Format, Prompt-Versionen und
technische Fehlercodes. Kundentexte, Anchors, Dokumenttitel und
personenbezogene Owner-Labels werden nicht in Audit-Metadata geschrieben.

## Export

Markdown ist der primaere Export. CSV wird fuer Evidence Matrix und Gap-Liste
on demand erzeugt. PDF bleibt ausserhalb von PR 3.

Persistiert werden:

- `exportManifest`
- `promptMetadata`
- `reviewSnapshot`
- `contentHash`
- `generatedAt`
- `retentionUntil`

Der eigentliche Markdown-/CSV-Inhalt wird aus dem Manifest regeneriert und nicht
als lange Volltextkopie gespeichert.

## Compliance Impact

- EU AI Act: NormPilot bleibt `limited_risk`; alle KI-nahen Inhalte bleiben
  Entwuerfe mit Human Review.
- DSGVO: Datenminimierung durch kurze Anchors, Locator, Hashes und
  nicht-sensitive Audit-Metadata.
- GoBD: Review- und Export-Aktionen werden ueber hashverkettete AuditEvents
  protokolliert.
- Normlizenz: Keine Norm-Volltexte in Code, UI, Exporten, Tests oder Evals.

## Bekannte Grenzen

- Mock Sprint nutzt ausschliesslich synthetische, deterministische Outputs.
- Keine produktive LLM-Pipeline und keine Provider Calls.
- Keine PDF-Erzeugung.
- Keine tiefe externe Connector-Integration.
