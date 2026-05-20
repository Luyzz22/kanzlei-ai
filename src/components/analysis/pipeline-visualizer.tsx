"use client";

import { useMemo } from "react";
import {
  FileSearch,
  Layers,
  ShieldAlert,
  Check,
  AlertTriangle,
  RotateCcw,
  Clock,
  Loader2,
} from "lucide-react";
import type { AnalysisRunStatus, AnalysisStage } from "@/hooks/use-analysis-run";

// ─── Types ────────────────────────────────────────────────
type Stage = {
  id: AnalysisStage;
  label: string;
  sublabel: string;
  icon: typeof FileSearch;
  progressRange: [number, number]; // [start%, end%]
};

const STAGES: Stage[] = [
  {
    id: "classification",
    label: "Klassifikation",
    sublabel: "Vertragstyp erkennen",
    icon: FileSearch,
    progressRange: [0, 30],
  },
  {
    id: "extraction",
    label: "Extraktion",
    sublabel: "Klauseln & Daten",
    icon: Layers,
    progressRange: [30, 65],
  },
  {
    id: "risk",
    label: "Risikobewertung",
    sublabel: "Findings & Scoring",
    icon: ShieldAlert,
    progressRange: [65, 100],
  },
];

function getStageState(
  stageId: AnalysisStage,
  currentStage: AnalysisStage,
  progress: number,
  status: AnalysisRunStatus
): "pending" | "active" | "completed" | "error" {
  if (status === "FAILED") {
    const activeIdx = STAGES.findIndex((s) => s.id === currentStage);
    const thisIdx = STAGES.findIndex((s) => s.id === stageId);
    if (thisIdx < activeIdx) return "completed";
    if (thisIdx === activeIdx) return "error";
    return "pending";
  }

  if (status === "COMPLETED") return "completed";

  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return "pending";

  if (progress >= stage.progressRange[1]) return "completed";
  if (progress >= stage.progressRange[0]) return "active";
  return "pending";
}

