# NormPilot Industrie — Security, Privacy & Audit Governance

Klassifikation: INTERN  
Produkt: NormPilot Industrie

## Ziel

NormPilot muss fuer Industrie-KMU in DACH auditierbar, mandantenfaehig und privacy-by-design betrieben werden.

Dieses Dokument definiert die Mindestanforderungen fuer Security, DSGVO, EU AI Act und GoBD-nahe Nachvollziehbarkeit.

## Sicherheitsprinzipien

- Mandantentrennung by default
- Least privilege fuer Benutzer, Services und Tokens
- keine Secrets im Repository
- keine echten Kundendaten in Tests, Seeds oder Screenshots
- keine personenbezogenen Daten in Logs
- EU-Region fuer Production-Datenbank
- Human-in-the-Loop fuer KI-Ausgaben
- AuditEvent fuer relevante Systemaktionen

## Mandantentrennung

Jede mandantenbezogene Tabelle braucht:

```text
tenantId
createdAt
updatedAt oder dokumentierte Alternative
retentionUntil/deletedAt oder dokumentierte Retention-Logik, wenn personenbezogene oder auditrelevante Daten betroffen sind
```

Jede tenant-bound Operation muss Tenant-Kontext pruefen.

Cross-Tenant-Queries sind verboten, außer fuer explizit freigegebene Admin-/Systemberichte mit dokumentierter Zugriffskontrolle.

## Audit Events

AuditEvent ist Pflicht fuer:

```text
Dokument hochgeladen
Analyse gestartet
Analyse beendet
KI-Vorschlag erzeugt
Finding reviewed
Finding freigegeben
Finding zurueckgewiesen
Evidence Pack exportiert
Dokument geloescht oder archiviert
Tenant-/User-/Rollen-Aenderung
```

Audit-Metadata bleibt textarm:

- IDs
- Counts
- Status
- Severity
- Review State
- technische Error Codes
- Prompt-Version
- Model-/Provider-Metadaten
- Content Hash

Keine Kundentexte, Dokumenttitel, Freitextauszuege oder personenbezogene Owner-Labels in Audit-Metadata.

## EU AI Act

NormPilot Standard-Einstufung: `limited_risk`.

Bedingungen:

- System assistiert nur
- keine autonome Zertifizierungs-/Auditentscheidung
- KI-Ausgaben sind Entwuerfe
- Human Review vor Umsetzung
- Transparenzhinweis sichtbar

Pflicht-Hinweis:

> ⚠️ KI-generiert (NormPilot, limited_risk, EU AI Act). Vor Maßnahmenumsetzung durch Fachverantwortlichen prüfen.

Bei neuen Features muss klassifiziert werden:

```text
prohibited
high_risk
limited_risk
minimal_risk
```

High-Risk-nahe Features benoetigen:

- DPIA/DSFA-Pruefung
- Human Approval Gate
- vollstaendiges Audit Log
- dokumentierte Risikobewertung

## DSGVO

Pflichtprinzipien:

- Rechtmaessigkeit
- Zweckbindung
- Datensparsamkeit
- Richtigkeit
- Speicherbegrenzung
- Integritaet und Vertraulichkeit
- Rechenschaftspflicht

Technische Anforderungen:

- keine sensiblen personenbezogenen Daten ohne explizite Freigabe
- Pseudonymisierung vor Drittlandtransfer pruefen
- Drittlandtransfer nur gemaess Tenant Policy
- AVV/TOMs dokumentieren
- DSFA pruefen bei Gesundheitsdaten, biometrischen Daten oder hohem Risiko

## GoBD-nahe Nachvollziehbarkeit

NormPilot ersetzt keine Finanzbuchhaltung. Trotzdem gelten fuer Evidence Packs und Audit-Trails Nachvollziehbarkeitsprinzipien:

- Ursprung der Evidence nachvollziehbar
- Mapping begruendet
- Review-Status sichtbar
- Exportzeitpunkt dokumentiert
- Hash-/tamper-evident Pattern nicht umgehen
- nachtraegliche Aenderungen als neue Events statt stille Ueberschreibung

## Prompt Governance

- Keine produktiven Inline-Prompts.
- Prompt Registry verwenden.
- Prompt-Version persistieren.
- Strukturierte Outputs via Zod validieren.
- Dokumentinhalte sind Daten, keine Systemanweisungen.
- Prompt-Injection-Tests fuer neue Pipelines.

## LLM Provider

NormPilot v0.1 setzt keine produktiven Public-LLM-Keys ohne Freigabe.

Nicht setzen ohne Freigabe:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
LLAMA_API_KEY
```

Fuer sensible Kundendaten:

- On-Premise oder EU-only bevorzugen
- Pseudonymisierung pruefen
- Tenant-Policy respektieren
- keine Daten in Provider-Training zulassen

## Incident Response Minimum

Bei Verdacht auf Datenleck, Secret-Leak oder Cross-Tenant-Zugriff:

1. Zugriff stoppen.
2. Token/Secret rotieren.
3. Logs sichern.
4. betroffene Mandanten identifizieren.
5. Datenschutz-/Security-Verantwortliche einbinden.
6. Meldepflichten pruefen.
7. Root Cause dokumentieren.
8. Corrective Action im System erfassen.

## No-Go

- Repo public schalten
- Secrets committen
- echte Kundendaten in Testdaten
- Norm-Volltexte einchecken
- produktive LLM Keys ohne Freigabe
- Audit Trail umgehen
- RLS deaktivieren
- KanzleiAI- und NormPilot-Kundendaten ohne dokumentierte Trennung vermischen
