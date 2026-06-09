# NormPilot Industrie — Standalone Cleanup Plan

Klassifikation: INTERN  
Repository: `Luyzz22/normpilot-industrie`

## Ziel

Das Repository wurde aus `Luyzz22/kanzlei-ai` abgeleitet. Dieser Plan trennt NormPilot kontrolliert von KanzleiAI, ohne funktionierende Enterprise-Basis, CI, RLS, Auth oder Audit-Trail zu zerstoeren.

## Grundsatz

Nicht alles sofort loeschen.

Zuerst:

1. Deploybarkeit sichern.
2. NormPilot-Domain, DB und Auth stabilisieren.
3. KanzleiAI-Erbe inventarisieren.
4. Kleine Cleanup-PRs mit Tests.
5. Legal-/Branding-Texte separat pruefen.

## Behalten

Diese Bereiche sind fuer NormPilot relevant:

```text
src/lib/normpilot/**
src/app/dashboard/normpilot/**
docs/normpilot-industrie/**
prisma/**
db/rls.sql
src/lib/auth/**
src/lib/audit/**
src/lib/tenant/**
src/lib/ai/prompt-registry/**
evals/normpilot/**
scripts/normpilot-smoke-check.mjs
.github/workflows/**
```

## Pruefen und spaeter trennen

```text
kanzlei-spezifische Landingpages
kanzlei-spezifische Vertragsanalyse-UI
juristische Beispieltexte
KanzleiAI Branding
KanzleiAI Domain-Referenzen
KanzleiAI-spezifische OAuth-/SSO-Dokumentation
```

## Nicht entfernen, bevor Ersatz vorhanden ist

```text
Auth / NextAuth
TenantMember / RBAC
AuditEvent
Prisma Schema
RLS SQL
Security Workflows
CI Workflows
Legal Pages /datenschutz /impressum /avv
Cookie Consent
```

## Cleanup-PR Sequenz

### PR 1 — Standalone Repo Setup

- README NormPilot-only
- AGENTS NormPilot-only
- Repo-/Vercel-/Neon-Doku
- PR Template
- Issues fuer Folgearbeiten

Keine Code-Entfernung.

### PR 2 — Branding Inventory

- KanzleiAI-Strings suchen
- Domain-Referenzen listen
- Legal-Seiten markieren
- keine grossen Loeschungen

### PR 3 — Landing & Navigation Split

- NormPilot Landing/Startseiten-Texte
- Navigation auf NormPilot fokussieren
- KanzleiAI-Texte entfernen oder isolieren

### PR 4 — Feature Isolation

- KanzleiAI-spezifische Vertragsanalyse nur entfernen, wenn nicht mehr referenziert
- Shared Utilities behalten
- Tests aktualisieren

### PR 5 — Legal & Compliance Finalization

- Impressum / Datenschutz / AVV NormPilot-spezifisch pruefen
- KI-Transparenzhinweis sichtbar machen
- Cookie-/Tracking-Status pruefen

## Suchbefehle fuer Inventory

```bash
grep -Rni "KanzleiAI\|kanzlei-ai\|kanzlei" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git

grep -Rni "kanzlei-ai.com\|normpilot-industrie.de" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git
```

## Quality Gates je Cleanup-PR

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:normpilot
pnpm smoke:normpilot
pnpm build
git diff --check
```

## No-Go

- keine Secrets in Commits
- keine echten Kundendaten
- keine Norm-Volltexte
- keine destruktiven DB-Resets
- keine Entfernung von Auth/RLS/Audit ohne Ersatz
- keine Domain-Aenderungen ohne Owner-Freigabe
