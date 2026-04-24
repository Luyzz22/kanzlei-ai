"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type DynamicsConfigPublic = {
  id: string
  azureTenantId: string
  clientId: string
  secretFingerprint: string
  environment: string
  companyId: string | null
  companyName: string | null
  baseUrl: string
  syncEnabled: boolean
  webhookEnabled: boolean
  lastSyncAt: string | null
  lastSyncStatus: string | null
  lastSyncError: string | null
  isConfigured: boolean
}

type FormState = {
  azureTenantId: string
  clientId: string
  clientSecret: string
  environment: "Production" | "Sandbox"
  baseUrl: string
  companyId: string
  companyName: string
}

type Company = { id: string; name: string; displayName: string }

type TestResult =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; companies: Company[] }
  | { kind: "error"; stage?: string; error: string }

const DEFAULT_BASE_URL = "https://api.businesscentral.dynamics.com/v2.0"

export default function DynamicsAdminPage() {
  const [config, setConfig] = useState<DynamicsConfigPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({
    azureTenantId: "",
    clientId: "",
    clientSecret: "",
    environment: "Production",
    baseUrl: DEFAULT_BASE_URL,
    companyId: "",
    companyName: ""
  })
  const [testResult, setTestResult] = useState<TestResult>({ kind: "idle" })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [tab, setTab] = useState<"config" | "sync" | "webhooks">("config")

  // Initial load
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch("/api/dynamics/config")
        if (!alive) return
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            setConfig(data.config)
            setForm((f) => ({
              ...f,
              azureTenantId: data.config.azureTenantId,
              clientId: data.config.clientId,
              environment: data.config.environment,
              baseUrl: data.config.baseUrl,
              companyId: data.config.companyId ?? "",
              companyName: data.config.companyName ?? ""
            }))
          }
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const canTest =
    form.azureTenantId.trim().length > 0 &&
    form.clientId.trim().length > 0 &&
    (form.clientSecret.trim().length > 0 || config?.isConfigured === true)

  const testConnection = async () => {
    setTestResult({ kind: "running" })
    try {
      const body = form.clientSecret
        ? {
            azureTenantId: form.azureTenantId.trim(),
            clientId: form.clientId.trim(),
            clientSecret: form.clientSecret,
            environment: form.environment,
            baseUrl: form.baseUrl.trim()
          }
        : {} // Stored-Mode: Server laedt Config aus DB

      const res = await fetch("/api/dynamics/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        setTestResult({ kind: "success", companies: data.companies ?? [] })
      } else {
        setTestResult({
          kind: "error",
          stage: data.stage,
          error: data.error ?? "Unbekannter Fehler"
        })
      }
    } catch (e) {
      setTestResult({
        kind: "error",
        error: e instanceof Error ? e.message : "Netzwerkfehler"
      })
    }
  }

  const saveConfig = async () => {
    if (!form.clientSecret && !config?.isConfigured) {
      setSaveMessage("Client Secret erforderlich fuer Erstkonfiguration")
      return
    }
    setSaving(true)
    setSaveMessage(null)
    try {
      const body: Record<string, string> = {
        azureTenantId: form.azureTenantId.trim(),
        clientId: form.clientId.trim(),
        environment: form.environment,
        baseUrl: form.baseUrl.trim(),
        companyId: form.companyId.trim(),
        companyName: form.companyName.trim()
      }
      // Nur senden wenn Nutzer ein neues Secret eingegeben hat
      if (form.clientSecret) {
        body.clientSecret = form.clientSecret
      } else if (config?.isConfigured) {
        // Server akzeptiert Upsert nur mit Secret — wenn User nichts eingetippt hat,
        // re-senden wir nicht (Update-Felder ausserhalb Secret erfordern API-Erweiterung)
        setSaveMessage(
          "Bitte Client Secret erneut eingeben (aus Sicherheitsgruenden wird es nicht aus der DB zurueckgegeben)"
        )
        setSaving(false)
        return
      }

      const res = await fetch("/api/dynamics/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveMessage(`Fehler: ${data.error ?? "Unbekannt"}`)
      } else {
        setSaveMessage("Konfiguration gespeichert")
        // Reload
        const loaded = await fetch("/api/dynamics/config").then((r) => r.json())
        if (loaded.config) {
          setConfig(loaded.config)
          setForm((f) => ({ ...f, clientSecret: "" }))
        }
      }
    } catch (e) {
      setSaveMessage(`Netzwerkfehler: ${e instanceof Error ? e.message : "unbekannt"}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteConfig = async () => {
    if (!confirm("Dynamics-Integration wirklich entfernen? Alle gespeicherten Credentials werden geloescht.")) {
      return
    }
    await fetch("/api/dynamics/config", { method: "DELETE" })
    setConfig(null)
    setForm({
      azureTenantId: "",
      clientId: "",
      clientSecret: "",
      environment: "Production",
      baseUrl: DEFAULT_BASE_URL,
      companyId: "",
      companyName: ""
    })
    setSaveMessage("Konfiguration entfernt")
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center text-[13px] text-gray-500">
        Lade Dynamics-Konfiguration...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
            🏗️ Integration
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">
            Microsoft Dynamics 365
          </h1>
          <p className="mt-2 text-[14px] text-gray-500">
            Business Central via OAuth 2.0 (Entra ID) + REST API v2.0. Credentials werden
            AES-256-GCM-verschluesselt in der Datenbank abgelegt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              config?.lastSyncStatus === "success"
                ? "bg-emerald-500"
                : config?.lastSyncStatus === "error"
                  ? "bg-red-500"
                  : config?.isConfigured
                    ? "bg-amber-500"
                    : "bg-gray-300"
            }`}
          />
          <span className="text-[12px] font-medium text-gray-500">
            {config?.lastSyncStatus === "success"
              ? "Verbunden"
              : config?.lastSyncStatus === "error"
                ? "Fehler beim letzten Sync"
                : config?.isConfigured
                  ? "Konfiguriert (noch nicht getestet)"
                  : "Nicht konfiguriert"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {(["config", "sync", "webhooks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === t
                ? "border-[#003856] text-[#003856]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "config" ? "🔐 Credentials" : t === "sync" ? "🔄 Sync" : "🪝 Webhooks"}
          </button>
        ))}
      </div>

      {tab === "config" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-900">Azure Entra ID (App-Registration)</h2>
            <p className="mt-1 text-[12px] text-gray-500">
              App-Registration aus dem Azure Portal. Berechtigung: Dynamics 365 Business Central →
              <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]">API.ReadWrite.All</code>
              (Application-Permission mit Admin-Consent).
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-gray-700">
                  Azure Tenant ID
                </label>
                <input
                  type="text"
                  value={form.azureTenantId}
                  onChange={(e) => setForm((f) => ({ ...f, azureTenantId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-gray-700">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={form.clientId}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                    placeholder="Application (client) ID"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-gray-700">
                    Client Secret
                    {config?.isConfigured && (
                      <span className="ml-2 text-[10px] font-normal text-gray-400">
                        Aktueller Fingerprint: {config.secretFingerprint}
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={form.clientSecret}
                    onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                    placeholder={
                      config?.isConfigured
                        ? "•••••••• (nur eingeben um Secret zu aendern)"
                        : "Client Secret"
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[13px] text-gray-900 placeholder:text-gray-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-900">Business Central Umgebung</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-gray-700">Environment</label>
                <select
                  value={form.environment}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, environment: e.target.value as "Production" | "Sandbox" }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                >
                  <option>Production</option>
                  <option>Sandbox</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-gray-700">Base URL</label>
                <input
                  type="text"
                  value={form.baseUrl}
                  onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-[12px] text-gray-900"
                />
              </div>
            </div>

            {testResult.kind === "success" && testResult.companies.length > 0 && (
              <div className="mt-4">
                <label className="mb-1 block text-[12px] font-medium text-gray-700">
                  Company auswaehlen
                </label>
                <select
                  value={form.companyId}
                  onChange={(e) => {
                    const found = testResult.companies.find((c) => c.id === e.target.value)
                    setForm((f) => ({
                      ...f,
                      companyId: e.target.value,
                      companyName: found?.displayName ?? ""
                    }))
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-900"
                >
                  <option value="">— Bitte waehlen —</option>
                  {testResult.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {config?.companyName && testResult.kind !== "success" && (
              <p className="mt-4 text-[12px] text-gray-500">
                Aktuell gespeicherte Company: <strong>{config.companyName}</strong>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={testConnection}
              disabled={!canTest || testResult.kind === "running"}
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {testResult.kind === "running" ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                  Teste Verbindung...
                </span>
              ) : (
                "🔌 Verbindung testen"
              )}
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:opacity-50"
            >
              {saving ? "Speichert..." : "Konfiguration speichern"}
            </button>
            {config?.isConfigured && (
              <button
                onClick={deleteConfig}
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50"
              >
                Konfiguration entfernen
              </button>
            )}
            {saveMessage && (
              <span className="text-[12px] text-gray-600">{saveMessage}</span>
            )}
          </div>

          {/* Test Result */}
          {testResult.kind === "success" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[13px] font-semibold text-emerald-800">
                ✅ Verbindung erfolgreich — {testResult.companies.length} Companies gefunden
              </p>
              {testResult.companies.length > 0 && (
                <ul className="mt-2 space-y-1 text-[12px] text-emerald-900">
                  {testResult.companies.map((c) => (
                    <li key={c.id}>
                      • <strong>{c.displayName}</strong>{" "}
                      <code className="ml-2 font-mono text-[10px] text-emerald-700">
                        {c.id}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] text-emerald-700">
                Bitte jetzt eine Company oben auswaehlen und Konfiguration speichern.
              </p>
            </div>
          )}

          {testResult.kind === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-[13px] font-semibold text-red-800">
                ❌ Verbindung fehlgeschlagen
                {testResult.stage && (
                  <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px]">
                    Stage: {testResult.stage}
                  </span>
                )}
              </p>
              <p className="mt-2 break-words text-[12px] text-red-700">{testResult.error}</p>
              <p className="mt-3 text-[11px] text-red-600">
                Haeufige Ursachen: Client Secret abgelaufen · App-Registration fehlt
                API.ReadWrite.All-Berechtigung · Admin-Consent nicht erteilt · Falsches
                Environment (Sandbox vs Production).
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "sync" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-900">Manueller Sync</h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Stammdaten aus Dynamics 365 Business Central importieren.
            </p>
            {!config?.isConfigured && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                Bitte zuerst Credentials hinterlegen &amp; Verbindung testen.
              </p>
            )}
            {config?.isConfigured && !config.companyId && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                Bitte erst eine Company auswaehlen (Tab &quot;Credentials&quot;).
              </p>
            )}
            {config?.isConfigured && config.companyId && (
              <div className="mt-4 space-y-2">
                {[
                  { key: "vendors", label: "Lieferanten (Vendors)", icon: "🏢" },
                  { key: "purchaseOrders", label: "Bestellungen (Purchase Orders)", icon: "📋" },
                  { key: "purchaseInvoices", label: "Einkaufsrechnungen", icon: "🧾" }
                ].map((e) => (
                  <button
                    key={e.key}
                    onClick={async () => {
                      const res = await fetch("/api/dynamics/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ entity: e.key })
                      })
                      const data = await res.json()
                      alert(
                        data.success
                          ? `✅ ${e.label}: ${data.count} Datensaetze synchronisiert`
                          : `❌ Fehler: ${data.error ?? "Unbekannt"}`
                      )
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 hover:bg-gray-50"
                  >
                    <span className="text-[20px]">{e.icon}</span>
                    <span className="text-[14px] font-medium text-gray-900">{e.label}</span>
                    <span className="ml-auto text-[11px] text-gray-400">Klick zum Starten</span>
                  </button>
                ))}
              </div>
            )}

            {config?.lastSyncAt && (
              <p className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                Letzter Sync: {new Date(config.lastSyncAt).toLocaleString("de-DE")} ·{" "}
                Status:{" "}
                <span className={config.lastSyncStatus === "success" ? "text-emerald-600" : "text-red-600"}>
                  {config.lastSyncStatus ?? "unbekannt"}
                </span>
                {config.lastSyncError && (
                  <span className="ml-2 text-red-500">· {config.lastSyncError}</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "webhooks" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-900">Webhook-Events</h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Dynamics 365 kann Events an KanzleiAI senden. Konfiguration in Business Central
              unter &quot;API Setup → Webhooks&quot;.
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 p-4 font-mono text-[11px] text-gray-700">
              <p>Webhook URL:</p>
              <p className="mt-1 break-all">
                https://www.kanzlei-ai.com/api/dynamics/webhook
              </p>
            </div>
            <p className="mt-3 text-[11px] text-amber-700">
              Hinweis: Webhook-Handling ist in Phase 2 (Einkaufs-Value-Layer).
              Aktuell werden Events empfangen aber nicht verarbeitet.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 text-[12px] text-gray-500">
        <Link href="/dashboard/admin" className="hover:underline">
          ← Zurueck zur Admin-Uebersicht
        </Link>
      </div>
    </div>
  )
}
