"""
Tenant-Scope (opaker Hash) und per-Tenant-Schlüsselableitung.

`tenantScope` im Output ist NIE die Kanzlei-/Mandantenbezeichnung, sondern
ein opaker, nicht umkehrbarer Hash. Der per-Tenant-Mapping-Key wird via
HKDF aus einem lokalen Master-Secret + tenant_id abgeleitet — der Key
verlässt den Server nie.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import logging
import os
import re

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

logger = logging.getLogger("redaction_pipeline.tenant")

# Master-Secret AUSSCHLIESSLICH lokal (Hetzner). In Prod via systemd-Env /
# Secrets-File. KEIN stiller Fallback (fail-closed, § 203 StGB-Kontext).
_MASTER_ENV = "REDACTION_MASTER_KEY"
# Escape-Hatch nur für lokale Entwicklung/CI — DARF auf Prod NIE gesetzt sein.
_ALLOW_DEV_ENV = "REDACTION_ALLOW_DEV_KEY"
_MIN_KEY_BYTES = 32

# Dev-Only Fallback (>= 32 Bytes) — nur mit explizitem Opt-in nutzbar.
_DEV_KEY = b"dev-only-master-secret-not-for-production"


class MasterKeyError(RuntimeError):
    """Master-Key fehlt oder ist zu schwach — fail-closed, kein Fallback."""


def _decode_key_material(raw: str) -> bytes:
    """
    Interpretiert den Env-Wert. Reihenfolge: strikt-Hex → strikt-Base64 →
    roh-UTF-8. Die Längenprüfung erfolgt danach auf den DEKODIERTEN Bytes,
    damit z.B. 32 zufällige Bytes als 64-Zeichen-Hex nicht fälschlich als
    "zu lang aber schwach" durchgehen.
    """
    s = raw.strip()
    # Strikt Hex: nur Hex-Zeichen, gerade Länge, >= 64 Zeichen (=32 Bytes).
    if len(s) >= 64 and len(s) % 2 == 0 and re.fullmatch(r"[0-9a-fA-F]+", s):
        try:
            return bytes.fromhex(s)
        except ValueError:
            pass
    # Strikt Base64: Alphabet + Padding, sauber dekodierbar, >= 44 Zeichen.
    if len(s) >= 44 and len(s) % 4 == 0 and re.fullmatch(r"[A-Za-z0-9+/]+={0,2}", s):
        try:
            return base64.b64decode(s, validate=True)
        except (binascii.Error, ValueError):
            pass
    return s.encode("utf-8")


def load_master_key() -> bytes:
    """
    LAZY Auflösung des Master-Keys (NICHT beim Import). Fail-closed:

    - REDACTION_MASTER_KEY gesetzt → dekodieren + >= 32 Bytes erzwingen.
    - sonst REDACTION_ALLOW_DEV_KEY == "1" → Dev-Key + logger.warning.
    - sonst MasterKeyError (kein stiller Fallback).
    """
    raw = os.environ.get(_MASTER_ENV)
    if raw:
        key = _decode_key_material(raw)
        if len(key) < _MIN_KEY_BYTES:
            raise MasterKeyError(
                f"{_MASTER_ENV} zu kurz: {len(key)} Bytes (>= {_MIN_KEY_BYTES} erforderlich)."
            )
        return key

    if os.environ.get(_ALLOW_DEV_ENV) == "1":
        logger.warning(
            "%s fehlt — Dev-Fallback aktiv (%s=1). NIEMALS auf einem Prod-Host setzen.",
            _MASTER_ENV,
            _ALLOW_DEV_ENV,
        )
        return _DEV_KEY

    raise MasterKeyError(
        f"{_MASTER_ENV} nicht gesetzt. Fail-closed: kein stiller Fallback. "
        f"Für lokale Entwicklung/CI {_ALLOW_DEV_ENV}=1 setzen."
    )


def tenant_scope(tenant_id: str) -> str:
    """
    Opaker, stabiler Hash der tenant_id für den Output. Nicht umkehrbar,
    nicht sprechend. Format: t_<hex>.
    """
    mac = hmac.new(load_master_key(), tenant_id.encode("utf-8"), hashlib.sha256)
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
    return hkdf.derive(load_master_key())
