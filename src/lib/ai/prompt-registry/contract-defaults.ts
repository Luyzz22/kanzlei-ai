/**
 * Zentrale Prompt-Templates für Vertragsanalyse — keine verstreuten Inline-Prompts in der Pipeline.
 * Versionen und Keys müssen mit PromptDefinition-Seed und DB-Releases übereinstimmen.
 *
 * Hotfix 9: Instructions und Vertragstext sind getrennt.
 * Die Pipeline übergibt den Text EINMAL via provider.analyze({ documentText }).
 */
import {
  CONTRACT_ANALYSIS_PROMPT_VERSION,
  type ClassificationStagePayload
} from "@/lib/ai/schemas/contract-analysis"
import {
  isNdaContractType,
  hasSignificantNdaClauses,
  ndaRiskModuleBlock,
  ndaCrossClauseBlock,
} from "@/lib/ai/prompt-registry/nda-module"
import {
  isIndustrieContractType,
  industrieRiskModuleBlock,
  industrieCrossClauseBlock,
} from "@/lib/ai/prompt-registry/industrie-module"

export const CONTRACT_PROMPT_BUNDLE_KEY = "contract_analysis.default"

export const CONTRACT_CLASSIFICATION_PROMPT_KEY = "contract.classification.default"
export const CONTRACT_EXTRACTION_PROMPT_KEY = "contract.extraction.default"
export const CONTRACT_RISK_PROMPT_KEY = "contract.risk_guidance.default"

export { CONTRACT_ANALYSIS_PROMPT_VERSION }
/** @deprecated Nutze CONTRACT_ANALYSIS_PROMPT_VERSION */
export const CONTRACT_PROMPT_TEMPLATE_VERSION = CONTRACT_ANALYSIS_PROMPT_VERSION

const baseDe = (version: string, promptKey: string) => `Du bist ein KI-System zur Unterstützung von Anwältinnen und Anwälten im DACH-Raum.
Antworte sachlich, auf Deutsch, ohne Rechtsberatung im Sinne des RDG zu simulieren.
Markiere Unsicherheiten klar. Prompt-Key: ${promptKey} · Version: ${version}.`

/** Adaptive Finding-Obergrenze — erhöht für Missing-Clause-Detection und granulare § 6-Aufspaltung. */
export function maxFindingsForDocumentLength(charLength: number): number {
  if (charLength >= 80_000) return 8
  if (charLength >= 40_000) return 10
  if (charLength >= 20_000) return 12
  return 16
}

function classificationContextBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""
  return `
VORAB-KLASSIFIKATION:
- Vertragstyp: ${classification.contractClassification}
${classification.partyConstellation ? `- Parteikonstellation: ${classification.partyConstellation}` : ""}
${classification.agbKontrolleAnwendbar != null ? `- AGB-Kontrolle anwendbar: ${classification.agbKontrolleAnwendbar ? "ja" : "nein"}` : ""}
`
}

/**
 * B2B-AGB-Qualifier — juristische Dogmatik-Korrektur.
 *
 * Bei B2B-Verträgen gelten §§ 308, 309 BGB NICHT unmittelbar wie im
 * Verbraucherverkehr. Sie sind nur Indiz-/Wertungsmaßstab im Rahmen
 * der Generalklausel § 307 BGB (BGH ständige Rspr.).
 *
 * Dieser Block wird nur eingefügt wenn:
 * - Parteikonstellation enthält "B2B" und
 * - AGB-Kontrolle anwendbar ist oder vermutet wird
 */
// ── Vertragstyp-spezifische Module ────────────────────────────────────────────

/**
 * NDA-Modul v1.1 — 6 Kern-Prüfpunkte + 1 Sonderpunkt für einseitige NDAs.
 * Wird aktiviert, wenn contractClassification auf NDA / Geheimhaltung hindeutet.
 */
function ndaModuleBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""
  const ct = (classification.contractClassification ?? "").toLowerCase()
  const isNda =
    ct.includes("nda") ||
    ct.includes("geheimhaltung") ||
    ct.includes("vertraulichkeit") ||
    ct.includes("confidentiality")
  if (!isNda) return ""

  return `
NDA-MODUL (Geheimhaltungsvereinbarung — 6+1 Prüfpunkte):
Diese Prüfpunkte MÜSSEN als Findings abgedeckt werden, sofern relevant:
1. Umfang des Geheimnisschutzes: Ist "vertrauliche Information" klar und abschließend definiert? Unklar = mittel/hoch.
2. Rückausnahmen: Sind Standardausnahmen vorhanden (öffentlich bekannt, eigene Kenntnisse, Offenlegungspflicht)? Fehlen = mittel.
3. Verwendungsbeschränkung: Nur für bestimmten Zweck erlaubt? Zu weite Nutzungserlaubnis = hoch.
4. Laufzeit und Nachlaufpflicht: Unbefristete Geheimhaltung nach Vertragsende = wirtschaftliches Risiko (mittel/hoch je nach Branche).
5. Vertragsstrafe / Liquidated Damages: Fehlt oder unangemessen niedrig = erhebliches Durchsetzungsrisiko (mittel).
6. Rückgabe / Vernichtung vertraulicher Unterlagen: Kein Mechanismus = operationelles Risiko (niedrig/mittel).
+1 EINSEITIG/GEGENSEITIG: Einseitige NDA bevorzugt offenlegende Partei. Fehlende Gegenseitigkeit bei beidseitigem Austausch = mittel.
`
}

/**
 * IT/SaaS-Modul v1.0 — Prüfpunkte für SaaS-Verträge, MSAs, Softwarelizenz- und Cloud-Verträge.
 * Aktiviert bei contractClassification SaaS/IT/Cloud/Software/Lizenz/MSA.
 */
function itSaasModuleBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""
  const ct = (classification.contractClassification ?? "").toLowerCase()
  const isItSaas =
    ct.includes("saas") ||
    ct.includes("software") ||
    ct.includes("cloud") ||
    ct.includes("it-") ||
    ct.includes("it ") ||
    ct.includes("lizenz") ||
    ct.includes("licence") ||
    ct.includes("msa") ||
    ct.includes("service level") ||
    ct.includes("dienstleistungs") ||
    ct.includes("wartung")
  if (!isItSaas) return ""

  return `
IT/SaaS-MODUL (Digitale Dienstleistungen — spezifische Prüfpunkte):
1. SLA / Verfügbarkeitsgarantien: Sind Uptime-Garantien (99%+ empfohlen), Wartungsfenster und Service-Credits geregelt? Fehlen = hoch.
2. Datenspeicherort und Subprocessors: Ist Datenhaltung in EU/EWR explizit geregelt? Drittlandtransfer ohne Safeguards = hoch (DSGVO Art. 44).
3. AVV / DPA: Wird personenbezogene Daten verarbeitet? Fehlender Auftragsverarbeitungsvertrag = hoch (DSGVO Art. 28).
4. Datenmigration / Exit-Clause: Kann Kunde Daten bei Vertragsende portieren? Vendor Lock-in ohne Exit = hoch.
5. Haftungsdeckelung IT-spezifisch: Ist Haftung für Datenverlust / Cyber-Incident abgedeckt? Unklare Haftung = mittel/hoch.
6. IP-Ownership bei Customization: Wem gehören Anpassungen/Konfigurationen? Fehlende Regelung = mittel.
7. Sicherheitsanforderungen: Zertifizierungen (ISO 27001, SOC 2) gefordert? Fehlen bei sensiblen Daten = mittel.
riskNature für IT/SaaS-Findings: privacy_or_confidentiality_risk für DSGVO-Themen, operational_supply_chain_risk für SLA/Exit.
`
}

/**
 * Risiko-Modifier MOD-1 bis MOD-5 — Anweisung für riskScore01-Kalibrierung.
 *
 * Definiert kontextuelle Auf-/Abwertungsregeln für den Gesamt-Risikoscore.
 * Wird in jeden Risk-Stage Prompt eingefügt.
 */
