import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import {
  getWorkspaceDocumentStatusLabel,
  listWorkspaceDocuments,
  type WorkspaceDocumentItem
} from "@/lib/documents/workspace-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

const stages = [
  {
    key: "EINGEGANGEN" as const,
    label: "Eingegangen",
    emoji: "📥",
    accent: "border-blue-200 bg-blue-50",
    accentText: "text-blue-700",
    description: "Eingang erfasst, juristische Erstprüfung ausstehend."
  },
  {
    key: "IN_PRUEFUNG" as const,
    label: "In Prüfung",
    emoji: "🔍",
    accent: "border-amber-200 bg-amber-50",
    accentText: "text-amber-700",
    description: "Aktive juristische Prüfung."
  },
  {
    key: "FREIGEGEBEN" as const,
    label: "Freigegeben",
    emoji: "✅",
    accent: "border-emerald-200 bg-emerald-50",
    accentText: "text-emerald-700",
    description: "Prüfung abgeschlossen, freigegeben."
  },
  {
    key: "ARCHIVIERT" as const,
    label: "Archiviert",
    emoji: "📦",
    accent: "border-gray-200 bg-gray-50",
    accentText: "text-gray-600",
    description: "Vorgang abgeschlossen und archiviert."
  }
]

export default async function ReviewQueuePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?next=/workspace/review-queue")
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">🔒</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Die Review-Queue benötigt einen eindeutigen Mandantenkontext. Bitte wenden Sie sich an Ihren Administrator.
        </p>
      </div>
    )
  }

  let documents: WorkspaceDocumentItem[] = []
  let loadError: string | null = null

  try {
    documents = await listWorkspaceDocuments(tenantContext.tenantId)
  } catch (error) {
    console.error("[workspace.review_queue.list_failed]", {
      tenantId: tenantContext.tenantId,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
    })
    loadError = "Die Review-Queue konnte nicht geladen werden. Bitte versuchen Sie es erneut."
  }

  const grouped = stages.map((stage) => ({
    ...stage,
    items: documents.filter((d) => d.status === stage.key)
  }))

  const totalActive = grouped[0].items.length + grouped[1].items.length

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✅ Review</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Review-Queue</h1>
          <p className="mt-1 text-[14px] text-gray-500">
            {totalActive === 0
              ? "Keine offenen Vorgänge im aktiven Review-Zyklus."
              : `${totalActive} aktive ${totalActive === 1 ? "Vorgang" : "Vorgänge"} im Review-Zyklus`}
          </p>
        </div>
        <Link
          href="/workspace/upload"
          className="inline-flex items-center gap-2 self-start rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42] sm:self-auto"
        >
          📤 Neuen Eingang erfassen
        </Link>
      </header>

      {loadError ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {loadError}
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {grouped.map((stage) => (
          <section key={stage.key} className={`rounded-2xl border ${stage.accent} p-5`}>
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">{stage.emoji}</span>
                <h2 className={`text-[14px] font-semibold ${stage.accentText}`}>{stage.label}</h2>
              </div>
              <span className={`rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold ${stage.accentText}`}>
                {stage.items.length}
              </span>
            </header>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{stage.description}</p>

            <div className="mt-4 space-y-2">
              {stage.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/80 bg-white/40 px-3 py-4 text-center text-[11px] text-gray-400">
                  Keine Vorgänge in diesem Status.
                </div>
              ) : (
                stage.items.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/workspace/dokumente/${doc.id}`}
                    className="block rounded-lg border border-white bg-white px-3 py-3 transition-shadow hover:shadow-card"
                  >
                    <p className="text-[13px] font-medium text-gray-900 line-clamp-2">{doc.title}</p>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{doc.documentType}</p>
                    <p className="mt-2 text-[10px] text-gray-400">
                      {doc.organizationName} · {dateFormatter.format(doc.createdAt)}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">{doc.uploadedByLabel}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {documents.length === 0 && !loadError ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <span className="text-[40px]">📋</span>
          <h2 className="mt-4 text-[18px] font-semibold text-gray-900">Keine Dokumente in der Queue</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
            Sobald Sie einen Dokumenteingang erfassen, erscheint er hier in der Review-Queue.
          </p>
          <Link
            href="/workspace/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            📤 Ersten Eingang erfassen
          </Link>
        </div>
      ) : null}

      {/* Status legend */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-white px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status-Legende</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((s) => (
            <div key={s.key} className="flex items-start gap-2 text-[11px]">
              <span className="text-[14px]">{s.emoji}</span>
              <div>
                <p className="font-medium text-gray-700">{getWorkspaceDocumentStatusLabel(s.key)}</p>
                <p className="text-gray-400">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
