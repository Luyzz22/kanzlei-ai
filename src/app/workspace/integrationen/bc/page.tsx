"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type BcContract = {
  id: string
  bcId: string
  title: string
  vendor: string
  contractType: string
  amount: number
  currency: string
  startDate: string
  endDate: string | null
  riskHint: "hoch" | "mittel" | "niedrig"
  riskDescription: string
}

type ContractsResponse = {
  mode: "demo" | "live"
  company: string
  contracts: BcContract[]
}

const riskStyle = {
  hoch: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Hohes Risiko" },
  mittel: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Mittleres Risiko" },
  niedrig: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Niedriges Risiko" },
}

const fmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })

function formatDate(d: string | null): string {
  if (!d) return "Unbefristet"
  try { return dateFmt.format(new Date(d)) } catch { return d }
}

export default function BcIntegrationPage() {
  const router = useRouter()
  const [data, setData] = useState<ContractsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  const loadContracts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/workspace/bc/contracts")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as ContractsResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadContracts() }, [loadContracts])

  async function importContract(contractId: string) {
    setImporting(contractId)
    try {
      const res = await fetch("/api/workspace/bc/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId })
      })
      const json = await res.json() as { documentId?: string; runId?: string; error?: string; alreadyImported?: boolean }
      if (!res.ok || !json.documentId) throw new Error(json.error ?? "Import fehlgeschlagen")
      router.push(`/workspace/dokumente/${json.documentId}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import fehlgeschlagen")
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#C8985A]">
            🔗 Integration
          </p>
          <h1 className="mt-2 text-[1.875rem] font-semibold tracking-tight text-gray-950">
            Microsoft Business Central
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">
            Verträge und Einkaufsbestellungen direkt aus Business Central importieren und KI-analysieren.
          </p>
        </div>
        <Link
          href="/dashboard/admin/dynamics"
          className="self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
        >
          ⚙️ Integration konfigurieren
        </Link>
      </div>

      {/* Demo Mode Banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#003856]/20 bg-[#003856]/5 p-4">
        <span className="text-[20px]">🔵</span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#003856]">Demo-Modus: Cronus AG Testmandant</p>
          <p className="mt-0.5 text-[12px] text-[#003856]/70">
            Business Central ist mit dem Cronus AG Testmandanten verbunden. Die Verträge unten wurden aus BC importiert und können mit KanzleiAI analysiert werden.
            Für Live-Betrieb: Azure Entra ID Credentials unter{" "}
            <Link href="/dashboard/admin/dynamics" className="underline">Verwaltung → Dynamics</Link> hinterlegen.
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003856]/10">
              <span className="text-[18px]">🏢</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                {loading ? "Verbinde …" : data?.company ?? "Cronus AG"}
              </p>
              <p className="text-[12px] text-gray-500">Business Central Mandant · Demo-Umgebung</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-medium text-emerald-700">Verbunden</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          {[
            { label: "Umgebung", value: "Demo / Sandbox" },
            { label: "Mandant", value: data?.company ?? "Cronus AG" },
            { label: "Verträge verfügbar", value: loading ? "…" : String(data?.contracts.length ?? 0) },
          ].map(kpi => (
            <div key={kpi.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{kpi.label}</p>
              <p className="mt-0.5 text-[14px] font-medium text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contract List */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900">
            Verträge aus Business Central
          </h2>
          <button
            onClick={loadContracts}
            disabled={loading}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Lädt …" : "↻ Aktualisieren"}
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-[13px] text-red-700">{error}</p>
            <button onClick={loadContracts} className="mt-3 rounded-full bg-[#003856] px-4 py-2 text-[12px] font-medium text-white">
              Erneut versuchen
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[120px] animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.contracts ?? []).map(contract => {
              const style = riskStyle[contract.riskHint]
              const isImporting = importing === contract.id
              return (
                <div
                  key={contract.id}
                  className={`rounded-2xl border ${style.border} ${style.bg} p-5`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                          {style.label}
                        </span>
                        <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          BC: {contract.bcId}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-[15px] font-semibold text-gray-900">
                        {contract.title}
                      </h3>
                      <p className={`mt-0.5 text-[12px] ${style.text}`}>
                        ⚠️ {contract.riskDescription}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-gray-600">
                        <span>🏢 {contract.vendor}</span>
                        <span>📋 {contract.contractType}</span>
                        <span>💶 {fmt.format(contract.amount)}</span>
                        <span>📅 {formatDate(contract.startDate)} – {formatDate(contract.endDate)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => importContract(contract.id)}
                      disabled={isImporting}
                      className="flex shrink-0 items-center gap-2 self-start rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] disabled:opacity-60 sm:self-auto"
                    >
                      {isImporting ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Importiere …
                        </>
                      ) : (
                        <>
                          🔍 Importieren &amp; Analysieren
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Demo Flow Info */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="text-[13px] font-semibold text-gray-900">So funktioniert die BC-Integration</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            { n: "1", t: "BC verbinden", d: "Entra ID Credentials in Verwaltung hinterlegen" },
            { n: "2", t: "Verträge laden", d: "Einkaufsbestellungen und Verträge aus Cronus laden" },
            { n: "3", t: "KI analysiert", d: "Risiken, Klauseln und Handlungsempfehlungen in Sekunden" },
            { n: "4", t: "Ergebnis zurück", d: "Risiko-Score wird automatisch in BC zum Lieferanten geschrieben" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[10px] font-bold text-white">
                {s.n}
              </span>
              <div>
                <p className="text-[12px] font-semibold text-gray-800">{s.t}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-6 text-[11px] leading-relaxed text-gray-400">
        Die KI-Analyse liefert Risikohinweise auf Basis der Vertragstexte. Dies stellt keine Rechtsberatung dar.
        Risikoergebnisse werden nach Abschluss der Analyse automatisch in Business Central zurückgeschrieben.
      </p>
    </div>
  )
}
