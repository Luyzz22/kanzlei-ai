"use client"

import { useState } from "react"
import Link from "next/link"
import { CONTRACT_SCHEMAS, getApplicableFields, getNotApplicableFields } from "@/lib/contract-intelligence/schemas"
import { computeRiskAssessment, computeMatchAssessment } from "@/lib/contract-intelligence/risk-engine"
import type { RiskFinding } from "@/lib/contract-intelligence/risk-engine"
import { findFallbackClauses } from "@/lib/contract-intelligence/fallback-clauses"
import { SignatureStatusBanner } from "@/components/contract-intelligence/signature-status-banner"
import { RiskDashboard } from "@/components/contract-intelligence/risk-dashboard"
import { TypeAwareFieldsList } from "@/components/contract-intelligence/type-aware-fields"
import { MissingClausesPanel } from "@/components/contract-intelligence/missing-clauses-panel"

const SAMPLE_VALUES: Record<string, Record<string, string | null>> = {
  nda: {
    agreement_term: "5 years from Effective Date",
    confidentiality_period: "5 years post-termination",
    permitted_purpose: null,
    return_destruction: "Upon written request",
    governing_law: "Laws of Germany",
  },
  saas: {
    subscription_term: "24 months",
    auto_renewal: "12 months, 90 days notice",
    notice_period: "90 days",
    uptime_sla: null,
    data_processing_avv: null,
    data_location: "EU/EEA only",
    subprocessors: "AWS Frankfurt, Cloudflare",
    liability_cap: "12 months fees",
    indemnification: "IP claims only",
    ip_rights: "Customer retains data, Provider retains software",
    payment_terms: "Net 30",
  },
  avv: {
    processing_purpose: "Software-as-a-Service contract analysis",
    data_categories: "Contact data, contract metadata",
    data_subjects: "Employees, contractors",
    tom_measures: null,
    subprocessors: "AWS, Anthropic, Google Cloud",
    data_breach_notification: null,
    audit_rights: "Annual self-assessment + customer audit on 30 days notice",
    data_deletion: "30 days post-termination, full deletion within 90 days",
  }
}

const SAMPLE_FINDINGS: Record<string, RiskFinding[]> = {
  nda: [
    { id: "nda-1", category: "legal", severity: "high", blockingSignature: false, title: "Permitted Purpose nicht definiert", description: "Der spezifische Zweck der Informationsweitergabe ist nicht festgelegt", recommendation: "Konkreten Zweck einfuegen", legalReference: "Standard NDA practice" },
    { id: "nda-2", category: "legal", severity: "medium", blockingSignature: false, title: "Injunctive Relief fehlt", description: "Keine Regelung zu einstweiligem Rechtsschutz", recommendation: "Standard-Klausel ergaenzen" },
    { id: "nda-3", category: "operational", severity: "low", blockingSignature: false, title: "Residuals Clause fehlt", description: "Keine Regelung zu unbeabsichtigt erinnerten Informationen", recommendation: "Bei Tech-Engagements ergaenzen" },
  ],
  saas: [
    { id: "saas-1", category: "compliance", severity: "critical", blockingSignature: true, title: "AVV (DSGVO Art. 28) fehlt", description: "Kein Auftragsverarbeitungsvertrag — DSGVO-Verstoss", recommendation: "AVV als Anlage ergaenzen vor Unterzeichnung", legalReference: "DSGVO Art. 28 Abs. 3" },
    { id: "saas-2", category: "operational", severity: "critical", blockingSignature: true, title: "SLA fehlt komplett", description: "Keine Verfuegbarkeitszusage, keine Service-Credits", recommendation: "Mindest-SLA 99,5% mit Credits aufnehmen" },
    { id: "saas-3", category: "legal", severity: "high", blockingSignature: false, title: "Indemnification nur fuer IP", description: "Freistellung deckt nur IP-Ansprueche, nicht Datenpannen", recommendation: "Indemnification auf DSGVO-Verstoesse erweitern" },
    { id: "saas-4", category: "financial", severity: "medium", blockingSignature: false, title: "Liability Cap entspricht Marktstandard", description: "12 Monate Fees ist branchenueblich", recommendation: "Optional: bei kritischer Software auf 24 Monate erhoehen" },
  ],
  avv: [
    { id: "avv-1", category: "compliance", severity: "critical", blockingSignature: true, title: "TOM nicht spezifiziert", description: "Technische und organisatorische Massnahmen fehlen", recommendation: "TOM-Anlage mit Verschluesselung, Zugriffskontrolle, Backup-Konzept", legalReference: "DSGVO Art. 32" },
    { id: "avv-2", category: "compliance", severity: "critical", blockingSignature: true, title: "Breach Notification fehlt", description: "Keine Frist fuer Meldung von Datenpannen", recommendation: "24-72h Meldepflicht ergaenzen", legalReference: "DSGVO Art. 33" },
    { id: "avv-3", category: "legal", severity: "high", blockingSignature: false, title: "Drittland-Subprozessoren ohne SCCs", description: "AWS und Anthropic sind US-Anbieter ohne explizite SCC-Referenz", recommendation: "SCC 2021/914 referenzieren" },
  ]
}

