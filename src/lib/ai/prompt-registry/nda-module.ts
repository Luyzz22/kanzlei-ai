/**
 * NDA-Branchenmodul für KanzleiAI Vertragsanalyse-Engine
 *
 * Wird vom Prompt-Router geladen wenn Classification einen der Trigger erkennt:
 * - contractClassification enthält "NDA", "Geheimhaltung", "Non-Disclosure"
 * - Vertrag hat signifikante Geheimhaltungsklauseln (sekundärer Trigger)
 *
 * Quelle: System Prompt v3.0, Block 6 Modul C + Block 7 Muster 4-6
 * Version: contract.nda_module.v1.0@2026-05-27
 */

/**
 * NDA-Pflichtprüfpunkte (N-1 bis N-6) als Prompt-Block.
 * Wird an den Risk-Prompt angehängt wenn NDA erkannt.
 */
export function ndaRiskModuleBlock(): string {
  return `
NDA-SPEZIFISCHE PFLICHTPRÜFPUNKTE (alle 6 prüfen):

N-1 — CONTAMINATED SOURCE:
Prüfe ob die Ausnahmeregelung für Drittinformationen eine Schutzlücke enthält.
UNZUREICHEND (Finding erzeugen!): "...von einem Dritten erhalten hat, ohne dass dieser einer Geheimhaltungspflicht unterlag"
→ Problem: Dritter könnte Info unter Verletzung SEINER Geheimhaltungspflicht gegenüber der offenbarenden Partei weitergegeben haben.
AUSREICHEND: "...von einem Dritten, der seinerseits nicht zur Geheimhaltung verpflichtet war UND die Info nicht unter Verletzung einer gegenüber Dritten bestehenden Geheimhaltungspflicht erlangt hat"
→ Falls unzureichend: findingType="existing_clause", riskNature="privacy_or_confidentiality_risk", severity=mittel

N-2 — ECHTE GEGENSEITIGKEIT (Mutual NDA):
Prüfe ob ALLE Schutzpflichten tatsächlich gegenseitig sind.
Vergleiche §§ 3, 4, 7, 9, 10 auf einseitige Ausgestaltung.
→ Einseitige Pflichten trotz "gegenseitig"/"mutual" in Präambel: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch

N-3 — GeschGehG SCHUTZMASSNAHMEN:
Definiert der Vertrag konkrete technische und organisatorische Schutzmaßnahmen?
→ Ohne TOMs: GeschGehG § 2 Nr. 1 lit. b Voraussetzung nicht erfüllt, Geheimnisschutz gefährdet.
→ Falls fehlend: findingType="missing_clause", riskNature="privacy_or_confidentiality_risk", severity=mittel

N-4 — SCHUTZRECHTSANMELDUNGSVERBOT:
Enthält der Vertrag ein Verbot, auf Basis vertraulicher Informationen Patente/Schutzrechte anzumelden?
→ Falls fehlend: findingType="missing_clause", riskNature="privacy_or_confidentiality_risk", severity=mittel

N-5 — HAFTUNG UND VERTRAGSSTRAFE:
Prüfe:
a) Ist eine Vertragsstrafe vereinbart? Fehlt sie → severity=hoch (keine Abschreckung)
b) Ist ein Haftungsdeckel vereinbart? Ist er verhältnismäßig zum Informationswert?
   EUR 5.000 bei potenziell millionenschwerer IP → severity=hoch
c) Ist Haftung für leichte Fahrlässigkeit bei Vertragsverletzung ausgeschlossen?
   → severity=hoch (§ 276 Abs. 3 BGB: Vorsatz nicht abdingbar, aber leichte Fahrlässigkeit darf nicht pauschal für die VERTRAGSVERLETZUNG SELBST ausgeschlossen werden)

N-6 — LAUFZEIT VS. WIRTSCHAFTLICHER WERT:
Prüfe Geheimhaltungsfrist gegen Branchenstandard:
- Software/Cloud/Fintech: Standard 3-5 Jahre post-contractual
- Kerngeschäftsgeheimnisse: unbefristet empfohlen
- Allgemein: mindestens 2-3 Jahre
→ ≤18 Monate für Technologie-/Software-Geheimnisse: severity=hoch
→ ≤12 Monate post-contractual für Archivkopien: severity=mittel

N-7 — DATENSCHUTZ / AVV BEI INFORMATIONSAUSTAUSCH:
Prüfe ob der Vertrag Datenschutzregelungen enthält wenn:
- Softwareentwicklung, Cloud, Fintech, Finanzbranche erwähnt wird
- "Geschäftsdaten", "Kundendaten", "Nutzerdaten" im Text vorkommen
- Mitarbeiter-/Personal-Informationen ausgetauscht werden könnten
→ Fehlende DSGVO-Regelung (Art. 26 gemeinsame Verantwortlichkeit oder Art. 28 AVV):
   findingType="missing_clause", riskNature="privacy_or_confidentiality_risk", severity=hoch
→ Bei Cloud/Fintech/Software IMMER als Finding erzeugen, da personenbezogene Daten typischerweise mitverarbeitet werden.`
}

