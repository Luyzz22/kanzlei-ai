"""
Policy-Konfiguration & Detektor-Versionen.

Determinismus: alle Versionen und Schwellwerte sind hier zentral fixiert.
Gleiche Eingabe + gleiche PolicyConfig → gleiche Befunde (GoBD-Nachweis).
"""
from __future__ import annotations

from dataclasses import dataclass, field

POLICY_VERSION = "1.0.0"

# Detektor-Versionen (semver). Bei Logikänderung HOCHZÄHLEN.
DETECTOR_VERSIONS: dict[str, str] = {
    "sanitizer": "1.0.0",
    "ocr": "1.0.0",
    "pii_regex": "1.2.0",
    "ner_persons_orgs": "1.0.0",
    "addresses": "1.0.0",
    "health_terms": "1.0.0",
    "mandate_terms": "1.0.0",
    "qr_barcode": "1.0.0",
    "redaction": "1.0.0",
}


@dataclass(frozen=True)
class PolicyConfig:
    # Pflicht-Detektor-Confidence unter diesem Wert ⇒ Gate setzt AMBER.
    min_coverage: float = 0.98
    # OCR-DPI für gerenderte Seiten (Scan-Pfad).
    ocr_dpi: int = 300
    # Tesseract-Sprache.
    ocr_lang: str = "deu"
    # Mindest-Tesseract-Wort-Confidence (0..100), darunter gilt Token als unsicher.
    ocr_min_word_conf: float = 60.0
    policy_version: str = POLICY_VERSION
    detector_versions: dict[str, str] = field(
        default_factory=lambda: dict(DETECTOR_VERSIONS)
    )

    def v(self, name: str) -> str:
        return self.detector_versions.get(name, "0.0.0")


DEFAULT_POLICY = PolicyConfig()
