import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * @deprecated v4.2 — ersetzt durch Async-Pipeline:
 *   POST /api/workspace/analysis/start  → { runId }
 *   GET  /api/workspace/analysis/[runId]/status
 *   GET  /api/workspace/analysis/[runId]/result
 *
 * Diese Route gibt bewusst 410 Gone zurück, damit fehlerhafte Aufrufer
 * sichtbar werden statt stillschweigend auf einem toten Pfad zu hängen.
 */
export const dynamic = "force-dynamic";

async function handleDeprecated() {
  const session = await auth();
  // Audit-Spur: wer ruft den Legacy-Endpoint noch?
  console.warn(
    "[deprecated] /api/workspace/run-analysis called",
    JSON.stringify({
      userId: session?.user?.id ?? null,
      at: new Date().toISOString(),
    }),
  );

  return NextResponse.json(
    {
      ok: false,
      code: "ENDPOINT_DEPRECATED",
      message:
        "Dieser Endpoint wurde durch die asynchrone Analyse-Pipeline ersetzt. " +
        "Bitte POST /api/workspace/analysis/start verwenden und anschließend " +
        "den Status über /api/workspace/analysis/{runId}/status pollen.",
      replacement: {
        start: "/api/workspace/analysis/start",
        status: "/api/workspace/analysis/[runId]/status",
        result: "/api/workspace/analysis/[runId]/result",
      },
    },
    { status: 410 },
  );
}

export async function POST() {
  return handleDeprecated();
}

export async function GET() {
  return handleDeprecated();
}
