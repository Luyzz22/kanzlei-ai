# Administrationszentrum (Grundlage)

## Zweck
Das Administrationszentrum ist der zentrale Einstiegspunkt für administrative Aufgaben auf Tenant-Ebene. Es bündelt den aktuellen Ausbaustand wichtiger Enterprise-Bereiche und schafft eine klare Informationsarchitektur für Betrieb, Compliance und Governance.

## Zielgruppe
- Tenant-Administratoren
- Compliance-Verantwortliche
- IT-/Security-Ansprechpartner

## Designprinzipien
- **Klare Betriebsreife:** Jeder Bereich ist als „Verfügbar“, „In Vorbereitung“ oder „Nur Enterprise-Plan“ gekennzeichnet.
- **Nachvollziehbarkeit:** Pro Modul werden Verantwortungsbereich und nächster Ausbauschritt explizit benannt.
- **Konfigurationszentriert:** Bereichsdefinitionen liegen zentral in `src/config/admin-center.ts` und nicht verteilt in der UI.

## Aktueller Umfang
Route: `/dashboard/admin`

Neu in PR 2: read-only Detailseite `/dashboard/admin/members` für Mitglieder & Rollen.

Enthaltene Module:
1. Tenant / Organisation
2. Mitglieder & Rollen
3. Sicherheit & Zugriff
4. Audit & Nachweise
5. Datenschutz & Aufbewahrung
6. Integrationen (SCIM/SSO vorbereitet)
7. Abrechnung & Nutzung
8. KI-Governance

## Geplante Ausbaustufen
1. **PR 2 – Membership & Role Management UI (Basis):** read-only Mitgliederübersicht als Grundlage für spätere freigabepflichtige Rollenänderungen.
2. **PR 3 – Audit UI Ausbau:** gespeicherte Filterprofile, strukturierter Export und Nachweis-Paketierung.
3. **PR 4 – Tenant Policy Registry:** zentrale Richtlinien- und Einstellungenverwaltung pro Tenant.
