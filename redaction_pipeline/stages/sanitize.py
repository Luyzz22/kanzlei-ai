"""
Stufe A — PDF-Sanitization (vor allem anderen).

Entfernt aktive/versteckte Inhalte (JavaScript, eingebettete Dateien,
OpenAction/AdditionalActions, XMP/Dokument-Metadaten). Inventarisiert ZUERST
mit pikepdf (XXE-sicher), scrubbt DANN mit fitz.

Output: bereinigte PDF-Bytes + DetectorResult('sanitizer').
"""
from __future__ import annotations

import io

import fitz  # PyMuPDF
import pikepdf

from ..config import PolicyConfig
from ..contract import DetectorResult, Severity


def _inventory_active_content(pdf_bytes: bytes) -> list[str]:
    """Listet gefundene aktive/versteckte Inhaltstypen (deterministisch)."""
    found: set[str] = set()
    try:
        with pikepdf.open(io.BytesIO(pdf_bytes)) as pdf:
            root = pdf.Root
            if "/OpenAction" in root:
                found.add("openaction")
            if "/AA" in root:
                found.add("additional_actions")
            names = root.get("/Names")
            if names is not None:
                if "/JavaScript" in names:
                    found.add("javascript")
                if "/EmbeddedFiles" in names:
                    found.add("embedded_file")
            if "/AcroForm" in root:
                found.add("acroform")
            if "/Metadata" in root:
                found.add("xmp")
            # Dokument-Info-Metadaten.
            try:
                if pdf.docinfo and len(dict(pdf.docinfo)) > 0:
                    found.add("docinfo")
            except Exception:
                found.add("docinfo")
            # Seiten-Annotationen / versteckte OCG-Ebenen.
            for page in pdf.pages:
                if "/Annots" in page:
                    found.add("annotations")
                    break
            if "/OCProperties" in root:
                found.add("optional_content_layers")
    except Exception:
        # pikepdf scheitert ⇒ unsicher ⇒ als Befund hochreichen (fail-closed).
        found.add("parse_uncertain")
    return sorted(found)


def sanitize(
    pdf_bytes: bytes, policy: PolicyConfig
) -> tuple[bytes, DetectorResult]:
    active = _inventory_active_content(pdf_bytes)

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        # fitz.scrub entfernt JS, eingebettete Dateien, Metadaten, XMP etc.
        doc.scrub(
            attached_files=True,
            clean_pages=True,
            embedded_files=True,
            javascript=True,
            metadata=True,
            xml_metadata=True,
            reset_fields=True,
            reset_responses=True,
            thumbnails=True,
            remove_links=False,
        )
        # Metadaten explizit leeren.
        doc.set_metadata({})
        out = doc.tobytes(garbage=4, deflate=True, clean=True)
    finally:
        doc.close()

    flagged = len(active) > 0
    uncertain = "parse_uncertain" in active
    severity = Severity.AMBER if flagged else Severity.NONE
    detail = ("removed:" + ",".join(active)) if active else None
    # Bei Parse-Unsicherheit Confidence < 1.0 (fail-closed), sonst 1.0.
    confidence = 0.5 if uncertain else 1.0

    return out, DetectorResult(
        name="sanitizer",
        version=policy.v("sanitizer"),
        flagged=flagged,
        severity=severity,
        confidence=confidence,
        detail=detail,
    )
