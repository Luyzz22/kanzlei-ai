"use client"

import { useFormState, useFormStatus } from "react-dom"

import {
  startContractAnalysisAction,
  type ContractAnalysisFormState
} from "@/app/workspace/dokumente/[id]/actions"
import { AnalysisFindingReviewForm } from "@/components/documents/analysis-finding-review-form"
import { StatusBadge } from "@/components/marketing/status-badge"
import type {
  WorkbenchAiContractAnalysisProps,
  WorkbenchStructuredData,
  WorkbenchDeadlines
} from "@/types/ai-workbench"

const initialState: ContractAnalysisFormState = {
  status: "idle"
}

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

function runStatusLabel(status: WorkbenchAiContractAnalysisProps["run"]["status"]): string {
  switch (status) {
    case "QUEUED":
      return "Warteschlange"
    case "RUNNING":
      return "Läuft"
    case "COMPLETED":
      return "Abgeschlossen"
    case "FAILED":
      return "Fehlgeschlagen"
    default:
      return status
  }
}

function runStatusTone(status: WorkbenchAiContractAnalysisProps["run"]["status"]): "neutral" | "info" | "success" | "risk" | "warning" {
  if (status === "COMPLETED") return "success"
  if (status === "FAILED") return "risk"
  if (status === "RUNNING") return "info"
  return "warning"
}

function analysisReviewStateLabel(s: WorkbenchAiContractAnalysisProps["run"]["reviewState"]): string {
  switch (s) {
    case "UNGEPRUEFT":
      return "Ungeprüft"
    case "ENTWURF":
      return "Entwurf"
    case "ANALYSIERT":
      return "Analysiert"
    case "IN_PRUEFUNG":
      return "In Prüfung"
    case "FREIGEGEBEN":
      return "Freigegeben"
    case "ZURUECKGEWIESEN":
      return "Zurückgewiesen"
    case "WIEDERHOLUNG_ANGEFORDERT":
      return "Erneut analysieren"
    default:
      return s
  }
}

function findingDecisionLabel(d: string): string {
  switch (d) {
    case "AKZEPTIERT":
      return "Akzeptiert"
    case "ABGELEHNT":
      return "Abgelehnt"
    case "ANGEPASST":
      return "Angepasst"
    default:
      return d
  }
}

function providerLabel(p: string | null): string {
  if (!p) return "—"
  switch (p) {
    case "OPENAI":
      return "OpenAI"
    case "ANTHROPIC":
      return "Anthropic"
    case "GOOGLE_GEMINI":
      return "Gemini"
    case "LLAMA_COMPAT":
      return "Llama-kompatibel"
    default:
      return p
  }
}

type ContractAnalysisPanelProps = {
  documentId: string
  canStartAnalysis: boolean
  canReviewFindings: boolean
  analysis: WorkbenchAiContractAnalysisProps | null
}

// --- v2 Helper functions for structuredData + deadlines rendering ---

function hasAnyStructuredDataField(sd: WorkbenchStructuredData): boolean {
  return Object.values(sd).some((v) => v !== null && v !== undefined && v !== "")
}

function hasAnyDeadlinesField(d: WorkbenchDeadlines): boolean {
  return Object.values(d).some((v) => v !== null && v !== undefined && v !== "")
}

function formatBoolean(v: boolean | null | undefined): string | null {
  if (v === true) return "Ja"
  if (v === false) return "Nein"
  return null
}

function formatDays(v: number | null | undefined): string | null {
  if (v == null) return null
  return `${v} Tage`
}

function formatMonths(v: number | null | undefined): string | null {
  if (v == null) return null
  return `${v} Monate`
}

function StructuredDataRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  )
}

