"use client"

import { useState } from "react"
import Link from "next/link"

type DynamicsConfig = {
  tenantId: string
  clientId: string
  clientSecret: string
  environment: string
  company: string
  baseUrl: string
  syncEnabled: boolean
  webhookEnabled: boolean
  lastSync: string | null
  status: "nicht_verbunden" | "verbunden" | "fehler"
}

const defaultConfig: DynamicsConfig = {
  tenantId: "",
  clientId: "",
  clientSecret: "",
  environment: "Production",
  company: "",
  baseUrl: "https://api.businesscentral.dynamics.com/v2.0",
  syncEnabled: false,
  webhookEnabled: false,
  lastSync: null,
  status: "nicht_verbunden"
}

const syncEntities = [
  { key: "vendors", label: "Lieferanten (Vendors)", desc: "Stammdaten aus Dynamics importieren", icon: "🏢" },
  { key: "purchaseOrders", label: "Bestellungen (Purchase Orders)", desc: "Vertragsreferenzen und Konditionen", icon: "📋" },
  { key: "purchaseInvoices", label: "Einkaufsrechnungen", desc: "Rechnungsdaten fuer Konditionen-Vergleich", icon: "🧾" },
  { key: "contracts", label: "Vertraege (Custom Entity)", desc: "Vertragsdokumente aus Dynamics-Anlagen", icon: "📄" },
]

const webhookEvents = [
  { key: "vendor.created", label: "Neuer Lieferant", desc: "Automatisch Vertragspruefung starten" },
  { key: "purchaseOrder.approved", label: "Bestellung genehmigt", desc: "Vertragsbedingungen validieren" },
  { key: "document.uploaded", label: "Dokument hochgeladen", desc: "Automatische KI-Analyse ausloesen" },
]

