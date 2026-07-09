import os
import sys
from pathlib import Path

import pytest

# Repo-Root in sys.path, damit `import redaction_pipeline` funktioniert.
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


@pytest.fixture(scope="session")
def corpus():
    from redaction_pipeline.tests.corpus import build_corpus

    return build_corpus()


@pytest.fixture()
def mapping_dir(tmp_path):
    d = tmp_path / "mappings"
    d.mkdir()
    return d


@pytest.fixture(autouse=True)
def _isolate_master_key(monkeypatch):
    # Deterministischer Test-Key, lokal.
    monkeypatch.setenv("REDACTION_MASTER_KEY", "test-master-key-deterministic")
    yield
