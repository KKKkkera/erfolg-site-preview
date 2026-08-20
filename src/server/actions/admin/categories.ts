"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

const CategoryInput = z.object({
  id: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Название обязательно").max(200),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  parentId: z.string().trim().optional().or(z.literal("")),
  sort: z.coerce.number().int().min(0).max(100000).default(0),
});

export type CategorySaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveCategory(
  input: z.input<typeof CategoryInput>,
): Promise<CategorySaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    return { ok: false, errors, message: "Проверьте поля формы" };
  }
  const data = parsed.data;
  const slug = slugify(data.slug || data.name);
  if (!slug) {
    return {
      ok: false,
      errors: { slug: "Некорректный slug" },
      message: "Невалидный slug",
    };
  }
  if (data.id && data.parentId === data.id) {
    return {
      ok: false,
      errors: { parentId: "Категория не может быть родителем самой себя" },
      message: "Некорректный родитель",
    };
  }

  const payload = {
    name: data.name,
    slug,
    description: data.description?.trim() ? data.description.trim() : null,
    parentId: data.parentId?.trim() ? data.parentId.trim() : null,
    sort: data.sort,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.category.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "Category", id);
    } else {
      const created = await db.category.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "Category", id);
    }
    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    return { ok: true, id };
  } catch (e) {
    console.error("saveCategory error", e);
    const msg =
      typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002"
        ? "Slug уже используется"
        : "Не удалось сохранить категорию";
    return { ok: false, message: msg };
  }
}

const ReorderInput = z.object({
  parentId: z.string().trim().optional().nullable(),
  ids: z.array(z.string().trim().min(1)).min(1).max(500),
});

export async function reorderCategories(
  input: z.input<typeof ReorderInput>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  const parsed = ReorderInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Некорректные данные" };
  const { ids, parentId } = parsed.data;
  try {
    await db.$transaction(
      ids.map((id, idx) =>
        db.category.update({
          where: { id },
          data: { sort: idx },
        }),
      ),
    );
    await logAction(admin.id, "update", "Category", null, {
      action: "reorder",
      parentId: parentId || null,
      count: ids.length,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    return { ok: true };
  } catch (e) {
    console.error("reorderCategories error", e);
    return { ok: false, message: "Не удалось сохранить порядок" };
  }
}

export async function deleteCategory(id: string) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false as const, message: "Unauthorized" };

  try {
    const productsCount = await db.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return {
        ok: false as const,
        message: `Нельзя удалить: в категории ${productsCount} товаров`,
      };
    }
    await db.category.delete({ where: { id } });
    await logAction(admin.id, "delete", "Category", id);
    revalidatePath("/admin/categories");
    return { ok: true as const };
  } catch (e) {
    console.error("deleteCategory error", e);
    return { ok: false as const, message: "Не удалось удалить категорию" };
  }
}
