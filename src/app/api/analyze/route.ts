import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"
import { z } from "zod"

import { trackUsage } from "@/lib/ai/cost-tracker"
import { analyzeWithRouter } from "@/lib/ai/analyzer"
import {
  clauseExtractionPrompt,
  contractAnalysisPrompt,
  documentSummaryPrompt,
  riskAssessmentPrompt
} from "@/lib/ai/prompts"
import { auth } from "@/lib/auth"
import { writeAuditEvent } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { AnalysisType, type AnalysisResult, type DocumentMetadata } from "@/types/ai"

const requestSchema = z.object({
  documentId: z.string().min(1),
  documentText: z.string().min(1),
  analysisType: z.enum(["contract", "summary", "risk", "clause"]),
  documentLength: z.number().int().positive(),
  hasVisualElements: z.boolean().optional()
})

function buildPrompt(analysisType: AnalysisType, documentText: string): string {
  switch (analysisType) {
    case AnalysisType.CONTRACT:
      return contractAnalysisPrompt({ documentText, language: "de" })
    case AnalysisType.RISK:
      return riskAssessmentPrompt({ documentText, language: "de" })
    case AnalysisType.CLAUSE:
      return clauseExtractionPrompt({ documentText, language: "de" })
    case AnalysisType.SUMMARY:
    default:
      return documentSummaryPrompt({ documentText, language: "de" })
  }
}

function toAnalysisType(input: "contract" | "summary" | "risk" | "clause"): AnalysisType {
  return AnalysisType[input.toUpperCase() as keyof typeof AnalysisType]
}

async function resolveTenantIdForUser(userId: string): Promise<string | null> {
  const membership = await prisma.tenantMember.findFirst({
    where: { userId },
    select: { tenantId: true }
  })
  return membership?.tenantId ?? null
}

function getClientIp(request: Request): string | null {
  const xfwd = request.headers.get("x-forwarded-for")
  if (xfwd) return xfwd.split(",")[0]?.trim() ?? null
  return request.headers.get("x-real-ip")
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const rawPayload = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(rawPayload)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Anfrage", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const requestId = randomUUID()
  const actorId = session.user.id
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent")

  const tenantId = await resolveTenantIdForUser(actorId)
  if (!tenantId) {
    return NextResponse.json({ error: "Kein Mandant gefunden" }, { status: 403 })
  }

  // Ensure Document exists (minimal stub, no sensitive content stored here)
  const docId = parsed.data.documentId
  const existingDoc = await prisma.document.findUnique({
    where: { id: docId },
    select: { id: true, tenantId: true }
  })

  if (existingDoc && existingDoc.tenantId !== tenantId) {
    return NextResponse.json({ error: "Dokument gehört zu anderem Mandanten" }, { status: 403 })
  }

  if (!existingDoc) {
    await prisma.document.create({
      data: {
        id: docId,
        tenantId,
        uploadedById: actorId,
        filename: `document-${docId}`
      }
    })
  }

  const analysisType = toAnalysisType(parsed.data.analysisType)
  const metadata: DocumentMetadata = {
    documentId: docId,
    analysisType,
    documentLength: parsed.data.documentLength,
    hasVisualElements: parsed.data.hasVisualElements
  }

  // Audit: requested
  try {
    await writeAuditEvent({
      tenantId,
      actorId,
      action: "analysis.requested",
      resourceType: "document",
      resourceId: docId,
      documentId: docId,
      requestId,
      ip,
      userAgent,
      metadata: {
        analysisType: parsed.data.analysisType,
        documentLength: parsed.data.documentLength,
        hasVisualElements: parsed.data.hasVisualElements ?? false
      }
    })
  } catch (error) {
    console.error("[AUDIT] analysis.requested failed", error)
  }

  const prompt = buildPrompt(analysisType, parsed.data.documentText)

  try {
    const result: AnalysisResult = await analyzeWithRouter(metadata, prompt, parsed.data.documentText)

    trackUsage({ userId: actorId, model: result.modelUsed, tokensUsed: result.tokensUsed })

    const analysisLog = await prisma.analysisLog.create({
      data: {
        tenantId,
        userId: actorId,
        documentId: docId,
        modelUsed: result.modelUsed,
        tokensUsed: result.tokensUsed,
        cost: result.costEstimate,
        duration: result.processingTime
      }
    })

    // Audit: completed
    try {
      await writeAuditEvent({
        tenantId,
        actorId,
        action: "analysis.completed",
        resourceType: "analysisLog",
        resourceId: analysisLog.id,
        documentId: docId,
        analysisLogId: analysisLog.id,
        requestId,
        ip,
        userAgent,
        metadata: {
          modelUsed: result.modelUsed,
          tokensUsed: result.tokensUsed,
          cost: result.costEstimate,
          duration: result.processingTime
        }
      })
    } catch (error) {
      console.error("[AUDIT] analysis.completed failed", error)
    }

    return NextResponse.json(result, { headers: { "x-request-id": requestId } })
  } catch (error) {
    // Audit: failed (best-effort)
    try {
      await writeAuditEvent({
        tenantId,
        actorId,
        action: "analysis.failed",
        resourceType: "document",
        resourceId: docId,
        documentId: docId,
        requestId,
        ip,
        userAgent,
        metadata: {
          message: error instanceof Error ? error.message : "unknown_error"
        }
      })
    } catch (auditError) {
      console.error("[AUDIT] analysis.failed failed", auditError)
    }

    console.error("[AI] Analyse fehlgeschlagen.", error)
    return NextResponse.json(
      { error: "Analyse aktuell nicht verfügbar. Bitte erneut versuchen." },
      { status: 503, headers: { "x-request-id": requestId } }
    )
  }
}
