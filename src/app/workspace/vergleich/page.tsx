"use client"

import { useState, useRef } from "react"

type ComparisonFinding = {
  clause: string
  docA: string
  docB: string
  severity: "niedrig" | "mittel" | "hoch"
  assessment: string
}

type ComparisonResult = {
  summary: string
  overallRisk: number
  matchPercentage: number
  findings: ComparisonFinding[]
  missingInA: string[]
  missingInB: string[]
  recommendations: string[]
}

export default function VergleichPage() {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [textA, setTextA] = useState("")
  const [textB, setTextB] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const refA = useRef<HTMLInputElement>(null)
  const refB = useRef<HTMLInputElement>(null)

  const handleCompare = async () => {
    setError(null)
    setLoading(true)
    try {
      const formData = new FormData()
      if (fileA) formData.append("fileA", fileA)
      else if (textA.trim()) formData.append("textA", textA.trim())
      else { setError("Bitte Dokument A hochladen oder Text eingeben."); setLoading(false); return }

      if (fileB) formData.append("fileB", fileB)
      else if (textB.trim()) formData.append("textB", textB.trim())
      else { setError("Bitte Dokument B hochladen oder Text eingeben."); setLoading(false); return }

      const res = await fetch("/api/compare", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Vergleich fehlgeschlagen."); setLoading(false); return }
      setResult(data.parsed)
    } catch { setError("Technischer Fehler.") }
    finally { setLoading(false) }
  }

  const getSevColor = (s: string) => {
    if (s === "hoch") return { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" }
    if (s === "mittel") return { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" }
    return { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚖️ Vergleichsanalyse</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">AGB vs. AEB Abgleich</h1>
      <p className="mt-2 text-[14px] text-gray-500">Laden Sie zwei Dokumente hoch — z.B. Lieferanten-AGB und Ihre Einkaufsbedingungen. Die KI identifiziert Abweichungen, Widersprueche und fehlende Klauseln.</p>

      {!result ? (
        <div className="mt-8 space-y-6">
          {/* Two-column upload */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Document A */}
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">📄 Dokument A — Lieferanten-AGB</h2>
              <div className={`mt-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${fileA ? "border-gold-400 bg-gold-50" : "border-gray-200 bg-white hover:border-gold-300"}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFileA(f); setTextA("") } }}>
                {fileA ? (
                  <div>
                    <span className="text-[28px]">📄</span>
                    <p className="mt-2 text-[14px] font-medium text-gray-900">{fileA.name}</p>
                    <button onClick={() => { setFileA(null); if (refA.current) refA.current.value = "" }} className="mt-2 text-[12px] text-red-600 hover:text-red-700">Entfernen</button>
                  </div>
                ) : (
                  <div>
                    <span className="text-[28px]">📤</span>
                    <p className="mt-2 text-[13px] text-gray-500">PDF hier ablegen</p>
                    <button onClick={() => refA.current?.click()} className="mt-2 rounded-full bg-[#003856] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#002a42]">Datei waehlen</button>
                    <input ref={refA} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileA(f); setTextA("") } }} />
                  </div>
                )}
              </div>
              {!fileA && <textarea value={textA} onChange={(e) => { setTextA(e.target.value); if (e.target.value) setFileA(null) }} placeholder="Oder Text einfuegen..." rows={4} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />}
            </div>

            {/* Document B */}
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">📋 Dokument B — Ihre AEB / Vorgaben</h2>
              <div className={`mt-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${fileB ? "border-gold-400 bg-gold-50" : "border-gray-200 bg-white hover:border-gold-300"}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFileB(f); setTextB("") } }}>
                {fileB ? (
                  <div>
                    <span className="text-[28px]">📋</span>
                    <p className="mt-2 text-[14px] font-medium text-gray-900">{fileB.name}</p>
                    <button onClick={() => { setFileB(null); if (refB.current) refB.current.value = "" }} className="mt-2 text-[12px] text-red-600 hover:text-red-700">Entfernen</button>
                  </div>
                ) : (
                  <div>
                    <span className="text-[28px]">📤</span>
                    <p className="mt-2 text-[13px] text-gray-500">PDF hier ablegen</p>
                    <button onClick={() => refB.current?.click()} className="mt-2 rounded-full bg-[#003856] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#002a42]">Datei waehlen</button>
                    <input ref={refB} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFileB(f); setTextB("") } }} />
                  </div>
                )}
              </div>
              {!fileB && <textarea value={textB} onChange={(e) => { setTextB(e.target.value); if (e.target.value) setFileB(null) }} placeholder="Oder Text einfuegen..." rows={4} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />}
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

          <button onClick={handleCompare} disabled={loading || ((!fileA && !textA.trim()) || (!fileB && !textB.trim()))} className="w-full rounded-full bg-[#003856] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                KI vergleicht Dokumente...
              </span>
            ) : "⚖️ Dokumente vergleichen"}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Score Header */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`rounded-2xl border p-5 text-center ${result.overallRisk >= 70 ? "border-red-200 bg-red-50" : result.overallRisk >= 40 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
              <p className="text-[11px] font-semibold uppercase text-gray-500">Abweichungs-Risiko</p>
              <p className={`mt-1 text-[32px] font-bold ${result.overallRisk >= 70 ? "text-red-700" : result.overallRisk >= 40 ? "text-amber-700" : "text-emerald-700"}`}>{result.overallRisk}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-[11px] font-semibold uppercase text-gray-500">Uebereinstimmung</p>
              <p className="mt-1 text-[32px] font-bold text-[#003856]">{result.matchPercentage}%</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-[11px] font-semibold uppercase text-gray-500">Abweichungen</p>
              <p className="mt-1 text-[32px] font-bold text-gray-900">{result.findings.length}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-[14px] font-semibold text-gray-900">📊 Zusammenfassung</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{result.summary}</p>
          </div>

          {/* Comparison Table */}
          {result.findings.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                <span>⚖️</span> Klausel-Vergleich
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">{result.findings.length}</span>
              </h2>
              <div className="mt-3 space-y-3">
                {result.findings.map((f, i) => {
                  const c = getSevColor(f.severity)
                  return (
                    <div key={i} className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[14px] font-semibold text-gray-900">{f.clause}</h3>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.badge}`}>{f.severity}</span>
                      </div>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Dokument A (Lieferant)</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{f.docA}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Dokument B (Ihre AEB)</p>
                          <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{f.docB}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[13px] text-gray-600">{f.assessment}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Missing Clauses */}
          {(result.missingInA.length > 0 || result.missingInB.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {result.missingInA.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="text-[14px] font-semibold text-amber-900">Fehlt in Lieferanten-AGB</h3>
                  <ul className="mt-3 space-y-1.5">{result.missingInA.map((m, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-amber-800"><span className="mt-0.5 text-[10px]">⚠️</span>{m}</li>)}</ul>
                </div>
              )}
              {result.missingInB.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <h3 className="text-[14px] font-semibold text-red-900">Fehlt in Ihren AEB</h3>
                  <ul className="mt-3 space-y-1.5">{result.missingInB.map((m, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-red-800"><span className="mt-0.5 text-[10px]">🔴</span>{m}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-[14px] font-semibold text-gray-900">💡 Empfehlungen</h2>
              <div className="mt-3 space-y-2">{result.recommendations.map((r, i) => (
                <div key={i} className="flex gap-3 rounded-xl bg-gold-50/50 p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-200 text-[10px] font-bold text-gold-800">{i+1}</span>
                  <p className="text-[13px] text-gray-700">{r}</p>
                </div>
              ))}</div>
            </div>
          )}

          <button onClick={() => { setResult(null); setFileA(null); setFileB(null); setTextA(""); setTextB("") }} className="rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50">← Neuer Vergleich</button>
        </div>
      )}
    </div>
  )
}
