"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { invalidateCmsCache } from "@/lib/cms";
import { slugify } from "@/lib/slugify";
import { pingIndexNow } from "@/lib/indexnow";
import { logAction } from "@/lib/audit";
import { hasPublicCmsRoute } from "@/lib/public-routes";
import { requireAdmin } from "@/server/actions/admin/auth";

const PageInput = z.object({
  id: z.string().optional().nullable(),
  slug: z.string().trim().min(1, "Slug обязателен").max(120),
  title: z.string().trim().min(2, "Заголовок обязателен").max(200),
  content: z.string().trim().max(80000).default(""),
  seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
  seoDesc: z.string().trim().max(400).optional().or(z.literal("")),
  isPublished: z.coerce.boolean().default(true),
  sort: z.coerce.number().int().min(0).max(100000).default(0),
});

export type PageSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function savePage(
  input: z.input<typeof PageInput>,
): Promise<PageSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = PageInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля формы" };
  }
  const data = parsed.data;
  const slug = slugify(data.slug);
  if (!slug) {
    return {
      ok: false,
      errors: { slug: "Некорректный slug" },
      message: "Невалидный slug",
    };
  }

  const payload = {
    slug,
    title: data.title,
    content: data.content,
    seoTitle: data.seoTitle?.trim() ? data.seoTitle.trim() : null,
    seoDesc: data.seoDesc?.trim() ? data.seoDesc.trim() : null,
    isPublished: data.isPublished,
    sort: data.sort,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.page.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "Page", id);
    } else {
      const created = await db.page.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "Page", id);
    }
    // Сброс кэша строго перед revalidatePath: иначе маршрут пересоберётся
    // на старом объекте из памяти getCmsPage и правка «не доедет» до сайта.
    invalidateCmsCache(slug);
    revalidatePath("/admin/pages");

    // Ревалидация и IndexNow-пинг — только для slug'ов с реальным маршрутом.
    // Для остальных страница по адресу /<slug> не существует (404), и пинговать
    // поисковики таким URL нельзя.
    if (hasPublicCmsRoute(slug)) {
      revalidatePath(`/${slug}`);
      if (data.isPublished) {
        void pingIndexNow([`/${slug}`]);
      }
    }

    return { ok: true, id };
  } catch (e) {
    console.error("savePage error", e);
    const msg =
      typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002"
        ? "Slug уже используется"
        : "Не удалось сохранить страницу";
    return { ok: false, message: msg };
  }
}

export async function deletePage(id: string) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false as const, message: "Unauthorized" };
  try {
    const page = await db.page.findUnique({ where: { id } });
    await db.page.delete({ where: { id } });
    await logAction(admin.id, "delete", "Page", id);
    if (page?.slug) invalidateCmsCache(page.slug);
    revalidatePath("/admin/pages");
    if (page?.slug) revalidatePath(`/${page.slug}`);
    return { ok: true as const };
  } catch (e) {
    console.error("deletePage error", e);
    return { ok: false as const, message: "Не удалось удалить страницу" };
  }
}
