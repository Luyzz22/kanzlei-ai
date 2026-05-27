"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

type FlowState = "idle" | "uploading" | "starting" | "error"

const CONTRACT_TYPES_DE = [
  "Arbeitsvertrag",
  "SaaS-Vertrag",
  "NDA",
  "Dienstleistungsvertrag",
  "Lieferantenvertrag",
  "Mietvertrag",
  "Kaufvertrag",
  "Lizenzvertrag",
  "Rahmenvertrag",
  "AGB-Abgleich",
  "Lieferanten-Rahmenvertrag",
]

const CONTRACT_TYPES_EN = [
  "Supplier Agreement (EN)",
  "NDA (English)",
  "Service Agreement (EN)",
  "Master Service Agreement (EN)",
  "Purchase Agreement (EN)",
  "License Agreement (EN)",
  "SaaS Agreement (EN)",
]

export default function AnalysePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [contractType, setContractType] = useState("")
  const [flowState, setFlowState] = useState<FlowState>("idle")
  const [statusMsg, setStatusMsg] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isLoading = flowState === "uploading" || flowState === "starting"
  const canSubmit = !isLoading && (file !== null || text.trim().length >= 10)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setText("")
      setError(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setText("")
      setError(null)
    }
  }

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setFlowState("uploading")
    setStatusMsg("Dokument wird hochgeladen und erfasst…")

    try {
      // Step 1: Upload file / text → create workspace document
      const formData = new FormData()
      if (file) {
        formData.append("file", file)
      } else {
        formData.append("text", text.trim())
      }
      if (contractType) formData.append("contractType", contractType)

      const intakeRes = await fetch("/api/workspace/quick-intake", {
        method: "POST",
        body: formData
      })
      const intakeData = await intakeRes.json() as { documentId?: string; error?: string }

      if (!intakeRes.ok || !intakeData.documentId) {
        setError(intakeData.error ?? "Upload fehlgeschlagen. Bitte erneut versuchen.")
        setFlowState("error")
        return
      }

      const { documentId } = intakeData

      // Step 2: Trigger analysis (best-effort — redirect regardless)
      setFlowState("starting")
      setStatusMsg("KI-Analyse wird gestartet…")

      await fetch("/api/workspace/analysis/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId })
      }).catch(() => {
        // Non-fatal: analysis can be triggered manually from the document page
      })

      // Step 3: Redirect to document detail page
      router.push(`/workspace/dokumente/${documentId}`)
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.")
      setFlowState("error")
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      {/* Header */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚡ Schnellanalyse</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertrag analysieren</h1>
      <p className="mt-2 text-[14px] text-gray-500">
        Laden Sie einen Vertrag hoch — er wird sofort im Workspace erfasst und von der KI analysiert.
      </p>

      <div className="mt-8 space-y-5">
        {/* Drop Zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Datei hochladen"
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            file
              ? "border-gold-400 bg-gold-50"
              : "cursor-pointer border-gray-200 bg-white hover:border-gold-300 hover:bg-gold-50/30"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !file && fileRef.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !file) fileRef.current?.click() }}
        >
          {file ? (
            <div className="space-y-3">
              <span className="text-[36px]">📄</span>
              <p className="text-[15px] font-medium text-gray-900">{file.name}</p>
              <p className="text-[13px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
              <button
                type="button"
                onClick={clearFile}
                className="text-[13px] font-medium text-red-600 hover:text-red-700"
              >
                Datei entfernen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[36px]">📤</span>
              <p className="text-[15px] font-medium text-gray-900">PDF, DOCX oder TXT hier ablegen</p>
              <p className="text-[13px] text-gray-500">oder</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
              >
                Datei auswählen
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Text Input — only shown when no file is selected */}
        {!file && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[12px] text-gray-400">oder Text direkt eingeben</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null) }}
              placeholder="Vertragstext hier einfügen…"
              rows={7}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
            />
          </>
        )}

        {/* Contract Type Selector */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
            Vertragstyp <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
          >
            <option value="">Automatisch erkennen</option>
            <optgroup label="Deutsch">
              {CONTRACT_TYPES_DE.map((t) => <option key={t} value={t}>{t}</option>)}
            </optgroup>
            <optgroup label="English">
              {CONTRACT_TYPES_EN.map((t) => <option key={t} value={t}>{t}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Progress */}
        {isLoading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
              <p className="text-[13px] font-medium text-blue-700">{statusMsg}</p>
            </div>
            <p className="mt-1 pl-7 text-[12px] text-blue-500">
              Sie werden automatisch zum Ergebnis weitergeleitet.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-full bg-[#003856] py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {statusMsg}
            </span>
          ) : (
            "⚡ Analysieren & im Workspace speichern"
          )}
        </button>

        {/* Info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[13px] font-medium text-gray-700">🔒 Enterprise-Verarbeitung</p>
          <p className="mt-1 text-[12px] text-gray-500">
            Das Dokument wird mandantengebunden im Workspace erfasst, mit Audit-Trail gespeichert und
            sofort durch die v5.0 KI-Analyse-Pipeline verarbeitet. Das Ergebnis bleibt persistent
            im Workspace abrufbar.
          </p>
        </div>
      </div>
    </div>
  )
}
