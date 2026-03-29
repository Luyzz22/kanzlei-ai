"use client"

import { useState, useRef } from "react"
import Link from "next/link"

type Finding = {
  title: string
  severity: string
  explanation: string
  quote?: string
}

type StructuredAnalysis = {
  analysisType?: string
  summary?: string
  findings?: Finding[]
  recommendedActions?: string[]
  extractedData?: Record<string, string | number | boolean>
  riskScore?: number
}

type AnalysisResult = {
  status: string
  analysis: unknown
  modelUsed: string
  tokensUsed: number
  processingTime: number
  textLength: number
  textPreview: string
}

function parseAnalysis(raw: unknown): StructuredAnalysis {
  if (!raw) return {}
  
  let text = typeof raw === "string" ? raw : ""
  
  // Handle nested rawText from model response
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>
    if (obj.rawText && typeof obj.rawText === "string") text = obj.rawText
    else if (obj.analysis && typeof obj.analysis === "string") text = obj.analysis
    else {
      try { return raw as StructuredAnalysis } catch { return {} }
    }
  }

  // Strip markdown code fences
  text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  
  try {
    return JSON.parse(text) as StructuredAnalysis
  } catch {
    return { summary: text }
  }
}

function getSeverityColor(severity: string) {
  const s = severity?.toLowerCase()
  if (s === "hoch" || s === "high" || s === "kritisch") return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700", dot: "bg-red-500" }
  if (s === "mittel" || s === "medium") return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" }
  return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" }
}

function getRiskScoreColor(score: number) {
  if (score >= 70) return { ring: "text-red-500", label: "Hohes Risiko", bg: "bg-red-50" }
  if (score >= 40) return { ring: "text-amber-500", label: "Mittleres Risiko", bg: "bg-amber-50" }
  return { ring: "text-emerald-500", label: "Geringes Risiko", bg: "bg-emerald-50" }
}

function estimateRiskScore(findings: Finding[]): number {
  if (!findings?.length) return 20
  let score = 30
  for (const f of findings) {
    const s = f.severity?.toLowerCase()
    if (s === "hoch" || s === "high" || s === "kritisch") score += 18
    else if (s === "mittel" || s === "medium") score += 10
    else score += 4
  }
  return Math.min(score, 95)
}