function getStageProgress(stageId: AnalysisStage, globalProgress: number): number {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return 0;

  const [start, end] = stage.progressRange;
  if (globalProgress <= start) return 0;
  if (globalProgress >= end) return 100;
  return Math.round(((globalProgress - start) / (end - start)) * 100);
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ─── Main Component ───────────────────────────────────────
interface PipelineVisualizerProps {
  status: AnalysisRunStatus;
  progress: number;
  currentStage: AnalysisStage;
  elapsed: number;
  error: string | null;
  onRetry?: () => void;
}

export function PipelineVisualizer({
  status,
  progress,
  currentStage,
  elapsed,
  error,
  onRetry,
}: PipelineVisualizerProps) {
  const isActive = status === "QUEUED" || status === "RUNNING";
  const isFailed = status === "FAILED";
  const isCompleted = status === "COMPLETED";

  // Estimated time remaining (simple linear extrapolation)
  const eta = useMemo(() => {
    if (!isActive || progress <= 5 || elapsed < 3) return null;
    const rate = progress / elapsed;
    const remaining = Math.ceil((100 - progress) / rate);
    return remaining > 0 ? remaining : null;
  }, [isActive, progress, elapsed]);

  if (status === "IDLE") return null;

  return (
    <div className="w-full">
      {/* Progress Container */}
      <div className="bg-white rounded-2xl ring-1 ring-stone-200/60 shadow-[0_1px_3px_rgba(0,56,86,0.04)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100/80">
          <div className="flex items-center gap-2.5">
            {isActive && (
              <Loader2 className="w-3.5 h-3.5 text-[#003856] animate-spin" />
            )}
            {isCompleted && (
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}
            {isFailed && (
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            )}

            <span className="text-sm font-semibold text-[#003856] tracking-tight">
              {isActive && "Analyse läuft …"}
              {isCompleted && "Analyse abgeschlossen"}
              {isFailed && "Analyse fehlgeschlagen"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {(isActive || isCompleted) && elapsed > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 tabular-nums">
                <Clock className="w-3 h-3" />
                <span>{formatElapsed(elapsed)}</span>
                {eta !== null && eta > 3 && (
                  <span className="text-stone-400">
                    · ~{formatElapsed(eta)} verbl.
                  </span>
                )}
              </div>
            )}

            {/* Global Progress */}
            {isActive && (
              <span className="text-xs font-mono font-semibold text-[#003856] tabular-nums">
                {progress}%
              </span>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="h-1 bg-stone-100 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              isFailed
                ? "bg-red-400"
                : isCompleted
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-[#003856] to-[#005580]"
            }`}
            style={{ width: `${progress}%` }}
          />
          {isActive && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                width: `${progress}%`,
                animationDuration: "2s",
                animationIterationCount: "infinite",
              }}
            />
          )}
        </div>

        {/* Stages */}
        <div className="px-5 py-5">
          <div className="flex items-start gap-0">
            {STAGES.map((stage, i) => {
              const state = getStageState(
                stage.id,
                currentStage,
                progress,
                status
              );
              const stageProgress = getStageProgress(stage.id, progress);
              const Icon = stage.icon;
              const isLast = i === STAGES.length - 1;

              return (
                <div
                  key={stage.id}
                  className="flex-1 flex items-start"
                >
                  {/* Stage Block */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    {/* Icon Circle */}
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
                        ${state === "completed"
                          ? "bg-emerald-50 ring-1 ring-emerald-200"
                          : state === "active"
                            ? "bg-[#003856]/8 ring-1 ring-[#003856]/20 shadow-[0_0_0_4px_rgba(0,56,86,0.06)]"
                            : state === "error"
                              ? "bg-red-50 ring-1 ring-red-200"
                              : "bg-stone-50 ring-1 ring-stone-200/60"
                        }
                      `}
                    >
                      {state === "completed" ? (
                        <Check
                          className="w-4 h-4 text-emerald-600"
                          strokeWidth={2.5}
                        />
                      ) : state === "active" ? (
                        <Icon className="w-4 h-4 text-[#003856] animate-pulse" />
                      ) : state === "error" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Icon className="w-4 h-4 text-stone-400" />
                      )}
                    </div>

                    {/* Label */}
                    <p
                      className={`mt-2.5 text-xs font-semibold text-center transition-colors duration-300 ${
                        state === "completed"
                          ? "text-emerald-700"
                          : state === "active"
                            ? "text-[#003856]"
                            : state === "error"
                              ? "text-red-600"
                              : "text-stone-400"
                      }`}
                    >
                      {stage.label}
                    </p>

                    <p
                      className={`mt-0.5 text-[10px] text-center transition-colors duration-300 ${
                        state === "active" || state === "completed"
                          ? "text-stone-500"
                          : "text-stone-400"
                      }`}
                    >
                      {stage.sublabel}
                    </p>

                    {/* Stage-Level Progress */}
                    {state === "active" && (
                      <div className="mt-2 w-16 h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#003856] rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${stageProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="flex items-center pt-5 px-1">
                      <div
                        className={`w-12 h-px transition-colors duration-500 ${
                          state === "completed"
                            ? "bg-emerald-300"
                            : "bg-stone-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Footer */}
        {isFailed && (
          <div className="px-5 py-3.5 border-t border-red-100 bg-red-50/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-red-700">
                {error === "unknown_pipeline_error"
                  ? "Ein unerwarteter Fehler ist aufgetreten."
                  : error ?? "Analyse konnte nicht abgeschlossen werden."}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003856] hover:text-[#002a44] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Erneut versuchen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completed Footer */}
        {isCompleted && (
          <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50/30">
            <p className="text-xs text-emerald-700 font-medium">
              ✓ Analyse in {formatElapsed(elapsed)} abgeschlossen — Ergebnisse verfügbar
            </p>
          </div>
        )}
      </div>

      {/* Shimmer Animation Keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
