import { S3Client } from "@aws-sdk/client-s3";

/**
 * Клиент S3 для Selectel-совместимого хранилища.
 * Selectel требует forcePathStyle = true и кастомный endpoint.
 *
 * Переменные окружения:
 * - S3_ENDPOINT (например https://s3.ru-1.storage.selcloud.ru)
 * - S3_REGION (по умолчанию "ru-1")
 * - S3_ACCESS_KEY
 * - S3_SECRET_KEY
 * - S3_BUCKET (по умолчанию "erfolg-media")
 * - S3_PUBLIC_URL — базовый адрес объектов в хранилище (без слэша на конце)
 *
 * ВАЖНО про доступ: бакет закрыт целиком, публичного чтения у него нет и
 * включать его не следует. В одном бакете лежат и картинки каталога
 * (products/), и вложения к заявкам (requests/) — ТЗ, спецификации конкурсов,
 * фото шильдов, то есть персональные данные сотрудников клиник. Публичный
 * доступ, настроенный чуть шире, чем задумано, открыл бы и их.
 * Поэтому наружу ничего не отдаётся напрямую: и картинки, и вложения
 * получают временные подписанные ссылки.
 */
export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "ru-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

export const S3_BUCKET = process.env.S3_BUCKET ?? "erfolg-media";
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL ?? "";

/** Базовый адрес объектов в хранилище: <endpoint>/<bucket>. */
function storageBase(): string {
  const explicit = S3_PUBLIC_URL.replace(/\/$/, "");
  if (explicit) return explicit;
  const endpoint = (process.env.S3_ENDPOINT ?? "").replace(/\/$/, "");
  return endpoint ? `${endpoint}/${S3_BUCKET}` : "";
}

/**
 * Внутренний адрес объекта в хранилище.
 *
 * Публично он НЕ открывается — бакет закрыт. Это ссылка-опознаватель: из неё
 * достаётся ключ, по которому выписывается временная подписанная ссылка
 * (см. lib/attachment-links.ts). Используется для вложений к заявкам, которые
 * показываются только в админке.
 */
export function storageUrl(key: string): string {
  const base = storageBase();
  const k = key.replace(/^\/+/, "");
  return base ? `${base}/${k}` : k;
}

/**
 * Адрес картинки для показа на сайте.
 *
 * Ведёт не в хранилище, а на собственный маршрут /media/<ключ>: он выписывает
 * временную ссылку и перенаправляет на неё. Так посетителю ничего не нужно от
 * настроек бакета — публичное чтение включать не требуется вовсе.
 *
 * Побочная выгода: адрес картинки остаётся постоянным и человекочитаемым,
 * его можно ставить в og:image и разметку schema.org, а срок жизни подписи
 * при этом остаётся коротким.
 */
export function publicUrl(key: string): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const k = key.replace(/^\/+/, "");
  return `${site}/media/${k}`;
}

export function isS3Configured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY &&
    process.env.S3_BUCKET
  );
}

/**
 * Извлекает S3 key из сохранённого адреса.
 *
 * Понимает два вида: собственный маршрут сайта (/media/<ключ>) и прямой адрес
 * объекта в хранилище — так писалось до перехода на маршрут. Возвращает null,
 * если адрес не наш: например, легаси-ссылка на внешний источник.
 */
export function keyFromPublicUrl(url: string): string | null {
  if (!url) return null;

  let path: string | null = null;
  if (url.startsWith("/")) {
    path = url;
  } else {
    try {
      const parsed = new URL(url);
      const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://erfolgmt.ru");
      path = parsed.origin === site.origin ? parsed.pathname : null;
    } catch {
      path = null;
    }
  }

  if (path && path.startsWith("/media/")) {
    try {
      const key = decodeURIComponent(path.slice("/media/".length));
      return key && !key.includes("..") ? key : null;
    } catch { return null; }
  }

  const base = storageBase();
  if (base && url.startsWith(`${base}/`)) {
    try {
      const key = decodeURIComponent(url.slice(base.length + 1).split("?")[0]);
      return key && !key.includes("..") ? key : null;
    } catch { return null; }
  }

  return null;
}
