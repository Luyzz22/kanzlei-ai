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

/** v2: Strukturierte Businessdaten aus der Extraktionsphase. */
export type WorkbenchStructuredData = {
  customer?: string | null
  vendor?: string | null
  product?: string | null
  jurisdiction?: string | null
  applicableLaw?: string | null
  liabilityLimit?: string | null
  confidentialityObligation?: boolean | null
  penaltyClause?: string | null
  intellectualProperty?: string | null
  dataProcessingAgreement?: boolean | null
  dataLocation?: string | null
  dataExportClause?: boolean | null
}

/** v2: Deadlines / Fristen aus der Extraktionsphase. */
export type WorkbenchDeadlines = {
  noticePeriodDays?: number | null
  autoRenewal?: boolean | null
  renewalTermMonths?: number | null
  contractStartDate?: string | null
  contractEndDate?: string | null
  nextCancellationDate?: string | null
  warrantyPeriodMonths?: number | null
}

export type WorkbenchClassification = {
  contractClassification: string | null
  partyConstellation: string | null
  clientRole: string | null
  industryClassification: string | null
  internationalElement: boolean | null
  agbKontrolleAnwendbar: boolean | null
  agbKontrollmassstab: string | null
  classificationSummary: string | null
  classificationConfidence: number | null
}

export type WorkbenchConfidenceFactors = {
  normClarity: number
  clauseClarity: number
  contractContext: number
  industryFit: number
  precedent: number
  limitingFactor?: string | null
}

export type WorkbenchAiContractAnalysisProps = {
  run: WorkbenchAiRunSummary
  classification: WorkbenchClassification | null
  extraction: {
    contractType: string
    parties: unknown
    term: unknown
    legalTopics: unknown
    /** v2 — kann bei älteren Runs null sein. */
    structuredData: WorkbenchStructuredData | null
    /** v2 — kann bei älteren Runs null sein. */
    deadlines: WorkbenchDeadlines | null
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
    /** v2 — konkreter Formulierungsvorschlag, bei alten Findings null. */
    suggestedRevision: string | null
    /** v3 — Konfidenz-Aufschlüsselung (C.4) */
    confidenceFactors: WorkbenchConfidenceFactors | null
    latestReview: {
      decision: string
      comment: string | null
      reviewedAt: string
      reviewerId: string
      reviewerName: string | null
    } | null
    /** v3.4 — vollständige Review-Historie (neueste zuerst) */
    allReviews: Array<{
      decision: string
      comment: string | null
      reviewedAt: string
      reviewerId: string
      reviewerName: string | null
    }>
  }>
  risk: {
    recommendedMeasures: string[]
    negotiationHints: string[]
    explanationSummary: string
  } | null
}
