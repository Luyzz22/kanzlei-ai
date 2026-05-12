/**
 * Zentrale Prompt-Templates für Vertragsanalyse — keine verstreuten Inline-Prompts in der Pipeline.
 * Versionen und Keys müssen mit PromptDefinition-Seed und DB-Releases übereinstimmen.
 *
 * v3 (2026-05-11): Vertragstypklassifikation (Step 0) + Kontextinjektion in Extraction & Risk.
 */
import { CONTRACT_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/schemas/contract-analysis"
import type { ClassificationStagePayload } from "@/lib/ai/schemas/contract-analysis"

export const CONTRACT_PROMPT_BUNDLE_KEY = "contract_analysis.default"

export const CONTRACT_CLASSIFICATION_PROMPT_KEY = "contract.classification.default"
export const CONTRACT_EXTRACTION_PROMPT_KEY = "contract.extraction.default"
export const CONTRACT_RISK_PROMPT_KEY = "contract.risk_guidance.default"

export { CONTRACT_ANALYSIS_PROMPT_VERSION }
/** @deprecated Nutze CONTRACT_ANALYSIS_PROMPT_VERSION */
export const CONTRACT_PROMPT_TEMPLATE_VERSION = CONTRACT_ANALYSIS_PROMPT_VERSION

const baseDe = (promptKey: string, version: string) => `Du bist ein KI-System zur Unterstützung von Anwältinnen und Anwälten im DACH-Raum.
Antworte sachlich, auf Deutsch, ohne Rechtsberatung im Sinne des RDG zu simulieren.
Markiere Unsicherheiten klar. Prompt-Key: ${promptKey} · Version: ${version}.`

// =======================================================================
// CLASSIFICATION PROMPT (Step 0 — NEU)
// =======================================================================

export function buildClassificationPromptBody(
  normalizedDocument: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${baseDe(CONTRACT_CLASSIFICATION_PROMPT_KEY, version)}

AUFGABE: Klassifiziere den folgenden Vertrag nach den unten definierten Dimensionen.
Dies ist die ERSTE Stufe der Analyse-Pipeline — die Ergebnisse bestimmen den rechtlichen
Bewertungsrahmen für alle nachfolgenden Analyse-Schritte.

DIESE KLASSIFIKATION IST ENTSCHEIDEND: Ob eine Klausel nach §§ 305–310 BGB
(AGB-Inhaltskontrolle) oder als frei ausgehandelte Individualvereinbarung zu beurteilen ist,
verändert die gesamte Risikoanalyse fundamental.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt nach folgendem Schema:

{
  "contractClassification": "AGB | Individualvertrag | Mischform",
  "classificationConfidence": "number (0-1)",
  "classificationReasoning": "string (Begründung: welche Indikatoren für/gegen AGB sprechen)",
  "agbIndicators": ["string (bei Mischform: welche Klauseln AGB-typisch sind)"],

  "partyConstellation": "B2B | B2C | Oeffentliche_Hand",
  "partyConstellationReasoning": "string (Begründung)",

  "clientRole": "Auftraggeber | Lieferant | Neutral",

  "industryClassification": "Produktion | Dienstleistung | Finanzprodukt | International | Sonstige",
  "internationalElement": "boolean (internationaler Bezug vorhanden?)",
  "cisgExcluded": "boolean oder null (CISG explizit ausgeschlossen?)",

  "applicableNorms": [
    {
      "norm": "string (z.B. '§§ 305-310 BGB', 'ProdHaftG', 'HGB', 'VOB/B')",
      "relevance": "primär | sekundär | prüfenswert",
      "note": "string (optional, warum relevant)"
    }
  ],

  "agbKontrolleAnwendbar": "boolean (AGB-Inhaltskontrolle nach §§ 305-310 BGB anwendbar?)",
  "agbKontrollmassstab": "string oder null (z.B. 'Voller B2C-Schutz (§ 310 Abs. 3 BGB)' oder 'Eingeschränkt B2B (§ 310 Abs. 1 BGB)' oder null bei Individualvertrag)",

  "classificationSummary": "string (kompakte Zusammenfassung für nachfolgende Pipeline-Stages, max 3 Sätze)",

  "modelNotes": "string (optional)"
}

KLASSIFIKATIONSREGELN:

1. AGB-ERKENNUNG (§ 305 Abs. 1 BGB):
   - AGB: Vorformulierte Vertragsbedingungen, die für eine Vielzahl von Verträgen konzipiert sind
   - Indikatoren FÜR AGB: standardisierte Formulierungen, einseitig begünstigend, "unsere Bedingungen",
     nummerierte Klauselwerke, Verweis auf separate AGB-Dokumente, fehlende individuelle Anpassung
   - Indikatoren GEGEN AGB: individuelle Verhandlungsspuren (handschriftliche Ergänzungen, "wie besprochen"),
     beidseitig ausgewogene Regelungen, spezifische Bezüge auf konkrete Geschäftsvorfälle

2. MISCHFORM: Wenn der Vertrag sowohl AGB-Klauseln als auch individuell ausgehandelte Passagen enthält,
   führe in "agbIndicators" auf, welche Teile AGB-typisch sind.

3. PARTEIKONSTELLATION:
   - B2B: Beide Vertragspartner sind Kaufleute/Unternehmer im Sinne des HGB
   - B2C: Mindestens ein Vertragspartner ist Verbraucher (§ 13 BGB) — verschärfter AGB-Schutz (§ 310 Abs. 3)
   - Oeffentliche_Hand: Ein Vertragspartner ist öffentlicher Auftraggeber — VOB/VOL ggf. anwendbar

4. BRANCHENEINORDNUNG:
   - Produktion: Kauf-/Lieferverträge, Werkverträge → ProdHaftG, §§ 433 ff., §§ 631 ff. BGB
   - Dienstleistung: Dienstverträge, Beratung, SaaS → §§ 611 ff., §§ 631 ff. BGB
   - Finanzprodukt: Kredit, Leasing, Versicherung → KWG, VVG, MaRisk
   - International: CISG, Incoterms, Rechtswahl, Gerichtsstandsvereinbarungen
   - Sonstige: Alles andere (z.B. NDA, Gesellschaftsvertrag)

5. ANWENDBARE NORMEN: Identifiziere alle relevanten Rechtsgrundlagen und klassifiziere sie:
   - primär: Direkt anwendbar und zentral für die Vertragsbewertung
   - sekundär: Ergänzend anwendbar
   - prüfenswert: Möglicherweise relevant, aber Prüfung erforderlich

VERTRAGSTEXT:
${normalizedDocument}`
}

// =======================================================================
// EXTRACTION PROMPT (Step 1)
// =======================================================================

/**
 * Baut den Klassifikations-Kontext-Block, der in Extraction und Risk injiziert wird.
 * Wenn keine Klassifikation vorliegt (Rückwärtskompatibilität), wird ein leerer String zurückgegeben.
 */
function buildClassificationContextBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""

  const agbNote = classification.agbKontrolleAnwendbar
    ? `AGB-Inhaltskontrolle nach §§ 305-310 BGB ist anwendbar. Kontrollmaßstab: ${classification.agbKontrollmassstab ?? "standard"}.`
    : "Keine AGB-Inhaltskontrolle — Individualvertrag."

  const normsStr = classification.applicableNorms
    .filter(n => n.relevance === "primär")
    .map(n => `${n.norm}${n.note ? ` (${n.note})` : ""}`)
    .join(", ")

  return `
VORAB-KLASSIFIKATION (Step 0 — obligatorisch beachten):
- Vertragstyp: ${classification.contractClassification} (Konfidenz: ${(classification.classificationConfidence * 100).toFixed(0)}%)
- Parteikonstellation: ${classification.partyConstellation}
- Mandantenrolle: ${classification.clientRole}
- Branche: ${classification.industryClassification}${classification.internationalElement ? " (internationaler Bezug)" : ""}
- ${agbNote}
- Primär anwendbare Normen: ${normsStr || "Keine spezifischen identifiziert"}
- Zusammenfassung: ${classification.classificationSummary}

WICHTIG: Bewerte Klauseln im Kontext dieser Klassifikation. ${
  classification.contractClassification === "AGB"
    ? "Prüfe jede Klausel an §§ 307-309 BGB (AGB-Inhaltskontrolle). Unwirksame AGB-Klauseln sind als severity=hoch einzustufen."
    : classification.contractClassification === "Mischform"
      ? "Prüfe individuell ausgehandelte Klauseln am allgemeinen Maßstab, AGB-typische Klauseln an §§ 307-309 BGB."
      : "Individualvertrag: Klauseln sind grundsätzlich wirksam, sofern keine Sittenwidrigkeit (§ 138 BGB) oder Treu und Glauben (§ 242 BGB) verletzt wird."
}

`
}

export function buildExtractionPromptBody(
  normalizedDocument: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  const classCtx = buildClassificationContextBlock(classification)

  return `${baseDe(CONTRACT_EXTRACTION_PROMPT_KEY, version)}
${classCtx}
AUFGABE: Strukturierte Extraktion aus dem Vertragstext — vollständig und präzise.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt nach folgendem Schema:

{
  "contractType": "string (Vertragstyp, max 120 Zeichen)",
  "parties": [
    { "name": "string", "role": "string (optional)", "notes": "string (optional)" }
  ],
  "term": {
    "startHint": "string oder null",
    "endHint": "string oder null",
    "noticePeriodHint": "string oder null",
    "renewalHint": "string oder null",
    "terminationSummary": "string (optional)"
  },
  "legalTopics": [
    { "topic": "haftung|gewährleistung|vertraulichkeit|datenschutz|gerichtsstand|verguetung|sonstiges",
      "summary": "string",
      "riskHint": "niedrig|mittel|hoch" }
  ],
  "structuredData": {
    "customer": "string (Vertragspartner 'Kunde'/'Auftraggeber'/'Empfänger') oder null",
    "vendor": "string (Vertragspartner 'Anbieter'/'Lieferant'/'Offenlegende Partei') oder null",
    "product": "string (Kurzbezeichnung Vertragsgegenstand) oder null",
    "jurisdiction": "string (Gerichtsstand) oder null",
    "applicableLaw": "string (Anwendbares Recht, z.B. 'Deutsches Recht') oder null",
    "liabilityLimit": "string (Haftungsgrenze, z.B. 'EUR 1.000.000' oder 'unbegrenzt') oder null",
    "confidentialityObligation": "boolean oder null",
    "penaltyClause": "string (Vertragsstrafe als Freitext) oder null",
    "intellectualProperty": "string (IP-Regelung) oder null",
    "dataProcessingAgreement": "boolean oder null (AVV vorhanden?)",
    "dataLocation": "string (Datenlokation) oder null",
    "dataExportClause": "boolean oder null"
  },
  "deadlines": {
    "noticePeriodDays": "number (Kündigungsfrist in Tagen) oder null",
    "autoRenewal": "boolean oder null",
    "renewalTermMonths": "number oder null",
    "contractStartDate": "string oder null",
    "contractEndDate": "string oder null",
    "nextCancellationDate": "string oder null",
    "warrantyPeriodMonths": "number oder null"
  },
  "extractionConfidence": "number (0-1)",
  "modelNotes": "string (optional)"
}

PFLICHT — DU MUSST FOLGENDE FELDER IMMER PRÜFEN:
- structuredData.customer: Wer ist der Vertragspartner in Empfänger-/Kunden-Rolle? Bei NDAs ist das oft die "empfangende Partei".
- structuredData.vendor: Wer ist der andere Vertragspartner? Bei NDAs die "offenlegende Partei".
- structuredData.jurisdiction: Gerichtsstand steht meist in einer Schlussbestimmung.
- structuredData.applicableLaw: Anwendbares Recht, meist neben Gerichtsstand.
- structuredData.confidentialityObligation: Bei NDAs IMMER true.
- structuredData.penaltyClause: Wenn im Vertrag eine Vertragsstrafe steht, als Freitext wiedergeben.
- deadlines.contractEndDate: "unbegrenzt" / "Nicht definiert" / konkretes Datum.

REGELN:
- Felder auf null setzen, wenn der Text keine Information dazu enthält.
- NICHT erfinden, NICHT raten, NICHT auslegen.
- Zahlen als Zahlen ausgeben (nicht als String), sofern eindeutig.
- Ausgabe ist reines JSON, keine Markdown-Code-Fences.

VERTRAGSTEXT:
${normalizedDocument}`
}

// =======================================================================
// RISK & GUIDANCE PROMPT (Step 2)
// =======================================================================

export function buildRiskAndGuidancePromptBody(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  const classCtx = buildClassificationContextBlock(classification)

  return `${baseDe(CONTRACT_RISK_PROMPT_KEY, version)}
${classCtx}
VORAB-EXTRAKTION (Kontext aus Stage 1):
${extractionSummary}

AUFGABE: Klausel- und Risikoanalyse inkl. Formulierungsvorschlägen.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt nach folgendem Schema:

{
  "findings": [
    {
      "category": "string (z.B. Haftung, Datenschutz, Laufzeit, max 64 Zeichen)",
      "title": "string (prägnanter Titel, max 240 Zeichen)",
      "description": "string (ausführliche Erläuterung)",
      "severity": "niedrig|mittel|hoch",
      "confidence": "number (0-1)",
      "clauseRef": "string (z.B. '§ 3 Abs. 1' oder 'Gesamtvertrag')",
      "quote": "string (WÖRTLICHES Zitat der relevanten Klausel aus dem Vertragstext — max 2000 Zeichen)",
      "suggestedRevision": "string (KONKRETER juristisch sauberer Formulierungsvorschlag — max 4000 Zeichen)",
      "confidenceFactors": {
        "normClarity": "number (0-1, Gewicht 30%: 1.0=BGH klar, 0.7=Auslegungsspielraum, 0.4=streitig, 0.2=Neuland)",
        "clauseClarity": "number (0-1, Gewicht 25%: 1.0=eindeutig, 0.7=h.M. klar, 0.4=mehrdeutig, 0.2=widersprüchlich)",
        "contractContext": "number (0-1, Gewicht 20%: 1.0=AGB klar, 0.7=wahrscheinlich AGB, 0.4=unklar, 0.2=Kontext fehlt)",
        "industryFit": "number (0-1, Gewicht 15%: 1.0=Branche klar, 0.7=moderat, 0.4=unklar, 0.2=kein Kontext)",
        "precedent": "number (0-1, Gewicht 10%: 1.0=BGH direkt, 0.7=OLG, 0.4=nur Literatur, 0.2=Neuland)",
        "limitingFactor": "string (welcher Faktor die Konfidenz am stärksten begrenzt)"
      }
    }
  ],
  "clauseInteractions": [
    {
      "clauseRefs": ["§ X", "§ Y"],
      "interactionType": "verstärkend | kompensierend | widersprüchlich | kumulativ",
      "combinedRiskDescription": "string (Beschreibung des kombinierten Risikos)",
      "combinedSeverity": "niedrig|mittel|hoch",
      "remediation": "string (Abhilfemaßnahme für die Kombination, optional)"
    }
  ],
  "riskScore01": "number (0-1, Gesamtrisikoindikator)",
  "recommendedMeasures": ["string", "string"],
  "negotiationHints": ["string", "string"],
  "explanationSummary": "string (kompakte Gesamtbegründung)",
  "aggregateConfidence": "number (0-1)"
}

PFLICHT — FÜR JEDES FINDING:

1. "quote" IST PFLICHT. Gib das WÖRTLICHE Zitat der problematischen Klausel aus dem Vertragstext an.
   - Wenn die Klausel fehlt (z.B. "keine Laufzeitregelung"): Schreibe "Keine entsprechende Klausel im Vertrag".
   - NICHT paraphrasieren, NICHT zusammenfassen, NICHT umformulieren — wortwörtlich zitieren.

2. "suggestedRevision" IST PFLICHT bei severity="hoch" oder severity="mittel".
   - Formuliere eine ALTERNATIVE Klausel, die direkt in den Vertrag übernommen werden kann.
   - Juristisch saubere Sprache — keine Umgangssprache, keine Erklärungen.
   - Konkret und einsatzbereit — kein "sollte", "könnte", sondern ausformulierte Klausel.
   - QUALITÄTSANFORDERUNG (C.3): Der Formulierungsvorschlag muss folgende Kriterien erfüllen:
     a) Sprachlich auf dem Niveau eines erfahrenen Vertragsjuristen (nicht eines Studenten)
     b) Vollständig und ohne Auslassungen — kein "[...]" oder "wie oben"
     c) Beide Parteien fair berücksichtigen, nicht nur einseitig zugunsten des Mandanten
     d) Gesetzeskonforme Rückfallposition enthalten (z.B. "im Übrigen gelten die gesetzlichen Regelungen")
     e) Praxistauglich: Muss ohne weitere Anpassung in einen Vertragsentwurf eingefügt werden können

