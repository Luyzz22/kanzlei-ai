# NormPilot Demo-Readiness Checklist

Status: PR 4 Pilot Hardening

## Setup

- Branch ist `feat/normpilot-pr4` oder ein daraus abgeleiteter Preview-Branch.
- Prisma Schema ist validiert.
- Prisma Client ist generiert.
- RLS-SQL enthaelt NormPilot-Policies fuer alle tenant-bound Tabellen.
- Demo laeuft im Mock-/Review-Modus.
- Keine produktiven LLM-Provider Keys sind fuer NormPilot erforderlich.

## Demo-Daten

- Daten sind synthetisch oder explizit kundenseitig freigegeben.
- Keine echten Kundengeheimnisse.
- Keine personenbezogenen Pflichtfelder.
- Keine E-Mail-Adressen, Namen oder Dokumenttitel mit Personenbezug, sofern nicht freigegeben.
- Keine proprietaeren Norm-Volltexte.
- Evidence-Mappings nutzen nur kurze Anchors, Locator und Hashes.

## Smoke vor Demo

Vor jeder Demo ausfuehren:

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm test
pnpm eval:normpilot
pnpm smoke:normpilot
```

Optional gegen eine lokale oder Preview-URL, wenn ein Server bewusst gestartet wurde:

```bash
BASE_URL=http://127.0.0.1:3000 node scripts/security-smoke-test.mjs
```

Der optionale URL-Smoke ist kein PR-4-CI-Gate, weil PR 4 keine externen Services voraussetzt.

## Demo-Flows

- Requirement Set anzeigen.
- Requirement Items zeigen.
- Evidence Sources zeigen.
- Evidence Matrix mit Review-State zeigen.
- Gap-Liste mit Severity zeigen.
- Corrective Actions als Entwurf zeigen.
- Evidence Pack Export Preview zeigen.
- KI-Hinweis und Normlizenz-Hinweis sichtbar machen.

## No-go-Pruefungen

Demo nicht starten, wenn:

- `pnpm smoke:normpilot` fehlschlaegt.
- NormPilot produktive Provider Calls enthaelt.
- AuditEvent-Metadata Kundentexte, Anchors, Dokumenttitel oder Owner-Labels enthaelt.
- Export-Hinweise fehlen.
- Demo-Daten Norm-Volltexte enthalten.
- Demo-Daten ausserhalb der Freigabe liegen.
- CI-Typecheck/Build-Blocker nicht dokumentiert oder nicht akzeptiert ist.

## Nachbereitung

- Demo-Daten und Retention-Entscheidung dokumentieren.
- Feedback nach Evidence Matrix, Gap Findings, Actions und Export trennen.
- Keine Screenshots oder Exporte mit echten Kundendaten ausserhalb der Freigabe teilen.
- Neue Produktwuensche in Folge-PRs planen, nicht in PR 4 nachziehen.
