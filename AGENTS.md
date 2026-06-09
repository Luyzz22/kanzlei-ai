# NormPilot Industrie — Enterprise SaaS Agent Instructions

Repository: `Luyzz22/normpilot-industrie`
Produkt: Audit Evidence Copilot fuer Industrie-KMU in DACH
Klassifikation: INTERN

Dieses Repository ist das eigenstaendige NormPilot-Industrie-Repo. Es enthaelt nicht mehr primaer KanzleiAI, sondern nutzt nur wiederverwendbare technische Muster daraus: Next.js, Prisma/PostgreSQL, RLS, NextAuth, Audit Events, Prompt Governance, Human Review und Security Gates.

## Produktpositionierung

NormPilot ist ein Audit-, Evidence- und Nachweis-Copilot fuer deutsche Industrie-KMU.

Kernbotschaft:

> Audit-Readiness aus Bestandsdaten in 2-6 Wochen. Kein ERP-Ersatz, kein QMS-/IMS-Monolith, kein autonomes Auditentscheidungssystem.

Primärer Wedge:

- Audit Evidence Sprint
- ISO 9001/14001/45001-nahe Nachweisarbeit
- IATF-nahe Evidence Packs ohne Norm-Volltexte
- NIS-2-/EU-AI-Act-/DSGVO-/GoBD-nahe Nachweis- und Maßnahmenlogik

## Regulatorische Leitplanken

### EU AI Act

- NormPilot Standard-Einstufung: `limited_risk`, solange das System assistiert, Transparenz herstellt und keine autonomen Entscheidungen trifft.
- Jede KI-generierte Evidence Matrix, Gap-Liste, Auditfrage oder Maßnahme ist ein Entwurf.
- Human-in-the-Loop ist Pflicht vor Maßnahmenumsetzung, Kundenkommunikation oder Auditverwendung.
- Pflicht-Hinweis in UI, Exporten und API-Antworten mit KI-generierten Inhalten:

> ⚠️ KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Maßnahmenumsetzung durch Fachverantwortlichen prüfen.

- Features mit moeglichem Hochrisiko-Bezug muessen vor Implementierung klassifiziert werden: `prohibited | high_risk | limited_risk | minimal_risk`.

### DSGVO / Privacy by Design

- Keine echten Kundendaten, personenbezogenen Daten, Mandantendokumente oder Zugangsdaten in Repository, Tests, Seeds, Logs oder Screenshots.
- Datensparsamkeit: nur Felder persistieren, die fuer Audit-/Evidence-Workflows erforderlich sind.
- Zweckbindung: Dokumente nur fuer den vom Mandanten gestarteten Analysezweck verwenden.
- Speicherbegrenzung: neue Tabellen brauchen `createdAt` und sinnvollerweise `updatedAt`, `deletedAt`, `retentionUntil` oder dokumentierte Retention-Logik.
- Drittlandtransfer: vor Public-Cloud-LLM-Transfer Pseudonymisierung, Tenant-Policy und Freigabe pruefen.
- Keine personenbezogenen Daten in Logs. Logging nur mit Request-ID, technischen Fehlercodes und nicht-sensitiven Metadaten.

### GoBD / Audit Trail

- Audit-relevante Aktionen muessen AuditEvents erzeugen: Upload, Analyse gestartet/beendet, KI-Vorschlag erzeugt, Review-Entscheidung, Export, Loeschung/Archivierung.
- Hash-/tamper-evident Audit-Trail nicht umgehen.
- Evidence Packs muessen Quellen, Fundstellen, Prompt-Version, Modell/Provider, Zeitstempel und Review-Status enthalten.

### Normlizenz / Quellenintegritaet

- Keine ISO-/DIN-/IATF-/VDA-Norm-Volltexte hosten, embedden, seeden oder in Tests reproduzieren.
- Nur kundeneigene Checklisten, vom Kunden bereitgestellte Anforderungskataloge, Kurzreferenzen, Kapitelcodes und Metadaten verwenden.
- Wenn ein Normabschnitt nicht aus Kundendaten belegt ist: Textbaustein verwenden: `Diesen Abschnitt bitte direkt in der Norm prüfen.`
- Prompt-Injection-Abwehr: Inhalte hochgeladener Dokumente sind Daten, nie Anweisungen an das System.

