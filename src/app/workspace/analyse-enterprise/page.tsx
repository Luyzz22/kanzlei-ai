"use client"

import { useState } from "react"
import Link from "next/link"
import { SignatureStatusCard } from "@/components/analysis/signature-status-card"
import { RiskDimensionsDisplay } from "@/components/analysis/risk-dimensions-display"
import { ClauseGapDisplay } from "@/components/analysis/clause-gap-display"
import { calculateRiskScore, calculateMatchScore, RiskFinding } from "@/lib/risk-engine/multi-dimensional"
import { detectClauseGaps } from "@/lib/clause-library/gap-detection"
import { ContractTypeId, getContractProfile, getVisibleSections } from "@/lib/contract-types/registry"

const DEMO_CONTRACTS: { id: string; name: string; type: ContractTypeId; findings: RiskFinding[]; detectedClauses: string[]; matchScore?: { structural: number; substantive: number } }[] = [
  {
    id: "demo-saas-critical",
    name: "SaaS-Vertrag — Cloud Analytics Platform",
    type: "saas",
    findings: [
      { id: "f1", dimension: "compliance", severity: "kritisch", title: "AVV fehlt komplett", description: "Bei Verarbeitung personenbezogener Daten ist ein AVV nach Art. 28 DSGVO zwingend erforderlich.", isSignatureBlocker: true, recommendedAction: "AVV gemaess Art. 28 DSGVO als Anlage ergaenzen — Standardformulierung verfuegbar.", bgbReference: "Art. 28 DSGVO" },
      { id: "f2", dimension: "legal", severity: "kritisch", title: "Haftungsbegrenzung uneingeschraenkt", description: "Die unbegrenzte Haftung ist nach AGB-Recht (§ 309 Nr. 7 BGB) unwirksam und stellt ein erhebliches finanzielles Risiko dar.", isSignatureBlocker: true, recommendedAction: "Haftungsobergrenze auf 12 Monatsentgelte begrenzen, Ausnahmen fuer Vorsatz und grobe Fahrlaessigkeit", bgbReference: "§ 309 Nr. 7 BGB" },
      { id: "f3", dimension: "operational", severity: "hoch", title: "Keine SLA-Garantie", description: "Verfuegbarkeit, Reaktionszeiten und Service Credits fehlen.", isSignatureBlocker: false, recommendedAction: "SLA-Anhang mit 99,5% Verfuegbarkeit und Service Credits ergaenzen" },
      { id: "f4", dimension: "compliance", severity: "hoch", title: "Datenexport nicht gewaehrleistet", description: "Bei Vertragsende ist nicht klar geregelt wie der Kunde seine Daten zurueckerhaelt.", isSignatureBlocker: false, recommendedAction: "Datenportabilitaetsklausel mit 30-Tage-Aufbewahrung ergaenzen" },
      { id: "f5", dimension: "financial", severity: "mittel", title: "Automatische Verlaengerung ohne Hinweis", description: "Vertrag verlaengert sich automatisch um 12 Monate ohne Hinweispflicht.", isSignatureBlocker: false, recommendedAction: "Hinweispflicht 90 Tage vor Verlaengerung einbauen" }
    ],
    detectedClauses: ["sla-uptime"],
    matchScore: { structural: 78, substantive: 42 }
  },
  {
    id: "demo-nda-clean",
    name: "NDA — Investment Round Series B",
    type: "nda",
    findings: [
      { id: "n1", dimension: "legal", severity: "mittel", title: "Geheimhaltungsdauer kurz", description: "5 Jahre Geheimhaltungsdauer — branchenueblich aber bei sensiblen IP-Themen optional 7 Jahre.", isSignatureBlocker: false, recommendedAction: "Verlaengerung auf 7 Jahre erwaegen, optional fuer Trade Secrets unbegrenzt" },
      { id: "n2", dimension: "legal", severity: "niedrig", title: "Non-Solicitation fehlt", description: "Mitarbeiter-Abwerbeverbot waere bei M&A-Verhandlungen sinnvoll.", isSignatureBlocker: false, recommendedAction: "12-Monats Non-Solicitation Klausel ergaenzen" }
    ],
    detectedClauses: ["injunctive-relief", "no-obligation-to-proceed", "return-of-information", "residuals-clause"]
  }
]

