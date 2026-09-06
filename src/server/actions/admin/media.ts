"use server";

import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  S3_BUCKET,
  isS3Configured,
  keyFromPublicUrl,
  publicUrl,
  s3,
} from "@/lib/s3";
import { slugify } from "@/lib/slugify";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

// SVG исключён намеренно: SVG может содержать <script> и onload-атрибуты,
// а наша admin-загрузка не выполняет растеризацию. Если понадобится — добавить
// после server-side санитайзинга через sharp.toFormat('png').
const MIME_TO_EXT = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);
const ALLOWED_MIME = new Set(MIME_TO_EXT.keys());
const MAX_SIZE = 10 * 1024 * 1024; // 10 МБ

const RequestUploadInput = z.object({
  filename: z.string().trim().min(1).max(300),
  mime: z.string().trim().min(1).max(100),
  size: z.coerce.number().int().min(1).max(MAX_SIZE),
});

export type RequestUploadResult =
  | { ok: true; uploadUrl: string; key: string; publicUrl: string }
  | { ok: false; message: string };

export async function requestUpload(
  input: z.input<typeof RequestUploadInput>,
): Promise<RequestUploadResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  if (!isS3Configured()) {
    return {
      ok: false,
      message:
        "Selectel S3 не настроен. Заполните переменные S3_* в .env, чтобы включить загрузку.",
    };
  }

  const parsed = RequestUploadInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Некорректные параметры запроса" };
  }
  const { filename, mime, size } = parsed.data;
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, message: "Допустимы только JPG, PNG, WebP, AVIF, GIF" };
  }
  if (size > MAX_SIZE) {
    return { ok: false, message: "Файл больше 10 МБ" };
  }

  // Сборка ключа: products/<uuid>-<slug>.<ext>
  // Расширение жёстко берём из валидированного MIME, а не из filename.
  const dot = filename.lastIndexOf(".");
  const baseName = dot >= 0 ? filename.slice(0, dot) : filename;
  const ext = MIME_TO_EXT.get(mime) ?? "bin";
  const slugBase = slugify(baseName) || "file";
  const key = `products/${admin.id}/${randomUUID()}-${slugBase}.${ext}`;

  try {
    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mime,
      ContentLength: size,
    });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 600 });
    return { ok: true, uploadUrl, key, publicUrl: publicUrl(key) };
  } catch (e) {
    console.error("requestUpload presign error", e);
    return { ok: false, message: "Не удалось подготовить загрузку" };
  }
}

const ConfirmUploadInput = z.object({
  key: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(500).optional().nullable(),
  mime: z.string().trim().max(100),
  size: z.coerce.number().int().min(1).max(MAX_SIZE),
  width: z.coerce.number().int().min(0).max(20000).optional().nullable(),
  height: z.coerce.number().int().min(0).max(20000).optional().nullable(),
  origin: z.string().trim().max(60).optional().nullable(),
});

export type ConfirmUploadResult =
  | { ok: true; id: string; url: string }
  | { ok: false; message: string };

export async function confirmUpload(
  input: z.input<typeof ConfirmUploadInput>,
): Promise<ConfirmUploadResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = ConfirmUploadInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Некорректные параметры" };
  }
  const data = parsed.data;
  try {
    if (!data.key.startsWith(`products/${admin.id}/`) || data.key.includes("..")) {
      return { ok: false, message: "Некорректный ключ загрузки" };
    }
    const object = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: data.key }));
    if (!object.ContentLength || object.ContentLength > MAX_SIZE || object.ContentLength !== data.size ||
        object.ContentType !== data.mime || !ALLOWED_MIME.has(object.ContentType)) {
      return { ok: false, message: "Размер или тип загруженного файла не соответствует запросу" };
    }
    const url = publicUrl(data.key);
    const created = await db.mediaAsset.create({
      data: {
        url,
        alt: data.alt?.trim() ? data.alt.trim() : null,
        mime: data.mime,
        size: data.size,
        width: data.width ?? null,
        height: data.height ?? null,
        origin: data.origin?.trim() ? data.origin.trim() : null,
      },
    });
    await logAction(admin.id, "create", "MediaAsset", created.id, {
      key: data.key,
      mime: data.mime,
      size: data.size,
    });
    revalidatePath("/admin/media");
    return { ok: true, id: created.id, url };
  } catch (e) {
    console.error("confirmUpload error", e);
    return { ok: false, message: "Не удалось сохранить запись о файле" };
  }
}

export async function updateMediaAlt(
  id: string,
  alt: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  try {
    await db.mediaAsset.update({
      where: { id },
      data: { alt: alt.trim() ? alt.trim() : null },
    });
    await logAction(admin.id, "update", "MediaAsset", id, { alt });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    console.error("updateMediaAlt error", e);
    return { ok: false, message: "Не удалось сохранить alt" };
  }
}

export async function deleteMedia(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  try {
    const media = await db.mediaAsset.findUnique({ where: { id } });
    if (!media) return { ok: false, message: "Файл не найден" };

    if (isS3Configured()) {
      const key = keyFromPublicUrl(media.url);
      if (key?.startsWith("products/") && !key.includes("..")) {
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
          );
        } catch (e) {
          // Не критично — может быть уже удалён в S3
          console.error("deleteMedia S3 error", e);
        }
      }
    }

    await db.mediaAsset.delete({ where: { id } });
    await logAction(admin.id, "delete", "MediaAsset", id, { url: media.url });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    console.error("deleteMedia error", e);
    return { ok: false, message: "Не удалось удалить файл" };
  }
}
