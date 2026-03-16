# Enterprise-Roadmap KanzleiAI

## 1) Zielbild

„Enterprise-ready“ bedeutet für KanzleiAI: belastbare Mandantentrennung, revisionssichere Nachvollziehbarkeit, klar geregelte Verantwortlichkeiten und dokumentierte Betriebsprozesse, die deutsche Beschaffung, IT-Sicherheitsprüfungen und Compliance-Audits bestehen.

Für DACH/EU und Kanzlei-/B2B-Kontext umfasst das Zielbild:
- **Governance-fähige Produktsteuerung:** klare Rollen, Freigaben, Änderungsnachweise.
- **Prüffähigkeit:** lückenlose Auditierbarkeit mit exportierbaren Nachweisen.
- **Datenschutzfähigkeit:** standardisierte Prozesse für Auskunft, Löschung, Aufbewahrung.
- **IAM-Reife:** SSO/SAML/SCIM als kontrollierter, dokumentierter Betriebsprozess.
- **AI-Governance:** Transparenz über Modelle, Prompts, Entscheidungen und Human-in-the-Loop.
- **Beschaffungsreife:** Trust-Center-Grundlagen, Security-/Compliance-Artefakte, klare Betriebszusagen.

## 2) Betriebsmodell

### Multi-Tenant-Strategie
- **Primärmodell:** Shared Multi-Tenant mit strikter technischer Isolation (RLS + Tenant-Kontext).
- **Enterprise-Option:** perspektivisch isolierte Betriebsvarianten für Kunden mit erweiterten Anforderungen.
- **Betriebsgrundsatz:** jede tenant-gebundene Operation läuft im expliziten Tenant-Kontext.

### Rollenmodell
- **Plattformrollen:** interne Betriebs- und Supportrollen mit dokumentierten Berechtigungsgrenzen.
- **Tenantrollen:** mindestens `ADMIN`, `ANWALT`, `ASSISTENT`, später feinere Berechtigungsobjekte.
- **Freigabemodell:** kritische Änderungen stufenweise mit Vier-Augen-Prinzip.

### Audit/Logging
- Vollständige, manipulationserschwerte Ereigniskette als Standard.
- Trennung zwischen operativem Monitoring und Compliance-Nachweis.
- Definierte Exportformate und Aufbewahrungsrichtlinien je Nachweistyp.

### Support-/Ops-Fähigkeit
- Standardisierte Runbooks für Störung, Incident, Recovery, Migration.
- Diagnostikfunktionen pro Tenant mit klarer Zugriffskontrolle.
- Servicezustands- und Integrationsstatus auf Admin-Ebene.

### Change-Management
- Versionierte Richtlinien und produktseitige Release-Hinweise für Admins.
- Nachvollziehbare Änderungen an sicherheits- oder compliance-relevanten Einstellungen.
- Definierte „Plan → Freigabe → Rollout → Nachweis“-Kette.

## 3) Phasenplan

- **Phase A:** Enterprise Foundation
- **Phase B:** Admin & Governance
- **Phase C:** IAM & SSO
- **Phase D:** Datenschutz & Retention
- **Phase E:** AI Governance
- **Phase F:** Billing / Usage / Procurement Readiness

## 4) Details je Phase

## Phase A – Enterprise Foundation

### Ziele
- Einheitlicher Admin-Einstieg und strukturierte Enterprise-Informationsarchitektur.
- Konsistente Begriffe, Statusmodelle und Verantwortlichkeiten im Produkt.

### Epics
- **Tenant Admin Center**
- **Legal/Compliance Center (Grundstruktur)**
- **Supportability / Troubleshooting (Basis-Runbooks und Sichtbarkeit)**

### Akzeptanzkriterien
- Admin-Center-Route mit klaren Governance-Modulen vorhanden.
- Statusmodell „Verfügbar / In Vorbereitung / Nur Enterprise-Plan“ konsistent.
- Verweise auf zentrale Betriebs- und Compliance-Dokumente dokumentiert.

### Risiken
- Uneinheitliche Terminologie zwischen Produkt und Dokumentation.
- Zu grober Scope ohne klare Priorisierung.

### Abhängigkeiten
- Bestehende Dashboard-Struktur.
- Vorhandene Audit-/RLS-Basics.

## Phase B – Admin & Governance

### Ziele
- Admin- und Governance-Funktionen von „Übersicht“ zu „steuerbar“ ausbauen.

### Epics
- **Membership & Role Management**
- **Policy/Settings Registry pro Tenant**
- **Audit UI + Export**

### Akzeptanzkriterien
- Rollenänderungen revisionsfähig und UI-geführt möglich.
- Tenant-spezifische Policies versioniert und nachvollziehbar.
- Audit-Filter, Exporthistorie und Nachweisexport standardisiert.

### Risiken
- Berechtigungsfehler bei Rollenzuweisungen.
- Unerwartete Komplexität in Policy-Migrationen.

