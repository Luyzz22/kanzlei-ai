import { ModelType, type AIProviderConfig } from "@/types/ai"

import {
  anthropicBetaHeaders,
  anthropicChatModelId,
  resolveAnthropicModelProfile
} from "@/lib/ai/claude-model-config"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

function extractClaudeText(content: Array<{ text?: string }>): string {
  const firstBlock = content[0]
  return firstBlock?.text ?? ""
}

function stripMarkdownCodeFences(text: string): string {
  const t = text.trim()
  const fence = /`{3,4}(?:json|JSON)?\s*\n([\s\S]+?)\n\s*`{3,4}/.exec(t)
  if (fence?.[1]) return fence[1].trim()
  return t
}

function buildClaudeUserContent(input: AnalyzeInput): string {
  const docBlock = input.documentText?.trim()
    ? `\n\nVERTRAGSTEXT:\n${input.documentText.trim()}`
    : ""
  const jsonSuffix = input.jsonMode
    ? "\n\nAntworte ausschließlich mit einem gültigen JSON-Objekt ohne Markdown oder Erklärtext."
    : ""
  return `${input.prompt}${docBlock}${jsonSuffix}`
}

export class ClaudeProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "",
      model: ModelType.CLAUDE_SONNET_4,
      timeoutMs: config?.timeoutMs ?? 280_000,
      maxRetries: config?.maxRetries ?? 2
    })
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey.trim()) {
      throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt.")
    }

    const profile = resolveAnthropicModelProfile()
    const maxTokens = input.maxTokens ?? 8192
    const betaHeaders = anthropicBetaHeaders(maxTokens)

    if (profile.wasAliasResolved) {
      console.info("[ClaudeProvider] Alias auf Snapshot gemappt:", {
        configured: profile.configuredId,
        resolved: profile.modelId
      })
    }

    return this.withRetry(async () => {
      const anthropicModule = await import("@anthropic-ai/sdk")
      const Anthropic = anthropicModule.default
      const client = new Anthropic({ apiKey: this.config.apiKey })

      const response = await client.messages.create({
        model: anthropicChatModelId(),
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [{ role: "user", content: buildClaudeUserContent(input) }],
        ...(betaHeaders ? { betas: [betaHeaders["anthropic-beta"]!] } : {})
      } as Parameters<typeof client.messages.create>[0])

      const anthropicResponse = response as unknown as {
        content: Array<{ text?: string }>
        usage?: { input_tokens?: number; output_tokens?: number }
        stop_reason?: string
      }
      const rawText = extractClaudeText(anthropicResponse.content)
      const outputText = input.jsonMode ? stripMarkdownCodeFences(rawText) : rawText

      const stopReason =
        typeof anthropicResponse.stop_reason === "string" ? anthropicResponse.stop_reason : null

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed:
          (anthropicResponse.usage?.input_tokens ?? 0) +
          (anthropicResponse.usage?.output_tokens ?? 0),
        stopReason,
        raw: response
      }
    }, "claude")
  }

  async *stream(input: AnalyzeInput): AsyncGenerator<string> {
    const result = await this.analyze(input)
    yield result.outputText
  }
}
