ALTER TABLE "products"
ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "homeSort" INTEGER NOT NULL DEFAULT 0;

-- Keep the section populated after deployment without silently featuring the
-- entire catalog. Editors can replace these five products in the admin area.
WITH "initialHome" AS (
  SELECT
    "id",
    (ROW_NUMBER() OVER (ORDER BY "sort" ASC, "name" ASC) - 1)::INTEGER AS "homeSort"
  FROM "products"
  WHERE "status" = 'ACTIVE'
  ORDER BY "sort" ASC, "name" ASC
  LIMIT 5
)
UPDATE "products" AS "product"
SET
  "showOnHome" = true,
  "homeSort" = "initialHome"."homeSort"
FROM "initialHome"
WHERE "product"."id" = "initialHome"."id";

CREATE INDEX "products_status_showOnHome_homeSort_idx"
ON "products"("status", "showOnHome", "homeSort");
