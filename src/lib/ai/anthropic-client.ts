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
/**
 * AWS-Regionen in EU-Mitgliedstaaten.
 *
 * Bewusst OHNE `eu-west-2` (London) und `eu-central-2` (Zürich): beide tragen
 * das `eu-`Präfix, liegen aber nicht in einem EU-Mitgliedstaat. Für sie wäre
 * nach § 43e Abs. 4 BRAO ein eigener Nachweis „vergleichbaren
 * Geheimnisschutzes" zu führen — das ist eine bewusste Einzelfallentscheidung
 * und darf nicht durch ein Präfix-Matching hereinrutschen.
 */
export const EU_BEDROCK_REGIONS = [
  "eu-central-1", // Frankfurt
  "eu-west-1", // Irland
  "eu-west-3", // Paris
  "eu-north-1", // Stockholm
  "eu-south-1", // Mailand
  "eu-south-2" // Spanien
] as const

export class BedrockRegionPolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BedrockRegionPolicyError"
  }
}

/**
 * Ermittelt die Bedrock-Region und erzwingt EU-Datenresidenz.
 *
 * Fail closed (Compliance-Handoff, Invariante 7 „unklare Datenresidenz →
 * blockieren"): Es gibt bewusst KEINEN Default. Eine fehlende oder nicht-EU
 * Region wirft, statt still auf eine US-Region zurückzufallen — Bedrock ist
 * nach ADR-0001 der externe Pfad für Mandatsdaten.
 */
export function resolveBedrockRegion(): string {
  const configured =
    process.env.AWS_BEDROCK_REGION?.trim() || process.env.AWS_REGION?.trim() || ""

  if (!configured) {
    throw new BedrockRegionPolicyError(
      "AWS_BEDROCK_REGION ist nicht gesetzt. Bedrock ist der externe Mandatspfad und " +
        `erfordert eine explizite EU-Region (${EU_BEDROCK_REGIONS.join(", ")}). ` +
        "Es gibt keinen Default — unklare Datenresidenz blockiert."
    )
  }

  if (!(EU_BEDROCK_REGIONS as readonly string[]).includes(configured)) {
    throw new BedrockRegionPolicyError(
      `AWS_BEDROCK_REGION="${configured}" liegt nicht in einem EU-Mitgliedstaat. ` +
        `Zulässig: ${EU_BEDROCK_REGIONS.join(", ")}.`
    )
  }

  return configured
}

export async function createAnthropicClient(opts?: {
  apiKey?: string
  defaultHeaders?: Record<string, string>
}): Promise<AnthropicLike> {
  if (isBedrockEnabled()) {
    const { AnthropicBedrock } = await import("@anthropic-ai/bedrock-sdk")
    const bedrockOptions: Record<string, string> = {
      awsRegion: resolveBedrockRegion()
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
