import { ModelType, type AIProviderConfig } from "@/types/ai"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

export class GeminiProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.GEMINI_API_KEY ?? "",
      model: ModelType.GEMINI_2_5_PRO,
      timeoutMs: config?.timeoutMs ?? 60_000,
      maxRetries: config?.maxRetries ?? 3
    })
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    return this.withRetry(async () => {
      const geminiModule = await import("@google/generative-ai")
      const client = new geminiModule.GoogleGenerativeAI(this.config.apiKey)
      const model = client.getGenerativeModel({ model: "gemini-1.5-pro" })
      const response = await model.generateContent(`${input.prompt}\n\n${input.documentText}`)
      const outputText = response.response.text()

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed: this.estimateTokens(outputText) + this.estimateTokens(input.documentText),
        raw: response.response
      }
    }, "gemini")
  }

  async *stream(input: AnalyzeInput): AsyncGenerator<string> {
    let lastError: unknown

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const geminiModule = await import("@google/generative-ai")
        const client = new geminiModule.GoogleGenerativeAI(this.config.apiKey)
        const model = client.getGenerativeModel({ model: "gemini-1.5-pro" })
        const streamResult = await model.generateContentStream(`${input.prompt}\n\n${input.documentText}`)

        for await (const chunk of streamResult.stream) {
          yield chunk.text()
        }

        return
      } catch (error) {
        lastError = error
        const backoffMs = 500 * 2 ** (attempt - 1)
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Gemini-Streaming fehlgeschlagen.")
  }
}
