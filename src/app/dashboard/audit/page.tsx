"use client"

import { useEffect, useMemo, useState } from "react"

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
    // initial load
    void load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canLoadMore = Boolean(nextCursor) && !loading

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Audit Log</h1>
          <p className="text-muted-foreground">
            Revisionsprotokoll für KI- und Dokumentenaktionen (mandanten-isoliert).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => download("audit.json", JSON.stringify(events, null, 2), "application/json")}
            disabled={!events.length}
          >
            Export JSON
          </button>
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => download("audit.csv", toCsv(events), "text/csv")}
            disabled={!events.length}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Action</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="z.B. analysis.completed"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Actor ID</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="User ID"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">From</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">To</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={() => void load(true)}
            disabled={loading}
          >
            {loading ? "Lädt…" : "Filter anwenden"}
          </button>

          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => {
              setAction("")
              setActorId("")
              setFrom("")
              setTo("")
              void load(true)
            }}
            disabled={loading}
          >
            Reset
          </button>

          {error ? <div className="ml-2 text-sm text-red-600">{error}</div> : null}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="p-3">Zeit</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource</th>
                <th className="p-3">Request</th>
                <th className="p-3">Actor</th>
              </tr>
            </thead>
            <tbody>
              {events.length ? (
                events.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-3 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="p-3">{e.action}</td>
                    <td className="p-3">
                      <div className="font-medium">{e.resourceType}</div>
                      <div className="text-muted-foreground">{e.resourceId ?? "-"}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{e.requestId ?? "-"}</td>
                    <td className="p-3 text-muted-foreground">{e.actorId ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={5}>
                    Keine Events gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3">
          <div className="text-sm text-muted-foreground">{events.length} Events geladen</div>
          <button
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => void load(false)}
            disabled={!canLoadMore}
          >
            Mehr laden
          </button>
        </div>
      </div>
    </div>
  )
}
