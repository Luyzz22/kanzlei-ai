import { isBedrockEnabled } from "@/lib/ai/claude-model-config"

export interface AnthropicMessageResponse {
  content: Array<{ text?: string }>
  usage?: { input_tokens?: number; output_tokens?: number }
  stop_reason?: string
}
export interface AnthropicContentBlockDelta { type: "content_block_delta"; delta: { text: string } }
export type AnthropicStreamEvent = AnthropicContentBlockDelta | { type: string }
export interface AnthropicMessageStream extends AsyncIterable<AnthropicStreamEvent> {
  finalMessage(): Promise<AnthropicMessageResponse>
}
export interface AnthropicMessageCreateParams {
  model: string
  max_tokens: number
  temperature?: number
  system?: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
}
export interface AnthropicLike {
  messages: {
    create(input: AnthropicMessageCreateParams): Promise<AnthropicMessageResponse>
    stream(input: AnthropicMessageCreateParams): Promise<AnthropicMessageStream>
  }
}
export type AnthropicBackend = "direct" | "bedrock"
export function anthropicBackend(): AnthropicBackend {
  return isBedrockEnabled() ? "bedrock" : "direct"
}
export function claudeConfigured(): boolean {
  if (isBedrockEnabled()) return true
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}
export async function createAnthropicClient(opts?: {
  apiKey?: string
  defaultHeaders?: Record<string, string>
}): Promise<AnthropicLike> {
  if (isBedrockEnabled()) {
    const { AnthropicBedrock } = await import("@anthropic-ai/bedrock-sdk")
    const bedrockOptions: Record<string, string> = {
      awsRegion:
        process.env.AWS_BEDROCK_REGION?.trim() ||
        process.env.AWS_REGION?.trim() ||
        "us-east-1"
    }
    if (process.env.AWS_ACCESS_KEY_ID) bedrockOptions.awsAccessKey = process.env.AWS_ACCESS_KEY_ID
    if (process.env.AWS_SECRET_ACCESS_KEY) bedrockOptions.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY
    if (process.env.AWS_SESSION_TOKEN) bedrockOptions.awsSessionToken = process.env.AWS_SESSION_TOKEN
    if (process.env.AWS_PROFILE) bedrockOptions.awsProfile = process.env.AWS_PROFILE
    const client = new AnthropicBedrock(
      bedrockOptions as unknown as ConstructorParameters<typeof AnthropicBedrock>[0]
    )
    return client as unknown as AnthropicLike
  }
  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? ""
  const client = new Anthropic({
    apiKey,
    ...(opts?.defaultHeaders ? { defaultHeaders: opts.defaultHeaders } : {})
  })
  return client as unknown as AnthropicLike
}
