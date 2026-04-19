import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import {
  getDocumentProcessingStatusLabel,
  getDocumentProcessingStatusTone,
  getWorkspaceDocumentStatusLabel,
  getWorkspaceDocumentStatusTone,
  listWorkspaceDocuments,
  type WorkspaceDocumentItem,
  type WorkspaceDocumentStatusTone
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

const toneClass: Record<WorkspaceDocumentStatusTone, string> = {
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  neutral: "bg-gray-100 text-gray-600",
  risk: "bg-rose-100 text-rose-700"
}

export default async function DokumentePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?next=/workspace/dokumente")
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
    console.error("[workspace.dokumente.list_failed]", {
      tenantId: tenantContext.tenantId,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
    })
    loadError = "Die Dokumentenliste konnte nicht geladen werden. Bitte versuchen Sie es erneut."
  }

  const totalCount = documents.length
  const inReview = documents.filter((d) => d.status === "IN_PRUEFUNG").length
  const released = documents.filter((d) => d.status === "FREIGEGEBEN").length
  const pendingProcessing = documents.filter((d) => d.processingStatus === "AUSSTEHEND").length

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📂 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Dokumenten-Workspace</h1>
          <p className="mt-1 text-[14px] text-gray-500">
            {totalCount === 0
              ? "Noch keine Dokumente. Legen Sie den ersten Eingang an."
              : `${totalCount} ${totalCount === 1 ? "Dokument" : "Dokumente"} · Mandantengetrennt · Tenant ${tenantContext.tenantId.slice(0, 8)}…`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/workspace/upload"
            className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
          >
            📤 Hochladen
          </Link>
          <Link
            href="/workspace/analyse"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            ⚡ Analyse
          </Link>
        </div>
      </header>

      {loadError ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {loadError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <StatCard value={totalCount} label="Gesamt" tone="neutral" />
        <StatCard value={inReview} label="In Prüfung" tone="info" />
        <StatCard value={released} label="Freigegeben" tone="success" />
        <StatCard value={pendingProcessing} label="Verarbeitung offen" tone="warning" />
      </div>

      {documents.length === 0 && !loadError ? (
        <EmptyDocumentState />
      ) : (
        <>
          <div className="mt-8 hidden rounded-t-xl border border-b-0 border-gray-200 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1.6fr_1fr_1fr_1fr_140px]">
            <span>Dokument</span>
            <span>Typ</span>
            <span>Mandant</span>
            <span>Eingang</span>
            <span>Status</span>
          </div>

          <div className="overflow-hidden rounded-b-xl border border-gray-200 sm:rounded-t-none">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/workspace/dokumente/${doc.id}`}
                className="grid border-b border-gray-100 bg-white px-5 py-4 last:border-b-0 transition-colors hover:bg-gold-50/30 sm:grid-cols-[1.6fr_1fr_1fr_1fr_140px] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-gray-900">{doc.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {doc.id.slice(0, 8)}… · von {doc.uploadedByLabel}
                  </p>
                </div>
                <span className="mt-1 truncate text-[12px] text-gray-500 sm:mt-0">{doc.documentType}</span>
                <span className="mt-1 truncate text-[12px] text-gray-600 sm:mt-0">{doc.organizationName}</span>
                <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{dateFormatter.format(doc.createdAt)}</span>
                <div className="mt-2 flex flex-col items-start gap-1 sm:mt-0">
                  <span
                    className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass[getWorkspaceDocumentStatusTone(doc.status)]}`}
                  >
                    {getWorkspaceDocumentStatusLabel(doc.status)}
                  </span>
                  <span
                    className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClass[getDocumentProcessingStatusTone(doc.processingStatus)]}`}
                  >
                    {getDocumentProcessingStatusLabel(doc.processingStatus)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ value, label, tone }: { value: number; label: string; tone: WorkspaceDocumentStatusTone }) {
  const valueColor =
    tone === "success" ? "text-emerald-600" : tone === "info" ? "text-blue-600" : tone === "warning" ? "text-amber-600" : "text-gray-900"
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
      <p className={`text-[18px] font-semibold ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  )
}

function EmptyDocumentState() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <span className="text-[40px]">📄</span>
      <h2 className="mt-4 text-[18px] font-semibold text-gray-900">Noch keine Dokumente erfasst</h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
        Legen Sie den ersten Dokumenteingang an. Verträge können mit oder ohne Eingangsdatei dokumentiert
        werden — die Datei kann auch nachträglich angehängt werden.
      </p>
      <Link
        href="/workspace/upload"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]"
      >
        📤 Ersten Dokumenteingang anlegen
      </Link>
    </div>
  )
}

function EmptyTenantState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <span className="text-[36px]">🔒</span>
      <h1 className="mt-4 text-[20px] font-semibold text-gray-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">{description}</p>
    </div>
  )
}