function riskModifierBlock(): string {
  return `
RISIKO-MODIFIER (riskScore01-Kalibrierung — MUSS berücksichtigt werden):
MOD-1 (AUFWERTUNG +0.1–0.15): Einseitige Risikoverteilung zulasten einer Partei (>60% der Haftungsrisiken trägt eine Seite).
MOD-2 (AUFWERTUNG +0.05–0.10): Fehlende Pflichtklausel nach geltendem Recht (DSGVO, ProdHaftG, § 203 StGB-Kontext).
MOD-3 (ABWERTUNG −0.05–0.10): Established-Practice-Vertrag mit Standardklauseln in allen wesentlichen Bereichen; kein ungewöhnliches Risiko.
MOD-4 (AUFWERTUNG +0.10–0.20): Hinweise auf missbräuchliche Klauseln (§ 138 BGB / § 307 Abs. 2 Nr. 2 BGB Kernbereichsverletzung).
MOD-5 (AUFWERTUNG +0.05): Gerichtsstand außerhalb DACH ohne sachliche Begründung bei deutschem Leistungsort.
Hinweis: riskScore01 NIEMALS über 0.95 setzen. Modifier kumulieren, aber Cap beachten.
`
}

/**
 * Konfidenz-5-Faktoren-Formel — Anweisung zur confidenceFactors-Berechnung.
 * Gibt dem Modell explizite Gewichtungsregeln für die 5 Faktoren.
 */
function confidenceFormulaBlock(): string {
  return `
KONFIDENZ-FORMEL (confidenceFactors pro Finding — 5 gleichgewichtete Faktoren):
Berechne jeden Faktor als 0.0–1.0:
- normClarity: Wie eindeutig ist die zugrunde liegende Rechtsnorm? (BGH-bestätigt=0.9+; umstritten=0.4–0.6; unklar=<0.4)
- clauseClarity: Wie eindeutig ist die Klausel im Vertrag formuliert? (klar und vollständig=0.85+; lückenhaft/unklar=<0.5)
- contractContext: Passt das Finding zum Vertragstyp und Parteikonstellation? (sehr passend=0.9+; Branchenausreißer=0.4–0.6)
- industryFit: Übereinstimmung mit üblicher Branchenpraxis? (Standard=0.85+; ungewöhnlich=0.4–0.6)
- precedent: Liegt BGH/OLG-Rechtsprechung als Stütze vor? (höchstrichterlich bestätigt=0.9+; keine RSpr.=0.3–0.5)
Konfidenz-Formel: confidence = (normClarity + clauseClarity + contractContext + industryFit + precedent) / 5
Confidence NIEMALS 1.0 — Maximalwert 0.98. Mindestens ein limitingFactor bei confidence < 0.7.
`
}

function b2bAgbQualifierBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""

  const isB2b =
    classification.partyConstellation?.toLowerCase().includes("b2b") ?? false
  const agbRelevant = classification.agbKontrolleAnwendbar !== false

  if (!isB2b || !agbRelevant) return ""

  return `
B2B-AGB-QUALIFIKATION (WICHTIG FÜR ALLE FINDINGS):
Bei unterstellter AGB-Einordnung ist dieser Vertrag ein B2B-Vertrag (§ 310 Abs. 1 BGB).
- PRIMÄRNORM: § 307 BGB (unangemessene Benachteiligung).
- §§ 308 und 309 BGB gelten NICHT unmittelbar, sondern nur als Wertungs- und Indizmaßstab.
- NIEMALS formulieren: "verstößt gegen § 309 BGB" oder "§ 308 Nr. X ist verletzt".
- STATTDESSEN formulieren:
  * "AGB-rechtlich erheblich angreifbar nach § 307 BGB"
  * "§ 309 Nr. 7 BGB dient als starkes Wertungsindiz"
  * "unter Heranziehung des Rechtsgedankens des § 308 Nr. X BGB"
- primaryLegalBasis MUSS § 307 BGB enthalten.
- §§ 308/309 BGB kommen in referenceLegalBasis mit Suffix "als Wertungsindiz".
- Ausnahme: § 309 Nr. 7 lit. a BGB (Haftung für Personenschäden) gilt auch im B2B-Verkehr als DIREKT anwendbar (BGH).
`
}

