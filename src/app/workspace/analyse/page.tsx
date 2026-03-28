"use client"

import { useState, useRef } from "react"
import Link from "next/link"

type AnalysisResult = {
  status: string
  analysis: string
  modelUsed: string
  tokensUsed: number
  processingTime: number
  textLength: number
  textPreview: string
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

      const res = await fetch("/api/analyze-quick", {
        method: "POST",
        body: formData,
      })

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

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
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
                <button
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = "" }}
                  className="text-[13px] font-medium text-red-600 hover:text-red-700"
                >
                  Datei entfernen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[36px]">📤</span>
                <p className="text-[15px] font-medium text-gray-900">PDF oder TXT hier ablegen</p>
                <p className="text-[13px] text-gray-500">oder</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
                >
                  Datei auswählen
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) { setFile(f); setText("") }
                  }}
                />
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
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); if (e.target.value) setFile(null) }}
            placeholder="Vertragstext hier einfügen..."
            rows={8}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
          />

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleAnalyze}
            disabled={loading || (!file && !text.trim())}
            className="w-full rounded-full bg-[#003856] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                KI analysiert...
              </span>
            ) : (
              "🔍 Vertrag analysieren"
            )}
          </button>

          {/* Info */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[13px] font-medium text-gray-700">💡 Unterstützte Vertragstypen</p>
            <p className="mt-1 text-[12px] text-gray-500">
              Arbeitsverträge, SaaS-Verträge, NDAs, Lieferantenverträge, Dienstleistungsverträge, Mietverträge, Kaufverträge und allgemeine Verträge — alle nach deutschem Recht.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Header */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">✅</span>
              <div>
                <p className="text-[15px] font-semibold text-emerald-900">Analyse abgeschlossen</p>
                <p className="text-[12px] text-emerald-700">
                  Modell: {result.modelUsed} · {result.tokensUsed.toLocaleString()} Tokens · {(result.processingTime / 1000).toFixed(1)}s · {result.textLength.toLocaleString()} Zeichen
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Result */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-[17px] font-semibold text-gray-900">📋 Vertragsanalyse</h2>
            <div className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700">
              {typeof result.analysis === "string"
                ? result.analysis
                : JSON.stringify(result.analysis, null, 2)
              }
            </div>
          </div>

          {/* Text Preview */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-medium text-gray-500">📝 Textvorschau (erste 500 Zeichen)</p>
            <p className="mt-2 text-[12px] text-gray-400 line-clamp-6">{result.textPreview}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setFile(null); setText("") }}
              className="flex-1 rounded-full border border-gray-200 bg-white py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50"
            >
              📤 Neuen Vertrag analysieren
            </button>
            <Link
              href="/dashboard"
              className="flex-1 rounded-full bg-[#003856] py-3 text-center text-[14px] font-medium text-white hover:bg-[#002a42]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
