export enum ModelType {
  CLAUDE_SONNET_4 = "claude-sonnet-4",
  GEMINI_2_5_PRO = "gemini-2.5-pro",
  GPT_4O_MINI = "gpt-4o-mini"
}

export enum AnalysisType {
  CONTRACT = "contract",
  SUMMARY = "summary",
  RISK = "risk",
  CLAUSE = "clause",
  COMPLIANCE = "compliance"
}

export interface DocumentMetadata {
  documentId: string
  documentLength: number
  analysisType: AnalysisType
  hasVisualElements?: boolean
  complexity?: "niedrig" | "mittel" | "hoch"
  mimeType?: string
}

export interface AnalysisResult {
  modelUsed: ModelType
  analysis: Record<string, unknown>
  tokensUsed: number
  costEstimate: number
  processingTime: number
  fallbackUsed?: ModelType[]
}

export interface AIProviderConfig {
  apiKey: string
  model: ModelType
  timeoutMs?: number
  maxRetries?: number
}
