-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ANWALT', 'ASSISTENT');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "DocumentReviewNoteType" AS ENUM ('NOTE', 'DECISION_MEMO');

-- CreateEnum
CREATE TYPE "DocumentFindingSeverity" AS ENUM ('NIEDRIG', 'MITTEL', 'HOCH');

-- CreateEnum
CREATE TYPE "DocumentFindingStatus" AS ENUM ('OFFEN', 'GEKLAERT', 'AKZEPTIERT');

-- CreateEnum
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('AUSSTEHEND', 'VERARBEITET', 'NICHT_UNTERSTUETZT', 'FEHLGESCHLAGEN');

-- CreateEnum
CREATE TYPE "DocumentIntakeStatus" AS ENUM ('EINGEGANGEN', 'IN_PRUEFUNG', 'FREIGEGEBEN', 'ARCHIVIERT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "externalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ASSISTENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AnalysisLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "modelUsed" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantGovernanceSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "requireMfaForPrivilegedRoles" BOOLEAN NOT NULL DEFAULT true,
    "documentRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "autoArchiveApprovedDocuments" BOOLEAN NOT NULL DEFAULT false,
    "adminSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "standardSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 480,
    "requireApprovalForPrivilegedRoleChanges" BOOLEAN NOT NULL DEFAULT true,
    "requireReasonForPrivilegedReviewActions" BOOLEAN NOT NULL DEFAULT true,
    "requireFourEyesForApproval" BOOLEAN NOT NULL DEFAULT true,
    "requireReasonForApproval" BOOLEAN NOT NULL DEFAULT true,
    "requireReasonForArchiving" BOOLEAN NOT NULL DEFAULT true,
    "approvalRestrictedToPrivilegedRoles" BOOLEAN NOT NULL DEFAULT true,
    "archivingRestrictedToPrivilegedRoles" BOOLEAN NOT NULL DEFAULT true,
    "reviewStartRestrictedToPrivilegedRoles" BOOLEAN NOT NULL DEFAULT false,
    "defaultDocumentRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "auditEvidenceRetentionDays" INTEGER NOT NULL DEFAULT 1825,
    "reviewDueDays" INTEGER NOT NULL DEFAULT 14,
    "archiveAfterApprovalDays" INTEGER NOT NULL DEFAULT 30,
    "softDeletePolicyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantGovernanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Unbenanntes Dokument',
    "documentType" TEXT NOT NULL DEFAULT 'Sonstiges',
    "organizationName" TEXT NOT NULL DEFAULT 'Nicht zugeordnet',
    "description" TEXT,
    "status" "DocumentIntakeStatus" NOT NULL DEFAULT 'EINGEGANGEN',
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sha256" VARCHAR(64),
    "storageKey" TEXT,
    "processingStatus" "DocumentProcessingStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "extractedTextPreview" TEXT,
    "textExtractedAt" TIMESTAMP(3),
    "reviewOwnerId" TEXT,
    "reviewDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sectionKey" VARCHAR(64),
    "anchorText" VARCHAR(280),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentReviewNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "DocumentReviewNoteType" NOT NULL DEFAULT 'NOTE',
    "title" VARCHAR(160),
    "body" TEXT NOT NULL,
    "sectionKey" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentReviewNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DocumentFindingSeverity" NOT NULL DEFAULT 'MITTEL',
    "status" "DocumentFindingStatus" NOT NULL DEFAULT 'OFFEN',
    "sectionKey" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "DocumentFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "documentId" TEXT,
    "analysisLogId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "prevHash" VARCHAR(64),
    "eventHash" VARCHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "AnalysisLog_tenantId_createdAt_idx" ON "AnalysisLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisLog_userId_createdAt_idx" ON "AnalysisLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisLog_documentId_createdAt_idx" ON "AnalysisLog"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "TenantMember_userId_idx" ON "TenantMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMember_tenantId_userId_key" ON "TenantMember"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantGovernanceSettings_tenantId_key" ON "TenantGovernanceSettings"("tenantId");

-- CreateIndex
CREATE INDEX "TenantGovernanceSettings_updatedByUserId_idx" ON "TenantGovernanceSettings"("updatedByUserId");

-- CreateIndex
CREATE INDEX "Document_tenantId_createdAt_idx" ON "Document"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_tenantId_reviewDueAt_idx" ON "Document"("tenantId", "reviewDueAt");

-- CreateIndex
CREATE INDEX "Document_reviewOwnerId_idx" ON "Document"("reviewOwnerId");

-- CreateIndex
CREATE INDEX "DocumentComment_tenantId_documentId_createdAt_idx" ON "DocumentComment"("tenantId", "documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentComment_documentId_createdAt_idx" ON "DocumentComment"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentComment_authorId_createdAt_idx" ON "DocumentComment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentReviewNote_tenantId_documentId_type_createdAt_idx" ON "DocumentReviewNote"("tenantId", "documentId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentReviewNote_documentId_createdAt_idx" ON "DocumentReviewNote"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentReviewNote_authorId_createdAt_idx" ON "DocumentReviewNote"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_tenantId_documentId_status_createdAt_idx" ON "DocumentFinding"("tenantId", "documentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_documentId_createdAt_idx" ON "DocumentFinding"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_createdById_createdAt_idx" ON "DocumentFinding"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_resolvedById_resolvedAt_idx" ON "DocumentFinding"("resolvedById", "resolvedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_createdAt_idx" ON "AuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisLog" ADD CONSTRAINT "AnalysisLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisLog" ADD CONSTRAINT "AnalysisLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisLog" ADD CONSTRAINT "AnalysisLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantGovernanceSettings" ADD CONSTRAINT "TenantGovernanceSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantGovernanceSettings" ADD CONSTRAINT "TenantGovernanceSettings_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewOwnerId_fkey" FOREIGN KEY ("reviewOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReviewNote" ADD CONSTRAINT "DocumentReviewNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReviewNote" ADD CONSTRAINT "DocumentReviewNote_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReviewNote" ADD CONSTRAINT "DocumentReviewNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_analysisLogId_fkey" FOREIGN KEY ("analysisLogId") REFERENCES "AnalysisLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

