"""
Stufe C — Multi-Detektor-Erkennung (DE-spezifisch).

Mehrere unabhängige, versionierte Detektoren. Jeder Treffer trägt
Koordinaten für Stufe D. Determinismus: nur Regex + kuratierte Listen +
deterministische Heuristik (KEIN nichtdeterministisches Modell).

- pii_regex       : IBAN, USt-ID, Steuernummer, E-Mail, Telefon, Aktenzeichen → AMBER
- ner_persons_orgs: Personen-/Org-Namen (deterministische Heuristik)        → AMBER
- addresses       : Straße/PLZ/Ort                                           → AMBER
- health_terms    : Diagnosen etc. (Deny-Liste)                             → RED
- mandate_terms   : Verfahrensgegenstand etc. (Deny-Liste)                  → RED
- qr_barcode      : QR/Datamatrix auf Scans                                 → AMBER
"""
from __future__ import annotations

import re
import shutil
from dataclasses import dataclass

import fitz

from ..config import PolicyConfig
from ..contract import DetectorResult, Severity
from ..deny_terms import HEALTH_TERMS, MANDATE_TERMS
from .ocr_layout import Token

# QR-Scanner-Verfügbarkeit EINMAL zur Ladezeit kapseln. `except Exception`
# fängt sowohl fehlendes pyzbar (ImportError) als auch fehlendes libzbar0
# (OSError beim ctypes-Laden der Shared Library).
try:
    from pyzbar.pyzbar import decode as _zbar_decode

    _ZBAR_AVAILABLE = True
    _ZBAR_ERROR: str | None = None
except Exception as _zbar_exc:  # ImportError ODER libzbar0 fehlt zur Ladezeit
    _zbar_decode = None
    _ZBAR_AVAILABLE = False
    _ZBAR_ERROR = str(_zbar_exc)


@dataclass(frozen=True)
class Hit:
    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    typ: str
    text: str
    severity: Severity


# ── Regex-Muster (DE) ────────────────────────────────────────────────────
_PII_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("iban", re.compile(r"\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}\b")),
    ("ustid", re.compile(r"\bDE\s?\d{9}\b")),
    ("steuernr", re.compile(r"\b\d{2,3}/\d{3}/\d{4,5}\b")),
    ("email", re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")),
    ("phone", re.compile(r"(?:\+49|0)(?:[\s/\-]?\d){6,14}\b")),
    ("aktenzeichen", re.compile(r"\b\d+\s?[A-Za-z]{1,3}\s?\d+/\d{2,4}\b")),
]

_ADDRESS_STREET = re.compile(
    r"\b[A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|str\.|weg|platz|allee|gasse|ring|damm)\s+\d+[a-z]?\b"
)
_ADDRESS_PLZ = re.compile(r"\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+(?:[\s\-][A-ZÄÖÜ][a-zäöüß]+)?\b")

# Personen/Org: Folge großgeschriebener Wörter, optional mit Rechtsform.
_NER_SEQ = re.compile(
    r"\b(?:[A-ZÄÖÜ][a-zäöüß]+)(?:\s+(?:[A-ZÄÖÜ][a-zäöüß]+|GmbH|AG|KG|mbH|SE|UG|Co\.))+\b"
)
# Sentence-Start-Wörter, die allein kein Name sind (Heuristik-Dämpfung).
_NER_STOP_PREFIX = frozenset(
    {"Der", "Die", "Das", "Ein", "Eine", "Im", "In", "Am", "Zwischen", "Hiermit", "Diese", "Dieser"}
)


