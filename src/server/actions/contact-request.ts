"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { storeRequestAttachments } from "@/lib/request-attachments";
import { sendContactNotification } from "@/lib/mailer";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(120),
  email: z
    .string()
    .trim()
    .min(1, "Укажите почту — на неё придёт ответ")
    .email("Проверьте адрес: похоже, в нём опечатка")
    .max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(5, "Сообщение слишком короткое")
    .max(4000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие на обработку ПДн" }),
  }),
});

export type ContactFormState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function submitContactRequest(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  if (FORMS_DISABLED) {
    return {
      ok: false,
      message:
        "Приём заявок временно приостановлен. Свяжитесь с нами по телефону +7 928 895 70 70 или email info@erfolgmt.ru.",
    };
  }

  if (formData.get("website")) {
    return { ok: true, message: "Ответим в рабочий день на указанную почту." };
  }

  const data = Object.fromEntries(formData.entries());
  const parsed = ContactSchema.safeParse({
    ...data,
    consent: data.consent === "on" || data.consent === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[issue.path.join(".")] = issue.message;
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const attachments = await storeRequestAttachments(formData, "contact");
  if (!attachments.ok) {
    return {
      ok: false,
      errors: { attachments: attachments.error },
      message: "Проверьте вложения",
    };
  }

  const h = await headers();
  try {
    const created = await db.contactRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
        attachments:
          attachments.files.length > 0 ? attachments.files : undefined,
        consent: true,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: h.get("user-agent") || null,
      },
    });
    void sendContactNotification({
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      message: created.message,
    });
    return {
      ok: true,
      message: "Ответим в рабочий день на указанную почту.",
    };
  } catch (e) {
    console.error("contact-request error", e);
    return {
      ok: false,
      message:
        "Не удалось отправить сообщение. Попробуйте позже или позвоните по указанному телефону.",
    };
  }
}
