import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sicherheit & Compliance", description: "Enterprise-Sicherheitsarchitektur: Verschluesselung, RLS, RBAC, Audit Trail, DSGVO, AVV." }

export default function SicherheitPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🛡️</span>
              <span className="text-[12px] font-medium text-gold-700">Enterprise Security</span>
            </div>
            <h1 className="text-display text-gray-950">Sicherheit & Compliance</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Defense-in-Depth auf jeder Ebene — von der Netzwerkschicht bis zur Anwendungslogik.</p>
          </div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { emoji: "🔐", title: "Verschluesselung", items: ["TLS 1.3 fuer alle Datenuebertragungen", "AES-256 Verschluesselung at-rest", "HSTS mit 2 Jahren max-age + preload", "Strict-Transport-Security Header"] },
              { emoji: "🏗️", title: "Mandantentrennung", items: ["Row-Level Security auf 12 PostgreSQL-Tabellen", "current_tenant_id() Session-Variable", "DB-Level Isolation (kein App-Level-Filter)", "Separate Tenant-IDs fuer jeden Mandanten"] },
              { emoji: "👤", title: "Zugriffskontrolle (RBAC)", items: ["3 Rollen: Admin, Anwalt, Assistent", "Middleware-basierte Route-Guards", "Admin-Only Endpunkte geschuetzt", "JWT Sessions mit 24h MaxAge"] },
              { emoji: "📋", title: "Audit Trail", items: ["Non-blocking Event-Logging", "Akteur, Mandant, Zeitstempel pro Event", "16 Event-Typen (Login, Analyse, Export...)", "Export als CSV/DATEV"] },
              { emoji: "🛡️", title: "Security Headers", items: ["X-Frame-Options: DENY", "X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin", "Permissions-Policy: no camera/mic/geo"] },
              { emoji: "🤖", title: "KI-Sicherheit", items: ["Kein Training mit Kundendaten", "AVV mit allen KI-Providern", "Prompt-Governance mit Versionierung", "Human-in-the-Loop Pflicht"] },
            ].map((layer) => (
              <div key={layer.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-[24px]">{layer.emoji}</span>
                  <h3 className="text-[17px] font-semibold text-gray-900">{layer.title}</h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[8px] text-emerald-700">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📜 Compliance</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Regulatorische Konformitaet</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: "🇪🇺", title: "DSGVO", desc: "Privacy by Design. Datenminimierung, Zweckbindung, Loeschkonzept. AVV nach Art. 28 DSGVO verfuegbar.", status: "Konform" },
              { emoji: "🏛️", title: "GoBD-Naehe", desc: "Nachvollziehbarkeit, Unveraenderbarkeit und Historisierung aller geschaeftsrelevanten Vorgaenge.", status: "Umgesetzt" },
              { emoji: "📊", title: "ISO 27001", desc: "Sicherheitsarchitektur orientiert an ISO 27001 Anforderungen. Dokumentation verfuegbar.", status: "Vorbereitet" },
            ].map((comp) => (
              <div key={comp.title} className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <span className="text-[32px]">{comp.emoji}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-gray-900">{comp.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{comp.desc}</p>
                <span className={`mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${comp.status === "Konform" ? "bg-emerald-100 text-emerald-700" : comp.status === "Umgesetzt" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{comp.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Residency */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
          <span className="text-[40px]">🇩🇪</span>
          <h2 className="mt-4 text-display-sm text-gray-950">Datenresidenz Deutschland</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">Alle Daten werden auf Servern in Frankfurt am Main (eu-central-1) verarbeitet und gespeichert. PostgreSQL bei Neon (EU), Hosting auf Vercel Edge Network. Kein Drittlandtransfer personenbezogener Daten.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/avv" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">📋 AVV herunterladen</Link>
            <Link href="/trust-center" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Trust Center</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
