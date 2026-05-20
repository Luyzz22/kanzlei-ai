/**
 * Schnellanalyse-Komponente — Async-Pattern-Umbau
 *
 * ERSETZT: den bisherigen direkten fetch auf /api/workspace/run-analysis
 * NUTZT: useAnalysisRun Hook + PipelineVisualizer
 *
 * EINBAU:
 * In der bestehenden Schnellanalyse-Page (z.B. src/app/(app)/workspace/page.tsx
 * oder src/app/(app)/schnellanalyse/page.tsx) den alten Analyse-Block durch
 * <AnalysisPanel documentId={...} /> ersetzen.
 *
 * Der alte /api/workspace/run-analysis Endpoint wird nicht mehr gebraucht,
 * kann aber als Fallback stehen bleiben bis der Async-Flow verifiziert ist.
 */

"use client";

import { useState } from "react";
import { useAnalysisRun } from "@/hooks/use-analysis-run";
import { PipelineVisualizer } from "@/components/analysis/pipeline-visualizer";
import {
  FileSearch,
  Upload,
  RotateCcw,
  Download,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface AnalysisPanelProps {
  /** Document ID aus dem Workspace / Upload */
  documentId: string;
  /** Dateiname zur Anzeige */
  fileName?: string;
  /** Callback wenn Ergebnis da ist */
  onResult?: (result: Record<string, unknown>) => void;
  /** Callback für "Ergebnis anzeigen" → navigiert zur Ergebnis-Seite */
  onViewResult?: (runId: string) => void;
}

export function AnalysisPanel({
  documentId,
  fileName,
  onResult,
  onViewResult,
}: AnalysisPanelProps) {
  const analysis = useAnalysisRun();
  const [hasTriggered, setHasTriggered] = useState(false);

  async function handleStart() {
    setHasTriggered(true);
    await analysis.start(documentId);
  }

  // Callback wenn Ergebnis eintrifft
  if (analysis.result && onResult && analysis.status === "COMPLETED") {
    // Einmalig feuern
    onResult(analysis.result);
  }

  return (
    <div className="space-y-4">
      {/* ─── Idle State: Start-Button ─────────────────────── */}
      {analysis.status === "IDLE" && !hasTriggered && (
        <div className="flex flex-col items-center gap-4 py-8">
          {fileName && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-lg text-sm text-stone-600">
              <Upload className="w-3.5 h-3.5" />
              <span className="font-medium truncate max-w-[300px]">
                {fileName}
              </span>
            </div>
          )}

          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#003856] text-white text-sm font-semibold rounded-xl hover:bg-[#002a44] active:bg-[#001f33] transition-all shadow-sm hover:shadow-md"
          >
            <FileSearch className="w-4 h-4" />
            Vertragsanalyse starten
          </button>

          <p className="text-xs text-stone-500 max-w-sm text-center leading-relaxed">
            Die KI analysiert Ihren Vertrag in drei Stufen: Klassifikation,
            Extraktion und Risikobewertung. Typische Dauer: 30–90 Sekunden.
          </p>
        </div>
      )}

      {/* ─── Pipeline-Visualizer (während Analyse läuft) ──── */}
      {analysis.status !== "IDLE" && (
        <PipelineVisualizer
          status={analysis.status}
          progress={analysis.progress}
          currentStage={analysis.currentStage}
          elapsed={analysis.elapsed}
          error={analysis.error}
          onRetry={() => analysis.start(documentId)}
        />
      )}

      {/* ─── Ergebnis-Actions ─────────────────────────────── */}
      {analysis.status === "COMPLETED" && analysis.result && (
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50/50 rounded-xl ring-1 ring-emerald-200/60 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Analyse abgeschlossen
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onViewResult && analysis.runId && (
              <button
                onClick={() => onViewResult(analysis.runId!)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#003856] bg-white rounded-lg ring-1 ring-stone-200 hover:ring-[#003856]/30 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Ergebnis ansehen
              </button>
            )}

            <button
              onClick={analysis.reset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Neue Analyse
            </button>
          </div>
        </div>
      )}

      {/* ─── Fehler-State: Reset ──────────────────────────── */}
      {analysis.status === "FAILED" && (
        <div className="flex justify-center pt-2">
          <button
            onClick={analysis.reset}
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            Zurücksetzen und erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}
