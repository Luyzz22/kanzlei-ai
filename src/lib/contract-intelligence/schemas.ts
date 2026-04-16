/**
 * Contract Type Schemas
 * 
 * Defines which fields, sections, and clauses apply to each contract type.
 * Eliminates semantic emptiness ("AVV-Klausel" on an NDA) and enables
 * type-aware UI rendering.
 * 
 * Source: BGB, DSGVO Art. 28, EU AI Act, ISO/IEC 27001, market standards
 */

export type FieldApplicability = "required" | "optional" | "not_applicable"
export type FieldStatus = "present" | "missing" | "not_provided" | "n_a" | "incomplete"

export interface ContractField {
  key: string
  label: string
  shortLabel: string  // For NDA: "Agreement Term" instead of "Mindestlaufzeit"
  applicability: FieldApplicability
  category: "term" | "termination" | "liability" | "ip" | "data_protection" | "compliance" | "commercial" | "confidentiality"
  description: string
  marketStandard?: string  // What's typical in the market
}

export interface ContractTypeSchema {
  id: string
  name: string
  shortName: string
  jurisdiction: "DE" | "EU" | "US" | "UK" | "Multi"
  language: "de" | "en" | "both"
  fields: ContractField[]
  requiredClauses: string[]   // Must be present (Modul 3)
  recommendedClauses: string[] // Market standard but optional
  forbiddenSections: string[]  // Sections that should NOT appear (Modul 1: hide AVV on NDA)
  signatureBlockingChecks: string[] // Conditions that make contract not signable (Modul 2)
}

// =====================================================================
// NDA — Non-Disclosure Agreement
// =====================================================================
export const NDA_SCHEMA: ContractTypeSchema = {
  id: "nda",
  name: "Non-Disclosure Agreement",
  shortName: "NDA",
  jurisdiction: "Multi",
  language: "both",
  fields: [
    { key: "agreement_term", label: "Agreement Term", shortLabel: "Agreement Term", applicability: "required", category: "term", description: "Total duration of confidentiality obligation", marketStandard: "3-5 years post-termination" },
    { key: "confidentiality_period", label: "Confidentiality Period", shortLabel: "Survival Period", applicability: "required", category: "confidentiality", description: "How long confidentiality obligations survive after termination", marketStandard: "3-7 years; 10 years for trade secrets" },
    { key: "permitted_purpose", label: "Permitted Purpose", shortLabel: "Purpose", applicability: "required", category: "confidentiality", description: "Specific purpose for which information may be used" },
    { key: "return_destruction", label: "Return / Destruction Obligation", shortLabel: "Return / Destruction", applicability: "required", category: "confidentiality", description: "Obligation to return or destroy confidential information" },
    { key: "governing_law", label: "Governing Law", shortLabel: "Governing Law", applicability: "required", category: "compliance", description: "Applicable jurisdiction" },
    // Forbidden / N/A on NDAs:
    { key: "data_processing_avv", label: "Auftragsverarbeitungsvertrag (AVV)", shortLabel: "AVV", applicability: "not_applicable", category: "data_protection", description: "Not applicable — NDAs don't process personal data on behalf" },
    { key: "uptime_sla", label: "Service Level Agreement", shortLabel: "SLA", applicability: "not_applicable", category: "commercial", description: "Not applicable — NDAs don't provide services" },
    { key: "payment_terms", label: "Payment Terms", shortLabel: "Payment", applicability: "not_applicable", category: "commercial", description: "Not applicable — NDAs are typically gratuitous" },
  ],
  requiredClauses: [
    "Definition of Confidential Information",
    "Permitted Use Restrictions",
    "Return / Destruction Obligation",
    "Governing Law and Jurisdiction",
    "Term and Survival",
  ],
  recommendedClauses: [
    "Injunctive / Equitable Relief",
    "No Obligation to Proceed",
    "Non-Solicitation (for tech NDAs)",
    "Residuals Clause",
    "Carve-Out for Independently Developed Information",
    "Carve-Out for Publicly Known Information",
    "Compelled Disclosure Procedure",
  ],
  forbiddenSections: ["data_processing_avv", "service_levels", "payment_schedule", "support_terms"],
  signatureBlockingChecks: [
    "missing_confidentiality_period",
    "missing_permitted_purpose",
    "unilateral_when_should_be_mutual",
    "no_governing_law",
  ],
}

