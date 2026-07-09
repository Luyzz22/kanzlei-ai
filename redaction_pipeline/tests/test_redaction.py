"""Echte PDF-Redaction: Text+Pixel werden entfernt, nicht nur überdeckt."""
from __future__ import annotations

import fitz

from redaction_pipeline.config import DEFAULT_POLICY
from redaction_pipeline.stages.detect import run_detectors
from redaction_pipeline.stages.ocr_layout import run_ocr_layout
from redaction_pipeline.stages.redact import apply_true_redaction
from redaction_pipeline.stages.sanitize import sanitize


def test_true_redaction_removes_textlayer():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 100), "IBAN DE89 3704 0044 0532 0130 00", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    clean, _ = sanitize(pdf_bytes, DEFAULT_POLICY)
    layout = run_ocr_layout(clean, DEFAULT_POLICY)
    hits, _ = run_detectors(clean, layout.tokens, DEFAULT_POLICY)
    assert hits, "IBAN sollte erkannt werden"

    redacted_pdf = apply_true_redaction(clean, hits)

    # Im redacted PDF darf der IBAN-Textlayer nicht mehr existieren.
    rdoc = fitz.open(stream=redacted_pdf, filetype="pdf")
    text = "".join(p.get_text() for p in rdoc)
    rdoc.close()
    assert "0532" not in text
    assert "3704" not in text
