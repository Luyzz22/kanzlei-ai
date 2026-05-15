"use client"

import { useState } from "react"
import { UploadIntakeForm } from "@/app/workspace/upload/upload-intake-form"
import { BulkUploadForm } from "@/app/workspace/upload/bulk-upload-form"

export default function WorkspaceUploadPage() {
  const [tab, setTab] = useState<"single" | "bulk">("single")

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📤 Workspace</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Dokumente hochladen</h1>
      <p className="mt-2 text-[14px] text-gray-500">Erfassen Sie Dokumente für die Verarbeitung im Workspace. Alle Eingänge werden mandantengebunden gespeichert.</p>

      {/* Tab Navigation */}
      <div className="mt-8 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setTab("single")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
            tab === "single"
              ? "bg-white text-[#003856] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📄 Einzelnes Dokument
        </button>
        <button
          onClick={() => setTab("bulk")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
            tab === "bulk"
              ? "bg-white text-[#003856] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📁 Stapel-Upload
        </button>
      </div>

      <div className="mt-6">
        {tab === "single" ? <UploadIntakeForm /> : <BulkUploadForm />}
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-[13px] font-medium text-gray-700">💡 Tipp</p>
        <p className="mt-1 text-[12px] text-gray-500">
          {tab === "single"
            ? <>Für eine schnelle KI-Analyse ohne Workspace-Erfassung nutzen Sie die <a href="/workspace/analyse" className="font-medium text-[#003856] hover:text-[#00507a]">⚡ Schnellanalyse</a>.</>
            : "Im Stapel-Upload werden alle Dateien mit der gleichen Organisation und dem gleichen Dokumenttyp erfasst. Titel werden automatisch aus dem Dateinamen abgeleitet."
          }
        </p>
      </div>
    </div>
  )
}
