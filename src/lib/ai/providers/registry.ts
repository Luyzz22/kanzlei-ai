import { isModelTypeRetired } from "@/lib/ai/provider-availability"
import { ModelType } from "@/types/ai"

import { ClaudeProvider } from "./claude-provider"
import { LlamaCompatProvider } from "./llama-provider"
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

/** Anbieter, der nach ADR-0001 stillgelegt wurde und nicht mehr aufgerufen werden darf. */
export class RetiredProviderError extends Error {
  readonly code = "RETIRED_PROVIDER"
  constructor(readonly model: ModelType) {
    super(
      `Provider für "${model}" wurde nach ADR-0001 stillgelegt. ` +
        "Zugelassen sind Claude (direkt oder über Bedrock EU) und der lokale " +
        "OpenAI-kompatible Endpunkt der souveränen Zone."
    )
    this.name = "RetiredProviderError"
  }
}

/**
 * Erzeugt den Transport für einen ModelType.
 *
 * Fail closed: Es gibt bewusst keinen Default-Zweig, der auf einen beliebigen
 * Anbieter zurückfällt. Ein unbekannter oder stillgelegter ModelType wirft,
 * statt still einen nicht freigegebenen Provider zu instanziieren.
 */
export function createProvider(model: ModelType): AIProvider {
  if (isModelTypeRetired(model)) throw new RetiredProviderError(model)

  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return new ClaudeProvider()
    case ModelType.LLAMA_COMPAT:
      return new LlamaCompatProvider()
    default:
      throw new RetiredProviderError(model)
  }
}
