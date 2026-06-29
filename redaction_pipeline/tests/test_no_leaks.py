"""
Kern-Akzeptanztest: 0 Leaks geheimer Tokens in `fields` über den
gesamten Red-Team-Korpus.
"""
from __future__ import annotations

import re

from redaction_pipeline import run_pipeline

TENANT = "kanzlei-dermalog"


def _normalize(s: str) -> str:
    # Leerzeichen entfernen, damit "DE89 3704..." auch ohne Spaces gefangen wird.
    return re.sub(r"\s+", "", s).lower()


def test_corpus_has_min_30_docs(corpus):
    assert len(corpus) >= 30, f"Korpus zu klein: {len(corpus)}"


def test_no_secret_leaks_in_fields(corpus, mapping_dir):
    leaks: list[str] = []
    for doc in corpus:
        out = run_pipeline(
            doc.pdf_bytes, TENANT, mapping_store_dir=mapping_dir
        )
        redacted = out["fields"]["redactedText"]
        redacted_norm = _normalize(redacted)
        for secret in doc.secrets:
            # QR-Geheimnisse liegen im Bild, nie im Text — separat geprüft.
            if doc.has_qr and secret in (s for s in doc.secrets):
                # Auch hier darf das IBAN nicht als Text auftauchen.
                pass
            if _normalize(secret) in redacted_norm:
                leaks.append(f"{doc.name}: '{secret}' in redactedText")
    assert not leaks, "LEAKS gefunden:\n" + "\n".join(leaks)


def test_output_never_contains_mapping_or_original(corpus, mapping_dir):
    for doc in corpus:
        out = run_pipeline(doc.pdf_bytes, TENANT, mapping_store_dir=mapping_dir)
        keys = set(out.keys())
        assert "mapping" not in keys
        assert "original" not in keys
        assert "pageImages" not in keys
        # tenantScope ist opak, nicht sprechend.
        assert out["tenantScope"].startswith("t_")
        assert "dermalog" not in out["tenantScope"].lower()
