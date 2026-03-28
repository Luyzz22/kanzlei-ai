export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { analyzeWithRouter } from "@/lib/ai/analyzer"
import { contractAnalysisPrompt } from "@/lib/ai/prompts"
import { AnalysisType, type DocumentMetadata } from "@/types/ai"

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const textDirect = formData.get("text") as string | null

  let documentText = ""

  if (textDirect && textDirect.trim().length > 0) {
    documentText = textDirect.trim()
  } else if (file) {
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      documentText = await file.text()
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdfParse = (await import("pdf-parse")).default
        const data = await pdfParse(buffer)
        documentText = data.text
      } catch (e) {
        return NextResponse.json(
          { error: "PDF konnte nicht gelesen werden.", details: e instanceof Error ? e.message : "unknown" },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Nur PDF und TXT werden unterstützt." },
        { status: 400 }
      )
    }
  } else {
    return NextResponse.json(
      { error: "Bitte eine Datei hochladen oder Text eingeben." },
      { status: 400 }
    )
  }

  if (documentText.length < 50) {
    return NextResponse.json(
      { error: "Der Text ist zu kurz für eine sinnvolle Analyse (mindestens 50 Zeichen)." },
      { status: 400 }
    )
  }

  if (documentText.length > 120000) {
    documentText = documentText.slice(0, 120000)
  }

  const metadata: DocumentMetadata = {
    documentId: `quick-${Date.now()}`,
    analysisType: AnalysisType.CONTRACT,
    documentLength: documentText.length,
    hasVisualElements: false
  }

  const prompt = contractAnalysisPrompt({ documentText, language: "de" })

  try {
    const result = await analyzeWithRouter(metadata, prompt, documentText)

    return NextResponse.json({
      status: "success",
      analysis: result.analysis,
      modelUsed: result.modelUsed,
      tokensUsed: result.tokensUsed,
      processingTime: result.processingTime,
      textLength: documentText.length,
      textPreview: documentText.slice(0, 500)
    })
  } catch (error) {
    console.error("[QUICK-ANALYZE] Error:", error)
    return NextResponse.json(
      { error: "Analyse fehlgeschlagen. Bitte erneut versuchen.", details: error instanceof Error ? error.message : "unknown" },
      { status: 503 }
    )
  }
}
