export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { getWorkspaceDocumentById } from "@/lib/documents/workspace-core"
import { runPersistedContractAnalysis } from "@/lib/documents/analysis-run-core"

/**
 * Dedizierte API-Route für die Vertragsanalyse-Pipeline.
 * maxDuration: 300s (Vercel Pro) — Server Actions können kein maxDuration setzen.
 *
 * POST /api/workspace/run-analysis
 * Body: { documentId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ status: "error", message: "Nicht autorisiert." }, { status: 401 })
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)
  if (tenantContext.status !== "single") {
    return NextResponse.json({ status: "error", message: "Kein eindeutiger Mandantenkontext." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const documentId = body?.documentId
  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ status: "error", message: "documentId ist Pflicht." }, { status: 400 })
  }

  const doc = await getWorkspaceDocumentById(tenantContext.tenantId, documentId)
  if (!doc) {
    return NextResponse.json({ status: "error", message: "Dokument nicht gefunden." }, { status: 404 })
  }

  if (doc.processingStatus !== "VERARBEITET") {
    return NextResponse.json({
      status: "error",
      message: "Die KI-Analyse setzt eine abgeschlossene Textextraktion voraus."
    }, { status: 400 })
  }

  const text = doc.extractedTextPreview?.trim() ?? ""
  if (!text) {
    return NextResponse.json({ status: "error", message: "Keine Textgrundlage verfügbar." }, { status: 400 })
  }

  try {
    const result = await runPersistedContractAnalysis({
      tenantId: tenantContext.tenantId,
      documentId,
      actorId: session.user.id,
      documentText: text,
      documentSha256: doc.sha256
    })

    if (!result.ok) {
      return NextResponse.json({ status: "error", message: result.message ?? "Analyse fehlgeschlagen.", code: result.code })
    }

    return NextResponse.json({
      status: "success",
      message: "KI-Vertragsanalyse abgeschlossen.",
      runId: result.runId
    })
  } catch (e) {
    return NextResponse.json({
      status: "error",
      message: e instanceof Error ? e.message : "Interner Fehler"
    }, { status: 500 })
  }
}
