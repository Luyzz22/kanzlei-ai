import { randomUUID } from "node:crypto"

import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { trackUsage } from "@/lib/ai/cost-tracker"
import { analyzeWithRouter } from "@/lib/ai/analyzer"
import {
  clauseExtractionPrompt,
  contractAnalysisPrompt,
  documentSummaryPrompt,
  riskAssessmentPrompt
} from "@/lib/ai/prompts"
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

  const analysisType = toAnalysisType(parsed.data.analysisType)
  const metadata: DocumentMetadata = {
    documentId: parsed.data.documentId,
    analysisType,
    documentLength: parsed.data.documentLength,
    hasVisualElements: parsed.data.hasVisualElements
  }

  const prompt = buildPrompt(analysisType, parsed.data.documentText)

  try {
    const result: AnalysisResult = await analyzeWithRouter(metadata, prompt, parsed.data.documentText)

    trackUsage({ userId: session.user.id, model: result.modelUsed, tokensUsed: result.tokensUsed })

    try {
      await prisma.$executeRaw(
        Prisma.sql`INSERT INTO "AnalysisLog" ("id", "userId", "modelUsed", "tokensUsed", "cost", "duration", "createdAt")
      VALUES (${randomUUID()}, ${session.user.id}, ${result.modelUsed}, ${result.tokensUsed}, ${result.costEstimate}, ${result.processingTime}, NOW())`
      )
    } catch (error) {
      console.error("[AI] AnalysisLog konnte nicht gespeichert werden.", error)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[AI] Analyse fehlgeschlagen.", error)
    return NextResponse.json(
      { error: "Analyse aktuell nicht verfügbar. Bitte erneut versuchen." },
      { status: 503 }
    )
  }
}
