# KanzleiAI Phase 2 — Lokale Redaction-Pipeline (Hetzner)

Schutzwall des Hybrid-Modells. Originale, Seitenbilder und das
Re-Identifikations-Mapping verlassen den Server **nie**. Die Pipeline
produziert ausschließlich den Keystone-Input (`fields` + `detectors`) für das
TS-Policy-Gate (`src/lib/hybrid/`). Sie entscheidet **nicht** über Cloud-Versand
— sie liefert Evidenz. **Fail-closed**: jede Unsicherheit wird hochgereicht.

## Fluss
```
sanitize (A) → OCR/Layout (B) → detect (C) → redact (D) → minimize (E)
   → { jobRef, tenantScope, policyVersion, fields, detectors }
Mapping (Klartext↔Pseudonym) → AES-256-GCM, per-Tenant, LOKAL getrennt.
```

## Nutzung
```python
from redaction_pipeline import run_pipeline
out = run_pipeline(pdf_bytes, tenant_id="kanzlei-x")
# out ist exakt der GateInput für PolicyGate.evaluateGate()
```

## Stufen (jede ein versionierter Detektor)
| Stufe | Detektor | Aufgabe | Engine |
|------|----------|---------|--------|
| A | `sanitizer` | JS/EmbeddedFiles/XMP/OpenAction entfernen | pikepdf-Inventur + fitz.scrub |
| B | `ocr` | Token + Koordinaten; Coverage-Score | fitz native / Tesseract (deu) |
| C | `pii_regex`, `ner_persons_orgs`, `addresses`, `health_terms`, `mandate_terms`, `qr_barcode` | DE-PII + Deny-Listen + QR | Regex + Heuristik + pyzbar |
| D | `redaction` | echte Pixel+Text-Redaction; Platzhalter; AES-Mapping | fitz apply_redactions |
| E | — | MinimizedFields (default-deny) | — |

## Fail-closed-Garantien
- `health_terms`/`mandate_terms` ⇒ `severity=red` ⇒ Gate RED.
- OCR-Coverage `< min_coverage` (0.98) ⇒ `ocr.confidence < min_coverage` ⇒ Gate AMBER.
- Kein Textlayer + kein Tesseract ⇒ `confidence=0` (nie „leer = sauber").
- **Safety-Net in Stufe D**: residuale PII/Deny im finalen Text werden
  zusätzlich per Regex ersetzt → 0-Leak in `fields` auch bei Koordinaten-Lücke.
- Output-Validierung (`validate_output`) verbietet Original/Mapping/sprechende IDs.

## Bekannte Abweichung vom Handoff
`ner_persons_orgs` ist eine **deterministische Heuristik** (großgeschriebene
Wortfolgen + Rechtsformen), kein statistisches NER-Modell — bewusst, da kein
Modell auf dem Server liegt und Determinismus (GoBD) Vorrang hat.
`confidence=0.9` signalisiert die Heuristik ehrlich. Drop-in für ein echtes
NER-Modell ist `_ner_hits()` in `stages/detect.py`.

## Tests / Red-Team-Korpus
```bash
python -m pytest redaction_pipeline/tests/ -q
```
`tests/corpus.py` generiert deterministisch ≥30 Dokumente (native PDF, Scan, QR,
Aktenzeichen, Diagnose-/Mandatsbegriffe, Mischsprachen). `test_no_leaks.py`
prüft **0 Leaks** geplanter Geheimnisse in `fields`.

## Deploy (Hetzner)
```bash
python -m venv /opt/redaction/.venv
/opt/redaction/.venv/bin/pip install -r redaction_pipeline/requirements-pipeline.txt
apt-get install -y tesseract-ocr tesseract-ocr-deu libzbar0
# Env (systemd):  REDACTION_MASTER_KEY=<secret>  REDACTION_MAPPING_DIR=/var/lib/redaction/mappings
# non-root Service-User; GPU/CPU-Queue serialisiert (kein OOM bei Parallel-Uploads).
```
