/** Für Server- und Client-Komponenten: letzte KI-Vertragsanalyse auf der Workbench (ohne server-only). */

export type WorkbenchAnalysisReviewState =
  | "UNGEPRUEFT"
  | "ENTWURF"
  | "ANALYSIERT"
  | "IN_PRUEFUNG"
  | "FREIGEGEBEN"
  | "ZURUECKGEWIESEN"
  | "WIEDERHOLUNG_ANGEFORDERT"

export type WorkbenchAiRunSummary = {
  id: string
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED"
  startedAt: string
  completedAt: string | null
  primaryProvider: string | null
  primaryModel: string | null
  routerSummary: string | null
  riskScore01: number | null
  aggregateConfidence: number | null
  structuredOutputValid: boolean
  errorCode: string | null
  fallbackReason: string | null
  validationErrorSummary: string | null
  reviewState: WorkbenchAnalysisReviewState
  runSequence: number
  promptBundleKey: string
  extractionPromptKey: string
  extractionPromptVersion: string
  riskPromptKey: string
  riskPromptVersion: string
}

export type WorkbenchAiContractAnalysisProps = {
  run: WorkbenchAiRunSummary
  extraction: {
    contractType: string
    parties: unknown
    term: unknown
    legalTopics: unknown
  } | null
  findings: Array<{
    id: string
    title: string
    description: string
    severity: "NIEDRIG" | "MITTEL" | "HOCH"
    category: string
    confidence: number | null
    clauseRef: string | null
    sourceSpan: string | null
    latestReview: {
      decision: string
      comment: string | null
      reviewedAt: string
      reviewerId: string
    } | null
  }>
  risk: {
    recommendedMeasures: string[]
    negotiationHints: string[]
    explanationSummary: string
  } | null
}
