/**
 * Arbeitsvertrag-Branchenmodul für KanzleiAI Vertragsanalyse-Engine
 *
 * Trigger: Classification enthält "Arbeitsvertrag", "Anstellungsvertrag",
 *          "Dienstvertrag", "Employment"
 *
 * Quelle: System Prompt v3.0, Block 6 Modul D
 * Version: contract.arbeitsvertrag_module.v1.0@2026-05-29
 */

/**
 * Arbeitsvertrag-Pflichtprüfpunkte (A-1 bis A-7) als Prompt-Block.
 */
export function arbeitsvertragRiskModuleBlock(): string {
  return `
ARBEITSVERTRAG PFLICHTPRÜFPUNKTE (alle 7 prüfen):

A-1 — BEFRISTUNG (§ 14 TzBfG):
Ist der Vertrag befristet? Falls ja: Sachgrund vorhanden?
→ Ohne Sachgrund: max. 2 Jahre Gesamtdauer, max. 3 Verlängerungen (§ 14 Abs. 2 TzBfG).
→ Kettenbefristung prüfen: Vorbeschäftigung beim selben Arbeitgeber schließt sachgrundlose Befristung aus (§ 14 Abs. 2 Satz 2 TzBfG).
→ Fehlender Sachgrund bei > 2 Jahren oder > 3 Verlängerungen: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch

A-2 — KÜNDIGUNGSFRISTEN (§ 622 BGB):
Gesetzliche Mindestfristen eingehalten?
→ Probezeit max. 6 Monate; Kündigungsfrist in Probezeit: 2 Wochen.
→ Verlängerte Fristen nach Betriebszugehörigkeit (§ 622 Abs. 2 BGB) korrekt gestaffelt?
→ Verkürzung der gesetzlichen Fristen für Arbeitnehmer: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch

A-3 — WETTBEWERBSVERBOT (§§ 74 ff. HGB):
Nachvertragliches Wettbewerbsverbot vorhanden?
→ Max. 2 Jahre Dauer (§ 74a Abs. 1 HGB).
→ Karenzentschädigung mindestens 50 % der letzten vertraglich bezogenen Vergütung (§ 74 Abs. 2 HGB).
→ Schriftform erforderlich (§ 74 Abs. 1 HGB).
→ Ohne Karenzentschädigung: unverbindlich — Arbeitnehmer kann wählen ob er sich bindet (§ 74 Abs. 2 HGB).
→ Fehlende Karenzentschädigung bei vereinbartem Verbot: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch
→ Dauer > 2 Jahre: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=hoch

A-4 — ÜBERSTUNDENREGELUNG:
"Überstunden sind mit dem Gehalt abgegolten" — Wirksamkeit prüfen:
→ Bei Bruttogehalt unterhalb der Beitragsbemessungsgrenze (BBG) UNWIRKSAM nach BAG-Rechtsprechung (BAG v. 22.02.2012 — 5 AZR 765/10).
→ Fehlende Obergrenze (z.B. "bis zu 10 % der regelmäßigen Arbeitszeit") macht Pauschalabgeltung unbestimmt → unwirksam.
→ "Abgegolten"-Klausel ohne Begrenzung: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch

A-5 — VERTRAGSSTRAFEN (§ 309 Nr. 6 BGB / BAG):
Vertragsstrafe bei Nichtantritt oder vorzeitigem Ausscheiden?
→ BAG: Max. 1 Bruttomonatsgehalt (BAG v. 18.08.2005 — 8 AZR 65/05); höhere Vertragsstrafe unangemessen → unwirksam.
→ Vertragsstrafe höher als 1 Bruttomonatsgehalt: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch

A-6 — GEHEIMHALTUNG + IP / ARBEITNEHMERERFINDUNGEN (ArbNErfG):
→ Diensterfindungen des Arbeitnehmers: gesetzliche Meldepflicht (§ 5 ArbNErfG); Inanspruchnahme durch Arbeitgeber (§ 6 ArbNErfG).
→ Fehlt Regelung zur Diensterfindungsmeldepflicht oder wird das ArbNErfG vollständig abbedungen: findingType="missing_clause", riskNature="privacy_or_confidentiality_risk", severity=mittel
→ Nachvertragliche Geheimhaltung ohne Vergütung bei umfangreich definierten Betriebsgeheimnissen: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel

A-7 — DATENSCHUTZ / BESCHÄFTIGTENDATENSCHUTZ (§ 26 BDSG):
→ Datenerhebung aus dem Beschäftigungsverhältnis muss erforderlich sein (§ 26 Abs. 1 BDSG).
→ Einwilligung in Datenverarbeitung muss freiwillig sein — im Arbeitsverhältnis grundsätzlich problematisch (§ 26 Abs. 2 BDSG).
→ Privatnutzung IT geregelt? → Konsequenzen für Monitoring (§ 88 TKG, Betriebsverfassungsrecht).
→ Fehlende oder unzureichende Beschäftigtendatenschutz-Klausel: findingType="missing_clause", riskNature="privacy_or_confidentiality_risk", severity=mittel`
}

/**
 * Arbeitsvertrag Cross-Clause-Interaktionen als Prompt-Block.
 */
export function arbeitsvertragCrossClauseBlock(): string {
  return `
ARBEITSVERTRAG CROSS-CLAUSE-INTERAKTIONEN (3 Muster prüfen):

MUSTER AV-1 — BEFRISTUNGS-KÜNDIGUNGSFRISTEN-KONFLIKT:
[Befristeter Vertrag] × [Lange Probezeit (> 3 Monate)] × [Kurze Restlaufzeit]
→ Risiko: Probezeit läuft in die Befristung hinein; Kündigung in Probezeit mit 2 Wochen Frist beendet den Vertrag de facto vorzeitig ohne Sachgrundkontrolle.
→ Falls erkannt: findingType="existing_clause", riskNature="procedural_litigation_risk", severity=mittel

MUSTER AV-2 — WETTBEWERBSVERBOT-KARENZ-WIDERSPRUCH:
[Nachvertragliches Wettbewerbsverbot > 12 Monate] × [Niedriges Fixgehalt nahe Mindestlohn] × [Keine explizite Karenzregelung]
→ Risiko: Karenzentschädigung ggf. berechnet aus Gehalt, das bereits nahe an der 50%-Untergrenze liegt — oder Karenz nicht klar definiert → Wettbewerbsverbot faktisch unverbindlich.
→ Falls erkannt: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=hoch

MUSTER AV-3 — ÜBERSTUNDEN-TEILZEIT-FALLE:
[Überstunden pauschal abgegolten] × [Teilzeit-Beschäftigung oder variable Arbeitszeit]
→ Risiko: "Abgegolten"-Klausel für Vollzeit konstruiert, wird aber auf Teilzeitstelle angewendet — Verhältnis Grundlohn zu Mehrarbeit verschiebt sich erheblich.
→ Falls erkannt: findingType="existing_clause", riskNature="agb_control_risk", severity=hoch`
}

/**
 * Prüft ob ein Vertragstyp das Arbeitsvertrag-Modul triggert.
 */
export function isArbeitsvertragType(classification?: string | null): boolean {
  if (!classification) return false
  const lower = classification.toLowerCase()
  return (
    lower.includes("arbeitsvertrag") ||
    lower.includes("anstellungsvertrag") ||
    lower.includes("dienstvertrag") ||
    lower.includes("employment") ||
    lower.includes("arbeitnehmer") ||
    lower.includes("arbeitsrecht")
  )
}