// =====================================================================
// SaaS Agreement
// =====================================================================
export const SAAS_SCHEMA: ContractTypeSchema = {
  id: "saas",
  name: "Software-as-a-Service Agreement",
  shortName: "SaaS",
  jurisdiction: "Multi",
  language: "both",
  fields: [
    { key: "subscription_term", label: "Mindestlaufzeit", shortLabel: "Subscription Term", applicability: "required", category: "term", description: "Initial subscription period", marketStandard: "12-36 months" },
    { key: "auto_renewal", label: "Automatische Verlaengerung", shortLabel: "Auto-Renewal", applicability: "required", category: "term", description: "Automatic renewal terms", marketStandard: "12 months with 90 day opt-out" },
    { key: "notice_period", label: "Kuendigungsfrist", shortLabel: "Notice Period", applicability: "required", category: "termination", description: "Required notice for termination", marketStandard: "90 days before renewal" },
    { key: "uptime_sla", label: "Service Level Agreement", shortLabel: "SLA", applicability: "required", category: "commercial", description: "Uptime and availability commitment", marketStandard: "99.5%+ with credits" },
    { key: "data_processing_avv", label: "Auftragsverarbeitungsvertrag (AVV)", shortLabel: "AVV / DPA", applicability: "required", category: "data_protection", description: "Required under DSGVO Art. 28", marketStandard: "Standard EU DPA template" },
    { key: "data_location", label: "Datenstandort", shortLabel: "Data Location", applicability: "required", category: "data_protection", description: "Where data is processed and stored", marketStandard: "EU/EEA only" },
    { key: "subprocessors", label: "Unterauftragsverarbeiter", shortLabel: "Subprocessors", applicability: "required", category: "data_protection", description: "List of approved subprocessors" },
    { key: "liability_cap", label: "Haftungsbegrenzung", shortLabel: "Liability Cap", applicability: "required", category: "liability", description: "Maximum liability exposure", marketStandard: "12 months fees" },
    { key: "indemnification", label: "Freistellung", shortLabel: "Indemnification", applicability: "required", category: "liability", description: "IP and third-party claim indemnification" },
    { key: "ip_rights", label: "IP-Rechte", shortLabel: "IP Rights", applicability: "required", category: "ip", description: "Intellectual property allocation" },
    { key: "payment_terms", label: "Zahlungsbedingungen", shortLabel: "Payment Terms", applicability: "required", category: "commercial", description: "Payment schedule", marketStandard: "Net 30" },
    { key: "ai_transparency", label: "KI-Transparenz (EU AI Act)", shortLabel: "AI Transparency", applicability: "optional", category: "compliance", description: "EU AI Act Art. 50 disclosure for AI features" },
  ],
  requiredClauses: [
    "Service Description",
    "SLA with Credits",
    "AVV / Data Processing Agreement (DSGVO Art. 28)",
    "Standard Contractual Clauses (for non-EU transfers)",
    "Liability Cap and Carve-Outs",
    "IP Indemnification",
    "Termination Rights",
    "Data Return on Termination",
    "Subprocessors List",
  ],
  recommendedClauses: [
    "Source Code Escrow",
    "Audit Rights (SOC 2 / ISO 27001)",
    "Insurance Requirements",
    "Business Continuity / DR Plan",
    "EU AI Act Transparency (if AI features)",
    "NIS2 Cybersecurity Requirements",
    "Force Majeure",
    "Most-Favored-Customer Clause",
  ],
  forbiddenSections: [],
  signatureBlockingChecks: [
    "missing_avv",
    "missing_sla",
    "no_liability_cap",
    "uncapped_indemnification",
    "no_data_return_clause",
    "non_eu_data_without_sccs",
  ],
}