3. "clauseRef": Deutsche Zitierweise, z.B. "§ 4", "§ 3 Abs. 1 Satz 2", "§ 1 und § 3 Abs. 2".

4. "confidence": Deine Sicherheit (0.0–1.0) über die Richtigkeit des Findings.
   BERECHNE den Wert aus den Konfidenz-Faktoren (C.4):
   confidence = normClarity×0.30 + clauseClarity×0.25 + contractContext×0.20 + industryFit×0.15 + precedent×0.10
   Gib alle 5 Faktoren + limitingFactor im Feld "confidenceFactors" an.
   Wenn der niedrigste Faktor unter 0.4 liegt, setze limitingFactor auf den Namen dieses Faktors.
${classification?.contractClassification === "AGB" ? `
5. AGB-SPEZIFISCH (da Vertragstyp = AGB):
   - Prüfe JEDE Klausel gegen §§ 307-309 BGB.
   - Bei § 309 BGB (Klauselverbote ohne Wertungsmöglichkeit): severity="hoch", expliziter Hinweis auf Unwirksamkeit.
   - Bei § 308 BGB (Klauselverbote mit Wertungsmöglichkeit): severity mindestens "mittel".
   - Bei § 307 BGB (Generalklausel): Bewerte nach Transparenz- und Angemessenheitsgebot.
   - Begründe in "description" IMMER den konkreten AGB-Verstoß mit Paragraphen.
` : classification?.contractClassification === "Mischform" ? `
5. MISCHFORM-SPEZIFISCH:
   - Differenziere zwischen AGB-Klauseln und individuell ausgehandelten Klauseln.
   - AGB-Klauseln: Prüfe gegen §§ 307-309 BGB.
   - Individuell ausgehandelte Klauseln: Prüfe nur am Maßstab von § 138 BGB und § 242 BGB.
   - Kennzeichne in "description", ob die Klausel als AGB oder individuell eingestuft wird.
` : ""}
OBLIGATORISCHE NORM-KENNZEICHNUNG (P0):
Kennzeichne in "description" JEDE Normreferenz mit einem der folgenden Marker:

