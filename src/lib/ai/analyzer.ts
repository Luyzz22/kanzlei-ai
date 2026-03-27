import { createHash } from "node:crypto"

import { getCached, setCached } from "@/lib/ai/cache"
import { calculateCost } from "@/lib/ai/cost-tracker"
import { logModelMetric } from "@/lib/ai/metrics"
import {
  assertAnyProviderConfigured,
  getFilteredExecutionChain,
  getSelectionReason,
  logModelSelection,
  ProviderConfigurationError,
  selectOptimalModel
} from "@/lib/ai/model-router"
import { createProvider } from "@/lib/ai/providers"
import type { AnalysisResult, DocumentMetadata } from "@/types/ai"

export async function analyzeWithRouter(
  metadata: DocumentMetadata,
  prompt: string,
  documentText: string
): Promise<AnalysisResult> {
  const cacheKey = createHash("sha256")
    .update(`${metadata.documentId}:${metadata.analysisType}:${documentText}`)
    .digest("hex")

  const cached = getCached<AnalysisResult>(cacheKey)
  if (cached) {
    return cached
  }

  const startedAt = Date.now()
  const primaryModel = selectOptimalModel(metadata)
  logModelSelection(metadata, primaryModel)
  assertAnyProviderConfigured()
  const chain = getFilteredExecutionChain(metadata)
  if (chain.length === 0) {
    throw new ProviderConfigurationError(
      "Kein KI-Anbieter mit gültigem API-Schlüssel verfügbar. Bitte mindestens einen Anbieter konfigurieren."
    )
  }
  const fallbackUsed: AnalysisResult["fallbackUsed"] = []

  for (const model of chain) {
    try {
      const provider = createProvider(model)
      const response = await provider.analyze({ prompt, documentText })
      logModelMetric({
        model,
        durationMs: Date.now() - startedAt,
        tokensUsed: response.tokensUsed,
        success: true
      })
      const result: AnalysisResult = {
        modelUsed: model,
        analysis: response.parsedOutput,
        tokensUsed: response.tokensUsed,
        costEstimate: calculateCost(model, response.tokensUsed),
        processingTime: Date.now() - startedAt,
        fallbackUsed
      }
      setCached(cacheKey, result)
      return result
    } catch {
      logModelMetric({ model, durationMs: Date.now() - startedAt, tokensUsed: 0, success: false })
      fallbackUsed.push(model)
    }
  }

  throw new Error(`Kein Modell konnte die Analyse erfolgreich ausführen (${getSelectionReason(primaryModel)}).`)
}

export async function analyzeMultipleInParallel(
  jobs: Array<{ metadata: DocumentMetadata; prompt: string; documentText: string }>
): Promise<AnalysisResult[]> {
  return Promise.all(jobs.map((job) => analyzeWithRouter(job.metadata, job.prompt, job.documentText)))
}
