import { ModelType, type AIProviderConfig } from "@/types/ai"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

function geminiModelId(): string {
  // Default: gemini-2.5-pro. gemini-1.5-pro ist deprecated.
  // Override via Env-Variable GEMINI_CHAT_MODEL möglich (z.B. "gemini-2.5-flash" für höheren Durchsatz).
  return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-pro"
}

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
    if (!this.config.apiKey.trim()) {
      throw new Error("GEMINI_API_KEY ist nicht gesetzt.")
    }

    return this.withRetry(async () => {
      const geminiModule = await import("@google/generative-ai")
      const client = new geminiModule.GoogleGenerativeAI(this.config.apiKey)
      // Gemini default ohne maxOutputTokens cappt bei ~8192 → für Risk-Stage zu wenig.
      // Wir geben explizit das Stage-Limit (vom Pipeline-Layer übergeben) durch.
      // Bei nicht gesetztem maxTokens fallback auf 16384 als Sicherheitsnetz.
      const maxOutputTokens = input.maxTokens ?? 16384
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
      const prompt = input.jsonMode
        ? `${input.prompt}\n\n${input.documentText}\n\nAntworte nur mit JSON.`
        : `${input.prompt}\n\n${input.documentText}`
      const response = await model.generateContent(prompt)
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
        const model = client.getGenerativeModel({ model: geminiModelId() })
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