[DIREKT] — Norm ist direkt und zwingend anwendbar.
  Verwende bei: § 276 Abs. 3 BGB, § 134 BGB, § 138 BGB, Art. 28 DSGVO, § 14 ProdHaftG.
  Beispiel: "§ 276 Abs. 3 BGB [DIREKT] — Haftungsausschluss für Vorsatz zwingend unwirksam."

[ZWINGEND] — Norm ist nicht abdingbar, auch nicht durch Individualvereinbarung.
  Verwende bei: § 276 Abs. 3 BGB, § 134, § 138 BGB, Art. 83 DSGVO, § 14 ProdHaftG.
  Bei [ZWINGEND]: severity automatisch "hoch".
  Beispiel: "§ 276 Abs. 3 BGB [ZWINGEND] — Haftungsfreizeichnung für Vorsatz ist nichtig."

[B2B-INDIZ] — Norm gilt im B2B nicht direkt, fließt aber als Wertungsmaßstab in § 307 BGB ein.
  Verwende IMMER bei §§ 308, 309 BGB im B2B-Kontext (§ 310 Abs. 1 BGB).
  PFLICHTTEXT bei jeder Verwendung: "Im B2B-Verhältnis gilt § [X] BGB nach § 310 Abs. 1 BGB
  nicht direkt, fließt aber als Wertungsmaßstab in die Prüfung nach § 307 BGB ein."
  Beispiel: "§ 309 Nr. 7 BGB [B2B-INDIZ] — Klauselverbot gilt im B2B nicht direkt (§ 310 Abs. 1),
  ist aber Indiz für unangemessene Benachteiligung nach § 307 BGB."

