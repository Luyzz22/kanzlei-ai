# NormPilot PR 1 Architecture Notes

Status: PR 1 Domain Foundation

## Ziel

PR 1 legt die additive Domain-Grundlage fuer den Audit Evidence Sprint. Der Scope umfasst Datenmodell, RLS, typisierte Validierung, synthetische Golden Cases und Dokumentation. Es wird keine produktive LLM-Pipeline, keine UI und keine ERP-/QMS-Schreibintegration gebaut.

## Wiederverwendete KanzleiAI-Patterns

- `Document` bleibt die primaere Datei- und Upload-Quelle. `NormPilotEvidenceSource` referenziert optional ein bestehendes Dokument.
- `AnalysisRun` inspiriert Status-, Prompt-, Provider-, Model-, Hash- und Retention-Felder, wird aber in PR 1 nicht fuer NormPilot erweitert.
- `AnalysisFinding` und `AnalysisFindingReview` liefern das Muster fuer Severity, Confidence, Quellenbezug und Human Review.
- `AuditEvent` bleibt der zentrale Audit-Trail. Spaetere Server-Actions sollen `writeAuditEventTx` innerhalb derselben Tenant-Transaktion verwenden.
- `withTenant` und `db/rls.sql` bleiben die technische Grundlage fuer Mandantentrennung.

## Neue Domain-Modelle

- `NormPilotRequirementSet`: kundeneigener Anforderungskatalog oder Checkliste.
- `NormPilotRequirementItem`: einzelne pruefbare Anforderung mit Kurzreferenz und optionalem Norm-Code.
- `NormPilotEvidenceSource`: Nachweisquelle aus Upload, Import oder synthetischem Intake.
- `NormPilotEvidenceMapping`: Mapping von Anforderung zu Evidence, inklusive Status, Confidence, Locator, kurzer Anchor und Review-State.
- `NormPilotGapFinding`: Gap aus fehlender, schwacher oder widerspruechlicher Evidence.
- `NormPilotCorrectiveAction`: Massnahmenentwurf mit `ownerRole` und `ownerLabel`, ohne personenbezogene Pflichtfelder.
- `NormPilotEvidencePackExport`: Export-Manifest fuer Markdown, CSV oder JSON.

## Review- und Statusmodell

Alle KI-nahen Ergebnisse starten als `UNGEPRUEFT` oder `NEEDS_REVIEW`. Fachliche Freigabe erfolgt spaeter durch Review-Aktionen. PR 1 stellt nur Enums, Schemas und Exportstruktur bereit.

## Exportstruktur

`src/lib/normpilot/export-structure.ts` definiert ein validiertes Evidence-Pack-Manifest. Es enthaelt:

- AI-Hinweis fuer EU AI Act limited_risk.
- Requirement Set und Requirements.
- Evidence Matrix mit Locator, Anchor und Review-State.
- Gap-Liste und Corrective Actions.
- Prompt-, Provider- und Model-Metadaten.
- Normlizenz-Hinweis ohne Volltextspeicherung.

## Grenzen

- Keine `NormPilotAnalysisRun`-Tabelle in PR 1.
- Keine produktive LLM-Pipeline.
- Keine UI-Grossumbauten.
- Keine langen Volltextkopien in Evidence-Mappings.
- Keine proprietaeren Norm-Volltexte in Code, Tests, Evals oder Doku.

## Migrationshinweis

Das Prisma-Schema wurde additiv erweitert. Vor Deployment ist eine Prisma-Migration aus dem finalen Schema zu erzeugen und gegen eine nicht-produktive Datenbank mit RLS zu pruefen.
