# SBS Nexus – Contract Intelligence

> KI-gestützte Vertragsanalyse für den Mittelstand – mit Risiko-Scoring, Fristenmanagement und Vertragsvergleich.

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-API-green.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

## 🎯 Zweck

Dieses Modul ist der **Legal-Baustein** der SBS Nexus Plattform.  
Es analysiert Verträge automatisch und macht Risiken sichtbar:

- Upload von SaaS-, Lieferanten- oder Wartungsverträgen
- Automatisches Erkennen von Kündigungsfristen und Verlängerungsklauseln
- Risiko-Scoring pro Vertrag (0–100)
- Klauselvergleich zwischen Verträgen
- Contract Copilot für juristische Rückfragen

Ideal für Unternehmen mit vielen Lieferanten- und Dienstleistungsverträgen.

---

## 🧱 Architektur (Kurzfassung)

- **Backend:** FastAPI (Python)
- **Datenbank:** PostgreSQL
- **Storage:** S3-kompatibler Storage
- **AI Layer:** Claude / GPT‑4 über LangChain (Multi-Pass-Analyse)
- **Integrationen:** Finance Module (Verknüpfung zu Zahlungsströmen), SAP-Vertragsstammdaten

---

## 🚀 Quickstart (Dev)

```bash
git clone https://github.com/SBS-Nexus/sbs-contract-intelligence.git
cd sbs-contract-intelligence

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# LLM-Keys, DB-Verbindung etc. eintragen

alembic upgrade head

uvicorn app.main:app --reload
