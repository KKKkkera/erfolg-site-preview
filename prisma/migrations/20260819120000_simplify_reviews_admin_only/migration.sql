-- Отзывы больше не принимаются с сайта: карточки заводит администратор.
-- Поэтому уходят поля модерации, согласия и контактов автора (ПДн).
DROP INDEX IF EXISTS "reviews_status_publishedAt_idx";

ALTER TABLE "reviews"
  DROP COLUMN IF EXISTS "showOrganization",
  DROP COLUMN IF EXISTS "attachments",
  DROP COLUMN IF EXISTS "consent",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "moderatorNote",
  DROP COLUMN IF EXISTS "contactEmail",
  DROP COLUMN IF EXISTS "contactPhone",
  DROP COLUMN IF EXISTS "ip",
  DROP COLUMN IF EXISTS "userAgent",
  ADD COLUMN "position" TEXT,
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sort" INTEGER NOT NULL DEFAULT 0;

DROP TYPE IF EXISTS "ReviewStatus";

CREATE INDEX "reviews_isPublished_sort_idx" ON "reviews"("isPublished", "sort");