[ANALOG] — Norm wird als Wertungsmaßstab oder analog herangezogen.
  Verwende bei: § 308 Nr. 5 BGB bei Schweigefiktionen im B2B, § 308 Nr. 7 BGB bei Vertragsstrafen im B2B.
  PFLICHT: Begründe WARUM analog. Setze confidenceFactors.precedent auf max 0.7 bei analoger Anwendung.

REGEL: Jede Normreferenz in "description" MUSS genau einen dieser 4 Marker tragen.
Ohne Marker ist die Normreferenz für den Anwalt nicht einordbar.

OBLIGATORISCHES ANALYSE-SEGMENT: DATENSCHUTZ (B.2)
Prüfe den Vertrag IMMER auf folgende Datenschutz-Dimensionen — unabhängig vom Vertragstyp.
Wenn der Vertrag Begriffe wie "Kundendaten", "personenbezogene Daten", "Mitarbeiterdaten",
"Geheimhaltung", "Vertraulichkeit", "Datenweitergabe", "Subunternehmer", "Cloud",
"Verarbeitung" oder "Speicherung" enthält, erzeuge MINDESTENS ein Finding der Kategorie "Datenschutz":

1. DSGVO-KOLLISION: Kollidiert eine Geheimhaltungspflicht mit dem Auskunftsrecht (Art. 15 DSGVO)
   oder der Löschpflicht (Art. 17 DSGVO)? Ist eine AVV nach Art. 28 DSGVO erforderlich?
   Werden Daten in Drittländer übermittelt (Art. 44 ff. DSGVO)?
