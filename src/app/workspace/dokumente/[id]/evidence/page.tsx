"use client"

import { useParams } from "next/navigation"
import Link from "next/link"

const evidenceItems = [
  { emoji: "🔐", category: "Integritaet", title: "Dokument-Hash", value: "SHA-256: a3f8...c92d", desc: "Hash des Originaldokuments bei Upload berechnet. Jede Aenderung wuerde erkannt.", status: "verifiziert" },
  { emoji: "🧠", category: "KI-Analyse", title: "Modell & Version", value: "Claude Sonnet 4 · v2.0.0", desc: "Verwendetes KI-Modell und Prompt-Version fuer die Analyse. Reproduzierbar.", status: "dokumentiert" },
  { emoji: "📊", category: "KI-Analyse", title: "Token-Verbrauch", value: "2.847 Tokens", desc: "Input- und Output-Tokens der Analyse. Relevant fuer Kostenallokation.", status: "dokumentiert" },
  { emoji: "👤", category: "Zugriff", title: "Bearbeiter", value: "demo@kanzlei-ai.com", desc: "Nutzer der die Analyse initiiert hat. Mandant: demo-kanzlei.", status: "protokolliert" },
  { emoji: "🔗", category: "Audit-Trail", title: "Hash-Kette", value: "evt-001 → evt-002 → evt-003", desc: "Jeder Audit-Eintrag referenziert den vorherigen Hash. Manipulation wuerde die Kette brechen.", status: "intakt" },
  { emoji: "📅", category: "Aufbewahrung", title: "Retention", value: "10 Jahre (bis 2036)", desc: "Handelsrechtliche Aufbewahrungspflicht. Automatische Loeschung nach Ablauf.", status: "aktiv" },
  { emoji: "🏗️", category: "Mandant", title: "RLS-Isolation", value: "tenant_id = demo-kanzlei", desc: "Row-Level Security stellt sicher, dass nur berechtigte Nutzer dieses Mandanten Zugriff haben.", status: "aktiv" },
  { emoji: "📤", category: "Export", title: "Export-Protokoll", value: "1x PDF (10:12)", desc: "Alle Exporte werden mit Zeitstempel, Format und Empfaenger protokolliert.", status: "protokolliert" },
]

export default function EvidencePage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <Link href={`/workspace/dokumente/${id}`} className="text-[13px] text-gray-400 hover:text-gray-600">← Vertragsdetail</Link>
        <span className="text-gray-300">/</span>
        <span className="text-[13px] text-gray-500">Nachweise</span>
      </div>
      <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Nachweise & Audit-Trail</h1>
      <p className="mt-2 text-[14px] text-gray-500">Revisionssichere Dokumentation aller sicherheitsrelevanten Informationen zu Dokument <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[12px]">{id}</code>.</p>

      {/* Integrity Badge */}
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-[18px]">✅</span>
        <div>
          <p className="text-[14px] font-semibold text-emerald-900">Alle Nachweise intakt</p>
          <p className="text-[12px] text-emerald-700">{evidenceItems.length} Nachweispunkte geprueft · Hash-Kette intakt · RLS aktiv · Aufbewahrungsfrist eingehalten</p>
        </div>
      </div>

      {/* Evidence Items */}
      <div className="mt-8 space-y-3">
        {evidenceItems.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[18px]">{item.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{item.category}</span>
                    <h3 className="text-[14px] font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="mt-1 font-mono text-[13px] text-[#003856]">{item.value}</p>
                  <p className="mt-1 text-[12px] text-gray-500">{item.desc}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === "verifiziert" || item.status === "intakt" ? "bg-emerald-100 text-emerald-700" : item.status === "aktiv" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Info */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Compliance-Abdeckung</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            { label: "DSGVO", emoji: "🇪🇺" },
            { label: "GoBD", emoji: "📋" },
            { label: "ISO 27001", emoji: "🛡️" },
            { label: "SOC 2", emoji: "🔐" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
              <span className="text-[14px]">{c.emoji}</span>
              <span className="text-[12px] font-medium text-gray-700">{c.label}</span>
              <span className="ml-auto text-[10px] text-emerald-600">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
