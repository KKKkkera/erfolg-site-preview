"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { storeRequestAttachments } from "@/lib/request-attachments";
import { sendServiceNotification } from "@/lib/mailer";

const ServiceSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .min(1, "Укажите почту — на неё придёт ответ инженера")
    .email("Проверьте адрес: похоже, в нём опечатка")
    .max(160),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  equipmentName: z
    .string()
    .trim()
    .min(2, "Укажите название оборудования")
    .max(200),
  manufacturer: z.string().trim().max(120).optional().or(z.literal("")),
  modelName: z.string().trim().max(120).optional().or(z.literal("")),
  serial: z.string().trim().max(120).optional().or(z.literal("")),
  problem: z
    .string()
    .trim()
    .min(5, "Опишите неисправность подробнее")
    .max(4000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие на обработку ПДн" }),
  }),
});

export type ServiceFormState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function submitServiceRequest(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  if (FORMS_DISABLED) {
    return {
      ok: false,
      message:
        "Приём заявок временно приостановлен. Свяжитесь с нами по телефону +7 928 895 70 70 или email info@erfolgmt.ru.",
    };
  }

  if (formData.get("website")) {
    return {
      ok: true,
      message:
        "Инженер сервисной службы свяжется в рабочий день, уточнит детали и согласует выезд.",
    };
  }

  const data = Object.fromEntries(formData.entries());
  const parsed = ServiceSchema.safeParse({
    ...data,
    consent: data.consent === "on" || data.consent === "true",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[issue.path.join(".")] = issue.message;
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const attachments = await storeRequestAttachments(formData, "service");
  if (!attachments.ok) {
    return {
      ok: false,
      errors: { attachments: attachments.error },
      message: "Проверьте вложения",
    };
  }

  const h = await headers();
  try {
    const created = await db.serviceRequest.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email,
        organization: parsed.data.organization || null,
        equipmentName: parsed.data.equipmentName,
        manufacturer: parsed.data.manufacturer || null,
        modelName: parsed.data.modelName || null,
        serial: parsed.data.serial || null,
        problem: parsed.data.problem,
        attachments:
          attachments.files.length > 0 ? attachments.files : undefined,
        consent: true,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: h.get("user-agent") || null,
      },
    });
    void sendServiceNotification({
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      organization: created.organization,
      equipmentName: created.equipmentName,
      manufacturer: created.manufacturer,
      modelName: created.modelName,
      serial: created.serial,
      problem: created.problem,
    });
    return {
      ok: true,
      message:
        "Инженер сервисной службы свяжется в рабочий день, уточнит детали и согласует выезд.",
    };
  } catch (e) {
    console.error("service-request error", e);
    return {
      ok: false,
      message:
        "Не удалось отправить заявку. Попробуйте позже или позвоните по указанному телефону.",
    };
  }
}