2. GESCHGEHG-KONFORMITÄT: Definiert der Vertrag angemessene Schutzmaßnahmen (§ 2 Nr. 1 lit. b GeschGehG)?
   Sind die geschützten Informationen ausreichend konkret bezeichnet?
   Ist die Reverse-Engineering-Ausnahme (§ 3 Abs. 1 Nr. 2 GeschGehG) berücksichtigt?
3. ZEITLICHE BEGRENZUNG: Unbegrenzte Geheimhaltungspflichten sind rechtlich problematisch.
   Empfehlung: max. 5 Jahre post-contractual (mit Ausnahmen für echte Geschäftsgeheimnisse).
4. DIFFERENZIERUNG: Pauschale Geheimhaltungsklauseln ohne Unterscheidung zwischen personenbezogenen
   und nicht-personenbezogenen Daten sind rechtlich angreifbar.

Wenn eine AVV fehlt und der Vertrag Verarbeitung personenbezogener Daten impliziert: severity="hoch".

OBLIGATORISCHES ANALYSE-SEGMENT: STRAFRECHT (B.3)
Prüfe den Vertrag auf Klauseln, deren Durchsetzung Straftatbestände erfüllen könnte.
Insbesondere bei:
- Eigenmächtigem Betreten von Betriebsgeländen → § 123 StGB (Hausfriedensbruch)
- Eigenmächtiger Wegnahme von Waren/Sicherheiten → § 242 StGB (Diebstahl), § 858 BGB (Verbotene Eigenmacht)
- Druckausübung auf Personal/Vertragspartner → § 240 StGB (Nötigung), § 253 StGB (Erpressung)
- Verwertung vertraulicher Informationen → § 203 StGB (Geheimnisverrat), § 23 GeschGehG

Wenn eine Klausel strafrechtlich relevantes Verhalten legitimieren könnte:
- severity IMMER "hoch"
- In "description" den konkreten Straftatbestand mit Paragraphen benennen
- In "suggestedRevision" eine Klausel formulieren, die die legitimen Interessen schützt,
  ohne strafrechtliche Risiken zu schaffen

RISIKOKALIBRIERUNGSMATRIX (B.4)
Verwende die folgende Matrix als VERBINDLICHE Entscheidungsgrundlage für die severity-Einstufung.
Die Matrix verhindert systematische Über- und Unterkalibrierung.

