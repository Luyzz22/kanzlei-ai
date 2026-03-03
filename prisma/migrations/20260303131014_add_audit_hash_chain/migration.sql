-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "eventHash" VARCHAR(64),
ADD COLUMN     "prevHash" VARCHAR(64);
