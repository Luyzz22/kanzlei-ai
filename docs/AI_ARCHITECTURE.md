# AI Architecture – KanzleiAI Multi-LLM

## Überblick
KanzleiAI nutzt ein Multi-LLM-Routing mit drei Modellen:

- **Claude Sonnet 4** für Vertrags-, Risiko- und Compliance-Analysen
- **Gemini 2.5 Pro** für lange oder visuell komplexe Dokumente
- **GPT-4o-mini** für schnelle Standardanfragen und Zusammenfassungen

## Entscheidungsbaum
1. Analyse-Typ = `contract`, `risk`, `compliance` → **Claude Sonnet 4**
2. Sonst: Dokument > 50.000 Tokens oder visuelle Elemente → **Gemini 2.5 Pro**
3. Sonst → **GPT-4o-mini**
4. Fallback-Kette bei Fehlern: `Claude → Gemini → GPT-4o-mini`

## API Endpoint
### `POST /api/analyze`

#### Request
```json
{
  "documentId": "doc_123",
  "documentText": "...",
  "analysisType": "contract",
  "documentLength": 8200,
  "hasVisualElements": false
}
```

#### Response
```json
{
  "modelUsed": "claude-sonnet-4",
  "analysis": {},
  "tokensUsed": 2345,
  "costEstimate": 0.035175,
  "processingTime": 1800,
  "fallbackUsed": []
}
```

## cURL Beispiel
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "documentId":"doc_001",
    "documentText":"Vertragstext...",
    "analysisType":"risk",
    "documentLength":12000,
    "hasVisualElements":false
  }'
```

## Kosten-Schätzung (indikativ)
| Modell | USD / 1k Tokens |
|---|---:|
| claude-sonnet-4 | 0.015 |
| gemini-2.5-pro | 0.010 |
| gpt-4o-mini | 0.0015 |

## Troubleshooting
- **401 Nicht autorisiert:** Session prüfen (`NEXTAUTH_SECRET`, Login-Flow)
- **503 Analyse nicht verfügbar:** Provider-API-Keys oder Rate-Limits prüfen
- **Leeres JSON:** Prompt-Ausgabe entspricht nicht exakt Schema → Retry mit niedriger Temperatur
- **DB Logging fehlt:** Migration für `AnalysisLog` ausführen (`prisma migrate dev`)

## Migration & Rollout
- Neue Multi-LLM-Struktur ist parallel nutzbar über `/api/analyze`.
- Rollout per Feature-Flag empfohlen (z. B. `AI_ROUTER_ENABLED=true`).
- A/B-Test über Vergleich alter Gemini-only Pipeline vs. neuer Router.
- Monitoring: Modell-Latenz, Fehlerquote, Tokens und Kosten pro Mandant tracken.
