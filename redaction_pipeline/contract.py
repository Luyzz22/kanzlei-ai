"""
Output-Vertrag der lokalen Redaction-Pipeline.

Dies ist die EINZIGE Datenstruktur, die die Hetzner-Grenze passiert. Sie dockt
exakt an das TS-Keystone (`GateInput` mit `fields` + `detectors`) an.

VERBOTEN in dieser Struktur: Original-Bytes, Seitenbilder, Mapping,
Klartext-Geheimnisse, sprechende Mandats-/Tenant-IDs.

Fail-closed: Im Zweifel höhere Severity, niedrigere Confidence.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any


class Severity(str, Enum):
    NONE = "none"
    AMBER = "amber"
    RED = "red"

    def rank(self) -> int:
        return {"none": 0, "amber": 1, "red": 2}[self.value]


# Erlaubte documentKind-Werte (minimiert, nicht sprechend).
ALLOWED_DOCUMENT_KINDS = frozenset(
    {"contract", "invoice", "letter", "filing", "unknown"}
)

_JOBREF_RE = re.compile(r"^job_[A-Za-z0-9]{16,}$")
_TENANTSCOPE_RE = re.compile(r"^t_[0-9a-f]{8,}$")


@dataclass(frozen=True)
class DetectorResult:
    """Ergebnis eines einzelnen versionierten Detektors."""

    name: str
    version: str
    flagged: bool
    severity: Severity
    confidence: float
    detail: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "name": self.name,
            "version": self.version,
            "flagged": self.flagged,
            "severity": self.severity.value,
            "confidence": round(float(self.confidence), 4),
        }
        if self.detail is not None:
            d["detail"] = self.detail
        return d


@dataclass(frozen=True)
class MinimizedFields:
    """Minimierte Felder — nur das, was die Cloud sehen darf."""

    redactedText: str
    documentKind: str = "unknown"
    language: str | None = "de"

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "redactedText": self.redactedText,
            "documentKind": self.documentKind,
        }
        if self.language is not None:
            d["language"] = self.language
        return d


@dataclass(frozen=True)
class PipelineOutput:
    """Vollständiger Output-Vertrag."""

    jobRef: str
    tenantScope: str
    fields: MinimizedFields
    detectors: list[DetectorResult] = field(default_factory=list)
    policyVersion: str = "0.0.0"

    def to_dict(self) -> dict[str, Any]:
        return {
            "jobRef": self.jobRef,
            "tenantScope": self.tenantScope,
            "policyVersion": self.policyVersion,
            "fields": self.fields.to_dict(),
            "detectors": [d.to_dict() for d in self.detectors],
        }

    def max_severity(self) -> Severity:
        sev = Severity.NONE
        for d in self.detectors:
            if d.severity.rank() > sev.rank():
                sev = d.severity
        return sev


class OutputContractError(ValueError):
    """Strikte Verletzung des Output-Vertrags (fail-closed)."""


# Felder, die im Output-Dict NIE vorkommen dürfen (Defense-in-Depth).
_FORBIDDEN_KEYS = frozenset(
    {
        "original",
        "originalBytes",
        "pageImages",
        "images",
        "mapping",
        "reidentification",
        "rawText",
        "sourceText",
        "filename",
        "tenantId",
        "mandate",
        "mandant",
    }
)


def _assert_no_forbidden_keys(obj: Any, path: str = "$") -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in _FORBIDDEN_KEYS:
                raise OutputContractError(
                    f"Verbotener Schlüssel '{k}' im Output unter {path}"
                )
            _assert_no_forbidden_keys(v, f"{path}.{k}")
    elif isinstance(obj, (list, tuple)):
        for i, v in enumerate(obj):
            _assert_no_forbidden_keys(v, f"{path}[{i}]")


def validate_output(out: PipelineOutput) -> dict[str, Any]:
    """
    Strikte Validierung des Output-Vertrags. Wirft bei jeder Verletzung
    (fail-closed). Gibt das serialisierbare Dict zurück.
    """
    if not _JOBREF_RE.match(out.jobRef):
        raise OutputContractError(f"Ungültige jobRef: {out.jobRef!r}")
    if not _TENANTSCOPE_RE.match(out.tenantScope):
        raise OutputContractError(
            f"tenantScope muss opaker Hash 't_<hex>' sein, nicht {out.tenantScope!r}"
        )
    if out.fields.documentKind not in ALLOWED_DOCUMENT_KINDS:
        raise OutputContractError(
            f"Unbekannter documentKind: {out.fields.documentKind!r}"
        )
    if not isinstance(out.fields.redactedText, str):
        raise OutputContractError("redactedText muss str sein")

    seen_names: set[str] = set()
    for d in out.detectors:
        if not (0.0 <= d.confidence <= 1.0):
            raise OutputContractError(
                f"Detektor {d.name}: confidence {d.confidence} außerhalb [0,1]"
            )
        if not re.match(r"^\d+\.\d+\.\d+$", d.version):
            raise OutputContractError(
                f"Detektor {d.name}: version {d.version!r} ist kein semver"
            )
        seen_names.add(d.name)

    # Pflichtdetektoren müssen vorhanden sein (kein stilles Weglassen).
    required = {"sanitizer", "ocr", "pii_regex", "redaction"}
    missing = required - seen_names
    if missing:
        raise OutputContractError(
            f"Pflichtdetektoren fehlen im Output: {sorted(missing)}"
        )

    d = out.to_dict()
    _assert_no_forbidden_keys(d)
    return d
