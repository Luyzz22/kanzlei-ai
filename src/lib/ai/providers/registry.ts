import { ModelType } from "@/types/ai"

import { ClaudeProvider } from "./claude-provider"
import { GeminiProvider } from "./gemini-provider"
import { LlamaCompatProvider } from "./llama-provider"
import { OpenAIProvider } from "./openai-provider"
import type { AIProvider } from "./types"

export class MissingProviderKeyError extends Error {
  readonly code = "MISSING_PROVIDER_KEY"
  constructor(
    readonly provider: string,
    message?: string
  ) {
    super(message ?? `API-Schlüssel für ${provider} ist nicht gesetzt.`)
    this.name = "MissingProviderKeyError"
  }
}

export function createProvider(model: ModelType): AIProvider {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return new ClaudeProvider()
    case ModelType.GEMINI_2_5_PRO:
      return new GeminiProvider()
    case ModelType.LLAMA_COMPAT:
      return new LlamaCompatProvider()
    case ModelType.GPT_4O_MINI:
    default:
      return new OpenAIProvider()
  }
}
