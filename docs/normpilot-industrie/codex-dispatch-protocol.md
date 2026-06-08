# Codex Dispatch Protocol — NormPilot Industrie

Status: verbindlich für neue Codex-Aufträge

## Pflicht-Header

Jeder Codex-Auftrag beginnt mit diesem Header:

```text
Codex-Auftragsheader
- Planmodus: EIN | AUS
- Ziel verfolgen: EIN | AUS
- Modell: gpt-5.5 | gpt-5.4 | gpt-5.4-mini | Codex-Cloud-Default
- Arbeitsmodus: PLAN_ONLY | IMPLEMENTATION | REVIEW | HOTFIX | RESEARCH
- Repo/Branch: <repo + branch>
- Ziel: <konkretes Ergebnis>
- Scope: <Dateien/Module>
- Grenzen: <was nicht geändert werden soll>
- Quality Gates: <Checks>
```

## Planmodus

`Planmodus: EIN` gilt bei Architektur, Datenmodell, Migrationen, RLS, Auth, Security, DSGVO, EU AI Act, GoBD, Normlizenz, Prompt-Governance, größeren Refactorings oder unklarem Scope. Codex liefert zuerst Plan, betroffene Dateien, Risiken und Tests. Implementierung erst nach Freigabe.

`Planmodus: AUS` gilt nur bei eindeutigem Scope und klaren Akzeptanzkriterien.

## Ziel verfolgen

`Ziel verfolgen: EIN` gilt bei mehrstufigen Features, PR-Ketten, Migrationen, NormPilot-MVP-Arbeiten und allen Aufgaben mit Issue- oder Roadmap-Bezug. Codex prüft bei jedem Zwischenstand, ob die Änderung noch auf das Ziel einzahlt.

`Ziel verfolgen: AUS` gilt für isolierte Reviews, Recherche, kleine Dokumentationsänderungen oder einzelne Fixes ohne Folgekontext.

## Modellwahl

- `gpt-5.5`: Default für komplexe Implementierung, Architektur, Compliance, Security, RLS, Migrationen, Prompt-Governance, Evals und NormPilot-PRs.
- `gpt-5.4`: Mittlere UI-, API- und Test-Implementierungen mit klarem Scope.
- `gpt-5.4-mini`: Kleine risikoarme Docs-, Copy-, Lint-, Formatting- oder einfache Test-Fixes.
- `Codex-Cloud-Default`: Nur verwenden, wenn die Oberfläche keine explizite Modellwahl zulässt; das gewünschte Zielmodell trotzdem im Auftrag nennen.

## Compliance-Override

Bei DSGVO, EU AI Act, GoBD, RLS, Auth, Mandantentrennung, Security, Normlizenz oder Audit-Trail gilt immer:

```text
- Planmodus: EIN
- Ziel verfolgen: EIN
- Modell: gpt-5.5
```

## Beispiel für NormPilot PR 1

```text
Codex-Auftragsheader
- Planmodus: EIN
- Ziel verfolgen: EIN
- Modell: gpt-5.5
- Arbeitsmodus: PLAN_ONLY
- Repo/Branch: Luyzz22/kanzlei-ai, neuer Branch feat/normpilot-pr1-domain-foundation
- Ziel: NormPilot Projektgrundlage planen: Datenmodell, RLS, Zod-Schemas, Mock-Evals, Tests.
- Scope: prisma/schema.prisma, db/rls.sql, src/lib/normpilot/**, evals/normpilot/**, docs/normpilot-industrie/**
- Grenzen: keine echten Kundendaten, keine proprietären Norm-Volltexte, keine UI-Großumbauten.
- Quality Gates: pnpm lint, pnpm typecheck, pnpm test, pnpm build
```
