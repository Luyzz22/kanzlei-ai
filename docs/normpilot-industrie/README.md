# NormPilot Industrie — Codex-Projektstart

Status: Kickoff, intern, 2026

NormPilot Industrie ist der KI-gestützte Audit-, Evidence- und Nachweis-Copilot für deutsche Industrie-KMU. Ziel ist ein checklist-driven MVP, das vorhandene Kundendokumente in eine Evidence Matrix, Gap-Liste, Maßnahmenexporte und ein Audit Evidence Pack überführt.

## Kernentscheidung

Build als fokussierter Audit Evidence Sprint. Kein ERP-Ersatz, kein vollständiges QMS/IMS, keine ISO-/DIN-/IATF-Volltexte hosten oder embedden.

## Product Wedge

Audit-Readiness aus Bestandsdaten in 2–6 Wochen:

- Upload/Intake: PDF, Word, Excel, Auditberichte, Checklisten, Prüfberichte, Zertifikate, Schulungsnachweise, QM-Dokumente.
- Strukturierte Extraktion: Dokumenttyp, Fundstelle, Metadaten, Nachweisqualität.
- Kundeneigene Anforderungen/Checklisten als Prüfgrundlage.
- Evidence Matrix: Anforderung → Evidence → Fundstelle → Status → Reviewer.
- Gap-Liste: critical/high/medium/low mit Begründung und Quellreferenz.
- Maßnahmenplan: Maßnahme, Verantwortlicher, Frist, Status, Review-Entscheidung.
- Audit Evidence Pack: exportierbare, quellengebundene Zusammenfassung.

## Bestehende Assets, die wiederverwendet werden

- KanzleiAI: Next.js 14, TypeScript, Prisma/Postgres, RLS, NextAuth, RAG-/Analyse-Pipeline, Prompt-Governance, Human Review, Eval-Framework.
- ComplianceHub: Rule Engine, Gap Analysis, AI-Act-Klassifikation, Audit/Trust Layer, hash-basierte Evidence-Pakete.
- BelegflowAI: OCR-/Dokumentenintake-Muster für PDF/XML/Excel-nahe Workflows.

## Compliance-Zielbild

NormPilot ist ein Audit-Copilot, kein autonomes Entscheidungssystem. Alle KI-Ausgaben sind Entwürfe und müssen vor Maßnahmenumsetzung durch einen Fachverantwortlichen geprüft werden.

Pflicht-Hinweis in UI, Exporten und API-Antworten mit KI-generierten Inhalten:

> ⚠️ KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Maßnahmenumsetzung durch Fachverantwortlichen prüfen.

## Regulatorische Leitplanken

- EU AI Act: limited_risk im Standardbetrieb; Human-in-the-Loop Pflicht; Transparenzkennzeichnung; keine autonomen Zertifizierungsentscheidungen.
- DSGVO: Datensparsamkeit, Zweckbindung, Speicherbegrenzung, Pseudonymisierung vor LLM-Transfer bei personenbezogenen Daten, AVV/TOMs/DSFA-Check je Mandant.
- GoBD/Audit Trail: Append-only Audit Events, SHA-256 Hash-Trail, Export mit Quellen und Prüfstatus.
- Normlizenz: Keine Volltexte proprietärer Normen hosten oder embedden. Nur kundeneigene Checklisten, vom Kunden bereitgestellte Anforderungskataloge, Kurzreferenzen und Metadaten verwenden. Bei unklarem Normtext: „Diesen Abschnitt bitte direkt in der Norm prüfen.“

## MVP-Scope

Must-have:

1. NormPilot Workstream im bestehenden Multi-Tenant-Modell.
2. Dokument-Upload/Import für Pilotdaten ohne produktive Schreibintegration in ERP/QMS.
3. Requirement-/Checklist-Modell mit Kundenanforderungen und Referenzcodes.
4. Evidence Matrix CRUD + KI-Vorschläge + Human Review.
5. Gap-Liste mit Severity, Quelle, Confidence, Review-Status.
6. Maßnahmenexport als Markdown/CSV/PDF-nahe Markdown-Vorlage.
7. Audit Evidence Pack Export.
8. Audit-Log für Upload, Analyse, Review, Export.
9. Prompt-Registry und evals für NormPilot.
10. RLS/tenantId in allen neuen Tabellen, APIs und Queries.

Should-have nach erstem Pilot:

- SharePoint/M365 Connector.
- Lieferantenzertifikate-Modul.
- 8D/CAPA-Modul.
- E-Rechnungs-/3-Way-Matching als separater zweiter Wedge.
- ISO 27001/NIS2 Evidence Templates.

Nicht bauen im MVP:

- Vollständiges QMS/IMS.
- Vollständiger Normtext-Viewer.
- Autonome Audit-Bewertung ohne Review.
- Tiefe ERP-/MES-/CAQ-Integration.
- Generischer Firmenchatbot.

## Codex-Startreihenfolge

1. Architektur und Datenmodell entwerfen.
2. Prisma-Migration für NormPilot-Entities erstellen.
3. RLS-Policies ergänzen.
4. Zod-Schemas und TypeScript-Typen erstellen.
5. Prompt-Registry für NormPilot Extraktion, Mapping, Gap-Analyse, Auditfragen erstellen.
6. Mock-Evals/Golden Set ohne Mandantendaten erstellen.
7. API-Routen mit Tenant Guards und Audit Events implementieren.
8. UI: NormPilot Dashboard, Upload, Evidence Matrix, Gap-Liste, Review-Queue, Export.
9. Security/Privacy Tests: tenant isolation, no PII logging, prompt-injection handling.
10. Build Gates: pnpm lint, pnpm typecheck, pnpm test, pnpm build.

## PR-Dokumentation

- `pr1-architecture-notes.md` — Domain Foundation, Datenmodell, RLS und Exportstruktur.
- `security-privacy-notes.md` — EU AI Act, DSGVO, GoBD, RLS und Normlizenz-Leitplanken.
- `pr2-pipeline-governance-notes.md` — Mock-Pipeline, Prompt-Governance, Policy Layer und AuditEvent-Katalog.

## Done-Kriterien für den ersten Codex-PR

- Neue NormPilot-Dokumentation unter `docs/normpilot-industrie/`.
- Keine Secrets, keine Kundendaten, keine Norm-Volltexte.
- Alle neuen Dateien referenzieren DSGVO/EU-AI-Act/GoBD-Leitplanken.
- Implementierungsplan ist in reviewbare Issues zerlegt.
