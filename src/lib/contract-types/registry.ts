/**
 * Contract Type Registry
 *
 * Definiert pro Vertragstyp:
 * - Welche Sektionen sichtbar sind (z.B. AVV nur bei SaaS, nicht bei NDA)
 * - Wording-Varianten (NDA: "Agreement Term" statt "Mindestlaufzeit")
 * - Welche Klauseln Market-Standard sind (zum Erkennen von Lücken)
 * - Welche Risikodimensionen relevant sind
 *
 * Das löst das "One-Size-Fits-All"-Problem: Die UI passt sich semantisch
 * an den tatsächlichen Vertragstyp an, statt generische Felder zu zeigen.
 */

export type ContractTypeId =
  | "nda"
  | "saas"
  | "avv"
  | "lieferantenvertrag"
  | "rahmenvertrag"
  | "arbeitsvertrag"
  | "dienstleistungsvertrag"
  | "msa"
  | "supplier-agreement-en"
  | "nda-en"
  | "service-agreement-en"
  | "purchase-agreement-en"

export type SectionId =
  | "term-and-renewal"
  | "termination"
  | "liability"
  | "indemnification"
  | "ip-rights"
  | "confidentiality"
  | "data-processing-avv"
  | "service-levels-sla"
  | "payment-terms"
  | "scope-of-services"
  | "warranties"
  | "governing-law"
  | "compliance-clauses"

export type RiskDimension =
  | "legal"
  | "financial"
  | "operational"
  | "compliance"

export interface ContractTypeProfile {
  id: ContractTypeId
  name: string
  shortName: string
  jurisdiction: "DE" | "EN" | "EU"
  sections: SectionConfig[]
  marketStandardClauses: MarketStandardClause[]
  primaryRisks: RiskDimension[]
  signatureBlockers: string[]
  wording: WordingMap
}

export interface SectionConfig {
  id: SectionId
  visible: boolean
  required: boolean
  emptyStateMessage: string
}

export interface MarketStandardClause {
  id: string
  name: string
  category: "must-have" | "should-have" | "nice-to-have"
  description: string
  fallbackTemplate: string
  bgbReference?: string
}

export interface WordingMap {
  termLabel: string
  noticeLabel: string
  terminationLabel: string
  partyALabel: string
  partyBLabel: string
}

