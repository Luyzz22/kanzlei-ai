import Link from "next/link"

import { DocumentEvidencePackageView } from "@/components/documents/document-evidence-package-view"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageShell } from "@/components/marketing/page-shell"
import { SectionIntro } from "@/components/marketing/section-intro"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { auth } from "@/lib/auth"
import { getDocumentEvidencePackageData } from "@/lib/documents/document-evidence-package-core"

type DokumentEvidencePageProps = {
  params: {
    id: string
  }
}

export default async function DokumentEvidencePage({ params }: DokumentEvidencePageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Nachweispaket"
          title="Nachweispaket nicht verfügbar"
          description="Bitte melden Sie sich an, um die tenant-gebundene Nachweisansicht zu öffnen."
        />
        <Link href="/login" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
          Zur Anmeldung
        </Link>
      </PageShell>
    )
  }

  const tenantContext = await resolveTenantContextForUser(session.user.id)

  if (tenantContext.status === "none") {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Nachweispaket"
          title="Kein Mandantenkontext verfügbar"
          description="Für dieses Konto ist aktuell kein eindeutiger Mandantenkontext hinterlegt."
        />
      </PageShell>
    )
  }

  if (tenantContext.status === "multiple") {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Nachweispaket"
          title="Mandantenkontext nicht eindeutig"
          description="Diese Ansicht erfordert einen eindeutigen Mandantenkontext. Die gesteuerte Auswahl folgt in einem späteren Ausbau."
        />
      </PageShell>
    )
  }

  try {
    const evidencePackage = await getDocumentEvidencePackageData(tenantContext.tenantId, session.user.id, params.id)

    if (!evidencePackage) {
      return (
        <PageShell width="wide" className="space-y-6">
          <SectionIntro
            eyebrow="Workspace · Nachweispaket"
            title="Dokument nicht gefunden"
            description="Das angeforderte Dokument ist in diesem Arbeitsbereich nicht verfügbar."
          />
          <InfoPanel title="Hinweis" tone="muted">
            Die Exportansicht konnte aktuell nicht geladen werden.
          </InfoPanel>
        </PageShell>
      )
    }

    return (
      <PageShell width="wide" className="space-y-6 evidence-print-page">
        <DocumentEvidencePackageView evidencePackage={evidencePackage} />

        <style>
          {`@media print {
            header, nav, footer {
              display: none !important;
            }

            .evidence-print-page {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .evidence-print-card,
            .evidence-print-root section,
            .evidence-print-root article {
              break-inside: avoid;
              page-break-inside: avoid;
              box-shadow: none !important;
            }

            .evidence-print-actions {
              display: none !important;
            }
          }`}
        </style>
      </PageShell>
    )
  } catch {
    return (
      <PageShell width="wide" className="space-y-6">
        <SectionIntro
          eyebrow="Workspace · Nachweispaket"
          title="Exportansicht derzeit nicht verfügbar"
          description="Die Exportansicht konnte aktuell nicht geladen werden. Bitte versuchen Sie es erneut."
        />
      </PageShell>
    )
  }
}