/**
 * Prompt-Router: Assembliert vertragstyp-spezifische Prompt-Blöcke.
 *
 * Statt eines monolithischen Prompts mit allen Modulen werden nur die
 * relevanten Module geladen. Spart ~60-70% Prompt-Tokens und erhöht
 * die Instruction-Following-Accuracy.
 *
 * Primärer Trigger: contractClassification aus Stage 0
 * Sekundärer Trigger: Schlüsselwörter in der Extraktion (z.B. "Kundendaten")
 */
function assembleTypeSpecificBlocks(
  classification?: ClassificationStagePayload | null,
  extractionSummary?: string
): string {
  const blocks: string[] = []

  const contractType = classification?.contractClassification ?? ""

  // ── Primäres Modul basierend auf Vertragstyp ──────────────────────
  if (isNdaContractType(contractType)) {
    blocks.push(ndaRiskModuleBlock())
    blocks.push(ndaCrossClauseBlock())
  }

  if (isIndustrieContractType(contractType)) {
    blocks.push(industrieRiskModuleBlock())
    blocks.push(industrieCrossClauseBlock())
  }

  // ── Sekundäre Trigger: Module auch bei Nicht-Primärtyp laden ──────
  // NDA-Modul als Sekundärmodul wenn der Vertrag signifikante
  // Geheimhaltungsklauseln hat (z.B. Lieferantenvertrag mit § 9 NDA)
  if (
    !isNdaContractType(contractType) &&
    extractionSummary &&
    hasSignificantNdaClauses(extractionSummary)
  ) {
    blocks.push(`
HINWEIS: Dieser Vertrag ist kein reiner NDA, enthält aber signifikante Geheimhaltungsklauseln.
Die folgenden NDA-spezifischen Prüfpunkte sind ZUSÄTZLICH anzuwenden:`)
    blocks.push(ndaRiskModuleBlock())
  }

  if (blocks.length === 0) {
    return "" // Kein Branchenmodul getriggert — Basis-Prompt reicht
  }

  return "\n" + blocks.join("\n")
}

export function buildClassificationPromptInstructions(
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${baseDe(version, CONTRACT_CLASSIFICATION_PROMPT_KEY)}

AUFGABE: Vertragstyp und Parteikonstellation klassifizieren (Stage 0).

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "contractClassification": "string (z.B. Lieferantenvertrag, NDA, Arbeitsvertrag)",
  "partyConstellation": "string (optional, z.B. B2B Kauf vs. Verkauf)",
  "agbKontrolleAnwendbar": "boolean oder null",
  "b2bOrB2c": "b2b|b2c|gemischt|unklar (optional)",
  "classificationConfidence": "number 0-1 (optional)",
  "modelNotes": "string (optional)"
}

REGELN:
- severity-Werte später immer auf Deutsch: niedrig|mittel|hoch
- Ausgabe: reines JSON ohne Markdown-Fences
- Der Vertragstext folgt im nächsten Abschnitt.`
}

export function buildClassificationPromptBody(
  normalizedDocument: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${buildClassificationPromptInstructions(version)}

VERTRAGSTEXT:
${normalizedDocument}`
}

export function buildExtractionPromptInstructions(
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  return `${baseDe(version, CONTRACT_EXTRACTION_PROMPT_KEY)}
${classificationContextBlock(classification)}
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
  "structuredData": { "customer": "string|null", "vendor": "string|null", "..." : "..." },
  "deadlines": { "noticePeriodDays": "number|null", "..." : "..." },
  "extractionConfidence": "number (0-1)",
  "modelNotes": "string (optional)"
}

REGELN:
- Felder auf null wenn nicht im Text — NICHT erfinden.
- riskHint/severity immer: niedrig|mittel|hoch (Deutsch).
- Ausgabe: reines JSON ohne Markdown-Fences.
- Der Vertragstext folgt im nächsten Abschnitt.`
}

export function buildExtractionPromptBody(
  normalizedDocument: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  return `${buildExtractionPromptInstructions(version, classification)}

VERTRAGSTEXT:
${normalizedDocument}`
}

