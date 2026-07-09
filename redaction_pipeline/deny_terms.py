"""
Deny-Listen hochsensibler Begriffe (DE).

Treffer ⇒ severity=RED (hartes Geheimnis, NIE Cloud). Fail-closed:
lieber ein Begriff zu viel auf der Liste als ein Leak.

Die Listen sind bewusst klein, kuratiert und deterministisch. Erweiterung
erhöht die Detektor-Version in config.DETECTOR_VERSIONS.
"""
from __future__ import annotations

# Gesundheits-/Diagnosebegriffe (§ 203 StGB, Art. 9 DSGVO besondere Kategorien).
HEALTH_TERMS: tuple[str, ...] = (
    "diagnose",
    "befund",
    "icd-10",
    "icd10",
    "karzinom",
    "tumor",
    "depression",
    "hiv",
    "schwangerschaft",
    "arbeitsunfähig",
    "arbeitsunfähigkeit",
    "psychotherapie",
    "medikation",
    "krankschreibung",
    "schwerbehinderung",
    "suchterkrankung",
)

# Mandats-/Verfahrensgegenstand (anwaltliches Berufsgeheimnis).
MANDATE_TERMS: tuple[str, ...] = (
    "verfahrensgegenstand",
    "tatvorwurf",
    "beschuldigte",
    "beschuldigter",
    "ermittlungsverfahren",
    "anklageschrift",
    "scheidung",
    "insolvenzverfahren",
    "strafbefehl",
    "haftbefehl",
    "vergleichsverhandlung",
    "mandatsgegenstand",
)


def find_terms(text_lower: str, terms: tuple[str, ...]) -> list[str]:
    """Gibt die in text_lower gefundenen Begriffe zurück (deterministisch sortiert)."""
    hits = {t for t in terms if t in text_lower}
    return sorted(hits)
