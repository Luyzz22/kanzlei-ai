"""
Stufe B — OCR + Layout (koordinatenbasiert).

Nativer Textlayer ⇒ Token-Koordinaten direkt aus fitz.
Kein Textlayer (Scan) ⇒ Seiten rendern + Tesseract (deu) mit Bounding-Boxes.

Coverage-Score = Anteil sicher erkannter Tokens. Niedrige Coverage ⇒
ocr-Detektor confidence < min_coverage ⇒ erzwingt AMBER stromaufwärts.
Niemals "leeres OCR = sauber" (fail-closed).
"""
from __future__ import annotations

import shutil
from dataclasses import dataclass

import fitz

from ..config import PolicyConfig
from ..contract import DetectorResult, Severity


@dataclass(frozen=True)
class Token:
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    conf: float  # 0..1
    source: str  # "native" | "ocr"


@dataclass(frozen=True)
class LayoutResult:
    tokens: list[Token]
    page_count: int
    scanned: bool
    detector: DetectorResult


def _tesseract_available() -> bool:
    return shutil.which("tesseract") is not None


def _native_tokens(doc: fitz.Document) -> list[Token]:
    tokens: list[Token] = []
    for pno in range(doc.page_count):
        page = doc.load_page(pno)
        for w in page.get_text("words"):
            x0, y0, x1, y1, word = w[0], w[1], w[2], w[3], w[4]
            if word.strip():
                tokens.append(
                    Token(pno, x0, y0, x1, y1, word, 1.0, "native")
                )
    return tokens


def _ocr_tokens(
    doc: fitz.Document, policy: PolicyConfig
) -> tuple[list[Token], float]:
    """Rendert jede Seite und OCR't sie. Gibt Tokens + mittlere Coverage zurück."""
    import pytesseract
    from PIL import Image

    tokens: list[Token] = []
    confidences: list[float] = []
    zoom = policy.ocr_dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    for pno in range(doc.page_count):
        page = doc.load_page(pno)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        data = pytesseract.image_to_data(
            img, lang=policy.ocr_lang, output_type=pytesseract.Output.DICT
        )
        n = len(data["text"])
        for i in range(n):
            text = (data["text"][i] or "").strip()
            if not text:
                continue
            try:
                conf_raw = float(data["conf"][i])
            except (TypeError, ValueError):
                conf_raw = -1.0
            if conf_raw < 0:
                continue
            conf = conf_raw / 100.0
            confidences.append(conf)
            # Pixel-Koordinaten zurück in PDF-Punkte (÷ zoom).
            x0 = data["left"][i] / zoom
            y0 = data["top"][i] / zoom
            x1 = (data["left"][i] + data["width"][i]) / zoom
            y1 = (data["top"][i] + data["height"][i]) / zoom
            tokens.append(Token(pno, x0, y0, x1, y1, text, conf, "ocr"))

    if not confidences:
        # Kein OCR-Ergebnis ⇒ Coverage 0 (NICHT "sauber").
        return tokens, 0.0
    mean_conf = sum(confidences) / len(confidences)
    # Anteil Tokens über Mindest-Wort-Confidence.
    strong = sum(1 for c in confidences if c * 100 >= policy.ocr_min_word_conf)
    strong_ratio = strong / len(confidences)
    coverage = min(mean_conf, strong_ratio)
    return tokens, coverage


def run_ocr_layout(pdf_bytes: bytes, policy: PolicyConfig) -> LayoutResult:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page_count = doc.page_count
        native = _native_tokens(doc)
        native_chars = sum(len(t.text) for t in native)

        if native_chars >= 20:
            # Echter Textlayer vorhanden.
            return LayoutResult(
                tokens=native,
                page_count=page_count,
                scanned=False,
                detector=DetectorResult(
                    name="ocr",
                    version=policy.v("ocr"),
                    flagged=False,
                    severity=Severity.NONE,
                    confidence=1.0,
                    detail="native_text_layer",
                ),
            )

        # Scan-Pfad.
        if not _tesseract_available():
            # OCR nicht möglich ⇒ Coverage 0 ⇒ AMBER (fail-closed).
            return LayoutResult(
                tokens=[],
                page_count=page_count,
                scanned=True,
                detector=DetectorResult(
                    name="ocr",
                    version=policy.v("ocr"),
                    flagged=True,
                    severity=Severity.AMBER,
                    confidence=0.0,
                    detail="tesseract_unavailable",
                ),
            )

        ocr_toks, coverage = _ocr_tokens(doc, policy)
        below = coverage < policy.min_coverage
        return LayoutResult(
            tokens=ocr_toks,
            page_count=page_count,
            scanned=True,
            detector=DetectorResult(
                name="ocr",
                version=policy.v("ocr"),
                flagged=below,
                severity=Severity.AMBER if below else Severity.NONE,
                confidence=coverage,
                detail=f"ocr_coverage={coverage:.3f}",
            ),
        )
    finally:
        doc.close()
