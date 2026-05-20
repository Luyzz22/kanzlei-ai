export type ReleaseCategory =
  | "feature"
  | "fix"
  | "compliance"
  | "performance";

export type ReleaseNote = {
  version: string;
  date: string; // ISO 8601
  title: string;
  highlights: string[];
  category: ReleaseCategory;
  href?: string;
};

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "v4.2",
    date: "2026-05-20",
    title: "Async-Analyse-Pipeline & Stabilität",
    highlights: [
      "Vertragsanalyse läuft vollständig asynchron — 504-Timeouts eliminiert",
      "Live-Fortschritt je Pipeline-Stage mit visueller 3-Stufen-Anzeige",
      "Notification-Center mit zuverlässiger Read-State-Synchronisation",
    ],
    category: "performance",
  },
  {
    version: "v4.1",
    date: "2026-05-17",
    title: "Evidence Graph & Eval Dashboard",
    highlights: [
      "Evidence Graph für Klausel-Belege und Querverweise",
      "Eval Dashboard mit Golden-Set-Validierung über 8 Vertragstypen",
      "Playbook Miner und Radar v2 für Branchenkontext",
      "AI Act Art. 50 Konformität in Hinweistexten",
    ],
    category: "feature",
  },
  {
    version: "v4.0",
    date: "2026-05-15",
    title: "Hybrid-Pricing & Enterprise Workflows",
    highlights: [
      "Bulk-Upload für Verträge mit Batch-Klassifikation",
      "Reviewer-Historie und E-Mail-Benachrichtigung bei Statuswechsel",
      "Profil-Bereich im Enterprise-Rewrite",
    ],
    category: "feature",
  },
  {
    version: "v3.8",
    date: "2026-05-12",
    title: "Engine v3 & Review-Pipeline",
    highlights: [
      "3-Stage-Pipeline: Klassifikation → Extraktion → Risiko (Score 71 → 95)",
      "Review-Workflow mit Accordion-Findings, Severity-Filter, Freigabe",
      "BRAO §43a, LkSG, Bestimmtheitsgebot und 12 weitere Module",
    ],
    category: "compliance",
  },
  {
    version: "v3.2",
    date: "2026-05-04",
    title: "Provider-Bugfixes & Stabilität",
    highlights: [
      "Claude Sonnet max_tokens auf 16.384 — Risikoanalyse wird nicht mehr abgeschnitten",
      "stripCodeFences und Markdown-Strip robuster",
      "Extraction primär auf Claude umgestellt",
    ],
    category: "fix",
  },
];
