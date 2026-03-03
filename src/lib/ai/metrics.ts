import { ModelType } from "@/types/ai"

export function logModelMetric(params: {
  model: ModelType
  durationMs: number
  tokensUsed: number
  success: boolean
}): void {
  console.info("[AI-Metrics]", {
    model: params.model,
    durationMs: params.durationMs,
    tokensUsed: params.tokensUsed,
    success: params.success,
    timestamp: new Date().toISOString()
  })
}
