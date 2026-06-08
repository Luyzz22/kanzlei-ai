# NormPilot Vercel and STRATO Domain Setup

Status: Release v0.1 Plan

## Zielbild

NormPilot v0.1 nutzt Vercel als Deployment-Ziel und STRATO als Domain-/DNS-
Provider fuer `normpilot-industrie.de`.

Zieldomains:

- `normpilot-industrie.de` -> Redirect auf `www.normpilot-industrie.de`
- `www.normpilot-industrie.de` -> Marketing/Landing oder schlanke App-Landing
- `app.normpilot-industrie.de` -> kanonische App- und Auth-Domain
- `demo.normpilot-industrie.de` -> optional spaeter fuer geschuetzte Demo- oder
  Preview-Flows

In v0.1 werden keine DNS-Aenderungen im Code vorgenommen.

## Vercel-Projekt

Vor DNS-Umstellung:

```bash
vercel domains add normpilot-industrie.de
vercel domains add www.normpilot-industrie.de
vercel domains add app.normpilot-industrie.de
```

Optional spaeter:

```bash
vercel domains add demo.normpilot-industrie.de
```

Die finalen DNS-Werte muessen pro Domain in Vercel bestaetigt werden:

```bash
vercel domains inspect normpilot-industrie.de
vercel domains inspect www.normpilot-industrie.de
vercel domains inspect app.normpilot-industrie.de
```

## STRATO DNS Records

Geplante Records:

| Host | Typ | Wert | Hinweis |
|---|---|---|---|
| `@` / Apex | `A` | `76.76.21.21` | Apex auf Vercel, danach Redirect auf `www` in Vercel konfigurieren |
| `www` | `CNAME` | per `vercel domains inspect` final bestaetigen | typischerweise Vercel-CNAME-Ziel |
| `app` | `CNAME` | per `vercel domains inspect` final bestaetigen | kanonische App/Auth-Domain |
| `demo` | `CNAME` | per `vercel domains inspect` final bestaetigen | optional, erst nach Demo-Protection-Freigabe |

Wichtig:

- STRATO `CNAME` nur fuer Subdomains verwenden, nicht fuer Apex.
- Bestehende MX-/Mail-Records der Domain nicht ueberschreiben.
- DNS-Aenderungen erst nach Vercel-Domain-Anlage vornehmen.
- Nach Umstellung SSL-Status in Vercel pruefen.

## Redirect-Strategie

Empfohlen fuer v0.1:

- `normpilot-industrie.de` leitet permanent auf `www.normpilot-industrie.de`.
- `www.normpilot-industrie.de` ist die oeffentliche Marketing-/Landing-Domain.
- `app.normpilot-industrie.de` ist die einzige kanonische App/Auth-Domain.
- Login-Links, OAuth Redirects und `NEXTAUTH_URL` zeigen auf `app`.

Keine v0.1-Annahme:

- Kein Cross-Subdomain-SSO zwischen `www` und `app`.
- Keine automatisierte Demo-Subdomain, solange Demo-Protection nicht final ist.

## Vercel Domain Checks

Nach DNS:

```bash
vercel domains inspect normpilot-industrie.de
vercel domains inspect www.normpilot-industrie.de
vercel domains inspect app.normpilot-industrie.de
```

Manuelle Checks:

- Apex redirectet auf `www`.
- `www` liefert die Marketing-/Landing-Oberflaeche.
- `app` liefert App/Login/Dashboard.
- SSL-Zertifikate sind aktiv.
- Keine Browser-Warnungen fuer Mixed Content oder Zertifikate.
