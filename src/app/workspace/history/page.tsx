import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { withTenant } from "@/lib/tenant-context.server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

type HistoryEntry = {
  id: string
  documentId: string
  documentTitle: string
  documentType: string
  organizationName: string
  status: string
  reviewState: string
  primaryProvider: string | null
  primaryModel: string | null
  startedAt: Date
  completedAt: Date | null
  totalTokensUsed: number
  totalCostEstimate: number
  durationMs: number | null
  riskScore01: number | null
  aggregateConfidence: number | null
}

const statusToLabel: Record<string, { label: string; tone: "info" | "success" | "warning" | "risk" }> = {
  QUEUED: { label: "Eingereiht", tone: "info" },
  RUNNING: { label: "Läuft", tone: "info" },
  COMPLETED: { label: "Abgeschlossen", tone: "success" },
  FAILED: { label: "Fehlgeschlagen", tone: "risk" }
}

const reviewStateLabel: Record<string, string> = {
  UNGEPRUEFT: "Ungeprüft",
  ENTWURF: "Entwurf",
  ANALYSIERT: "Analysiert",
  IN_PRUEFUNG: "In Prüfung",
  FREIGEGEBEN: "Freigegeben",
  ZURUECKGEWIESEN: "Zurückgewiesen",
  WIEDERHOLUNG_ANGEFORDERT: "Wiederholung angefordert"
}

const toneClass: Record<"info" | "success" | "warning" | "risk", string> = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  risk: "bg-rose-100 text-rose-700"
}

async function loadHistoryForTenant(tenantId: string): Promise<HistoryEntry[]> {
  return withTenant(tenantId, async (tx) => {
    const runs = await tx.analysisRun.findMany({
      orderBy: [{ startedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        documentId: true,
        status: true,
        reviewState: true,
        primaryProvider: true,
        primaryModel: true,
        startedAt: true,
        completedAt: true,
        totalTokensUsed: true,
        totalCostEstimate: true,
        durationMs: true,
        riskScore01: true,
        aggregateConfidence: true,
        document: {
          select: {
            title: true,
            documentType: true,
            organizationName: true
          }
        }
      }
    })

    return runs.map((run) => ({
      id: run.id,
      documentId: run.documentId,
      documentTitle: run.document?.title ?? "Unbekanntes Dokument",
      documentType: run.document?.documentType ?? "—",
      organizationName: run.document?.organizationName ?? "—",
      status: run.status,
      reviewState: run.reviewState,
      primaryProvider: run.primaryProvider,
      primaryModel: run.primaryModel,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      totalTokensUsed: run.totalTokensUsed,
      totalCostEstimate: run.totalCostEstimate,
      durationMs: run.durationMs,
      riskScore01: run.riskScore01,
      aggregateConfidence: run.aggregateConfidence
    }))
  })
}

export default async function HistoryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?next=/workspace/history")
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">🔒</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Die Analyse-Historie benötigt einen eindeutigen Mandantenkontext.
        </p>
      </div>
    )
  }

  let entries: HistoryEntry[] = []
  let loadError: string | null = null

  try {
    entries = await loadHistoryForTenant(tenantContext.tenantId)
  } catch (error) {
    console.error("[workspace.history.list_failed]", {
      tenantId: tenantContext.tenantId,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
    })
    loadError = "Die Analyse-Historie konnte nicht geladen werden. Bitte versuchen Sie es erneut."
  }

  const completedRuns = entries.filter((e) => e.status === "COMPLETED").length
  const totalCost = entries.reduce((sum, e) => sum + (e.totalCostEstimate || 0), 0)
  const totalTokens = entries.reduce((sum, e) => sum + (e.totalTokensUsed || 0), 0)

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📜 Verlauf</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Analyse-Historie</h1>
        <p className="mt-1 text-[14px] text-gray-500">
          {entries.length === 0
            ? "Noch keine Analyse-Läufe vorhanden."
            : `${entries.length} ${entries.length === 1 ? "Analyse-Lauf" : "Analyse-Läufe"} · neueste zuerst`}
        </p>
      </header>

      {loadError ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {loadError}
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-400">Abgeschlossen</p>
            <p className="mt-1 text-[22px] font-semibold text-emerald-600">{completedRuns}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-400">Tokens insgesamt</p>
            <p className="mt-1 text-[22px] font-semibold text-gray-900">{totalTokens.toLocaleString("de-DE")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-400">Kosten geschätzt</p>
            <p className="mt-1 text-[22px] font-semibold text-gray-900">
              {totalCost.toLocaleString("de-DE", { style: "currency", currency: "USD", maximumFractionDigits: 4 })}
            </p>
          </div>
        </div>
      ) : null}

      {entries.length === 0 && !loadError ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <span className="text-[40px]">⏱️</span>
          <h2 className="mt-4 text-[18px] font-semibold text-gray-900">Noch keine Analyse-Läufe</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
            Sobald die erste KI-Analyse eines Dokuments läuft, erscheint hier ein vollständiger,
            auditierbarer Verlauf inkl. Provider, Modell, Kosten und Token-Verbrauch.
          </p>
          <Link
            href="/workspace/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            📤 Dokument erfassen
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
          <div className="hidden bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1.4fr_1fr_120px_120px_120px]">
            <span>Dokument</span>
            <span>Provider · Modell</span>
            <span>Status</span>
            <span>Risiko</span>
            <span>Gestartet</span>
          </div>

          {entries.map((entry) => {
            const statusInfo = statusToLabel[entry.status] ?? { label: entry.status, tone: "info" as const }
            const riskPercent = entry.riskScore01 !== null ? Math.round(entry.riskScore01 * 100) : null
            return (
              <Link
                key={entry.id}
                href={`/workspace/dokumente/${entry.documentId}`}
                className="grid border-b border-gray-100 bg-white px-5 py-4 last:border-b-0 transition-colors hover:bg-gold-50/30 sm:grid-cols-[1.4fr_1fr_120px_120px_120px] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-gray-900">{entry.documentTitle}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {entry.documentType} · {entry.organizationName} · {reviewStateLabel[entry.reviewState] ?? entry.reviewState}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <p className="text-[12px] font-medium text-gray-700">{entry.primaryProvider ?? "—"}</p>
                  <p className="text-[11px] text-gray-400">{entry.primaryModel ?? "kein Modell"}</p>
                </div>
                <span
                  className={`mt-2 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-0 ${toneClass[statusInfo.tone]}`}
                >
                  {statusInfo.label}
                </span>
                <span
                  className={`mt-2 text-[13px] font-semibold sm:mt-0 ${
                    riskPercent === null
                      ? "text-gray-300"
                      : riskPercent >= 70
                      ? "text-rose-600"
                      : riskPercent >= 40
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {riskPercent !== null ? `${riskPercent}%` : "—"}
                </span>
                <span className="mt-2 text-[12px] text-gray-500 sm:mt-0">{dateTimeFormatter.format(entry.startedAt)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
