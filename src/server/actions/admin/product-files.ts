"use server";

import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import {
  S3_BUCKET,
  isS3Configured,
  keyFromPublicUrl,
  publicUrl,
  s3,
} from "@/lib/s3";
import { slugify } from "@/lib/slugify";
import { requireAdmin } from "@/server/actions/admin/auth";

/**
 * Документы товара: РУ, декларации, спецификации, инструкции.
 *
 * Отдельно от медиатеки намеренно. Медиатека — про картинки: её whitelist
 * пропускает только image/*, а карточка ассета рисует превью. Документ — это
 * PDF или офисный файл со сканом подписи, ему нужен свой набор MIME и
 * человеческое название («РУ № ФСЗ 2019/8123»), которое видит посетитель на
 * вкладке «Документы».
 *
 * Ключ кладём в products/docs/ — под тот же публичный префикс products/,
 * который отдаёт маршрут /media/<ключ>. Иначе ссылка на документ отвечала бы
 * 404: маршрут пускает наружу ровно один префикс.
 */
const MIME_TO_EXT = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
  ],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);
const MAX_SIZE = 25 * 1024 * 1024; // 25 МБ — скан РУ на десяток страниц

const RequestUploadInput = z.object({
  filename: z.string().trim().min(1).max(300),
  mime: z.string().trim().min(1).max(150),
  size: z.coerce.number().int().min(1).max(MAX_SIZE),
});

export type RequestFileUploadResult =
  | { ok: true; uploadUrl: string; key: string; url: string }
  | { ok: false; message: string };

export async function requestProductFileUpload(
  input: z.input<typeof RequestUploadInput>,
): Promise<RequestFileUploadResult> {
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
  if (!parsed.success) return { ok: false, message: "Некорректные параметры" };
  const { filename, mime, size } = parsed.data;

  if (!MIME_TO_EXT.has(mime)) {
    return {
      ok: false,
      message: "Допустимы PDF, DOC, DOCX, XLS, XLSX, JPG, PNG",
    };
  }

  // Расширение берём из проверенного MIME, а не из имени файла.
  const dot = filename.lastIndexOf(".");
  const baseName = dot >= 0 ? filename.slice(0, dot) : filename;
  const ext = MIME_TO_EXT.get(mime) ?? "bin";
  const slugBase = slugify(baseName) || "document";
  const key = `products/docs/${randomUUID()}-${slugBase}.${ext}`;

  try {
    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mime,
    });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 600 });
    return { ok: true, uploadUrl, key, url: publicUrl(key) };
  } catch (e) {
    console.error("requestProductFileUpload presign error", e);
    return { ok: false, message: "Не удалось подготовить загрузку" };
  }
}

const AddInput = z.object({
  productId: z.string().trim().min(1),
  url: z.string().trim().min(1).max(2000),
  label: z.string().trim().min(1).max(200),
});

export async function addProductFile(
  input: z.input<typeof AddInput>,
): Promise<
  | { ok: true; id: string; url: string; label: string; sort: number }
  | { ok: false; message: string }
> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = AddInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Некорректные данные" };
  const data = parsed.data;
  try {
    const max = await db.productFile.findFirst({
      where: { productId: data.productId },
      orderBy: { sort: "desc" },
      select: { sort: true },
    });
    const created = await db.productFile.create({
      data: {
        productId: data.productId,
        url: data.url,
        label: data.label,
        sort: (max?.sort ?? -1) + 1,
      },
    });
    await logAction(admin.id, "create", "ProductFile", created.id, {
      productId: data.productId,
      label: data.label,
    });
    revalidatePath(`/admin/products/${data.productId}`);
    revalidatePath("/catalog");
    return {
      ok: true,
      id: created.id,
      url: created.url,
      label: created.label,
      sort: created.sort,
    };
  } catch (e) {
    console.error("addProductFile error", e);
    return { ok: false, message: "Не удалось добавить документ" };
  }
}

const RenameInput = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(200),
});

export async function renameProductFile(
  input: z.input<typeof RenameInput>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  const parsed = RenameInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Некорректные данные" };
  const data = parsed.data;
  try {
    const file = await db.productFile.update({
      where: { id: data.id },
      data: { label: data.label },
    });
    await logAction(admin.id, "update", "ProductFile", data.id, {
      productId: file.productId,
      label: data.label,
    });
    revalidatePath(`/admin/products/${file.productId}`);
    revalidatePath("/catalog");
    return { ok: true };
  } catch (e) {
    console.error("renameProductFile error", e);
    return { ok: false, message: "Не удалось переименовать" };
  }
}

export async function removeProductFile(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  try {
    const file = await db.productFile.findUnique({ where: { id } });
    if (!file) return { ok: false, message: "Документ не найден" };

    // Файл в хранилище живёт только ради этой записи: в отличие от картинки
    // из медиатеки, документ больше нигде не переиспользуется.
    if (isS3Configured()) {
      const key = keyFromPublicUrl(file.url);
      if (key) {
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
          );
        } catch (e) {
          // Не критично: запись всё равно убираем.
          console.error("removeProductFile S3 error", e);
        }
      }
    }

    await db.productFile.delete({ where: { id } });
    await logAction(admin.id, "delete", "ProductFile", id, {
      productId: file.productId,
      url: file.url,
    });
    revalidatePath(`/admin/products/${file.productId}`);
    revalidatePath("/catalog");
    return { ok: true };
  } catch (e) {
    console.error("removeProductFile error", e);
    return { ok: false, message: "Не удалось удалить" };
  }
}

const ReorderInput = z.object({
  productId: z.string().trim().min(1),
  ids: z.array(z.string().trim().min(1)).min(1).max(200),
});

export async function reorderProductFiles(
  input: z.input<typeof ReorderInput>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  const parsed = ReorderInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Некорректные данные" };
  const data = parsed.data;
  try {
    await db.$transaction(
      data.ids.map((id, idx) =>
        db.productFile.update({ where: { id }, data: { sort: idx } }),
      ),
    );
    await logAction(admin.id, "update", "ProductFile", null, {
      productId: data.productId,
      action: "reorder",
      count: data.ids.length,
    });
    revalidatePath(`/admin/products/${data.productId}`);
    revalidatePath("/catalog");
    return { ok: true };
  } catch (e) {
    console.error("reorderProductFiles error", e);
    return { ok: false, message: "Не удалось сохранить порядок" };
  }
}