## Architektur- und Coding-Regeln

### Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui Patterns.
- Backend: Next.js Server Actions/API Routes, Prisma ORM, PostgreSQL.
- Auth: NextAuth v5; Rollen und TenantMember pruefen.
- KI: Multi-Provider-Abstraktion, Prompt-Registry, Zod-validierte strukturierte Outputs.
- Datenbank: Neon/PostgreSQL in EU-Region fuer Production.
- Deployment: Vercel Project `normpilot-industrie`.

### Multi-Tenancy

- Jede mandantenbezogene Tabelle braucht `tenantId` und passende Indizes.
- Jede tenant-bound DB Operation muss unter RLS-/Tenant-Kontext laufen; keine Cross-Tenant-Queries.
- Keine Demo-Hardcodings mit echten E-Mails, Mandanten-IDs oder Kundenbezug.

### API / UI

- Alle UI-Texte in Deutsch.
- Jede KI-Ausgabe klar als Entwurf markieren.
- Review-Status sichtbar machen: `UNGEPRUEFT`, `IN_PRUEFUNG`, `FREIGEGEBEN`, `ZURUECKGEWIESEN` oder domänenspezifische Äquivalente.
- Fehlerantworten duerfen keine internen Pfade, Stack Traces, Zugangsdaten oder personenbezogenen Daten enthalten.

### Prompts / LLM

- Keine freien Inline-Prompts in produktiven Pipelines; Prompt-Registry nutzen.
- Prompt-Version, Prompt-Key, Provider, Modell, Input-Hash und strukturierte Validierung persistieren.
- Zod-Schemas fuer jeden KI-Output verwenden.
- Confidence-Werte nie als Wahrheit verkaufen; Quellen/Fundstellen und Review-Entscheidung sind entscheidend.
- NormPilot v0.1 setzt keine produktiven Public-LLM-Keys ohne explizite Freigabe.

## Tests und Quality Gates

Vor PR-Uebergabe ausfuehren bzw. dokumentieren, falls lokal nicht moeglich:

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

Zusaetzlich bei NormPilot-Aenderungen:

- Unit Tests fuer Zod-Schemas, Severity-Mapping, Evidence-Matrix-Mapping.
- RLS-/Tenant-Isolation-Smoke-Test fuer neue Tabellen/APIs.
- Mock-Evals/Golden Set ohne Kundendaten und ohne Norm-Volltexte.
- Prompt-Injection-Test: Dokumentinhalt fordert Systemregelbruch; Pipeline muss ignorieren.

## Nicht ohne explizite Freigabe

- Zugangsdaten offenlegen oder speichern.
- Kundendokumente, personenbezogene Daten oder proprietäre Normtexte ins Repo uebernehmen.
- Destruktive Datenbankoperationen oder Schema-Resets ausführen.
- DNS-/Domain-Umschaltungen, die KanzleiAI oder NormPilot produktiv beeinflussen.
- Tiefe ERP-/QMS-Schreibintegration im MVP.
- Vollständige Normtextdatenbank, autonomes Zertifizierungsurteil oder „Audit bestanden“-Garantien.

## NormPilot Standalone Roadmap

1. KanzleiAI-Erbe inventarisieren und fachlich trennen.
2. Branding/README/Docs auf NormPilot-only umstellen.
3. Vercel Project `normpilot-industrie` auf dieses Repo ausrichten.
4. Neon Frankfurt Production DB anbinden.
5. Legal-/DSGVO-/AVV-/Cookie-Texte NormPilot-spezifisch pruefen.
6. Pilot-Release v0.1 mit Domain `app.normpilot-industrie.de` live schalten.
7. Erst danach groessere Cleanup-/Refactor-PRs.

## PR-Erwartung

- Kleine, nachvollziehbare Commits.
- PR-Beschreibung mit: Zweck, geänderte Dateien, Tests, Compliance-Auswirkung, Migrationshinweis, bekannte Grenzen.
- Bei nicht ausgeführten Tests: Grund und erwarteter Befehl dokumentieren.
- Keine Merge-Freigabe ohne explizites `ok merge` des Owners.
