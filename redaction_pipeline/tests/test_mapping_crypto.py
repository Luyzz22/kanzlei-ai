"""Mapping: AES-verschlüsselt, per-Tenant, ohne Key nicht lesbar."""
from __future__ import annotations

import pytest

from redaction_pipeline.mapping_store import load_mapping, save_mapping
from redaction_pipeline.tenant import derive_tenant_key, tenant_scope


def test_roundtrip(mapping_dir):
    m = {"[GESCHWÄRZT:iban:iban_abc12345]": "DE89 3704 0044 0532 0130 00"}
    save_mapping("tenant-a", "job_" + "a" * 16, m, store_dir=mapping_dir)
    back = load_mapping("tenant-a", "job_" + "a" * 16, store_dir=mapping_dir)
    assert back == m


def test_wrong_tenant_cannot_read(mapping_dir):
    m = {"[GESCHWÄRZT:iban:x]": "DE89 3704 0044 0532 0130 00"}
    save_mapping("tenant-a", "job_" + "b" * 16, m, store_dir=mapping_dir)
    with pytest.raises(Exception):
        # Anderer Tenant → anderer Key → Entschlüsselung schlägt fehl.
        load_mapping("tenant-b", "job_" + "b" * 16, store_dir=mapping_dir)


def test_ciphertext_has_no_plaintext(mapping_dir):
    secret = "DE89 3704 0044 0532 0130 00"
    m = {"[GESCHWÄRZT:iban:x]": secret}
    path = save_mapping("tenant-a", "job_" + "c" * 16, m, store_dir=mapping_dir)
    raw = path.read_bytes()
    assert secret.encode("utf-8") not in raw
    assert b"GESCH" not in raw


def test_tenant_scope_opaque():
    s = tenant_scope("dermalog-hamburg")
    assert s.startswith("t_")
    assert "dermalog" not in s
    # stabil
    assert s == tenant_scope("dermalog-hamburg")


def test_keys_differ_per_tenant():
    assert derive_tenant_key("a") != derive_tenant_key("b")
