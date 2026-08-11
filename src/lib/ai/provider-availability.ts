import { claudeConfigured } from "@/lib/ai/anthropic-client"
import { ModelType } from "@/types/ai"

/**
 * Nach ADR-0001 stillgelegte Anbieter.
 *
 * Die ModelType-Werte bleiben im Enum: historische `AnalysisProviderDecision`-
 * Datensätze, Eval-Matrizen und Kostentabellen referenzieren sie und müssen
 * lesbar bleiben. Routbar sind sie jedoch nicht mehr — weder verfügbar
 * (`isModelTypeAvailable`) noch instanziierbar (`createProvider`).
 */
const RETIRED_MODEL_TYPES: ReadonlySet<ModelType> = new Set([
  ModelType.GPT_4O_MINI,
  ModelType.GEMINI_2_5_PRO
])

export function isModelTypeRetired(model: ModelType): boolean {
  return RETIRED_MODEL_TYPES.has(model)
}

/**
 * Claude ist konfiguriert, wenn entweder ein Anthropic-Key vorliegt ODER
 * Bedrock aktiv ist (dann übernimmt die AWS-Credential-Kette). Ein reiner
 * `ANTHROPIC_API_KEY`-Check würde Claude im Bedrock-Betrieb fälschlich als
 * nicht verfügbar melden und das Routing leerlaufen lassen.
 */
export function isAnthropicConfigured(): boolean {
  return claudeConfigured()
}

export function isLlamaCompatConfigured(): boolean {
  const key = process.env.LLAMA_API_KEY?.trim()
  const base = process.env.LLAMA_API_BASE?.trim()
  return Boolean(key && base)
}

export function getAvailableModelTypes(): ModelType[] {
  const out: ModelType[] = []
  if (isAnthropicConfigured()) out.push(ModelType.CLAUDE_SONNET_4)
  if (isLlamaCompatConfigured()) out.push(ModelType.LLAMA_COMPAT)
  return out
}

export function isModelTypeAvailable(model: ModelType): boolean {
  if (isModelTypeRetired(model)) return false
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return isAnthropicConfigured()
    case ModelType.LLAMA_COMPAT:
      return isLlamaCompatConfigured()
    default:
      return false
  }
}

export function filterModelsByAvailability(models: ModelType[]): ModelType[] {
  return models.filter((m) => isModelTypeAvailable(m))
}

/** Priorität aus ENV, z. B. "anthropic,llama". Stillgelegte Anbieter werden ignoriert. */
export function parseProviderPriorityOrder(): string[] {
  const raw = process.env.AI_PROVIDER_PRIORITY?.trim()
  if (!raw) return ["anthropic", "llama"]
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function modelToProviderKey(model: ModelType): string {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return "anthropic"
    case ModelType.LLAMA_COMPAT:
      return "llama"
    default:
      return ""
  }
}

export function sortModelsByProviderPriority(models: ModelType[]): ModelType[] {
  const order = parseProviderPriorityOrder()
  const rank = (m: ModelType) => {
    const idx = order.indexOf(modelToProviderKey(m))
    return idx === -1 ? 999 : idx
  }
  return [...models].sort((a, b) => rank(a) - rank(b))
}
