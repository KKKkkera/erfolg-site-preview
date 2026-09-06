"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { after } from "next/server";

import { db } from "@/lib/db";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { sendQuoteNotification } from "@/lib/mailer";
import { allowRequest, requestIp } from "@/lib/rate-limit";

/**
 * Единая форма сайта: имя, телефон, комментарий. Обязателен телефон — почту
 * форма больше не спрашивает, менеджер перезванивает. Все заявки (КП, сервис,
 * вопрос с контактов) складываются в одну таблицу quote_requests, разделяет их
 * поле `source`.
 */
const LeadSchema = z.object({
  productId: z.string().max(100).optional().nullable(),
  name: z
    .string()
    .trim()
    .min(2, "Укажите имя")
    .max(50, "Имя — не больше 50 символов")
    .regex(/^[\p{L}\s'’-]+$/u, "В имени допустимы только буквы"),
  phone: z
    .string()
    .trim()
    .min(1, "Укажите телефон")
    .max(20)
    .refine(
      (v) => v.replace(/\D/g, "").length === 11,
      "Проверьте номер: нужно 10 цифр после +7",
    ),
  // Почта необязательна: телефон — основной канал, почта нужна, когда
  // клиент просит прислать КП письмом.
  email: z
    .string()
    .trim()
    .max(160)
    .email("Проверьте адрес: похоже, в нём опечатка")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .max(500, "Комментарий — не больше 500 символов")
    .optional()
    .or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие на обработку персональных данных" }),
  }),
  source: z.string().max(200).optional(),
});

export type LeadFormState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function submitLeadRequest(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
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
  const parsed = LeadSchema.safeParse({
    ...data,
    consent: data.consent === "on" || data.consent === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[issue.path.join(".")] = issue.message;
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const h = await headers();
  try {
    const ip = requestIp(h);
    const phone = parsed.data.phone.replace(/\D/g, "");
    if ((ip && !(await allowRequest("lead-ip", ip, 10, 15 * 60_000))) ||
        !(await allowRequest("lead-phone", phone, 3, 15 * 60_000))) {
      return { ok: false, message: "Слишком много заявок. Попробуйте через 15 минут или свяжитесь с нами по телефону." };
    }
    if (parsed.data.productId && !(await db.product.findFirst({ where: { id: parsed.data.productId, status: "ACTIVE" }, select: { id: true } }))) {
      return { ok: false, message: "Товар больше недоступен. Обновите страницу и отправьте запрос снова." };
    }
    const created = await db.quoteRequest.create({
      data: {
        productId: parsed.data.productId || null,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message || null,
        consent: true,
        source: parsed.data.source || null,
        ip,
        userAgent: h.get("user-agent")?.slice(0, 1000) || null,
      },
      include: { product: { select: { name: true } } },
    });
    after(async () => { await sendQuoteNotification({
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      message: created.message,
      productName: created.product?.name ?? null,
      source: created.source,
    }); });
  } catch (e) {
    console.error("lead request error", e);
    return {
      ok: false,
      message:
        "Не удалось отправить заявку. Позвоните: +7 928 895 70 70 или напишите info@erfolgmt.ru.",
    };
  }

  return {
    ok: true,
    message: "Заявка принята. Менеджер свяжется с вами в ближайшее время.",
  };
}
