"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { invalidateRegionCache, REGIONS_BY_SLUG } from "@/lib/region-pages";
import { requireAdmin } from "@/server/actions/admin/auth";

const RegionInput = z.object({
  slug: z.string().trim().min(1, "Регион обязателен").max(120),
  heading: z.string().trim().max(200).optional().or(z.literal("")),
  intro: z.string().trim().max(2000).optional().or(z.literal("")),
  content: z.string().trim().max(80000).default(""),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDesc: z.string().trim().max(400).optional().or(z.literal("")),
  isPublished: z.coerce.boolean().default(true),
});

export type RegionSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveRegionPage(
  input: z.input<typeof RegionInput>,
): Promise<RegionSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = RegionInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля формы" };
  }
  const data = parsed.data;

  // Слаг не свободный: регион обязан существовать в списке из кода, иначе
  // запись будет висеть в базе без страницы на сайте.
  if (!REGIONS_BY_SLUG.has(data.slug)) {
    return {
      ok: false,
      errors: { slug: "Неизвестный регион" },
      message: "Такого региона нет в списке",
    };
  }

  const payload = {
    heading: data.heading?.trim() ? data.heading.trim() : null,
    intro: data.intro?.trim() ? data.intro.trim() : null,
    content: data.content,
    seoTitle: data.seoTitle?.trim() ? data.seoTitle.trim() : null,
    seoDesc: data.seoDesc?.trim() ? data.seoDesc.trim() : null,
    isPublished: data.isPublished,
  };

  try {
    const saved = await db.regionPage.upsert({
      where: { slug: data.slug },
      update: payload,
      create: { slug: data.slug, ...payload },
    });
    await logAction(admin.id, "update", "RegionPage", saved.id);

    // Сброс кэша строго до revalidatePath — иначе маршрут пересоберётся на
    // старом объекте из памяти и правка «не доедет» до сайта.
    invalidateRegionCache(data.slug);
    revalidatePath("/admin/regions");
    revalidatePath(`/regions/${data.slug}`);

    return { ok: true, id: saved.id };
  } catch (e) {
    console.error("saveRegionPage error", e);
    return { ok: false, message: "Не удалось сохранить страницу региона" };
  }
}

/** Сброс к дефолту: удаляем запись, регион снова показывает общий текст. */
export async function resetRegionPage(slug: string) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false as const, message: "Unauthorized" };
  try {
    const row = await db.regionPage.findUnique({ where: { slug } });
    if (row) {
      await db.regionPage.delete({ where: { slug } });
      await logAction(admin.id, "delete", "RegionPage", row.id);
    }
    invalidateRegionCache(slug);
    revalidatePath("/admin/regions");
    revalidatePath(`/regions/${slug}`);
    return { ok: true as const };
  } catch (e) {
    console.error("resetRegionPage error", e);
    return { ok: false as const, message: "Не удалось сбросить страницу" };
  }
}