// =====================================================================
// AVV — Auftragsverarbeitungsvertrag
// =====================================================================
export const AVV_SCHEMA: ContractTypeSchema = {
  id: "avv",
  name: "Auftragsverarbeitungsvertrag",
  shortName: "AVV / DPA",
  jurisdiction: "EU",
  language: "de",
  fields: [
    { key: "processing_purpose", label: "Verarbeitungszweck", shortLabel: "Zweck", applicability: "required", category: "data_protection", description: "DSGVO Art. 28 Abs. 3 lit. a" },
    { key: "data_categories", label: "Datenkategorien", shortLabel: "Datenarten", applicability: "required", category: "data_protection", description: "Welche personenbezogenen Daten" },
    { key: "data_subjects", label: "Betroffene Personen", shortLabel: "Betroffene", applicability: "required", category: "data_protection", description: "Kategorien der Betroffenen" },
    { key: "tom_measures", label: "Technische und organisatorische Massnahmen (TOM)", shortLabel: "TOMs", applicability: "required", category: "data_protection", description: "DSGVO Art. 32" },
    { key: "subprocessors", label: "Unterauftragsverarbeiter", shortLabel: "Sub-AV", applicability: "required", category: "data_protection", description: "Genehmigung und Liste" },
    { key: "data_breach_notification", label: "Meldepflichten bei Datenpannen", shortLabel: "Breach Notice", applicability: "required", category: "data_protection", description: "DSGVO Art. 33", marketStandard: "Innerhalb 24-72 Stunden" },
    { key: "audit_rights", label: "Pruefrechte", shortLabel: "Audit", applicability: "required", category: "data_protection", description: "DSGVO Art. 28 Abs. 3 lit. h" },
    { key: "data_deletion", label: "Loeschung / Rueckgabe", shortLabel: "Loeschung", applicability: "required", category: "data_protection", description: "Nach Vertragsende" },
    { key: "international_transfers", label: "Drittlandtransfers", shortLabel: "Drittland", applicability: "optional", category: "data_protection", description: "SCCs, BCRs, oder Adequacy" },
  ],
  requiredClauses: [
    "Verarbeitungsbeschreibung (DSGVO Art. 28 Abs. 3)",
    "Weisungsgebundenheit",
    "Vertraulichkeitsverpflichtung der Mitarbeiter",
    "Technische und organisatorische Massnahmen (TOM)",
    "Unterauftragsverarbeiter-Regelung",
    "Mitwirkung bei Betroffenenrechten",
    "Meldepflichten bei Datenpannen",
    "Loeschung / Rueckgabe nach Vertragsende",
    "Pruefrechte des Verantwortlichen",
  ],
  recommendedClauses: [
    "Standard Contractual Clauses (SCCs) fuer Drittlandtransfer",
    "Haftungsfreistellung bei DSGVO-Verletzungen",
    "DPIA-Unterstuetzung (Art. 35)",
    "Datenschutzbeauftragter benannt",
  ],
  forbiddenSections: ["payment_schedule", "ip_assignment", "service_levels_uptime"],
  signatureBlockingChecks: [
    "missing_tom",
    "missing_breach_notification",
    "missing_subprocessor_clause",
    "missing_deletion_clause",
    "third_country_without_sccs",
  ],
}

// =====================================================================
// Schema Registry
// =====================================================================
export const CONTRACT_SCHEMAS: Record<string, ContractTypeSchema> = {
  nda: NDA_SCHEMA,
  saas: SAAS_SCHEMA,
  avv: AVV_SCHEMA,
}

export function getSchemaForType(typeId: string): ContractTypeSchema | null {
  return CONTRACT_SCHEMAS[typeId.toLowerCase()] ?? null
}

export function getApplicableFields(typeId: string): ContractField[] {
  const schema = getSchemaForType(typeId)
  if (!schema) return []
  return schema.fields.filter(f => f.applicability !== "not_applicable")
}

export function getNotApplicableFields(typeId: string): ContractField[] {
  const schema = getSchemaForType(typeId)
  if (!schema) return []
  return schema.fields.filter(f => f.applicability === "not_applicable")
}

/**
 * Resolves a field's status given its raw value from extraction.
 * Returns the appropriate UI label instead of empty/null.
 */
export function resolveFieldStatus(field: ContractField, rawValue: string | null | undefined): { status: FieldStatus; displayValue: string } {
  if (field.applicability === "not_applicable") {
    return { status: "n_a", displayValue: "N/A — not required for this contract type" }
  }
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    if (field.applicability === "required") {
      return { status: "missing", displayValue: "⚠️ Missing — required for this contract type" }
    }
    return { status: "not_provided", displayValue: "Not provided" }
  }
  return { status: "present", displayValue: rawValue }
}
