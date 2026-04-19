import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { ProcessingTriggerForm } from "@/app/workspace/dokumente/[id]/processing-trigger-form"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import {
  getDocumentProcessingStatusLabel,
  getDocumentProcessingStatusTone,
  getWorkspaceDocumentById,
  getWorkspaceDocumentStatusLabel,
  getWorkspaceDocumentStatusTone,
  type WorkspaceDocumentStatusTone
} from "@/lib/documents/workspace-core"

export const dynamic = "force-dynamic"
export const revalidate = 0

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
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

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—"
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default async function DokumentDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?next=/workspace/dokumente/${params.id}`)
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">🔒</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Für den Zugriff auf Dokumentdetails ist ein eindeutiger Mandantenkontext erforderlich.
        </p>
      </div>
    )
  }

  let document: Awaited<ReturnType<typeof getWorkspaceDocumentById>>
  try {
    document = await getWorkspaceDocumentById(tenantContext.tenantId, params.id)
  } catch (error) {
    console.error("[workspace.dokumente.detail_failed]", {
      tenantId: tenantContext.tenantId,
      documentId: params.id,
      userId: session.user.id,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
    })
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span className="text-[36px]">⚠️</span>
        <h1 className="mt-4 text-[20px] font-semibold text-gray-950">Dokument konnte nicht geladen werden</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
          Bitte versuchen Sie es erneut oder kehren Sie zur Dokumentenliste zurück.
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

  if (!document) {
    notFound()
  }

  const hasFile = Boolean(document.storageKey)
  const statusTone = getWorkspaceDocumentStatusTone(document.status)
  const processingTone = getDocumentProcessingStatusTone(document.processingStatus)

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/workspace/dokumente" className="text-[13px] text-gray-400 hover:text-gray-600">
              ← Dokumente
            </Link>
            <span className="text-gray-300">/</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-500">
              {document.id.slice(0, 8)}…
            </span>
          </div>
          <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-950">{document.title}</h1>
          <p className="mt-1 text-[14px] text-gray-500">
            {document.documentType} · {document.organizationName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspace/dokumente/${document.id}/dossier`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
          >
            📁 Dossier
          </Link>
          <Link
            href={`/workspace/dokumente/${document.id}/evidence`}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
          >
            🔍 Nachweise
          </Link>
          <Link
            href={`/workspace/analyse?documentId=${document.id}`}
            className="rounded-full bg-[#003856] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#002a42]"
          >
            ⚡ Analysieren
          </Link>
        </div>
      </header>

      {/* Status Bar */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <StatusCard
          label="Status"
          badge={getWorkspaceDocumentStatusLabel(document.status)}
          tone={statusTone}
        />
        <StatusCard
          label="Verarbeitung"
          badge={getDocumentProcessingStatusLabel(document.processingStatus)}
          tone={processingTone}
        />
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">Eingang</p>
          <p className="mt-1 text-[13px] font-medium text-gray-700">{dateTimeFormatter.format(document.createdAt)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[11px] font-medium text-gray-400">Eingangsdatei</p>
          <p className="mt-1 text-[13px] font-medium text-gray-700">
            {hasFile ? formatBytes(document.sizeBytes) : "Nicht angehängt"}
          </p>
        </div>
      </div>

      {/* Two-column content */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[14px] font-semibold text-gray-900">📄 Eingangsdaten</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Dokumenttitel" value={document.title} />
              <InfoRow label="Dokumenttyp" value={document.documentType} />
              <InfoRow label="Organisation / Mandant" value={document.organizationName} />
              <InfoRow label="Hochgeladen von" value={document.uploadedByLabel} />
            </div>
            {document.description ? (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Kontext / Beschreibung</p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
                  {document.description}
                </p>
              </div>
            ) : null}
          </section>

          {hasFile ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="text-[14px] font-semibold text-gray-900">💾 Eingangsdatei</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoRow label="Dateiname" value={document.filename} mono />
                <InfoRow label="MIME-Typ" value={document.mimeType ?? "—"} mono />
                <InfoRow label="Größe" value={formatBytes(document.sizeBytes)} />
                <InfoRow
                  label="SHA-256"
                  value={document.sha256 ? `${document.sha256.slice(0, 16)}…` : "—"}
                  mono
                  title={document.sha256 ?? undefined}
                />
              </div>

              {document.processingStatus === "AUSSTEHEND" ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[18px]">⏳</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-amber-800">Verarbeitung ausstehend</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-amber-700">
                        Die Textextraktion der Eingangsdatei ist noch nicht gestartet.
                      </p>
                      <div className="mt-3">
                        <ProcessingTriggerForm documentId={document.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {document.processingStatus === "FEHLGESCHLAGEN" ? (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[13px] font-medium text-rose-800">❌ Verarbeitung fehlgeschlagen</p>
                  {document.processingError ? (
                    <p className="mt-1 text-[12px] leading-relaxed text-rose-700">
                      {document.processingError}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <ProcessingTriggerForm documentId={document.id} />
                  </div>
                </div>
              ) : null}

              {document.processingStatus === "VERARBEITET" && document.processedAt ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[13px] font-medium text-emerald-800">✓ Textextraktion abgeschlossen</p>
                  <p className="mt-1 text-[12px] text-emerald-700">
                    Verarbeitet am {dateTimeFormatter.format(document.processedAt)}
                  </p>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
              <span className="text-[32px]">📎</span>
              <h2 className="mt-2 text-[15px] font-semibold text-gray-900">Keine Eingangsdatei angehängt</h2>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-gray-500">
                Dieser Dokumenteingang wurde ohne Datei erfasst. Eine Datei kann nachträglich
                beim Upload angehängt werden.
              </p>
            </section>
          )}

          {document.extractedTextPreview ? (
            <section className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-gray-900">📝 Extrahierte Textvorschau</h2>
                {document.textExtractedAt ? (
                  <span className="text-[11px] text-gray-400">
                    {dateTimeFormatter.format(document.textExtractedAt)}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-gray-700">
                  {document.extractedTextPreview}
                </p>
              </div>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[14px] font-semibold text-gray-900">⚡ Schnellaktionen</h2>
            <div className="mt-4 space-y-2">
              <Link
                href={`/workspace/analyse?documentId=${document.id}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gold-50"
              >
                🧠 Vertrag analysieren
              </Link>
              <Link
                href={`/workspace/copilot?documentId=${document.id}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gold-50"
              >
                🤖 Im Copilot besprechen
              </Link>
              <Link
                href={`/workspace/vergleich?documentId=${document.id}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gold-50"
              >
                ⚖️ Mit AGB vergleichen
              </Link>
              {hasFile ? (
                <a
                  href={`/api/workspace/dokumente/${document.id}/download`}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gold-50"
                >
                  ⬇️ Original herunterladen
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-[14px] font-semibold text-gray-900">🔗 Referenzen</h2>
            <dl className="mt-4 space-y-3 text-[12px]">
              <div>
                <dt className="font-medium text-gray-400">Dokument-ID</dt>
                <dd className="mt-0.5 break-all font-mono text-gray-700">{document.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-400">Mandant-ID</dt>
                <dd className="mt-0.5 break-all font-mono text-gray-700">{tenantContext.tenantId}</dd>
              </div>
              {document.storageKey ? (
                <div>
                  <dt className="font-medium text-gray-400">Storage-Key</dt>
                  <dd className="mt-0.5 break-all font-mono text-gray-700">{document.storageKey}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium text-gray-400">Erstellt</dt>
                <dd className="mt-0.5 text-gray-700">{dateTimeFormatter.format(document.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}

function StatusCard({
  label,
  badge,
  tone
}: {
  label: string
  badge: string
  tone: WorkspaceDocumentStatusTone
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
      <p className="text-[11px] font-medium text-gray-400">{label}</p>
      <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${toneClass[tone]}`}>
        {badge}
      </span>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
  title
}: {
  label: string
  value: string
  mono?: boolean
  title?: string
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</dt>
      <dd
        className={`mt-1 text-[13px] text-gray-900 ${mono ? "font-mono" : ""}`}
        title={title}
      >
        {value}
      </dd>
    </div>
  )
}
