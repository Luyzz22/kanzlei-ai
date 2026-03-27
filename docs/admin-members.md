# Mitglieder & Rollen (Hardening-Basis)

## Zweck
Diese Seite stellt eine belastbare, mandantenbezogene Übersicht aller Mitgliedschaften bereit. Sie bleibt bewusst schreibgeschützt und dient als sichere Grundlage für den späteren Ausbau zu freigabepflichtigen Rollenänderungen.

## Route
- UI: `/dashboard/admin/members`
- API: `/api/admin/members`

## Sicherheits- und Compliance-Entscheidungen
- Zugriff nur für Benutzer mit Plattformrolle `ADMIN`.
- Tenant-Kontext wird mit drei Zuständen behandelt: `none`, `single`, `multiple`.
- Nur bei `single` wird die Mitgliederliste geladen.
- Bei `multiple` wird kein impliziter Tenant gewählt; der Request wird kontrolliert abgelehnt.
- Datenzugriff erfolgt tenant-gebunden im RLS-Kontext über `withTenant`.
- Keine Schreiboperationen in dieser Ausbaustufe.

## Aktuelles Verhalten bei Tenant-Kontext
- **none:** Zugriff auf die Mitgliederliste nicht möglich, da kein Mandantenkontext vorliegt.
- **single:** Mitgliederliste wird read-only geladen.
- **multiple:** Zugriff auf die Mitgliederliste wird blockiert, bis eine explizite Tenant-Auswahl verfügbar ist.

## Nächster Ausbau
- Tenant-Auswahl für Konten mit Mehrfachmitgliedschaften.
- Rollenänderung mit Vier-Augen-Freigabe.
- Pflichtbegründung je Rollenänderung.
- Audit-Event für jede Berechtigungsanpassung.
