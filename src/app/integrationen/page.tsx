import Link from "next/link"

const integrations = [
  {
    category: "Dokumentenquellen",
    emoji: "📂",
    items: [
      { name: "Microsoft SharePoint", emoji: "📁", status: "geplant", desc: "Verträge direkt aus SharePoint-Bibliotheken importieren" },
      { name: "Google Drive", emoji: "📎", status: "geplant", desc: "PDF-Import aus Google Drive Ordnern" },
      { name: "E-Mail / IMAP", emoji: "📧", status: "geplant", desc: "Verträge als E-Mail-Anhänge automatisch erfassen" },
      { name: "Drag & Drop Upload", emoji: "📤", status: "live", desc: "PDF-Upload direkt in der Anwendung" },
    ]
  },
  {
    category: "Identität & Zugriff",
    emoji: "🔑",
    items: [
      { name: "Microsoft Entra ID", emoji: "🏢", status: "vorbereitet", desc: "SSO und automatische Rollenzuweisung via OIDC" },
      { name: "Google Workspace", emoji: "🔐", status: "live", desc: "OAuth-Login mit Google-Konten" },
      { name: "SCIM v2", emoji: "👥", status: "vorbereitet", desc: "Automatisierte Benutzerbereitstellung und -deaktivierung" },
      { name: "Credentials", emoji: "🔒", status: "live", desc: "E-Mail/Passwort-Login mit bcrypt-Hashing" },
    ]
  },
  {
    category: "KI-Provider",
    emoji: "🤖",
    items: [
      { name: "Claude (Anthropic)", emoji: "🧠", status: "live", desc: "Primärmodell für Vertragsanalyse und Copilot — Claude Sonnet 4" },
      { name: "GPT-4o (OpenAI)", emoji: "⚡", status: "live", desc: "Fallback-Modell für Analyse und Extraktion" },
      { name: "Gemini 2.5 (Google)", emoji: "💎", status: "live", desc: "Spezialist für lange Dokumente und visuelles Parsing" },
      { name: "Llama (Self-hosted)", emoji: "🦙", status: "geplant", desc: "EU-only Verarbeitung für sensible Mandantendaten" },
    ]
  },
  {
    category: "Export & Downstream",
    emoji: "📊",
    items: [
      { name: "PDF-Report", emoji: "📄", status: "geplant", desc: "Strukturierter Analysebericht als PDF-Export" },
      { name: "DATEV", emoji: "🧾", status: "geplant", desc: "Integration mit DATEV Unternehmen Online" },
      { name: "JSON/CSV Export", emoji: "📋", status: "geplant", desc: "Maschinenlesbare Datenexporte" },
      { name: "Webhook / n8n", emoji: "🔗", status: "geplant", desc: "Event-basierte Weiterleitung an Automatisierungsplattformen" },
    ]
  },
]

function getStatusStyle(status: string) {
  if (status === "live") return "bg-emerald-100 text-emerald-700"
  if (status === "vorbereitet") return "bg-amber-100 text-amber-700"
  return "bg-gray-100 text-gray-500"
}

function getStatusLabel(status: string) {
  if (status === "live") return "Live"
  if (status === "vorbereitet") return "Vorbereitet"
  return "Geplant"
}

export default function IntegrationenPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🔗</span>
              <span className="text-[12px] font-medium text-gold-700">Ökosystem</span>
            </div>
            <h1 className="text-display text-gray-950">Integrationen</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">
              KanzleiAI fügt sich nahtlos in bestehende Kanzlei- und Unternehmensinfrastruktur ein — von Dokumentenquellen über Identitätsmanagement bis zu KI-Providern.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-gray-200 bg-gold-50/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4 lg:px-10">
          <div className="bg-white px-6 py-6 text-center sm:py-7">
            <p className="text-[24px] font-semibold text-gray-900">3</p>
            <p className="text-[12px] text-gray-500">KI-Provider aktiv</p>
          </div>
          <div className="bg-white px-6 py-6 text-center sm:py-7">
            <p className="text-[24px] font-semibold text-gray-900">16+</p>
            <p className="text-[12px] text-gray-500">Integrationen</p>
          </div>
          <div className="bg-white px-6 py-6 text-center sm:py-7">
            <p className="text-[24px] font-semibold text-gray-900">SSO</p>
            <p className="text-[12px] text-gray-500">Enterprise-ready</p>
          </div>
          <div className="bg-white px-6 py-6 text-center sm:py-7">
            <p className="text-[24px] font-semibold text-gray-900">API</p>
            <p className="text-[12px] text-gray-500">REST + Webhooks</p>
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="space-y-16">
            {integrations.map((cat) => (
              <div key={cat.category}>
                <div className="mb-6 flex items-center gap-2">
                  <span className="text-[22px]">{cat.emoji}</span>
                  <h2 className="text-[20px] font-semibold text-gray-950">{cat.category}</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {cat.items.map((item) => (
                    <div key={item.name} className="rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-card">
                      <div className="flex items-start justify-between">
                        <span className="text-[24px]">{item.emoji}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusStyle(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-[14px] font-semibold text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🛠️ Für Entwickler</p>
              <h2 className="mt-3 text-display-sm text-gray-950">REST API & Webhooks</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Integrieren Sie KanzleiAI in Ihre bestehenden Workflows. Unsere API ermöglicht programmatischen Zugriff auf Vertragsanalyse, Dokumentenverwaltung und Audit-Protokolle.
              </p>
              <ul className="mt-6 space-y-3">
                {["RESTful API mit OpenAPI-Spezifikation", "Webhook-Events für Echtzeit-Benachrichtigungen", "API-Key + JWT-Authentifizierung", "Rate Limiting und Usage Metering"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-100 text-[10px] text-gold-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                POST /api/analyze-quick
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-gray-900 p-4 text-[12px] leading-relaxed text-gray-300"><code>{`curl -X POST \\
  https://kanzlei-ai.com/api/analyze-quick \\
  -H "Authorization: Bearer <token>" \\
  -F "file=@vertrag.pdf"

{
  "status": "success",
  "riskScore": 78,
  "findings": [...],
  "modelUsed": "claude-sonnet-4"
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">🔗</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Integration gewünscht?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            Sprechen Sie mit uns über Ihre Infrastruktur. Wir unterstützen bei der Anbindung an Ihre bestehenden Systeme.
          </p>
          <div className="mt-8">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Enterprise-Kontakt aufnehmen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
