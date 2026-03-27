import { ModelType, type AIProviderConfig } from "@/types/ai"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

function extractClaudeText(content: Array<{ text?: string }>): string {
  const firstBlock = content[0]
  return firstBlock?.text ?? ""
}

function claudeModelId(): string {
  return process.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-3-5-sonnet-latest"
}

export class ClaudeProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "",
      model: ModelType.CLAUDE_SONNET_4,
      timeoutMs: config?.timeoutMs ?? 45_000,
      maxRetries: config?.maxRetries ?? 3
    })
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey.trim()) {
      throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt.")
    }

    return this.withRetry(async () => {
      const anthropicModule = await import("@anthropic-ai/sdk")
      const Anthropic = anthropicModule.default
      const client = new Anthropic({ apiKey: this.config.apiKey })

      const userContent = input.jsonMode
        ? `${input.prompt}\n\n${input.documentText}\n\nAntworte ausschließlich mit einem gültigen JSON-Objekt ohne Markdown oder Erklärtext.`
        : `${input.prompt}\n\n${input.documentText}`

      const response = await client.messages.create({
        model: claudeModelId(),
        max_tokens: 4096,
        temperature: 0.2,
        messages: [{ role: "user", content: userContent }]
      })

      const outputText = extractClaudeText(response.content)

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
        raw: response
      }
    }, "claude")
  }

  async *stream(input: AnalyzeInput): AsyncGenerator<string> {
    const result = await this.analyze(input)
    yield result.outputText
  }
}
