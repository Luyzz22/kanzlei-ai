"use client"

import { useState } from "react"
import Link from "next/link"

const scimEndpoints = [
  { method: "GET", path: "/api/scim/v2/ServiceProviderConfig", desc: "SCIM-Konfiguration und unterstuetzte Features" },
  { method: "GET", path: "/api/scim/v2/Schemas", desc: "User- und Group-Schema-Definition" },
  { method: "GET", path: "/api/scim/v2/Users", desc: "Alle provisionierten Nutzer auflisten" },
  { method: "POST", path: "/api/scim/v2/Users", desc: "Neuen Nutzer anlegen (JIT Provisioning)" },
  { method: "GET", path: "/api/scim/v2/Users/:id", desc: "Einzelnen Nutzer abrufen" },
  { method: "PATCH", path: "/api/scim/v2/Users/:id", desc: "Nutzer aktualisieren (active, displayName, role)" },
  { method: "DELETE", path: "/api/scim/v2/Users/:id", desc: "Nutzer deaktivieren (Soft Delete)" },
  { method: "GET", path: "/api/scim/v2/Groups", desc: "Rollengruppen auflisten (Admin, Anwalt, Assistent)" },
  { method: "GET", path: "/api/scim/v2/Groups/:id", desc: "Einzelne Gruppe mit Mitgliedern" },
  { method: "PATCH", path: "/api/scim/v2/Groups/:id", desc: "Gruppenmitgliedschaft aendern" },
]

const setupSteps = [
  { step: "1", title: "Bearer Token generieren", desc: "Sicheres Token (min. 32 Zeichen) generieren und als SCIM_BEARER_TOKENS Env Var in Vercel setzen.", code: "openssl rand -base64 32" },
  { step: "2", title: "Tenant zuweisen", desc: "SCIM_TENANT_SLUG Env Var auf den Ziel-Tenant setzen (z.B. 'dermalog-purchasing').", code: "SCIM_TENANT_SLUG=dermalog-purchasing" },
  { step: "3", title: "Identity Provider konfigurieren", desc: "Im IdP (Entra ID, Okta, OneLogin) die SCIM-Provisioning-URL und das Bearer Token eintragen.", code: "Base URL: https://www.kanzlei-ai.com/api/scim/v2" },
  { step: "4", title: "Gruppenmap anlegen", desc: "Optional: SCIM_GROUP_ADMIN, SCIM_GROUP_ANWALT, SCIM_GROUP_ASSISTENT Env Vars setzen fuer Rollen-Mapping.", code: "SCIM_GROUP_ADMIN=KanzleiAI.Admin" },
]

export default function ScimPage() {
  const [activeTab, setActiveTab] = useState<"setup" | "endpoints" | "mapping">("setup")

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👥 Identity</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">SCIM v2 Provisioning</h1>
          <p className="mt-2 text-[14px] text-gray-500">Automatische Nutzerverwaltung ueber Microsoft Entra ID, Okta oder OneLogin. RFC 7643/7644 konform.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-emerald-700">API bereit</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-gray-200">
        {[
          { key: "setup" as const, label: "Setup", emoji: "⚙️" },
          { key: "endpoints" as const, label: "API-Endpunkte", emoji: "🔗" },
          { key: "mapping" as const, label: "Rollen-Mapping", emoji: "👥" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.key ? "border-[#003856] text-[#003856]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>{tab.emoji} {tab.label}</button>
        ))}
      </div>

      {activeTab === "setup" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[13px] text-blue-800">💡 SCIM (System for Cross-domain Identity Management) ermoeglicht es Identity Providern wie Microsoft Entra ID, Nutzer automatisch anzulegen, zu aktualisieren und zu deaktivieren — ohne manuelles Onboarding.</p>
          </div>
          {setupSteps.map((s) => (
            <div key={s.step} className="rounded-xl border border-gray-100 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[12px] font-bold text-white">{s.step}</span>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-[13px] text-gray-500">{s.desc}</p>
                  <code className="mt-2 block rounded-lg bg-gray-50 px-3 py-2 font-mono text-[12px] text-[#003856]">{s.code}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "endpoints" && (
        <div className="mt-6 space-y-2">
          <div className="rounded-lg bg-gray-50 px-4 py-2">
            <p className="text-[12px] text-gray-500">Base URL: <code className="font-mono text-[#003856]">https://www.kanzlei-ai.com/api/scim/v2</code> · Auth: <code className="font-mono text-[#003856]">Bearer &lt;token&gt;</code></p>
          </div>
          {scimEndpoints.map((ep, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-5 py-3">
              <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold ${ep.method === "GET" ? "bg-emerald-100 text-emerald-700" : ep.method === "POST" ? "bg-blue-100 text-blue-700" : ep.method === "PATCH" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{ep.method}</span>
              <div>
                <code className="text-[12px] text-gray-900">{ep.path}</code>
                <p className="mt-0.5 text-[11px] text-gray-500">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "mapping" && (
        <div className="mt-6 space-y-4">
          <p className="text-[13px] text-gray-500">SCIM-Gruppen werden auf KanzleiAI-Rollen gemappt. Konfigurierbar ueber Env Vars.</p>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {[
              { group: "KanzleiAI.Admin", role: "ADMIN", desc: "Vollzugriff + Verwaltung + Admin-Panel", color: "bg-red-100 text-red-700" },
              { group: "KanzleiAI.Anwalt", role: "ANWALT", desc: "Analyse, Copilot, Export, Review — Standard Power-User", color: "bg-blue-100 text-blue-700" },
              { group: "KanzleiAI.Assistent", role: "ASSISTENT", desc: "Nur Lesen, kein Export, kein Copilot", color: "bg-gray-100 text-gray-600" },
            ].map((m) => (
              <div key={m.group} className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 last:border-b-0">
                <div>
                  <code className="text-[13px] font-medium text-gray-900">{m.group}</code>
                  <p className="mt-0.5 text-[11px] text-gray-500">{m.desc}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${m.color}`}>{m.role}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] text-gray-500">Im Identity Provider (Entra ID / Okta) weisen Sie Nutzern diese Gruppen zu. SCIM synchronisiert die Zuordnung automatisch in KanzleiAI. Bei Gruppenentfernung wird der Nutzer deaktiviert.</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
