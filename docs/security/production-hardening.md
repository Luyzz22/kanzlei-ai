# Production Hardening

Diese Checkliste beschreibt sichere Betriebs- und Release-Gates fuer KanzleiAI. Sie erzeugt keine Secrets und ersetzt keine Rotation in GitHub, Vercel, Neon oder bei externen Providern.

## Secret-Rotation Checkliste

- Neon/Postgres Credentials rotieren: Runtime-User, Migrations-/Direct-URL-User und alle Preview-/Staging-User getrennt pruefen.
- `NEXTAUTH_SECRET` rotieren und danach aktive Sessions invalidieren.
- LLM Provider Keys rotieren, insbesondere Google/Gemini, OpenAI, Anthropic und Azure OpenAI.
- OAuth Client Secrets rotieren: Google, Microsoft Entra und weitere Provider.
- Webhook-, Cron-, SCIM-, Stripe-, Vercel-Blob- und Seed-Secrets rotieren.
- GitHub Repository/Organization Secrets und Vercel Environment Variables nach Rotation auf alte Werte pruefen.
- Nach Rotation Smoke-Tests ausfuehren: Login, Dokument-Upload, Analyse, Webhooks, Cron-Routen, Prisma-Verbindung.
- GitHub Secret Scanning Alerts dokumentieren und als Security Incident nachverfolgen, falls produktive Werte betroffen waren.

## Branch Protection fuer `main`

- Pull Requests vor Merge erzwingen.
- Mindestens zwei Reviews fuer produktionsrelevante Aenderungen verlangen.
- CODEOWNERS-Review verlangen.
- Stale Approvals bei neuen Commits verwerfen.
- Required Status Checks aktivieren: `CI`, `Secret Scan`, `CodeQL`.
- Branch muss vor Merge aktuell sein.
- Force Pushes und Branch-Deletions blockieren.
- Lineare Historie und Conversation Resolution erzwingen.
- Administratoren in die Regeln einbeziehen.
- Push-Rechte auf Maintainer beschraenken.
- Signierte Commits/Tags fuer Release-Prozesse bevorzugen.

## Vercel Preview/Production Trennung

- Production Environment Variables nur fuer Production setzen.
- Preview Deployments muessen eigene Preview-/Staging-Secrets nutzen.
- Preview Deployments duerfen niemals die Production-`DATABASE_URL` oder Production-`DIRECT_URL` verwenden.
- Neon Branches oder separate Preview-Datenbanken fuer Preview Deployments nutzen.
- Vercel Production Branch auf `main` beschraenken.
- Deployment Protection fuer Production aktivieren und manuelle Freigabe fuer produktive Deployments verlangen.
- Preview-Daten regelmaessig loeschen oder anonymisieren.

## Migration Policy

- Prisma-Migrationen laufen nicht im Vercel Build.
- Vercel Build darf nur Prisma Client generieren und die App bauen.
- Production-Migrationen laufen ausschliesslich in einem geschuetzten GitHub Actions Deployment Job.
- Der Deployment Job darf nur nach erfolgreichem CI, Secret Scan und CodeQL laufen.
- Der Deployment Job nutzt ein GitHub Environment mit Required Reviewers.
- `prisma migrate deploy` und RLS-/Retention-SQL werden gegen eine explizit freigegebene Production-DSN ausgefuehrt.
- Preview-/Staging-Migrationen laufen gegen isolierte Datenbanken oder Neon Branches.
- Fehlgeschlagene Production-Migrationen werden nach Runbook recovered; kein `prisma migrate reset` in Production.

## Git-History Cleanup

- Git-History Cleanup erst nach vollstaendiger Secret-Rotation starten.
- Vor einem Rewrite alle aktiven Branches und Forks inventarisieren.
- Nach dem Rewrite alle Entwickler auffordern, alte Klone zu verwerfen oder sauber neu zu synchronisieren.
- GitHub Secret Scanning Alerts erst schliessen, wenn Rotation und Cleanup dokumentiert sind.
