# NormPilot Synthetic Evals

Diese Golden Cases sind synthetisch und dienen der Domain-Foundation aus PR 1
sowie der mockbaren Pipeline-/Prompt-Governance aus PR 2.

Leitplanken:

- Keine echten Kundendaten.
- Keine personenbezogenen Pflichtfelder.
- Keine proprietaeren ISO-, DIN-, IATF-, VDA- oder sonstigen Norm-Volltexte.
- Anforderungen sind kundeneigene Checklisten- oder Kurzreferenz-Beispiele.
- Evidence-Mappings speichern kurze Anchors, Locator-Informationen und Hashes, keine langen Volltextkopien.

PR 2 nutzt die Cases ueber `scripts/run-normpilot-evals.ts`.

```bash
pnpm eval:normpilot
```

Der Eval-Runner nutzt ausschliesslich den deterministischen Mock-Modus. Er
schreibt keine Datenbankeintraege, ruft keine Provider auf und persistiert keine
personenbezogenen Daten.
