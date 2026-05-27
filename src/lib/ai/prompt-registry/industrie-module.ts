/**
 * Industrie-/Lieferantenvertrag-Branchenmodul
 *
 * Trigger: Classification enthält "Lieferantenvertrag", "Kaufvertrag",
 *          oder Branche = Industrie/Fertigung/Maschinenbau
 *
 * Quelle: System Prompt v3.0, Block 6 Modul A + Block 7 Muster 1-3
 * Version: contract.industry_module.v1.0@2026-05-27
 */

/**
 * Industrie-Pflichtprüfpunkte als Prompt-Block.
 */
export function industrieRiskModuleBlock(): string {
  return `
INDUSTRIE/LIEFERANTENVERTRAG PFLICHTPRÜFPUNKTE:

I-1 — CE-KONFORMITÄT:
Enthält der Vertrag eine Verpflichtung zur CE-Kennzeichnung und Konformitätserklärung?
→ Bei Industriekomponenten FEHLEND: findingType="missing_clause", severity=mittel

I-2 — PRODUKTHAFTPFLICHTVERSICHERUNG:
Ist der Lieferant zur Vorlage einer Produkthaftpflichtversicherung verpflichtet?
→ FEHLEND bei sicherheitsrelevanten Komponenten: findingType="missing_clause", severity=mittel

I-3 — LkSG-KLAUSEL:
Enthält der Vertrag Sorgfaltspflichten nach Lieferkettensorgfaltspflichtengesetz?
→ FEHLEND: findingType="missing_clause", severity=mittel, Konfidenz max. 70% (Unternehmensgröße unbekannt)

I-4 — QUALITÄTSSICHERUNG + DOKUMENTATION:
Enthält der Vertrag QM-Anforderungen (ISO 9001), Prüfprotokolle, Materialzertifikate?
→ Bei technischen Komponenten FEHLEND: findingType="missing_clause", severity=hoch

I-5 — RÜGEFRISTEN VS. QM-STANDARD:
24h-Rügefristen sind mit ISO 9001 / IATF 16949 QM-Prozessen unvereinbar.
→ < 5 Werktage Rügefrist bei technischen Waren: severity=hoch`
}

/**
 * Lieferantenvertrag Cross-Clause-Muster als Prompt-Block.
 */
export function industrieCrossClauseBlock(): string {
  return `
LIEFERANTENVERTRAG CROSS-CLAUSE-INTERAKTIONEN (Muster 1-3 prüfen):

MUSTER 1 — PREIS-ANNAHME-FALLE:
[Schweigeannahme bei Bestellungen] × [Preis gilt zum Lieferzeitpunkt, nicht Bestellzeitpunkt]
→ Risiko: Verbindliche Bestellung ohne verbindlichen Preis. Auftraggeber bestellt zu Preis X, Lieferant liefert zu Preis Y.
→ Falls erkannt: severity=hoch

MUSTER 2 — MÄNGELRECHTE-AUSHÖHLUNG:
[Kurze Rügefristen 24/48h] × [Aufrechnungsverbot auch bei Mängeln] × [Kein Rücktrittsrecht]
→ Risiko: Selbst fristgerechte Rüge nutzlos, da Zahlung trotzdem fällig und kein Druckmittel.
→ Falls erkannt: severity=hoch

MUSTER 3 — KONSTRUIERTES AUSSTIEGSSZENARIO:
[Sofortige Kündigung bei 10 Tagen Zahlungsverzug] × [Einseitiges Preisänderungsrecht] × [Schweige-AGB-Änderung]
→ Risiko: Lieferant erhöht Preis, Auftraggeber kann nicht widersprechen, Verzug bei Zahlung der höheren Rechnung, fristlose Kündigung.
→ Falls erkannt: severity=hoch`
}

/**
 * Prüft ob ein Vertragstyp das Industrie-Modul triggert.
 */
export function isIndustrieContractType(classification?: string | null): boolean {
  if (!classification) return false
  const lower = classification.toLowerCase()
  return (
    lower.includes("lieferant") ||
    lower.includes("kaufvertrag") ||
    lower.includes("rahmenvertrag") ||
    lower.includes("supply") ||
    lower.includes("purchase")
  )
}
