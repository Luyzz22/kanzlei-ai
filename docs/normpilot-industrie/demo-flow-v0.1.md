# NormPilot Demo Flow v0.1

Status: Demo Freeze

## Vorbereitungscheck

Vor jeder Demo:

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:normpilot
pnpm smoke:normpilot
pnpm build
```

Deployment-Check:

- Vercel Deployment gruen.
- `app.normpilot-industrie.de` erreichbar.
- SSL aktiv.
- Demo-User Login funktioniert.
- `/dashboard/normpilot` erreichbar.
- Keine produktiven Provider Calls fuer NormPilot.

## Demo-Daten

Erlaubt:

- synthetische Daten.
- freigegebene kundeneigene Checklisten.
- freigegebene Dokumentreferenzen.
- kurze Anchors, Locator und Hashes.

Nicht erlaubt:

- proprietaere Norm-Volltexte.
- echte Kundendaten ohne Freigabe.
- personenbezogene Owner-Labels ohne Freigabe.
- Screenshots oder Exporte ausserhalb der Datenfreigabe.

## 10-Minuten-Demo

### Minute 0 bis 1: Problem

Kurzbild:

- Audit kommt.
- Nachweise liegen verteilt.
- Manuelle Evidence Matrix kostet Zeit.
- Normlizenz und Datenschutz machen unkontrollierte KI schwierig.

### Minute 1 bis 2: NormPilot Positionierung

NormPilot ist ein Audit Evidence Copilot:

- kundeneigene Checklisten.
- freigegebene Evidence Sources.
- Evidence Matrix.
- Gap-Liste.
- Corrective Actions.
- Evidence Pack Export.
- Human Review.

### Minute 2 bis 3: Requirement Set

Zeigen:

- `/dashboard/normpilot`
- Requirement Set.
- Requirement Items.
- Review-State.

Kernaussage:

> Die Pruefgrundlage bleibt kundeneigen. NormPilot hostet keine Norm-Volltexte.

### Minute 3 bis 4: Evidence Sources

Zeigen:

- Evidence Sources.
- synthetischer oder freigegebener Intake.
- Locator/Hash-Prinzip.

Kernaussage:

> Evidence wird referenziert und kurz verankert, nicht als lange Volltextkopie
> dupliziert.

### Minute 4 bis 5: Mock Sprint oder vorbereitete Matrix

Zeigen:

- Mock Sprint als Entwurf.
- Evidence Matrix mit Status.
- Confidence und Review-State.

Kernaussage:

> Vorschlaege sind reviewpflichtige Entwuerfe.

### Minute 5 bis 6: Gap-Liste

Zeigen:

- Gap Findings.
- Severity.
- Review-State.

Kernaussage:

> Luecken werden priorisiert und quellengebunden sichtbar.

### Minute 6 bis 7: Corrective Actions

Zeigen:

- Corrective Actions.
- Status `DRAFT`.
- Owner Role statt personenbezogener Pflichtfelder.

Kernaussage:

> Massnahmen starten als Entwurf und werden erst nach Human Review verbindlich.

### Minute 7 bis 8: Evidence Pack Export

Zeigen:

- Markdown/CSV Preview.
- KI-Hinweis.
- Normlizenz-Hinweis.
- Prompt-Metadaten.
- Review Snapshot.

Kernaussage:

> Das Ergebnis ist auditfaehig, aber kein autonomer Auditentscheid.

### Minute 8 bis 9: Security und Compliance

Zeigen oder erwaehnen:

- Tenant-Isolation.
- RLS.
- Audit-Metadata-Allowlist.
- `pnpm smoke:normpilot`.
- keine Provider Calls in v0.1.

### Minute 9 bis 10: Pilotangebot

Angebot:

- 14 Tage.
- 1 Tenant.
- 1 Requirement Set.
- 5 bis 20 Evidence Sources.
- 2.500 bis 4.500 EUR netto.
- Abschlussbericht.

CTA:

> 14-Tage-Pilot anfragen.

## Demo No-Go

Demo abbrechen, wenn:

- Smoke rot.
- Login fehlschlaegt.
- Export-Hinweise fehlen.
- Norm-Volltext in Demo-Daten auftaucht.
- echte Kundendaten ohne Freigabe sichtbar sind.
- produktive Provider Calls moeglich sind.
