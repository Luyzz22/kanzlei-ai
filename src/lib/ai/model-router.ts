import { AnalysisType, type DocumentMetadata, ModelType } from "@/types/ai"

export function selectOptimalModel(documentMetadata: DocumentMetadata): ModelType {
  const { documentLength, analysisType, hasVisualElements } = documentMetadata

  if (
    [AnalysisType.CONTRACT, AnalysisType.RISK, AnalysisType.COMPLIANCE].includes(
      analysisType
    )
  ) {
    return ModelType.CLAUDE_SONNET_4
  }

  if (documentLength > 50_000 || hasVisualElements) {
    return ModelType.GEMINI_2_5_PRO
  }

  return ModelType.GPT_4O_MINI
}

export function getFallbackChain(model: ModelType): ModelType[] {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return [ModelType.GEMINI_2_5_PRO, ModelType.GPT_4O_MINI]
    case ModelType.GEMINI_2_5_PRO:
      return [ModelType.CLAUDE_SONNET_4, ModelType.GPT_4O_MINI]
    case ModelType.GPT_4O_MINI:
    default:
      return [ModelType.CLAUDE_SONNET_4, ModelType.GEMINI_2_5_PRO]
  }
}

export function getSelectionReason(model: ModelType): string {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return "Kritische juristische Analyse benötigt hohe Präzision (Claude Sonnet 4)."
    case ModelType.GEMINI_2_5_PRO:
      return "Langes oder visuelles Dokument profitiert von Gemini 2.5 Pro Kontextfenster."
    case ModelType.GPT_4O_MINI:
    default:
      return "Standardanfrage mit Fokus auf Geschwindigkeit und Kosten (GPT-4o-mini)."
  }
}

export function logModelSelection(documentMetadata: DocumentMetadata, selectedModel: ModelType): void {
  console.info("[AI-Model-Router] Modellauswahl", {
    documentId: documentMetadata.documentId,
    analysisType: documentMetadata.analysisType,
    documentLength: documentMetadata.documentLength,
    hasVisualElements: Boolean(documentMetadata.hasVisualElements),
    selectedModel,
    fallbackChain: getFallbackChain(selectedModel),
    reason: getSelectionReason(selectedModel)
  })
}
