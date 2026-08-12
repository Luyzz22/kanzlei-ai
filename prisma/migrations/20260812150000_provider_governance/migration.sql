-- Provider-Governance (Compliance-Handoff A2)
-- Ersetzt boolesche ENV-Annahmen durch nachweisgebundene, ablaufende
-- Anbieterfreigaben. Rein additiv: keine bestehende Tabelle wird angefasst.

-- CreateEnum
CREATE TYPE "ProviderVerificationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'VERIFIED', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProviderTrustTier" AS ENUM ('LOCAL', 'EU_SOVEREIGN', 'EU_CONTROLLED', 'THIRD_COUNTRY');

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(120) NOT NULL,
    "trustTier" "ProviderTrustTier" NOT NULL,
    "verificationStatus" "ProviderVerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "allowedDataClasses" INTEGER[],
    "euDataBoundaryVerified" BOOLEAN NOT NULL DEFAULT false,
    "noTrainingVerified" BOOLEAN NOT NULL DEFAULT false,
    "zeroRetentionVerified" BOOLEAN NOT NULL DEFAULT false,
    "noHumanAccessVerified" BOOLEAN NOT NULL DEFAULT false,
    "abuseMonitoringDisabled" BOOLEAN NOT NULL DEFAULT false,
    "supportEuOnlyVerified" BOOLEAN NOT NULL DEFAULT false,
    "section43eAgreementSignedAt" TIMESTAMP(3),
    "dpaSignedAt" TIMESTAMP(3),
    "tiaApprovedAt" TIMESTAMP(3),
    "evidenceUrl" VARCHAR(500),
    "evidenceHash" VARCHAR(64),
    "expiresAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_provider_key" ON "ProviderProfile"("provider");

-- CreateIndex
CREATE INDEX "ProviderProfile_verificationStatus_expiresAt_idx" ON "ProviderProfile"("verificationStatus", "expiresAt");
