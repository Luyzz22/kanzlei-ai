# ADR-0002: Lokales Modell für die Vertragsanalyse (souveräne Zone)

- **Status:** Angenommen (Modellauswahl: Verfahren festgelegt, Kandidat vorgegeben)
- **Datum:** 2026-08-12
- **Kontext:** Klasse 3–4 nach [ADR-0001](0001-externer-mandats-llm-pfad.md) darf die
  souveräne Zone nicht verlassen. Bisher existiert dort kein Modell.

## Warum das keine reine Qualitätsfrage ist

Das lokale Modell trägt genau die Fälle, die **nicht** ausweichen dürfen:
Strafverteidigung, M&A, Gesundheitsdaten, laufende Verhandlungen. Daraus folgt
ein Zusammenhang, der leicht übersehen wird:

> Ist das lokale Modell schwach, entsteht Druck, Klasse-3-Mandate doch extern
> zu verarbeiten. Die Qualität des lokalen Modells ist damit eine
> **compliance-relevante** Eigenschaft, nicht nur eine UX-Frage.

Ein Policy-Gate, das man umgehen *will*, wird irgendwann umgangen.

## Hardware-Rahmen (bindend)

Hetzner bietet aktuell genau zwei GPU-Server: GEX44 (RTX 4000 SFF Ada, 20 GB,
derzeit nicht verfügbar) und **GEX131 mit NVIDIA RTX PRO 6000 Blackwell Max-Q,
96 GB GDDR7, ~889 €/Monat**. Es gibt dort **kein A100/H100**, keine
SXM-Datacenter-Teile und laut Hetzner-Doku keine Möglichkeit, weitere Karten
nachzurüsten.

Damit steht das Budget fest: **96 GB VRAM auf einer einzelnen GPU.**

Das schliesst die üblichen „Top-Modelle" der Vergleichsartikel aus:
DeepSeek-R1 (671B MoE) und Qwen3-235B passen auch 4-bit-quantisiert nicht.
Wer sie empfiehlt, hat die Zielhardware nicht betrachtet.

### VRAM-Rechnung für 96 GB

| Variante | Gewichte | Rest für KV-Cache | Bewertung |
|---|---|---|---|
| ~70B dense, 4-bit AWQ | ~40 GB | ~50 GB | 128k Kontext bequem — beste Qualität im Rahmen |
| ~30B dense, 8-bit | ~32 GB | ~60 GB | sehr viel Luft, hoher Durchsatz |
| ~24–32B dense, bf16 | ~48–64 GB | ~30–45 GB | 64k Kontext solide |
| >100B dense | passt nicht | — | ausgeschlossen |

Bedarf aus dem Code: `AI_MAX_INPUT_CHARS=120000` (~30–40k Tokens) plus bis zu
16k Output. **64k nutzbarer Kontext genügt, 128k ist komfortabel.**

## Entscheidung

**Hauptmodell: Mistral Small 4 (`Mistral-Small-4-119B-2603`), 4-bit, auf einem
GEX131.** Dazu ein kleiner lokaler Worker und lokale Embeddings — ein
Modell-Pool, kein Einzelmodell.

### Warum Mistral Small 4 auf genau dieser Karte aufgeht

Das Modell ist ein **MoE mit 119B Gesamt- und nur ~6,5B aktiven Parametern
pro Token**, Apache 2.0. Die oft zitierte Spanne „60–238 GB GPU-RAM" ist keine
Unsicherheit, sondern die Quantisierungsachse: 238 GB entspricht bf16,
**~60 GB entspricht 4-bit**. Bei einem MoE müssen alle Experten im VRAM liegen,
auch wenn pro Token nur ein Bruchteil rechnet.

Daraus folgt der eigentliche Vorteil für eine Einzelkarte:

| | Gewichte | Rechnende Parameter/Token | Folge |
|---|---|---|---|
| ~70B dense, 4-bit | ~40 GB | 70B | mehr KV-Reserve, deutlich langsamer |
| **Mistral Small 4, 4-bit** | **~60 GB** | **~6,5B** | weniger KV-Reserve, **Durchsatz einer 8B-Klasse** |

