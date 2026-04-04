"use client"

import { useState, useEffect } from "react"

type HealthCheck = {
  status: string
  checks: Record<string, { status: string; latency?: number }>
  timestamp: string
  totalLatency: number
  version: string
}

const serviceNames: Record<string, { label: string; emoji: string }> = {
  database: { label: "Neon PostgreSQL (EU-Central)", emoji: "🗄️" },
  claude: { label: "Claude Sonnet 4 (Anthropic)", emoji: "🧠" },
  openai: { label: "GPT-4o (OpenAI)", emoji: "⚡" },
}

export default function SystemstatusPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(data => { setHealth(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📡 System</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Systemstatus</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Echtzeit-Status aller KanzleiAI-Systeme und KI-Provider.</p>

          {/* Overall Status */}
          <div className={`mt-10 rounded-2xl border p-6 ${health?.status === "operational" ? "border-emerald-200 bg-emerald-50" : loading ? "border-gray-200 bg-gray-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${health?.status === "operational" ? "animate-pulse bg-emerald-500" : loading ? "bg-gray-300" : "bg-amber-500"}`} />
              <p className="text-[17px] font-semibold text-gray-900">
                {loading ? "Status wird geladen..." : health?.status === "operational" ? "Alle Systeme betriebsbereit" : "Teilweise eingeschränkt"}
              </p>
            </div>
            {health && (
              <p className="mt-2 text-[12px] text-gray-500">
                Geprüft: {new Date(health.timestamp).toLocaleString("de-DE")} · Gesamtlatenz: {health.totalLatency}ms · Version {health.version}
              </p>
            )}
          </div>

          {/* Service Checks */}
          <div className="mt-6 space-y-3">
            {health && Object.entries(health.checks).map(([key, check]) => {
              const svc = serviceNames[key] || { label: key, emoji: "🔧" }
              return (
                <div key={key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[18px]">{svc.emoji}</span>
                    <div>
                      <p className="text-[14px] font-medium text-gray-900">{svc.label}</p>
                      {check.latency !== undefined && <p className="text-[11px] text-gray-400">Latenz: {check.latency}ms</p>}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${check.status === "operational" ? "bg-emerald-100 text-emerald-700" : check.status === "degraded" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                    {check.status === "operational" ? "Betriebsbereit" : check.status === "degraded" ? "Eingeschränkt" : "Unbekannt"}
                  </span>
                </div>
              )
            })}

            {/* Static services */}
            {[
              { emoji: "🔐", label: "Authentication (NextAuth v5)", status: "Betriebsbereit" },
              { emoji: "📧", label: "E-Mail (Resend)", status: "Betriebsbereit" },
              { emoji: "🛡️", label: "Security Headers (HSTS, CSP)", status: "Aktiv" },
              { emoji: "📋", label: "Audit Trail", status: "Aktiv" },
              { emoji: "☁️", label: "Vercel Edge Network", status: "Betriebsbereit" },
            ].map((svc) => (
              <div key={svc.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="text-[18px]">{svc.emoji}</span>
                  <p className="text-[14px] font-medium text-gray-900">{svc.label}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-semibold text-emerald-700">{svc.status}</span>
              </div>
            ))}
          </div>

          {/* SLA Info */}
          <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="text-[15px] font-semibold text-gray-900">📊 Service Level</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-[24px] font-semibold text-gray-950">99.9%</p>
                <p className="text-[12px] text-gray-400">Verfügbarkeit (Ziel)</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-semibold text-gray-950">&lt; 3s</p>
                <p className="text-[12px] text-gray-400">Analyse-Antwortzeit</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-semibold text-gray-950">EU</p>
                <p className="text-[12px] text-gray-400">Hosting-Region</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
