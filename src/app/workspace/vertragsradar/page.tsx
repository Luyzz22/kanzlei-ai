"use client"

import { useState } from "react"
import Link from "next/link"

type Regulation = {
  id: string
  name: string
  shortName: string
  emoji: string
  effectiveDate: string
  status: "in_kraft" | "uebergang" | "angekuendigt"
  affectedContracts: number
  criticalCount: number
  desc: string
}

type AffectedContract = {
  id: string
  name: string
  type: string
  risk: "kritisch" | "hoch" | "mittel" | "niedrig"
  clauses: string[]
  action: string
  deadline: string
}

const regulations: Regulation[] = [
  { id: "eu-ai-act", name: "EU AI Act (Regulation 2024/1689)", shortName: "EU AI Act", emoji: "🤖", effectiveDate: "02.08.2026", status: "uebergang", affectedContracts: 12, criticalCount: 4, desc: "High-Risk-Pflichten fuer KI-Systeme. Transparenz, Dokumentation, Human Oversight. Betrifft KI-Klauseln in Lieferantenvertraegen." },
  { id: "nis2", name: "NIS2-Umsetzungsgesetz", shortName: "NIS2", emoji: "🛡️", effectiveDate: "18.10.2024", status: "in_kraft", affectedContracts: 23, criticalCount: 8, desc: "Cybersecurity-Anforderungen in der Lieferkette. Betroffene Sektoren muessen Sicherheitsklauseln in Vertraegen verankern." },
  { id: "dsgvo-2026", name: "DSGVO-Aenderungen 2026", shortName: "DSGVO Update", emoji: "🇪🇺", effectiveDate: "01.01.2026", status: "in_kraft", affectedContracts: 47, criticalCount: 3, desc: "Aktualisierte Standardvertragsklauseln, neue Anforderungen an Auftragsverarbeitung und internationale Datentransfers." },
  { id: "e-rechnung", name: "E-Rechnungspflicht B2B", shortName: "E-Rechnung", emoji: "🧾", effectiveDate: "01.01.2027", status: "angekuendigt", affectedContracts: 31, criticalCount: 0, desc: "Verpflichtung zur elektronischen Rechnungsstellung im B2B-Verkehr. Rechnungsformat-Klauseln in Vertraegen anpassen." },
  { id: "lieferketten", name: "Lieferkettensorgfaltspflichtengesetz", shortName: "LkSG", emoji: "🔗", effectiveDate: "01.01.2024", status: "in_kraft", affectedContracts: 18, criticalCount: 5, desc: "Sorgfaltspflichten in der Lieferkette. Menschenrechts- und Umweltklauseln in Lieferantenvertraegen erforderlich." },
]

const affectedContracts: AffectedContract[] = [
  { id: "doc-001", name: "Supplier Agreement — TechVendor GmbH", type: "Lieferantenvertrag", risk: "kritisch", clauses: ["Keine KI-Transparenzklausel", "Fehlende Human-Oversight-Regelung"], action: "Nachtrag erforderlich bis 02.08.2026", deadline: "02.08.2026" },
  { id: "doc-003", name: "SaaS-Vertrag — Analytics Platform", type: "SaaS-Vertrag", risk: "kritisch", clauses: ["KI-generierte Entscheidungen ohne Offenlegung", "Keine Konformitaetsbewertung referenziert"], action: "Vertrag nachverhandeln oder kuendigen", deadline: "02.08.2026" },
  { id: "doc-002", name: "NDA — Cloud Provider Inc.", type: "NDA", risk: "hoch", clauses: ["Cybersecurity-Anforderungen fehlen (NIS2)", "Keine Incident-Reporting-Pflicht"], action: "Cybersecurity-Annex ergaenzen", deadline: "Q3 2026" },
  { id: "doc-004", name: "Rahmenvertrag — Logistik AG", type: "Rahmenvertrag", risk: "mittel", clauses: ["LkSG-Klausel vorhanden aber veraltet"], action: "LkSG-Klausel auf Stand 2026 aktualisieren", deadline: "Q4 2026" },
  { id: "doc-007", name: "Dienstleistungsvertrag — IT-Berater", type: "Dienstleistungsvertrag", risk: "niedrig", clauses: ["DSGVO-AVV verweist auf alte SCCs"], action: "SCCs auf 2026-Version aktualisieren", deadline: "Naechste Verlaengerung" },
]

