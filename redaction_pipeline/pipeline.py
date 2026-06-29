"""
Orchestrierung der lokalen Redaction-Pipeline (Hetzner).

Fluss:  sanitize → OCR/layout → detect → redact → minimize → Output-Vertrag

Gibt AUSSCHLIESSLICH den Output-Vertrag zurück (jobRef, tenantScope, fields,
detectors). NIE Original, NIE Seitenbilder, NIE Mapping. Das Mapping wird
AES-verschlüsselt lokal persistiert.

Fail-closed: jede Stufe reicht Unsicherheit als Detektor-Befund hoch.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path

from .config import DEFAULT_POLICY, PolicyConfig
from .contract import (
    DetectorResult,
    PipelineOutput,
    Severity,
    validate_output,
)
from .mapping_store import save_mapping
from .stages.detect import run_detectors
from .stages.minimize import minimize
from .stages.ocr_layout import run_ocr_layout
from .stages.redact import redact
from .stages.sanitize import sanitize
from .tenant import tenant_scope


def _job_ref(pdf_bytes: bytes, tenant_id: str) -> str:
    # Deterministisch aus Inhalt+Tenant (reproduzierbar, nicht sprechend).
    h = hashlib.sha256(pdf_bytes + tenant_id.encode("utf-8")).hexdigest()
    return "job_" + h[:24]


def run_pipeline(
    pdf_bytes: bytes,
    tenant_id: str,
    *,
    policy: PolicyConfig = DEFAULT_POLICY,
    document_kind: str | None = None,
    mapping_store_dir: Path | None = None,
    persist_mapping: bool = True,
) -> dict:
    """
    Führt die vollständige Pipeline aus und gibt das validierte Output-Dict
    zurück (genau der Keystone-Input). Wirft OutputContractError bei jeder
    Vertragsverletzung (fail-closed).
    """
    job_ref = _job_ref(pdf_bytes, tenant_id)
    scope = tenant_scope(tenant_id)
    detectors: list[DetectorResult] = []

    # Stufe A — Sanitization
    clean_pdf, san_det = sanitize(pdf_bytes, policy)
    detectors.append(san_det)

    # Stufe B — OCR + Layout
    layout = run_ocr_layout(clean_pdf, policy)
    detectors.append(layout.detector)

    # Stufe C — Detektoren
    hits, det_results = run_detectors(clean_pdf, layout.tokens, policy)
    detectors.extend(det_results)

    # Stufe D — Redaction (+ echte PDF-Redaction lokal zur Verifikation)
    red = redact(tenant_id, layout.tokens, hits, policy)
    detectors.append(red.detector)

    # Mapping AES-verschlüsselt lokal persistieren (verlässt nie den Output).
    if persist_mapping and red.mapping:
        try:
            save_mapping(tenant_id, job_ref, red.mapping, store_dir=mapping_store_dir)
        except OSError:
            # Persistenz fehlgeschlagen ⇒ Befund hochreichen (fail-closed),
            # aber Mapping NICHT in den Output schreiben.
            detectors.append(
                DetectorResult(
                    name="mapping_store",
                    version="1.0.0",
                    flagged=True,
                    severity=Severity.AMBER,
                    confidence=0.0,
                    detail="persist_failed",
                )
            )

    # Stufe E — Minimierung
    fields = minimize(red.redacted_text, document_kind=document_kind)

    out = PipelineOutput(
        jobRef=job_ref,
        tenantScope=scope,
        fields=fields,
        detectors=detectors,
        policyVersion=policy.policy_version,
    )
    # Strikte Validierung des Output-Vertrags (fail-closed).
    return validate_output(out)