def _build_page_text(tokens: list[Token]) -> dict[int, tuple[str, list[tuple[int, int, Token]]]]:
    """
    Pro Seite: zusammengefügter Text + Span→Token-Index. Lesereihenfolge
    (y dann x). Ermöglicht Mehr-Token-Treffer (z.B. Aktenzeichen, IBAN mit
    Leerzeichen) deterministisch auf Koordinaten abzubilden.
    """
    by_page: dict[int, list[Token]] = {}
    for t in tokens:
        by_page.setdefault(t.page, []).append(t)

    result: dict[int, tuple[str, list[tuple[int, int, Token]]]] = {}
    for page, toks in by_page.items():
        toks_sorted = sorted(toks, key=lambda t: (round(t.y0, 1), round(t.x0, 1)))
        parts: list[str] = []
        spans: list[tuple[int, int, Token]] = []
        pos = 0
        for t in toks_sorted:
            start = pos
            parts.append(t.text)
            pos += len(t.text)
            spans.append((start, pos, t))
            parts.append(" ")
            pos += 1
        result[page] = ("".join(parts), spans)
    return result


def _tokens_in_span(
    spans: list[tuple[int, int, Token]], m_start: int, m_end: int
) -> list[Token]:
    return [tok for (s, e, tok) in spans if s < m_end and e > m_start]


def _union_bbox(toks: list[Token]) -> tuple[float, float, float, float]:
    return (
        min(t.x0 for t in toks),
        min(t.y0 for t in toks),
        max(t.x1 for t in toks),
        max(t.y1 for t in toks),
    )


def _regex_hits(
    page_text: dict[int, tuple[str, list[tuple[int, int, Token]]]],
    pattern: re.Pattern[str],
    typ: str,
    severity: Severity,
) -> list[Hit]:
    hits: list[Hit] = []
    for page, (text, spans) in page_text.items():
        for m in pattern.finditer(text):
            toks = _tokens_in_span(spans, m.start(), m.end())
            if not toks:
                continue
            x0, y0, x1, y1 = _union_bbox(toks)
            hits.append(Hit(page, x0, y0, x1, y1, typ, m.group(0).strip(), severity))
    return hits


def _ner_hits(
    page_text: dict[int, tuple[str, list[tuple[int, int, Token]]]],
) -> list[Hit]:
    hits: list[Hit] = []
    for page, (text, spans) in page_text.items():
        for m in _NER_SEQ.finditer(text):
            phrase = m.group(0).strip()
            first = phrase.split()[0]
            has_legal_form = bool(re.search(r"\b(?:GmbH|AG|KG|mbH|SE|UG)\b", phrase))
            # Dämpfung: reine Satzanfänge ohne Rechtsform überspringen.
            if first in _NER_STOP_PREFIX and not has_legal_form:
                continue
            toks = _tokens_in_span(spans, m.start(), m.end())
            if not toks:
                continue
            x0, y0, x1, y1 = _union_bbox(toks)
            typ = "org" if has_legal_form else "person"
            hits.append(Hit(page, x0, y0, x1, y1, typ, phrase, Severity.AMBER))
    return hits


def _deny_hits(
    page_text: dict[int, tuple[str, list[tuple[int, int, Token]]]],
    terms: tuple[str, ...],
    typ: str,
) -> list[Hit]:
    hits: list[Hit] = []
    for page, (text, spans) in page_text.items():
        low = text.lower()
        for term in terms:
            start = 0
            while True:
                idx = low.find(term, start)
                if idx < 0:
                    break
                toks = _tokens_in_span(spans, idx, idx + len(term))
                if toks:
                    x0, y0, x1, y1 = _union_bbox(toks)
                    hits.append(Hit(page, x0, y0, x1, y1, typ, term, Severity.RED))
                start = idx + len(term)
    return hits


def _qr_hits(pdf_bytes: bytes, policy: PolicyConfig) -> tuple[list[Hit], bool]:
    """
    Rendert Seiten und sucht QR/Barcodes. Der DECODIERTE Inhalt wird NIE
    zurückgegeben — nur die zu schwärzende Region. Gibt (hits, available).
    """
    if not _ZBAR_AVAILABLE or _zbar_decode is None:
        return [], False
    from PIL import Image

    hits: list[Hit] = []
    zoom = policy.ocr_dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        for pno in range(doc.page_count):
            page = doc.load_page(pno)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            for sym in _zbar_decode(img):
                r = sym.rect
                x0 = r.left / zoom
                y0 = r.top / zoom
                x1 = (r.left + r.width) / zoom
                y1 = (r.top + r.height) / zoom
                # typ trägt KEINEN decodierten Klartext.
                hits.append(Hit(pno, x0, y0, x1, y1, "qr", "[QR]", Severity.AMBER))
    finally:
        doc.close()
    return hits, True


