import Link from "next/link"
import type { Metadata } from "next"

const kernmodule = [
  { emoji: "📂", title: "Dokumenten-Workspace", desc: "Zentrale Arbeitsoberfläche für Verträge und Dokumente mit klarer Struktur für Intake, Bearbeitung und Ablage.", meta: "Organisation" },
  { emoji: "🧠", title: "KI-Vertragsanalyse", desc: "Multi-Provider KI-Pipeline (Claude Sonnet 4, GPT-4o, Gemini) analysiert Verträge, extrahiert Daten und bewertet Risiken nach deutschem Recht.", meta: "8 Vertragstypen" },
  { emoji: "🤖", title: "Contract Copilot", desc: "KI-Chat mit Echtzeit-Streaming und Vertragskontext. Stellen Sie Fragen zu jedem analysierten Vertrag — mit BGB-Referenzen.", meta: "Claude Sonnet 4" },
  { emoji: "🛡️", title: "Review & Freigabe", desc: "Strukturierte Prüfprozesse mit RBAC-Rollenmodell, Human-in-the-Loop und nachvollziehbarer Entscheidungshistorie.", meta: "Governance" },
  { emoji: "📋", title: "Audit & Nachweise", desc: "Manipulationssichere Protokollierung mit Hash-Verkettung für ISO 27001, DSGVO-Audits und interne Governance.", meta: "Compliance" },
  { emoji: "🔗", title: "Export & Integration", desc: "PDF-Reports, DATEV-Export, CSV und JSON. REST API + Webhooks für nahtlose Workflow-Integration.", meta: "Schnittstellen" },
]

const techStack = [
  { label: "Frontend", value: "Next.js 14 + TypeScript", emoji: "⚛️" },
  { label: "Auth", value: "NextAuth v5, Entra SSO, SCIM v2", emoji: "🔐" },
  { label: "KI", value: "Claude + GPT-4o + Gemini", emoji: "🤖" },
  { label: "Datenbank", value: "PostgreSQL + Row-Level Security", emoji: "🗄️" },
  { label: "Hosting", value: "Vercel (EU) + ISO 27001 ready", emoji: "☁️" },
  { label: "Compliance", value: "DSGVO, AVV, Audit Trail", emoji: "📋" },
]


export const metadata: Metadata = { title: "Produkt — Kernmodule", description: "KI-Vertragsanalyse mit Enterprise-Governance. Sechs Kernmodule für juristische Teams." }
export default function ProduktPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🚀</span>
              <span className="text-[12px] font-medium text-gold-700">Produkt</span>
            </div>
            <h1 className="text-display text-gray-950">KI-Vertragsanalyse mit Enterprise-Governance</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">KanzleiAI bündelt Dokumentenarbeit, KI-gestützte Vertragsprüfung und auditfähige Nachweise in einer konsistenten Plattform für juristische Teams.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏗️ Kernmodule</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Sechs Bausteine, eine Plattform</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kernmodule.map((m) => (
              <div key={m.title} className="rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-card">
                <span className="text-[28px]">{m.emoji}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{m.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{m.desc}</p>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-600">{m.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚙️ Technologie</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Enterprise-grade Tech Stack</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4">
                <span className="text-[18px]">{item.emoji}</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.label}</p>
                  <p className="mt-0.5 text-[14px] font-medium text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">🚀</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Produkt im Detail kennenlernen</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">Für Enterprise-Anforderungen unterstützen wir eine strukturierte Erstklärung mit Fokus auf Scope, Rollenmodell und Compliance-Kontext.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Demo anfragen</Link>
            <Link href="/trust-center" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Trust Center</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
