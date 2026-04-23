import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import {
  getDocumentDossierData,
  type DocumentDossierData,
  type DossierCaseStatus
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

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
})

function caseStatusTone(status: DossierCaseStatus): {
  bg: string
  text: string
  border: string
  dot: string
} {
  if (status === "NACHWEIS_VORBEREITET") {
    return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" }
  }
  if (status === "INTERNER_REVIEW") {
    return { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", dot: "bg-blue-500" }
  }
  if (status === "IN_BEARBEITUNG") {
    return { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" }
  }
  return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400" }
}

function activityCategoryTone(category: DocumentActivityCategory): string {
  if (category === "Freigabe") return "bg-emerald-100 text-emerald-700"
  if (category === "Review") return "bg-blue-100 text-blue-700"
  if (category === "Archivierung") return "bg-gray-100 text-gray-600"
  if (category === "Audit") return "bg-indigo-100 text-indigo-700"
  return "bg-gold-100 text-gold-800"
}

function severityTone(severity: "NIEDRIG" | "MITTEL" | "HOCH"): string {
  if (severity === "HOCH") return "bg-rose-100 text-rose-700"
  if (severity === "MITTEL") return "bg-amber-100 text-amber-700"
  return "bg-gray-100 text-gray-600"
}

function severityLabel(severity: "NIEDRIG" | "MITTEL" | "HOCH"): string {
  if (severity === "HOCH") return "Hoch"
  if (severity === "MITTEL") return "Mittel"
  return "Niedrig"
}

export default async function DossierPage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?next=/workspace/dokumente/${params.id}/dossier`)
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">🔒</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Für den Zugriff auf das Vertragsdossier ist ein eindeutiger Mandantenkontext erforderlich.
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
    console.error("[workspace.dokumente.dossier_load_failed]", {
      tenantId: tenantContext.tenantId,
      documentId: params.id,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
    })
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">⚠️</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Dossier konnte nicht geladen werden</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Bitte versuchen Sie es erneut oder kehren Sie zur Dokumentenliste zurück.
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

  const tone = caseStatusTone(dossier.evidenceSummary.caseStatus)
  const completionPct = Math.round(
    (dossier.evidenceSummary.completedCount / dossier.evidenceSummary.totalCount) * 100
  )

  const openFindings = dossier.findings.filter((f) => f.status === "OFFEN").length
  const decisionMemoNotes = dossier.notes.filter((n) => n.type === "DECISION_MEMO").length

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
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
          {dossier.document.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700">Dossier</span>
      </div>

      {/* Header */}
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
            📋 Vertragsdossier
          </p>
          <h1 className="mt-2 text-[1.875rem] font-semibold tracking-tight text-gray-950">
            {dossier.document.title}
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">
            {dossier.document.documentType} · {dossier.document.organizationName} · ID{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px]">
              {dossier.document.id.slice(0, 8)}…
            </code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspace/dokumente/${params.id}/evidence`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            🔐 Nachweise
          </Link>
          <Link
            href={`/workspace/dokumente/${params.id}`}
            className="rounded-full bg-[#003856] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            ← Zurück zum Detail
          </Link>
        </div>
      </header>

      {/* Case Status Banner */}
      <section
        aria-label="Fallstatus"
        className={`mt-8 rounded-2xl border p-5 ${tone.bg} ${tone.border}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden />
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.text}`}>
                Fallstatus
              </p>
              <p className={`mt-0.5 text-[18px] font-semibold ${tone.text}`}>
                {dossier.evidenceSummary.caseStatusLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className={`text-[11px] font-medium ${tone.text} opacity-70`}>Nachweisbausteine</p>
              <p className={`mt-0.5 text-[20px] font-semibold ${tone.text}`}>
                {dossier.evidenceSummary.completedCount}
                <span className="text-[13px] font-normal opacity-70">
                  {" / "}
                  {dossier.evidenceSummary.totalCount}
                </span>
              </p>
            </div>
            <div className="w-32">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
                <div
                  className={`h-full ${tone.dot}`}
                  style={{ width: `${completionPct}%` }}
                  aria-hidden
                />
              </div>
              <p className={`mt-1 text-[11px] ${tone.text} opacity-70`}>{completionPct}% vollständig</p>
            </div>
          </div>
        </div>
        <p className={`mt-3 text-[13px] leading-relaxed ${tone.text} opacity-90`}>
          {dossier.evidenceSummary.exportReadinessHint}
        </p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* KPI strip */}
          <div className="grid gap-3 sm:grid-cols-4">
            <KpiCard label="Aktivitäten" value={dossier.activities.length} />
            <KpiCard label="Prüfhinweise offen" value={openFindings} tone={openFindings > 0 ? "warn" : "ok"} />
            <KpiCard label="Review-Notizen" value={dossier.notes.length} />
            <KpiCard label="Freigabevermerke" value={decisionMemoNotes} tone={decisionMemoNotes > 0 ? "ok" : "neutral"} />
          </div>

          {/* Review readiness + decision summary */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-950">Entscheidungsreife</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
                {dossier.reviewReadiness.label}
              </span>
            </div>
            <p className="mt-3 text-[14px] font-medium text-gray-900">
              {dossier.decisionSummary.headline}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              {dossier.decisionSummary.recommendation}
            </p>
            {dossier.decisionSummary.facts.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {dossier.decisionSummary.facts.map((fact, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] text-gray-700"
                  >
                    <span className="mr-1.5 text-gray-400">•</span>
                    {fact}
                  </div>
                ))}
              </div>
            ) : null}
            {dossier.decisionSummary.missingElements.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[12px] font-semibold text-amber-900">Fehlende Elemente</p>
                <ul className="mt-1.5 space-y-1 text-[12px] text-amber-800">
                  {dossier.decisionSummary.missingElements.map((item, i) => (
                    <li key={i}>· {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Findings */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-950">Prüfhinweise</h2>
              <span className="text-[11px] text-gray-400">{dossier.findings.length} Einträge</span>
            </div>
            {dossier.findings.length === 0 ? (
              <p className="mt-3 text-[13px] text-gray-500">
                Noch keine manuellen Prüfhinweise erfasst.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {dossier.findings.map((finding) => (
                  <article
                    key={finding.id}
                    className="rounded-xl border border-gray-100 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityTone(
                            finding.severity
                          )}`}
                        >
                          {severityLabel(finding.severity)}
                        </span>
                        <h3 className="text-[14px] font-semibold text-gray-900">{finding.title}</h3>
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {finding.status === "OFFEN" ? "offen" : finding.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-600">
                      {finding.description}
                    </p>
                    <p className="mt-2 text-[11px] text-gray-400">
                      erfasst von {finding.createdByLabel} ·{" "}
                      {dateTimeFormatter.format(finding.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Review notes */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-950">Review-Notizen &amp; Vermerke</h2>
              <span className="text-[11px] text-gray-400">{dossier.notes.length} Einträge</span>
            </div>
            {dossier.notes.length === 0 ? (
              <p className="mt-3 text-[13px] text-gray-500">
                Noch keine Review-Notizen erfasst.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {dossier.notes.map((note) => (
                  <article
                    key={note.id}
                    className={`rounded-xl border p-4 ${
                      note.type === "DECISION_MEMO"
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            note.type === "DECISION_MEMO"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {note.type === "DECISION_MEMO" ? "Freigabevermerk" : "Notiz"}
                        </span>
                        {note.title ? (
                          <h3 className="text-[14px] font-semibold text-gray-900">{note.title}</h3>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {dateTimeFormatter.format(note.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
                      {note.body}
                    </p>
                    <p className="mt-2 text-[11px] text-gray-400">von {note.authorLabel}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-[15px] font-semibold text-gray-950">Verlauf &amp; Aktivitäten</h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Chronologisch aus dem Audit-Log dieses Mandanten. Neueste Einträge zuerst.
            </p>
            {dossier.activities.length === 0 ? (
              <p className="mt-4 text-[13px] text-gray-500">
                Noch keine Aktivitäten erfasst.
              </p>
            ) : (
              <ol className="mt-5 space-y-0">
                {dossier.activities.map((event, i) => (
                  <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < dossier.activities.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute left-[15px] top-8 h-full w-px bg-gray-200"
                      />
                    ) : null}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[13px]">
                      •
                    </div>
                    <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${activityCategoryTone(
                              event.category
                            )}`}
                          >
                            {event.category}
                          </span>
                          <h3 className="text-[13px] font-semibold text-gray-900">{event.title}</h3>
                        </div>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {dateTimeFormatter.format(event.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">
                        {event.context}
                      </p>
                      <p className="mt-1.5 text-[11px] text-gray-400">
                        von {event.actorLabel} ·{" "}
                        <code className="font-mono">{event.action}</code>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-[14px] font-semibold text-gray-950">Review-Kontext</h2>
            <dl className="mt-4 space-y-3 text-[12px]">
              <div>
                <dt className="font-medium text-gray-400">Review Owner</dt>
                <dd className="mt-0.5 text-gray-800">
                  {dossier.document.reviewOwnerLabel ?? "Nicht zugewiesen"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-400">Fälligkeit</dt>
                <dd className="mt-0.5 text-gray-800">
                  {dossier.document.reviewDueAt
                    ? dateFormatter.format(dossier.document.reviewDueAt)
                    : "Offen"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-400">Letzte Referenzzeit</dt>
                <dd className="mt-0.5 text-gray-800">
                  {dateTimeFormatter.format(dossier.document.updatedReferenceAt)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-400">Status</dt>
                <dd className="mt-0.5 text-gray-800">{dossier.document.status}</dd>
              </div>
            </dl>
          </section>

          {/* References extracted */}
          {dossier.references.parties.length + dossier.references.documentReferences.length + dossier.references.dates.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-[14px] font-semibold text-gray-950">Extrahierte Referenzen</h2>
              <p className="mt-1 text-[11px] text-gray-400">
                Aus der Textvorschau automatisiert erkannt.
              </p>
              {dossier.references.parties.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Parteien
                  </p>
                  <ul className="mt-1 space-y-1 text-[12px] text-gray-700">
                    {dossier.references.parties.map((p, i) => (
                      <li key={i} className="truncate">
                        · {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {dossier.references.documentReferences.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Aktenzeichen / Vertragsnr.
                  </p>
                  <ul className="mt-1 space-y-1 text-[12px] text-gray-700">
                    {dossier.references.documentReferences.map((r, i) => (
                      <li key={i} className="truncate font-mono text-[11px]">
                        · {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {dossier.references.dates.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Daten
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dossier.references.dates.map((d, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Policy context */}
          {dossier.policyContext.relevantCategories.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-[14px] font-semibold text-gray-950">Richtlinienbezug</h2>
              <div className="mt-3 space-y-3">
                {dossier.policyContext.relevantCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-gray-900">{cat.title}</p>
                      <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {cat.maturityLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                      {cat.relevanceReason}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string
  value: number | string
  tone?: "neutral" | "ok" | "warn"
}) {
  const valueColor =
    tone === "warn"
      ? "text-amber-700"
      : tone === "ok"
        ? "text-emerald-700"
        : "text-gray-900"
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className={`text-[20px] font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
    </div>
  )
}