const NDA_PROFILE: ContractTypeProfile = {
  id: "nda",
  name: "Geheimhaltungsvereinbarung (NDA)",
  shortName: "NDA",
  jurisdiction: "DE",
  sections: [
    { id: "term-and-renewal", visible: true, required: true, emptyStateMessage: "Vertraulichkeitsdauer nicht spezifiziert — Marktstandard: 3-5 Jahre nach Beendigung" },
    { id: "termination", visible: true, required: false, emptyStateMessage: "Keine ordentliche Kündigung — bei NDAs ueblich, da Verschwiegenheitspflicht laufzeitunabhängig" },
    { id: "liability", visible: true, required: true, emptyStateMessage: "Haftungsregelung fehlt — kritisch bei Geheimnisbruch" },
    { id: "ip-rights", visible: true, required: true, emptyStateMessage: "Keine IP-Klausel — Risiko bei Residualkenntnissen" },
    { id: "confidentiality", visible: true, required: true, emptyStateMessage: "Vertraulichkeitsumfang nicht definiert" },
    { id: "data-processing-avv", visible: false, required: false, emptyStateMessage: "" },
    { id: "service-levels-sla", visible: false, required: false, emptyStateMessage: "" },
    { id: "payment-terms", visible: false, required: false, emptyStateMessage: "" },
    { id: "scope-of-services", visible: false, required: false, emptyStateMessage: "" },
    { id: "warranties", visible: false, required: false, emptyStateMessage: "" },
    { id: "governing-law", visible: true, required: true, emptyStateMessage: "Anwendbares Recht und Gerichtsstand fehlen" },
    { id: "compliance-clauses", visible: false, required: false, emptyStateMessage: "" }
  ],
  marketStandardClauses: [
    { id: "injunctive-relief", name: "Einstweilige Verfuegung / Injunctive Relief", category: "must-have", description: "Vereinbarung dass bei Geheimnisbruch sofortiger einstweiliger Rechtsschutz möglich ist, da Schadenersatz oft unzureichend.", fallbackTemplate: "Die Parteien sind sich einig, dass bei einer Verletzung der Vertraulichkeitspflichten Schadenersatz allein keinen ausreichenden Rechtsbehelf darstellt. Die verletzte Partei ist berechtigt, neben Schadenersatzansprüchen unverzüglich gerichtlichen Rechtsschutz, insbesondere durch einstweilige Verfügung, zu beantragen.", bgbReference: "§ 935 ZPO" },
    { id: "no-obligation-to-proceed", name: "No Obligation to Proceed", category: "must-have", description: "Klarstellung dass NDA keine Verhandlungs- oder Abschlusspflicht begruendet.", fallbackTemplate: "Diese Vereinbarung begruendet keine Verpflichtung zum Abschluss eines weiteren Vertrages. Jede Partei behaelt sich vor, Verhandlungen jederzeit ohne Angabe von Gruenden zu beenden." },
    { id: "non-solicitation", name: "Non-Solicitation (Mitarbeiter-Abwerbeverbot)", category: "should-have", description: "Schutz vor Abwerbung von Schluesselmitarbeitern waehrend und nach Verhandlungen.", fallbackTemplate: "Die Parteien verpflichten sich, waehrend der Laufzeit dieser Vereinbarung und fuer einen Zeitraum von zwoelf (12) Monaten danach keine Mitarbeiter der jeweils anderen Partei aktiv abzuwerben." },
    { id: "residuals-clause", name: "Residuals Clause", category: "should-have", description: "Regelung ob unbewusst behaltenes Erinnerungswissen nach NDA-Ende verwendet werden darf.", fallbackTemplate: "Unabhaengig von den vorgenannten Bestimmungen duerfen die Parteien Erinnerungswissen ihrer Mitarbeiter (Residuals), das ohne bewusstes Zurueckgreifen auf die vertraulichen Informationen behalten wurde, frei verwenden." },
    { id: "return-of-information", name: "Rueckgabe / Vernichtung", category: "must-have", description: "Pflicht zur Rueckgabe oder Vernichtung vertraulicher Unterlagen nach Vertragsende.", fallbackTemplate: "Nach Beendigung dieser Vereinbarung wird jede Partei alle erhaltenen vertraulichen Informationen, einschliesslich saemtlicher Kopien, unverzueglich zurueckgeben oder nachweislich vernichten und dies schriftlich bestaetigen." }
  ],
  primaryRisks: ["legal", "compliance"],
  signatureBlockers: ["fehlende-vertraulichkeitsdauer", "keine-injunctive-relief", "fehlende-rueckgabepflicht"],
  wording: {
    termLabel: "Geheimhaltungsdauer",
    noticeLabel: "Mitteilungsfrist",
    terminationLabel: "Beendigung der NDA",
    partyALabel: "Offenlegende Partei",
    partyBLabel: "Empfangende Partei"
  }
}

