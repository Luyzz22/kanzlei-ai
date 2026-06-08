# NormPilot Security and Privacy Notes

Status: PR 4 Pilot Hardening

## EU AI Act

NormPilot bleibt im PR-1-Zielbild `limited_risk`. Das System assistiert bei Evidence-Mapping, Gap-Erkennung und Massnahmenentwurf, trifft aber keine autonome Audit- oder Zertifizierungsentscheidung.

Pflichthinweis fuer KI-nahe Inhalte:

> KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Massnahmenumsetzung durch Fachverantwortlichen pruefen.

## DSGVO und Datensparsamkeit

- Neue Tabellen enthalten `tenantId`, `createdAt`, `updatedAt`, `deletedAt` und `retentionUntil`, soweit fuer den Domain-Typ sinnvoll.
- Corrective Actions nutzen `ownerRole` und `ownerLabel`; personenbezogene Owner-Felder sind nicht verpflichtend.
- Evidence-Mappings speichern kurze `anchorText`-Werte mit maximal 280 Zeichen, Locator-JSON und Hashes statt langer Volltextkopien.
- Evidence Pack Retention soll vorhandenes `TenantGovernanceSettings.auditEvidenceRetentionDays` verwenden.
- Tests und Evals enthalten nur synthetische Daten.

## Pilot-Verarbeitungsbeschreibung

NormPilot verarbeitet im Pilot nur Daten, die fuer Audit-Evidence-Strukturierung erforderlich sind:

- Zwecke: Evidence-Mapping, Gap-Entwurf, Corrective-Action-Entwurf, Review-Unterstuetzung und Evidence-Pack-Export.
- Datenkategorien: Requirement-Metadaten, kurze kundeneigene Anforderungen, Evidence-Source-Metadaten, Locator, Hashes, kurze Anchors, Review-State, Rollenangaben und Prompt-Metadaten.
- Ausgeschlossene Daten: proprietaere Norm-Volltexte, echte Kundendaten ohne Freigabe, Geheimnisse in Logs, personenbezogene Audit-Metadata.
- Betroffene Personen: im Regelfall keine direkt betroffenen Personen; falls Pilotdaten Rollenlabels oder Dokumentmetadaten mit Personenbezug enthalten, muss die Freigabe vor Intake dokumentiert werden.
- Retention: Evidence Packs nutzen die vorhandene Audit-Evidence-Retention; Pilotdaten erhalten ein dokumentiertes Loesch- oder Review-Datum.

## DSFA-/AVV-Hinweise fuer Piloten

Vor einem Pilot mit kundenseitig freigegebenen Daten ist zu dokumentieren:

- Verantwortlichkeit und Rollen: Kunde als Verantwortlicher, KanzleiAI/ComplianceHub als Auftragsverarbeiter soweit vertraglich vereinbart.
- Verarbeitungskontext: begrenzter 14-Tage-Pilot, klar benannter Tenant, keine Cross-Tenant-Nutzung.
- Datenfreigabe: Datenliste, Datenklassifikation, Pseudonymisierungsstatus und Ausschluss von Norm-Volltexten.
- TOMs: Tenant-Isolation, RLS, rollenbasierte Server-Guards, metadata-minimaler Audit-Trail, keine PII in Logs oder Audit-Metadata, Smoke-Checks vor Demo.
- Drittlandtransfer: PR 4 enthaelt keine produktiven LLM-Provider Calls. Spaetere Provider-Nutzung darf erst nach Governance-, AVV-/DPA- und Transferpruefung aktiviert werden.
- Pseudonymisierung: fuer Pilotdaten voreingestellt empfohlen; echte Namen, E-Mail-Adressen oder Kundengeheimnisse nur mit ausdruecklicher Freigabe.

## Audit-Metadata-Minimierung

NormPilot-AuditEvents duerfen nur technische und pruefbare Strukturinformationen enthalten:

- Erlaubt: IDs, Counts, Status, Review-State, Severity, Format, Prompt-Key/-Version, Content-Hash und Error-Code.
- Verboten: Kundentexte, Anchors, Dokumenttitel, personenbezogene Owner-Labels, lange Beschreibungen, Empfehlungen, Evidence-Auszuge und Norm-Volltexte.
- PR 4 fuehrt dafuer eine zentrale Allowlist-Hilfe und einen Offline-Smoke ein.

## RLS und Tenant Isolation

Alle neuen tenant-bound Tabellen sind in `db/rls.sql` mit Policies nach bestehendem KanzleiAI-Muster abgesichert:

```sql
USING ("tenantId" = current_tenant_id())
WITH CHECK ("tenantId" = current_tenant_id())
```

Spaetere Server-Funktionen muessen weiterhin `withTenant(tenantId, ...)` nutzen und Mandantenmitgliedschaft pruefen.

## GoBD Audit Trail

Audit-relevante Aktionen sollen spaeter ueber `AuditEvent` geschrieben werden:

- Requirement Set erstellt oder geaendert.
- Evidence Mapping erzeugt oder reviewed.
- Gap Finding erzeugt oder reviewed.
- Corrective Action reviewed.
- Evidence Pack Export angefordert, erzeugt oder fehlgeschlagen.
- Soft-Delete oder Retention-Ablauf.

Exports sollen Quellen, Locator, Review-State, Prompt-Version, Provider/Model und Zeitstempel enthalten.

## Normlizenz-Grenzen

- Keine proprietaeren Norm-Volltexte hosten, embedden, seeden oder testen.
- Erlaubt sind kundeneigene Checklisten, Kurzreferenzen, Kapitelcodes, Locator und Metadaten.
- Bei fehlender kundenseitiger Grundlage gilt: `Diesen Abschnitt bitte direkt in der Norm pruefen.`

## Prompt-Injection-Abwehr

Die synthetischen Evals enthalten einen Prompt-Injection-Fall. Dokumentinhalte sind immer Daten und duerfen System-, Governance- oder Normlizenz-Regeln nicht ueberschreiben.
