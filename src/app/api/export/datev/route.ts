export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { log } from "@/lib/security/secure-logging"

/**
 * DATEV Buchungsstapel CSV Export
 *
 * SECURITY: Dieser Endpoint formatiert nur — die Daten kommen vom Client.
 * Review-Enforcement muss im UI erfolgen (Export-Button nur für FREIGEGEBEN).
 * TODO: Server-seitige Verifizierung der AnalysisRun.reviewState = FREIGEGEBEN
 */

// DATEV Buchungsstapel CSV format (simplified)
// Based on DATEV-Format 510 (Buchungssätze)
function generateDATEVHeader(): string {
  const now = new Date()
  const lines = [
    `"EXTF";510;21;"Buchungsstapel";12;${now.toISOString().slice(0,10).replace(/-/g,"")};;;;;;"KanzleiAI Export";;;;;;`,
    `"Umsatz";"SollHaben";"Konto";"Gegenkonto";"BU";"Belegdatum";"Belegfeld1";"Buchungstext";"Beleginfo-Art1";"Beleginfo-Inhalt1"`,
  ]
  return lines.join("\n")
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  try {
    const { analyses } = await request.json() as {
      analyses: Array<{
        id: string
        date: string
        product: string
        riskScore: number | null
        findingsCount: number
        model: string
      }>
    }

    if (!analyses?.length) {
      return NextResponse.json({ error: "Keine Analysen zum Exportieren" }, { status: 400 })
    }

    const header = generateDATEVHeader()
    const rows = analyses.map((a, i) => {
      const date = new Date(a.date)
      const belegDate = `${date.getDate()}${date.getMonth() + 1}`
      return `"0,00";"S";"4900";"1200";"";${belegDate};"KAI-${String(i + 1).padStart(4, "0")}";"${a.product.replace(/"/g, "'").slice(0, 60)}";"Risiko-Score";"${a.riskScore ?? 'k.A.'}"`
    })

    const csv = header + "\n" + rows.join("\n")

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kanzlei-ai-datev-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      }
    })
  } catch (error) {
    log.error("datev_export_failed", { error: error instanceof Error ? error.message : "unknown" })
    return NextResponse.json({ error: "Export fehlgeschlagen" }, { status: 500 })
  }
}