export function ContractAnalysisPanel({
  documentId,
  canStartAnalysis,
  canReviewFindings,
  analysis
}: ContractAnalysisPanelProps) {
  const [state, formAction] = useFormState(startContractAnalysisAction, initialState)

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">KI-Vertragsanalyse</p>
        <p className="mt-1 text-sm text-slate-600">
          Mehrstufige Pipeline: strukturierte Extraktion, Risiko- und Klauselanalyse, Handlungsempfehlungen. Ergebnisse werden
          mandantenbezogen gespeichert und sind zur fachlichen Prüfung vorgesehen (keine automatische Rechtsberatung).
        </p>
      </div>

      {canStartAnalysis ? (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="documentId" value={documentId} />
          <SubmitAnalysisButton />
          {state.message ? (
            <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
          ) : null}
        </form>
      ) : (
        <p className="text-sm text-slate-600">Start erst nach erfolgreicher Textextraktion möglich.</p>
      )}

      {analysis ? (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">Letzter Lauf:</span>
            <StatusBadge label={runStatusLabel(analysis.run.status)} tone={runStatusTone(analysis.run.status)} />
            <span className="text-slate-500">
              {new Date(analysis.run.startedAt).toLocaleString("de-DE")}
              {analysis.run.completedAt ? ` – ${new Date(analysis.run.completedAt).toLocaleString("de-DE")}` : ""}
            </span>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-xs uppercase tracking-wide text-slate-500">Anbieter / Modell</span>
              <br />
              <span className="font-medium text-slate-900">
                {providerLabel(analysis.run.primaryProvider)}
                {analysis.run.primaryModel ? ` · ${analysis.run.primaryModel}` : ""}
              </span>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-slate-500">Lauf / Prüfstatus</span>
              <br />
              <span className="font-medium text-slate-900">
                #{analysis.run.runSequence} · {analysisReviewStateLabel(analysis.run.reviewState)}
              </span>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-slate-500">Risikoindikator (0–1)</span>
              <br />
              <span className="font-medium text-slate-900">
                {analysis.run.riskScore01 != null ? analysis.run.riskScore01.toFixed(2) : "—"}
              </span>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-slate-500">Konfidenz</span>
              <br />
              <span className="font-medium text-slate-900">
                {analysis.run.aggregateConfidence != null ? analysis.run.aggregateConfidence.toFixed(2) : "—"}
              </span>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-slate-500">Strukturierte Ausgabe</span>
              <br />
              <span className="font-medium text-slate-900">{analysis.run.structuredOutputValid ? "Validiert" : "Nicht valide"}</span>
            </p>
            <p className="sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">Prompts (Extraktion / Risiko)</span>
              <br />
              <span className="font-mono text-xs text-slate-800">
                {analysis.run.extractionPromptKey}@{analysis.run.extractionPromptVersion} · {analysis.run.riskPromptKey}@
                {analysis.run.riskPromptVersion}
              </span>
            </p>
          </div>

          {analysis.run.routerSummary ? (
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Routing / Protokoll: </span>
              {analysis.run.routerSummary}
            </p>
          ) : null}

          {analysis.run.status === "FAILED" ? (
            <p className="text-sm text-rose-700">
              {analysis.run.errorCode ? `Fehlercode: ${analysis.run.errorCode}. ` : null}
              {analysis.run.fallbackReason ?? analysis.run.validationErrorSummary ?? "Die Analyse ist fehlgeschlagen."}
            </p>
          ) : null}

          {analysis.extraction ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extraktion</p>
                <p className="mt-1 text-sm font-medium text-slate-900">Vertragstyp: {analysis.extraction.contractType}</p>
              </div>

              {/* v2: Strukturierte Businessdaten als 2-Spalten-Grid */}
              {analysis.extraction.structuredData &&
              hasAnyStructuredDataField(analysis.extraction.structuredData) ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    📊 Extrahierte Daten
                  </p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <StructuredDataRow label="Kunde" value={analysis.extraction.structuredData.customer} />
                    <StructuredDataRow label="Anbieter" value={analysis.extraction.structuredData.vendor} />
                    <StructuredDataRow label="Produkt" value={analysis.extraction.structuredData.product} />
                    <StructuredDataRow label="Gerichtsstand" value={analysis.extraction.structuredData.jurisdiction} />
                    <StructuredDataRow label="Anwendbares Recht" value={analysis.extraction.structuredData.applicableLaw} />
                    <StructuredDataRow label="Haftungsgrenze" value={analysis.extraction.structuredData.liabilityLimit} />
                    <StructuredDataRow
                      label="Geheimhaltung"
                      value={formatBoolean(analysis.extraction.structuredData.confidentialityObligation)}
                    />
                    <StructuredDataRow label="Vertragsstrafe" value={analysis.extraction.structuredData.penaltyClause} />
                    <StructuredDataRow label="IP-Rechte" value={analysis.extraction.structuredData.intellectualProperty} />
                    <StructuredDataRow
                      label="AVV vorhanden"
                      value={formatBoolean(analysis.extraction.structuredData.dataProcessingAgreement)}
                    />
                    <StructuredDataRow label="Datenlokation" value={analysis.extraction.structuredData.dataLocation} />
                    <StructuredDataRow
                      label="Datenexport-Klausel"
                      value={formatBoolean(analysis.extraction.structuredData.dataExportClause)}
                    />
                  </dl>
                </div>
              ) : null}

              {/* v2: Deadlines-Strip */}
              {analysis.extraction.deadlines &&
              hasAnyDeadlinesField(analysis.extraction.deadlines) ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    📅 Fristen &amp; Termine
                  </p>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <StructuredDataRow
                      label="Kündigungsfrist"
                      value={formatDays(analysis.extraction.deadlines.noticePeriodDays)}
                    />
                    <StructuredDataRow
                      label="Auto-Verlängerung"
                      value={formatBoolean(analysis.extraction.deadlines.autoRenewal)}
                    />
                    <StructuredDataRow
                      label="Verlängerungszeitraum"
                      value={formatMonths(analysis.extraction.deadlines.renewalTermMonths)}
                    />
                    <StructuredDataRow
                      label="Vertragsbeginn"
                      value={analysis.extraction.deadlines.contractStartDate}
                    />
                    <StructuredDataRow
                      label="Vertragsende"
                      value={analysis.extraction.deadlines.contractEndDate}
                    />
                    <StructuredDataRow
                      label="Nächster Kündigungstermin"
                      value={analysis.extraction.deadlines.nextCancellationDate}
                    />
                    <StructuredDataRow
                      label="Gewährleistung"
                      value={formatMonths(analysis.extraction.deadlines.warrantyPeriodMonths)}
                    />
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}

          {analysis.findings.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wesentliche Findings</p>
              <ul className="mt-2 space-y-3">
                {analysis.findings.slice(0, 12).map((f) => (
                  <li key={f.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="font-medium text-slate-900">{f.title}</span>
                      <StatusBadge label={severityLabel(f.severity)} tone={severityTone(f.severity)} />
                    </div>
                    <p className="mt-2 text-slate-700">{f.description}</p>

                    {/* v2: Original-Klauselzitat als Blockquote */}
                    {f.sourceSpan ? (
                      <blockquote className="mt-3 border-l-4 border-slate-300 bg-slate-50 py-2 pl-3 pr-3 text-xs italic leading-relaxed text-slate-600">
                        &ldquo;{f.sourceSpan}&rdquo;
                      </blockquote>
                    ) : null}

                    {/* v2: Formulierungsvorschlag als Fix-Kasten */}
                    {f.suggestedRevision ? (
                      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                          ✏️ Formulierungsvorschlag
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
                          {f.suggestedRevision}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {f.confidence != null ? <span>Konfidenz: {f.confidence.toFixed(2)}</span> : null}
                      {f.clauseRef ? <span>Klauselbezug: {f.clauseRef}</span> : null}
                    </div>

                    {f.latestReview ? (
                      <p className="mt-2 text-xs text-slate-600">
                        Letzte Prüfung: {findingDecisionLabel(f.latestReview.decision)}
                        {f.latestReview.comment ? ` — ${f.latestReview.comment}` : ""} ·{" "}
                        {new Date(f.latestReview.reviewedAt).toLocaleString("de-DE")}
                      </p>
                    ) : null}
                    {canReviewFindings && analysis.run.status === "COMPLETED" ? (
                      <AnalysisFindingReviewForm documentId={documentId} findingId={f.id} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {analysis.risk ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Empfohlene Maßnahmen</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {analysis.risk.recommendedMeasures.map((m, i) => (
                    <li key={`m-${i}`}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verhandlungshinweise</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {analysis.risk.negotiationHints.map((m, i) => (
                    <li key={`h-${i}`}>{m}</li>
                  ))}
                </ul>
              </div>
              {analysis.risk.explanationSummary ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kurzbegründung</p>
                  <p className="mt-1 text-sm text-slate-700">{analysis.risk.explanationSummary}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="border-t border-slate-100 pt-4 text-sm text-slate-600">Noch keine gespeicherte KI-Analyse für dieses Dokument.</p>
      )}
    </div>
  )
}
