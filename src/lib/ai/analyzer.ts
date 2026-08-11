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
import {
  authorizeAiRequest,
  PolicyViolationError,
  type AuthorizedAiRequest
} from "@/lib/compliance/model-gateway"
import type { SensitivityClass } from "@/lib/compliance/policy-decision"
import type { AnalysisResult, DocumentMetadata } from "@/types/ai"

/**
 * Pflichtkontext für jede Analyse.
 *
 * Bewusst **nicht optional**: der Analyzer ist der gemeinsame Einstieg der
 * Routen `analyze`, `analyze-quick` und `compare`. Wäre der Kontext optional,
 * könnte ein künftiger Aufrufer ihn weglassen und damit den Policy Decision
 * Point umgehen. So erzwingt der Compiler, dass jeder Aufrufer die Datenklasse
 * benennt.
 */
export interface AnalyzeAuthContext {
  classification: SensitivityClass
  tenantId: string
  actorId: string
  useCase: string
}

export async function analyzeWithRouter(
  metadata: DocumentMetadata,
  prompt: string,
  documentText: string,
  context: AnalyzeAuthContext
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
  let chain = getFilteredExecutionChain(metadata)
  if (chain.length === 0) {
    throw new ProviderConfigurationError(
      "Kein KI-Anbieter mit gültigem API-Schlüssel verfügbar. Bitte mindestens einen Anbieter konfigurieren."
    )
  }

  // ── Policy Decision Point ────────────────────────────────────────────────
  let authorized: AuthorizedAiRequest
  try {
    authorized = await authorizeAiRequest({
      classification: context.classification,
      tenantId: context.tenantId,
      actorId: context.actorId,
      useCase: context.useCase
    })
  } catch (err) {
    if (err instanceof PolicyViolationError) {
      throw new ProviderConfigurationError(
        `Analyse durch KI-Richtlinie blockiert: ${err.decision.reason}`
      )
    }
    throw err
  }

  // Die Fallback-Kette darf die Entscheidung nicht überholen.
  chain = chain.filter((m) => m === authorized.modelType)
  if (chain.length === 0) {
    throw new ProviderConfigurationError(
      `Kein zugelassener Transport (Policy: ${authorized.decision.action}, ` +
        `Grund: ${authorized.decision.reason}).`
    )
  }

  const fallbackUsed: AnalysisResult["fallbackUsed"] = []

  for (const model of chain) {
    try {
      const provider = createProvider(model)
      // TODO: Nach Vercel Pro-Upgrade maxTokens auf 16384 erhoehen
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
  jobs: Array<{
    metadata: DocumentMetadata
    prompt: string
    documentText: string
    context: AnalyzeAuthContext
  }>
): Promise<AnalysisResult[]> {
  return Promise.all(
    jobs.map((job) => analyzeWithRouter(job.metadata, job.prompt, job.documentText, job.context))
  )
}
