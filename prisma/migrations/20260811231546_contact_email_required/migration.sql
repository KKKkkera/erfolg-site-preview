/*
  Warnings:

  - Made the column `email` on table `quote_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `service_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "quote_requests" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "service_requests" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