const SAAS_PROFILE: ContractTypeProfile = {
  id: "saas",
  name: "Software-as-a-Service Vertrag",
  shortName: "SaaS",
  jurisdiction: "DE",
  sections: [
    { id: "term-and-renewal", visible: true, required: true, emptyStateMessage: "Mindestlaufzeit nicht angegeben — Marktstandard: 12 Monate" },
    { id: "termination", visible: true, required: true, emptyStateMessage: "Kuendigungsfrist fehlt — Marktstandard: 3 Monate zum Vertragsende" },
    { id: "liability", visible: true, required: true, emptyStateMessage: "Haftungsbegrenzung nicht definiert — Marktstandard: 12 Monatsentgelte" },
    { id: "indemnification", visible: true, required: true, emptyStateMessage: "Freistellungsregelung fehlt (insb. fuer IP-Verletzungen)" },
    { id: "ip-rights", visible: true, required: true, emptyStateMessage: "Nutzungsrechte nicht spezifiziert" },
    { id: "data-processing-avv", visible: true, required: true, emptyStateMessage: "AVV fehlt — bei Verarbeitung personenbezogener Daten zwingend (Art. 28 DSGVO)" },
    { id: "service-levels-sla", visible: true, required: true, emptyStateMessage: "SLA fehlt — Verfuegbarkeit, Reaktionszeiten, Support nicht definiert" },
    { id: "payment-terms", visible: true, required: true, emptyStateMessage: "Zahlungsbedingungen nicht spezifiziert" },
    { id: "scope-of-services", visible: true, required: true, emptyStateMessage: "Leistungsumfang nicht beschrieben" },
    { id: "warranties", visible: true, required: false, emptyStateMessage: "Gewaehrleistung fehlt — Standard: Funktionalitaet gemaess Dokumentation" },
    { id: "governing-law", visible: true, required: true, emptyStateMessage: "Anwendbares Recht und Gerichtsstand fehlen" },
    { id: "compliance-clauses", visible: true, required: true, emptyStateMessage: "Compliance-Klauseln (DSGVO, Audit-Recht) fehlen" }
  ],
  marketStandardClauses: [
    { id: "avv-art28", name: "Auftragsverarbeitungsvertrag (Art. 28 DSGVO)", category: "must-have", description: "Bei Verarbeitung personenbezogener Daten zwingend erforderlich. Muss alle Pflichtinhalte aus Art. 28 Abs. 3 DSGVO enthalten.", fallbackTemplate: "Sofern der Anbieter im Rahmen der Leistungserbringung personenbezogene Daten des Kunden verarbeitet, schliessen die Parteien einen Auftragsverarbeitungsvertrag gemaess Art. 28 DSGVO ab, der diesem Vertrag als Anlage AVV beigefuegt ist und integraler Vertragsbestandteil wird.", bgbReference: "Art. 28 DSGVO" },
    { id: "sla-uptime", name: "SLA Verfuegbarkeit (99,5% Marktstandard)", category: "must-have", description: "Garantierte monatliche Verfuegbarkeit mit Service Credits bei Unterschreitung.", fallbackTemplate: "Der Anbieter garantiert eine monatliche Verfuegbarkeit von mindestens 99,5% (gemessen ueber den Kalendermonat, ausgenommen geplante Wartungsfenster). Bei Unterschreitung erhaelt der Kunde Service Credits gemaess Anlage SLA." },
    { id: "data-portability", name: "Datenexport / Portabilitaet", category: "must-have", description: "Recht auf Export aller Kundendaten in maschinenlesbarem Format bei Vertragsende.", fallbackTemplate: "Der Kunde hat das Recht, seine Daten jederzeit, insbesondere bei Vertragsende, in einem strukturierten, gaengigen und maschinenlesbaren Format zu exportieren. Der Anbieter stellt geeignete Export-Schnittstellen kostenfrei bereit und bewahrt die Daten 30 Tage nach Vertragsende auf Anfrage auf." },
    { id: "audit-right", name: "Audit-Recht des Kunden", category: "should-have", description: "Recht zur Pruefung der Compliance des Anbieters mit vereinbarten Sicherheits- und Datenschutzstandards.", fallbackTemplate: "Der Kunde ist berechtigt, einmal jaehrlich nach Vorankuendigung und waehrend ueblicher Geschaeftszeiten ein Audit der vereinbarten Sicherheits- und Datenschutzmassnahmen durchzufuehren. Alternativ akzeptiert der Kunde aktuelle Zertifikate (ISO 27001, SOC 2 Typ II)." },
    { id: "ai-transparency-eu-ai-act", name: "KI-Transparenz (EU AI Act Art. 50)", category: "must-have", description: "Pflicht zur Offenlegung KI-basierter Entscheidungen (ab August 2026 verpflichtend).", fallbackTemplate: "Sofern der Anbieter KI-Systeme zur automatisierten Entscheidungsfindung einsetzt, informiert er den Kunden transparent ueber Art, Umfang und Zweck dieser Systeme gemaess Art. 50 EU AI Act. Der Anbieter stellt eine schriftliche Erklaerung zur EU AI Act Konformitaet bereit." },
    { id: "subprocessor-list", name: "Unterauftragsverarbeiter-Verzeichnis", category: "must-have", description: "Liste aller Subprocessors mit Aenderungsbenachrichtigung 30 Tage im Voraus.", fallbackTemplate: "Der Anbieter fuehrt ein Verzeichnis aller eingesetzten Unterauftragsverarbeiter und stellt es dem Kunden auf Anfrage zur Verfuegung. Aenderungen werden mindestens 30 Tage im Voraus angekuendigt; der Kunde hat ein Widerspruchsrecht." }
  ],
  primaryRisks: ["legal", "financial", "operational", "compliance"],
  signatureBlockers: ["fehlender-avv", "fehlende-haftungsbegrenzung", "fehlende-sla", "fehlender-datenexport"],
  wording: {
    termLabel: "Mindestlaufzeit",
    noticeLabel: "Kuendigungsfrist",
    terminationLabel: "Kuendigungsregelung",
    partyALabel: "Anbieter",
    partyBLabel: "Kunde"
  }
}

