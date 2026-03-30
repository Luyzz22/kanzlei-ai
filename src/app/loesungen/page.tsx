import Link from "next/link"

export default function LoesungenPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🎯</span>
              <span className="text-[12px] font-medium text-gold-700">Lösungen</span>
            </div>
            <h1 className="text-display text-gray-950">Für jede juristische Anforderung</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">KanzleiAI passt sich Ihrem Arbeitskontext an — ob Einzelkanzlei oder Konzern-Rechtsabteilung.</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
            <Link href="/loesungen/kanzleien" className="group rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-gold-300 hover:shadow-card">
              <span className="text-[36px]">⚖️</span>
              <h2 className="mt-4 text-[20px] font-semibold text-gray-900 group-hover:text-[#003856]">Für Kanzleien</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-500">Mandantenverträge in Sekunden prüfen. Risiko-Scores, Klauselanalyse und KI-Copilot für Anwälte.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-gold-700">Mehr erfahren →</span>
            </Link>
            <Link href="/loesungen/rechtsabteilungen" className="group rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-gold-300 hover:shadow-card">
              <span className="text-[36px]">🏢</span>
              <h2 className="mt-4 text-[20px] font-semibold text-gray-900 group-hover:text-[#003856]">Für Rechtsabteilungen</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-500">Enterprise-Lösung mit Multi-Tenant, SSO, RBAC und Portfolio-Analyse für Ihr gesamtes Vertragsportfolio.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-gold-700">Mehr erfahren →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
