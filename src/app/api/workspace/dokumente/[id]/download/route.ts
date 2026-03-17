import { Readable } from "node:stream"

import { NextResponse } from "next/server"

import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { writeAuditEventTx } from "@/lib/audit-write"
import { auth } from "@/lib/auth"
import { getDocumentFileAccessContext } from "@/lib/documents/file-access-core"
import { createStoredDocumentReadStream } from "@/lib/storage/document-storage"
import { withTenant } from "@/lib/tenant-context.server"

type DownloadRouteContext = {
  params: {
    id: string
  }
}

function sanitizeDownloadFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKC")
    .replace(/[\r\n\0]/g, "")
    .replace(/[\\/]/g, "-")
    .trim()

  return normalized.length > 0 ? normalized : "dokument"
}

function getClientIp(request: Request): string | null {
  const xfwd = request.headers.get("x-forwarded-for")
  if (xfwd) return xfwd.split(",")[0]?.trim() ?? null
  return request.headers.get("x-real-ip")
}

export async function GET(request: Request, context: DownloadRouteContext): Promise<Response> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return NextResponse.json({ error: "Kein Mandantenkontext verfügbar" }, { status: 403 })
  }

  if (tenantContext.status === "multiple") {
    return NextResponse.json({ error: "Mandantenkontext nicht eindeutig" }, { status: 409 })
  }

  const accessContext = await getDocumentFileAccessContext(tenantContext.tenantId, context.params.id)

  if (!accessContext) {
    return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 })
  }

  if (!accessContext.storageKey || !accessContext.fileAvailable) {
    return NextResponse.json({ error: "Dateiablage nicht verfügbar" }, { status: 404 })
  }

  const filename = sanitizeDownloadFilename(accessContext.filename)

  await withTenant(tenantContext.tenantId, async (tx) => {
    await writeAuditEventTx(tx, {
      tenantId: tenantContext.tenantId,
      actorId: session.user.id,
      action: "document.file.downloaded",
      resourceType: "document",
      resourceId: accessContext.documentId,
      documentId: accessContext.documentId,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        filename,
        mimeType: accessContext.mimeType,
        accessMode: "download"
      }
    })
  })

  try {
    const fileStream = createStoredDocumentReadStream(accessContext.storageKey)
    const headers = new Headers({
      "content-type": accessContext.mimeType ?? "application/octet-stream",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store, max-age=0"
    })

    if (accessContext.sizeBytes && accessContext.sizeBytes > 0) {
      headers.set("content-length", String(accessContext.sizeBytes))
    }

    return new Response(Readable.toWeb(fileStream) as ReadableStream, {
      status: 200,
      headers
    })
  } catch {
    return NextResponse.json({ error: "Datei konnte nicht bereitgestellt werden" }, { status: 404 })
  }
}
