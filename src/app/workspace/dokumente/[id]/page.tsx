"use client"

import { useParams } from "next/navigation"
import Link from "next/link"

export default function DokumentDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/workspace/dokumente" className="text-[13px] text-gray-400 hover:text-gray-600">← Dokumente</Link>
            <span className="text-gray-300">/</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-500">{id}</span>
          </div>
          <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertragsdetail</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/workspace/dokumente/${id}/dossier`} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50">📁 Dossier</Link>
          <Link href={`/workspace/dokumente/${id}/evidence`} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50">🔍 Nachweise</Link>
          <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#002a42]">⚡ Neu analysieren</Link>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">Status</p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Analysiert</span>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">Risiko-Score</p>
          <p className="mt-1 text-[20px] font-bold text-amber-600">—</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">Findings</p>
          <p className="mt-1 text-[20px] font-bold text-gray-900">—</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">Letzte Analyse</p>
          <p className="mt-1 text-[14px] font-medium text-gray-700">—</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-gray-200">
        {["Uebersicht", "Analyse", "Metadaten", "Versionen"].map((tab, i) => (
          <button key={tab} className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${i === 0 ? "border-[#003856] text-[#003856]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[14px] font-semibold text-gray-900">📄 Vertragsinformationen</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Vertragstyp", value: "Wird bei Analyse erkannt" },
                { label: "Parteien", value: "Wird bei Analyse extrahiert" },
                { label: "Laufzeit", value: "Wird bei Analyse extrahiert" },
                { label: "Kuendigungsfrist", value: "Wird bei Analyse extrahiert" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-b-0">
                  <span className="text-[13px] text-gray-500">{row.label}</span>
                  <span className="text-[13px] font-medium text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[14px] font-semibold text-gray-900">⚡ Schnellaktionen</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { emoji: "🧠", label: "Vertrag analysieren", href: "/workspace/analyse" },
                { emoji: "🤖", label: "Im Copilot besprechen", href: "/workspace/copilot" },
                { emoji: "⚖️", label: "Mit AEB vergleichen", href: "/workspace/vergleich" },
                { emoji: "📤", label: "PDF-Report erstellen", href: "/workspace/history" },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gold-50 hover:text-[#003856]">
                  <span className="text-[16px]">{action.emoji}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-[13px] font-semibold text-gray-900">Dokument</h3>
            <div className="mt-3 space-y-2">
              <div className="text-[12px] text-gray-500">ID: <span className="font-mono text-gray-700">{id}</span></div>
              <div className="text-[12px] text-gray-500">Mandant: <span className="text-gray-700">demo-kanzlei</span></div>
              <div className="text-[12px] text-gray-500">Erstellt: <span className="text-gray-700">{new Date().toLocaleDateString("de-DE")}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-[13px] font-semibold text-gray-900">Letzte Aktivitaeten</h3>
            <div className="mt-3 space-y-2.5">
              {[
                { emoji: "📤", text: "Dokument hochgeladen", time: "Gerade eben" },
                { emoji: "🧠", text: "Analyse gestartet", time: "—" },
                { emoji: "✅", text: "Review abgeschlossen", time: "—" },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[12px]">{act.emoji}</span>
                  <div>
                    <p className="text-[12px] text-gray-700">{act.text}</p>
                    <p className="text-[10px] text-gray-400">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