Wir bezahlen VRAM für die Experten und bekommen dafür die Geschwindigkeit
eines kleinen Modells bei der Qualität eines grossen. Auf einer Box, die
ohnehin nicht skalierbar ist, ist das der bessere Handel.

### VRAM-Budget des Pools auf 96 GB

| Komponente | Quantisierung | VRAM |
|---|---|---|
| Mistral Small 4 — Klasse 3/4, Endantworten | 4-bit | ~60 GB |
| Qwen3 14B — Klassifikation, PII-Vorprüfung, Extraktion | 4-bit | ~8 GB |
| BGE-M3 — lokale Embeddings für Akten-RAG | fp16 | ~2 GB |
| **Summe Gewichte** | | **~70 GB** |
| Rest für KV-Caches beider Modelle | | **~26 GB** |
| PaddleOCR / Tesseract | CPU | 0 GB |

Das geht auf. **Nicht** aufgehen würde ein zusätzliches Qwen3 32B als
„Deep-Reasoning-Zweitmeinung" — dafür fehlen die ~20 GB. Dieser Pfad braucht
eine zweite Box oder ersetzt den 14B-Worker situativ; er ist kein Add-on zum
laufenden Pool.

### Warum der kleine Worker nicht optional ist

Der Qwen3-Worker ist bei uns kein Kostenoptimierer, sondern schliesst eine
konkrete Lücke: Es gibt derzeit **keine lokalen Detektoren**, weshalb
`evaluateGate()` ausnahmslos `AMBER` liefert und Klasse 2–3 nie extern darf.
Erst ein lokaler Klassifikator/PII-Detektor macht das Gate überhaupt
entscheidungsfähig. Er gehört damit zur ersten Ausbaustufe, nicht zur zweiten.

### Serving-Stack

**vLLM mit grammatikgebundener Dekodierung** (`guided_json`) — siehe unten.
Mistral dokumentiert vLLM als empfohlenen Self-Hosting-Weg und liefert damit
die OpenAI-kompatible API, die unser `LlamaCompatProvider` bereits spricht.

### Was empirisch bleibt

Die **Rangfolge Mistral Small 4 vs. Qwen3 32B für deutsche Vertragssprache**
entscheidet das eigene Evalset, nicht dieses Dokument. Beide passen in den
Rahmen; beide sind Apache 2.0.

## Warum grammatikgebundene Dekodierung den Ausschlag gibt

Die Pipeline validiert jede Stufe gegen ein zod-Schema
(`classificationStageSchema`, `extractionStageSchema`,
`riskAndGuidanceStageSchema`). Ein Modell, das gültiges Deutsch schreibt, aber
das Schema verfehlt, ist für uns wertlos.

Mit `guided_json` erzwingt vLLM das Schema **im Decoder**: ungültige Tokens
werden gar nicht erst gesampelt. Schema-Konformität wird damit zur Eigenschaft
der Inferenz-Engine statt zur Hoffnung auf Modellgrösse. Praktische Folge:
Ein 24–32B-Modell wird an dieser Stelle so verlässlich wie ein 70B-Modell —
die Grösse zahlt dann nur noch auf juristische Qualität ein, nicht mehr auf
Formattreue.

Deshalb ist der Stack die Entscheidung und das Modell die Variable.

## Verfahren für die endgültige Auswahl

Das Repository bringt die nötige Infrastruktur bereits mit
(`scripts/run-contract-evals.ts`, `src/lib/evals/eval-model-matrix.ts`, das
Alias `llama-compat`). Die Auswahl läuft deshalb über die **eigenen
Vertrags-Evals**, nicht über fremde Ranglisten:

```bash
# vLLM mit dem Kandidaten starten, dann:
LLAMA_API_BASE=http://<host>:8000 \
LLAMA_API_KEY=<token> \
LLAMA_MODEL=<modell-id> \
EVAL_MODEL_MATRIX=llama-compat \
corepack pnpm@9.15.9 eval:contracts
```

