/**
 * @deprecated Importiere aus `@/lib/ai/analysis-router` für Pipeline-Stufen und erweiterte Router-Logik.
 * Diese Datei bleibt als kompatible Re-Export-Schicht für bestehende Aufrufer.
 */
export {
  assertAnyProviderConfigured,
  buildModelExecutionPlan,
  getFallbackChain,
  getFilteredExecutionChain,
  getSelectionReason,
  getSelectionReasonForStage,
  logModelSelection,
  ProviderConfigurationError,
  selectOptimalModel,
  type PipelineStage,
  type RouterContext
} from "@/lib/ai/analysis-router"