severity = "hoch" — ZWINGEND bei mindestens EINEM der folgenden Kriterien:
  a) Klausel ist nach zwingenden Rechtsnormen unwirksam (§ 276 Abs. 3 BGB, § 309 BGB)
  b) Klausel legitimiert strafrechtlich relevantes Verhalten (§ 123, § 240, § 242, § 253 StGB)
  c) DSGVO-Verstoß mit Bußgeldrisiko (fehlende AVV bei Datenverarbeitung, Art. 83 DSGVO)
  d) Haftungsausschluss für Leben/Körper/Gesundheit oder grobe Fahrlässigkeit/Vorsatz
  e) Vollständiger Ausschluss wesentlicher gesetzlicher Rechte (Rücktritt, Gewährleistung)
     ohne jede Kompensation
  f) Einseitige Vertragsänderung mit Zustimmungsfiktion (Schweigen = Zustimmung)
  g) Vollständig unbegrenztes einseitiges Leistungsbestimmungsrecht (Preis, Umfang)
     ohne Schutzmechanismus (keine Ankündigung, kein Sonderkündigungsrecht)

severity = "mittel" — bei mindestens EINEM der folgenden Kriterien, SOFERN kein "hoch"-Kriterium greift:
  a) Klausel ist nach AGB-Recht angreifbar, aber nicht zwingend unwirksam (§ 307 BGB Generalklausel)
  b) Klausel weicht erheblich vom dispositiven Recht ab, aber ohne zwingende Unwirksamkeit
  c) Unverhältnismäßige, aber nicht sittenwidrige Vertragsstrafe
  d) Unangemessen kurze Fristen (Rüge, Kündigung), die aber nicht zu totalem Rechtsverlust führen
  e) Einseitige Gerichtsstandsvereinbarung im B2B-Verkehr
  f) Verzugszinsen über gesetzlichem Niveau, aber unter Wucher-Schwelle
  g) Eingeschränktes (nicht vollständiges) Aufrechnungs-/Zurückbehaltungsverbot

severity = "niedrig" — NUR wenn ALLE folgenden Bedingungen erfüllt sind:
  a) Klausel ist grundsätzlich wirksam und branchenüblich
  b) Kein Verstoß gegen zwingendes Recht
  c) Geringe praktische Auswirkung auf die Vertragsbalance
  d) Verbesserungspotenzial besteht, aber kein materielles Risiko

KALIBRIERUNGS-KONTROLLREGEL:
  - Prüfe JEDES Finding nach Einstufung nochmals gegen die Matrix.
  - Wenn ein "hoch"-Kriterium erfüllt ist, DARF die Klausel NICHT als "mittel" eingestuft werden.
  - Im Zweifel eine Stufe HÖHER einstufen — Unterkalibrierung ist gefährlicher als Überkalibrierung,
    weil der Anwalt ein fälschlich als "mittel" eingestuftes Risiko deprioritisieren könnte.

GESAMTRISIKO-SCORE (riskScore01) — Kalibrierungsanker:
  - 0.0-0.3: Vertrag ist ausgewogen, geringe Risiken, branchenüblich
  - 0.3-0.5: Einzelne problematische Klauseln, insgesamt aber akzeptabel
  - 0.5-0.7: Mehrere erhebliche Risiken, Nachverhandlung empfohlen
  - 0.7-0.85: Systematische Benachteiligung, dringende Nachverhandlung erforderlich
  - 0.85-1.0: Vertrag enthält unwirksame/strafrechtlich relevante Klauseln, Unterzeichnung nicht empfohlen

OBLIGATORISCHES ANALYSE-SEGMENT: KLAUSELINTERAKTIONEN (C.1)
Analysiere NACH der Einzelklauselanalyse die Wechselwirkungen zwischen Klauseln.
Die gefährlichsten Vertragsrisiken entstehen durch Klauselkombinationen, nicht durch Einzelklauseln.

PFLICHT-PRÜFSCHABLONE — Diese 3 Interaktionsmuster MÜSSEN geprüft werden:

INTERAKTION A: ANNAHME × PREIS (z.B. § 1 × § 3)
Prüfe: Gibt es eine Schweigeannahme/Annahmefiktion UND eine einseitige Preisänderungsklausel?
Risiko: Auftraggeber hat verbindliche Bestellung ohne verbindlichen Preis.
Szenario: Lieferant nimmt schweigend an → ändert Preisliste → liefert zum erhöhten Preis → AG kann nicht anfechten.
Falls gefunden: interactionType="kumulativ", combinedSeverity mindestens "hoch".

INTERAKTION B: RÜGEFRIST × AUFRECHNUNGSVERBOT (z.B. § 5 × § 8)
Prüfe: Gibt es kurze Rügefristen mit Rechtsverlust UND Aufrechnungs-/Zurückbehaltungsverbot bei Mängeln?
Risiko: Selbst bei fristgerechter Mängelrüge muss AG zahlen und kann nicht zurückhalten.
Szenario: AG rügt fristgerecht → muss trotzdem zahlen (§ 8) → klagt separat → Lieferant bestreitet Fristgerechtigkeit → AG verliert alles.
Falls gefunden: interactionType="verstärkend", combinedSeverity="hoch".

