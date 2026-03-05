# Runbook: Audit-Hash-Chain Verifikation

## Zweck
Read-only Prüfung der Audit-Hash-Chain pro Tenant (Manipulationshinweis).

## Ausführung
```bash
pnpm audit:verify --tenantId="<tenant-id>"
```

## Ausgabe
JSON mit:
- `tenantId`
- `verified` (boolean)
- `checked` (Anzahl geprüfter Events)
- optional `firstErrorIndex` + `detail`

## Exit Codes
- `0`: Verifikation erfolgreich
- `1`: Laufzeit-/Parameterfehler
- `2`: Hash-Chain ungültig
