import { AnalysisType, ModelType, type DocumentMetadata } from "@/types/ai"

import {
  filterModelsByAvailability,
  getAvailableModelTypes,
  isModelTypeAvailable,
  sortModelsByProviderPriority
} from "@/lib/ai/provider-availability"

export type PipelineStage = "EXTRACTION" | "RISK_AND_GUIDANCE"

export type RouterContext = {
  documentLength: number
  hasVisualElements?: boolean
  complexity?: "niedrig" | "mittel" | "hoch"
  mimeType?: string
  preferLocalOrPrivate?: boolean
}

function uniqueModels(models: ModelType[]): ModelType[] {
  return Array.from(new Set(models))
}

function longDocumentThreshold(): number {
  const raw = process.env.AI_LONG_DOCUMENT_CHAR_THRESHOLD
  if (raw && /^\d+$/.test(raw)) return Number.parseInt(raw, 10)
  return 50_000
}

function routerEnabled(): boolean {
  return process.env.AI_ROUTER_ENABLED !== "false"
}

function envModelToType(envName: string, fallback: ModelType): ModelType {
  const v = process.env[envName]?.trim().toLowerCase() ?? ""
  if (v.includes("claude") || v === "claude-sonnet-4") return ModelType.CLAUDE_SONNET_4
  if (v.includes("gemini")) return ModelType.GEMINI_2_5_PRO
  if (v.includes("gpt") || v.includes("openai")) return ModelType.GPT_4O_MINI
  if (v.includes("llama")) return ModelType.LLAMA_COMPAT
  return fallback
}

/**
 * Primärmodell für Pipeline-Stufen (ohne Verfügbarkeitsfilter).
 */
export function selectPrimaryModelForStage(stage: PipelineStage, ctx: RouterContext): ModelType {
  if (!routerEnabled()) {
    return envModelToType("DEFAULT_MODEL", ModelType.GPT_4O_MINI)
  }

  const longDoc = ctx.documentLength >= longDocumentThreshold()
  const sensitive = Boolean(ctx.preferLocalOrPrivate) || process.env.AI_SENSITIVE_USE_LLAMA === "true"

  if (sensitive) {
    return ModelType.LLAMA_COMPAT
  }

  if (stage === "EXTRACTION") {
    if (longDoc) {
      const long = envModelToType("LONG_DOCUMENT_MODEL", ModelType.GEMINI_2_5_PRO)
      return long === ModelType.GEMINI_2_5_PRO || long === ModelType.CLAUDE_SONNET_4 ? long : ModelType.GEMINI_2_5_PRO
    }
    const simple = envModelToType("SIMPLE_QUERY_MODEL", ModelType.GPT_4O_MINI)
    return simple === ModelType.GPT_4O_MINI ? ModelType.GPT_4O_MINI : simple
  }

  // RISK_AND_GUIDANCE — Klauselbegründung / Redlining: Claude bevorzugt
  if (longDoc) {
    return envModelToType("LONG_DOCUMENT_MODEL", ModelType.GEMINI_2_5_PRO)
  }
  return ModelType.CLAUDE_SONNET_4
}

export function getFallbackChainForStage(primary: ModelType, stage: PipelineStage): ModelType[] {
  if (stage === "EXTRACTION") {
    switch (primary) {
      case ModelType.GEMINI_2_5_PRO:
        return [ModelType.GPT_4O_MINI, ModelType.CLAUDE_SONNET_4, ModelType.LLAMA_COMPAT]
      case ModelType.GPT_4O_MINI:
        return [ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO, ModelType.LLAMA_COMPAT]
      case ModelType.CLAUDE_SONNET_4:
        return [ModelType.GPT_4O_MINI, ModelType.GEMINI_2_5_PRO, ModelType.LLAMA_COMPAT]
      case ModelType.LLAMA_COMPAT:
        return [ModelType.GPT_4O_MINI, ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO]
      default:
        return [ModelType.GPT_4O_MINI, ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO]
    }
  }

  switch (primary) {
    case ModelType.CLAUDE_SONNET_4:
      return [ModelType.GEMINI_2_5_PRO, ModelType.GPT_4O_MINI, ModelType.LLAMA_COMPAT]
    case ModelType.GEMINI_2_5_PRO:
      return [ModelType.CLAUDE_SONNET_4, ModelType.GPT_4O_MINI, ModelType.LLAMA_COMPAT]
    case ModelType.GPT_4O_MINI:
      return [ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO, ModelType.LLAMA_COMPAT]
    case ModelType.LLAMA_COMPAT:
      return [ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO, ModelType.GPT_4O_MINI]
    default:
      return [ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO, ModelType.GPT_4O_MINI]
  }
}

