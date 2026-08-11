# ADR-0001: Externer LLM-Pfad für Mandatsdaten

- **Status:** Angenommen
- **Datum:** 2026-08-11
- **Kontext:** Compliance-Hardening nach § 203 StGB / §§ 43a, 43e BRAO / DSGVO / EU AI Act

## Frage

Über welchen externen Anbieter dürfen mandatsbezogene Daten verarbeitet werden,
wenn sie die souveräne Zone verlassen — und welcher Anbieter trägt den
Mandatspfad, solange die Zielarchitektur aufgebaut wird?

## Zonenmodell (unstrittig)

| Zone | Inhalt | Ausführung |
|---|---|---|
| Souverän (Hetzner / On-Prem) | Klasse 3–4, RAG über Mandantenakten, Embeddings, OCR | lokale Modelle, kein Egress |
| Extern, policy-gesteuert | Klasse 2, pseudonymisiert Klasse 3 | ein einziger freigegebener Anbieter |
| Identität & Betrieb | SSO, Secrets, Netzwerk | Azure (Entra ID, Key Vault, Private Endpoints) |

## Entscheidung

**Der externe Mandatspfad läuft über Claude auf AWS Bedrock in einer
EU-Mitgliedstaat-Region (Standard: `eu-central-1`, Frankfurt).**

Azure bleibt Identitäts- und Betriebsschicht, ist aber **kein** Inferenzpfad
für Mandatsdaten.

## Begründung

Der naheliegende Kandidat war Azure — Data Zone EUR, Microsoft-Nähe der
Kanzleien, vorhandener Entra-Stack. Die Prüfung ergab jedoch:

1. **Claude hat auf Microsoft Foundry keine EU Data Zone.** Microsofts Doku
   (Stand 2026-07-24) kennt für Claude ausschliesslich `Global Standard` und
   `Data Zone Standard (US)`. Eine EU-Zone existiert in keiner Modell-Zeile.
   Anthropic führt Foundry-EU als „Coming 2026" ohne Datum; Microsoft nennt
   als heutigen Weg zu EU-Residenz mit Claude ausdrücklich AWS Bedrock oder
   GCP Vertex AI.
2. **Die EU Data Zone gilt für Azure OpenAI (GPT), nicht für Claude.** Der
   Azure-Weg für Mandatsdaten hiesse also, Claude aufzugeben. Die Codebasis
   ist bewusst Claude-gebunden (`contractAnalysisClaudeOnly`, gepinnte
   Snapshots in `claude-model-config.ts`) — das wäre ein Produkt-, kein
   Konfigurationswechsel.
3. **Der § 203-Default liegt bei Bedrock günstiger.** Azure Abuse Monitoring
   ist standardmässig aktiv, speichert Prompts bis zu 30 Tage und erlaubt
   menschliche Review; der Opt-out („Modified Abuse Monitoring") ist ein
   Antrag mit Genehmigungsvorbehalt. Genau diese *Möglichkeit der
   Kenntnisnahme* begründet nach BRAK-Lesart das Offenbaren. Bedrock Model
   Invocation Logging ist umgekehrt standardmässig **aus** und muss aktiv
   eingeschaltet werden — safe by default statt opt-out-pflichtig.

## Konsequenzen

- `AI_BEDROCK_ENABLED=true` erfordert eine explizite EU-Region. Es gibt
  **keinen Default**: fehlende oder nicht-EU Region wirft
  `BedrockRegionPolicyError`, statt still auf `us-east-1` zurückzufallen
  (Handoff-Invariante 7, „unklare Datenresidenz blockiert").
- `eu-west-2` (London) und `eu-central-2` (Zürich) sind **nicht** freigegeben.
  Beide tragen ein `eu-`Präfix, liegen aber nicht in einem EU-Mitgliedstaat;
  für sie wäre nach § 43e Abs. 4 BRAO ein eigener Nachweis vergleichbaren
  Geheimnisschutzes nötig.
- Bedrock erhält **keinen** RAG-Zugriff auf Mandantenakten. Retrieval,
  Embeddings und Vektorindex bleiben in der souveränen Zone.
- Der Anbieter wird mittelfristig Teil der `PolicyDecision` (Datenklasse →
  Zone → Anbieter). Der heutige globale ENV-Schalter ist ein Übergangsstand
  und kein Zielzustand.
- Weiterhin offen und ausdrücklich **nicht** durch dieses ADR entschieden:
  § 43e-BRAO-Vertragskette mit AWS, Transfer Impact Assessment für den
  US-Mutterkonzern, DSFA. Ohne diese bleibt der externe Pfad für Klasse 3
  gesperrt.

## Revisionsbedingung

Sobald Claude auf Microsoft Foundry eine **Data Zone EUR** erhält, ist diese
Entscheidung neu zu bewerten. Der Azure-Pfad wäre dann wegen Stack-Nähe,
Entra-Integration und Kanzlei-Vertrautheit vorzuziehen — die Architektur ist
deshalb anbieter-austauschbar zu halten, damit der Wechsel eine
Konfigurations- und keine Umbauentscheidung wird.

## Quellen

- [Claude models in Microsoft Foundry — Deployment types and regions](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/claude-models)
- [Timeline for Claude in Microsoft Foundry to run on Azure EU infrastructure](https://learn.microsoft.com/en-us/answers/questions/5867930/timeline-for-claude-in-microsoft-foundry-to-run-on)
