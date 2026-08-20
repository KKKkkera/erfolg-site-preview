"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

/**
 * Отзывы ведёт администратор: с сайта их оставить нельзя, поэтому здесь
 * обычный CRUD без модерации. Согласие автора на публикацию собирается
 * вне сайта — в карточке хранится только то, что показывается публично.
 */
const ReviewInput = z.object({
  id: z.string().optional().nullable(),
  authorName: z.string().trim().min(2, "Укажите, как подписать отзыв").max(120),
  position: z.string().trim().max(160).optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  text: z.string().trim().min(20, "Текст слишком короткий").max(4000),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) => value === "" || /^(?:\/(?:images|media|uploads)\/|https:\/\/)/.test(value),
      "Некорректный адрес скана",
    )
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean(),
  sort: z.coerce.number().int().min(0).max(100000),
  publishedAt: z.string().trim().optional().or(z.literal("")),
});

export type ReviewSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveReview(
  input: z.input<typeof ReviewInput>,
): Promise<ReviewSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = ReviewInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const data = parsed.data;
  const date = data.publishedAt ? new Date(data.publishedAt) : null;
  if (date && Number.isNaN(date.getTime())) {
    return {
      ok: false,
      errors: { publishedAt: "Некорректная дата" },
      message: "Проверьте поля формы",
    };
  }

  const payload = {
    authorName: data.authorName,
    position: data.position?.trim() ? data.position.trim() : null,
    organization: data.organization?.trim() ? data.organization.trim() : null,
    city: data.city?.trim() ? data.city.trim() : null,
    text: data.text,
    rating: data.rating ?? null,
    imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
    isPublished: data.isPublished,
    sort: data.sort,
    publishedAt: date,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.review.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "Review", id);
    } else {
      const created = await db.review.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "Review", id);
    }

    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${id}`);
    revalidatePath("/reviews");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    console.error("saveReview error", e);
    return { ok: false, message: "Не удалось сохранить отзыв" };
  }
}

export async function deleteReview(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    await db.review.delete({ where: { id } });
    await logAction(admin.id, "delete", "Review", id, null);
    revalidatePath("/admin/reviews");
    revalidatePath("/reviews");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("deleteReview error", e);
    return { ok: false, message: "Не удалось удалить отзыв" };
  }
}
