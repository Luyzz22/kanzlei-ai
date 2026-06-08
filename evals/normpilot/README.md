# NormPilot Synthetic Evals

Diese Golden Cases sind synthetisch und dienen nur der Domain-Foundation fuer PR 1.

Leitplanken:

- Keine echten Kundendaten.
- Keine personenbezogenen Pflichtfelder.
- Keine proprietaeren ISO-, DIN-, IATF-, VDA- oder sonstigen Norm-Volltexte.
- Anforderungen sind kundeneigene Checklisten- oder Kurzreferenz-Beispiele.
- Evidence-Mappings speichern kurze Anchors, Locator-Informationen und Hashes, keine langen Volltextkopien.

Die Cases koennen spaeter von einer Mock-Pipeline oder Eval-Runnern unter `src/lib/evals` geladen werden. PR 1 legt bewusst noch keine produktive LLM-Pipeline an.