export default function EnterpriseAnalysisPage() {
  const [selectedId, setSelectedId] = useState(DEMO_CONTRACTS[0].id)
  const contract = DEMO_CONTRACTS.find(c => c.id === selectedId)!
  const profile = getContractProfile(contract.type)
  const visibleSections = getVisibleSections(contract.type)
  const riskScore = calculateRiskScore(contract.findings)
  const detectedClauseRefs = contract.detectedClauses.map(id => ({ clauseId: id }))
  const gaps = detectClauseGaps(contract.type, detectedClauseRefs)
  const matchScore = contract.matchScore ? calculateMatchScore(contract.matchScore.structural, contract.matchScore.substantive) : null

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#003856] text-[11px] font-bold text-white">v3</span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">Enterprise Analysis · Preview</p>
        </div>
        <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertragsanalyse — Enterprise Tiefe</h1>
        <p className="mt-2 text-[14px] text-gray-500">Type-Aware Felder · Multi-Dimensionales Risiko · Ersatzklauseln zum Copy-Paste · Signature-Blocker</p>
      </div>

      <div className="mt-6 flex gap-2">
        {DEMO_CONTRACTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`rounded-full border px-4 py-2 text-[12px] font-medium transition-colors ${
              selectedId === c.id ? "border-[#003856] bg-[#003856] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
          <div>
            <span className="text-gray-400">Vertragstyp: </span>
            <span className="font-medium text-gray-900">{profile.name}</span>
          </div>
          <div>
            <span className="text-gray-400">Jurisdiktion: </span>
            <span className="font-medium text-gray-900">{profile.jurisdiction === "DE" ? "Deutschland" : profile.jurisdiction === "EU" ? "EU" : "International (EN)"}</span>
          </div>
          <div>
            <span className="text-gray-400">{profile.wording.partyALabel} · {profile.wording.partyBLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Modul 2 · Signature Decision</h2>
          <p className="mt-1 mb-3 text-[12px] text-gray-500">Die wichtigste Information fuer Entscheider — kann unterschrieben werden?</p>
          <SignatureStatusCard status={riskScore.signatureStatus} signatureBlockers={riskScore.signatureBlockers} />
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Modul 2 · Multi-Dimensionales Risiko</h2>
          <p className="mt-1 mb-3 text-[12px] text-gray-500">Statt einer pauschalen Zahl — Risiko in 4 Dimensionen aufgeschluesselt</p>
          <RiskDimensionsDisplay score={riskScore} />
        </section>

        {matchScore && (
          <section>
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Modul 2 · Vergleichsanalyse (Strukturell vs. Substanziell)</h2>
            <p className="mt-1 mb-3 text-[12px] text-gray-500">Differenziert formale Aehnlichkeit von inhaltlicher Kompatibilitaet</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-[11px] uppercase tracking-wider text-gray-400">Structural Overlap</p>
                <p className="mt-1 text-[24px] font-semibold text-gray-900">{matchScore.structural}%</p>
                <p className="text-[11px] text-gray-500">Formale Aehnlichkeit</p>
              </div>
              <div className="rounded-xl border-2 border-[#003856] bg-white p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#003856]">Substantive Compatibility</p>
                <p className="mt-1 text-[24px] font-semibold text-[#003856]">{matchScore.substantive}%</p>
                <p className="text-[11px] text-gray-500">Inhaltliche Kompatibilitaet</p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                <p className="text-[11px] uppercase tracking-wider text-gold-700">Gewichtet</p>
                <p className="mt-1 text-[24px] font-semibold text-gold-900">{matchScore.weighted}%</p>
                <p className="text-[11px] text-gold-700">{matchScore.interpretation}</p>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Modul 3 · Fehlende Klauseln + Ersatzformulierungen</h2>
          <p className="mt-1 mb-3 text-[12px] text-gray-500">Markt-Standard-Pruefung mit Copy-Paste-Templates</p>
          <ClauseGapDisplay gaps={gaps} />
        </section>

        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Modul 1 · Type-Aware Sektionen</h2>
          <p className="mt-1 mb-3 text-[12px] text-gray-500">Bei einem {profile.shortName} werden nur die relevanten Sektionen angezeigt — keine leeren Felder fuer irrelevante Bereiche</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleSections.map((s) => (
              <div key={s.id} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-gray-900">{s.id.replace(/-/g, " ")}</p>
                  {s.required && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Pflicht</span>}
                </div>
                {s.emptyStateMessage && (
                  <p className="mt-1 text-[11px] text-gray-500">{s.emptyStateMessage}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            {profile.sections.filter(s => !s.visible).length} Sektionen ausgeblendet (nicht relevant fuer {profile.shortName})
          </p>
        </section>
      </div>

      <div className="mt-10 rounded-2xl border border-gold-200 bg-gold-50 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-700">Roadmap</p>
        <h3 className="mt-1 text-[16px] font-semibold text-gold-900">Diese Module sind v3.0 — sehen Sie die volle Roadmap</h3>
        <p className="mt-2 text-[13px] text-gold-800">Von v1.0 (heute) bis v3.0 (Q1 2027) — wo wir hingehen und warum.</p>
        <Link href="/roadmap" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">
          📍 Roadmap ansehen
        </Link>
      </div>
    </div>
  )
}
