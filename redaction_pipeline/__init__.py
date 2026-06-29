"""
KanzleiAI Phase 2 — Lokale Redaction-Pipeline (Hetzner).

Schutzwall des Hybrid-Modells: Originale, Seitenbilder und das
Re-Identifikations-Mapping verlassen den Server NIE. Die Pipeline produziert
ausschließlich den Keystone-Input (fields + detectors). Fail-closed.
"""
from .config import DEFAULT_POLICY, POLICY_VERSION, PolicyConfig
from .contract import (
    DetectorResult,
    MinimizedFields,
    OutputContractError,
    PipelineOutput,
    Severity,
    validate_output,
)
from .pipeline import run_pipeline

__all__ = [
    "run_pipeline",
    "PolicyConfig",
    "DEFAULT_POLICY",
    "POLICY_VERSION",
    "DetectorResult",
    "MinimizedFields",
    "PipelineOutput",
    "Severity",
    "OutputContractError",
    "validate_output",
]
