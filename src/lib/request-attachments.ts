import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

import { S3_BUCKET, isS3Configured, s3, storageUrl } from "@/lib/s3";

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 МБ

/**
 * Что принимаем во вложениях к заявкам: техническое задание, спецификация
 * конкурса, фото идентификационной таблички. Сайт приглашает прислать именно
 * это — поэтому список расширений совпадает с текстом подсказки под полем.
 */
const ALLOWED = new Map<string, string[]>([
  ["application/pdf", ["pdf"]],
  ["application/msword", ["doc"]],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ["docx"],
  ],
  ["application/vnd.ms-excel", ["xls"]],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ["xlsx"],
  ],
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/heic", ["heic"]],
]);

const ALLOWED_EXTENSIONS = new Set([...ALLOWED.values()].flat());

/** Отзывы принимают фото и видео, документы там не нужны. */
const MEDIA_ALLOWED = new Map<string, string[]>([
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/heic", ["heic"]],
  ["video/mp4", ["mp4"]],
  ["video/quicktime", ["mov"]],
]);

const MEDIA_EXTENSIONS = new Set([...MEDIA_ALLOWED.values()].flat());

export const MAX_REVIEW_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 МБ

export type StoredAttachment = {
  url: string;
  name: string;
  size: number;
};

export type AttachmentResult =
  | { ok: true; files: StoredAttachment[] }
  | { ok: false; error: string };

function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i === -1 ? "" : fileName.slice(i + 1).toLowerCase();
}

function sanitizeName(fileName: string): string {
  return fileName.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 120);
}

/**
 * Принимает файлы из FormData, проверяет и кладёт в S3.
 *
 * Пустой список — не ошибка: вложение необязательно.
 *
 * Если S3 не настроен, возвращаем ошибку с понятной альтернативой, а не
 * молча теряем файл: заявка без ТЗ, которое человек приложил, хуже, чем
 * честное «пришлите на почту».
 */
export async function storeRequestAttachments(
  formData: FormData,
  folder: string,
  options: { media?: boolean } = {},
): Promise<AttachmentResult> {
  const media = options.media === true;
  const maxBytes = media ? MAX_REVIEW_ATTACHMENT_BYTES : MAX_ATTACHMENT_BYTES;
  const maxLabel = media ? "25 МБ" : "10 МБ";
  const formatsLabel = media
    ? "Подойдут JPG, PNG, MP4."
    : "Подойдут PDF, DOC, XLS, JPG, PNG.";
  const typeMap = media ? MEDIA_ALLOWED : ALLOWED;
  const extSet = media ? MEDIA_EXTENSIONS : ALLOWED_EXTENSIONS;

  const raw = formData
    .getAll("attachments")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (raw.length === 0) return { ok: true, files: [] };

  if (raw.length > MAX_ATTACHMENTS) {
    return {
      ok: false,
      error: `Можно приложить не больше ${MAX_ATTACHMENTS} файлов.`,
    };
  }

  for (const file of raw) {
    if (file.size > maxBytes) {
      return {
        ok: false,
        error: `Файл больше ${maxLabel}. Пришлите его на info@erfolgmt.ru — форму отправьте без вложения.`,
      };
    }
    const ext = extensionOf(file.name);
    const typeOk = typeMap.has(file.type);
    const extOk = extSet.has(ext);
    if (!typeOk && !extOk) {
      return {
        ok: false,
        error: `Такой формат не принимаем. ${formatsLabel}`,
      };
    }
  }

  if (!isS3Configured()) {
    return {
      ok: false,
      error:
        "Загрузка файлов временно недоступна. Пришлите документы на info@erfolgmt.ru — заявку отправьте без вложения.",
    };
  }

  const stored: StoredAttachment[] = [];
  for (const file of raw) {
    const ext = extensionOf(file.name);
    const key = `requests/${folder}/${randomUUID()}${ext ? `.${ext}` : ""}`;
    const body = Buffer.from(await file.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
        // Вложения к заявкам содержат ПДн и коммерческие документы —
        // публичного ACL здесь быть не должно.
        ContentDisposition: `attachment; filename="${sanitizeName(file.name)}"`,
      }),
    );
    stored.push({
      // Именно storageUrl, а не publicUrl: publicUrl ведёт на маршрут /media,
      // открытый всему интернету. Вложения к заявкам туда попасть не должны —
      // они показываются только в админке по временной ссылке.
      url: storageUrl(key),
      name: sanitizeName(file.name),
      size: file.size,
    });
  }

  return { ok: true, files: stored };
}
