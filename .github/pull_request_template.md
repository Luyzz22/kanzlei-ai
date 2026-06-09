## Zweck

<!-- Was wird geändert und warum? -->

## Scope

- [ ] Produkt/Feature
- [ ] Dokumentation
- [ ] Infrastruktur/Deployment
- [ ] Datenbank/Migration
- [ ] Security/Compliance
- [ ] Tests/Evals

## Änderungen

-
-
-

## Tests / Quality Gates

Bitte ausführen oder begründen, falls nicht möglich:

- [ ] `pnpm prisma:validate`
- [ ] `pnpm prisma:generate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm eval:normpilot`
- [ ] `pnpm smoke:normpilot`
- [ ] `pnpm build`
- [ ] `git diff --check`

## Compliance Impact

### EU AI Act

- Einstufung: `minimal_risk | limited_risk | high_risk | prohibited | nicht betroffen`
- Human-in-the-Loop betroffen: `ja | nein`
- KI-Transparenzhinweis betroffen: `ja | nein`

### DSGVO

- Personenbezogene Daten betroffen: `ja | nein`
- Neue Verarbeitung / neuer Zweck: `ja | nein`
- Drittlandtransfer betroffen: `ja | nein`
- DSFA/DPIA-Prüfung erforderlich: `ja | nein | offen`

### GoBD / Audit Trail

- AuditEvent betroffen: `ja | nein`
- Evidence Pack / Export betroffen: `ja | nein`
- Hash-/Audit-Trail betroffen: `ja | nein`

### Normlizenz

- Norm-Volltexte enthalten: `nein`
- Nur Kapitelcodes/Kurzreferenzen/kundeneigene Anforderungen: `ja | nein`

## Datenbank / Migration

- [ ] Keine Migration
- [ ] Additive Migration
- [ ] RLS angepasst
- [ ] Retention berücksichtigt
- [ ] Rollback-Hinweis dokumentiert

## Security Review

- [ ] Keine Secrets im Diff
- [ ] Keine Kundendaten im Diff
- [ ] Keine personenbezogenen Daten in Logs/Seeds/Fixtures
- [ ] Keine neuen externen Provider Calls ohne Freigabe
- [ ] Fehlerantworten leaken keine Interna

## Bekannte Grenzen

-
-

## Merge-Hinweis

Kein Merge ohne explizites `ok merge` des Owners.
