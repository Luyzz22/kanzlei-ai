import { ModelType } from "@/types/ai"

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export function isLlamaCompatConfigured(): boolean {
  const key = process.env.LLAMA_API_KEY?.trim()
  const base = process.env.LLAMA_API_BASE?.trim()
  return Boolean(key && base)
}

export function getAvailableModelTypes(): ModelType[] {
  const out: ModelType[] = []
  if (isOpenAiConfigured()) out.push(ModelType.GPT_4O_MINI)
  if (isAnthropicConfigured()) out.push(ModelType.CLAUDE_SONNET_4)
  if (isGeminiConfigured()) out.push(ModelType.GEMINI_2_5_PRO)
  if (isLlamaCompatConfigured()) out.push(ModelType.LLAMA_COMPAT)
  return out
}

export function isModelTypeAvailable(model: ModelType): boolean {
  switch (model) {
    case ModelType.GPT_4O_MINI:
      return isOpenAiConfigured()
    case ModelType.CLAUDE_SONNET_4:
      return isAnthropicConfigured()
    case ModelType.GEMINI_2_5_PRO:
      return isGeminiConfigured()
    case ModelType.LLAMA_COMPAT:
      return isLlamaCompatConfigured()
    default:
      return false
  }
}

export function filterModelsByAvailability(models: ModelType[]): ModelType[] {
  return models.filter((m) => isModelTypeAvailable(m))
}

/** Priorität aus ENV, z. B. "openai,anthropic,gemini,llama" */
export function parseProviderPriorityOrder(): string[] {
  const raw = process.env.AI_PROVIDER_PRIORITY?.trim()
  if (!raw) return ["openai", "anthropic", "gemini", "llama"]
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function modelToProviderKey(model: ModelType): string {
  switch (model) {
    case ModelType.GPT_4O_MINI:
      return "openai"
    case ModelType.CLAUDE_SONNET_4:
      return "anthropic"
    case ModelType.GEMINI_2_5_PRO:
      return "gemini"
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
