"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { storeRequestAttachments } from "@/lib/request-attachments";

/**
 * Отзыв уходит на модерацию, а не в публикацию: брендбук запрещает
 * непроверяемую социальную доказательность, поэтому «сначала показать,
 * потом проверить» здесь не годится.
 */
const ReviewSchema = z.object({
  authorName: z
    .string()
    .trim()
    .min(2, "Укажите, как подписать отзыв")
    .max(120),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  text: z
    .string()
    .trim()
    .min(30, "Напишите чуть подробнее — хотя бы пару предложений")
    .max(4000),
  contactEmail: z
    .string()
    .trim()
    .email("Проверьте адрес: похоже, в нём опечатка")
    .max(160)
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  showOrganization: z.boolean().optional(),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Без согласия на публикацию отзыв опубликовать нельзя",
    }),
  }),
});

export type ReviewFormState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  if (FORMS_DISABLED) {
    return {
      ok: false,
      message:
        "Приём отзывов временно приостановлен. Напишите нам на info@erfolgmt.ru.",
    };
  }

  if (formData.get("website")) {
    return { ok: true, message: "Опубликуем после проверки." };
  }

  const data = Object.fromEntries(formData.entries());
  const parsed = ReviewSchema.safeParse({
    ...data,
    showOrganization:
      data.showOrganization === "on" || data.showOrganization === "true",
    consent: data.consent === "on" || data.consent === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[issue.path.join(".")] = issue.message;
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const attachments = await storeRequestAttachments(formData, "reviews", {
    media: true,
  });
  if (!attachments.ok) {
    return {
      ok: false,
      errors: { attachments: attachments.error },
      message: "Проверьте вложения",
    };
  }

  const h = await headers();
  try {
    await db.review.create({
      data: {
        authorName: parsed.data.authorName,
        city: parsed.data.city || null,
        organization: parsed.data.organization || null,
        showOrganization: parsed.data.showOrganization ?? false,
        text: parsed.data.text,
        attachments:
          attachments.files.length > 0 ? attachments.files : undefined,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
        consent: true,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: h.get("user-agent") || null,
      },
    });
    return {
      ok: true,
      message:
        "Опубликуем после проверки. Если потребуется уточнение, свяжемся по контактам, которые вы оставили.",
    };
  } catch (e) {
    console.error("review submit error", e);
    return {
      ok: false,
      message:
        "Не удалось отправить отзыв. Попробуйте позже или напишите на info@erfolgmt.ru.",
    };
  }
}