Zu bewerten sind mindestens:

- **Schema-Trefferquote** je Stufe (muss mit `guided_json` 100 % sein — ist sie
  es nicht, stimmt die Verdrahtung nicht).
- **Fachliche Trefferquote** gegen die Golden-Set-Erwartungen.
- **Latenz** bei 30–40k Input-Tokens (Kanzleialltag, nicht Demo-Verträge).
- **Verhalten bei langen Verträgen** oberhalb `AI_LONG_DOCUMENT_CHAR_THRESHOLD`.

Testmaterial: ausschliesslich synthetische oder belastbar anonymisierte
Verträge. Für einen Modellvergleich echte Mandatsakten zu verwenden, wäre
genau der Fehler, den diese Architektur verhindern soll.

## Ausbaureihenfolge

1. **GEX131 + Qwen3 14B + BGE-M3 + PaddleOCR.** Das bringt sofort: lokale
   Detektoren (macht das Policy-Gate entscheidungsfähig), lokale Embeddings
   (Klasse-3/4-RAG ohne Cloud) und lokales OCR (schliesst die Lücke, die der
   Rückbau des Gemini-OCR hinterlassen hat).
2. **Mistral Small 4 4-bit dazu**, sobald Schritt 1 misst und trägt.
3. **`AI_POLICY_ENFORCE=true`** — erst wenn 1 und 2 stehen. Vorher ist eine
   Entscheidung „LOCAL" nicht ausführbar.

Reihenfolge bewusst so: Der kleine Worker liefert früher Compliance-Wirkung
als das grosse Modell, weil er das Gate freischaltet.

## Kein Fine-Tuning auf Mandatsakten

Weder zum Start noch später ohne gesonderte Prüfung. Modelle memorisieren
Trainingsdaten; ein auf Akten feinjustiertes Modell schafft neue Geheimnis-,
Lösch- und Einwilligungsrisiken (§ 203 StGB, DSGVO Art. 17). Der Weg ist RAG
mit berechtigungsgefiltertem Retrieval, nicht Fine-Tuning.

## Offen — bewusst nicht hier entschieden

- **Lizenzprüfung am konkreten Artefakt vor Produktivsetzung.** Apache 2.0 ist
  für `Mistral-Small-4-119B-2603` belegt; das ist vor dem Deployment an der
  tatsächlich geladenen Gewichtsdatei zu bestätigen, nicht aus einem Dokument
  zu übernehmen. Quantisierte Community-Uploads können abweichende Bedingungen
  oder verändertes Verhalten haben — bevorzugt die offiziellen Gewichte
  verwenden und selbst quantisieren.
- **Ob eine GEX131 für die Zielparallelität reicht.** Bei ~60 GB Gewichten
  bleiben ~26 GB KV-Cache für zwei Modelle. Wie viele gleichzeitige
  Langkontext-Anfragen das trägt, ist zu messen, nicht zu schätzen.
- **Verhältnis zu ADR-0001:** Der externe Pfad ist Claude über **Bedrock EU**,
  nicht Azure — Claude hat auf Azure Foundry keine EU Data Zone. Ein
  Azure-Pfad wäre ein GPT-Pfad und damit eine eigene Entscheidung.

## Quellen

- [Hetzner GEX131 — RTX PRO 6000 Blackwell Max-Q, 96 GB](https://www.hetzner.com/dedicated-rootserver/gex131/)
- [Hetzner Pressemitteilung zum GEX131](https://www.hetzner.com/pressroom/new-gex131/)
- [Hetzner GPU-Server-Matrix](https://www.hetzner.com/dedicated-rootserver/matrix-gpu/)
- [mistralai/Mistral-Small-4-119B-2603 (Modellkarte)](https://huggingface.co/mistralai/Mistral-Small-4-119B-2603)
- [Mistral Small 4 — Self-Hosting und Hardware](https://www.spheron.network/blog/deploy-mistral-small-4-gpu-cloud/)
