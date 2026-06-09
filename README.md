# NormPilot Industrie

Audit Evidence Copilot fuer deutsche Industrie-KMU.

NormPilot organisiert Audit-Readiness aus Bestandsdaten: PDFs, Excel-Listen, Auditberichte, Checklisten, Pruefberichte, Zertifikate, Schulungsnachweise und QM-Dokumente werden in strukturierte Evidence Matrices, Gap-Listen, Maßnahmenplaene und exportierbare Evidence Packs ueberfuehrt.

> Kein ERP-Ersatz. Kein QMS-/IMS-Monolith. Kein autonomes Audit- oder Zertifizierungsentscheidungssystem.

## Status

- Repository: `Luyzz22/normpilot-industrie`
- Produkt: NormPilot Industrie
- Zielgruppe: Industrie-KMU in DACH
- Deployment-Ziel: Vercel Project `normpilot-industrie`
- Production Domain: `app.normpilot-industrie.de`
- Datenbank-Ziel: Neon PostgreSQL in EU Central / Frankfurt
- EU AI Act Einstufung: `limited_risk`
- Klassifikation: INTERN

## Kernversprechen

Audit-Readiness aus Bestandsdaten in 2-6 Wochen.

NormPilot fokussiert auf dokumenten- und compliance-nahe Prozesse:

- ISO 9001/14001/45001-nahe Nachweisarbeit
- IATF-nahe Evidence Packs ohne Norm-Volltexte
- NIS-2-/EU-AI-Act-/DSGVO-/GoBD-nahe Nachweis- und Maßnahmenlogik
- Auditfragen-Simulation fuer externe Audits
- Human-in-the-Loop Review vor Freigabe

## MVP v0.1 Scope

Enthalten:

- Requirement Sets und Requirement Items
- Evidence Sources
- Evidence Mapping
- Gap Findings mit Severity
- Corrective Actions
- Human Review States
- Markdown-/CSV-Export fuer Evidence Packs
- AuditEvent-Logging und textarme Audit-Metadaten
- Offline Smoke Tests fuer Tenant-Isolation, Provider-Call-Schutz und Normlizenz-Grenzen

Nicht enthalten:

- produktive Public-LLM-Provider Calls ohne Freigabe
- ISO-/DIN-/IATF-/VDA-Norm-Volltexte
- ERP-/QMS-Schreibintegration
- automatisches Zertifizierungsurteil
- Garantie „Audit bestanden“

## Compliance-Leitplanken

### EU AI Act

NormPilot arbeitet als Assistenzsystem. KI-Ausgaben sind Entwuerfe und muessen durch Fachverantwortliche geprueft werden.

Pflichthinweis fuer KI-generierte Inhalte:

> ⚠️ KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Maßnahmenumsetzung durch Fachverantwortlichen prüfen.

### DSGVO

- Datensparsamkeit
- Zweckbindung
- Privacy by Design und by Default
- keine personenbezogenen Daten in Logs, Tests, Seeds oder Screenshots
- Pseudonymisierung vor Drittland-LLM-Transfer pruefen
- echte Kundendaten nur in freigegebenen, geschuetzten Environments

### GoBD / Audit Trail

- Audit-relevante Aktionen werden protokolliert
- Hash-/tamper-evident Audit-Trail bleibt erhalten
- Evidence Packs enthalten Quellen, Fundstellen, Prompt-Version, Modell/Provider, Zeitstempel und Review-Status

### Normlizenz

- Keine Norm-Volltexte im Repository
- Nur kundeneigene Anforderungen, Checklisten, Kapitelcodes, Metadaten und Kurzreferenzen verwenden
- Bei unbekanntem Normtext: `Diesen Abschnitt bitte direkt in der Norm prüfen.`

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS / shadcn/ui Patterns
- Prisma ORM
- PostgreSQL / Neon
- NextAuth v5
- RLS / Tenant-Isolation
- Audit Events
- Prompt Registry
- Zod-validierte strukturierte Outputs
- GitHub Actions CI / Security Gates
- Vercel Deployment

## Lokale Entwicklung

```bash
pnpm install --frozen-lockfile
pnpm prisma:validate
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:normpilot
pnpm smoke:normpilot
pnpm build
```

## Environment Variables

Production-Ziel fuer Vercel `normpilot-industrie`:

```text
NEXTAUTH_URL=https://app.normpilot-industrie.de
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET=<secret>
DATABASE_URL=<neon-pooled-url>
DIRECT_URL=<neon-direct-url>
DATABASE_URL_PSQL=<neon-psql-direct-url>
```

Nicht fuer v0.1 setzen, solange keine explizite Freigabe vorliegt:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
LLAMA_API_KEY
```

## Repository Governance

- `main` ist protected.
- Aenderungen erfolgen ueber PRs.
- Kein Merge ohne explizites `ok merge` des Owners.
- Keine Secrets, Kundendaten oder Norm-Volltexte committen.
- PRs muessen Tests, Compliance Impact, Migrationshinweis und bekannte Grenzen dokumentieren.

## Relevante Dokumentation

- `AGENTS.md` — verbindliche Agent-/Codex-Regeln
- `docs/normpilot-industrie/repo-setup.md` — Enterprise Repo Setup
- `docs/normpilot-industrie/vercel-neon-production.md` — Vercel/Neon Production Setup
- `docs/normpilot-industrie/standalone-cleanup-plan.md` — KanzleiAI-to-NormPilot Cleanup Plan
- `docs/normpilot-industrie/security-governance.md` — Security, Datenschutz und Audit-Trail-Governance

## Produktpositionierung

NormPilot wird verkauft als:

> Audit Evidence Sprint fuer Industrie-KMU: In 14 Tagen von verstreuten Bestandsdokumenten zu einer reviewbaren Evidence Matrix, Gap-Liste und Maßnahmenplanung.

Nicht verkaufen als:

- generische KI-Plattform
- ERP-Ersatz
- QMS-/IMS-Komplettsystem
- autonomer Auditor
