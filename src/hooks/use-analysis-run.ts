"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AnalysisStage =
  | "classification"
  | "extraction"
  | "risk"
  | null;

export type AnalysisRunStatus =
  | "IDLE"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface AnalysisRunState {
  runId: string | null;
  status: AnalysisRunStatus;
  progress: number;
  currentStage: AnalysisStage;
  result: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  elapsed: number; // Sekunden seit Start
}

const POLL_INTERVAL = 2500;
const ELAPSED_INTERVAL = 1000;

export function useAnalysisRun() {
  const [state, setState] = useState<AnalysisRunState>({
    runId: null,
    status: "IDLE",
    progress: 0,
    currentStage: null,
    result: null,
    error: null,
    startedAt: null,
    completedAt: null,
    elapsed: 0,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    elapsedRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((s) => ({ ...s, elapsed }));
      }
    }, ELAPSED_INTERVAL);
  }, []);

  const fetchResult = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/analysis/${id}/result`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setState((s) => ({ ...s, result: data.result }));
      }
    } catch {
      // Wird beim nächsten Versuch behandelt
    }
  }, []);

  const poll = useCallback(
    (id: string) => {
      stopPolling();
      startElapsedTimer();

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/workspace/analysis/${id}/status`, {
            cache: "no-store",
          });
          if (!res.ok) return;

          const data = await res.json();

          setState((s) => ({
            ...s,
            status: data.status,
            progress: data.progress,
            currentStage: data.currentStage ?? null,
            error: data.error ?? null,
            startedAt: data.startedAt ?? s.startedAt,
            completedAt: data.completedAt ?? null,
          }));

          if (data.status === "COMPLETED") {
            stopPolling();
            await fetchResult(id);
          } else if (
            data.status === "FAILED" ||
            data.status === "CANCELLED"
          ) {
            stopPolling();
          }
        } catch {
          // Netzwerk-Fehler → nächster Tick versucht es erneut
        }
      }, POLL_INTERVAL);
    },
    [fetchResult, stopPolling, startElapsedTimer]
  );

  const start = useCallback(
    async (documentId: string) => {
      setState({
        runId: null,
        status: "QUEUED",
        progress: 0,
        currentStage: null,
        result: null,
        error: null,
        startedAt: null,
        completedAt: null,
        elapsed: 0,
      });

      try {
        const res = await fetch("/api/workspace/analysis/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setState((s) => ({
            ...s,
            status: "FAILED",
            error: err.error ?? "start_failed",
          }));
          return;
        }

        const data = await res.json();
        setState((s) => ({
          ...s,
          runId: data.runId,
          status: data.status,
          progress: data.progress ?? 0,
          currentStage: data.currentStage ?? null,
        }));

        poll(data.runId);
      } catch {
        setState((s) => ({
          ...s,
          status: "FAILED",
          error: "network_error",
        }));
      }
    },
    [poll]
  );

  const reset = useCallback(() => {
    stopPolling();
    setState({
      runId: null,
      status: "IDLE",
      progress: 0,
      currentStage: null,
      result: null,
      error: null,
      startedAt: null,
      completedAt: null,
      elapsed: 0,
    });
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { ...state, start, reset };
}
