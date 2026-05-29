/**
 * Mietvertrag-Branchenmodul für KanzleiAI Vertragsanalyse-Engine
 *
 * Trigger: Classification enthält "Mietvertrag", "Pachtvertrag",
 *          "Gewerbemietvertrag", "Wohnraummietvertrag", "Lease"
 *
 * Quelle: System Prompt v3.0, Block 6 Modul E
 * Version: contract.mietvertrag_module.v1.0@2026-05-29
 */

/**
 * Mietvertrag-Pflichtprüfpunkte (M-1 bis M-6) als Prompt-Block.
 */
export function mietvertragRiskModuleBlock(): string {
  return `
MIETVERTRAG PFLICHTPRÜFPUNKTE (alle 6 prüfen):

M-1 — MIETERHÖHUNG:
Wohnraum: Kappungsgrenze 20 % in 3 Jahren (§ 558 Abs. 3 BGB); in angespannten Märkten 15 % (Mietpreisbremse § 556d BGB).
Gewerbe: Staffelmiete (§ 557a BGB) oder Indexmiete (§ 557b BGB)?
→ Staffel- und Indexmiete gleichzeitig vereinbart: unwirksam (§ 557 Abs. 3 BGB).
→ Wohnraum-Mieterhöhungsklausel ohne Kappungsgrenze: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch
→ Gewerbe-Indexmiete ohne klare Anpassungsformel: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel

M-2 — SCHÖNHEITSREPARATUREN:
Starre Fristenregelung ("alle 3 Jahre", "alle 5 Jahre") ohne Zustandsklausel → UNWIRKSAM (BGH VIII ZR 185/14 und st. Rspr.).
Quotenabgeltungsklausel bei Auszug → UNWIRKSAM (BGH VIII ZR 84/07).
→ Starre Fristen ohne Renovierungsbedarf-Vorbehalt: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch
→ Quotenabgeltungsklausel: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch

M-3 — BETRIEBSKOSTEN (§ 556 BGB):
Umlage auf Mieter nur wirksam wenn ausdrücklich vereinbart und im Vertrag aufgeführt.
→ Verwaltungskosten und Instandhaltungsrücklagen nicht umlagefähig (Wohnraum, § 1 Abs. 2 BetrKV).
→ Vorauszahlung vereinbart → Abrechnungspflicht binnen 12 Monaten (§ 556 Abs. 3 BGB).
→ Fehlende Nennung der umzulegenden Kostenarten: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=mittel
→ Verwaltungskosten als umlagefähig ausgewiesen (Wohnraum): findingType="existing_clause", riskNature="agb_control_risk", severity=mittel

M-4 — KAUTION:
Wohnraum: Max. 3 Monatsmieten netto (§ 551 Abs. 1 BGB); Anlage auf separatem, insolvenzsicherem Konto (Treuhandpflicht, § 551 Abs. 3 BGB).
Gewerbe: keine gesetzliche Obergrenze, aber AGB-Kontrolle (§ 307 BGB) — > 6 Monatsmieten i.d.R. unangemessen.
→ Wohnraum-Kaution > 3 Monatsmieten: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch
→ Fehlende Treuhandpflicht / kein separates Konto: findingType="missing_clause", riskNature="missing_protection_clause", severity=mittel

M-5 — BEFRISTUNG + KÜNDIGUNGSAUSSCHLUSS:
Zeitmietvertrag (Wohnraum) nur mit gesetzlichem Grund (§ 575 BGB): Eigenbedarfsvorbehalt, Sanierung, sonstiges berechtigtes Interesse.
Kündigungsausschluss max. 4 Jahre ab Vertragsschluss (BGH VIII ZR 86/08).
Gewerbe: Schriftformerfordernis bei Laufzeit > 1 Jahr (§ 550 BGB) — bei Verstoß gilt Vertrag als unbefristet.
→ Kündigungsausschluss > 4 Jahre: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch
→ Gewerbe-Mietvertrag > 1 Jahr ohne Schriftform (elektronische Form reicht nicht): findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch

M-6 — INSTANDHALTUNG + KLEINREPARATURKLAUSEL:
Substanz-Instandhaltung ist Vermieterpflicht (§ 535 Abs. 1 BGB); nur Kleinreparaturen können auf Mieter übertragen werden.
Kleinreparaturklausel muss enthalten:
  (a) Einzelobergrenze (max. ca. 100-150 EUR je Reparatur) und
  (b) Jahresobergrenze (max. ca. 6-8 % der Jahresnettomiete).
→ Kleinreparaturklausel ohne Einzelobergrenze: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch
→ Kleinreparaturklausel ohne Jahresobergrenze: findingType="existing_clause", riskNature="agb_control_risk", severity=mittel`
}

/**
 * Mietvertrag Cross-Clause-Interaktionen als Prompt-Block.
 */
export function mietvertragCrossClauseBlock(): string {
  return `
MIETVERTRAG CROSS-CLAUSE-INTERAKTIONEN (3 Muster prüfen):

MUSTER MV-1 — STAFFELMIETE-BETRIEBSKOSTEN-KUMULIERUNG:
[Staffelmiete mit jährlichem Anstieg] × [Umfangreiche Betriebskostenvorauszahlungen] × [Keine Kappungsgrenze genannt]
→ Risiko: Gesamtmietbelastung (Kalt + Nebenkosten) steigt unkontrolliert; Mieter unterschätzt Gesamtkosten.
→ Falls erkannt: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel

MUSTER MV-2 — SCHRIFTFORM-FALLE (§ 550 BGB Gewerbe):
[Mietvertrag > 1 Jahr Laufzeit] × [Anlagen oder Nachträge nicht unterzeichnet] × [Optionen/Verlängerungen in separatem Schreiben]
→ Risiko: Schriftformverstoß → Vertrag gilt als auf unbestimmte Zeit geschlossen → ordentliche Kündigung möglich, obwohl Parteien Festlaufzeit wollten.
→ Falls erkannt: findingType="existing_clause", riskNature="procedural_litigation_risk", severity=hoch

MUSTER MV-3 — KAUTIONS-RÜCKGABE-UNSICHERHEIT:
[Hohe Kaution (> 3 Monatsmieten)] × [Weite Aufrechnung mit "allen Ansprüchen aus dem Mietverhältnis"] × [Fehlende Rückgabefrist]
→ Risiko: Vermieter hält Kaution über Monate zurück, rechnet streitige Forderungen auf — Mieter ohne liquide Mittel.
→ Falls erkannt: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel`
}

/**
 * Prüft ob ein Vertragstyp das Mietvertrag-Modul triggert.
 */
export function isMietvertragType(classification?: string | null): boolean {
  if (!classification) return false
  const lower = classification.toLowerCase()
  return (
    lower.includes("mietvertrag") ||
    lower.includes("pachtvertrag") ||
    lower.includes("gewerbemiet") ||
    lower.includes("wohnraummiet") ||
    lower.includes("mietverhältnis") ||
    lower.includes("lease") ||
    lower.includes("miete")
  )
}
