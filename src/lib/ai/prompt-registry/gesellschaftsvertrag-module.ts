/**
 * Gesellschaftsvertrag-Branchenmodul für KanzleiAI Vertragsanalyse-Engine
 *
 * Trigger: Classification enthält "Gesellschaftsvertrag", "Satzung",
 *          "GmbH-Vertrag", "Partnerschaftsvertrag", "Konsortialvertrag",
 *          "Shareholder Agreement"
 *
 * Quelle: System Prompt v3.0, Block 6 Modul F
 * Version: contract.gesellschaftsvertrag_module.v1.0@2026-05-29
 */

/**
 * Gesellschaftsvertrag-Pflichtprüfpunkte (G-1 bis G-6) als Prompt-Block.
 */
export function gesellschaftsvertragRiskModuleBlock(): string {
  return `
GESELLSCHAFTSVERTRAG PFLICHTPRÜFPUNKTE (alle 6 prüfen):

G-1 — ABFINDUNGSKLAUSEL:
Buchwertklausel oder stark unter Verkehrswert liegende Abfindung → grob unbillig wenn unter 50 % des Verkehrswerts (BGH, § 138 BGB).
→ Bewertungsmethode prüfen: Ertragswertverfahren (IDW S 1) / DCF / Substanzwert — pauschal "Buchwert" ohne Methode unzureichend.
→ Ratenzahlung der Abfindung: 3-5 Jahre üblich; > 5 Jahre wirtschaftlich entwertend.
→ Buchwertklausel ohne marktnahe Korrektur: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=hoch
→ Abfindungsregelung fehlt vollständig: findingType="missing_clause", riskNature="missing_protection_clause", severity=hoch

G-2 — VINKULIERUNG + VORKAUFSRECHT:
Zustimmungspflicht der Gesellschaft / Mitgesellschafter bei Anteilsübertragung vorhanden?
→ Vorkaufsrecht für Mitgesellschafter geregelt? Bewertungsformel für Ausübungspreis klar?
→ Drag-Along (Mitverkaufspflicht) / Tag-Along (Mitverkaufsrecht) vorhanden?
→ Fehlende Vinkulierung: fremde Dritte können Anteile erwerben → feindliche Übernahme möglich.
→ Fehlende Vinkulierungsklausel: findingType="missing_clause", riskNature="missing_protection_clause", severity=hoch
→ Fehlende Drag-Along/Tag-Along-Regelung bei Mehrheitsbeteiligungen: findingType="missing_clause", riskNature="economic_negotiation_risk", severity=mittel

G-3 — WETTBEWERBSVERBOT FÜR GESELLSCHAFTER:
Während Mitgliedschaft: gesetzliches Wettbewerbsverbot bei OHG/KG (§ 112 HGB); GmbH-Gesellschafter nur bei gesellschaftsvertraglicher Regelung.
→ Nachvertragliches Wettbewerbsverbot: Dauer und geografischer Umfang angemessen? Karenzentschädigung?
→ Fehlendes Wettbewerbsverbot für geschäftsführende Gesellschafter: findingType="missing_clause", riskNature="economic_negotiation_risk", severity=hoch
→ Nachvertragliches Verbot > 2 Jahre oder ohne Entschädigung: findingType="existing_clause", riskNature="direct_mandatory_law_risk", severity=mittel

G-4 — GEWINNVERTEILUNG + ENTNAHMERECHT:
Verhältnis Gewinnverteilung zu Kapitalanteilen angemessen und klar geregelt?
→ Entnahmebeschränkungen / Thesaurierungspflicht: Vereinbarkeit mit Liquiditätsbedarf?
→ Vorabvergütung für geschäftsführende Gesellschafter geregelt? Angemessenes Verhältnis zur Marktüblichkeit?
→ Fehlende Gewinnverteilungsregelung: findingType="missing_clause", riskNature="economic_negotiation_risk", severity=hoch
→ Unbegrenzte Entnahmen ohne Liquiditätsvorbehalt: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel

G-5 — BESCHLUSSFASSUNG + STIMMRECHTE:
Einfache Mehrheit für wesentliche Beschlüsse (Kapitalerhöhung, Satzungsänderung, Auflösung)?
→ Qualifizierte Mehrheit (3/4 oder 2/3) oder Einstimmigkeit für grundlegende Entscheidungen?
→ Sperrminorität für Minderheitsgesellschafter geregelt?
→ Deadlock-Klausel fehlt: bei 50/50-Beteiligung kann Gesellschaft blockiert werden.
→ Fehlende Deadlock-Regelung bei Pattsituationen: findingType="missing_clause", riskNature="procedural_litigation_risk", severity=hoch
→ Einfache Mehrheit für Satzungsänderungen (ohne Minderheitsschutz): findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel

G-6 — NACHFOLGEREGELUNG (Tod, Berufsunfähigkeit, Insolvenz):
Tod eines Gesellschafters: Eintrittsrecht der Erben geregelt? Fortsetzungsklausel?
→ Ohne Regelung → gesetzlich ggf. Auflösung der Gesellschaft (Personengesellschaft, §§ 727, 731 BGB a.F. / MoPeG).
→ Insolvenz eines Gesellschafters: Ausschluss- oder Einziehungsrecht?
→ Fehlende Nachfolgeregelung bei Personengesellschaft: findingType="missing_clause", riskNature="procedural_litigation_risk", severity=hoch
→ Eintrittsrecht von Erben ohne Eignungsprüfung oder Zustimmungsvorbehalt: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel`
}