export function buildRiskFindingsPromptInstructions(
  extractionSummary: string,
  documentCharLength: number,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  const maxFindings = maxFindingsForDocumentLength(documentCharLength)
  return `${baseDe(version, CONTRACT_RISK_PROMPT_KEY)}
${classificationContextBlock(classification)}
${b2bAgbQualifierBlock(classification)}
${ndaModuleBlock(classification)}
${itSaasModuleBlock(classification)}
${riskModifierBlock()}
${confidenceFormulaBlock()}
VORAB-EXTRAKTION:
${extractionSummary}

AUFGABE (Phase 1): Klausel-Findings und Gesamtrisiko-Score.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "findings": [
    {
      "category": "string (max 64 Zeichen)",
      "title": "string (max 240 Zeichen)",
      "description": "string",
      "severity": "niedrig|mittel|hoch",
      "confidence": "number 0-0.98 (NIEMALS 1.0)",
      "clauseRef": "string",
      "quote": "string (wortwörtliches Zitat, max 1200 Zeichen — gekürzt wenn nötig)",
      "suggestedRevision": "string (optional bei niedrig; max 2000 Zeichen bei mittel/hoch)",
      "riskNature": "direct_mandatory_law_risk|agb_control_risk|economic_negotiation_risk|missing_protection_clause|operational_supply_chain_risk|privacy_or_confidentiality_risk|procedural_litigation_risk",
      "findingType": "existing_clause|missing_clause",
      "primaryLegalBasis": ["§ 307 BGB"],
      "referenceLegalBasis": ["§ 309 Nr. 7 BGB als Wertungsindiz"]
    }
  ],
  "riskScore01": "number 0-1 (NICHT 0-100)",
  "aggregateConfidence": "number 0-0.98 (optional)"
}

REGELN:
- Mindestens 3, maximal ${maxFindings} Findings (priorisiere Geschäftsrisiko).
- severity NUR: niedrig|mittel|hoch (Deutsch, kein "high"/"medium").
- confidence und aggregateConfidence NIEMALS 1.0 — Maximalwert 0.98.
- riskScore01 zwischen 0 und 1 (0.75 = 75% Risiko).
- Jedes Finding MUSS riskNature, findingType und primaryLegalBasis enthalten.
- Bei B2B-Verträgen: § 307 BGB als Primärnorm. §§ 308/309 BGB nur als Wertungsindiz.
- quote: wörtlich aus dem Vertrag; bei fehlender Klausel: null.
- Halte suggestedRevision kompakt — Qualität vor Länge.
- Ausgabe: reines JSON ohne Markdown-Fences.

FINDING-GRANULARITÄT (WICHTIG):
- NICHT mehrere verschiedene Risiken in einem Finding zusammenfassen.
- Jede eigenständige Problemklausel bekommt ein eigenes Finding.
- Lieber 15 granulare Findings als 10 gemischte.

MISSING-CLAUSE-PRÜFUNG (zusätzlich zu vorhandenen Klauseln):
Prüfe ob folgende Schutzklauseln FEHLEN (findingType="missing_clause", riskNature="missing_protection_clause"):
1. Lieferverzugsregelung / Ersatzbeschaffung → severity=hoch bei Lieferantenverträgen
2. Qualitätssicherung / Prüfprotokolle / Zertifikate → severity=hoch bei technischen Komponenten
3. Force Majeure / Lieferkettenstörung → IMMER als Finding bei Rahmenverträgen mit Lieferpflicht (severity=mittel)
4. Produkthaftung / Rückruf → severity=hoch bei Industriekomponenten
5. Datenschutz / AVV → IMMER als Finding wenn "Kundendaten" oder "personenbezogene Daten" im Vertrag (severity=mittel)
6. Salvatorische Klausel → wenn Ersetzungsklausel statt geltungserhaltender Reduktion (severity=niedrig)
- clauseRef="Nicht geregelt", quote=null.
- MINDESTENS für Kategorien 1, 3 und 5 ein Finding erzeugen wenn sie fehlen.

SEVERITY-LEITLINIEN:
- Personenschäden-Haftungsbeschränkung: IMMER hoch
- Gewährleistungsfristverkürzung: hoch bei technischen/sicherheitsrelevanten Produkten
- Aufrechnungsverbot: hoch
- Force-Majeure fehlt: mittel
- Gerichtsstandsprivileg: mittel
${assembleTypeSpecificBlocks(classification, extractionSummary)}
Der Vertragstext folgt im nächsten Abschnitt.`
}