const AVV_PROFILE: ContractTypeProfile = {
  id: "avv",
  name: "Auftragsverarbeitungsvertrag",
  shortName: "AVV",
  jurisdiction: "DE",
  sections: [
    { id: "term-and-renewal", visible: true, required: true, emptyStateMessage: "Laufzeit gekoppelt an Hauptvertrag — sollte explizit erwaehnt sein" },
    { id: "termination", visible: true, required: true, emptyStateMessage: "Beendigung mit Hauptvertrag" },
    { id: "liability", visible: true, required: true, emptyStateMessage: "Haftungsregelung fehlt — DSGVO-Bussgelder bis 4% Umsatz" },
    { id: "data-processing-avv", visible: true, required: true, emptyStateMessage: "Verarbeitungsumfang nicht spezifiziert" },
    { id: "compliance-clauses", visible: true, required: true, emptyStateMessage: "Technisch-organisatorische Massnahmen (TOM) fehlen" },
    { id: "governing-law", visible: true, required: true, emptyStateMessage: "Anwendbares Recht fehlt" },
    { id: "indemnification", visible: false, required: false, emptyStateMessage: "" },
    { id: "ip-rights", visible: false, required: false, emptyStateMessage: "" },
    { id: "service-levels-sla", visible: false, required: false, emptyStateMessage: "" },
    { id: "payment-terms", visible: false, required: false, emptyStateMessage: "" },
    { id: "scope-of-services", visible: false, required: false, emptyStateMessage: "" },
    { id: "warranties", visible: false, required: false, emptyStateMessage: "" },
    { id: "confidentiality", visible: true, required: true, emptyStateMessage: "Vertraulichkeitspflicht der Mitarbeiter fehlt" }
  ],
  marketStandardClauses: [
    { id: "tom-art32", name: "Technisch-organisatorische Massnahmen (Art. 32 DSGVO)", category: "must-have", description: "Konkrete Beschreibung der Sicherheitsmassnahmen — nicht nur Verweis auf 'Stand der Technik'.", fallbackTemplate: "Der Auftragsverarbeiter ergreift die in Anlage TOM beschriebenen technischen und organisatorischen Massnahmen gemaess Art. 32 DSGVO, einschliesslich Verschluesselung im Transport (TLS 1.2+) und at-rest (AES-256), Zugriffskontrolle (RBAC), Pseudonymisierung wo moeglich, regelmaessige Sicherheitsaudits und Incident-Response-Plaene.", bgbReference: "Art. 32 DSGVO" },
    { id: "subprocessor-art28", name: "Unterauftragsverarbeiter-Regelung (Art. 28 DSGVO)", category: "must-have", description: "Vorherige schriftliche Zustimmung oder allgemeine Genehmigung mit Widerspruchsrecht.", fallbackTemplate: "Der Einsatz von Unterauftragsverarbeitern bedarf der vorherigen schriftlichen Genehmigung des Verantwortlichen. Eine Liste der genehmigten Unterauftragsverarbeiter ist als Anlage Subprocessors beigefuegt; Aenderungen werden 30 Tage im Voraus mitgeteilt mit Widerspruchsrecht." },
    { id: "data-subject-rights", name: "Unterstuetzung bei Betroffenenrechten", category: "must-have", description: "Pflicht zur Unterstuetzung bei Auskunft, Loeschung, Datenuebertragbarkeit.", fallbackTemplate: "Der Auftragsverarbeiter unterstuetzt den Verantwortlichen bei der Erfuellung der Rechte betroffener Personen (Art. 12-22 DSGVO) durch geeignete technische und organisatorische Massnahmen, soweit moeglich, und antwortet auf Anfragen innerhalb von 7 Werktagen." },
    { id: "breach-notification", name: "Meldung von Datenschutzverletzungen (Art. 33 DSGVO)", category: "must-have", description: "Meldung an Verantwortlichen innerhalb von 24-72 Stunden nach Kenntnisnahme.", fallbackTemplate: "Der Auftragsverarbeiter meldet dem Verantwortlichen jede Verletzung des Schutzes personenbezogener Daten unverzueglich, spaetestens innerhalb von 24 Stunden nach Kenntnisnahme, und unterstuetzt bei der Erfuellung der Meldepflicht gemaess Art. 33 DSGVO." },
    { id: "international-transfer-sccs", name: "Internationale Datenuebermittlung (SCCs)", category: "must-have", description: "Bei Drittlandtransfer: aktuelle Standardvertragsklauseln (2021/914) als Anlage.", fallbackTemplate: "Sofern personenbezogene Daten in ein Drittland uebermittelt werden, das kein angemessenes Datenschutzniveau bietet, schliessen die Parteien die EU-Standardvertragsklauseln 2021/914 in der jeweils aktuellen Fassung als Anlage SCCs ab und treffen ergaenzende Schutzmassnahmen gemaess EDPB Recommendations 01/2020." }
  ],
  primaryRisks: ["compliance", "legal"],
  signatureBlockers: ["fehlende-tom", "fehlende-breach-notification", "fehlende-sccs-bei-drittland"],
  wording: {
    termLabel: "Vertragsdauer",
    noticeLabel: "Mitteilungsfrist",
    terminationLabel: "Beendigung",
    partyALabel: "Verantwortlicher",
    partyBLabel: "Auftragsverarbeiter"
  }
}

