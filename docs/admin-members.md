# Mitglieder & Rollen (PR 2 Basis)

## Zweck
Diese Seite stellt eine belastbare, mandantenbezogene Übersicht aller Mitgliedschaften bereit. Sie ist bewusst read-only und dient als sicherer Einstieg in den späteren Ausbau zu freigabepflichtigen Rollenänderungen.

## Route
- UI: `/dashboard/admin/members`
- API: `/api/admin/members`

## Sicherheits- und Compliance-Entscheidungen
- Zugriff nur für Benutzer mit Plattformrolle `ADMIN`.
- Tenant-Bindung nur bei eindeutigem Mandantenkontext des angemeldeten Benutzers.
- Datenzugriff im Tenant-Kontext über `withTenant`.
- Keine Schreiboperationen in dieser Ausbaustufe.

## Nächster Ausbau
- Rollenänderung mit Vier-Augen-Freigabe
- Pflichtbegründung je Rollenänderung
- Audit-Event für jede Berechtigungsanpassung