INTERAKTION C: KÜNDIGUNG × PREIS × VERTRAGSÄNDERUNG (z.B. § 2 × § 3 × § 10)
Prüfe: Gibt es niedrigschwelliges Kündigungsrecht UND einseitiges Preisänderungsrecht UND Zustimmungsfiktion bei Schweigen?
Risiko: Konstruiertes Ausstiegsszenario — Lieferant kann Vertrag jederzeit "legal" beenden.
Szenario: Lieferant erhöht Preisliste still → AG zahlt alten Preis → Lieferant wertet als Zahlungsverzug → kündigt fristlos.
Falls gefunden: interactionType="kumulativ", combinedSeverity="hoch".

Zusätzlich prüfe systematisch:
- VERSTÄRKEND: Klausel A macht Klausel B noch nachteiliger
- KOMPENSIEREND: Klausel A mildert den Nachteil von Klausel B (selten, aber dokumentieren)
- WIDERSPRÜCHLICH: Klauseln stehen in Konflikt (z.B. Schriftform vs. Zustimmungsfiktion bei Schweigen)

Erzeuge im Feld "clauseInteractions" MINDESTENS die gefundenen Pflicht-Interaktionen.
Die combinedSeverity einer Interaktion kann HÖHER sein als die severity der Einzelfindings.
Klauselinteraktionen fließen in den Gesamtrisikoscore (riskScore01) ein.
${classification?.industryClassification && classification.industryClassification !== "Sonstige" ? `
OBLIGATORISCHES ANALYSE-SEGMENT: BRANCHENKONTEXT (C.2)
Der Vertrag wurde als Branche "${classification.industryClassification}" klassifiziert.
Prüfe branchenspezifische Sonderregelungen:
${classification.industryClassification === "Produktion" ? `
- ProdHaftG: Herstellerhaftung auch ohne Verschulden; Haftungsausschluss in AGB unwirksam (§ 14 ProdHaftG)
- Maschinenrichtlinie 2006/42/EG: CE-Konformität, Betriebsanleitungspflicht
- REACH-Verordnung: Chemikalien-Registrierung bei Industriekomponenten
- Prüfe Haftungsklauseln auf ProdHaftG-Kompatibilität (Findings erzeugen wenn inkompatibel)
` : classification.industryClassification === "Dienstleistung" ? `
- Werkvertragsrecht §§ 631 ff. BGB: Abnahme, Nacherfüllung, Mängelrechte
- Dienstvertragsrecht §§ 611 ff. BGB: Unterscheidung Dienst-/Werkvertrag relevant für Gewährleistung
- IT-/SaaS-spezifisch: Verfügbarkeit (SLA), Datenmigration, Vendor-Lock-in-Klauseln
- Prüfe, ob der Vertrag korrekt als Werk- oder Dienstvertrag qualifiziert ist
` : classification.industryClassification === "Finanzprodukt" ? `
- KWG/MaRisk: Aufsichtsrechtliche Anforderungen an Auslagerungsverträge
- VVG (bei Versicherung): Zwingende Verbraucherschutzvorschriften
- Verbraucherkredit-Richtlinie: Widerrufsrecht, Informationspflichten
- BaFin-Rundschreiben: Anforderungen an IT-Sicherheit und Auslagerung
` : classification.industryClassification === "International" ? `
- CISG: Prüfe ob wirksam ausgeschlossen; wenn nicht, gelten UN-Kaufrecht-Normen vorrangig
- Incoterms: Klare Lieferbedingungen (DDP, FOB, CIF etc.) definiert?
- Rechtswahl und Gerichtsstand: Wirksame Rechtswahlklausel nach Rom-I-VO?
- Drittlandübermittlung: DSGVO Art. 44 ff. bei Datentransfer außerhalb EU/EWR
` : ""}
Erzeuge mindestens ein Finding mit Branchenbezug, wenn eine branchenspezifische Norm verletzt oder nicht adressiert wird.
` : ""}
BEISPIEL FÜR EIN FINDING:
{
  "category": "Vertragsstrafe",
  "title": "Unverhältnismäßig hohe Vertragsstrafe",
  "description": "Die pauschale Vertragsstrafe ist sittenwidrig hoch und nach § 343 BGB reduzierbar.",
  "severity": "hoch",
  "confidence": 0.9,
  "clauseRef": "§ 4",
  "quote": "Bei Verstoß gegen diese Vereinbarung zahlt der Empfänger eine Vertragsstrafe von EUR 250.000 pro Verstoß.",
  "suggestedRevision": "Bei schuldhaftem Verstoß gegen diese Vereinbarung zahlt der Empfänger eine angemessene Vertragsstrafe, die sich nach der Schwere des Verstoßes richtet, höchstens jedoch EUR 25.000 pro Verstoß. Die Vertragsstrafe ist auf den tatsächlich entstandenen Schaden anzurechnen."
}

WEITERE REGELN:
- Mindestens 3, maximal 15 Findings.
- Priorisiere nach Geschäftsrisiko, nicht nach formalen Mängeln.
- Datenschutz- und Strafrechts-Findings sind KEINE optionalen Extras — sie gehören zu den Kern-Findings.
- Ausgabe ist reines JSON, keine Markdown-Code-Fences.
- Nutze aus der Vorab-Extraktion bekannte Klauselbezüge.

