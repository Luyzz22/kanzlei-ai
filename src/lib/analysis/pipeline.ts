/**
 * Async-Pipeline-Wrapper für runPersistedContractAnalysis
 */

import { getWorkspaceDocumentById } from "@/lib/documents/workspace-core"
import { runPersistedContractAnalysis } from "@/lib/documents/analysis-run-core"

type PipelineInput = {
  runId: string
  tenantId: string
  documentId: string
  actorId: string
  onProgress: (progress: number, stage: string) => Promise<void>
}

export async function runAnalysisPipeline({
  runId,
  tenantId,
  documentId,
  actorId,
  onProgress,
}: PipelineInput) {
  await onProgress(5, "classification")

  const doc = await getWorkspaceDocumentById(tenantId, documentId)
  if (!doc) throw new Error("document_not_found")

  if (doc.processingStatus !== "VERARBEITET") {
    throw new Error("document_not_processed")
  }

  const text = doc.extractedTextPreview?.trim() ?? ""
  if (!text) throw new Error("no_text_content")

  await onProgress(15, "classification")
  await onProgress(30, "extraction")

  const result = await runPersistedContractAnalysis({
    tenantId,
    documentId,
    actorId,
    documentText: text,
    documentSha256: doc.sha256,
    existingRunId: runId,
  })

  await onProgress(85, "risk")

  if (!result.ok) {
    throw new Error(result.message ?? result.code ?? "analysis_failed")
  }

  await onProgress(98, "risk")

  return { analysisRunId: result.runId, ok: true }
}
