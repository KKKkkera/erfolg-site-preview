import "server-only";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { S3_BUCKET, isS3Configured, s3 } from "@/lib/s3";

/**
 * Временные ссылки на вложения к заявкам.
 *
 * Вложения содержат ПДн и коммерческие документы клиник, поэтому лежат в
 * закрытом бакете (см. комментарий в request-attachments.ts). Прямой адрес,
 * который сохраняется вместе с заявкой, для закрытого файла отдаёт 403 —
 * менеджер не может открыть присланное ТЗ. Поэтому в админке адрес
 * подписывается на лету и живёт ограниченное время.
 *
 * Публичным бакет делать нельзя: тогда ТЗ и спецификации конкурсов будут
 * доступны любому по прямой ссылке.
 */

/** Сколько живёт подписанная ссылка. Хватает открыть и скачать, но не разослать. */
export const ATTACHMENT_LINK_TTL_SECONDS = 15 * 60;

function endpointHost(): string {
  try {
    return new URL(process.env.S3_ENDPOINT ?? "").hostname;
  } catch {
    return "";
  }
}

/**
 * Достаёт S3-ключ из сохранённого в заявке адреса.
 *
 * Адреса в базе бывают двух видов, потому что S3_PUBLIC_URL менялся:
 *   путь    — https://s3.ru-1.storage.selcloud.ru/erfolg-media/<ключ>
 *   поддомен— https://erfolg-media.s3.ru-1.storage.selcloud.ru/<ключ>
 * Оба разбираем, иначе старые заявки перестанут открываться после правки
 * настроек. Для чужих адресов возвращаем null — подписать их нельзя.
 */
export function keyFromStoredUrl(url: string): string | null {
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    return url.replace(/^\/+/, "") || null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname;
  const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  const base = endpointHost();

  if (base && host === `${S3_BUCKET}.${base}`) {
    return path || null;
  }
  if (base && host === base && path.startsWith(`${S3_BUCKET}/`)) {
    return path.slice(S3_BUCKET.length + 1) || null;
  }
  return null;
}

/**
 * Подписанный адрес для скачивания. null — если хранилище не настроено,
 * адрес чужой или подписать не удалось; вызывающий код показывает файл
 * без ссылки, а не ведёт менеджера на страницу с ошибкой доступа.
 */
export async function signedAttachmentUrl(
  storedUrl: string,
  fileName?: string,
): Promise<string | null> {
  if (!isS3Configured()) return null;

  const key = keyFromStoredUrl(storedUrl);
  if (!key) return null;

  // Кавычки и обратные слэши сломали бы заголовок Content-Disposition.
  const safeName = (fileName ?? "").replace(/["\\\r\n]/g, "");

  try {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ...(safeName
          ? { ResponseContentDisposition: `attachment; filename="${safeName}"` }
          : {}),
      }),
      { expiresIn: ATTACHMENT_LINK_TTL_SECONDS },
    );
  } catch (e) {
    console.error("[attachments] не удалось подписать ссылку:", e);
    return null;
  }
}
