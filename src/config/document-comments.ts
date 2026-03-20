export const documentCommentSectionOptions = [
  { value: "ALLGEMEIN", label: "Allgemeiner Hinweis" },
  { value: "DOKUMENTKONTEXT", label: "Dokumentkontext" },
  { value: "TEXTGRUNDLAGE", label: "Textgrundlage" },
  { value: "STRUKTURIERTE_ANALYSE", label: "Strukturierte Analyse" },
  { value: "REVIEW_FREIGABE", label: "Review / Freigabe" }
] as const

export type DocumentCommentSectionKey = (typeof documentCommentSectionOptions)[number]["value"]

export const documentCommentInputConstraints = {
  minBodyLength: 5,
  maxBodyLength: 2000,
  maxAnchorLength: 280
} as const

export function getDocumentCommentSectionLabel(sectionKey: DocumentCommentSectionKey | null): string {
  if (!sectionKey) return "Ohne Bereichsbezug"
  return documentCommentSectionOptions.find((option) => option.value === sectionKey)?.label ?? "Ohne Bereichsbezug"
}
