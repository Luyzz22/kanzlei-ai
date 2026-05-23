import { ModelType, type AIProviderConfig } from "@/types/ai"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

function geminiModelId(): string {
  return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-pro"
}

function buildGeminiPrompt(input: AnalyzeInput): string {
  const docBlock = input.documentText?.trim()
    ? `\n\nVERTRAGSTEXT:\n${input.documentText.trim()}`
    : ""
  const jsonSuffix = input.jsonMode ? "\n\nAntworte nur mit JSON." : ""
  return `${input.prompt}${docBlock}${jsonSuffix}`
}

export class GeminiProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.GEMINI_API_KEY ?? "",
      model: ModelType.GEMINI_2_5_PRO,
      timeoutMs: config?.timeoutMs ?? 120_000,
      maxRetries: config?.maxRetries ?? 2
    })
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey.trim()) {
      throw new Error("GEMINI_API_KEY ist nicht gesetzt.")
    }

    return this.withRetry(async () => {
      const geminiModule = await import("@google/generative-ai")
      const client = new geminiModule.GoogleGenerativeAI(this.config.apiKey)
      const maxOutputTokens = input.maxTokens ?? 16_384
      const model = client.getGenerativeModel({
        model: geminiModelId(),
        generationConfig: input.jsonMode
          ? {
              temperature: 0.2,
              responseMimeType: "application/json",
              maxOutputTokens
            }
          : { temperature: 0.2, maxOutputTokens }
      } as Parameters<typeof client.getGenerativeModel>[0])

      const response = await model.generateContent(buildGeminiPrompt(input))
      const outputText = response.response.text()

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed:
          (response.response.usageMetadata?.totalTokenCount as number | undefined) ??
          this.estimateTokens(outputText) + this.estimateTokens(input.documentText),
        stopReason: null,
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
        const model = client.getGenerativeModel({ model: geminiModelId() })
        const streamResult = await model.generateContentStream(buildGeminiPrompt(input))

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
