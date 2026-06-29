"""
Tenant-Scope (opaker Hash) und per-Tenant-Schlüsselableitung.

`tenantScope` im Output ist NIE die Kanzlei-/Mandantenbezeichnung, sondern
ein opaker, nicht umkehrbarer Hash. Der per-Tenant-Mapping-Key wird via
HKDF aus einem lokalen Master-Secret + tenant_id abgeleitet — der Key
verlässt den Server nie.
"""
from __future__ import annotations

import hashlib
import hmac
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

# Master-Secret AUSSCHLIESSLICH lokal (Hetzner). In Prod via systemd-Env /
# Secrets-File. Fällt auf eine Dev-Konstante zurück (nur lokal nutzbar).
_MASTER_ENV = "REDACTION_MASTER_KEY"


def _master_secret() -> bytes:
    raw = os.environ.get(_MASTER_ENV)
    if raw:
        return raw.encode("utf-8")
    # Dev-Fallback — NICHT für Prod. Deterministisch, damit Tests laufen.
    return b"dev-only-master-secret-not-for-production"


def tenant_scope(tenant_id: str) -> str:
    """
    Opaker, stabiler Hash der tenant_id für den Output. Nicht umkehrbar,
    nicht sprechend. Format: t_<hex>.
    """
    mac = hmac.new(_master_secret(), tenant_id.encode("utf-8"), hashlib.sha256)
    return "t_" + mac.hexdigest()[:32]


def derive_tenant_key(tenant_id: str) -> bytes:
    """
    Leitet einen 32-Byte AES-Key pro Tenant ab (HKDF-SHA256).
    Bleibt lokal; wird nur zum Ver-/Entschlüsseln des Mappings genutzt.
    """
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"redaction-mapping-v1",
        info=tenant_id.encode("utf-8"),
    )
    return hkdf.derive(_master_secret())
