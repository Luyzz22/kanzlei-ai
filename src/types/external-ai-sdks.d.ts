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