export default function AnalysePage() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAnalyze = async () => {
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const formData = new FormData()
      if (file) {
        formData.append("file", file)
      } else if (text.trim()) {
        formData.append("text", text.trim())
      } else {
        setError("Bitte eine PDF-Datei hochladen oder Vertragstext eingeben.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/analyze-quick", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Analyse fehlgeschlagen.")
        setLoading(false)
        return
      }

      setResult(data)
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.type === "application/pdf" || dropped.name.endsWith(".pdf") || dropped.name.endsWith(".txt"))) {
      setFile(dropped)
      setText("")
    }
  }

  const parsed = result ? parseAnalysis(result.analysis) : null
  const riskScore = parsed?.riskScore ?? (parsed?.findings ? estimateRiskScore(parsed.findings) : null)
  const riskColor = riskScore !== null ? getRiskScoreColor(riskScore) : null

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚡ Schnellanalyse</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertrag analysieren</h1>
        <p className="mt-2 text-[14px] text-gray-500">
          Laden Sie einen Vertrag als PDF hoch oder fügen Sie den Text direkt ein. Die KI analysiert Risiken, extrahiert Daten und liefert Handlungsempfehlungen.
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              file ? "border-gold-400 bg-gold-50" : "border-gray-200 bg-white hover:border-gold-300 hover:bg-gold-50/30"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-3">
                <span className="text-[36px]">📄</span>
                <p className="text-[15px] font-medium text-gray-900">{file.name}</p>
                <p className="text-[13px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = "" }} className="text-[13px] font-medium text-red-600 hover:text-red-700">Datei entfernen</button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[36px]">📤</span>
                <p className="text-[15px] font-medium text-gray-900">PDF oder TXT hier ablegen</p>
                <p className="text-[13px] text-gray-500">oder</p>
                <button onClick={() => fileRef.current?.click()} className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">Datei auswählen</button>
                <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setText("") } }} />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[12px] text-gray-400">oder Text direkt eingeben</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Text Input */}
          <textarea value={text} onChange={(e) => { setText(e.target.value); if (e.target.value) setFile(null) }} placeholder="Vertragstext hier einfügen..." rows={8} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">⚠️ {error}</div>}

          <button onClick={handleAnalyze} disabled={loading || (!file && !text.trim())} className="w-full rounded-full bg-[#003856] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                KI analysiert Ihren Vertrag...
              </span>
            ) : "🔍 Vertrag analysieren"}
          </button>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[13px] font-medium text-gray-700">💡 Unterstützte Vertragstypen</p>
            <p className="mt-1 text-[12px] text-gray-500">Arbeitsverträge, SaaS-Verträge, NDAs, Lieferantenverträge, Dienstleistungsverträge, Mietverträge, Kaufverträge — alle nach deutschem Recht.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Risk Score + Meta Header */}
          <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
            {/* Risk Score Circle */}
            {riskScore !== null && riskColor && (
              <div className={`flex flex-col items-center justify-center rounded-2xl border ${riskScore >= 70 ? "border-red-200" : riskScore >= 40 ? "border-amber-200" : "border-emerald-200"} ${riskColor.bg} p-6`}>
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${riskScore * 2.64} 264`} strokeLinecap="round" className={riskColor.ring} />
                  </svg>
                  <span className="absolute text-[1.5rem] font-bold text-gray-900">{riskScore}</span>
                </div>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Risiko-Score</p>
                <p className={`mt-1 text-[12px] font-medium ${riskScore >= 70 ? "text-red-700" : riskScore >= 40 ? "text-amber-700" : "text-emerald-700"}`}>{riskColor.label}</p>
              </div>
            )}

            {/* Meta Info */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">✅</span>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">Analyse abgeschlossen</p>
                    <p className="text-[12px] text-gray-500">
                      {result.modelUsed} · {result.tokensUsed.toLocaleString()} Tokens · {(result.processingTime / 1000).toFixed(1)}s · {result.textLength.toLocaleString()} Zeichen
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {parsed?.summary && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <h2 className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                    <span className="text-[16px]">📝</span> Zusammenfassung
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{parsed.summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Data */}
          {parsed?.extractedData && Object.keys(parsed.extractedData).length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                <span className="text-[16px]">📊</span> Extrahierte Daten
              </h2>
              <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-gray-100 bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(parsed.extractedData).map(([key, val]) => (
                  <div key={key} className="bg-white p-3">
                    <p className="text-[11px] font-medium text-gray-400">{key}</p>
                    <p className="mt-0.5 text-[14px] font-medium text-gray-900">{typeof val === "boolean" ? (val ? "Ja" : "Nein") : String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings / Risks */}
          {parsed?.findings && parsed.findings.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                <span className="text-[16px]">⚠️</span> Identifizierte Risiken
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">{parsed.findings.length}</span>
              </h2>
              {parsed.findings.map((finding, i) => {
                const color = getSeverityColor(finding.severity)
                return (
                  <div key={i} className={`rounded-2xl border ${color.border} ${color.bg} p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                        <h3 className="text-[14px] font-semibold text-gray-900">{finding.title}</h3>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${color.badge}`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-gray-700">{finding.explanation}</p>
                    {finding.quote && (
                      <div className="mt-3 rounded-lg border-l-2 border-gray-300 bg-white/60 px-3 py-2">
                        <p className="text-[12px] italic text-gray-500">&ldquo;{finding.quote}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Recommended Actions */}
          {parsed?.recommendedActions && parsed.recommendedActions.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                <span className="text-[16px]">💡</span> Handlungsempfehlungen
              </h2>
              <div className="mt-4 space-y-2.5">
                {parsed.recommendedActions.map((action, i) => (
                  <div key={i} className="flex gap-3 rounded-xl bg-gold-50/50 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-200 text-[10px] font-bold text-gold-800">{i + 1}</span>
                    <p className="text-[13px] leading-relaxed text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback: Raw text if no structured data parsed */}
          {!parsed?.findings && !parsed?.summary && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-[14px] font-semibold text-gray-900">📋 Analyse-Ergebnis</h2>
              <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
                {typeof result.analysis === "string" ? result.analysis : JSON.stringify(result.analysis, null, 2)}
              </div>
            </div>
          )}

          {/* Text Preview */}
          <details className="group rounded-xl border border-gray-100 bg-gray-50">
            <summary className="cursor-pointer px-4 py-3 text-[12px] font-medium text-gray-500 hover:text-gray-700">
              📄 Extrahierter Text anzeigen ({result.textLength.toLocaleString()} Zeichen)
            </summary>
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-[12px] text-gray-400 whitespace-pre-wrap">{result.textPreview}</p>
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setFile(null); setText("") }} className="flex-1 rounded-full border border-gray-200 bg-white py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50">
              📤 Neuen Vertrag analysieren
            </button>
            <Link href="/dashboard" className="flex-1 rounded-full bg-[#003856] py-3 text-center text-[14px] font-medium text-white hover:bg-[#002a42]">
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
