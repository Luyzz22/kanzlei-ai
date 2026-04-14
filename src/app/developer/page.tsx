import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Developer & API", description: "REST API, Webhooks und Integrationen für KanzleiAI. Entwickler-Dokumentation." }
export const revalidate = 3600

const endpoints = [
  { method: "POST", path: "/api/analyze-quick", desc: "Vertrag analysieren (Claude Sonnet 4)", auth: "JWT Session" },
  { method: "POST", path: "/api/copilot", desc: "Contract Copilot (SSE Streaming)", auth: "JWT Session" },
  { method: "POST", path: "/api/export/csv", desc: "CSV-Export (Excel-kompatibel)", auth: "JWT Session" },
  { method: "POST", path: "/api/export/datev", desc: "DATEV-Format 510 Export", auth: "JWT Session" },
  { method: "POST", path: "/api/contact", desc: "Enterprise-Kontaktformular", auth: "Public" },
  { method: "POST", path: "/api/webhooks", desc: "Webhook Event-Gateway", auth: "API Key" },
  { method: "GET", path: "/api/health", desc: "System Health Check", auth: "Public" },
  { method: "POST", path: "/api/stripe/checkout", desc: "Stripe Checkout Session", auth: "JWT Session" },
  { method: "POST", path: "/api/stripe/portal", desc: "Stripe Customer Portal", auth: "JWT Session" },
  { method: "POST", path: "/api/stripe/webhook", desc: "Stripe Event-Handler", auth: "Stripe Sig" },
  { method: "POST", path: "/api/admin/provision-demo", desc: "Demo-Tenant erstellen", auth: "ADMIN + Secret" },
  { method: "GET", path: "/api/admin/status", desc: "Admin-Status", auth: "Public" },
]

const webhookEvents = [
  { event: "analysis.completed", desc: "Analyse erfolgreich abgeschlossen" },
  { event: "analysis.high_risk", desc: "Hochrisiko-Vertrag erkannt (Score ≥ 70)" },
  { event: "export.created", desc: "Export (PDF/CSV/DATEV) erstellt" },
  { event: "user.login", desc: "Nutzer hat sich angemeldet" },
]

export default function DeveloperPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🔗</span>
              <span className="text-[12px] font-medium text-gold-700">Developer</span>
            </div>
            <h1 className="text-display text-gray-950">API & Integrationen</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">REST API, Webhooks und Automatisierungen. Integrieren Sie KanzleiAI in Ihre bestehenden Workflows.</p>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📡 REST API</p>
          <h2 className="mt-3 text-display-sm text-gray-950">{endpoints.length} API-Endpunkte</h2>
          <p className="mt-3 text-[15px] text-gray-500">Alle Endpunkte sind über HTTPS erreichbar. Authentifizierung via JWT Session oder API Key.</p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200">
            <div className="hidden bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[80px_1fr_1fr_120px]">
              <span>Methode</span><span>Endpunkt</span><span>Beschreibung</span><span>Auth</span>
            </div>
            {endpoints.map((ep) => (
              <div key={ep.path} className="grid border-t border-gray-100 bg-white px-5 py-3.5 sm:grid-cols-[80px_1fr_1fr_120px] sm:items-center">
                <span className={`inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-bold ${ep.method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{ep.method}</span>
                <code className="mt-1 text-[13px] font-medium text-gray-900 sm:mt-0">{ep.path}</code>
                <span className="mt-1 text-[13px] text-gray-500 sm:mt-0">{ep.desc}</span>
                <span className="mt-1 text-[11px] text-gray-400 sm:mt-0">{ep.auth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔔 Webhooks</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Event-basierte Automatisierung</h2>
          <p className="mt-3 text-[15px] text-gray-500">KanzleiAI sendet Events an n8n, Slack oder beliebige HTTP-Endpoints. Hochrisiko-Verträge lösen automatisch Benachrichtigungen aus.</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {webhookEvents.map((ev) => (
              <div key={ev.event} className="rounded-xl border border-gray-100 bg-white p-4">
                <code className="text-[13px] font-semibold text-[#003856]">{ev.event}</code>
                <p className="mt-1 text-[13px] text-gray-500">{ev.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 bg-gray-900 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Beispiel-Payload</p>
            <pre className="mt-3 text-[12px] leading-relaxed text-emerald-400">{`{
  "type": "analysis.high_risk",
  "data": {
    "riskScore": 85,
    "product": "Arbeitsvertrag_Mueller.pdf",
    "model": "claude-sonnet-4",
    "findingsCount": 12
  },
  "timestamp": "2026-04-04T14:30:00Z"
}`}</pre>
          </div>
        </div>
      </section>

      {/* Integration Stack */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔧 Integrationen</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Passt in Ihren Stack</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: "🔐", title: "Microsoft Entra ID", desc: "Single Sign-On via SAML/OIDC für Enterprise-Kunden", status: "Vorbereitet" },
              { emoji: "📧", title: "E-Mail (Resend)", desc: "Transaktionale E-Mails und Bestätigungen", status: "Aktiv" },
              { emoji: "💳", title: "Stripe", desc: "Checkout, Portal, Subscription Management", status: "Aktiv" },
              { emoji: "🔄", title: "n8n / Zapier", desc: "Workflow-Automatisierung via Webhooks", status: "Aktiv" },
              { emoji: "💬", title: "Slack", desc: "Hochrisiko-Benachrichtigungen via Incoming Webhook", status: "Aktiv" },
              { emoji: "🏦", title: "DATEV", desc: "Format 510 CSV-Export für Buchungsstapel", status: "Aktiv" },
            ].map((int) => (
              <div key={int.title} className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[22px]">{int.emoji}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${int.status === "Aktiv" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{int.status}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{int.title}</h3>
                <p className="mt-1 text-[13px] text-gray-500">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-display-sm text-gray-950">API-Zugang benötigt?</h2>
          <p className="mt-4 text-[16px] text-gray-500">Enterprise-Kunden erhalten API-Dokumentation und dedizierte Unterstützung bei der Integration.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">API-Zugang anfragen</Link>
            <Link href="/api/health" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Health Check testen →</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
