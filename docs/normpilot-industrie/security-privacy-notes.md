# NormPilot Security and Privacy Notes

Status: PR 1 Domain Foundation

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
