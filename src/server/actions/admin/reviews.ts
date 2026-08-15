"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

const StatusSchema = z.enum(["PENDING", "PUBLISHED", "REJECTED"]);

export type ReviewActionResult = { ok: true } | { ok: false; message: string };

/**
 * Модерация отзыва. Публикация проставляет publishedAt — по нему строится
 * сортировка на сайте; снятие с публикации дату не стирает, чтобы при
 * повторной публикации отзыв не прыгал в начало списка.
 */
export async function updateReviewStatus(
  id: string,
  status: z.infer<typeof StatusSchema>,
  moderatorNote?: string,
): Promise<ReviewActionResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const s = StatusSchema.safeParse(status);
  if (!s.success) return { ok: false, message: "Неверный статус" };

  try {
    const current = await db.review.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!current) return { ok: false, message: "Отзыв не найден" };

    await db.review.update({
      where: { id },
      data: {
        status: s.data,
        moderatorNote: moderatorNote?.trim() || undefined,
        publishedAt:
          s.data === "PUBLISHED" && !current.publishedAt
            ? new Date()
            : current.publishedAt,
      },
    });

    await logAction(admin.id, "status", "Review", id, { status: s.data });
    revalidatePath("/admin/reviews");
    revalidatePath(`/admin/reviews/${id}`);
    revalidatePath("/reviews");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("updateReviewStatus error", e);
    return { ok: false, message: "Не удалось сохранить статус" };
  }
}

export async function deleteReview(id: string): Promise<ReviewActionResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    await db.review.delete({ where: { id } });
    await logAction(admin.id, "delete", "Review", id, null);
    revalidatePath("/admin/reviews");
    revalidatePath("/reviews");
    return { ok: true };
  } catch (e) {
    console.error("deleteReview error", e);
    return { ok: false, message: "Не удалось удалить отзыв" };
  }
}
