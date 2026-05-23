type StageAttemptLogLike = {
  wasSuccessful: boolean
  errorCode?: string | null
  model?: string
}

/** Nutzerfreundliche Fehlermeldung aus dem letzten Provider-Versuch. */
export function formatStageFailureMessage(stageLogs: StageAttemptLogLike[]): string {
  const lastFailed = [...stageLogs].reverse().find((l) => !l.wasSuccessful)
  const last = lastFailed ?? stageLogs.at(-1)
  if (!last?.errorCode) {
    return "Alle Anbieterversuche für diese Pipeline-Stufe sind fehlgeschlagen."
  }

  const { errorCode, model } = last

  switch (errorCode) {
    case "AUTH":
      return "Anthropic API-Schlüssel ungültig — bitte ANTHROPIC_API_KEY in Vercel prüfen."
    case "MODEL_NOT_FOUND":
      return `Modell „${model}“ ist auf Ihrem Anthropic-Konto nicht verfügbar. Setzen Sie ANTHROPIC_CHAT_MODEL=claude-sonnet-4-5-20250929.`
    case "INPUT_TOO_LONG":
      return "Der Vertragstext überschreitet das Kontextfenster des Modells."
    case "RATE_LIMIT":
      return "Anthropic Rate-Limit erreicht — bitte kurz warten und erneut versuchen."
    case "MAX_TOKENS_HIT":
      return "KI-Antwort wurde am Token-Limit abgeschnitten — bitte erneut versuchen oder kürzeren Vertrag testen."
    case "JSON_PARSE":
      return "KI-Antwort war kein gültiges JSON — bitte erneut versuchen."
    case "PROVIDER_BAD_REQUEST":
      return "Anthropic hat die Anfrage abgelehnt — Modell-ID und max_tokens in Vercel ENV prüfen."
    default:
      if (errorCode.startsWith("SCHEMA_INVALID")) {
        return "KI-Antwort entsprach nicht dem erwarteten Schema — bitte erneut versuchen."
      }
      return `Claude-Anfrage fehlgeschlagen (${errorCode}).`
  }
}
