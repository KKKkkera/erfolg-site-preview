ALTER TABLE "products"
ADD COLUMN "homeBadge" TEXT;

-- Give the currently visible homepage products editable, non-price-specific
-- labels. Editors can replace or clear them in the product form.
WITH "rankedHomeProducts" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "homeSort" ASC, "name" ASC) AS "position"
  FROM "products"
  WHERE "status" = 'ACTIVE' AND "showOnHome" = true
)
UPDATE "products" AS "product"
SET "homeBadge" = CASE
  WHEN "rankedHomeProducts"."position" IN (1, 3, 5) THEN 'Новинка'
  ELSE 'Спецпредложение'
END
FROM "rankedHomeProducts"
WHERE "product"."id" = "rankedHomeProducts"."id"
  AND "rankedHomeProducts"."position" <= 5;
