"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type Finding = {
  title: string
  severity: string
  explanation: string
  quote?: string
  suggestedRevision?: string
}

type Deadlines = {
  noticePeriodDays?: number
  autoRenewal?: boolean
  renewalTermMonths?: number
  contractStartDate?: string
  contractEndDate?: string
  nextCancellationDate?: string
  warrantyPeriodMonths?: number
}

type StructuredAnalysis = {
  summary?: string
  findings?: Finding[]
  recommendedActions?: string[]
  extractedData?: Record<string, string | number | boolean>
  riskScore?: number
  deadlines?: Deadlines
  detectedLanguage?: string
}

type HistoryEntry = {
  id: string
  date: string
  model: string
  riskScore: number | null
  findingsCount: number
  product: string
  result?: string
}

function parseAnalysis(raw: unknown): StructuredAnalysis {
  if (!raw) return {}
  let text = typeof raw === "string" ? raw : ""
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>
    if (typeof obj.rawText === "string") text = obj.rawText
    else if (typeof obj.analysis === "string") text = obj.analysis
    else return raw as StructuredAnalysis
  }
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) return {}
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return {}
  }
}

const severityStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "🔴" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "🟡" },
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "🟢" },
  info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "ℹ️" },
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>()
  const [entry, setEntry] = useState<HistoryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kanzlei-analysis-history")
      if (!stored) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const history: HistoryEntry[] = JSON.parse(stored)
      const found = history.find(h => h.id === params.id)
      if (!found) {
        setNotFound(true)
      } else {
        setEntry(found)
      }
    } catch {
      setNotFound(true)
    }
    setLoading(false)
  }, [params.id])

  const parsed = entry?.result ? parseAnalysis(entry.result) : null

  const exportPDF = () => {
    if (!entry || !parsed) return
    const content = `
KANZLEIAI — VERTRAGSANALYSE
${"=".repeat(60)}

Dokument: ${entry.product}
Analysiert: ${new Date(entry.date).toLocaleString("de-DE")}
KI-Modell: ${entry.model}
Risiko-Score: ${parsed.riskScore ?? "—"} / 100
Gefundene Risiken: ${entry.findingsCount}

${parsed.summary ? `ZUSAMMENFASSUNG\n${"-".repeat(60)}\n${parsed.summary}\n\n` : ""}

${parsed.findings && parsed.findings.length > 0 ? `RISIKO-FINDINGS\n${"-".repeat(60)}\n${parsed.findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n   ${f.explanation}${f.suggestedRevision ? `\n   Empfehlung: ${f.suggestedRevision}` : ""}`).join("\n\n")}\n\n` : ""}

${parsed.recommendedActions && parsed.recommendedActions.length > 0 ? `EMPFOHLENE MASSNAHMEN\n${"-".repeat(60)}\n${parsed.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}` : ""}
    `.trim()

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analyse-${entry.product.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}-${entry.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openInCopilot = () => {
    if (!entry?.result) return
    sessionStorage.setItem("copilot-contract-context", entry.result)
    sessionStorage.setItem("copilot-contract-name", entry.product)
    window.location.href = "/workspace/copilot"
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
        <div className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-[#003856]/30 border-t-[#003856]" />
        <p className="mt-4 text-[13px] text-gray-500">Analyse wird geladen…</p>
      </div>
    )
  }

  if (notFound || !entry) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
        <span className="text-[48px]">🔍</span>
        <h1 className="mt-4 text-[1.75rem] font-semibold tracking-tight text-gray-950">Analyse nicht gefunden</h1>
        <p className="mt-2 text-[14px] text-gray-500">Diese Analyse existiert nicht mehr in Ihrem lokalen Verlauf.</p>
        <Link href="/workspace/history" className="mt-6 inline-block rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">
          ← Zurück zum Verlauf
        </Link>
      </div>
    )
  }

  const riskColor = (parsed?.riskScore ?? 0) >= 70 ? "red" : (parsed?.riskScore ?? 0) >= 40 ? "amber" : "emerald"

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[12px] text-gray-400">
        <Link href="/workspace/history" className="hover:text-[#003856]">Verlauf</Link>
        <span>›</span>
        <span className="text-gray-700">Analyse-Detail</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📄 Vertragsanalyse</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">{entry.product}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
            <span>🕐 {new Date(entry.date).toLocaleString("de-DE")}</span>
            <span>🤖 {entry.model}</span>
            {parsed?.detectedLanguage && <span>🌐 {parsed.detectedLanguage === "de" ? "Deutsch" : parsed.detectedLanguage.toUpperCase()}</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={exportPDF} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">📄 Export</button>
          <button onClick={openInCopilot} className="rounded-full bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]">🤖 In Copilot öffnen</button>
        </div>
      </div>

      {/* Risk Score Hero */}
      <div className={`mt-8 flex items-center justify-between rounded-2xl border-2 p-6 ${
        riskColor === "red" ? "border-red-200 bg-gradient-to-br from-red-50 to-white" :
        riskColor === "amber" ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white" :
        "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
      }`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">Gesamt-Risikoscore</p>
          <p className={`mt-2 text-[56px] font-semibold leading-none ${
            riskColor === "red" ? "text-red-700" :
            riskColor === "amber" ? "text-amber-700" :
            "text-emerald-700"
          }`}>
            {parsed?.riskScore ?? "—"}
            <span className="text-[24px] text-gray-400">/100</span>
          </p>
          <p className="mt-1 text-[13px] text-gray-600">
            {(parsed?.riskScore ?? 0) >= 70 ? "Hochrisiko — Nachverhandlung empfohlen" : (parsed?.riskScore ?? 0) >= 40 ? "Mittleres Risiko — Prüfung ratsam" : "Niedriges Risiko — Standard-Konditionen"}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[36px] font-semibold text-gray-900">{entry.findingsCount}</p>
          <p className="text-[11px] uppercase tracking-wider text-gray-400">Risiko-Findings</p>
        </div>
      </div>

      {/* Summary */}
      {parsed?.summary && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-gray-900">📋 Zusammenfassung</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{parsed.summary}</p>
        </div>
      )}

      {/* Deadlines */}
      {parsed?.deadlines && Object.values(parsed.deadlines).some(v => v !== undefined && v !== null) && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-gray-900">📅 Fristen & Laufzeit</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parsed.deadlines.contractStartDate && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Vertragsbeginn</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">{parsed.deadlines.contractStartDate}</p>
              </div>
            )}
            {parsed.deadlines.contractEndDate && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Vertragsende</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">{parsed.deadlines.contractEndDate}</p>
              </div>
            )}
            {parsed.deadlines.noticePeriodDays !== undefined && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Kündigungsfrist</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">{parsed.deadlines.noticePeriodDays} Tage</p>
              </div>
            )}
            {parsed.deadlines.nextCancellationDate && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-red-600">Nächste Kündigungsmöglichkeit</p>
                <p className="mt-1 text-[13px] font-medium text-red-900">{parsed.deadlines.nextCancellationDate}</p>
              </div>
            )}
            {parsed.deadlines.autoRenewal !== undefined && (
              <div className={`rounded-xl border p-3 ${parsed.deadlines.autoRenewal ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"}`}>
                <p className={`text-[10px] uppercase tracking-wider ${parsed.deadlines.autoRenewal ? "text-amber-700" : "text-emerald-700"}`}>Automatische Verlängerung</p>
                <p className={`mt-1 text-[13px] font-medium ${parsed.deadlines.autoRenewal ? "text-amber-900" : "text-emerald-900"}`}>
                  {parsed.deadlines.autoRenewal ? "⚠️ Ja" : "✓ Nein"}
                </p>
              </div>
            )}
            {parsed.deadlines.renewalTermMonths !== undefined && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Verlängerungszeitraum</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">{parsed.deadlines.renewalTermMonths} Monate</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Findings */}
      {parsed?.findings && parsed.findings.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-gray-900">⚠️ Risiko-Findings ({parsed.findings.length})</h2>
          <div className="mt-4 space-y-3">
            {parsed.findings.map((finding, i) => {
              const style = severityStyles[finding.severity.toLowerCase()] ?? severityStyles.info
              return (
                <div key={i} className={`rounded-xl border-l-4 ${style.border} ${style.bg} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{style.icon}</span>
                        <h3 className={`text-[14px] font-semibold ${style.text}`}>{finding.title}</h3>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-700">{finding.explanation}</p>
                      {finding.quote && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Original-Zitat</p>
                          <p className="mt-1 text-[12px] italic text-gray-600">&ldquo;{finding.quote}&rdquo;</p>
                        </div>
                      )}
                      {finding.suggestedRevision && (
                        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">💡 Umformulierungsvorschlag</p>
                          <p className="mt-1 text-[12px] text-emerald-900">{finding.suggestedRevision}</p>
                        </div>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${style.bg} ${style.text} border ${style.border}`}>
                      {finding.severity}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {parsed?.recommendedActions && parsed.recommendedActions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white p-6">
          <h2 className="text-[15px] font-semibold text-gray-900">✅ Empfohlene Maßnahmen</h2>
          <ol className="mt-4 space-y-2">
            {parsed.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[11px] font-bold text-white">{i + 1}</span>
                <span className="text-[13px] leading-relaxed text-gray-700">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Extracted Data */}
      {parsed?.extractedData && Object.keys(parsed.extractedData).length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-[15px] font-semibold text-gray-900">📊 Extrahierte Kennzahlen</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(parsed.extractedData).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-gray-400">{key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</dt>
                <dd className="mt-1 text-[13px] font-medium text-gray-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <Link href="/workspace/history" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">
          ← Zurück zum Verlauf
        </Link>
        <p className="text-[11px] text-gray-400">
          Analyse-ID: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{entry.id}</code>
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-[11px] text-gray-500">⚖️ KI-generierte Analyse — keine Rechtsberatung · <Link href="/ki-transparenz" className="font-medium text-[#003856]">KI-Transparenz</Link></p>
      </div>
    </div>
  )
}
