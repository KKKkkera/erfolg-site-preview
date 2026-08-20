"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

/** Выполненные работы ведёт администратор: с сайта их не добавляют. */
const WorkInput = z.object({
  id: z.string().optional().nullable(),
  title: z.string().trim().min(3, "Укажите название работы").max(200),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")),
  summary: z.string().trim().min(20, "Описание слишком короткое").max(4000),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) =>
        value === "" || /^(?:\/(?:images|media|uploads)\/|https:\/\/)/.test(value),
      "Некорректный адрес изображения",
    )
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean(),
  sort: z.coerce.number().int().min(0).max(100000),
  completedAt: z.string().trim().optional().or(z.literal("")),
});

export type WorkSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveWork(
  input: z.input<typeof WorkInput>,
): Promise<WorkSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = WorkInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля формы" };
  }

  const data = parsed.data;
  const date = data.completedAt ? new Date(data.completedAt) : null;
  if (date && Number.isNaN(date.getTime())) {
    return {
      ok: false,
      errors: { completedAt: "Некорректная дата" },
      message: "Проверьте поля формы",
    };
  }

  const payload = {
    title: data.title,
    organization: data.organization?.trim() ? data.organization.trim() : null,
    city: data.city?.trim() ? data.city.trim() : null,
    category: data.category?.trim() ? data.category.trim() : null,
    summary: data.summary,
    imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
    isPublished: data.isPublished,
    sort: data.sort,
    completedAt: date,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.work.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "Work", id);
    } else {
      const created = await db.work.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "Work", id);
    }

    revalidatePath("/admin/works");
    revalidatePath(`/admin/works/${id}`);
    revalidatePath("/works");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    console.error("saveWork error", e);
    return { ok: false, message: "Не удалось сохранить работу" };
  }
}

export async function deleteWork(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    await db.work.delete({ where: { id } });
    await logAction(admin.id, "delete", "Work", id, null);
    revalidatePath("/admin/works");
    revalidatePath("/works");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("deleteWork error", e);
    return { ok: false, message: "Не удалось удалить работу" };
  }
}
