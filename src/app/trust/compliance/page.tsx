import Link from "next/link"
import type { Metadata } from "next"

import { PrintButton } from "./print-button"

export const metadata: Metadata = {
  title: "Compliance at a Glance | KanzleiAI",
  description:
    "Kompakte Management-Zusammenfassung der regulatorischen Einordnung von KanzleiAI — DSGVO, NIS2, EU AI Act, GoBD, ISO 27001. Bereit für Beschaffungsprozesse und Enterprise-Due-Diligence.",
}

export const revalidate = 3600

type ComplianceRow = {
  regulation: string
  reference: string
  requirement: string
  kanzleiai: string
  evidence: string
  status: "compliant" | "ready" | "roadmap"
}

const matrix: ComplianceRow[] = [
  {
    regulation: "DSGVO",
    reference: "Art. 32",
    requirement: "Sicherheit der Verarbeitung",
    kanzleiai: "TLS 1.3 in-transit, AES-256 at-rest. Tenant-isolierte Storage-Pfade. Row-Level Security auf 12 Tabellen.",
    evidence: "Vercel Blob Store · Neon Postgres RLS · Security Headers",
    status: "compliant",
  },
  {
    regulation: "DSGVO",
    reference: "Art. 17",
    requirement: "Recht auf Löschung",
    kanzleiai: "Irreversibles Delete auf Storage. Soft-Delete der Metadaten mit Audit-Trail. Täglicher Retention-Cron.",
    evidence: "/api/cron/data-retention · Audit-Event document.retention_expired",
    status: "compliant",
  },
  {
    regulation: "DSGVO",
    reference: "Art. 30",
    requirement: "Verarbeitungsverzeichnis",
    kanzleiai: "Strukturierter JSON-Audit-Channel kanzlei.storage.audit mit Tenant-ID, Document-ID, SHA-256, Timestamp.",
    evidence: "Vercel Logs · Audit-Tabelle AuditEvent",
    status: "compliant",
  },
  {
    regulation: "DSGVO",
    reference: "Art. 5 (1) e",
    requirement: "Speicherbegrenzung",
    kanzleiai: "Tenant-konfigurierbare Retention-Policy (Default 365 Tage). Automatische Durchsetzung via Daily-Cron.",
    evidence: "/dashboard/admin/privacy-retention · documentRetentionDays-Feld",
    status: "compliant",
  },
  {
    regulation: "DSGVO",
    reference: "Art. 28",
    requirement: "Auftragsverarbeitung",
    kanzleiai: "AVV nach Art. 28 DSGVO verfügbar. Unterauftragnehmer-Liste dokumentiert (Anthropic, OpenAI, Google, Vercel).",
    evidence: "/auftragsverarbeitung",
    status: "ready",
  },
  {
    regulation: "NIS2",
    reference: "Art. 21",
    requirement: "Risikomanagement-Maßnahmen",
    kanzleiai: "Incident-ready Error-Logs mit Duration-Tracking. SIEM/SOC-ingest-ready Structured JSON. Sentry-Integration.",
    evidence: "kanzlei.storage.audit Channel · Sentry",
    status: "compliant",
  },
  {
    regulation: "EU AI Act",
    reference: "Art. 10",
    requirement: "Daten-Governance für Hochrisiko-KI",
    kanzleiai: "SHA-256-Hash pro Dokument für Trainings-Daten-Lineage. Kein Training mit Kundendaten. Multi-Provider dokumentiert.",
    evidence: "Document.sha256 · /ki-transparenz",
    status: "compliant",
  },
  {
    regulation: "EU AI Act",
    reference: "Art. 12",
    requirement: "Aufzeichnungspflicht",
    kanzleiai: "Zeitgestempelte Trails für jede Storage- und KI-Interaktion. Verknüpfung Document ↔ AnalysisLog ↔ AuditEvent.",
    evidence: "AnalysisLog-Tabelle · AuditEvent.metadata",
    status: "compliant",
  },
  {
    regulation: "EU AI Act",
    reference: "Art. 13",
    requirement: "Transparenz für Nutzer",
    kanzleiai: "KI-Transparenz-Seite mit Modell-Liste, Limitationen, Disclaimers. Findings-Attribution je nach Modell.",
    evidence: "/ki-transparenz · AnalysisLog.modelUsed",
    status: "compliant",
  },
  {
    regulation: "GoBD",
    reference: "Unveränderlichkeit",
    requirement: "Unveränderliche Dokumentation",
    kanzleiai: "allowOverwrite:false im Blob-Store. SHA-256 Hash-Kette im Audit-Modul. Metadaten bleiben 10 Jahre erhalten.",
    evidence: "audit-hash.ts Hash-Chain · Blob-Store-Policy",
    status: "compliant",
  },
  {
    regulation: "EU-Datenresidenz",
    reference: "Frankfurt",
    requirement: "Daten und Verarbeitung in der EU",
    kanzleiai: "Blob-Store in fra1 (Frankfurt). Functions in fra1. Neon Postgres in eu-central-1. Keine Cross-Border-Transfers.",
    evidence: "vercel.json regions:[fra1] · Blob-Store-Konfiguration",
    status: "compliant",
  },
  {
    regulation: "ISO 27001",
    reference: "Annex A",
    requirement: "Informationssicherheits-Managementsystem",
    kanzleiai: "Kontrollen dokumentiert: Zugriffskontrolle, Kryptographie, Betriebssicherheit, Kommunikationssicherheit, Lieferantenbeziehungen.",
    evidence: "/sicherheit-compliance — Zertifizierung in Vorbereitung",
    status: "roadmap",
  },
  {
    regulation: "BSI C5",
    reference: "Cloud Compliance",
    requirement: "BSI Cloud Computing Compliance Criteria Catalogue",
    kanzleiai: "Vercel (Infrastruktur) erfüllt SOC 2 Type II. KanzleiAI-Kontrollen werden auf C5-Schema gemapped.",
    evidence: "Roadmap 2026",
    status: "roadmap",
  },
]

