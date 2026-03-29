import Link from "next/link"

export default function SicherheitPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🛡️ Sicherheit</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Sicherheit & Compliance</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Detaillierte Informationen zu unserer Sicherheitsarchitektur und Compliance-Maßnahmen.</p>
          <div className="mt-10 space-y-6">
            {[
              { emoji: "🔐", title: "Verschlüsselung", desc: "TLS 1.3 für alle Datenübertragungen. Verschlüsselung at-rest mit AES-256 auf Datenbankebene." },
              { emoji: "🏗️", title: "Mandantentrennung", desc: "Row-Level Security (RLS) auf PostgreSQL-Ebene. Jeder Tenant hat isolierte Datenbereiche — kein mandantenübergreifender Zugriff möglich." },
              { emoji: "👤", title: "Zugriffskontrolle", desc: "Role-Based Access Control (RBAC) mit den Rollen Admin, Jurist und Assistent. Jede Aktion wird im Audit Trail dokumentiert." },
              { emoji: "📋", title: "Audit Trail", desc: "Manipulationssicheres Audit-Protokoll mit Hash-Verkettung. Jedes Event enthält Zeitstempel, Akteur, Aktion und Tenant-Kontext." },
              { emoji: "🤖", title: "KI-Sicherheit", desc: "Kein Training mit Kundendaten. KI-Provider sind per AVV gebunden. Prompt-Governance dokumentiert alle KI-Entscheidungen." },
              { emoji: "🇪🇺", title: "EU-Datenresidenz", desc: "Alle Daten werden auf Servern in Frankfurt am Main verarbeitet und gespeichert. Kein Drittlandtransfer." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">{item.emoji}</span>
                  <h3 className="text-[17px] font-semibold text-gray-900">{item.title}</h3>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/trust-center" className="text-[14px] font-medium text-[#003856] hover:text-[#00507a]">← Zurück zum Trust Center</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
