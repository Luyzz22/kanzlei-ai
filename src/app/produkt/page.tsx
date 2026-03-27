import { CtaPanel } from "@/components/marketing/cta-panel"
import { PageHero } from "@/components/marketing/page-hero"

const kernmodule = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    title: "Dokumenten-Workspace",
    description: "Zentrale Arbeitsoberfläche für Verträge und Dokumente mit klarer Struktur für Intake, Bearbeitung und Ablage.",
    meta: "Organisation"
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "KI-Vertragsanalyse",
    description: "Multi-Provider KI-Pipeline (OpenAI, Claude, Gemini) analysiert Verträge, extrahiert Daten und bewertet Risiken nach deutschem Recht.",
    meta: "8 Vertragstypen"
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Review & Freigabe",
    description: "Strukturierte Prüfprozesse mit RBAC-Rollenmodell, Human-in-the-Loop und nachvollziehbarer Entscheidungshistorie.",
    meta: "Governance"
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Audit & Nachweise",
    description: "Manipulationssichere Protokollierung mit Hash-Verkettung für ISO 27001, DSGVO-Audits und interne Governance.",
    meta: "Compliance"
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Administration & Rollen",
    description: "Mandantenfähige Zugriffssteuerung mit SCIM v2, Microsoft Entra SSO und klarer Zuordnung von Zuständigkeiten.",
    meta: "Enterprise"
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Export & Integration",
    description: "PDF-Reports, DATEV-Export, CSV und JSON. Vertragsanalysen nahtlos in bestehende Workflows integrieren.",
    meta: "Schnittstellen"
  },
]

const techStack = [
  { label: "Frontend", value: "Next.js 14 + TypeScript" },
  { label: "Auth", value: "NextAuth v5, SCIM v2, Entra SSO" },
  { label: "KI", value: "OpenAI + Claude + Gemini" },
  { label: "Datenbank", value: "PostgreSQL + Row-Level Security" },
  { label: "Hosting", value: "Vercel (EU) + ISO 27001 ready" },
  { label: "Compliance", value: "DSGVO, AV-Vertrag, Audit Trail" },
]

export default function ProduktPage() {
  return (
    <main>
      <PageHero
        eyebrow="Produkt"
        title="KI-Vertragsanalyse mit Enterprise-Governance"
        description="KanzleiAI bündelt Dokumentenarbeit, KI-gestützte Vertragsprüfung und auditfähige Nachweise in einer konsistenten Plattform für juristische Teams."
      />

      {/* Kernmodule */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">Kernmodule</p>
          <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Sechs Bausteine, eine Plattform</h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {kernmodule.map((modul) => (
              <div key={modul.title} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#003856]/[0.06] text-[#003856]">
                  {modul.icon}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-gray-900">{modul.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{modul.description}</p>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">{modul.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-y border-gray-100 bg-gray-50/30 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">Technologie</p>
          <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">Enterprise-grade Tech Stack</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-white px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.label}</p>
                <p className="mt-1 text-[14px] font-medium text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <CtaPanel
            title="Produkt im Detail kennenlernen"
            description="Für Enterprise-Anforderungen unterstützen wir eine strukturierte Erstklärung mit Fokus auf Scope, Rollenmodell, Governance und Compliance-Kontext."
            primaryLabel="Demo anfragen"
            primaryHref="/enterprise-kontakt"
            secondaryLabel="Trust Center"
            secondaryHref="/trust-center"
          />
        </div>
      </section>
    </main>
  )
}
