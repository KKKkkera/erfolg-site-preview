"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { logAction } from "@/lib/audit";
import { optionalSafeUrl } from "@/lib/safe-url";
import { requireAdmin } from "@/server/actions/admin/auth";

const BrandInput = z.object({
  id: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Название обязательно").max(200),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  website: optionalSafeUrl,
});

export type BrandSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveBrand(
  input: z.input<typeof BrandInput>,
): Promise<BrandSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = BrandInput.safeParse(input);
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

  const payload = {
    name: data.name,
    slug,
    country: data.country?.trim() ? data.country.trim() : null,
    website: data.website?.trim() ? data.website.trim() : null,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.brand.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "Brand", id);
    } else {
      const created = await db.brand.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "Brand", id);
    }
    revalidatePath("/admin/brands");
    revalidatePath("/catalog");
    return { ok: true, id };
  } catch (e) {
    console.error("saveBrand error", e);
    const msg =
      typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002"
        ? "Slug уже используется"
        : "Не удалось сохранить бренд";
    return { ok: false, message: msg };
  }
}

export async function deleteBrand(id: string) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false as const, message: "Unauthorized" };

  try {
    const productsCount = await db.product.count({ where: { brandId: id } });
    if (productsCount > 0) {
      return {
        ok: false as const,
        message: `Нельзя удалить: с брендом связано ${productsCount} товаров`,
      };
    }
    await db.brand.delete({ where: { id } });
    await logAction(admin.id, "delete", "Brand", id);
    revalidatePath("/admin/brands");
    return { ok: true as const };
  } catch (e) {
    console.error("deleteBrand error", e);
    return { ok: false as const, message: "Не удалось удалить бренд" };
  }
}