const keyFacts = [
  { label: "Datenresidenz", value: "Frankfurt, Deutschland (fra1)", icon: "🇩🇪" },
  { label: "Verschlüsselung", value: "TLS 1.3 · AES-256", icon: "🔐" },
  { label: "Mandantentrennung", value: "Row-Level Security + Path-Isolation", icon: "🏗️" },
  { label: "Audit-Trail", value: "Unveränderlich, SHA-256-gehashed", icon: "📋" },
  { label: "Löschkonzept", value: "Automatisch, Policy-basiert", icon: "🗑️" },
  { label: "KI-Training", value: "Kein Training mit Kundendaten", icon: "🧠" },
  { label: "AVV Art. 28", value: "Sofort verfügbar", icon: "📜" },
  { label: "Incident Response", value: "Sentry · Structured Logs · SIEM-ready", icon: "🚨" },
]

const statusBadges: Record<ComplianceRow["status"], { bg: string; text: string; border: string; label: string }> = {
  compliant: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "✓ Konform",
  },
  ready: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "✓ Verfügbar",
  },
  roadmap: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "◷ Roadmap",
  },
}

export default function ComplianceOnePagerPage() {
  return (
    <main className="bg-[#fafaf8]">
      {/* Hero — Apple-style minimal, warm stone */}
      <section className="border-b border-[#e8e3db] bg-gradient-to-b from-white to-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col items-start gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-full border border-[#003856]/10 bg-[#003856]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">
                🛡️ Compliance at a Glance
              </span>
              <span className="text-[11px] font-medium text-gray-400">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</span>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-gray-950 sm:text-[3.25rem]">
                Regulatorische Einordnung
                <span className="block text-[#C8985A]">für Enterprise-Beschaffung.</span>
              </h1>
              <p className="mt-5 text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
                Diese Seite fasst die regulatorische Konformität von KanzleiAI in einer
                Management-tauglichen Übersicht zusammen — konzipiert für Compliance-Officers,
                IT-Security-Verantwortliche und Einkaufsabteilungen, die eine schnelle
                Vor-Prüfung brauchen, bevor Detailfragen geklärt werden.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <PrintButton />
              <Link
                href="/trust-center"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 print:hidden"
              >
                Trust Center →
              </Link>
              <Link
                href="/auftragsverarbeitung"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 print:hidden"
              >
                AVV anfordern
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Facts — SAP-style fact sheet */}
      <section className="border-b border-[#e8e3db] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#C8985A]">
            Auf einen Blick
          </h2>
          <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950 sm:text-[26px]">
            Acht Kennzahlen, die Beschaffung typischerweise zuerst prüft.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {keyFacts.map((fact, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-[#fafaf8] p-5 transition-all hover:border-[#C8985A]/30 hover:shadow-sm"
              >
                <div className="text-[24px]">{fact.icon}</div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                  {fact.label}
                </p>
                <p className="mt-1 text-[14px] font-semibold leading-snug text-gray-900">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Matrix — the heart of the page */}
      <section className="border-b border-[#e8e3db] bg-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#C8985A]">
            Compliance-Matrix
          </h2>
          <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950 sm:text-[26px]">
            Regulierung · Anforderung · Umsetzung · Nachweis.
          </p>
          <p className="mt-2 max-w-3xl text-[14px] text-gray-600">
            Jede Zeile benennt die konkrete regulatorische Pflicht, wie KanzleiAI sie adressiert,
            und wo der technische Nachweis im Produkt sichtbar ist. Keine Marketing-Aussagen,
            nur prüfbare Fakten.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* Table head — hidden on mobile, stacked view instead */}
            <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:grid">
              <div className="col-span-2">Regulierung</div>
              <div className="col-span-3">Anforderung</div>
              <div className="col-span-4">Umsetzung in KanzleiAI</div>
              <div className="col-span-2">Technischer Nachweis</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {matrix.map((row, i) => {
              const badge = statusBadges[row.status]
              return (
                <div
                  key={i}
                  className={`border-b border-gray-100 last:border-b-0 hover:bg-[#fafaf8] ${i % 2 === 1 ? "bg-[#fdfcfa]" : ""}`}
                >
                  {/* Desktop row */}
                  <div className="hidden grid-cols-12 gap-4 px-5 py-4 lg:grid">
                    <div className="col-span-2">
                      <p className="text-[13px] font-semibold text-gray-900">{row.regulation}</p>
                      <p className="text-[11px] font-mono text-gray-500">{row.reference}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-[13px] font-medium text-gray-800">{row.requirement}</p>
                    </div>
                    <div className="col-span-4">
                      <p className="text-[12px] leading-relaxed text-gray-600">{row.kanzleiai}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-mono leading-relaxed text-gray-500">{row.evidence}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Mobile stacked card */}
                  <div className="p-5 lg:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {row.regulation} <span className="font-mono text-[11px] text-gray-500">· {row.reference}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] font-medium text-gray-800">{row.requirement}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed text-gray-600">{row.kanzleiai}</p>
                    <p className="mt-2 text-[11px] font-mono text-gray-500">{row.evidence}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] text-gray-400">
            Letzter Update-Stand: {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}.
            Änderungen werden im Audit-Log dokumentiert und im Release-Notes-Feed veröffentlicht.
          </p>
        </div>
      </section>

      {/* Governance — who's responsible */}
      <section className="border-b border-[#e8e3db] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#C8985A]">
            Governance & Kontakt
          </h2>
          <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950 sm:text-[26px]">
            Wer verantwortet die Compliance?
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-[#fafaf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                Datenschutzverantwortlich
              </p>
              <p className="mt-2 text-[14px] font-semibold text-gray-900">SBS Deutschland GmbH &amp; Co. KG</p>
              <p className="mt-1 text-[12px] text-gray-600">Digitalisierung &amp; KI</p>
              <a href="mailto:datenschutz@sbsdeutschland.de" className="mt-3 inline-block text-[12px] font-medium text-[#003856] hover:underline">
                datenschutz@sbsdeutschland.de
              </a>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#fafaf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                Security &amp; Incident Response
              </p>
              <p className="mt-2 text-[14px] font-semibold text-gray-900">Security Operations</p>
              <p className="mt-1 text-[12px] text-gray-600">24/7 Sentry-Monitoring</p>
              <a href="mailto:security@sbsdeutschland.de" className="mt-3 inline-block text-[12px] font-medium text-[#003856] hover:underline">
                security@sbsdeutschland.de
              </a>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#fafaf8] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                Enterprise-Beschaffung
              </p>
              <p className="mt-2 text-[14px] font-semibold text-gray-900">Produkt &amp; Kundenerfolg</p>
              <p className="mt-1 text-[12px] text-gray-600">AVV · Due Diligence · SLA</p>
              <a href="mailto:ki@sbsdeutschland.de" className="mt-3 inline-block text-[12px] font-medium text-[#003856] hover:underline">
                ki@sbsdeutschland.de
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-[#fafaf8]">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <p className="text-[11px] leading-relaxed text-gray-400">
            ⚖️ Diese Übersicht dient der kaufmännischen Vorprüfung und ersetzt keine rechtliche
            Beratung. Verbindliche Aussagen bedürfen der Einzelprüfung im Rahmen eines
            Datenschutzfolgenabschätzungs- oder Beschaffungsprozesses. Für ein vollständiges
            Compliance-Paket inkl. AVV, technisch-organisatorischer Maßnahmen (TOM) und
            Unterauftragnehmer-Register kontaktieren Sie{" "}
            <a href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856] hover:underline">
              ki@sbsdeutschland.de
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