def run_detectors(
    pdf_bytes: bytes, tokens: list[Token], policy: PolicyConfig
) -> tuple[list[Hit], list[DetectorResult]]:
    page_text = _build_page_text(tokens)

    # pii_regex (aggregiert mehrere Muster in einen Detektor).
    pii_hits: list[Hit] = []
    for typ, pat in _PII_PATTERNS:
        pii_hits.extend(_regex_hits(page_text, pat, typ, Severity.AMBER))

    ner_hits = _ner_hits(page_text)

    addr_hits = _regex_hits(page_text, _ADDRESS_STREET, "address", Severity.AMBER)
    addr_hits += _regex_hits(page_text, _ADDRESS_PLZ, "address", Severity.AMBER)

    health_hits = _deny_hits(page_text, HEALTH_TERMS, "health")
    mandate_hits = _deny_hits(page_text, MANDATE_TERMS, "mandate")

    qr_hits, qr_available = _qr_hits(pdf_bytes, policy)

    if qr_available:
        qr_detector = DetectorResult(
            "qr_barcode", policy.v("qr_barcode"),
            flagged=bool(qr_hits),
            severity=Severity.AMBER if qr_hits else Severity.NONE,
            confidence=1.0,
            detail=(f"{len(qr_hits)} codes" if qr_hits else None),
        )
    else:
        # Scanner NICHT verfügbar ≠ sauber: Coverage unverifiziert ⇒ fail-closed
        # AMBER-Befund, damit ein Dok mit ungeprüftem QR nicht GREEN passiert.
        qr_detector = DetectorResult(
            "qr_barcode", policy.v("qr_barcode"),
            flagged=True,
            severity=Severity.AMBER,
            confidence=0.0,
            detail="qr_scanner_unavailable: pyzbar/libzbar0 missing; coverage unverified",
        )

    detectors = [
        DetectorResult(
            "pii_regex", policy.v("pii_regex"),
            flagged=bool(pii_hits), severity=Severity.AMBER if pii_hits else Severity.NONE,
            confidence=1.0,
            detail=f"{len(pii_hits)} hits" if pii_hits else None,
        ),
        DetectorResult(
            "ner_persons_orgs", policy.v("ner_persons_orgs"),
            flagged=bool(ner_hits), severity=Severity.AMBER if ner_hits else Severity.NONE,
            # Heuristik (kein statistisches Modell) ⇒ Confidence < 1.0 (ehrlich).
            confidence=0.9,
            detail="heuristic" + (f":{len(ner_hits)}" if ner_hits else ""),
        ),
        DetectorResult(
            "addresses", policy.v("addresses"),
            flagged=bool(addr_hits), severity=Severity.AMBER if addr_hits else Severity.NONE,
            confidence=0.95,
            detail=f"{len(addr_hits)} hits" if addr_hits else None,
        ),
        DetectorResult(
            "health_terms", policy.v("health_terms"),
            flagged=bool(health_hits), severity=Severity.RED if health_hits else Severity.NONE,
            confidence=1.0,
            detail="deny_hit" if health_hits else None,
        ),
        DetectorResult(
            "mandate_terms", policy.v("mandate_terms"),
            flagged=bool(mandate_hits), severity=Severity.RED if mandate_hits else Severity.NONE,
            confidence=1.0,
            detail="deny_hit" if mandate_hits else None,
        ),
        qr_detector,
    ]

    all_hits = pii_hits + ner_hits + addr_hits + health_hits + mandate_hits + qr_hits
    return all_hits, detectors
