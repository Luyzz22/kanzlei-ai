import { ModelType } from "@/types/ai"

import { ClaudeProvider } from "./claude-provider"
import { GeminiProvider } from "./gemini-provider"
import { OpenAIProvider } from "./openai-provider"
import type { AIProvider } from "./types"

export function createProvider(model: ModelType): AIProvider {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return new ClaudeProvider()
    case ModelType.GEMINI_2_5_PRO:
      return new GeminiProvider()
    case ModelType.GPT_4O_MINI:
    default:
      return new OpenAIProvider()
  }
}
