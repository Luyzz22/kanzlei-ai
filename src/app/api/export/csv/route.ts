export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

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
      return NextResponse.json({ error: "Keine Analysen" }, { status: 400 })
    }

    const header = "Datum;Dokument;Risiko-Score;Risiken;KI-Modell;ID"
    const rows = analyses.map(a => {
      const date = new Date(a.date).toLocaleDateString("de-DE")
      return `${date};"${a.product.replace(/"/g, "'")}";${a.riskScore ?? ""};${a.findingsCount};${a.model};${a.id}`
    })

    const csv = "\uFEFF" + header + "\n" + rows.join("\n") // BOM for Excel

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kanzlei-ai-export-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      }
    })
  } catch (error) {
    console.error("[CSV EXPORT]", error)
    return NextResponse.json({ error: "Export fehlgeschlagen" }, { status: 500 })
  }
}
