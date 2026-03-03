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

export class OpenAIProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      apiKey: config?.apiKey ?? process.env.OPENAI_API_KEY ?? "",
      model: ModelType.GPT_4O_MINI,
      timeoutMs: config?.timeoutMs ?? 45_000,
      maxRetries: config?.maxRetries ?? 3
    })
  }

  async analyze(input: AnalyzeInput): Promise<AIAnalysisResponse> {
    return this.withRetry(async () => {
      const client = new OpenAI({ apiKey: this.config.apiKey })

      const response = (await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [{ role: "user", content: `${input.prompt}\n\n${input.documentText}` }]
      })) as ChatCompletion

      const outputText: string = extractOpenAIContent(response)

      return {
        model: this.config.model,
        outputText,
        parsedOutput: this.parseJsonSafely(outputText),
        tokensUsed: response.usage?.total_tokens ?? this.estimateTokens(outputText),
        raw: response
      }
    }, "openai")
  }

  async *stream(input: AnalyzeInput): AsyncIterable<ChatCompletionChunk> {
    const client = new OpenAI({ apiKey: this.config.apiKey })

    const streamResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.2,
      messages: [{ role: "user", content: `${input.prompt}\n\n${input.documentText}` }]
    })

    if (!isChatCompletionStream(streamResponse)) {
      throw new Error("Streaming wird vom OpenAI-Client nicht als AsyncIterable bereitgestellt.")
    }

    for await (const chunk of streamResponse) {
      yield chunk
    }
  }
}
