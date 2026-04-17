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
      // PDF parsing can fail on cold start. Try twice with dynamic import each time.
      let lastError: Error | null = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer())
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = (await import("pdf-parse")).default
          const data = await pdfParse(buffer)
          documentText = data.text
          lastError = null
          break
        } catch (e) {
          lastError = e instanceof Error ? e : new Error("PDF parse failed")
          if (attempt === 1) {
            await new Promise(r => setTimeout(r, 200))
          }
        }
      }
      if (lastError) {
        return NextResponse.json(
          { error: "PDF konnte nicht gelesen werden. Bitte versuchen Sie es erneut oder geben Sie den Text direkt ein.", details: lastError.message },
          { status: 422 }
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

  const contractType = formData.get("contractType") as string | null

  const metadata: DocumentMetadata = {
    documentId: `quick-${Date.now()}`,
    analysisType: AnalysisType.CONTRACT,
    documentLength: documentText.length,
    hasVisualElements: false
  }

  const contextHint = contractType ? `\n\nHinweis: Der Nutzer hat angegeben, dass es sich um einen "${contractType}" handelt. Berücksichtige dies bei der Analyse und den spezifischen Prüfkriterien.\n` : ""
  const prompt = contractAnalysisPrompt({ documentText: documentText + contextHint, language: "auto" })

  try {
    const result = await analyzeWithRouter(metadata, prompt, documentText)

    // Fire webhook for high-risk analyses (non-blocking)
    try {
      const parsed = typeof result.analysis === "string" ? JSON.parse(result.analysis) : result.analysis
      if (parsed.riskScore && parsed.riskScore >= 70 && process.env.WEBHOOK_SECRET) {
        fetch(new URL("/api/webhooks", "https://www.kanzlei-ai.com").toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": process.env.WEBHOOK_SECRET },
          body: JSON.stringify({
            type: "analysis.high_risk",
            data: { riskScore: parsed.riskScore, product: documentText.slice(0, 100), model: result.modelUsed, findingsCount: parsed.findings?.length ?? 0 }
          })
        }).catch(() => {})
      }
    } catch {}

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
