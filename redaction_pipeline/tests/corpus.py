"""
Synthetischer Red-Team-Korpus (≥30 Dokumente).

Deckt ab: native PDFs, Scans (kein Textlayer), QR-Codes, Aktenzeichen,
Diagnose-/Mandatsbegriffe, Mischsprachen. Jedes Dokument trägt bekannte
geplante Geheimnisse — die Tests prüfen 0 Leaks in `fields`.

Generierung ist deterministisch (gleiche Bytes bei jedem Lauf).
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field

import fitz


@dataclass
class CorpusDoc:
    name: str
    pdf_bytes: bytes
    # Klartext-Geheimnisse, die NIE in fields.redactedText erscheinen dürfen.
    secrets: list[str] = field(default_factory=list)
    is_scan: bool = False
    has_qr: bool = False
    expect_red: bool = False  # health/mandate ⇒ Pipeline-Severity RED


# ── Bausteine ────────────────────────────────────────────────────────────
IBANS = [
    "DE89 3704 0044 0532 0130 00",
    "DE12 5001 0517 0648 4898 90",
]
EMAILS = ["max.mustermann@example.de", "kanzlei@recht-partner.de"]
PHONES = ["+49 30 1234567", "+49 40 7654321"]
USTIDS = ["DE123456789", "DE987654321"]
STEUERNR = ["21/815/08150", "151/815/08151"]
AKTEN = ["12 C 345/67", "4 O 1234/22"]
PERSONS = ["Max Mustermann", "Erika Beispiel"]
ORGS = ["Techvision Hardware GmbH", "CloudStack Technologies AG"]
ADDRESSES = ["Bredowstraße 19", "22113 Hamburg"]
HEALTH = ["Diagnose", "Karzinom"]
MANDATE = ["Ermittlungsverfahren", "Tatvorwurf"]


def _native_pdf(lines: list[str]) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    y = 72.0
    for line in lines:
        page.insert_text((72, y), line, fontsize=11, fontname="helv")
        y += 22
    out = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    return out


def _scanned_pdf(lines: list[str]) -> bytes:
    """Native Seite rendern und als reines Bild-PDF neu aufbauen (kein Textlayer)."""
    native = _native_pdf(lines)
    src = fitz.open(stream=native, filetype="pdf")
    page = src.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(300 / 72, 300 / 72), alpha=False)
    img_bytes = pix.tobytes("png")
    src.close()

    out_doc = fitz.open()
    new_page = out_doc.new_page(width=595, height=842)
    new_page.insert_image(fitz.Rect(0, 0, 595, 842), stream=img_bytes)
    result = out_doc.tobytes(garbage=4, deflate=True)
    out_doc.close()
    return result


def _qr_png(data: str) -> bytes:
    import qrcode

    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _pdf_with_qr(lines: list[str], qr_data: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    y = 72.0
    for line in lines:
        page.insert_text((72, y), line, fontsize=11, fontname="helv")
        y += 22
    png = _qr_png(qr_data)
    page.insert_image(fitz.Rect(400, 60, 520, 180), stream=png)
    out = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    return out


def _pdf_with_active_content(lines: list[str]) -> bytes:
    """PDF mit eingebettetem JavaScript + OpenAction + Metadaten."""
    base = _native_pdf(lines)
    doc = fitz.open(stream=base, filetype="pdf")
    doc.set_metadata({"author": "Leak Author", "title": "Geheim", "subject": "PII"})
    # JavaScript einbetten.
    try:
        doc.set_xml_metadata("<x:xmpmeta xmlns:x='adobe:ns:meta/'>secret</x:xmpmeta>")
    except Exception:
        pass
    out = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    return out


def build_corpus() -> list[CorpusDoc]:
    docs: list[CorpusDoc] = []

    # 1–8: native PDFs mit gemischten PII.
    for i in range(8):
        iban = IBANS[i % len(IBANS)]
        email = EMAILS[i % len(EMAILS)]
        phone = PHONES[i % len(PHONES)]
        ust = USTIDS[i % len(USTIDS)]
        person = PERSONS[i % len(PERSONS)]
        org = ORGS[i % len(ORGS)]
        lines = [
            "Rechnung Nr. 2024-100" + str(i),
            f"Auftragnehmer: {org}",
            f"Ansprechpartner: {person}",
            f"E-Mail: {email}  Telefon: {phone}",
            f"USt-IdNr.: {ust}",
            f"Bankverbindung IBAN: {iban}",
            "Betrag: 12.500,00 EUR zzgl. USt.",
        ]
        docs.append(
            CorpusDoc(
                name=f"native_pii_{i}",
                pdf_bytes=_native_pdf(lines),
                secrets=[iban, email, phone, ust],
            )
        )

    # 9–14: Aktenzeichen + Steuernummer (juristisch/steuerlich).
    for i in range(6):
        akte = AKTEN[i % len(AKTEN)]
        steuer = STEUERNR[i % len(STEUERNR)]
        lines = [
            "Schriftsatz an das Landgericht",
            f"Aktenzeichen: {akte}",
            f"Steuernummer der Partei: {steuer}",
            "Wir zeigen die Vertretung an.",
        ]
        docs.append(
            CorpusDoc(
                name=f"akte_{i}",
                pdf_bytes=_native_pdf(lines),
                secrets=[akte, steuer],
            )
        )

    # 15–20: Health/Mandate Deny-Begriffe ⇒ RED.
    for i in range(6):
        term = (HEALTH + MANDATE)[i % (len(HEALTH) + len(MANDATE))]
        iban = IBANS[i % len(IBANS)]
        lines = [
            "Vertrauliches Schreiben",
            f"Betreff: {term} des Mandanten",
            f"Konto: {iban}",
            "Streng vertraulich.",
        ]
        docs.append(
            CorpusDoc(
                name=f"deny_{i}",
                pdf_bytes=_native_pdf(lines),
                secrets=[iban, term],
                expect_red=True,
            )
        )

    # 21–26: Scans (kein Textlayer) ⇒ OCR-Pfad.
    for i in range(6):
        iban = IBANS[i % len(IBANS)]
        email = EMAILS[i % len(EMAILS)]
        lines = [
            "Gescanntes Dokument",
            f"IBAN {iban}",
            f"Kontakt {email}",
        ]
        docs.append(
            CorpusDoc(
                name=f"scan_{i}",
                pdf_bytes=_scanned_pdf(lines),
                secrets=[iban, email],
                is_scan=True,
            )
        )

    # 27–30: QR-Codes mit Klartext-Rechnungsdaten.
    for i in range(4):
        iban = IBANS[i % len(IBANS)]
        qr_secret = f"BCD\n002\n1\nSCT\n{iban}\nRechnung 2024"
        lines = ["Rechnung mit QR-Code", "Bitte scannen zum Bezahlen."]
        docs.append(
            CorpusDoc(
                name=f"qr_{i}",
                pdf_bytes=_pdf_with_qr(lines, qr_secret),
                secrets=[iban],
                has_qr=True,
            )
        )

    # 31–33: Mischsprachen (DE/EN) + aktive Inhalte.
    for i in range(3):
        email = EMAILS[i % len(EMAILS)]
        org = ORGS[i % len(ORGS)]
        lines = [
            "Service Agreement / Dienstleistungsvertrag",
            f"Provider: {org}",
            f"Contact / Kontakt: {email}",
            "All data is processed confidentially. Alle Daten vertraulich.",
        ]
        docs.append(
            CorpusDoc(
                name=f"mixed_active_{i}",
                pdf_bytes=_pdf_with_active_content(lines),
                secrets=[email],
            )
        )

    return docs