const SUPPLIER_EN_PROFILE: ContractTypeProfile = {
  id: "supplier-agreement-en",
  name: "Supplier Agreement (English)",
  shortName: "Supplier (EN)",
  jurisdiction: "EN",
  sections: [
    { id: "term-and-renewal", visible: true, required: true, emptyStateMessage: "No term specified — market standard: 12-36 months with auto-renewal" },
    { id: "termination", visible: true, required: true, emptyStateMessage: "Termination clause missing — typical: 30-90 days notice" },
    { id: "liability", visible: true, required: true, emptyStateMessage: "Liability cap missing — market standard: 12 months fees or contract value" },
    { id: "indemnification", visible: true, required: true, emptyStateMessage: "Indemnification missing — IP and third-party claims" },
    { id: "ip-rights", visible: true, required: true, emptyStateMessage: "IP assignment not specified — work-for-hire vs. license" },
    { id: "payment-terms", visible: true, required: true, emptyStateMessage: "Payment terms missing — typical: Net 30/60" },
    { id: "scope-of-services", visible: true, required: true, emptyStateMessage: "Scope of work not defined — high risk for scope creep" },
    { id: "warranties", visible: true, required: true, emptyStateMessage: "Warranties missing — fitness for purpose, conformity" },
    { id: "governing-law", visible: true, required: true, emptyStateMessage: "Governing law and jurisdiction missing" },
    { id: "compliance-clauses", visible: true, required: true, emptyStateMessage: "Compliance clauses missing — anti-corruption, sanctions, modern slavery" },
    { id: "confidentiality", visible: true, required: true, emptyStateMessage: "Confidentiality clause missing or referenced from separate NDA" },
    { id: "data-processing-avv", visible: false, required: false, emptyStateMessage: "" },
    { id: "service-levels-sla", visible: false, required: false, emptyStateMessage: "" }
  ],
  marketStandardClauses: [
    { id: "limitation-of-liability", name: "Limitation of Liability", category: "must-have", description: "Cap on total liability — typically 12 months fees or contract value.", fallbackTemplate: "EXCEPT FOR LIABILITY ARISING FROM (I) BREACH OF CONFIDENTIALITY, (II) INDEMNIFICATION OBLIGATIONS, OR (III) GROSS NEGLIGENCE OR WILLFUL MISCONDUCT, EACH PARTY'S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID BY CUSTOMER TO SUPPLIER UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM." },
    { id: "indemnification-ip", name: "IP Indemnification", category: "must-have", description: "Supplier indemnifies Customer against third-party IP claims.", fallbackTemplate: "Supplier shall defend, indemnify, and hold harmless Customer from and against any third-party claims alleging that the Services or Deliverables infringe any patent, copyright, trademark, or trade secret. Customer shall promptly notify Supplier of any such claim and provide reasonable cooperation." },
    { id: "force-majeure", name: "Force Majeure", category: "should-have", description: "Excuse for non-performance during exceptional circumstances.", fallbackTemplate: "Neither party shall be liable for any failure or delay in performance under this Agreement (other than payment obligations) due to causes beyond its reasonable control, including acts of God, war, terrorism, pandemic, or governmental action, provided the affected party promptly notifies the other and uses reasonable efforts to mitigate." },
    { id: "anti-corruption", name: "Anti-Corruption / Anti-Bribery", category: "must-have", description: "Compliance with FCPA, UK Bribery Act, German Anti-Corruption laws.", fallbackTemplate: "Supplier represents and warrants that it shall comply with all applicable anti-corruption laws, including the U.S. Foreign Corrupt Practices Act, the UK Bribery Act 2010, and Sections 299, 331-335 of the German Criminal Code (StGB). Supplier shall not offer, give, or accept any improper payment in connection with this Agreement." },
    { id: "modern-slavery", name: "Modern Slavery / LkSG Compliance", category: "must-have", description: "Compliance with German Supply Chain Due Diligence Act (LkSG) and UK Modern Slavery Act.", fallbackTemplate: "Supplier shall comply with all applicable laws regarding human rights and labor standards, including the German Supply Chain Due Diligence Act (Lieferkettensorgfaltspflichtengesetz, LkSG) and the UK Modern Slavery Act 2015. Supplier shall implement appropriate due diligence processes and provide documentation upon request." }
  ],
  primaryRisks: ["legal", "financial", "compliance", "operational"],
  signatureBlockers: ["missing-liability-cap", "missing-ip-indemnification", "missing-anti-corruption"],
  wording: {
    termLabel: "Agreement Term",
    noticeLabel: "Notice Period",
    terminationLabel: "Termination",
    partyALabel: "Customer",
    partyBLabel: "Supplier"
  }
}

