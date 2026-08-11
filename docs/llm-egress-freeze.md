# LLM-Egress-Freeze (Phase A1)

Erster Schritt des Compliance-Hardenings: **Stop the Bleeding**. Dieser Stand
stellt noch keine berufsrechtliche Konformität her — er friert den Ist-Zustand
ein, damit die Egress-Fläche während des Umbaus nicht weiter wächst.

## Was dieser Freeze leistet

- `pnpm security:llm-egress` schlägt fehl, sobald **neuer** direkter
  Provider-Egress ausserhalb der dokumentierten Allowlist entsteht.
- Die Allowlist muss **schrumpfen**: ein Eintrag ohne tatsächlichen Egress
  lässt den Guard ebenfalls fehlschlagen. Getilgte Schuld kann nicht
  unbemerkt in der Liste stehen bleiben.
- `.env.example` enthält keine realistisch aussehenden Key-Präfixe mehr,
  sondern `__SET_IN_SECRET_MANAGER__`.

## Was dieser Freeze ausdrücklich NICHT leistet

- **Kein Policy Decision Point.** Kein einziger Modellaufruf wird derzeit
  klassifiziert oder gegen eine Datenklasse geprüft.
- **Kein zentraler ModelGateway.** Die Alt-Pfade rufen die Provider weiterhin
  direkt auf, nur eben nachweisbar und abgezählt.
- **Keine Pseudonymisierung im Laufzeitpfad.** `redaction_pipeline/` und
  `src/lib/hybrid/` sind weiterhin nicht in den Egress-Pfad verdrahtet.

## Befund: `src/lib/hybrid/` ist Runtime-Dead-Code

Das Keystone-Modul (`evaluateGate()`, `buildSignedPayload()`,
`routeWithFallback()`, signierte `CloudSafePayload`) ist vollständig
implementiert und durch 14 Tests abgedeckt — wird zur Laufzeit aber von
**keiner** Datei importiert, ausser den eigenen Tests. Die Gate-Logik existiert,
läuft produktiv jedoch nie. Das Schliessen dieser Lücke ist der Kern der
nächsten Phase.

## Dokumentierte Alt-Egress-Punkte (Stand Freeze)

| Pfad | Warum noch offen |
|---|---|
| `src/lib/ai/anthropic-client.ts` | Client-Factory (Anthropic/Bedrock) — künftiger Transport des Gateways |
| `src/lib/ai/providers/openai-provider.ts` | Migration auf ModelGateway ausstehend |
| `src/lib/ai/providers/gemini-provider.ts` | Migration auf ModelGateway ausstehend |
| `src/lib/documents/text-extraction.ts` | **Gemini-OCR bei Ingestion — Drittland VOR Klassifikation.** Höchste Priorität der Folgephase |
| `src/app/api/copilot/route.ts` | Direkter OpenAI-Fallbackzweig |
| `src/app/api/health/route.ts` | HEAD-Healthcheck, kein Payload-Egress |
| `src/app/api/admin/test-anthropic/route.ts` | Admin-Konnektivitätstest, kein Mandatsinhalt |

Änderungen an dieser Liste gehören in einen Review durch die CODEOWNERS des
Hybrid-Keystones, nicht in einen beiläufigen Feature-PR.

## Git-History-Scan

Der History-Scan (`--log-opts=--all`) läuft zunächst **report-only**. Eine
gezielte Suche über alle Refs (1296 Commits) nach echten Anthropic-, Google-
und OpenAI-Key-Formen blieb ohne Treffer; das deckt aber nur einen Teil des
gitleaks-Regelsatzes ab. Nach dem ersten grünen CI-Lauf sollte
`continue-on-error` entfernt und der Job blockierend geschaltet werden.

## Nächste Phase

Reihenfolge nach Compliance-Handoff, Abschnitt 7:

1. `PolicyDecision`-Typ und zentrale Gateway-Schnittstelle (`executeAiRequest()`).
2. `evaluateGate()` aus `src/lib/hybrid/` davorschalten statt neu zu bauen.
3. Alt-Pfade migrieren, Allowlist dabei schrumpfen lassen.
4. Prisma-Modell `ProviderProfile` mit Verifikationsstatus und Ablaufdatum.
5. Klasse-4-Hard-Deny und Sperre jedes Fallbacks auf eine niedrigere Trust-Klasse.

Rechtliche Freigaben (Provider-Zulässigkeit, §43e-Vertragskette, Klasse-3-
Cloud-Freigabe) sind ausdrücklich **keine** Engineering-Entscheidung — siehe
Abschnitt 8 des Handoffs.
