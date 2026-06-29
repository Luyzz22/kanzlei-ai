"""
AES-verschlüsselte, per-Tenant getrennte Persistenz des Re-Identifikations-
Mappings (Platzhalter ↔ Original).

Das Mapping verlässt NIE den Output-Vertrag. Es wird AES-GCM-verschlüsselt
mit dem per-Tenant-Key (tenant.derive_tenant_key) lokal abgelegt, getrennt
vom Payload. Ohne Key nicht lesbar.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .tenant import derive_tenant_key, tenant_scope

# Lokales, getrenntes Verzeichnis. In Prod auf verschlüsseltem Volume.
_STORE_DIR = Path(os.environ.get("REDACTION_MAPPING_DIR", "/var/lib/redaction/mappings"))


def _store_path(tenant_id: str, job_ref: str) -> Path:
    # Dateiname enthält nur opaken tenantScope + jobRef — nichts Sprechendes.
    safe_job = "".join(ch for ch in job_ref if ch.isalnum() or ch == "_")
    return _STORE_DIR / tenant_scope(tenant_id) / f"{safe_job}.bin"


def save_mapping(
    tenant_id: str,
    job_ref: str,
    mapping: dict[str, str],
    *,
    store_dir: Path | None = None,
) -> Path:
    """
    Verschlüsselt das Mapping (AES-256-GCM, per-Tenant-Key) und schreibt es
    lokal. Gibt den Pfad zurück. Das Mapping selbst wird NICHT zurückgegeben.
    """
    key = derive_tenant_key(tenant_id)
    aes = AESGCM(key)
    nonce = os.urandom(12)
    plaintext = json.dumps(mapping, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ct = aes.encrypt(nonce, plaintext, associated_data=job_ref.encode("utf-8"))

    base = store_dir if store_dir is not None else _STORE_DIR
    safe_scope = tenant_scope(tenant_id)
    safe_job = "".join(ch for ch in job_ref if ch.isalnum() or ch == "_")
    path = base / safe_scope / f"{safe_job}.bin"
    path.parent.mkdir(parents=True, exist_ok=True)
    # Format: v1 + nonce(12) + ciphertext. Atomic write.
    tmp = path.with_suffix(".tmp")
    tmp.write_bytes(b"v1" + nonce + ct)
    os.replace(tmp, path)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return path


def load_mapping(
    tenant_id: str,
    job_ref: str,
    *,
    store_dir: Path | None = None,
) -> dict[str, str]:
    """
    Entschlüsselt das Mapping (nur mit korrektem per-Tenant-Key möglich).
    Ausschließlich für den lokalen Re-Identifikations-Pfad auf Hetzner.
    """
    base = store_dir if store_dir is not None else _STORE_DIR
    safe_scope = tenant_scope(tenant_id)
    safe_job = "".join(ch for ch in job_ref if ch.isalnum() or ch == "_")
    path = base / safe_scope / f"{safe_job}.bin"
    raw = path.read_bytes()
    if not raw.startswith(b"v1"):
        raise ValueError("Unbekanntes Mapping-Format")
    body = raw[2:]
    nonce, ct = body[:12], body[12:]
    key = derive_tenant_key(tenant_id)
    aes = AESGCM(key)
    plaintext = aes.decrypt(nonce, ct, associated_data=job_ref.encode("utf-8"))
    return json.loads(plaintext.decode("utf-8"))
