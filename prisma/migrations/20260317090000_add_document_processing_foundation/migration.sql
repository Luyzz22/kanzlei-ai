-- CreateEnum
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('AUSSTEHEND', 'VERARBEITET', 'NICHT_UNTERSTUETZT', 'FEHLGESCHLAGEN');

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "processingStatus" "DocumentProcessingStatus" NOT NULL DEFAULT 'AUSSTEHEND',
ADD COLUMN "processedAt" TIMESTAMP(3),
ADD COLUMN "processingError" TEXT,
ADD COLUMN "extractedTextPreview" TEXT,
ADD COLUMN "textExtractedAt" TIMESTAMP(3);
