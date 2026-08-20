-- Единая форма обратной связи спрашивает имя, телефон и комментарий.
-- Email больше не собирается, поэтому колонка становится необязательной.
ALTER TABLE "quote_requests" ALTER COLUMN "email" DROP NOT NULL;