/**
 * Gesellschaftsvertrag Cross-Clause-Interaktionen als Prompt-Block.
 */
export function gesellschaftsvertragCrossClauseBlock(): string {
  return `
GESELLSCHAFTSVERTRAG CROSS-CLAUSE-INTERAKTIONEN (3 Muster prüfen):

MUSTER GV-1 — ABFINDUNGS-DEADLOCK-KOMBINATION:
[Buchwertklausel < Verkehrswert] × [Keine Deadlock-Regelung] × [50/50-Stimmrechte]
→ Risiko: Gesellschafter blockiert Beschlüsse, um erzwungenes Ausscheiden und Buchwertabfindung zu vermeiden — oder nutzt Deadlock als Druckmittel für günstigen Anteilskauf.
→ Falls erkannt: findingType="existing_clause", riskNature="procedural_litigation_risk", severity=hoch

MUSTER GV-2 — VINKULIERUNGS-NACHFOLGE-LÜCKE:
[Strenge Vinkulierung bei Lebendübertragungen] × [Keine Regelung für Erbfall] × [Keine Einziehungsklausel]
→ Risiko: Übertragung auf unerwünschten Dritten zu Lebzeiten verhindert, aber unerwünschte Erben treten automatisch in die Gesellschaft ein — die strenge Vinkulierung wird durch den Erbfall umgangen.
→ Falls erkannt: findingType="existing_clause", riskNature="missing_protection_clause", severity=hoch

MUSTER GV-3 — GEWINNTHESAURIERUNG-ENTNAHME-KONFLIKT:
[Thesaurierungspflicht ohne Ausnahme] × [Hohe Vorabvergütung für geschäftsführenden Gesellschafter] × [Keine Regelung für außerordentlichen Liquiditätsbedarf]
→ Risiko: Kapitalanteile wachsen durch Thesaurierung, gleichzeitig zieht der Geschäftsführer-Gesellschafter Mittel über Vergütung ab — Minderheitsgesellschafter erhält faktisch keine Gewinnausschüttung.
→ Falls erkannt: findingType="existing_clause", riskNature="economic_negotiation_risk", severity=mittel`
}

/**
 * Prüft ob ein Vertragstyp das Gesellschaftsvertrag-Modul triggert.
 */
export function isGesellschaftsvertragType(classification?: string | null): boolean {
  if (!classification) return false
  const lower = classification.toLowerCase()
  return (
    lower.includes("gesellschaftsvertrag") ||
    lower.includes("satzung") ||
    lower.includes("gmbh") ||
    lower.includes("partnerschaftsvertrag") ||
    lower.includes("konsortialvertrag") ||
    lower.includes("shareholder") ||
    lower.includes("beteiligungsvertrag") ||
    lower.includes("gesellschafter")
  )
}
