import OpenAI from "openai"

import { ModelType, type AIProviderConfig } from "@/types/ai"

import { BaseAIProvider, type AIAnalysisResponse, type AnalyzeInput } from "./types"

type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion
type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk

function extractOpenAIContent(response: ChatCompletion): string {
  return response.choices[0]?.message?.content ?? ""
}

function isChatCompletionStream(value: unknown): value is AsyncIterable<ChatCompletionChunk> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in (value as Record<PropertyKey, unknown>)
  )
}

function chatModelId(): string {
  return process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o"
}

function buildOpenAIUserContent(input: AnalyzeInput): string {
  const docBlock = input.documentText?.trim()
    ? `\n\nVERTRAGSTEXT:\n${input.documentText.trim()}`
    : ""
  return `${input.prompt}${docBlock}`
}

export class OpenAIProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.OPENAI_API_KEY ?? "",
      model: ModelType.GPT_4O_MINI,
      timeoutMs: config?.timeoutMs ?? 120_000,
      maxRetries: config?.maxRetries ?? 2
    })
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    if (!this.config.apiKey.trim()) {
      throw new Error("OPENAI_API_KEY ist nicht gesetzt.")
    }

    return this.withRetry(async () => {
      const client = new OpenAI({ apiKey: this.config.apiKey })

      const response = (await client.chat.completions.create({
        model: chatModelId(),
        temperature: 0.2,
        max_tokens: input.maxTokens ?? 16_384,
        messages: [{ role: "user", content: buildOpenAIUserContent(input) }],
        ...(input.jsonMode ? { response_format: { type: "json_object" as const } } : {})
      })) as ChatCompletion

      const outputText = extractOpenAIContent(response)
      const finishReason = response.choices[0]?.finish_reason ?? null

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed: response.usage?.total_tokens ?? this.estimateTokens(outputText),
        stopReason: finishReason === "length" ? "max_tokens" : finishReason,
        raw: response
      }
    }, "openai")
  }

  async *stream(input: AnalyzeInput): AsyncIterable<ChatCompletionChunk> {
    const client = new OpenAI({ apiKey: this.config.apiKey })

    const streamResponse = await client.chat.completions.create({
      model: chatModelId(),
      stream: true,
      temperature: 0.2,
      messages: [{ role: "user", content: buildOpenAIUserContent(input) }]
    })

    if (!isChatCompletionStream(streamResponse)) {
      throw new Error("Streaming wird vom OpenAI-Client nicht als AsyncIterable bereitgestellt.")
    }

    for await (const chunk of streamResponse) {
      yield chunk
    }
  }
}
