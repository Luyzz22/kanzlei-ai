"""
Fail-closed-Verhalten: Deny-Begriffe ⇒ RED, niedrige OCR-Coverage ⇒ AMBER,
aktive Inhalte ⇒ sanitizer-Befund.
"""
from __future__ import annotations

from redaction_pipeline import run_pipeline, Severity
from redaction_pipeline.config import PolicyConfig

TENANT = "kanzlei-dermalog"


def _max_severity(out: dict) -> str:
    order = {"none": 0, "amber": 1, "red": 2}
    return max((d["severity"] for d in out["detectors"]), key=lambda s: order[s])


def test_deny_terms_force_red(corpus, mapping_dir):
    red_docs = [d for d in corpus if d.expect_red]
    assert red_docs
    for doc in red_docs:
        out = run_pipeline(doc.pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
        assert _max_severity(out) == "red", f"{doc.name} nicht RED"


def test_scanned_docs_use_ocr_detector(corpus, mapping_dir):
    scans = [d for d in corpus if d.is_scan]
    assert scans
    for doc in scans:
        out = run_pipeline(doc.pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
        ocr = next(d for d in out["detectors"] if d["name"] == "ocr")
        # Entweder gute Coverage ODER fail-closed AMBER — nie stilles "none@1.0"
        # ohne Textlayer.
        assert ocr["detail"] != "native_text_layer"


def test_low_coverage_forces_amber():
    # Künstlich hohe min_coverage ⇒ selbst guter OCR fällt unter Schwelle.
    from redaction_pipeline.tests.corpus import build_corpus

    strict = PolicyConfig(min_coverage=1.0)
    scans = [d for d in build_corpus() if d.is_scan]
    out = run_pipeline(scans[0].pdf_bytes, "t", policy=strict, persist_mapping=False)
    ocr = next(d for d in out["detectors"] if d["name"] == "ocr")
    assert ocr["confidence"] < 1.0
    assert ocr["severity"] in ("amber", "red")


def test_active_content_flagged_by_sanitizer(corpus, mapping_dir):
    active = [d for d in corpus if d.name.startswith("mixed_active")]
    assert active
    for doc in active:
        out = run_pipeline(doc.pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
        san = next(d for d in out["detectors"] if d["name"] == "sanitizer")
        assert san["flagged"] is True
        assert san["severity"] == "amber"
