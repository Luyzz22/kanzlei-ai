"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"

type FileEntry = {
  id: string
  file: File
  status: "queued" | "uploading" | "success" | "error"
  message?: string
  documentId?: string
}

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"]
const MAX_SIZE = 4 * 1024 * 1024

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext))
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.endsWith(".pdf")) return "\uD83D\uDCC4"
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "\uD83D\uDDD2\uFE0F"
  return "\uD83D\uDCDD"
}

export function BulkUploadForm() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [org, setOrg] = useState("")
  const [docType, setDocType] = useState("Vertrag")
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles)
      .filter(f => isAccepted(f) && f.size <= MAX_SIZE && f.size > 0)
      .map(f => ({ id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`, file: f, status: "queued" as const }))
    setFiles(prev => [...prev, ...entries])
    setDone(false)
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  async function processQueue() {
    if (!org.trim() || org.trim().length < 2) return
    setProcessing(true)
    setDone(false)

    const queue = files.filter(f => f.status === "queued")
    for (const entry of queue) {
      setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "uploading" } : f))

      try {
        const fd = new FormData()
        fd.append("file", entry.file)
        fd.append("organizationName", org.trim())
        fd.append("documentType", docType.trim() || "Vertrag")

        const res = await fetch("/api/workspace/bulk-upload", { method: "POST", body: fd })
        const data = await res.json()

        if (res.ok && data.status === "success") {
          setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "success", message: data.title, documentId: data.documentId } : f))
        } else {
          setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "error", message: data.error || data.message || "Fehler" } : f))
        }
      } catch {
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: "error", message: "Netzwerkfehler" } : f))
      }

      // Small delay between uploads to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
    }

    setProcessing(false)
    setDone(true)
  }

  const queued = files.filter(f => f.status === "queued").length
  const succeeded = files.filter(f => f.status === "success").length
  const failed = files.filter(f => f.status === "error").length
  const total = files.length
  const canStart = queued > 0 && org.trim().length >= 2 && !processing

  return (
    <div className="space-y-5">
      {/* Metadata */}
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-gray-700">Organisation / Mandant</span>
          <input
            type="text"
            value={org}
            onChange={e => setOrg(e.target.value)}
            placeholder="z.B. DERMALOG GmbH"
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-[#003856] focus:outline-none focus:ring-2 focus:ring-[#003856]/10"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-gray-700">Dokumenttyp (f\u00FCr alle)</span>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[14px] text-gray-900 focus:border-[#003856] focus:outline-none focus:ring-2 focus:ring-[#003856]/10"
          >
            <option value="Vertrag">Vertrag (allgemein)</option>
            <option value="Lieferantenvertrag">Lieferantenvertrag</option>
            <option value="NDA">NDA / Geheimhaltungsvereinbarung</option>
            <option value="SaaS-Vertrag">SaaS-Vertrag</option>
            <option value="Arbeitsvertrag">Arbeitsvertrag</option>
            <option value="Dienstleistungsvertrag">Dienstleistungsvertrag</option>
            <option value="Mietvertrag">Mietvertrag</option>
            <option value="Kaufvertrag">Kaufvertrag</option>
            <option value="AVV">Auftragsverarbeitungsvereinbarung</option>
          </select>
        </label>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${
          dragOver
            ? "border-[#003856] bg-[#003856]/5"
            : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span className="text-[36px]">{dragOver ? "\uD83D\uDCE5" : "\uD83D\uDCC1"}</span>
        <p className="mt-3 text-[14px] font-medium text-gray-700">
          {dragOver ? "Dateien hier ablegen" : "Dateien hierher ziehen oder klicken"}
        </p>
        <p className="mt-1 text-[12px] text-gray-400">PDF, DOC, DOCX, TXT \u00B7 max. 4 MB pro Datei \u00B7 mehrere gleichzeitig</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
        />
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          {/* Progress Bar */}
          {(processing || done) && (
            <div className="border-b border-gray-100 px-5 py-3">
              <div className="flex items-center justify-between text-[12px] text-gray-500">
                <span>{processing ? `Verarbeite ${succeeded + failed + 1} von ${total} \u2026` : `${succeeded} von ${total} erfolgreich`}</span>
                <span className="font-medium">{Math.round(((succeeded + failed) / Math.max(total, 1)) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${failed > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${((succeeded + failed) / Math.max(total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* File List */}
          <div className="divide-y divide-gray-50">
            {files.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-[18px]">{fileIcon(entry.file.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-gray-900">{entry.file.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatSize(entry.file.size)}
                    {entry.message && entry.status === "success" && (
                      <> \u00B7 <Link href={`/workspace/dokumente/${entry.documentId}`} className="font-medium text-[#003856]">{entry.message} \u2192</Link></>
                    )}
                    {entry.message && entry.status === "error" && (
                      <> \u00B7 <span className="text-rose-600">{entry.message}</span></>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {entry.status === "queued" && !processing && (
                    <button onClick={() => removeFile(entry.id)} className="rounded p-1 text-[12px] text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      \u2715
                    </button>
                  )}
                  {entry.status === "uploading" && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#003856]" />
                  )}
                  {entry.status === "success" && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">\u2713</span>
                  )}
                  {entry.status === "error" && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] text-rose-700">\u2715</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-[11px] text-gray-400">
              {queued} in Warteschlange \u00B7 {succeeded} erfolgreich{failed > 0 ? ` \u00B7 ${failed} fehlgeschlagen` : ""}
            </p>
            <div className="flex items-center gap-2">
              {!processing && files.length > 0 && (
                <button
                  onClick={() => { setFiles([]); setDone(false) }}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:bg-gray-50"
                >
                  Zur\u00FCcksetzen
                </button>
              )}
              <button
                onClick={processQueue}
                disabled={!canStart}
                className="inline-flex items-center gap-2 rounded-lg bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Verarbeite \u2026
                  </>
                ) : (
                  <>{queued} Dokument{queued !== 1 ? "e" : ""} hochladen</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Summary */}
      {done && succeeded > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <span className="text-[22px]">\u2705</span>
          <div>
            <p className="text-[14px] font-semibold text-emerald-900">{succeeded} Dokument{succeeded !== 1 ? "e" : ""} erfolgreich hochgeladen</p>
            <p className="mt-0.5 text-[12px] text-emerald-700">
              Alle Dokumente wurden tenant-gebunden gespeichert und die Textextraktion gestartet.{" "}
              <Link href="/workspace/dokumente" className="font-medium underline">Zum Workspace \u2192</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
