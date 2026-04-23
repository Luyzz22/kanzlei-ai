import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import {
  getDocumentDossierData,
  type DocumentDossierData
} from "@/lib/documents/document-dossier-core"
import type { DocumentActivityCategory } from "@/lib/documents/document-activity-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

function categoryTone(category: DocumentActivityCategory): {
  bg: string
  text: string
  border: string
} {
  if (category === "Freigabe") {
    return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" }
  }
  if (category === "Review") {
    return { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" }
  }
  if (category === "Archivierung") {
    return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
  }
  if (category === "Audit") {
    return { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" }
  }
  return { bg: "bg-gold-50", text: "text-gold-900", border: "border-gold-200" }
}

export default async function EvidencePage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?next=/workspace/dokumente/${params.id}/evidence`)
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">🔒</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Für den Zugriff auf Nachweise ist ein eindeutiger Mandantenkontext erforderlich.
        </p>
        <Link
          href="/workspace/dokumente"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Zur Dokumentenliste
        </Link>
      </div>
    )
  }

  let dossier: DocumentDossierData | null = null
  try {
    dossier = await getDocumentDossierData(tenantContext.tenantId, session.user.id, params.id)
  } catch (error) {
    console.error("[workspace.dokumente.evidence_load_failed]", {
      tenantId: tenantContext.tenantId,
      documentId: params.id,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
    })
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">⚠️</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Nachweise konnten nicht geladen werden</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Bitte versuchen Sie es erneut oder kehren Sie zum Vertragsdetail zurück.
        </p>
        <Link
          href={`/workspace/dokumente/${params.id}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Zum Vertragsdetail
        </Link>
      </div>
    )
  }

  if (!dossier) {
    notFound()
    return null
  }

  const { evidenceSummary, activities, document } = dossier
  const completionPct = Math.round(
    (evidenceSummary.completedCount / evidenceSummary.totalCount) * 100
  )
  const allComplete = evidenceSummary.completedCount === evidenceSummary.totalCount

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link href="/workspace/dokumente" className="text-gray-400 hover:text-gray-600">
          Dokumente
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href={`/workspace/dokumente/${params.id}`}
          className="text-gray-400 hover:text-gray-600"
        >
          {document.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700">Nachweise</span>
      </div>

      {/* Header */}
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
            🔐 Nachweise &amp; Audit-Trail
          </p>
          <h1 className="mt-2 text-[1.875rem] font-semibold tracking-tight text-gray-950">
            Revisionssichere Dokumentation
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">
            Nachweispunkte für {document.title} · Mandant{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px]">
              {tenantContext.tenantId.slice(0, 8)}…
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspace/dokumente/${params.id}/dossier`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            📋 Dossier
          </Link>
          <Link
            href={`/workspace/dokumente/${params.id}`}
            className="rounded-full bg-[#003856] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            ← Zurück zum Detail
          </Link>
        </div>
      </header>

      {/* Completion banner */}
      <section
        aria-label="Evidence-Vollständigkeit"
        className={`mt-8 rounded-2xl border p-5 ${
          allComplete
            ? "border-emerald-200 bg-emerald-50"
            : "border-gold-200 bg-gold-50/40"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                allComplete ? "bg-emerald-100" : "bg-gold-100"
              }`}
              aria-hidden
            >
              <span className="text-[18px]">{allComplete ? "✓" : "◐"}</span>
            </span>
            <div>
              <p
                className={`text-[14px] font-semibold ${
                  allComplete ? "text-emerald-900" : "text-gold-900"
                }`}
              >
                {evidenceSummary.caseStatusLabel}
              </p>
              <p
                className={`text-[12px] ${
                  allComplete ? "text-emerald-700" : "text-gold-800"
                }`}
              >
                {evidenceSummary.completedCount} von {evidenceSummary.totalCount} Nachweisbausteinen
                geprüft
              </p>
            </div>
          </div>
          <div className="w-48">
            <div
              className={`h-1.5 overflow-hidden rounded-full ${
                allComplete ? "bg-emerald-100" : "bg-gold-100"
              }`}
            >
              <div
                className={`h-full ${allComplete ? "bg-emerald-500" : "bg-gold-600"}`}
                style={{ width: `${completionPct}%` }}
                aria-hidden
              />
            </div>
            <p
              className={`mt-1 text-right text-[11px] ${
                allComplete ? "text-emerald-700" : "text-gold-800"
              }`}
            >
              {completionPct}%
            </p>
          </div>
        </div>
        <p
          className={`mt-3 text-[13px] leading-relaxed ${
            allComplete ? "text-emerald-800" : "text-gold-800"
          }`}
        >
          {evidenceSummary.exportReadinessHint}
        </p>
      </section>

      {/* Evidence items checklist */}
      <section className="mt-8">
        <h2 className="text-[15px] font-semibold text-gray-950">Nachweisbausteine</h2>
        <p className="mt-1 text-[12px] text-gray-500">
          Jeder Baustein bewertet automatisch anhand der im Mandanten vorliegenden Daten.
        </p>
        <div className="mt-4 space-y-2">
          {evidenceSummary.items.map((item) => (
            <div
              key={item.key}
              className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${
                item.available
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                  item.available
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                aria-hidden
              >
                {item.available ? "✓" : "·"}
              </span>
              <div className="flex-1">
                <p
                  className={`text-[14px] font-semibold ${
                    item.available ? "text-emerald-900" : "text-gray-900"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`mt-0.5 text-[12px] leading-relaxed ${
                    item.available ? "text-emerald-800" : "text-gray-600"
                  }`}
                >
                  {item.detail}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  item.available
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.available ? "erfüllt" : "offen"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Document integrity block */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-950">Dokumentintegrität</h2>
        <p className="mt-1 text-[12px] text-gray-500">
          Technische Nachweise zur Unveränderbarkeit und Herkunft des Dokuments.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Dateiname
            </dt>
            <dd className="mt-1 break-all text-[13px] text-gray-800">{document.filename}</dd>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Dateityp
            </dt>
            <dd className="mt-1 text-[13px] text-gray-800">{document.mimeType ?? "—"}</dd>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Größe
            </dt>
            <dd className="mt-1 text-[13px] text-gray-800">
              {document.sizeBytes != null
                ? `${Math.round(document.sizeBytes / 1024).toLocaleString("de-DE")} KB`
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Erfasst am
            </dt>
            <dd className="mt-1 text-[13px] text-gray-800">
              {dateTimeFormatter.format(document.createdAt)}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Textextraktion
            </dt>
            <dd className="mt-1 text-[13px] text-gray-800">
              {document.processedAt
                ? `verarbeitet am ${dateTimeFormatter.format(document.processedAt)}`
                : document.processingError ?? "ausstehend"}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Mandantenisolation
            </dt>
            <dd className="mt-1 text-[13px] text-gray-800">
              Tenant-Scope: <code className="font-mono text-[11px]">{tenantContext.tenantId}</code>
            </dd>
          </div>
        </dl>
      </section>

      {/* Audit-Event timeline */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-950">Audit-Event-Timeline</h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Chronologischer Verlauf aus dem mandantenbezogenen Audit-Log. Neueste Einträge zuerst.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
            {activities.length} Einträge
          </span>
        </div>

        {activities.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-[13px] text-gray-500">
            Für dieses Dokument liegen noch keine Audit-Einträge vor.
          </p>
        ) : (
          <ol className="mt-6 space-y-0">
            {activities.map((event, i) => {
              const tone = categoryTone(event.category)
              return (
                <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < activities.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-8 h-full w-px bg-gray-200"
                    />
                  ) : null}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white ${tone.border}`}
                    aria-hidden
                  >
                    <span className={`text-[11px] font-bold ${tone.text}`}>•</span>
                  </div>
                  <div className={`flex-1 rounded-xl border p-4 ${tone.bg} ${tone.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold ${tone.text}`}
                          >
                            {event.category}
                          </span>
                          <h3 className={`text-[13px] font-semibold ${tone.text}`}>
                            {event.title}
                          </h3>
                        </div>
                        <p className={`mt-1.5 text-[12px] leading-relaxed ${tone.text} opacity-90`}>
                          {event.context}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[11px] ${tone.text} opacity-70`}>
                        {dateTimeFormatter.format(event.timestamp)}
                      </span>
                    </div>
                    <div className={`mt-2 flex items-center gap-2 text-[11px] ${tone.text} opacity-70`}>
                      <span>von {event.actorLabel}</span>
                      <span>·</span>
                      <code className="font-mono">{event.action}</code>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* Compliance footer */}
      <section className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-gray-900">Compliance-Rahmen</p>
            <p className="mt-0.5 text-[12px] text-gray-600">
              Dokumentation erfolgt revisionsnah im Mandantenkontext.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["DSGVO", "GoBD", "ISO 27001", "Mandantentrennung"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
