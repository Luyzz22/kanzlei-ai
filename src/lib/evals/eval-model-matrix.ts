import { ModelType } from "@/types/ai"
import { AiProviderKind } from "@prisma/client"

const ALIASES: Record<string, ModelType> = {
  "gpt-4o-mini": ModelType.GPT_4O_MINI,
  gpt4omini: ModelType.GPT_4O_MINI,
  openai: ModelType.GPT_4O_MINI,
  "claude-sonnet-4": ModelType.CLAUDE_SONNET_4,
  claude: ModelType.CLAUDE_SONNET_4,
  anthropic: ModelType.CLAUDE_SONNET_4,
  "gemini-2.5-pro": ModelType.GEMINI_2_5_PRO,
  gemini: ModelType.GEMINI_2_5_PRO,
  "llama-compat": ModelType.LLAMA_COMPAT,
  llama: ModelType.LLAMA_COMPAT
}

/** CSV aus EVAL_MODEL_MATRIX oder --matrix= (Komma / Semikolon / Leerzeichen). */
export function parseModelTypeList(raw: string | undefined | null): ModelType[] {
  if (!raw?.trim()) return []
  const seen = new Set<ModelType>()
  const out: ModelType[] = []
  for (const part of raw.split(/[,;\s]+/)) {
    const t = part.trim().toLowerCase()
    if (!t) continue
    const direct = Object.values(ModelType).find((v) => v === t)
    const mapped = direct ?? ALIASES[t]
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped)
      out.push(mapped)
    }
  }
  return out
}

export function modelTypeToProviderKind(model: ModelType): AiProviderKind {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return AiProviderKind.ANTHROPIC
    case ModelType.GEMINI_2_5_PRO:
      return AiProviderKind.GOOGLE_GEMINI
    case ModelType.LLAMA_COMPAT:
      return AiProviderKind.LLAMA_COMPAT
    case ModelType.GPT_4O_MINI:
    default:
      return AiProviderKind.OPENAI
  }
}

export function providerKindToShortLabel(kind: AiProviderKind): string {
  switch (kind) {
    case AiProviderKind.ANTHROPIC:
      return "ANTHROPIC"
    case AiProviderKind.GOOGLE_GEMINI:
      return "GOOGLE_GEMINI"
    case AiProviderKind.LLAMA_COMPAT:
      return "LLAMA_COMPAT"
    case AiProviderKind.OPENAI:
    default:
      return "OPENAI"
  }
}