PFLICHT-FINDINGS — Diese Aspekte MÜSSEN als eigenständige Findings erscheinen, wenn sie im Vertrag vorhanden sind:
- Annahmefiktion bei Schweigen (auch wenn Risiko für sich allein "niedrig" — benötigt als Trigger für Cross-Clause)
- Zahlungsfrist unter 14 Tagen (eigenständiges Finding, nicht mit Verzugszinsen zusammenführen)
- Fehlende AVV bei Verarbeitung personenbezogener Daten
- Einseitige Gerichtsstandsvereinbarung

BESTIMMTHEITSGEBOT-CHECK (P1) — Prüfe bei JEDEM Formulierungsvorschlag zu Vertragsstrafen:
- Enthält die vorgeschlagene Vertragsstrafe einen FIXEN Betrag oder eine objektiv bestimmbare Berechnungsformel?
- Falls NEIN (z.B. "nach billigem Ermessen"): AUTOMATISCH ein Stufenmodell vorschlagen:
  (a) Bei erstmaligem Verstoß: EUR [X] (z.B. 10.000)
  (b) Bei wiederholtem Verstoß: EUR [Y] je weiterem Verstoß (z.B. 20.000)
  (c) Bei vorsätzlichem Verstoß: EUR [Z] (z.B. 35.000)
  Plus: Anrechnung auf Schaden, § 343 BGB-Vorbehalt
- NIEMALS "billiges Ermessen" als Festsetzungsmethode vorschlagen — das ist rechtspraktisch wertlos.

TEMPORAL-VALIDIERUNG (P1) — Prüfe bei JEDEM Formulierungsvorschlag:
- Referenziert der Vorschlag Vergangenheitsdaten ("letzte X Monate", "durchschnittliches Auftragsvolumen")?
- Erkenne den Vertragsbeginn aus der Extraktion.
- Falls der Vertrag ein NEUVERTRAG ist (Beginn in der Zukunft oder < 6 Monate alt):
  Formulierungsvorschläge mit Vergangenheitsreferenzen MÜSSEN eine Anlaufphase enthalten.
  Beispiel: "Nach Ablauf von sechs Monaten ab Vertragsbeginn tritt an die Stelle des vorstehenden
  Schwellenwerts das durchschnittliche monatliche Auftragsvolumen der vorangegangenen sechs Monate."

LkSG-PRÜFUNG (P2) — Bei LIEFERANTENVERTRÄGEN mit produzierten Waren:
- Enthält der Vertrag eine Lieferkettensorgfaltspflichtenklausel?
- Falls NEIN: Erzeuge ein Finding mit severity="niedrig" oder "mittel", Kategorie "Compliance":
  "Abhängig von der Unternehmensgröße des Auftraggebers (>1.000 Mitarbeiter: LkSG anwendbar)
  fehlen Sorgfaltspflichtenklauseln gemäß Lieferkettensorgfaltspflichtengesetz."
- Konfidenz bewusst niedrig setzen (0.60-0.70) — Anwendbarkeit aus Vertrag nicht bestimmbar.
- KEINE automatische Hochstufung — LkSG ist hinweisbasiert, nicht zwingend in jedem Fall.

AUDIT-TRAIL (E.2): Die "explanationSummary" muss folgenden Hinweis enthalten:
  "Hinweis nach BRAO § 43a: Diese KI-gestützte Analyse dient als Hilfsmittel zur Unterstützung
  der anwaltlichen Tätigkeit. Die rechtliche Einschätzung und Verantwortung verbleibt beim
  bearbeitenden Rechtsanwalt. Eine eigenständige fachliche Prüfung aller Findings ist erforderlich."

VERTRAGSTEXT:
${normalizedDocument}`
}

// =======================================================================
// Bundle Helpers
// =======================================================================

export type DefaultContractPromptBundle = {
  bundleKey: typeof CONTRACT_PROMPT_BUNDLE_KEY
  classification: { key: typeof CONTRACT_CLASSIFICATION_PROMPT_KEY; version: string; text: string }
  extraction: { key: typeof CONTRACT_EXTRACTION_PROMPT_KEY; version: string; text: string }
  risk: { key: typeof CONTRACT_RISK_PROMPT_KEY; version: string; text: string }
}

export function buildDefaultContractPromptBundle(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): DefaultContractPromptBundle {
  return {
    bundleKey: CONTRACT_PROMPT_BUNDLE_KEY,
    classification: {
      key: CONTRACT_CLASSIFICATION_PROMPT_KEY,
      version,
      text: buildClassificationPromptBody(normalizedDocument, version)
    },
    extraction: {
      key: CONTRACT_EXTRACTION_PROMPT_KEY,
      version,
      text: buildExtractionPromptBody(normalizedDocument, version, classification)
    },
    risk: {
      key: CONTRACT_RISK_PROMPT_KEY,
      version,
      text: buildRiskAndGuidancePromptBody(normalizedDocument, extractionSummary, version, classification)
    }
  }
}
