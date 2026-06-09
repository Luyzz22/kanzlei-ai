# NormPilot Industrie — Enterprise Repository Setup

Klassifikation: INTERN  
Repository: `Luyzz22/normpilot-industrie`  
Produkt: NormPilot Industrie  
Status: Standalone-Initialisierung

## Ziel

Dieses Dokument beschreibt den Zielzustand fuer das eigenstaendige NormPilot-Industrie-Repository.

NormPilot wird als separates Enterprise-SaaS-Produkt betrieben, getrennt von KanzleiAI:

- eigenes GitHub Repository
- eigenes Vercel Project
- eigene Neon Production DB in EU Central / Frankfurt
- eigene Domain `normpilot-industrie.de`
- eigene Auth-/Environment-Konfiguration
- eigene Legal-/DSGVO-/AVV-Pruefung

## Zielbild

```text
GitHub Repo:     Luyzz22/normpilot-industrie
Vercel Project:  normpilot-industrie
Production App:  https://app.normpilot-industrie.de
Marketing/Web:   https://www.normpilot-industrie.de
Apex Redirect:   https://normpilot-industrie.de -> https://www.normpilot-industrie.de
Database:        Neon PostgreSQL, EU Central / Frankfurt
```

## Branch- und PR-Governance

Empfohlene Settings:

```text
Default branch: main
Issues: ON
Pull Requests: ON
Wiki: OFF
Discussions: OFF
Automatically delete head branches: ON
Allow merge commits: ON
Allow squash merge: ON
Allow rebase merge: OFF
```

Branch Protection fuer `main`:

```text
Require a pull request before merging
Require approvals: 1
Dismiss stale approvals when new commits are pushed
Require status checks to pass before merging
Require branches to be up to date before merging
Do not allow bypassing the above settings
```

Status Checks, sobald im Repo verfuegbar:

```text
CI / ci
Security Gates / CodeQL Analysis
Security Gates / Dependency Vulnerability Audit
Security Gates / Gitleaks Secret Scan
Security Gates / Semgrep SAST
Vercel
```

## Repository Visibility

Dieses Repository muss `private` bleiben.

Grund:

- interne Enterprise-SaaS-Architektur
- Compliance- und Audit-Governance-Dokumentation
- Go-to-Market- und Pricing-nahe Artefakte
- abgeleitete Produktstrategie aus KanzleiAI/ComplianceHub/BelegflowAI

Keine Kundendaten, personenbezogenen Daten, Zugangsdaten oder Norm-Volltexte duerfen im Repo gespeichert werden.

## GitHub Actions Secrets

Erlaubt:

```text
NEON_API_KEY
NEON_PROJECT_ID
```

Nur wenn fuer CI erforderlich:

```text
NEXTAUTH_SECRET=dummy-for-ci-only
SCIM_BEARER_TOKENS=dummy
```

Nicht fuer v0.1 setzen, solange keine explizite Freigabe vorliegt:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
LLAMA_API_KEY
```

## Neon GitHub Integration

Die Neon-Integration darf PR-Branches erzeugen, solange:

- Branches nur synthetische oder leere Testdaten enthalten
- keine produktiven Kundendaten in Preview-Branches repliziert werden
- Secrets nicht in Logs erscheinen
- Pull-Request-Branches nach Close geloescht werden

## Mindest-Dokumente im Repo

- `README.md` — Produktuebersicht und Setup
- `AGENTS.md` — verbindliche Agent-/Codex-Regeln
- `.github/pull_request_template.md` — PR-Governance
- `docs/normpilot-industrie/repo-setup.md` — dieses Dokument
- `docs/normpilot-industrie/vercel-neon-production.md` — Production Setup
- `docs/normpilot-industrie/standalone-cleanup-plan.md` — Trennungsplan von KanzleiAI
- `docs/normpilot-industrie/security-governance.md` — Security, Privacy, Audit Trail

## Initiale Meilensteine

1. Repo private verifizieren.
2. `main` schuetzen.
3. Vercel Project auf neues Repo verbinden.
4. Neon Frankfurt Production DB anbinden.
5. Domain-Records finalisieren.
6. KanzleiAI-Alttexte und Branding inventarisieren.
7. Cleanup-PRs klein und reviewbar umsetzen.
8. Pilot v0.1 Go/No-Go ausfuehren.

## No-Go

Nicht ohne explizite Freigabe:

- Public Repository
- echte Kundendaten in Seeds, Tests oder Logs
- Norm-Volltexte
- produktive LLM-Provider Keys
- DNS-Umschaltungen mit Auswirkung auf KanzleiAI
- destruktive DB-Migrationen