const NDA_EN_PROFILE: ContractTypeProfile = {
  ...NDA_PROFILE,
  id: "nda-en",
  name: "Non-Disclosure Agreement (English)",
  shortName: "NDA (EN)",
  jurisdiction: "EN",
  marketStandardClauses: [
    { id: "injunctive-relief-en", name: "Injunctive / Equitable Relief", category: "must-have", description: "Right to seek injunctive relief in addition to damages.", fallbackTemplate: "Each party acknowledges that any breach of this Agreement may cause irreparable harm for which monetary damages would be inadequate. Accordingly, the non-breaching party shall be entitled to seek injunctive relief and other equitable remedies in addition to any other remedies available at law or in equity, without the need to post bond." },
    { id: "no-obligation-en", name: "No Obligation to Proceed", category: "must-have", description: "Clarifies NDA does not create obligation to negotiate or contract.", fallbackTemplate: "Nothing in this Agreement shall be construed as creating any obligation on either party to enter into any further agreement or business relationship. Each party reserves the right to terminate discussions at any time for any reason without liability." },
    { id: "non-solicitation-en", name: "Non-Solicitation of Employees", category: "should-have", description: "Prevents poaching of key personnel during and after engagement.", fallbackTemplate: "During the term of this Agreement and for twelve (12) months thereafter, neither party shall directly solicit for employment any employee of the other party with whom it had material contact in connection with this Agreement. General solicitations not specifically targeted at the other party's employees are permitted." },
    { id: "residuals-en", name: "Residuals Clause", category: "should-have", description: "Permits use of unaided memory after engagement ends.", fallbackTemplate: "Notwithstanding the foregoing, either party may use Residuals (information retained in the unaided memory of personnel who had access to Confidential Information) for any purpose, provided such use does not include intentional memorization for the purpose of circumventing this Agreement." },
    { id: "return-en", name: "Return or Destruction of Information", category: "must-have", description: "Obligation to return or destroy confidential materials upon termination.", fallbackTemplate: "Upon termination of this Agreement or upon the disclosing party's written request, the receiving party shall promptly return or destroy all Confidential Information in its possession, including all copies and derivative works, and shall provide written certification of such destruction within thirty (30) days." }
  ],
  wording: {
    termLabel: "Agreement Term",
    noticeLabel: "Notice Period",
    terminationLabel: "Termination",
    partyALabel: "Disclosing Party",
    partyBLabel: "Receiving Party"
  }
}

