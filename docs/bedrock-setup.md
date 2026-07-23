# Claude über Amazon Bedrock betreiben

KanzleiAI kann alle Claude-Aufrufe wahlweise über die **direkte Anthropic-API**
oder über **Amazon Bedrock** ausführen — umgeschaltet per ENV-Variable, ohne
Code-Änderung. Default (Schalter aus) = unverändert direkte API.

## 1. Model Access in AWS freischalten

1. AWS-Konsole → **Amazon Bedrock** → *Model access*.
2. Die benötigten Anthropic-Claude-Modelle anfordern/aktivieren
   (z. B. Claude Sonnet 4.5 / 4.6).
3. Warten, bis der Status auf **Access granted** steht.

> **DSGVO / EU-Region:** Für Kanzlei-Daten eine EU-Region verwenden
> (z. B. `eu-central-1` Frankfurt). Bedrock in EU-Regionen nutzt in der Regel
> **Cross-Region Inference Profiles** mit `eu.`-Präfix — siehe
> `BEDROCK_INFERENCE_PROFILE_PREFIX` unten.

## 2. IAM-Berechtigung

Die ausführende Identität (IAM-Rolle des Servers/Instance-Profile oder ein
IAM-User) benötigt mindestens:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

`Resource` kann bei Bedarf auf die konkreten Modell-/Inference-Profile-ARNs
eingeschränkt werden.

## 3. ENV setzen

```bash
# Schalter ein
AI_BEDROCK_ENABLED=true

# EU-Region für DSGVO
AWS_BEDROCK_REGION=eu-central-1

# Cross-Region Inference Profile in der EU → eu.-Präfix vor die Modell-ID
BEDROCK_INFERENCE_PROFILE_PREFIX=eu
```

Credentials kommen aus der normalen AWS-Kette:

| Variante                        | ENV                                                         |
|---------------------------------|------------------------------------------------------------|
| IAM-Rolle / Instance-Profile    | *keine* — automatisch (empfohlen in Production)            |
| Statische Keys                  | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`               |
| Temporäre STS-Credentials       | zusätzlich `AWS_SESSION_TOKEN`                              |
| Lokales Profil (Dev)            | `AWS_PROFILE`                                              |

Ist `AI_BEDROCK_ENABLED=true`, wird **kein** `ANTHROPIC_API_KEY` benötigt.

## 4. Modell-ID-Mapping

Die aktive Anthropic-Modell-ID wird automatisch auf die passende Bedrock-ID
gemappt. Optional lässt sich die Bedrock-ID mit `BEDROCK_ANTHROPIC_MODEL` fix
überschreiben.

| Anthropic-Modell-ID (`ANTHROPIC_CHAT_MODEL`) | Bedrock-ID (Basis)                             |
|----------------------------------------------|------------------------------------------------|
| `claude-sonnet-4-5-20250929`                 | `anthropic.claude-sonnet-4-5-20250929-v1:0`    |
| `claude-sonnet-4-6-20260217`                 | `anthropic.claude-sonnet-4-6-20260217-v1:0`    |
| *(sonstige)*                                 | `anthropic.<id>-v1:0` (generischer Fallback)   |

Mit `BEDROCK_INFERENCE_PROFILE_PREFIX=eu` wird der EU-Präfix vorangestellt,
z. B. `eu.anthropic.claude-sonnet-4-5-20250929-v1:0`.

## 5. Deploy

Nach dem Setzen der ENV-Variablen normal deployen. Zum Zurückschalten auf die
direkte Anthropic-API genügt `AI_BEDROCK_ENABLED=false` (bzw. Variable
entfernen) + vorhandener `ANTHROPIC_API_KEY`.
