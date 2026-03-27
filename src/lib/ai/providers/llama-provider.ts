import { ModelType, type AIProviderConfig } from "@/types/ai"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

type OpenAiCompatChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  usage?: { total_tokens?: number }
}

export class LlamaCompatProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.LLAMA_API_KEY ?? "",
      model: ModelType.LLAMA_COMPAT,
      timeoutMs: config?.timeoutMs ?? 90_000,
      maxRetries: config?.maxRetries ?? 2
    })
  }

  private get baseUrl(): string {
    const b = process.env.LLAMA_API_BASE?.trim()
    if (!b) throw new Error("LLAMA_API_BASE ist nicht gesetzt.")
    return b.replace(/\/$/, "")
  }

  private get deploymentModel(): string {
    return process.env.LLAMA_MODEL?.trim() || "meta-llama/Meta-Llama-3.1-8B-Instruct"
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey.trim()) {
      throw new Error("LLAMA_API_KEY ist nicht gesetzt.")
    }

    return this.withRetry(async () => {
      const body: Record<string, unknown> = {
        model: this.deploymentModel,
        temperature: 0.2,
        messages: [{ role: "user", content: `${input.prompt}\n\n${input.documentText}` }]
      }
      if (input.jsonMode) {
        body.response_format = { type: "json_object" }
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 90_000)

      let response: Response
      try {
        response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        })
      } finally {
        clearTimeout(timeout)
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "")
        throw new Error(`Llama-Endpunkt HTTP ${response.status}: ${errText.slice(0, 500)}`)
      }

      const data = (await response.json()) as OpenAiCompatChatResponse
      const outputText = data.choices?.[0]?.message?.content ?? ""

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed: data.usage?.total_tokens ?? this.estimateTokens(outputText) + this.estimateTokens(input.documentText),
        raw: data
      }
    }, "llama-compat")
  }

  async *stream(input: AnalyzeInput): AsyncGenerator<string> {
    const result = await this.analyze(input)
    yield result.outputText
  }
}