export default function VertragsradarPage() {
  const [, setSelectedReg] = useState<string | null>(null)
  const [view, setView] = useState<"overview" | "detail">("overview")
  const [scanning, setScanning] = useState(false)

  const totalAffected = regulations.reduce((sum, r) => sum + r.affectedContracts, 0)
  const totalCritical = regulations.reduce((sum, r) => sum + r.criticalCount, 0)

  const riskColor = (risk: string) => {
    if (risk === "kritisch") return "bg-red-100 text-red-700 border-red-200"
    if (risk === "hoch") return "bg-amber-100 text-amber-700 border-amber-200"
    if (risk === "mittel") return "bg-blue-100 text-blue-700 border-blue-200"
    return "bg-gray-100 text-gray-600 border-gray-200"
  }

  const statusColor = (s: string) => {
    if (s === "in_kraft") return "bg-red-100 text-red-700"
    if (s === "uebergang") return "bg-amber-100 text-amber-700"
    return "bg-blue-100 text-blue-700"
  }
  const statusLabel = (s: string) => {
    if (s === "in_kraft") return "In Kraft"
    if (s === "uebergang") return "Uebergangsfrist"
    return "Angekuendigt"
  }

  const runScan = async () => {
    setScanning(true)
    await new Promise(r => setTimeout(r, 3000))
    setScanning(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003856] text-[12px] font-bold text-white">VR</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">Modul 9 · Enterprise</p>
          </div>
          <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertragsradar</h1>
          <p className="mt-1 text-[14px] text-gray-500">Regulatorischer Compliance-Monitor — Gesetzesaenderungen automatisch gegen Ihr Vertragsportfolio pruefen.</p>
        </div>
        <button onClick={runScan} disabled={scanning} className="flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:opacity-60">
          {scanning ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Portfolio wird gescannt...</>
          ) : (
            <>🔍 Portfolio-Scan starten</>
          )}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[24px] font-semibold text-gray-900">{regulations.length}</p>
          <p className="text-[11px] text-gray-400">Regulierungen ueberwacht</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[24px] font-semibold text-amber-600">{totalAffected}</p>
          <p className="text-[11px] text-gray-400">Betroffene Vertraege</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-[24px] font-semibold text-red-700">{totalCritical}</p>
          <p className="text-[11px] text-red-600">Kritische Handlungen</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[24px] font-semibold text-emerald-600">156</p>
          <p className="text-[11px] text-gray-400">Vertraege im Portfolio</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[24px] font-semibold text-[#003856]">84%</p>
          <p className="text-[11px] text-gray-400">Compliance-Quote</p>
        </div>
      </div>

      {/* Critical Alert */}
      {totalCritical > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-[14px]">⚠️</span>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-red-900">{totalCritical} kritische Compliance-Luecken identifiziert</p>
            <p className="text-[12px] text-red-700">EU AI Act (4) · NIS2 (8) · LkSG (5) — Handlungsbedarf vor naechster Enforcement-Deadline</p>
          </div>
          <button onClick={() => setView("detail")} className="shrink-0 rounded-full bg-red-600 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-red-700">Details ansehen</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {[
          { key: "overview" as const, label: "Regulierungen", emoji: "📋" },
          { key: "detail" as const, label: "Betroffene Vertraege", emoji: "📄" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setView(tab.key)} className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${view === tab.key ? "border-[#003856] text-[#003856]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>{tab.emoji} {tab.label}</button>
        ))}
      </div>

      {/* Regulations Overview */}
      {view === "overview" && (
        <div className="mt-6 space-y-3">
          {regulations.map((reg) => (
            <div key={reg.id} onClick={() => { setSelectedReg(reg.id); setView("detail") }} className="cursor-pointer rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all hover:border-gold-300 hover:shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-[22px]">{reg.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-gray-900">{reg.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(reg.status)}`}>{statusLabel(reg.status)}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-gray-500">{reg.desc}</p>
                    <div className="mt-2 flex items-center gap-4 text-[12px]">
                      <span className="text-gray-400">Wirksam: <span className="font-medium text-gray-700">{reg.effectiveDate}</span></span>
                      <span className="text-amber-600 font-medium">{reg.affectedContracts} Vertraege betroffen</span>
                      {reg.criticalCount > 0 && <span className="text-red-600 font-medium">{reg.criticalCount} kritisch</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <div className="h-2 rounded-full bg-gray-100" style={{ width: "80px" }}>
                      <div className="h-full rounded-full bg-[#003856]" style={{ width: `${Math.min(100, ((156 - reg.affectedContracts) / 156) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{Math.round(((156 - reg.affectedContracts) / 156) * 100)}%</span>
                  </div>
                  <span className="text-[10px] text-gray-300">Compliance</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Affected Contracts Detail */}
      {view === "detail" && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-500">{affectedContracts.length} Vertraege mit Handlungsbedarf</p>
            <div className="flex gap-2">
              {["kritisch", "hoch", "mittel", "niedrig"].map((r) => (
                <span key={r} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${riskColor(r)}`}>{r}</span>
              ))}
            </div>
          </div>
          {affectedContracts.map((c) => (
            <div key={c.id} className="rounded-xl border border-gray-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/workspace/dokumente/${c.id}`} className="text-[14px] font-semibold text-gray-900 hover:text-[#003856]">{c.name}</Link>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskColor(c.risk)}`}>{c.risk}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-gray-400">{c.type} · {c.id}</p>
                  <div className="mt-3 space-y-1.5">
                    {c.clauses.map((cl, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[8px] text-amber-700">!</span>
                        <span className="text-[13px] text-gray-600">{cl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-gold-50 px-3 py-2">
                    <p className="text-[12px] text-gold-800"><span className="font-medium">Empfehlung:</span> {c.action}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-gray-400">Deadline</p>
                  <p className={`text-[13px] font-semibold ${c.risk === "kritisch" ? "text-red-600" : "text-gray-700"}`}>{c.deadline}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Architecture */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Architektur & Compliance</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: "EU AI Act", status: "Limited Risk — Beratungstool mit Human Oversight" },
            { label: "DSGVO", status: "Verarbeitet nur Vertragsdaten, kein PII-Zugriff" },
            { label: "NIS2", status: "Hilft aktiv bei NIS2-Compliance der Kunden" },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-gray-100 bg-white px-3 py-2">
              <p className="text-[12px] font-medium text-gray-700">{c.label}</p>
              <p className="mt-0.5 text-[10px] text-emerald-600">{c.status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] text-gray-400">
        Letzte Aktualisierung: {new Date().toLocaleDateString("de-DE")} · Quellen: EUR-Lex, BMJ, dejure.org, BMAS · <Link href="/ki-transparenz" className="font-medium text-[#003856]">KI-Transparenz</Link>
      </div>
    </div>
  )
}
