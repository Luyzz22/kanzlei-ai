"""
Fail-closed Master-Key-Auflösung (FIX 1).

Regeln:
- Fehlt REDACTION_MASTER_KEY und ist REDACTION_ALLOW_DEV_KEY != "1" ⇒ MasterKeyError.
- Dev-Fallback nur mit explizitem Flag.
- Key wird (Hex/Base64/roh) dekodiert; danach >= 32 Bytes erzwungen.
"""
from __future__ import annotations

import base64

import pytest

from redaction_pipeline.tenant import (
    _DEV_KEY,
    _MIN_KEY_BYTES,
    MasterKeyError,
    derive_tenant_key,
    load_master_key,
    tenant_scope,
)

MASTER = "REDACTION_MASTER_KEY"
ALLOW = "REDACTION_ALLOW_DEV_KEY"


def test_fail_closed_when_missing(monkeypatch):
    monkeypatch.delenv(MASTER, raising=False)
    monkeypatch.delenv(ALLOW, raising=False)
    with pytest.raises(MasterKeyError):
        load_master_key()
    # Fail-closed muss sich bis in die Call-Sites durchziehen.
    with pytest.raises(MasterKeyError):
        tenant_scope("t1")
    with pytest.raises(MasterKeyError):
        derive_tenant_key("t1")


def test_dev_fallback_requires_flag(monkeypatch):
    monkeypatch.delenv(MASTER, raising=False)
    # Ohne Flag: Fehler.
    monkeypatch.delenv(ALLOW, raising=False)
    with pytest.raises(MasterKeyError):
        load_master_key()
    # Mit Flag: Dev-Key (>= 32 Bytes).
    monkeypatch.setenv(ALLOW, "1")
    key = load_master_key()
    assert key == _DEV_KEY
    assert len(key) >= _MIN_KEY_BYTES


def test_from_env_raw_utf8(monkeypatch):
    monkeypatch.setenv(MASTER, "a-very-long-and-sufficiently-strong-passphrase")
    key = load_master_key()
    assert key == b"a-very-long-and-sufficiently-strong-passphrase"


def test_from_env_hex_decoded(monkeypatch):
    # 32 Bytes als 64-Zeichen-Hex.
    raw = bytes(range(32))
    monkeypatch.setenv(MASTER, raw.hex())
    assert load_master_key() == raw


def test_from_env_base64_decoded(monkeypatch):
    raw = bytes(range(32))
    monkeypatch.setenv(MASTER, base64.b64encode(raw).decode("ascii"))
    assert load_master_key() == raw


def test_rejects_short_key(monkeypatch):
    monkeypatch.delenv(ALLOW, raising=False)
    monkeypatch.setenv(MASTER, "short")
    with pytest.raises(MasterKeyError):
        load_master_key()


def test_short_key_not_rescued_by_dev_flag(monkeypatch):
    # Explizit gesetzter (zu kurzer) Key darf NICHT still auf Dev-Key fallen.
    monkeypatch.setenv(ALLOW, "1")
    monkeypatch.setenv(MASTER, "tooshort")
    with pytest.raises(MasterKeyError):
        load_master_key()
