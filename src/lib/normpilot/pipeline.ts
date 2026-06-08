import { runNormPilotMockPipeline } from "./mock-pipeline"
import type {
  NormPilotPipelineInput,
  NormPilotPipelineOptions,
  NormPilotPipelineResult
} from "./pipeline-types"

export class NormPilotPipelineModeError extends Error {
  readonly code = "NORMPILOT_PROVIDER_CALLS_DISABLED"

  constructor() {
    super("NormPilot PR 2 erlaubt nur mock: true. Produktive Provider-Calls sind nicht Teil dieses Scopes.")
    this.name = "NormPilotPipelineModeError"
  }
}

export async function runNormPilotPipeline(
  input: NormPilotPipelineInput,
  options: NormPilotPipelineOptions
): Promise<NormPilotPipelineResult> {
  if (options.mock !== true) {
    throw new NormPilotPipelineModeError()
  }

  return runNormPilotMockPipeline(input)
}

export { runNormPilotMockPipeline }
export type {
  NormPilotPipelineInput,
  NormPilotPipelineOptions,
  NormPilotPipelineResult
} from "./pipeline-types"
