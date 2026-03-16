"use client"

import { useEffect, useMemo, useState } from "react"

import { CtaPanel } from "@/components/marketing/cta-panel"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"

type AuditEvent = {
  id: string
  createdAt: string
  action: string
  resourceType: string
  resourceId: string | null
  requestId: string | null
  actorId: string | null
  ip: string | null
  userAgent: string | null
  documentId: string | null
  analysisLogId: string | null
  metadata: unknown
}

type ApiResponse = {
  events: AuditEvent[]
  nextCursor: string | null
}

function toCsv(rows: AuditEvent[]): string {
  const header = [
    "createdAt",
    "action",
    "resourceType",
    "resourceId",
    "requestId",
    "actorId",
    "documentId",
    "analysisLogId",
    "ip",
    "userAgent"
  ]
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v)
    const q = s.replace(/"/g, '""')
    return `"${q}"`
  }
  const lines = [header.join(",")]
  for (const r of rows) {
    lines.push(
      [
        r.createdAt,
        r.action,
        r.resourceType,
        r.resourceId,
        r.requestId,
        r.actorId,
        r.documentId,
        r.analysisLogId,
        r.ip,
        r.userAgent
      ]
        .map(esc)
        .join(",")
    )
  }
  return lines.join("\n")
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function AuditPage() {
  const [action, setAction] = useState("")
  const [actorId, setActorId] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const query = useMemo(() => {
    const p = new URLSearchParams()
    p.set("limit", "50")
    if (action.trim()) p.set("action", action.trim())
    if (actorId.trim()) p.set("actorId", actorId.trim())
    if (from) p.set("from", new Date(from).toISOString())
    if (to) p.set("to", new Date(to).toISOString())
    return p
  }, [action, actorId, from, to])

  async function load(reset: boolean) {
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams(query)
      if (!reset && nextCursor) p.set("cursor", nextCursor)
      const res = await fetch(`/api/admin/audit?${p.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as ApiResponse
      setEvents((prev) => (reset ? data.events : [...prev, ...data.events]))
      setNextCursor(data.nextCursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canLoadMore = Boolean(nextCursor) && !loading

  return (
    <main className="space-y-6">
      <SectionIntro
        eyebrow="Administration · Nachweise"
        title="Audit-Protokoll"
        description="Revisionsnahe Protokollansicht für Dokumenten- und Systemaktionen im Mandantenkontext. Filter, Export und Leselogik unterstützen interne Kontrollen und externe Prüfanforderungen."
      />

      <InfoPanel title="Nachweiskontext" tone="muted">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Mandanten-isolierte Ansicht" tone="info" />
          <StatusBadge label="Export verfügbar" tone="success" />
          <StatusBadge label="Filterprofil in Vorbereitung" tone="warning" />
        </div>
      </InfoPanel>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm text-slate-600">Aktion</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="z. B. analysis.completed"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Akteur-ID</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nutzer-ID"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Von</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-600">Bis</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className="rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void load(true)}
            disabled={loading}
          >
            {loading ? "Lädt…" : "Filter anwenden"}
          </button>

          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
            onClick={() => {
              setAction("")
              setActorId("")
              setFrom("")
              setTo("")
              void load(true)
            }}
            disabled={loading}
          >
            Filter zurücksetzen
          </button>

          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
            onClick={() => download("audit.json", JSON.stringify(events, null, 2), "application/json")}
            disabled={!events.length}
          >
            Export JSON
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
            onClick={() => download("audit.csv", toCsv(events), "text/csv")}
            disabled={!events.length}
          >
            Export CSV
          </button>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3 font-semibold">Zeit</th>
                <th className="p-3 font-semibold">Aktion</th>
                <th className="p-3 font-semibold">Ressource</th>
                <th className="p-3 font-semibold">Request-ID</th>
                <th className="p-3 font-semibold">Akteur-ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.length ? (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap p-3 text-slate-700">
                      {new Date(event.createdAt).toLocaleString("de-DE")}
                    </td>
                    <td className="p-3 font-medium text-slate-900">{event.action}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{event.resourceType}</div>
                      <div className="text-slate-500">{event.resourceId ?? "-"}</div>
                    </td>
                    <td className="p-3 text-slate-600">{event.requestId ?? "-"}</td>
                    <td className="p-3 text-slate-600">{event.actorId ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-slate-600" colSpan={5}>
                    Keine Audit-Ereignisse für die aktuelle Filterung gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 p-3">
          <div className="text-sm text-slate-600">{events.length} Ereignisse geladen</div>
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
            onClick={() => void load(false)}
            disabled={!canLoadMore}
          >
            Mehr laden
          </button>
        </div>
      </section>

      <CtaPanel
        title="Nächster Ausbau"
        description="Im nächsten Schritt folgen gespeicherte Filterprofile, Export-Historie und erweiterte Nachweisansichten für interne und externe Prüfungen."
        primaryLabel="Zum Admin Center"
        primaryHref="/dashboard/admin"
        secondaryLabel="Mitglieder & Rollen"
        secondaryHref="/dashboard/admin/members"
        variant="default"
      />
    </main>
  )
}
