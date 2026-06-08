# NormPilot PR 4 Pilot Hardening Notes

Status: PR 4

## Zweck

PR 4 haertet die nach PR 1-3 vorhandene NormPilot-Basis fuer Pilot und Demo. Der Fokus liegt auf Security Smoke, Audit-Metadata-Minimierung, Export-/Normlizenz-Kontrollen und operativer Readiness.

Keine neuen Produktfeatures werden eingefuehrt.

## Technische Aenderungen

- Zentrale Audit-Metadata-Allowlist unter `src/lib/normpilot/audit-metadata.ts`.
- NormPilot-Audit-Writes verwenden die Allowlist.
- Offline-Smoke-Script `scripts/normpilot-smoke-check.mjs`.
- Package Script `pnpm smoke:normpilot`.
- CI-Step fuer NormPilot Smoke ohne DB, Netzwerk oder externe Services.
- Pilot-Hardening-Tests unter den bestehenden NormPilot-Tests.

## Smoke-Abdeckung

Der NormPilot-Smoke prueft:

- RLS-Policies fuer alle NormPilot tenant-bound Tabellen.
- `withTenant` und explizite `tenantId`-Filter in Server-Core-Dateien.
- keine `findUnique(id)`-Only-Patterns in NormPilot-Core-Dateien.
- Audit-Metadata-Allowlist statt Inline-Metadata.
- KI- und Normlizenz-Hinweise in Export und Dashboard.
- keine produktiven Provider Calls im NormPilot-Code.
- keine offensichtlichen Norm-Volltext-Fixtures in NormPilot Docs/Evals.

## Audit-Metadata-Vertrag

Erlaubt:

- IDs
- Counts
- Status
- Review-State
- Severity
- Format
- Prompt-Key und Prompt-Version
- Content-Hash
- Error-Code

Verboten:

- Kundentexte
- Anchors
- Dokumenttitel
- personenbezogene Owner-Labels
- lange Beschreibungen
- Empfehlungen
- Evidence-Auszuge
- Norm-Volltexte

## Compliance Impact

EU AI Act:

- NormPilot bleibt `limited_risk`.
- KI-Hinweis ist in Export und Dashboard sichtbar.
- Human Review bleibt Pflicht.

DSGVO:

- Audit-Metadata ist minimiert.
- Pilotdaten muessen synthetisch oder freigegeben sein.
- Drittlandtransfer ist in PR 4 nicht aktiv, weil keine produktiven Provider Calls erfolgen.

GoBD:

- AuditEvent-Schreibpfade bleiben vorhanden.
- Metadata bleibt pruefbar, aber textarm.
- Content-Hash und Review-Snapshot bleiben fuer Evidence-Pack-Exports erhalten.

Normlizenz:

- Keine proprietaeren Norm-Volltexte in Docs, Evals, Export oder Smoke-Fixtures.
- Bei unklarer Normgrundlage bleibt der Hinweis auf direkte Normpruefung erhalten.

## Bekannte Grenzen

- PR 4 fuehrt keinen verpflichtenden DB-Integration-Smoke ein.
- PR 4 fuehrt keine neue Prisma-Migration ein.
- PR 4 aktiviert keine produktive LLM-Pipeline.
- Bestehende Nicht-NormPilot Typecheck-/Build-Blocker muessen separat bewertet werden, falls sie in CI noch auftreten.
