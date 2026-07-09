"""
Stufe D — Redaction (Pixel, nicht Text).

- Echte Redaction auf dem PDF via fitz (add_redact_annot + apply_redactions):
  entfernt Text UND darunterliegende Pixel (stärker als schwarze Rechtecke
  über einem intakten Textlayer).
- Erzeugt `redactedText` mit stabilen Platzhaltern [GESCHWÄRZT:typ:pseudonym].
- Mapping Platzhalter↔Original wird AES-verschlüsselt lokal persistiert
  (per-Tenant-Key), getrennt vom Payload — verlässt NIE den Output.
- Safety-Net: re-scannt den redactedText; residuale Geheimnisse ⇒
  confidence < min_coverage + Severity-Eskalation (fail-closed).
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

import fitz

from ..config import PolicyConfig
from ..contract import DetectorResult, Severity
from ..deny_terms import HEALTH_TERMS, MANDATE_TERMS
from .detect import Hit, _PII_PATTERNS
from .ocr_layout import Token


@dataclass(frozen=True)
class RedactionResult:
    redacted_text: str
    mapping: dict[str, str]  # placeholder -> original (bleibt LOKAL)
    detector: DetectorResult


def _pseudonym(tenant_id: str, typ: str, text: str) -> str:
    h = hashlib.sha256(f"{tenant_id}|{typ}|{text}".encode("utf-8")).hexdigest()
    # base36-artig kurz, stabil.
    return typ + "_" + h[:8]


def _overlaps(t: Token, h: Hit) -> bool:
    if t.page != h.page:
        return False
    return not (t.x1 <= h.x0 or t.x0 >= h.x1 or t.y1 <= h.y0 or t.y0 >= h.y1)


def _placeholder(typ: str, pseudonym: str) -> str:
    return f"[GESCHWÄRZT:{typ}:{pseudonym}]"


def apply_true_redaction(pdf_bytes: bytes, hits: list[Hit]) -> bytes:
    """Echte Redaction auf dem PDF (Text+Pixel). Bleibt lokal."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        for h in hits:
            page = doc.load_page(h.page)
            rect = fitz.Rect(h.x0, h.y0, h.x1, h.y1)
            if rect.is_empty or rect.is_infinite:
                continue
            page.add_redact_annot(rect, fill=(0, 0, 0))
        for pno in range(doc.page_count):
            doc.load_page(pno).apply_redactions()
        return doc.tobytes(garbage=4, deflate=True, clean=True)
    finally:
        doc.close()


def _scrub_residual(
    tenant_id: str, text: str, mapping: dict[str, str]
) -> tuple[str, bool, bool]:
    """
    Letzter Sicherheitsnetz-Pass: ersetzt JEDES residuale Geheimnis im
    zusammengebauten redactedText durch einen Platzhalter. Garantiert, dass
    `fields` keinen Klartext-Geheimnis-Token enthält (0-Leak), auch wenn die
    Koordinaten-Erkennung eine Stelle verfehlt hat.

    Gibt (scrubbed_text, brauchte_pii_fallback, brauchte_deny_fallback) zurück.
    """
    used_pii = False
    used_deny = False

    def _repl_factory(typ: str):
        nonlocal used_pii, used_deny

        def _repl(m: "re.Match[str]") -> str:
            nonlocal used_pii, used_deny
            secret = m.group(0)
            pseudo = _pseudonym(tenant_id, typ, secret)
            ph = _placeholder(typ, pseudo)
            mapping[ph] = secret
            if typ == "deny":
                used_deny = True
            else:
                used_pii = True
            return ph

        return _repl

    out = text
    for typ, pat in _PII_PATTERNS:
        out = pat.sub(_repl_factory(typ), out)

    # Deny-Begriffe wortweise (case-insensitive) ersetzen.
    for term in (*HEALTH_TERMS, *MANDATE_TERMS):
        pat = re.compile(re.escape(term), re.IGNORECASE)
        out = pat.sub(_repl_factory("deny"), out)

    return out, used_pii, used_deny


def redact(
    tenant_id: str,
    tokens: list[Token],
    hits: list[Hit],
    policy: PolicyConfig,
) -> RedactionResult:
    # Jedem Hit Pseudonym + Platzhalter zuordnen.
    hit_meta: list[tuple[Hit, str]] = []  # (hit, placeholder)
    mapping: dict[str, str] = {}
    for h in hits:
        pseudo = _pseudonym(tenant_id, h.typ, h.text)
        ph = _placeholder(h.typ, pseudo)
        hit_meta.append((h, ph))
        # Mapping bleibt LOKAL. QR-Inhalt wird NICHT gespeichert (kein Klartext bekannt).
        if h.typ != "qr":
            mapping[ph] = h.text

    # Token → zugehöriger Hit-Platzhalter (erster überlappender Hit).
    token_tag: dict[int, str] = {}
    redacted_token_ids: set[int] = set()
    hits_with_token: set[int] = set()
    for hi, (h, ph) in enumerate(hit_meta):
        for ti, t in enumerate(tokens):
            if _overlaps(t, h):
                token_tag.setdefault(ti, ph)
                redacted_token_ids.add(ti)
                hits_with_token.add(hi)

    # redactedText in Lesereihenfolge zusammenbauen; Token-Runs desselben
    # Platzhalters zu EINEM Platzhalter kollabieren.
    order = sorted(
        range(len(tokens)),
        key=lambda i: (tokens[i].page, round(tokens[i].y0, 1), round(tokens[i].x0, 1)),
    )
    parts: list[str] = []
    last_ph: str | None = None
    for i in order:
        if i in token_tag:
            ph = token_tag[i]
            if ph != last_ph:
                parts.append(ph)
                last_ph = ph
        else:
            parts.append(tokens[i].text)
            last_ph = None
    redacted_text = " ".join(parts)

    # Confidence = Anteil Hits, die mind. ein Token sicher geschwärzt haben.
    total_hits = len(hit_meta)
    if total_hits == 0:
        base_conf = 1.0
    else:
        base_conf = len(hits_with_token) / total_hits

    # Safety-Net: residuale Geheimnisse aus dem finalen Text ENTFERNEN
    # (nicht nur flaggen) — garantiert 0-Leak in `fields`.
    redacted_text, used_pii_fb, used_deny_fb = _scrub_residual(
        tenant_id, redacted_text, mapping
    )

    severity = Severity.NONE
    detail_bits: list[str] = []
    confidence = base_conf
    if used_deny_fb:
        # Deny-Begriff erst im Fallback gefangen ⇒ RED (fail-closed).
        severity = Severity.RED
        confidence = 0.0
        detail_bits.append("fallback_deny")
    if used_pii_fb:
        if severity.rank() < Severity.AMBER.rank():
            severity = Severity.AMBER
        confidence = min(confidence, policy.min_coverage - 0.01)
        detail_bits.append("fallback_pii")

    flagged = severity != Severity.NONE or confidence < 1.0
    detail = ",".join(detail_bits) if detail_bits else f"redacted={len(redacted_token_ids)}"

    return RedactionResult(
        redacted_text=redacted_text,
        mapping=mapping,
        detector=DetectorResult(
            name="redaction",
            version=policy.v("redaction"),
            flagged=flagged,
            severity=severity,
            confidence=round(confidence, 4),
            detail=detail,
        ),
    )
