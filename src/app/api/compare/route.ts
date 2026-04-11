export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { analyzeWithRouter } from "@/lib/ai/analyzer"
import { AnalysisType, type DocumentMetadata } from "@/types/ai"

const comparisonSchema = JSON.stringify({
  type: "object",
  properties: {
    summary: { type: "string", description: "Zusammenfassung des Vergleichs in 2-3 Saetzen" },
    overallRisk: { type: "number", minimum: 0, maximum: 100, description: "Gesamtrisiko der Abweichungen: 0=identisch, 100=kritische Widersprueche" },
    matchPercentage: { type: "number", minimum: 0, maximum: 100, description: "Prozentuale Uebereinstimmung der wesentlichen Klauseln" },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string", description: "Name/Kategorie der Klausel (z.B. Haftung, Kuendigungsfrist)" },
          docA: { type: "string", description: "Relevante Passage aus Dokument A" },
          docB: { type: "string", description: "Relevante Passage aus Dokument B" },
          severity: { type: "string", enum: ["niedrig", "mittel", "hoch"] },
          assessment: { type: "string", description: "Bewertung der Abweichung und deren Risiko" }
        },
        required: ["clause", "docA", "docB", "severity", "assessment"]
      }
    },
    missingInA: { type: "array", items: { type: "string" }, description: "Klauseln die in Dokument A fehlen aber in B vorhanden sind" },
    missingInB: { type: "array", items: { type: "string" }, description: "Klauseln die in Dokument B fehlen aber in A vorhanden sind" },
    recommendations: { type: "array", items: { type: "string" }, description: "Konkrete Handlungsempfehlungen" }
  },
  required: ["summary", "overallRisk", "matchPercentage", "findings", "missingInA", "missingInB", "recommendations"]
}, null, 2)

async function extractText(file: File | null, text: string | null): Promise<string> {
  if (text && text.trim().length > 0) return text.trim()
  if (!file) return ""
  if (file.type === "text/plain" || file.name.endsWith(".txt")) return await file.text()
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return data.text
  }
  return ""
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const formData = await request.formData()

  const textA = await extractText(
    formData.get("fileA") as File | null,
    formData.get("textA") as string | null
  )
  const textB = await extractText(
    formData.get("fileB") as File | null,
    formData.get("textB") as string | null
  )

  if (textA.length < 50) return NextResponse.json({ error: "Dokument A ist zu kurz (min. 50 Zeichen)." }, { status: 400 })
  if (textB.length < 50) return NextResponse.json({ error: "Dokument B ist zu kurz (min. 50 Zeichen)." }, { status: 400 })

  const docA = textA.length > 60000 ? textA.slice(0, 60000) : textA
  const docB = textB.length > 60000 ? textB.slice(0, 60000) : textB

  const metadata: DocumentMetadata = {
    documentId: `compare-${Date.now()}`,
    analysisType: AnalysisType.CONTRACT,
    documentLength: docA.length + docB.length,
    hasVisualElements: false
  }

  const prompt = `Du bist ein Enterprise-KI-System fuer Vertragsvergleiche, spezialisiert auf den Abgleich von AGB gegen AEB (Allgemeine Einkaufsbedingungen) im DACH-Raum und international.

AUFGABE: Vergleiche die folgenden zwei Dokumente systematisch Klausel fuer Klausel.

VERGLEICHS-SCHWERPUNKTE:
1. Identifiziere alle Abweichungen zwischen Dokument A und Dokument B
2. Bewerte jede Abweichung nach Schweregrad (niedrig/mittel/hoch)
3. Zitiere die relevanten Passagen aus beiden Dokumenten
4. Identifiziere Klauseln die in einem Dokument fehlen
5. Pruefe besonders: Haftung, Gewaehrleistung, Kuendigungsfristen, Gerichtsstand, Vertragsstrafen, IP-Rechte, Datenschutz, Force Majeure
6. Formuliere konkrete Handlungsempfehlungen fuer Nachverhandlungen

Erkenne die Sprache automatisch und antworte in der Sprache der Dokumente.

=== DOKUMENT A (z.B. Lieferanten-AGB) ===
${docA}

=== DOKUMENT B (z.B. Ihre AEB / Vorgaben) ===
${docB}

WICHTIG: Antworte ausschliesslich mit einem validen JSON-Objekt. Schema:
${comparisonSchema}`

  try {
    const result = await analyzeWithRouter(metadata, prompt, docA + "\n---\n" + docB)
    let parsed = null
    try {
      const clean = result.analysis.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = { summary: result.analysis, overallRisk: 50, matchPercentage: 50, findings: [], missingInA: [], missingInB: [], recommendations: [] }
    }
    return NextResponse.json({ parsed, modelUsed: result.modelUsed, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: "Vergleich fehlgeschlagen.", details: e instanceof Error ? e.message : "unknown" }, { status: 500 })
  }
}
