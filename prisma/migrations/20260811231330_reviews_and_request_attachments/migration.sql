-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "contact_requests" ADD COLUMN     "attachments" JSONB;

-- AlterTable
ALTER TABLE "quote_requests" ADD COLUMN     "attachments" JSONB;

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "attachments" JSONB;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "city" TEXT,
    "organization" TEXT,
    "showOrganization" BOOLEAN NOT NULL DEFAULT false,
    "text" TEXT NOT NULL,
    "attachments" JSONB,
    "rating" INTEGER,
    "consent" BOOLEAN NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "moderatorNote" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_status_publishedAt_idx" ON "reviews"("status", "publishedAt");
