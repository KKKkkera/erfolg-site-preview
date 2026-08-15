"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { storeRequestAttachments } from "@/lib/request-attachments";
import { sendQuoteNotification } from "@/lib/mailer";

/**
 * Обязателен email, а не телефон: на главной обещано, что первое предложение
 * приходит письмом без обязательного созвона. Пока обязательным был телефон,
 * выполнить это обещание было нечем.
 */
const QuoteSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Укажите имя").max(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .min(1, "Укажите почту — на неё придёт КП")
    .email("Проверьте адрес: похоже, в нём опечатка")
    .max(160),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  inn: z
    .string()
    .trim()
    .regex(/^(\d{10}|\d{12})?$/, "ИНН должен содержать 10 или 12 цифр")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие на обработку ПДн" }),
  }),
  source: z.string().optional(),
});

export type QuoteFormState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function submitQuoteRequest(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  if (FORMS_DISABLED) {
    return {
      ok: false,
      message:
        "Приём заявок временно приостановлен. Свяжитесь с нами по телефону +7 928 895 70 70 или email info@erfolgmt.ru.",
    };
  }

  // Honeypot: скрытое поле "website" должно быть пустым.
  // Боты заполняют все поля формы — люди это поле не видят.
  if (formData.get("website")) {
    return { ok: true, message: "Заявка принята. Менеджер свяжется в течение рабочего дня." };
  }

  const data = Object.fromEntries(formData.entries());
  const parsed = QuoteSchema.safeParse({
    ...data,
    consent: data.consent === "on" || data.consent === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[issue.path.join(".")] = issue.message;
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const attachments = await storeRequestAttachments(formData, "quote");
  if (!attachments.ok) {
    return {
      ok: false,
      errors: { attachments: attachments.error },
      message: "Проверьте вложения",
    };
  }

  const h = await headers();
  try {
    const created = await db.quoteRequest.create({
      data: {
        productId: parsed.data.productId || null,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email,
        organization: parsed.data.organization || null,
        inn: parsed.data.inn || null,
        message: parsed.data.message || null,
        attachments:
          attachments.files.length > 0 ? attachments.files : undefined,
        consent: true,
        source: parsed.data.source || null,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: h.get("user-agent") || null,
      },
      include: { product: { select: { name: true } } },
    });
    void sendQuoteNotification({
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      organization: created.organization,
      inn: created.inn,
      message: created.message,
      productName: created.product?.name ?? null,
      source: created.source,
    });
    return {
      ok: true,
      message:
        "Ответим в рабочий день. КП с ценой и сроком поставки пришлём на указанную почту за 1–2 рабочих дня.",
    };
  } catch (e) {
    console.error("quote-request error", e);
    return {
      ok: false,
      message:
        "Не удалось отправить заявку. Попробуйте позже или позвоните по указанному телефону.",
    };
  }
}
