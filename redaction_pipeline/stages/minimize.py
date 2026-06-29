"""
Stufe E — Minimierung.

Baut MinimizedFields: NUR redactedText, documentKind, optional language.
Keine Beträge/IBANs/Namen, außer eine explizite Tenant-Policy gibt ein Feld
frei (hier bewusst nicht implementiert — default-deny).
"""
from __future__ import annotations

import re

from ..contract import MinimizedFields

_KIND_HINTS: list[tuple[str, str]] = [
    ("contract", r"\b(vertrag|vereinbarung|nda|geheimhaltung|mietvertrag|gesellschaftsvertrag)\b"),
    ("invoice", r"\b(rechnung|invoice|betrag|umsatzsteuer|rechnungsnummer)\b"),
    ("filing", r"\b(klage|anklage|gericht|aktenzeichen|beschluss)\b"),
    ("letter", r"\b(sehr geehrte|mit freundlichen grüßen|betreff)\b"),
]


def _infer_kind(redacted_text: str) -> str:
    low = redacted_text.lower()
    for kind, pat in _KIND_HINTS:
        if re.search(pat, low):
            return kind
    return "unknown"


def minimize(
    redacted_text: str,
    document_kind: str | None = None,
    language: str | None = "de",
) -> MinimizedFields:
    kind = document_kind or _infer_kind(redacted_text)
    return MinimizedFields(
        redactedText=redacted_text,
        documentKind=kind,
        language=language,
    )
