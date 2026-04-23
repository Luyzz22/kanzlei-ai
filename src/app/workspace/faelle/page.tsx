import Link from "next/link"
import { redirect } from "next/navigation"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import {
  listWorkspaceDocuments,
  type WorkspaceDocumentItem
} from "@/lib/documents/workspace-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
})

type FallStatus = "OFFEN" | "IN_PRUEFUNG" | "ABGESCHLOSSEN"

type Fall = {
  /** Stable slug-free identifier: organizationName direkt als Key (tenant-scoped eindeutig) */
  key: string
  /** Anzeigename (= organizationName) */
  name: string
  /** Aggregierter Status über die zugehörigen Dokumente */
  status: FallStatus
  /** Anzahl aller Dokumente in diesem Fall */
  contractsCount: number
  /** Anteil noch nicht freigegebener Dokumente (EINGEGANGEN + IN_PRUEFUNG) */
  openCount: number
  /** Anzahl freigegebener Dokumente */
  releasedCount: number
  /** Archivierte Dokumente */
  archivedCount: number
  /** Jüngstes Dokument in diesem Fall */
  latestCreatedAt: Date
  /** Haupt-Dokumenttyp (häufigster) */
  primaryDocumentType: string
  /** Eindeutige Bearbeiter-Anzahl */
  uniqueUploadersCount: number
}

