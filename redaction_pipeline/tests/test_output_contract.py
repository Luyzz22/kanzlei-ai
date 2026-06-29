"""Striktheit des Output-Vertrags + Determinismus."""
from __future__ import annotations

import pytest

from redaction_pipeline import (
    DetectorResult,
    MinimizedFields,
    OutputContractError,
    PipelineOutput,
    Severity,
    run_pipeline,
    validate_output,
)

TENANT = "kanzlei-dermalog"


def test_required_detectors_present(corpus, mapping_dir):
    out = run_pipeline(corpus[0].pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
    names = {d["name"] for d in out["detectors"]}
    assert {"sanitizer", "ocr", "pii_regex", "redaction"} <= names


def test_deterministic_output(corpus, mapping_dir):
    a = run_pipeline(corpus[0].pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
    b = run_pipeline(corpus[0].pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
    assert a == b


def test_validate_rejects_speaking_tenant():
    bad = PipelineOutput(
        jobRef="job_" + "a" * 16,
        tenantScope="dermalog-hamburg",  # sprechend → verboten
        fields=MinimizedFields(redactedText="x", documentKind="contract"),
        detectors=[
            DetectorResult("sanitizer", "1.0.0", False, Severity.NONE, 1.0),
            DetectorResult("ocr", "1.0.0", False, Severity.NONE, 1.0),
            DetectorResult("pii_regex", "1.2.0", False, Severity.NONE, 1.0),
            DetectorResult("redaction", "1.0.0", False, Severity.NONE, 1.0),
        ],
    )
    with pytest.raises(OutputContractError):
        validate_output(bad)


def test_validate_rejects_missing_required_detector():
    bad = PipelineOutput(
        jobRef="job_" + "a" * 16,
        tenantScope="t_" + "a" * 8,
        fields=MinimizedFields(redactedText="x", documentKind="contract"),
        detectors=[
            DetectorResult("sanitizer", "1.0.0", False, Severity.NONE, 1.0),
        ],
    )
    with pytest.raises(OutputContractError):
        validate_output(bad)


def test_policy_version_present(corpus, mapping_dir):
    out = run_pipeline(corpus[0].pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
    assert "policyVersion" in out
    for d in out["detectors"]:
        assert d["version"].count(".") == 2
