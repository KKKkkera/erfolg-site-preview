-- Данные о документах и маркировке товара для карточки каталога.
ALTER TABLE "products" ADD COLUMN "regValidUntil" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "regAuthority" TEXT;
ALTER TABLE "products" ADD COLUMN "markingRequired" BOOLEAN;
ALTER TABLE "products" ADD COLUMN "markingCodes" TEXT;
