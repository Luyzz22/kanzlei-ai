"use client"

import { useState } from "react"
import Link from "next/link"

export default function SecurityAccessPage() {
  const [ssoEnabled] = useState(false)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔐 Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Sicherheit & Zugriff</h1>
      <p className="mt-2 text-[14px] text-gray-500">Authentifizierung, SSO-Konfiguration und Zugriffsprotokolle.</p>

      {/* Auth Method */}
      <div className="mt-10 space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Authentifizierung</h2>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[22px]">🔑</span>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">E-Mail + Passwort</h3>
                <p className="text-[12px] text-gray-500">Standard-Authentifizierung fuer alle Nutzer</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">Aktiv</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[22px]">🏢</span>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Microsoft Entra ID (SSO)</h3>
                <p className="text-[12px] text-gray-500">Single Sign-On via SAML/OIDC fuer Enterprise-Kunden</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${ssoEnabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ssoEnabled ? "Aktiv" : "Vorbereitet"}</span>
          </div>
          {!ssoEnabled && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-[12px] text-amber-700">SSO-Konfiguration erfordert Azure AD Client ID und Secret. Kontaktieren Sie <Link href="mailto:ki@sbsdeutschland.de" className="font-medium underline">ki@sbsdeutschland.de</Link> fuer die Einrichtung.</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div className="mt-8 space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Sicherheitseinstellungen</h2>
        <div className="space-y-2">
          {[
            { label: "JWT Session-Dauer", value: "24 Stunden", desc: "Maximale Session-Laenge bevor Neuanmeldung erforderlich" },
            { label: "Row-Level Security", value: "Aktiv (12 Tabellen)", desc: "Datenbankebene Mandantentrennung" },
            { label: "HSTS", value: "max-age=63072000", desc: "HTTP Strict Transport Security" },
            { label: "X-Frame-Options", value: "DENY", desc: "Clickjacking-Schutz" },
            { label: "Content Security Policy", value: "Aktiv", desc: "XSS-Schutz" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3.5">
              <div>
                <p className="text-[14px] font-medium text-gray-900">{s.label}</p>
                <p className="text-[11px] text-gray-500">{s.desc}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-mono font-medium text-gray-700">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
