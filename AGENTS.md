# KanzleiAI - Enterprise Legal SaaS Platform

## Projekt-Kontext
Domain: kanzlei-ai.de (Strato)
Zielgruppe: Kleine Anwaltskanzleien (1-15 Personen) im DACH-Raum
Compliance: DSGVO, ISO 27001, EU AI Act (High-Risk System)

## Architektur-Vorgaben

### Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, PostgreSQL 16, Prisma ORM
- **Hosting**: Vercel (Frontend EU), Hetzner Nürnberg (DB)
- **Auth**: NextAuth.js v5 mit SAML/SSO-Unterstützung
- **AI**: Azure OpenAI Service (EU-West Region)

### Non-Negotiable Requirements
1. **DSGVO-First**: Alle Personendaten verschlüsselt (AES-256), Audit-Logging für alle Zugriffe
2. **EU AI Act**: Transparenz-Layer (KI-Kennzeichnung in UI), Human-in-the-Loop für kritische Analysen
3. **Multi-Tenancy**: Row-Level Security (RLS) in PostgreSQL, strikte Mandantentrennung
4. **Deutsche UI**: Alle Texte in Deutsch, keine englischen Fallbacks

### Codex-Arbeitsweise
- **Senior Engineer Mode**: Gib Architektur-Entscheidungen, keine Mikroanweisungen
- **Security-First**: Bei jeder Implementierung Compliance-Implikationen prüfen
- **Iterativ**: Erst MVP-Features, dann Erweiterungen

## Aktuelle Priorität
Phase 1 (Woche 1-2): DSGVO-Compliance-Layer + Auth + Basis-UI

## Feature-Roadmap

### MVP (Woche 1-4)
- [ ] User Authentication (Email/Password + SSO)
- [ ] Dashboard mit Dokumenten-Upload
- [ ] PDF-Analyse mit Azure OpenAI
- [ ] Basis-Vertragsvorlagen (Arbeitsvertrag, Mietvertrag)
- [ ] DSGVO-Compliance-Pages (Datenschutz, Impressum, AVV)

### Phase 2 (Woche 5-8)
- [ ] DATEV/Lexware Integration
- [ ] Team-Management & RBAC
- [ ] Fristenkalender
- [ ] E-Mail-Benachrichtigungen
- [ ] Audit-Log für Compliance

### Phase 3 (Woche 9-12)
- [ ] White-Label-Optionen
- [ ] API für Drittanbieter
- [ ] Mobile-Optimierung
- [ ] ISO 27001 Zertifizierungsvorbereitung
