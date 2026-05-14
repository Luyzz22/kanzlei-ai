"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"

import {
  startContractAnalysisAction,
  finalizeAnalysisReviewAction,
  batchAcceptFindingsAction,
  type ContractAnalysisFormState
} from "@/app/workspace/dokumente/[id]/actions"
import { AnalysisFindingReviewForm } from "@/components/documents/analysis-finding-review-form"
import { StatusBadge } from "@/components/marketing/status-badge"
import type {
  WorkbenchAiContractAnalysisProps,
  WorkbenchStructuredData,
  WorkbenchDeadlines
} from "@/types/ai-workbench"

const initialState: ContractAnalysisFormState = { status: "idle" }

function SubmitAnalysisButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Analyse läuft …" : "KI-Vertragsanalyse starten"}
    </button>
  )
}

function severityTone(sev: "NIEDRIG" | "MITTEL" | "HOCH"): "neutral" | "info" | "warning" | "risk" {
  if (sev === "NIEDRIG") return "neutral"
  if (sev === "MITTEL") return "warning"
  return "risk"
}
function severityLabel(sev: "NIEDRIG" | "MITTEL" | "HOCH"): string {
  if (sev === "NIEDRIG") return "Niedrig"
  if (sev === "MITTEL") return "Mittel"
  return "Hoch"
}
function severityColor(sev: "NIEDRIG" | "MITTEL" | "HOCH") {
  if (sev === "HOCH") return { dot: "bg-rose-500", border: "border-rose-200" }
  if (sev === "MITTEL") return { dot: "bg-amber-500", border: "border-amber-200" }
  return { dot: "bg-slate-400", border: "border-slate-200" }
}
function runStatusLabel(status: WorkbenchAiContractAnalysisProps["run"]["status"]): string {
  switch (status) { case "QUEUED": return "Warteschlange"; case "RUNNING": return "Läuft"; case "COMPLETED": return "Abgeschlossen"; case "FAILED": return "Fehlgeschlagen"; default: return status }
}
function runStatusTone(status: WorkbenchAiContractAnalysisProps["run"]["status"]): "neutral" | "info" | "success" | "risk" | "warning" {
  if (status === "COMPLETED") return "success"; if (status === "FAILED") return "risk"; if (status === "RUNNING") return "info"; return "warning"
}
function analysisReviewStateLabel(s: WorkbenchAiContractAnalysisProps["run"]["reviewState"]): string {
  switch (s) { case "UNGEPRUEFT": return "Ungeprüft"; case "ENTWURF": return "Entwurf"; case "ANALYSIERT": return "Analysiert"; case "IN_PRUEFUNG": return "In Prüfung"; case "FREIGEGEBEN": return "Freigegeben"; case "ZURUECKGEWIESEN": return "Zurückgewiesen"; case "WIEDERHOLUNG_ANGEFORDERT": return "Erneut analysieren"; default: return s }
}
function findingDecisionLabel(d: string): string {
  switch (d) { case "AKZEPTIERT": return "Akzeptiert"; case "ABGELEHNT": return "Abgelehnt"; case "ANGEPASST": return "Angepasst"; case "KENNTNISGENOMMEN": return "Kenntnisgenommen"; default: return d }
}
function providerLabel(p: string | null): string {
  if (!p) return "—"; switch (p) { case "OPENAI": return "OpenAI"; case "ANTHROPIC": return "Anthropic"; case "GOOGLE_GEMINI": return "Gemini"; case "LLAMA_COMPAT": return "Llama-kompatibel"; default: return p }
}

function hasAnyStructuredDataField(sd: WorkbenchStructuredData): boolean { return Object.values(sd).some((v) => v !== null && v !== undefined && v !== "") }
function hasAnyDeadlinesField(d: WorkbenchDeadlines): boolean { return Object.values(d).some((v) => v !== null && v !== undefined && v !== "") }
function formatBoolean(v: boolean | null | undefined): string | null { if (v === true) return "Ja"; if (v === false) return "Nein"; return null }
function formatDays(v: number | null | undefined): string | null { if (v == null) return null; return `${v} Tage` }
function formatMonths(v: number | null | undefined): string | null { if (v == null) return null; return `${v} Monate` }

function StructuredDataRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null
  return (<div className="flex flex-col"><dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-0.5 text-sm text-slate-800">{value}</dd></div>)
}

function ChevronIcon({ open }: { open: boolean }) {
  return (<svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>)
}

type ContractAnalysisPanelProps = { documentId: string; canStartAnalysis: boolean; canReviewFindings: boolean; analysis: WorkbenchAiContractAnalysisProps | null }

/* ================================================================== */
/* SUMMARY BAR                                                       */
/* ================================================================== */
function FindingsSummaryBar({ findings, riskScore, filter, onFilter }: {
  findings: WorkbenchAiContractAnalysisProps["findings"]; riskScore: number | null
  filter: "ALL" | "HOCH" | "MITTEL" | "NIEDRIG"; onFilter: (f: "ALL" | "HOCH" | "MITTEL" | "NIEDRIG") => void
}) {
  const hoch = findings.filter(f => f.severity === "HOCH").length
  const mittel = findings.filter(f => f.severity === "MITTEL").length
  const niedrig = findings.filter(f => f.severity === "NIEDRIG").length
  const scorePercent = riskScore != null ? Math.round(riskScore * 100) : null
  const scoreColor = riskScore != null ? (riskScore >= 0.7 ? "text-rose-600" : riskScore >= 0.4 ? "text-amber-600" : "text-emerald-600") : "text-slate-400"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onFilter("ALL")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Alle ({findings.length})</button>
      <button onClick={() => onFilter("HOCH")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === "HOCH" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"}`}>Hoch ({hoch})</button>
      <button onClick={() => onFilter("MITTEL")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === "MITTEL" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>Mittel ({mittel})</button>
      <button onClick={() => onFilter("NIEDRIG")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === "NIEDRIG" ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>Niedrig ({niedrig})</button>
      {scorePercent != null && (<div className="ml-auto flex items-center gap-2"><span className="text-[11px] font-medium text-slate-400">Risiko</span><span className={`text-lg font-bold tabular-nums ${scoreColor}`}>{scorePercent}%</span></div>)}
    </div>
  )
}

/* ================================================================== */
/* FINDING CARD — Accordion                                          */
/* ================================================================== */
function FindingCard({ finding, isOpen, onToggle, canReview, documentId }: {
  finding: WorkbenchAiContractAnalysisProps["findings"][0]; isOpen: boolean; onToggle: () => void; canReview: boolean; documentId: string
}) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const colors = severityColor(finding.severity)
  return (
    <div className={`rounded-xl border transition-colors ${isOpen ? colors.border : "border-slate-100"} bg-white`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
        <span className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-slate-900 line-clamp-1">{finding.title}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
            {finding.clauseRef && <span>{finding.clauseRef}</span>}
            {finding.confidence != null && <span>· Konfidenz {(finding.confidence * 100).toFixed(0)}%</span>}
          </span>
        </span>
        <StatusBadge label={severityLabel(finding.severity)} tone={severityTone(finding.severity)} />
        {finding.latestReview && (
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
            finding.latestReview.decision === "AKZEPTIERT" ? "bg-emerald-100 text-emerald-700" :
            finding.latestReview.decision === "ABGELEHNT" ? "bg-rose-100 text-rose-700" :
            finding.latestReview.decision === "KENNTNISGENOMMEN" ? "bg-blue-100 text-blue-600" :
            "bg-amber-100 text-amber-700"
          }`}>
            {finding.latestReview.decision === "AKZEPTIERT" ? "✓" : finding.latestReview.decision === "ABGELEHNT" ? "✕" : finding.latestReview.decision === "KENNTNISGENOMMEN" ? "○" : "✎"}
          </span>
        )}
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <p className="text-[13px] leading-relaxed text-slate-700">{finding.description}</p>
          {finding.sourceSpan && (<blockquote className="border-l-4 border-slate-300 bg-slate-50 py-2.5 pl-3 pr-3 text-[12px] italic leading-relaxed text-slate-600 rounded-r-lg">&ldquo;{finding.sourceSpan}&rdquo;</blockquote>)}
          {finding.suggestedRevision && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Formulierungsvorschlag</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-emerald-900">{finding.suggestedRevision}</p>
            </div>
          )}
          {finding.latestReview && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <span className="font-medium">Letzte Prüfung:</span>
                <span>{findingDecisionLabel(finding.latestReview.decision)}</span>
                {finding.latestReview.reviewerName && (
                  <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">{finding.latestReview.reviewerName}</span>
                )}
                {finding.latestReview.comment && <span className="truncate">— {finding.latestReview.comment}</span>}
                <span className="ml-auto shrink-0 text-slate-400">{new Date(finding.latestReview.reviewedAt).toLocaleString("de-DE")}</span>
              </div>
              {finding.allReviews.length > 1 && (
                <div>
                  <button type="button" onClick={() => setHistoryOpen(!historyOpen)} className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600">
                    <ChevronIcon open={historyOpen} />
                    Review-Historie ({finding.allReviews.length} Einträge)
                  </button>
                  {historyOpen && (
                    <div className="mt-1.5 space-y-1 border-l-2 border-slate-200 pl-3">
                      {finding.allReviews.map((rev, idx) => (
                        <div key={`rev-${idx}`} className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className={`inline-flex rounded px-1.5 py-0.5 font-medium ${
                            rev.decision === "AKZEPTIERT" ? "bg-emerald-50 text-emerald-700" :
                            rev.decision === "ABGELEHNT" ? "bg-rose-50 text-rose-700" :
                            rev.decision === "KENNTNISGENOMMEN" ? "bg-slate-100 text-slate-600" :
                            "bg-amber-50 text-amber-700"
                          }`}>{findingDecisionLabel(rev.decision)}</span>
                          {rev.reviewerName && <span className="font-medium text-slate-600">{rev.reviewerName}</span>}
                          {rev.comment && <span className="truncate text-slate-400">— {rev.comment}</span>}
                          <span className="ml-auto shrink-0 text-slate-300">{new Date(rev.reviewedAt).toLocaleString("de-DE")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {canReview && (
            <>
              {!reviewOpen ? (
                <button type="button" onClick={() => setReviewOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Prüfen &amp; Entscheiden
                </button>
              ) : (
                <div className="relative">
                  <button type="button" onClick={() => setReviewOpen(false)} className="absolute -top-1 right-0 text-[11px] text-slate-400 hover:text-slate-600">Schließen ✕</button>
                  <AnalysisFindingReviewForm documentId={documentId} findingId={finding.id} currentSuggestedRevision={finding.suggestedRevision} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/* MAIN PANEL                                                        */
/* ================================================================== */
export function ContractAnalysisPanel({ documentId, canStartAnalysis, canReviewFindings, analysis }: ContractAnalysisPanelProps) {
  const [state, formAction] = useFormState(startContractAnalysisAction, initialState)
  const [finalizeState, finalizeAction] = useFormState(finalizeAnalysisReviewAction, initialState)
  const [batchState, batchAcceptAction] = useFormState(batchAcceptFindingsAction, initialState)
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "HOCH" | "MITTEL" | "NIEDRIG">("ALL")
  const [openFindings, setOpenFindings] = useState<Set<string>>(new Set())
  const [metaOpen, setMetaOpen] = useState(false)

  function toggleFinding(id: string) { setOpenFindings(prev => { const next = new Set(prev); if (next.has(id)) { next.delete(id) } else { next.add(id) }; return next }) }
  function expandAll() { if (!analysis) return; setOpenFindings(new Set(getFilteredFindings().map(f => f.id))) }
  function collapseAll() { setOpenFindings(new Set()) }
  function getFilteredFindings() { if (!analysis) return []; if (severityFilter === "ALL") return analysis.findings; return analysis.findings.filter(f => f.severity === severityFilter) }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">KI-Vertragsanalyse</p>
        <p className="mt-1 text-sm text-slate-600">Mehrstufige Pipeline: strukturierte Extraktion, Risiko- und Klauselanalyse, Handlungsempfehlungen. Ergebnisse werden mandantenbezogen gespeichert und sind zur fachlichen Prüfung vorgesehen (keine automatische Rechtsberatung).</p>
      </div>

      {canStartAnalysis ? (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="documentId" value={documentId} />
          <SubmitAnalysisButton />
          {state.message ? (<p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>) : null}
        </form>
      ) : (<p className="text-sm text-slate-600">Start erst nach erfolgreicher Textextraktion möglich.</p>)}

      {analysis ? (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <p className="flex-1 text-xs text-slate-500">KI-Vertragsanalyse{" "}<StatusBadge label={runStatusLabel(analysis.run.status)} tone={runStatusTone(analysis.run.status)} />{analysis.run.completedAt ? `. Ergebnisse sind unten einsehbar — bitte fachlich prüfen (Human-in-the-Loop).` : null}</p>
            {analysis.run.status === "COMPLETED" && (
              <a href={`/workspace/dokumente/${documentId}/export`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Als PDF exportieren
              </a>
            )}
          </div>

          {/* Collapsible Run Metadata */}
          <button type="button" onClick={() => setMetaOpen(!metaOpen)} className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronIcon open={metaOpen} />
            <span>Lauf #{analysis.run.runSequence} · {providerLabel(analysis.run.primaryProvider)} · {analysis.run.primaryModel}</span>
            <span className="ml-auto"><StatusBadge label={analysisReviewStateLabel(analysis.run.reviewState)} tone="neutral" /></span>
          </button>

          {metaOpen && (
            <div className="grid gap-x-6 gap-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
              <p><span className="text-xs uppercase tracking-wide text-slate-500">Letzter Lauf</span><br /><StatusBadge label={runStatusLabel(analysis.run.status)} tone={runStatusTone(analysis.run.status)} /></p>
              {analysis.run.startedAt ? (<p><span className="text-xs uppercase tracking-wide text-slate-500">Zeitraum</span><br /><span className="font-medium text-slate-900">{new Date(analysis.run.startedAt).toLocaleString("de-DE")}{analysis.run.completedAt ? ` – ${new Date(analysis.run.completedAt).toLocaleString("de-DE")}` : ""}</span></p>) : null}
              <p><span className="text-xs uppercase tracking-wide text-slate-500">Anbieter / Modell</span><br /><span className="font-medium text-slate-900">{providerLabel(analysis.run.primaryProvider)} · {analysis.run.primaryModel}</span></p>
              <p><span className="text-xs uppercase tracking-wide text-slate-500">Risikoindikator</span><br /><span className="font-medium text-slate-900">{analysis.run.riskScore01?.toFixed(2) ?? "—"}</span></p>
              <p><span className="text-xs uppercase tracking-wide text-slate-500">Konfidenz</span><br /><span className="font-medium text-slate-900">{analysis.run.aggregateConfidence?.toFixed(2) ?? "—"}</span></p>
              <p><span className="text-xs uppercase tracking-wide text-slate-500">Strukturierte Ausgabe</span><br /><span className="font-medium text-slate-900">{analysis.run.structuredOutputValid ? "Validiert" : "Nicht valide"}</span></p>
              <p className="sm:col-span-2"><span className="text-xs uppercase tracking-wide text-slate-500">Prompts</span><br /><span className="font-mono text-xs text-slate-800">{analysis.run.extractionPromptKey}@{analysis.run.extractionPromptVersion} · {analysis.run.riskPromptKey}@{analysis.run.riskPromptVersion}</span></p>
              {analysis.run.routerSummary ? (<p className="sm:col-span-2 text-xs text-slate-600"><span className="font-semibold text-slate-700">Routing: </span>{analysis.run.routerSummary}</p>) : null}
            </div>
          )}

          {analysis.run.status === "FAILED" ? (<p className="text-sm text-rose-700">{analysis.run.errorCode ? `Fehlercode: ${analysis.run.errorCode}. ` : null}{analysis.run.fallbackReason ?? analysis.run.validationErrorSummary ?? "Die Analyse ist fehlgeschlagen."}</p>) : null}

          {/* Extraction */}
          {analysis.extraction ? (
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extraktion</p><p className="mt-1 text-sm font-medium text-slate-900">Vertragstyp: {analysis.extraction.contractType}</p></div>
              {analysis.extraction.structuredData && hasAnyStructuredDataField(analysis.extraction.structuredData) ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">📊 Extrahierte Daten</p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <StructuredDataRow label="Kunde" value={analysis.extraction.structuredData.customer} />
                    <StructuredDataRow label="Anbieter" value={analysis.extraction.structuredData.vendor} />
                    <StructuredDataRow label="Produkt" value={analysis.extraction.structuredData.product} />
                    <StructuredDataRow label="Gerichtsstand" value={analysis.extraction.structuredData.jurisdiction} />
                    <StructuredDataRow label="Anwendbares Recht" value={analysis.extraction.structuredData.applicableLaw} />
                    <StructuredDataRow label="Haftungsgrenze" value={analysis.extraction.structuredData.liabilityLimit} />
                    <StructuredDataRow label="Geheimhaltung" value={formatBoolean(analysis.extraction.structuredData.confidentialityObligation)} />
                    <StructuredDataRow label="Vertragsstrafe" value={analysis.extraction.structuredData.penaltyClause} />
                    <StructuredDataRow label="IP-Rechte" value={analysis.extraction.structuredData.intellectualProperty} />
                    <StructuredDataRow label="AVV vorhanden" value={formatBoolean(analysis.extraction.structuredData.dataProcessingAgreement)} />
                  </dl>
                </div>
              ) : null}
              {analysis.extraction.deadlines && hasAnyDeadlinesField(analysis.extraction.deadlines) ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">📅 Fristen &amp; Termine</p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <StructuredDataRow label="Kündigungsfrist" value={formatDays(analysis.extraction.deadlines.noticePeriodDays)} />
                    <StructuredDataRow label="Auto-Verlängerung" value={formatBoolean(analysis.extraction.deadlines.autoRenewal)} />
                    <StructuredDataRow label="Verlängerungszeitraum" value={formatMonths(analysis.extraction.deadlines.renewalTermMonths)} />
                    <StructuredDataRow label="Vertragsbeginn" value={analysis.extraction.deadlines.contractStartDate} />
                    <StructuredDataRow label="Vertragsende" value={analysis.extraction.deadlines.contractEndDate} />
                    <StructuredDataRow label="Nächster Kündigungstermin" value={analysis.extraction.deadlines.nextCancellationDate} />
                    <StructuredDataRow label="Gewährleistung" value={formatMonths(analysis.extraction.deadlines.warrantyPeriodMonths)} />
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* v3: Klassifikationsoutput */}
          {analysis.classification && (
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vertragsklassifikation</p>
              <div className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
                {analysis.classification.contractClassification && (
                  <div><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vertragstyp</span><p className="mt-0.5 font-medium text-slate-900">{analysis.classification.contractClassification}</p></div>
                )}
                {analysis.classification.partyConstellation && (
                  <div><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Parteikonstellation</span><p className="mt-0.5 font-medium text-slate-900">{analysis.classification.partyConstellation}</p></div>
                )}
                {analysis.classification.clientRole && (
                  <div><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mandantenrolle</span><p className="mt-0.5 font-medium text-slate-900">{analysis.classification.clientRole}</p></div>
                )}
                {analysis.classification.agbKontrolleAnwendbar != null && (
                  <div><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AGB-Kontrolle</span><p className="mt-0.5 font-medium text-slate-900">{analysis.classification.agbKontrolleAnwendbar ? "§§ 305–310 BGB anwendbar" : "Nicht anwendbar (Individualvertrag)"}</p></div>
                )}
                {analysis.classification.industryClassification && (
                  <div><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Branche</span><p className="mt-0.5 font-medium text-slate-900">{analysis.classification.industryClassification}{analysis.classification.internationalElement ? " (international)" : ""}</p></div>
                )}
                {analysis.classification.agbKontrollmassstab && (
                  <div><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kontrollmaßstab</span><p className="mt-0.5 font-medium text-slate-900">{analysis.classification.agbKontrollmassstab}</p></div>
                )}
              </div>
              {analysis.classification.classificationSummary && (
                <p className="mt-3 text-[12px] leading-relaxed text-slate-600">{analysis.classification.classificationSummary}</p>
              )}
              {analysis.classification.classificationConfidence != null && (
                <p className="mt-2 text-[11px] text-slate-400">Klassifikations-Konfidenz: {(analysis.classification.classificationConfidence * 100).toFixed(0)}%</p>
              )}
            </div>
          )}

          {/* BRAO § 43a — Rechtlicher Hinweis (nicht wegklickbar, Compliance) */}
          {analysis.run.status === "COMPLETED" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-0.5">⚖️</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Rechtlicher Hinweis — BRAO § 43a</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-amber-900">
                    Diese KI-gestützte Analyse ist ein Arbeitshilfsmittel. Die rechtliche Einschätzung und Verantwortung
                    verbleibt beim bearbeitenden Rechtsanwalt. Alle Findings sind vor Verwendung fachlich zu prüfen
                    (Human-in-the-Loop erforderlich).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============ FINDINGS — Summary + Accordion ============ */}
          {analysis.findings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Findings ({analysis.findings.length})</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={expandAll} className="text-[11px] text-slate-400 hover:text-slate-600">Alle öffnen</button>
                  <span className="text-slate-200">|</span>
                  <button type="button" onClick={collapseAll} className="text-[11px] text-slate-400 hover:text-slate-600">Alle schließen</button>
                </div>
              </div>

              {/* Review Progress Bar */}
              {(() => {
                const reviewed = analysis.findings.filter(f => f.latestReview).length
                const total = analysis.findings.length
                const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0
                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-600">{reviewed}/{total} Findings geprüft</span>
                      <span className="text-slate-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-[#003856]"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}

              <FindingsSummaryBar findings={analysis.findings} riskScore={analysis.run.riskScore01} filter={severityFilter} onFilter={setSeverityFilter} />

              {/* Batch Accept für Niedrig-Findings */}
              {canReviewFindings && analysis.run.status === "COMPLETED" && (() => {
                const unreviewed = analysis.findings.filter(f => f.severity === "NIEDRIG" && !f.latestReview)
                if (unreviewed.length === 0) return null
                return (
                  <form action={batchAcceptAction}>
                    <input type="hidden" name="documentId" value={documentId} />
                    <input type="hidden" name="findingIds" value={unreviewed.map(f => f.id).join(",")} />
                    <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                      Alle Niedrig-Findings akzeptieren ({unreviewed.length})
                    </button>
                    {batchState.message && <span className={`ml-2 text-[11px] ${batchState.status === "success" ? "text-emerald-600" : "text-rose-600"}`}>{batchState.message}</span>}
                  </form>
                )
              })()}

              <div className="space-y-2">
                {getFilteredFindings().map((f) => (
                  <FindingCard key={f.id} finding={f} isOpen={openFindings.has(f.id)} onToggle={() => toggleFinding(f.id)} canReview={canReviewFindings && analysis.run.status === "COMPLETED"} documentId={documentId} />
                ))}
              </div>

              {/* Freigabe-Button — nur wenn alle Findings geprüft */}
              {canReviewFindings && analysis.run.status === "COMPLETED" && analysis.run.reviewState !== "FREIGEGEBEN" && (() => {
                const allReviewed = analysis.findings.every(f => f.latestReview)
                return (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {allReviewed ? (
                      <form action={finalizeAction} className="flex items-center gap-3">
                        <input type="hidden" name="documentId" value={documentId} />
                        <input type="hidden" name="analysisRunId" value={analysis.run.id} />
                        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Analyse freigeben
                        </button>
                        {finalizeState.message && <span className={`text-sm ${finalizeState.status === "success" ? "text-emerald-600" : "text-rose-600"}`}>{finalizeState.message}</span>}
                      </form>
                    ) : (
                      <p className="text-[12px] text-slate-500">Alle Findings müssen geprüft werden, bevor die Analyse freigegeben werden kann.</p>
                    )}
                  </div>
                )
              })()}

              {analysis.run.reviewState === "FREIGEGEBEN" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-emerald-800">✓ Analyse freigegeben</p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {analysis.risk ? (
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Empfohlene Maßnahmen</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">{analysis.risk.recommendedMeasures.map((m, i) => (<li key={`m-${i}`}>{m}</li>))}</ul>
              </div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verhandlungshinweise</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">{analysis.risk.negotiationHints.map((m, i) => (<li key={`h-${i}`}>{m}</li>))}</ul>
              </div>
              {analysis.risk.explanationSummary ? (<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kurzbegründung</p><p className="mt-1 text-sm text-slate-700">{analysis.risk.explanationSummary}</p></div>) : null}
            </div>
          ) : null}
        </div>
      ) : (<p className="border-t border-slate-100 pt-4 text-sm text-slate-600">Noch keine gespeicherte KI-Analyse für dieses Dokument.</p>)}
    </div>
  )
}