export default function DynamicsPage() {
  const [config, setConfig] = useState<DynamicsConfig>(defaultConfig)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"config" | "sync" | "webhooks">("config")

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    await new Promise(r => setTimeout(r, 2000))
    if (config.tenantId && config.clientId && config.clientSecret) {
      setTestResult("success")
    } else {
      setTestResult("error")
    }
    setTesting(false)
  }

  const saveConfig = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏗️ Integration</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Microsoft Dynamics 365</h1>
          <p className="mt-2 text-[14px] text-gray-500">Business Central via OAuth 2.0 (Entra ID) + REST API v2.0 anbinden. Lieferanten, Vertraege und Konditionen synchronisieren.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${config.status === "verbunden" ? "bg-emerald-500" : config.status === "fehler" ? "bg-red-500" : "bg-gray-300"}`} />
          <span className="text-[12px] font-medium text-gray-500">{config.status === "verbunden" ? "Verbunden" : config.status === "fehler" ? "Fehler" : "Nicht verbunden"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-gray-200">
        {[
          { key: "config" as const, label: "Konfiguration", emoji: "⚙️" },
          { key: "sync" as const, label: "Sync-Entitaeten", emoji: "🔄" },
          { key: "webhooks" as const, label: "Webhooks", emoji: "🔗" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.key ? "border-[#003856] text-[#003856]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>{tab.emoji} {tab.label}</button>
        ))}
      </div>

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-900">Microsoft Entra ID (OAuth 2.0)</h2>
            <p className="mt-1 text-[12px] text-gray-500">App-Registration aus dem Azure Portal. Berechtigung: Dynamics 365 Business Central → API.ReadWrite.All</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-gray-700">Tenant ID</label>
                <input type="text" value={config.tenantId} onChange={e => setConfig(c => ({...c, tenantId: e.target.value}))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-gray-700">Client ID</label>
                  <input type="text" value={config.clientId} onChange={e => setConfig(c => ({...c, clientId: e.target.value}))} placeholder="Application (client) ID" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-gray-700">Client Secret</label>
                  <input type="password" value={config.clientSecret} onChange={e => setConfig(c => ({...c, clientSecret: e.target.value}))} placeholder="••••••••••••" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-900">Business Central Umgebung</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-gray-700">Environment</label>
                <select value={config.environment} onChange={e => setConfig(c => ({...c, environment: e.target.value}))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200">
                  <option>Production</option>
                  <option>Sandbox</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-gray-700">Company Name</label>
                <input type="text" value={config.company} onChange={e => setConfig(c => ({...c, company: e.target.value}))} placeholder="DERMALOG Identification Systems GmbH" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
              </div>
            </div>
          </div>

          {/* Test + Save */}
          <div className="flex items-center gap-3">
            <button onClick={testConnection} disabled={testing} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {testing ? <span className="flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" /> Teste...</span> : "🔌 Verbindung testen"}
            </button>
            <button onClick={saveConfig} disabled={saving} className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:opacity-50">
              {saving ? "Speichert..." : "Konfiguration speichern"}
            </button>
            {testResult === "success" && <span className="text-[12px] font-medium text-emerald-600">✅ Verbindung erfolgreich</span>}
            {testResult === "error" && <span className="text-[12px] font-medium text-red-600">❌ Verbindung fehlgeschlagen — Credentials pruefen</span>}
          </div>
        </div>
      )}

      {/* Sync Tab */}
      {activeTab === "sync" && (
        <div className="mt-6 space-y-3">
          <p className="text-[13px] text-gray-500">Waehlen Sie die Entitaeten die zwischen Dynamics 365 und KanzleiAI synchronisiert werden sollen.</p>
          {syncEntities.map((entity) => (
            <div key={entity.key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{entity.icon}</span>
                <div>
                  <h3 className="text-[14px] font-medium text-gray-900">{entity.label}</h3>
                  <p className="text-[12px] text-gray-500">{entity.desc}</p>
                </div>
              </div>
              <button className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50">Aktivieren</button>
            </div>
          ))}

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[12px] text-amber-800">💡 API-Endpunkte: <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px]">/api/v2.0/companies(&#123;id&#125;)/vendors</code>, <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px]">/api/v2.0/companies(&#123;id&#125;)/purchaseInvoices</code></p>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === "webhooks" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h3 className="text-[14px] font-semibold text-gray-900">Webhook-Endpoint</h3>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <code className="flex-1 text-[12px] text-[#003856]">https://www.kanzlei-ai.com/api/dynamics/webhook</code>
              <button onClick={() => navigator.clipboard.writeText("https://www.kanzlei-ai.com/api/dynamics/webhook")} className="rounded bg-white px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100">Kopieren</button>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Diesen Endpoint in Dynamics 365 Business Central unter Webhook-Subscriptions eintragen.</p>
          </div>

          <p className="text-[13px] text-gray-500">Events die automatisch eine KI-Analyse ausloesen:</p>
          {webhookEvents.map((evt) => (
            <div key={evt.key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4">
              <div>
                <h3 className="text-[14px] font-medium text-gray-900">{evt.label}</h3>
                <p className="text-[12px] text-gray-500">{evt.desc}</p>
                <code className="mt-1 text-[10px] text-gray-400">{evt.key}</code>
              </div>
              <button className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50">Aktivieren</button>
            </div>
          ))}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-[14px] font-semibold text-gray-900">Workflow-Automatisierung</h3>
            <p className="mt-1 text-[12px] text-gray-500">Dynamics 365 → Webhook → KanzleiAI Analyse → Ergebnis zurueck in Dynamics → Slack-Benachrichtigung bei Hochrisiko</p>
            <div className="mt-3 flex items-center gap-2">
              {["Dynamics 365", "→", "Webhook", "→", "KI-Analyse", "→", "Risiko-Score", "→", "Slack"].map((s, i) => (
                <span key={i} className={s === "→" ? "text-[12px] text-gray-300" : "rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700"}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mt-8">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