/**
 * NDA Cross-Clause-Muster (Muster 4-6) als Prompt-Block.
 */
export function ndaCrossClauseBlock(): string {
  return `
NDA CROSS-CLAUSE-INTERAKTIONEN (Muster 4-6 prüfen):

MUSTER 4 — ZEITFALLEN-KOMBINATION:
[Kündigung jederzeit ohne Grund] × [Rückgabe nur auf 30-Tage-Verlangen nach Kündigung] × [Archivklausel mit verlängerter Geheimhaltung]
→ Risiko: Überraschungskündigung + verpasste Rückgabefrist = Informationen dauerhaft beim Empfänger mit nur kurzer Restgeheimhaltung.
→ Falls erkannt: eigenes Finding mit severity=hoch, findingType="existing_clause", riskNature="procedural_litigation_risk"

MUSTER 5 — WEITERGABE-HAFTUNGSLÜCKE:
[Weitergabe an Dritte ohne Zustimmung, Pflicht nur "soweit zumutbar"] × [Niedriger Haftungsdeckel]
→ Risiko: Dritter leakt Information, Haftung minimal, kein Direktanspruch gegen Dritten.
→ Falls erkannt: severity=hoch

MUSTER 6 — IP-VERLUST-KOMBINATION:
[Mündliche Infos nur mit 48h-Bestätigung vertraulich] × [Fehlende Vertragsstrafe] × [Kein Schutzrechtsanmeldungsverbot]
→ Risiko: Mündlich besprochene Kern-IP nicht geschützt, Patentanmeldung durch empfangende Partei möglich, keine Abschreckung.
→ Falls erkannt: severity=hoch`
}

/**
 * Prüft ob ein Vertragstyp das NDA-Modul triggert.
 */
export function isNdaContractType(classification?: string | null): boolean {
  if (!classification) return false
  const lower = classification.toLowerCase()
  return (
    lower.includes("nda") ||
    lower.includes("geheimhaltung") ||
    lower.includes("non-disclosure") ||
    lower.includes("vertraulichkeit") ||
    lower.includes("confidentiality")
  )
}

/**
 * Prüft ob ein Vertrag NDA-ähnliche Klauseln hat (sekundärer Trigger).
 * Wird auf den Extraktionstext angewandt.
 */
export function hasSignificantNdaClauses(extractionSummary: string): boolean {
  const lower = extractionSummary.toLowerCase()
  const indicators = [
    "geheimhaltung",
    "vertraulich",
    "vertragsstrafe",
    "geheimhaltungspflicht",
    "kundendaten",
    "geschäftsgeheimnisse",
  ]
  const matchCount = indicators.filter((i) => lower.includes(i)).length
  // Mindestens 3 Indikatoren für sekundären Trigger
  return matchCount >= 3
}