export default function IntelligenceDemoPage() {
  const [contractType, setContractType] = useState<keyof typeof CONTRACT_SCHEMAS>("saas")
  const [activeTab, setActiveTab] = useState<"overview" | "fields" | "clauses" | "match">("overview")

  const schema = CONTRACT_SCHEMAS[contractType]
  const findings = SAMPLE_FINDINGS[contractType] ?? []
  const values = SAMPLE_VALUES[contractType] ?? {}
  const assessment = computeRiskAssessment(findings)
  const applicableFields = getApplicableFields(contractType)
  const notApplicable = getNotApplicableFields(contractType)
  const fallbacks = findFallbackClauses(contractType)

  const presentClauses = Object.entries(values)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k]) => {
      const field = schema.fields.find(f => f.key === k)
      return field?.label ?? k
    })

  const matchAssessment = computeMatchAssessment(20, 14, 12, 18, 2)

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🧠 Contract Intelligence v3</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Multi-Dimensional Analysis</h1>
          <p className="mt-1 text-[14px] text-gray-500">Type-aware Felder · 4-dimensionale Risiko-Engine · Fallback-Klauseln · Signature-Blocking</p>
        </div>
        <Link href="/produkt/roadmap" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">📍 Produkt-Roadmap →</Link>
      </div>

      {/* Type Selector */}
      <div className="mt-6 flex gap-2">
        {(Object.keys(CONTRACT_SCHEMAS) as Array<keyof typeof CONTRACT_SCHEMAS>).map((t) => (
          <button key={t} onClick={() => setContractType(t)} className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${contractType === t ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {CONTRACT_SCHEMAS[t].shortName}
          </button>
        ))}
      </div>

      {/* Signature Status Banner */}
      <div className="mt-6">
        <SignatureStatusBanner assessment={assessment} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-gray-200">
        {[
          { key: "overview" as const, label: "Risiko-Dashboard", emoji: "📊" },
          { key: "fields" as const, label: "Type-aware Felder", emoji: "📋" },
          { key: "clauses" as const, label: "Fehlende Klauseln + Fallbacks", emoji: "📝" },
          { key: "match" as const, label: "Match-Qualitaet", emoji: "⚖️" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.key ? "border-[#003856] text-[#003856]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>{tab.emoji} {tab.label}</button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div>
            <RiskDashboard assessment={assessment} />

            {/* Findings detail */}
            <div className="mt-8">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Identifizierte Risiken nach Kategorie</h3>
              <div className="mt-3 space-y-2">
                {findings.map((f) => {
                  const sevColor = f.severity === "critical" ? "bg-red-100 text-red-700" : f.severity === "high" ? "bg-amber-100 text-amber-700" : f.severity === "medium" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  return (
                    <div key={f.id} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${sevColor}`}>{f.severity}</span>
                          {f.blockingSignature && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold uppercase text-white">BLOCK</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-gray-900">{f.title}</p>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">{f.category}</span>
                          </div>
                          <p className="mt-1 text-[12px] text-gray-600">{f.description}</p>
                          <div className="mt-2 rounded-lg bg-gold-50 px-3 py-1.5">
                            <p className="text-[11px] text-gold-800"><span className="font-semibold">Empfehlung:</span> {f.recommendation}</p>
                          </div>
                          {f.legalReference && <p className="mt-1 text-[10px] text-gray-400">⚖ {f.legalReference}</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "fields" && (
          <div>
            <TypeAwareFieldsList fields={applicableFields} values={values} />

            {notApplicable.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Ausgeblendet (nicht relevant fuer {schema.shortName})</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {notApplicable.map((f) => (
                    <span key={f.key} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-500">
                      {f.shortLabel} · <span className="text-gray-400">N/A</span>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-gray-400">Diese Felder werden im Vertragstyp {schema.shortName} nicht erwartet und nicht angezeigt.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "clauses" && (
          <MissingClausesPanel
            presentClauses={presentClauses}
            requiredClauses={schema.requiredClauses}
            recommendedClauses={schema.recommendedClauses}
            fallbacks={fallbacks}
          />
        )}

        {activeTab === "match" && (
          <div>
            <p className="text-[13px] text-gray-500">Beispiel: AGB-Vergleich Lieferanten-Standardvertrag vs. unsere AEB</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-[12px] font-medium text-gray-500">Structural Overlap</p>
                <p className="mt-1 text-[28px] font-semibold text-blue-700">{matchAssessment.structuralOverlap}<span className="text-[14px] text-gray-400">%</span></p>
                <p className="mt-1 text-[11px] text-gray-400">Formale Aehnlichkeit (gleiche Sektionen, Struktur)</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${matchAssessment.structuralOverlap}%` }} />
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-[12px] font-medium text-gray-500">Substantive Compatibility</p>
                <p className="mt-1 text-[28px] font-semibold text-emerald-700">{matchAssessment.substantiveCompatibility}<span className="text-[14px] text-gray-400">%</span></p>
                <p className="mt-1 text-[11px] text-gray-400">Inhaltliche Kompatibilitaet (Provisions stimmen ueberein)</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${matchAssessment.substantiveCompatibility}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-[14px] font-semibold text-gray-900">Overall Match (gewichtet)</p>
                <p className="text-[36px] font-semibold text-[#003856]">{matchAssessment.overallMatch}<span className="text-[14px] text-gray-400">%</span></p>
              </div>
              <p className="mt-2 text-[12px] text-gray-500">Substantive zaehlt 60%, Structural 40%</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
                <p className="text-[24px] font-semibold text-amber-600">{matchAssessment.divergences}</p>
                <p className="text-[11px] text-gray-400">Abweichungen</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-[24px] font-semibold text-red-700">{matchAssessment.blockingDivergences}</p>
                <p className="text-[11px] text-red-600">Blockierende Abweichungen</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-[13px] text-blue-900">{matchAssessment.interpretation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[13px] font-semibold text-gray-900">Was ist neu in Contract Intelligence v3?</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { title: "Modul 1: Type-aware Felder", desc: "Vertragstyp-spezifische Schemas. AVV erscheint nur bei SaaS, nicht bei NDA. Null-Werte werden klar ausgewiesen." },
            { title: "Modul 2: Multi-Dimensional Risk", desc: "Legal Blocking Risk separat von Economic/Operational. 4 Risikokategorien. Signature-Blocking-Flag." },
            { title: "Modul 3: Fallback-Klauseln", desc: "Pro Vertragstyp Standard-Ersatzklauseln zum Copy-Pasten — Enterprise-tier konform." },
            { title: "Modul 4: Roadmap V1.0 → V3.0", desc: "Phasen-Plan fuer skalierbaren Ausbau. Siehe Produkt-Roadmap." },
          ].map((m) => (
            <div key={m.title} className="rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-[12px] font-semibold text-gray-900">{m.title}</p>
              <p className="mt-1 text-[11px] text-gray-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
