"use client"

import { useEffect } from "react"
import type { WorkbenchAiContractAnalysisProps } from "@/types/ai-workbench"

type Props = {
  documentTitle: string
  documentId: string
  analysis: WorkbenchAiContractAnalysisProps
}

function severityLabel(sev: "NIEDRIG" | "MITTEL" | "HOCH"): string {
  return sev === "HOCH" ? "Hoch" : sev === "MITTEL" ? "Mittel" : "Niedrig"
}

function severityEmoji(sev: "NIEDRIG" | "MITTEL" | "HOCH"): string {
  return sev === "HOCH" ? "🔴" : sev === "MITTEL" ? "🟡" : "🟢"
}

function reviewLabel(d: string): string {
  switch (d) { case "AKZEPTIERT": return "✓ Akzeptiert"; case "ABGELEHNT": return "✕ Abgelehnt"; case "ANGEPASST": return "✎ Angepasst"; default: return d }
}

function providerLabel(p: string | null): string {
  if (!p) return "—"; switch (p) { case "OPENAI": return "OpenAI"; case "ANTHROPIC": return "Anthropic"; case "GOOGLE_GEMINI": return "Gemini"; default: return p }
}

export function ExportClient({ documentTitle, documentId, analysis }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800)
    return () => clearTimeout(timer)
  }, [])

  const hochCount = analysis.findings.filter(f => f.severity === "HOCH").length
  const mittelCount = analysis.findings.filter(f => f.severity === "MITTEL").length
  const niedrigCount = analysis.findings.filter(f => f.severity === "NIEDRIG").length
  const reviewed = analysis.findings.filter(f => f.latestReview).length
  const riskPct = analysis.run.riskScore01 != null ? Math.round(analysis.run.riskScore01 * 100) : null
  const now = new Date().toLocaleString("de-DE")

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; font-size: 11px; color: #1e293b; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { margin: 20mm 15mm; size: A4; }
        }
        @media screen {
          body { background: #f1f5f9; }
        }
      `}</style>

      {/* Print Button (screen only) */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#003856] px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-[#002a42]"
        >
          Als PDF drucken
        </button>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg hover:bg-slate-50"
        >
          Zurück
        </button>
      </div>

      <div className="mx-auto max-w-[210mm] bg-white px-10 py-8 print:max-w-none print:p-0" style={{ fontFamily: "Calibri, -apple-system, sans-serif" }}>

        {/* Header */}
        <div className="mb-6 border-b-2 border-[#003856] pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#003856]">KanzleiAI — Vertragsanalyse</p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">{documentTitle}</h1>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <p>Dokument-ID: {documentId.slice(0, 12)}…</p>
              <p>Exportiert: {now}</p>
              <p>Lauf #{analysis.run.runSequence} · {providerLabel(analysis.run.primaryProvider)}</p>
            </div>
          </div>
        </div>

        {/* BRAO Disclaimer */}
        <div className="mb-5 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
          <strong>⚖️ BRAO § 43a:</strong> Diese KI-gestützte Analyse dient als Arbeitshilfsmittel. Die rechtliche Einschätzung und
          Verantwortung verbleibt beim bearbeitenden Rechtsanwalt. Alle Findings erfordern eigenständige fachliche Prüfung.
        </div>

        {/* Risk Summary */}
        <div className="mb-5 grid grid-cols-4 gap-3 text-center">
          <div className="rounded border border-slate-200 py-2">
            <p className="text-2xl font-bold text-slate-900">{riskPct != null ? `${riskPct}%` : "—"}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Risiko-Score</p>
          </div>
          <div className="rounded border border-rose-200 bg-rose-50 py-2">
            <p className="text-2xl font-bold text-rose-700">{hochCount}</p>
            <p className="text-[9px] uppercase tracking-wider text-rose-600">Hoch</p>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50 py-2">
            <p className="text-2xl font-bold text-amber-700">{mittelCount}</p>
            <p className="text-[9px] uppercase tracking-wider text-amber-600">Mittel</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 py-2">
            <p className="text-2xl font-bold text-slate-600">{niedrigCount}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Niedrig</p>
          </div>
        </div>

        {/* Classification */}
        {analysis.classification && (
          <div className="mb-5 rounded border border-slate-200 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Vertragsklassifikation</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              {analysis.classification.contractClassification && (
                <div><span className="text-[9px] text-slate-400">Typ:</span> <strong>{analysis.classification.contractClassification}</strong></div>
              )}
              {analysis.classification.partyConstellation && (
                <div><span className="text-[9px] text-slate-400">Parteien:</span> <strong>{analysis.classification.partyConstellation}</strong></div>
              )}
              {analysis.classification.agbKontrolleAnwendbar != null && (
                <div><span className="text-[9px] text-slate-400">AGB-Kontrolle:</span> <strong>{analysis.classification.agbKontrolleAnwendbar ? "Ja" : "Nein"}</strong></div>
              )}
              {analysis.classification.industryClassification && (
                <div><span className="text-[9px] text-slate-400">Branche:</span> <strong>{analysis.classification.industryClassification}</strong></div>
              )}
              {analysis.classification.clientRole && (
                <div><span className="text-[9px] text-slate-400">Mandantenrolle:</span> <strong>{analysis.classification.clientRole}</strong></div>
              )}
            </div>
          </div>
        )}

        {/* Extraction Summary */}
        {analysis.extraction && (
          <div className="mb-5 rounded border border-slate-200 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Extraktion</p>
            <p className="mt-1 text-[11px]"><strong>Vertragstyp:</strong> {analysis.extraction.contractType}</p>
            {analysis.extraction.structuredData && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                {analysis.extraction.structuredData.customer && <p><span className="text-slate-400">Kunde:</span> {analysis.extraction.structuredData.customer}</p>}
                {analysis.extraction.structuredData.vendor && <p><span className="text-slate-400">Anbieter:</span> {analysis.extraction.structuredData.vendor}</p>}
                {analysis.extraction.structuredData.jurisdiction && <p><span className="text-slate-400">Gerichtsstand:</span> {analysis.extraction.structuredData.jurisdiction}</p>}
                {analysis.extraction.structuredData.applicableLaw && <p><span className="text-slate-400">Recht:</span> {analysis.extraction.structuredData.applicableLaw}</p>}
              </div>
            )}
          </div>
        )}

        {/* Findings */}
        <div className="mb-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Findings ({analysis.findings.length}) · {reviewed}/{analysis.findings.length} geprüft
          </p>
        </div>

        {analysis.findings.map((f) => (
          <div key={f.id} className="mb-3 rounded border border-slate-200 p-3" style={{ pageBreakInside: "avoid" }}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{severityEmoji(f.severity)}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-slate-900">{f.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      f.severity === "HOCH" ? "bg-rose-100 text-rose-700" :
                      f.severity === "MITTEL" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{severityLabel(f.severity)}</span>
                    {f.latestReview && (
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        f.latestReview.decision === "AKZEPTIERT" ? "bg-emerald-100 text-emerald-700" :
                        f.latestReview.decision === "ABGELEHNT" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{reviewLabel(f.latestReview.decision)}</span>
                    )}
                  </div>
                </div>
                {f.clauseRef && <p className="text-[9px] text-slate-400">{f.clauseRef} · Konfidenz: {f.confidence != null ? `${(f.confidence * 100).toFixed(0)}%` : "—"}</p>}
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-700">{f.description}</p>

                {f.sourceSpan && (
                  <div className="mt-2 border-l-2 border-slate-300 bg-slate-50 py-1.5 pl-2 text-[10px] italic text-slate-600">
                    &ldquo;{f.sourceSpan}&rdquo;
                  </div>
                )}

                {f.suggestedRevision && (
                  <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 p-2">
                    <p className="text-[9px] font-bold uppercase text-emerald-700">Formulierungsvorschlag</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-emerald-900">{f.suggestedRevision}</p>
                  </div>
                )}

                {f.latestReview?.comment && (
                  <p className="mt-1.5 text-[10px] text-slate-500"><strong>Reviewer-Kommentar:</strong> {f.latestReview.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Recommendations */}
        {analysis.risk && (
          <div className="page-break pt-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Empfohlene Maßnahmen</p>
            <ul className="list-disc space-y-1 pl-4 text-[10.5px] text-slate-700">
              {analysis.risk.recommendedMeasures.map((m, i) => <li key={i}>{m}</li>)}
            </ul>

            <p className="mb-2 mt-4 text-[9px] font-bold uppercase tracking-wider text-slate-500">Verhandlungshinweise</p>
            <ul className="list-disc space-y-1 pl-4 text-[10.5px] text-slate-700">
              {analysis.risk.negotiationHints.map((m, i) => <li key={i}>{m}</li>)}
            </ul>

            {analysis.risk.explanationSummary && (
              <>
                <p className="mb-2 mt-4 text-[9px] font-bold uppercase tracking-wider text-slate-500">Kurzbegründung</p>
                <p className="text-[10.5px] leading-relaxed text-slate-700">{analysis.risk.explanationSummary}</p>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-slate-200 pt-3 text-[9px] text-slate-400">
          <div className="flex justify-between">
            <span>KanzleiAI · SBS Deutschland GmbH &amp; Co. KG · www.kanzlei-ai.com</span>
            <span>Prompt v{analysis.run.extractionPromptVersion} · {analysis.run.reviewState === "FREIGEGEBEN" ? "Freigegeben" : "In Prüfung"}</span>
          </div>
        </div>
      </div>
    </>
  )
}