export function buildModelExecutionPlan(stage: PipelineStage, ctx: RouterContext): ModelType[] {
  const primary = selectPrimaryModelForStage(stage, ctx)
  const fallbacks = uniqueModels(getFallbackChainForStage(primary, stage)).filter((m) => m !== primary)
  const sortedFallbacks = sortModelsByProviderPriority(fallbacks)
  const chain = [primary, ...sortedFallbacks]
  return filterModelsByAvailability(chain)
}

export function getSelectionReasonForStage(stage: PipelineStage, model: ModelType, ctx: RouterContext): string {
  const longDoc = ctx.documentLength >= longDocumentThreshold()
  if (stage === "EXTRACTION") {
    if (model === ModelType.GEMINI_2_5_PRO && longDoc) {
      return "Langes Dokument: bevorzugt Modell mit großem Kontextfenster (Extraktion)."
    }
    if (model === ModelType.GPT_4O_MINI) {
      return "Strukturierte Extraktion: bevorzugt kompaktes Schema-Modell."
    }
    if (model === ModelType.LLAMA_COMPAT) {
      return "Konfiguration für datensensible Verarbeitung oder Llama-Priorität."
    }
    return "Extraktionsstufe: Fallback oder alternativer Anbieter."
  }
  if (model === ModelType.CLAUDE_SONNET_4) {
    return "Klausel- und Risikoanalyse: bevorzugt präzise juristische Ausarbeitung."
  }
  if (model === ModelType.GEMINI_2_5_PRO && longDoc) {
    return "Umfangreiches Dokument: Kontext-freundliches Modell für Risikoteil."
  }
  return "Risiko- und Handlungsempfehlungen: Fallback oder alternativer Anbieter."
}

// --- Legacy API (DocumentMetadata / AnalysisType) ---

export function selectOptimalModel(documentMetadata: DocumentMetadata): ModelType {
  if (!routerEnabled()) {
    return envModelToType("DEFAULT_MODEL", ModelType.GPT_4O_MINI)
  }

  const { documentLength, analysisType, hasVisualElements } = documentMetadata

  if (
    [AnalysisType.CONTRACT, AnalysisType.RISK, AnalysisType.COMPLIANCE, AnalysisType.CLAUSE].includes(
      analysisType
    )
  ) {
    return ModelType.CLAUDE_SONNET_4
  }

  if (documentLength > longDocumentThreshold() || hasVisualElements) {
    return envModelToType("LONG_DOCUMENT_MODEL", ModelType.GEMINI_2_5_PRO)
  }

  return envModelToType("SIMPLE_QUERY_MODEL", ModelType.GPT_4O_MINI)
}

export function getFallbackChain(model: ModelType): ModelType[] {
  return getFallbackChainForStage(model, "RISK_AND_GUIDANCE")
}

export function getSelectionReason(model: ModelType): string {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return "Kritische juristische Analyse benötigt hohe Präzision (Claude Sonnet)."
    case ModelType.GEMINI_2_5_PRO:
      return "Langes oder visuelles Dokument profitiert von Gemini-Kontextfenster."
    case ModelType.LLAMA_COMPAT:
      return "Llama-kompatibler Endpunkt (lokal oder EU-Hosting) für sensible Inhalte."
    case ModelType.GPT_4O_MINI:
    default:
      return "Standardanfrage mit Fokus auf Geschwindigkeit und Kosten (GPT-4o-mini)."
  }
}

export function getFilteredExecutionChain(metadata: DocumentMetadata): ModelType[] {
  const primary = selectOptimalModel(metadata)
  const fallbacks = uniqueModels(getFallbackChain(primary)).filter((m) => m !== primary)
  const sortedFallbacks = sortModelsByProviderPriority(fallbacks)
  const chain = [primary, ...sortedFallbacks]
  return filterModelsByAvailability(chain)
}

export function logModelSelection(documentMetadata: DocumentMetadata, selectedModel: ModelType): void {
  if (process.env.AI_AUDIT_VERBOSE !== "true") return
  console.info("[AI-Model-Router] Modellauswahl", {
    documentId: documentMetadata.documentId,
    analysisType: documentMetadata.analysisType,
    documentLength: documentMetadata.documentLength,
    hasVisualElements: Boolean(documentMetadata.hasVisualElements),
    selectedModel,
    available: getAvailableModelTypes(),
    reason: getSelectionReason(selectedModel)
  })
}

export function assertAnyProviderConfigured(): void {
  const avail = getAvailableModelTypes()
  if (avail.length === 0) {
    throw new ProviderConfigurationError(
      "Kein KI-Anbieter konfiguriert. Mindestens einen API-Schlüssel setzen (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY oder LLAMA_*)."
    )
  }
}

export class ProviderConfigurationError extends Error {
  readonly code = "PROVIDER_NOT_CONFIGURED"
  constructor(message: string) {
    super(message)
    this.name = "ProviderConfigurationError"
  }
}

export function filterChainIfModelUnavailable(chain: ModelType[], model: ModelType): ModelType[] {
  if (isModelTypeAvailable(model)) return chain
  return filterModelsByAvailability(chain)
}