export function buildRiskGuidancePromptInstructions(
  extractionSummary: string,
  findingsJson: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${baseDe(version, CONTRACT_RISK_PROMPT_KEY)}

VORAB-EXTRAKTION:
${extractionSummary}

BEREITS ERSTELLTE FINDINGS (Phase 1 — nicht wiederholen):
${findingsJson}

AUFGABE (Phase 2): Handlungsempfehlungen und Verhandlungshinweise.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "recommendedMeasures": ["string", "..."],
  "negotiationHints": ["string", "..."],
  "explanationSummary": "string (kompakte Gesamtbegründung, max 3000 Zeichen)",
  "aggregateConfidence": "number 0-0.98 (optional, NIEMALS 1.0)"
}

REGELN:
- Beziehe dich auf die Findings oben.
- Ausgabe: reines JSON ohne Markdown-Fences.`
}

export function buildRiskAndGuidancePromptInstructions(
  extractionSummary: string,
  documentCharLength: number,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  const maxFindings = maxFindingsForDocumentLength(documentCharLength)
  return `${baseDe(version, CONTRACT_RISK_PROMPT_KEY)}
${classificationContextBlock(classification)}
${b2bAgbQualifierBlock(classification)}
${ndaModuleBlock(classification)}
${itSaasModuleBlock(classification)}
${riskModifierBlock()}
${confidenceFormulaBlock()}
VORAB-EXTRAKTION:
${extractionSummary}

AUFGABE: Klausel- und Risikoanalyse inkl. Handlungsempfehlungen.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "findings": [ {
    "category", "title", "description",
    "severity": "niedrig|mittel|hoch",
    "confidence": "number 0-0.98 (NIEMALS 1.0)",
    "clauseRef",
    "quote": "exaktes Zitat max 1200 Zeichen",
    "suggestedRevision": "max 2000 Zeichen",
    "riskNature": "direct_mandatory_law_risk|agb_control_risk|economic_negotiation_risk|missing_protection_clause|operational_supply_chain_risk|privacy_or_confidentiality_risk|procedural_litigation_risk",
    "findingType": "existing_clause|missing_clause",
    "primaryLegalBasis": ["§ 307 BGB"],
    "referenceLegalBasis": ["§ 309 Nr. 7 BGB als Wertungsindiz"]
  } ],
  "riskScore01": "number 0-1",
  "recommendedMeasures": ["string"],
  "negotiationHints": ["string"],
  "explanationSummary": "string",
  "aggregateConfidence": "number 0-0.98"
}

REGELN:
- Mindestens 3, maximal ${maxFindings} Findings.
- severity auf Deutsch: niedrig|mittel|hoch.
- confidence und aggregateConfidence NIEMALS 1.0 oder 100 % — Maximalwert 0.98.
- riskScore01: 0-1 Skala.
- quote: max 1200 Zeichen.
- suggestedRevision: max 2000 Zeichen.
- Jedes Finding MUSS riskNature, findingType und primaryLegalBasis enthalten.
- Bei B2B-Verträgen: § 307 BGB als Primärnorm. §§ 308/309 BGB nur als Wertungsindiz.
- Ausgabe: reines JSON ohne Markdown-Fences.

FINDING-GRANULARITÄT (WICHTIG):
- NICHT mehrere verschiedene Risiken in einem Finding zusammenfassen.
- Jede eigenständige Problemklausel bekommt ein eigenes Finding:
  * Haftungsbeschränkung (Personenschäden/grobe Fahrlässigkeit) = eigenes Finding
  * Rücktrittsausschluss / Gewährleistungsfristverkürzung = eigenes Finding
  * Rügefristen (24h/48h) = eigenes Finding
  * Aufrechnungs-/Zurückbehaltungsverbot = eigenes Finding
  * Gefahrübergang / Teillieferungsregelung = eigenes Finding
- Das Zusammenfassen verschiedener §§ in ein Finding verfälscht die Priorisierung.
- Lieber 15 granulare Findings als 10 gemischte.