function aggregateDocumentsToFaelle(documents: WorkspaceDocumentItem[]): Fall[] {
  const byOrg = new Map<string, WorkspaceDocumentItem[]>()
  for (const doc of documents) {
    const key = doc.organizationName?.trim() || "Nicht zugeordnet"
    const bucket = byOrg.get(key)
    if (bucket) {
      bucket.push(doc)
    } else {
      byOrg.set(key, [doc])
    }
  }

  const faelle: Fall[] = []
  for (const [orgName, docs] of byOrg.entries()) {
    const contractsCount = docs.length
    const releasedCount = docs.filter((d) => d.status === "FREIGEGEBEN").length
    const archivedCount = docs.filter((d) => d.status === "ARCHIVIERT").length
    const inReviewCount = docs.filter((d) => d.status === "IN_PRUEFUNG").length
    const eingangCount = docs.filter((d) => d.status === "EINGEGANGEN").length
    const openCount = inReviewCount + eingangCount

    // Aggregierter Status:
    // - ABGESCHLOSSEN: alle Dokumente sind FREIGEGEBEN oder ARCHIVIERT
    // - IN_PRUEFUNG:   mindestens ein Dokument ist IN_PRUEFUNG
    // - OFFEN:         sonst (nur EINGEGANGEN, oder Mix ohne aktive Prüfung)
    let status: FallStatus
    if (releasedCount + archivedCount === contractsCount) {
      status = "ABGESCHLOSSEN"
    } else if (inReviewCount > 0) {
      status = "IN_PRUEFUNG"
    } else {
      status = "OFFEN"
    }

    // Primärer Dokumenttyp = häufigster
    const typeCounts = new Map<string, number>()
    for (const d of docs) {
      typeCounts.set(d.documentType, (typeCounts.get(d.documentType) ?? 0) + 1)
    }
    const primaryDocumentType =
      Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sonstiges"

    // Eindeutige Uploader
    const uploaders = new Set(docs.map((d) => d.uploadedByLabel))

    // Jüngstes Dokument
    const latestCreatedAt = docs.reduce(
      (acc, d) => (d.createdAt > acc ? d.createdAt : acc),
      docs[0]!.createdAt
    )

    faelle.push({
      key: orgName,
      name: orgName,
      status,
      contractsCount,
      openCount,
      releasedCount,
      archivedCount,
      latestCreatedAt,
      primaryDocumentType,
      uniqueUploadersCount: uploaders.size
    })
  }

  // Neueste Fälle zuerst
  faelle.sort((a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime())
  return faelle
}

function statusLabel(status: FallStatus): string {
  if (status === "ABGESCHLOSSEN") return "Abgeschlossen"
  if (status === "IN_PRUEFUNG") return "In Prüfung"
  return "Offen"
}

function statusTone(status: FallStatus): string {
  if (status === "ABGESCHLOSSEN") return "bg-emerald-100 text-emerald-700"
  if (status === "IN_PRUEFUNG") return "bg-blue-100 text-blue-700"
  return "bg-amber-100 text-amber-700"
}

export default async function FaellePage({
  searchParams
}: {
  searchParams?: { filter?: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?next=/workspace/faelle")
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return (
      <EmptyTenantState
        title="Kein Mandantenkontext hinterlegt"
        description="Für Ihr Konto ist aktuell kein Mandantenkontext zugeordnet. Bitte wenden Sie sich an Ihren Administrator."
      />
    )
  }

  if (tenantContext.status === "multiple") {
    return (
      <EmptyTenantState
        title="Mehrere Mandanten verfügbar"
        description="Ihr Konto ist mehreren Mandanten zugeordnet. Eine Mandantenauswahl ist in der nächsten Iteration verfügbar."
      />
    )
  }

  let documents: WorkspaceDocumentItem[] = []
  let loadError: string | null = null

  try {
    documents = await listWorkspaceDocuments(tenantContext.tenantId)
  } catch (error) {
    console.error("[workspace.faelle.list_failed]", {
      tenantId: tenantContext.tenantId,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
    })
    loadError = "Die Fallübersicht konnte nicht geladen werden. Bitte versuchen Sie es erneut."
  }

  const faelle = aggregateDocumentsToFaelle(documents)

  const filter = searchParams?.filter
  const filteredFaelle =
    filter === "offen"
      ? faelle.filter((f) => f.status === "OFFEN")
      : filter === "in_pruefung"
        ? faelle.filter((f) => f.status === "IN_PRUEFUNG")
        : filter === "abgeschlossen"
          ? faelle.filter((f) => f.status === "ABGESCHLOSSEN")
          : faelle

  const totalFaelle = faelle.length
  const offenCount = faelle.filter((f) => f.status === "OFFEN").length
  const inPruefungCount = faelle.filter((f) => f.status === "IN_PRUEFUNG").length
  const abgeschlossenCount = faelle.filter((f) => f.status === "ABGESCHLOSSEN").length

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
            📁 Workspace
          </p>
          <h1 className="mt-2 text-[1.875rem] font-semibold tracking-tight text-gray-950">
            Fälle &amp; Mandate
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">
            Verträge mandatsbezogen gruppiert nach Organisation. Aggregation erfolgt aus echten
            Dokumentdaten dieses Mandanten.
          </p>
        </div>
        <Link
          href="/workspace/upload"
          className="self-start rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
        >
          + Dokument hinzufügen
        </Link>
      </div>

      {loadError ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-[14px] font-semibold text-rose-900">{loadError}</p>
        </div>
      ) : null}

      {/* KPIs */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[22px] font-semibold text-gray-900">{totalFaelle}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">Fälle gesamt</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[22px] font-semibold text-amber-700">{offenCount}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">Offen</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[22px] font-semibold text-blue-700">{inPruefungCount}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">In Prüfung</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[22px] font-semibold text-emerald-700">{abgeschlossenCount}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">Abgeschlossen</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "alle", label: "Alle", href: "/workspace/faelle" },
          { key: "offen", label: "Offen", href: "/workspace/faelle?filter=offen" },
          { key: "in_pruefung", label: "In Prüfung", href: "/workspace/faelle?filter=in_pruefung" },
          {
            key: "abgeschlossen",
            label: "Abgeschlossen",
            href: "/workspace/faelle?filter=abgeschlossen"
          }
        ].map((f) => {
          const active = (filter ?? "alle") === f.key
          return (
            <Link
              key={f.key}
              href={f.href}
              className={`rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${
                active
                  ? "bg-[#003856] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {!loadError && totalFaelle === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="text-[36px]">📂</span>
          <h2 className="mt-4 text-[16px] font-semibold text-gray-950">
            Noch keine Fälle vorhanden
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-gray-500">
            Fälle werden automatisch aus Ihren Dokumenten gebildet — gruppiert nach Organisation.
            Laden Sie ein erstes Dokument hoch, um den ersten Fall anzulegen.
          </p>
          <Link
            href="/workspace/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            Dokument hochladen
          </Link>
        </div>
      ) : null}

      {/* Faelle list */}
      {filteredFaelle.length > 0 ? (
        <>
          <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:grid sm:grid-cols-[1fr_120px_120px_120px_120px]">
            <span>Fall</span>
            <span>Status</span>
            <span>Verträge</span>
            <span>Haupttyp</span>
            <span>Letzte Aktivität</span>
          </div>
          <div className="overflow-hidden rounded-b-xl border border-gray-200">
            {filteredFaelle.map((fall) => (
              <Link
                key={fall.key}
                href={`/workspace/dokumente?organization=${encodeURIComponent(fall.key)}`}
                className="grid border-b border-gray-100 bg-white px-5 py-4 transition-colors last:border-b-0 hover:bg-gold-50/30 sm:grid-cols-[1fr_120px_120px_120px_120px] sm:items-center"
              >
                <div>
                  <p className="text-[14px] font-medium text-gray-900">{fall.name}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {fall.uniqueUploadersCount} Bearbeiter ·{" "}
                    {fall.openCount > 0 ? `${fall.openCount} offen` : "keine offenen"} ·{" "}
                    {fall.releasedCount} freigegeben
                  </p>
                </div>
                <span
                  className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-0 ${statusTone(
                    fall.status
                  )}`}
                >
                  {statusLabel(fall.status)}
                </span>
                <span className="mt-1 text-[13px] text-gray-700 sm:mt-0">
                  {fall.contractsCount}
                </span>
                <span className="mt-1 truncate text-[12px] text-gray-600 sm:mt-0">
                  {fall.primaryDocumentType}
                </span>
                <span className="mt-1 text-[12px] text-gray-500 sm:mt-0">
                  {dateFormatter.format(fall.latestCreatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : !loadError && totalFaelle > 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-[13px] text-gray-500">
          Keine Fälle für diesen Filter.
        </p>
      ) : null}

      {/* Footnote */}
      <p className="mt-6 text-[11px] leading-relaxed text-gray-400">
        Fälle werden aktuell automatisch aus dem Feld <code className="font-mono">organizationName</code>{" "}
        der Dokumente abgeleitet. Eine eigenständige Fallverwaltung mit Mandantenakten, Matter-Nummern
        und Honorarpositionen folgt in einer späteren Iteration.
      </p>
    </div>
  )
}

function EmptyTenantState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <span className="text-[36px]">🏛️</span>
      <h1 className="mt-4 text-[20px] font-semibold text-gray-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">{description}</p>
    </div>
  )
}