### Abhängigkeiten
- Stabiles Rollen-/Tenant-Modell.
- Audit-Datenmodell mit ausreichender Granularität.

## Phase C – IAM & SSO

### Ziele
- Enterprise-IAM mit kontrolliertem Onboarding und Betriebsüberwachung.

### Epics
- **SSO/SAML Readiness**
- SCIM-Betriebsreife mit Token-/Lifecycle-Management

### Akzeptanzkriterien
- SSO-Konfiguration und Status pro Tenant im Admin Center sichtbar.
- SCIM-Integrationen auditierbar, rotierbar und supportbar.
- IAM-Einführung über dokumentierten Freigabeprozess.

### Risiken
- Fehlkonfiguration bei IdP-Mappings.
- Supportaufwand bei heterogenen Kunden-IdPs.

### Abhängigkeiten
- Rollen- und Membership-Basics aus Phase B.
- belastbare Audit- und Support-Werkzeuge.

## Phase D – Datenschutz & Retention

### Ziele
- DSGVO-Prozesse von Vorlageebene in operativen Produktprozess überführen.

### Epics
- **Data Export / Deletion / Retention**
- DSAR-Fallmanagement und dokumentierte Bearbeitungswege

### Akzeptanzkriterien
- Tenant-gebundene Export-/Löschprozesse mit Nachweiskette.
- Konfigurierbare Retention-Policies mit sicherer Durchsetzung.
- Standardisierte Nachweise für Datenschutzprüfungen.

### Risiken
- Fehlerhafte Löschlogik bei komplexen Datenbeziehungen.
- Konflikte zwischen Aufbewahrungspflichten und Löschanforderungen.

### Abhängigkeiten
- Policy Registry aus Phase B.
- belastbare Audit- und Freigabefunktionen.

## Phase E – AI Governance

### Ziele
- EU-AI-Act-fähige Steuerung von KI-Einsatz und Risikoabläufen.

### Epics
- **AI Governance / Model Register / Prompt Governance**
- Human-in-the-Loop-Kontrollpunkte für kritische Analysen

### Akzeptanzkriterien
- Modelle, Einsatzzwecke und Freigabestatus zentral dokumentiert.
- Prompt-/Policy-Änderungen versioniert und auditierbar.
- HITL-Pflichtfälle im Produktfluss sichtbar und erzwingbar.

### Risiken
- Governance-Lücken zwischen Fachkonzept und technischer Umsetzung.
- Fehlende Nachweise bei Modell- oder Promptänderungen.

### Abhängigkeiten
- Rollen-/Freigabemodell (Phase B).
- Datenschutz- und Logging-Reife (Phase D).

## Phase F – Billing / Usage / Procurement Readiness

### Ziele
- Einkaufs- und Betriebsreife für größere B2B-/Enterprise-Kunden herstellen.

### Epics
- **Metering / Usage Foundation**
- **Procurement/Trust Center Grundlagen**

### Akzeptanzkriterien
- Nutzungsmessung tenant-spezifisch, nachvollziehbar und exportierbar.
- Trust-Center-Basis mit Sicherheits- und Compliance-Artefakten verfügbar.
- Plan-/Leistungsabgrenzung im Admin Center transparent.

### Risiken
- Intransparente Metriken führen zu Vertrauensverlust bei Beschaffung.
- Hoher Abstimmungsbedarf zwischen Produkt, Finance und Legal.

### Abhängigkeiten
- stabile Ereignis- und Audit-Datenbasis.
- Governance- und Policy-Reife aus Phasen B–E.

## Priorisierte Lückenanalyse (aktueller Stand)

1. **Fehlender Admin-Einstiegspunkt mit Governance-Struktur (hoch):** aktuell kein dedizierter Enterprise-Admin-Bereich im Dashboard.
2. **Fehlende Tenant-Policy-Verwaltung (hoch):** Richtlinien sind dokumentiert, aber nicht als tenantfähige Produktfunktion abbildbar.
3. **Rollen-/Membership-UI fehlt (hoch):** RBAC-Basics existieren, aber keine administrierbare Oberfläche.
4. **Audit-Nachweise noch operativ eingeschränkt (mittel):** Audit-UI vorhanden, Nachweispaketierung und Export-Historie fehlen.
5. **Datenschutzprozesse nicht operationalisiert (mittel):** Vorlagen existieren, aber keine DSAR-/Retention-Steuerung im Produkt.
6. **SSO/SAML-Betriebsführung nicht im Produkt verankert (mittel):** technische Dokumente vorhanden, Admin-Prozessoberfläche fehlt.
7. **Procurement-/Trust-Center-Layer fehlt (mittel):** ISMS-Dokumente vorhanden, aber kein kuratierter Kundenzugang.
8. **Startup-artige UX in Admin-Kontext (mittel):** uneinheitliche Beschriftungen und fehlende Status-/Freigabelogik.