MISSING-CLAUSE-PRÜFUNG (zusätzlich zu vorhandenen Klauseln):
Prüfe ob folgende Schutzklauseln im Vertrag FEHLEN und erzeuge dafür Findings mit findingType="missing_clause" und riskNature="missing_protection_clause":
1. Lieferverzugsregelung / Ersatzbeschaffung / Vertragsstrafe bei Verzug → severity=hoch bei Lieferantenverträgen
2. Qualitätssicherung / Prüfprotokolle / Zertifikate → severity=hoch bei technischen/sicherheitsrelevanten Komponenten
3. Force Majeure / Lieferkettenstörung / höhere Gewalt → bei JEDEM Rahmenvertrag mit Lieferpflicht ist das Fehlen einer Force-Majeure-Klausel ein Finding (severity=mittel)
4. Produkthaftung / Rückruf / Compliance-Dokumentation → severity=hoch bei Industriekomponenten
5. Datenschutz-Rollenklärung / AVV / TOMs → wenn der Vertrag "Kundendaten", "personenbezogene Daten", "Geschäftsdaten" oder ähnliches erwähnt UND keine Datenschutzregelung enthält → IMMER als Finding erzeugen (severity=mittel)
6. Salvatorische Klausel → wenn eine Ersetzungsklausel statt geltungserhaltender Reduktion verwendet wird → Finding (severity=niedrig), weil BGH geltungserhaltende Reduktion bei AGB ablehnt
- Missing-Clause-Findings: clauseRef="Nicht geregelt", quote=null.
- Erzeuge MINDESTENS für Kategorien 1, 3 und 5 ein Finding wenn sie im Vertrag fehlen.

SEVERITY-LEITLINIEN (für konsistente Bewertung):
- Haftungsbeschränkung bei Personenschäden: IMMER hoch
- Rücktrittsausschluss: hoch
- Gewährleistungsfristverkürzung auf 12 Monate: hoch bei technischen/sicherheitsrelevanten Produkten, mittel bei Standardware
- Aufrechnungsverbot: hoch (da auch bei Mängeln greifend)
- Geheimhaltung asymmetrisch + Vertragsstrafe > 25.000 EUR: hoch
- Force-Majeure fehlt: mittel
- Gerichtsstandsprivileg: mittel
- Teillieferungen: mittel bis niedrig
${assembleTypeSpecificBlocks(classification, extractionSummary)}
Der Vertragstext folgt im nächsten Abschnitt.`
}

/** @deprecated Legacy — enthält eingebetteten Vertragstext (Doppelung wenn Provider documentText nutzt). */
export function buildRiskAndGuidancePromptBody(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  return `${buildRiskAndGuidancePromptInstructions(
    extractionSummary,
    normalizedDocument.length,
    version,
    classification
  )}

VERTRAGSTEXT:
${normalizedDocument}`
}

export type DefaultContractPromptBundle = {
  bundleKey: typeof CONTRACT_PROMPT_BUNDLE_KEY
  extraction: { key: typeof CONTRACT_EXTRACTION_PROMPT_KEY; version: string; text: string }
  risk: { key: typeof CONTRACT_RISK_PROMPT_KEY; version: string; text: string }
}

export function buildDefaultContractPromptBundle(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): DefaultContractPromptBundle {
  return {
    bundleKey: CONTRACT_PROMPT_BUNDLE_KEY,
    extraction: {
      key: CONTRACT_EXTRACTION_PROMPT_KEY,
      version,
      text: buildExtractionPromptBody(normalizedDocument, version)
    },
    risk: {
      key: CONTRACT_RISK_PROMPT_KEY,
      version,
      text: buildRiskAndGuidancePromptBody(normalizedDocument, extractionSummary, version)
    }
  }
}

/** Ab dieser Dokumentlänge: Risk-Stage in zwei Phasen (Findings + Guidance). */
export function shouldSplitRiskStage(documentCharLength: number): boolean {
  const threshold = Number.parseInt(process.env.AI_RISK_SPLIT_CHAR_THRESHOLD ?? "25000", 10)
  return documentCharLength >= threshold
}
