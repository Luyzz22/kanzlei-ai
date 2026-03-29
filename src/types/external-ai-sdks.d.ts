declare module "@anthropic-ai/sdk" {
  interface MessageUsage {
    input_tokens?: number
    output_tokens?: number
  }

  interface ContentBlockDelta {
    type: "content_block_delta"
    delta: { text: string }
  }

  interface MessageResponse {
    content: Array<{ text?: string }>
    usage?: MessageUsage
  }

  interface MessageStream {
    [Symbol.asyncIterator](): AsyncIterator<ContentBlockDelta | { type: string }>
    finalMessage(): Promise<MessageResponse>
  }

  export default class Anthropic {
    constructor(config: { apiKey: string })
    messages: {
      create(input: {
        model: string
        max_tokens: number
        temperature?: number
        messages: Array<{ role: "user" | "assistant"; content: string }>
      }): Promise<MessageResponse>
      stream(input: {
        model: string
        max_tokens: number
        temperature?: number
        system?: string
        messages: Array<{ role: "user" | "assistant"; content: string }>
      }): Promise<MessageStream>
    }
  }
}

declare module "@google/generative-ai" {
  class GenerativeModel {
    generateContent(input: string): Promise<{ response: { text(): string } }>
    generateContentStream(input: string): Promise<{
      stream: AsyncIterable<{ text(): string }>
    }>
  }

  export class GoogleGenerativeAI {
    constructor(apiKey: string)
    getGenerativeModel(params: { model: string }): GenerativeModel
  }
}

declare module "openai" {
  class OpenAI {
    constructor(config: { apiKey: string })
    chat: {
      completions: {
        create(input: {
          model: string
          temperature?: number
          max_tokens?: number
          stream?: boolean
          messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
        }): Promise<
          | OpenAI.Chat.Completions.ChatCompletion
          | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
        >
      }
    }
  }

  namespace OpenAI {
    namespace Chat {
      namespace Completions {
        interface ChatCompletion {
          choices: Array<{ message?: { content?: string } }>
          usage?: { total_tokens?: number }
        }

        interface ChatCompletionChunk {
          choices: Array<{ delta?: { content?: string } }>
        }
      }
    }
  }

  export default OpenAI
}
