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
import { prisma } from "@/lib/prisma"
import { AnalysisType, type AnalysisResult, type DocumentMetadata } from "@/types/ai"
import { withTenant } from "@/lib/tenant-context"

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

  // tenant lookup happens before RLS tx, because the lookup itself is tenant-bound
  // In production you'll typically resolve tenant from subdomain / org context.
  const tenantId = await resolveTenantIdForUser(actorId)
  if (!tenantId) {
    return NextResponse.json({ error: "Kein Mandant gefunden" }, { status: 403 })
  }

  const docId = parsed.data.documentId
  const analysisType = toAnalysisType(parsed.data.analysisType)
  const metadata: DocumentMetadata = {
    documentId: docId,
    analysisType,
    documentLength: parsed.data.documentLength,
    hasVisualElements: parsed.data.hasVisualElements
  }

  const prompt = buildPrompt(analysisType, parsed.data.documentText)

  try {
    const result: AnalysisResult = await analyzeWithRouter(metadata, prompt, parsed.data.documentText)

    trackUsage({ userId: actorId, model: result.modelUsed, tokensUsed: result.tokensUsed })

    // All tenant-bound DB writes under RLS context
    await withTenant(tenantId, async (tx) => {
      // Ensure document exists (stub only)
      const existingDoc = await tx.document.findUnique({
        where: { id: docId },
        select: { id: true, tenantId: true }
      })

      if (existingDoc && existingDoc.tenantId !== tenantId) {
        throw new Error("Dokument gehört zu anderem Mandanten")
      }

      if (!existingDoc) {
        await tx.document.create({
          data: {
            id: docId,
            tenantId,
            uploadedById: actorId,
            filename: `document-${docId}`
          }
        })
      }

      // Audit requested
      await tx.auditEvent.create({
        data: {
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
        }
      })

      const analysisLog = await tx.analysisLog.create({
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

      // Audit completed
      await tx.auditEvent.create({
        data: {
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
        }
      })
    })

    return NextResponse.json(result, { headers: { "x-request-id": requestId } })
  } catch (error) {
    // best-effort failed audit (try, but don't override original failure)
    try {
      await withTenant(tenantId, async (tx) => {
        await tx.auditEvent.create({
          data: {
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
          }
        })
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
