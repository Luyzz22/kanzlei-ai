import type { AIProviderConfig, ModelType } from "@/types/ai"

export interface AnalyzeInput {
  prompt: string
  documentText: string
  /** Strikte JSON-Ausgabe anfordern (Anbieter-spezifisch). */
  jsonMode?: boolean
}

export interface AIAnalysisResponse {
  model: ModelType
  outputText: string
  parsedOutput: Record<string, unknown>
  tokensUsed: number
  raw: unknown
}

export interface AIProvider {
  analyze(input: AnalyzeInput): Promise<AIAnalysisResponse>
  stream(input: AnalyzeInput): AsyncIterable<unknown>
  estimateTokens(text: string): number
}

export abstract class BaseAIProvider implements AIProvider {
  protected readonly maxRetries: number

  protected constructor(protected readonly config: AIProviderConfig) {
    this.maxRetries = config.maxRetries ?? 3
  }

  abstract analyze(input: AnalyzeInput): Promise<AIAnalysisResponse>

  abstract stream(input: AnalyzeInput): AsyncIterable<unknown>

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  protected async withRetry<T>(operation: () => Promise<T>, providerName: string): Promise<T> {
    let lastError: unknown

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const message = error instanceof Error ? error.message : "Unbekannter Fehler"
        const isRateLimited = message.toLowerCase().includes("rate") || message.includes("429")
        const backoffMs = isRateLimited ? 500 * 2 ** (attempt - 1) : 300 * attempt

        console.warn(`[AI:${providerName}] Versuch ${attempt}/${this.maxRetries} fehlgeschlagen.`, {
          message,
          backoffMs,
          isRateLimited
        })

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`[AI:${providerName}] Fehler ohne Error-Objekt nach Retry.`)
  }

  protected parseJsonSafely(outputText: string): Record<string, unknown> {
    try {
      return JSON.parse(outputText) as Record<string, unknown>
    } catch {
      return { rawText: outputText }
    }
  }
}
