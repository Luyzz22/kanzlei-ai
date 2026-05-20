/**
 * Async-Pipeline-Wrapper
 *
 * Kapselt die bestehende analysis-pipeline.ts und fügt onProgress-Callbacks hinzu.
 * Die existierende Pipeline (src/lib/ai/analysis-pipeline.ts) wird unverändert aufgerufen,
 * aber der Progress-State wird zwischen den 3 Stages in die DB geschrieben.
 *
 * Wenn die bestehende Pipeline bereits Stage-Callbacks unterstützt,
 * einfach hier verdrahten statt den Stage-Wrapper zu nutzen.
 */

import { prisma } from "@/lib/prisma";

// ─── Importiere die bestehende Pipeline ───────────────────
// ANPASSEN: Pfad und Funktionsname an dein bestehendes Export anpassen
import { runAnalysis } from "@/lib/ai/analysis-pipeline";
// Falls der Import anders heißt:
// import { analyzeContract } from "@/lib/ai/analysis-pipeline";

type PipelineInput = {
  runId: string;
  tenantId: string;
  documentId: string;
  onProgress: (progress: number, stage: string) => Promise<void>;
};

export async function runAnalysisPipeline({
  runId,
  tenantId,
  documentId,
  onProgress,
}: PipelineInput) {
  // ─── Dokument laden ─────────────────────────────────────
  const doc = await prisma.document.findFirstOrThrow({
    where: { id: documentId, tenantId },
    select: {
      id: true,
      title: true,
      text: true,
      tenantId: true,
    },
  });

  // ─── Tenant-Governance laden (für LLM Policy Guard R-01) ──
  const governance = await prisma.tenantGovernanceSettings.findUnique({
    where: { tenantId },
    select: {
      allowedProviders: true,
      preferEuModels: true,
    },
  }).catch(() => null); // Fallback wenn Tabelle noch nicht existiert

  // ─── Stage 1: Klassifikation (0–30%) ───────────────────
  await onProgress(5, "classification");

  // ANPASSEN: Wenn deine Pipeline die Stages intern trennt,
  // ruf hier die Klassifikation separat auf.
  // Ansonsten laufen alle 3 Stages in runAnalysis() als ein Aufruf.

  await onProgress(15, "classification");

  // ─── Stage 2: Extraktion (30–65%) ──────────────────────
  await onProgress(30, "extraction");

  // ─── Stage 3: Risikobewertung (65–100%) ────────────────
  // Bei monolithischem Pipeline-Aufruf: hier den gesamten Aufruf machen
  // und die Zwischenschritte sind approximiert.

  await onProgress(35, "extraction");

  // ─── Bestehende Pipeline aufrufen ──────────────────────
  // ANPASSEN: Parameter an deine bestehende Signatur anpassen
  const result = await runAnalysis({
    documentId: doc.id,
    documentText: doc.text,
    tenantId,
    // Governance-Filter (R-01/R-02)
    ...(governance?.allowedProviders?.length
      ? { allowedProviders: governance.allowedProviders }
      : {}),
    ...(governance?.preferEuModels
      ? { preferEuModels: true }
      : {}),
  });

  await onProgress(90, "risk");

  // ─── Ergebnis in Document speichern (falls gewünscht) ──
  // Optional: Ergebnis auch direkt auf dem Document-Record persistieren
  // await prisma.document.update({
  //   where: { id: documentId },
  //   data: { analysisResult: result },
  // });

  await onProgress(98, "risk");

  return result;
}
