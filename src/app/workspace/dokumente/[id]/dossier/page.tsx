"use client"

import { useParams } from "next/navigation"
import Link from "next/link"

const timeline = [
  { emoji: "📤", title: "Dokument erfasst", desc: "Vertrag im Workspace hochgeladen und mandantengebunden gespeichert.", actor: "demo@kanzlei-ai.com", time: "Heute, 10:00", type: "upload" },
  { emoji: "🧠", title: "KI-Analyse durchgefuehrt", desc: "Multi-Provider-Analyse mit Claude Sonnet 4. Risiko-Score berechnet, Klauseln extrahiert, Fristen identifiziert.", actor: "System (KI)", time: "Heute, 10:01", type: "analysis" },
  { emoji: "✏️", title: "Formulierungsvorschlaege generiert", desc: "Fuer 3 Hochrisiko-Findings wurden alternative Klauseln formuliert.", actor: "System (KI)", time: "Heute, 10:01", type: "revision" },
  { emoji: "🤖", title: "Copilot-Anfrage", desc: "Nutzer hat Rueckfrage zu Kuendigungsfristen gestellt. 342 Tokens verbraucht.", actor: "demo@kanzlei-ai.com", time: "Heute, 10:05", type: "copilot" },
  { emoji: "📄", title: "PDF-Report exportiert", desc: "Analyseergebnis als druckoptimierter PDF-Report heruntergeladen.", actor: "demo@kanzlei-ai.com", time: "Heute, 10:12", type: "export" },
  { emoji: "✅", title: "Review abgeschlossen", desc: "Vertrag nach Pruefung als 'akzeptiert mit Auflagen' markiert.", actor: "demo@kanzlei-ai.com", time: "Heute, 10:30", type: "review" },
]

export default function DossierPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <Link href={`/workspace/dokumente/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← Vertragsdetail</Link>
        <span className="text-gray-300">/</span>
        <span className="text-[13px] text-gray-500">Dossier</span>
      </div>
      <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertragsdossier</h1>
      <p className="mt-2 text-[14px] text-gray-500">Chronologische Uebersicht aller Analysen, Kommentare und Entscheidungen zu Dokument <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[12px]">{id}</code>.</p>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">{timeline.length}</p>
          <p className="text-[10px] text-gray-400">Eintraege</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">1</p>
          <p className="text-[10px] text-gray-400">Analysen</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">1</p>
          <p className="text-[10px] text-gray-400">Exporte</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-emerald-600">✓</p>
          <p className="text-[10px] text-gray-400">Review-Status</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-10 space-y-0">
        {timeline.map((event, i) => (
          <div key={i} className="relative flex gap-4 pb-8 last:pb-0">
            {i < timeline.length - 1 && <div className="absolute left-[15px] top-8 h-full w-px bg-gray-200" />}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[14px]">{event.emoji}</div>
            <div className="flex-1 rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-gray-900">{event.title}</h3>
                <span className="shrink-0 text-[11px] text-gray-400">{event.time}</span>
              </div>
              <p className="mt-1 text-[13px] text-gray-500">{event.desc}</p>
              <p className="mt-2 text-[11px] text-gray-400">von {event.actor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