export const CONTRACT_TYPE_REGISTRY: Record<ContractTypeId, ContractTypeProfile> = {
  "nda": NDA_PROFILE,
  "saas": SAAS_PROFILE,
  "avv": AVV_PROFILE,
  "lieferantenvertrag": { ...SUPPLIER_EN_PROFILE, id: "lieferantenvertrag", name: "Lieferantenvertrag", shortName: "Lieferant", jurisdiction: "DE", wording: { termLabel: "Vertragslaufzeit", noticeLabel: "Kuendigungsfrist", terminationLabel: "Kuendigung", partyALabel: "Auftraggeber", partyBLabel: "Lieferant" } },
  "rahmenvertrag": { ...SUPPLIER_EN_PROFILE, id: "rahmenvertrag", name: "Rahmenvertrag", shortName: "Rahmenvertrag", jurisdiction: "DE", wording: { termLabel: "Rahmenvertragslaufzeit", noticeLabel: "Kuendigungsfrist", terminationLabel: "Kuendigung", partyALabel: "Auftraggeber", partyBLabel: "Auftragnehmer" } },
  "arbeitsvertrag": { ...NDA_PROFILE, id: "arbeitsvertrag", name: "Arbeitsvertrag", shortName: "Arbeitsvertrag", jurisdiction: "DE" },
  "dienstleistungsvertrag": { ...SAAS_PROFILE, id: "dienstleistungsvertrag", name: "Dienstleistungsvertrag", shortName: "Dienstleistung", jurisdiction: "DE" },
  "msa": { ...SUPPLIER_EN_PROFILE, id: "msa", name: "Master Service Agreement", shortName: "MSA", jurisdiction: "EN" },
  "supplier-agreement-en": SUPPLIER_EN_PROFILE,
  "nda-en": NDA_EN_PROFILE,
  "service-agreement-en": { ...SUPPLIER_EN_PROFILE, id: "service-agreement-en", name: "Service Agreement (English)", shortName: "Service (EN)", jurisdiction: "EN" },
  "purchase-agreement-en": { ...SUPPLIER_EN_PROFILE, id: "purchase-agreement-en", name: "Purchase Agreement (English)", shortName: "Purchase (EN)", jurisdiction: "EN" }
}

export function getContractProfile(typeId: ContractTypeId): ContractTypeProfile {
  return CONTRACT_TYPE_REGISTRY[typeId] ?? NDA_PROFILE
}

export function getVisibleSections(typeId: ContractTypeId): SectionConfig[] {
  return getContractProfile(typeId).sections.filter(s => s.visible)
}

export function shouldShowSection(typeId: ContractTypeId, sectionId: SectionId): boolean {
  const section = getContractProfile(typeId).sections.find(s => s.id === sectionId)
  return section?.visible ?? false
}
