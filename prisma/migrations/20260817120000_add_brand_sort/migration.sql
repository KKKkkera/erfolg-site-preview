ALTER TABLE "brands" ADD COLUMN "sort" INTEGER NOT NULL DEFAULT 0;

UPDATE "brands" AS brand
SET
  "sort" = values."sort",
  "logo" = COALESCE(brand."logo", values."logo")
FROM (
  VALUES
    ('b-braun', 10, NULL),
    ('bpl-medical', 20, NULL),
    ('canon-medical', 30, NULL),
    ('contec', 40, NULL),
    ('draeger', 50, '/images/brands/draeger.webp'),
    ('edan', 60, NULL),
    ('erbe', 70, NULL),
    ('fresenius', 80, NULL),
    ('fukuda-denshi', 90, NULL),
    ('ge-healthcare', 100, '/images/brands/ge-healthcare.svg'),
    ('getinge', 110, NULL),
    ('hamilton-medical', 120, '/images/brands/hamilton-medical.svg'),
    ('hitachi', 130, NULL),
    ('karl-storz', 140, '/images/brands/karl-storz.webp'),
    ('medtronic', 150, NULL),
    ('mindray', 160, '/images/brands/mindray.png'),
    ('nihon-kohden', 170, NULL),
    ('olympus', 180, '/images/brands/olympus.svg'),
    ('philips', 190, NULL),
    ('riester', 200, NULL),
    ('roche-diagnostics', 210, NULL),
    ('samsung-medison', 220, NULL),
    ('schiller', 230, NULL),
    ('siemens-healthineers', 240, NULL),
    ('smiths-medical', 250, NULL),
    ('spacelabs', 260, NULL),
    ('stryker', 270, NULL),
    ('sysmex', 280, NULL),
    ('welch-allyn', 290, NULL),
    ('altonika', 300, NULL),
    ('elatma', 310, NULL),
    ('kazmedpribor', 320, NULL),
    ('ramenskoe-pribor', 330, NULL),
    ('triton-electronics', 340, NULL),
    ('uomz', 350, NULL)
) AS values("slug", "sort", "logo")
WHERE brand."slug" = values."slug";
