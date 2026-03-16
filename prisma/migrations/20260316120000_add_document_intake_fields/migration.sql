-- CreateEnum
CREATE TYPE "DocumentIntakeStatus" AS ENUM ('EINGEGANGEN', 'IN_PRUEFUNG', 'FREIGEGEBEN', 'ARCHIVIERT');

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Unbenanntes Dokument',
ADD COLUMN "documentType" TEXT NOT NULL DEFAULT 'Sonstiges',
ADD COLUMN "organizationName" TEXT NOT NULL DEFAULT 'Nicht zugeordnet',
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "DocumentIntakeStatus" NOT NULL DEFAULT 'EINGEGANGEN';
