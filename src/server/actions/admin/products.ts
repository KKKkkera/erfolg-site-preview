"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { pingIndexNow } from "@/lib/indexnow";
import { logAction } from "@/lib/audit";
import { hasRealRegNumber } from "@/lib/reg-number";
import { optionalSafeUrl } from "@/lib/safe-url";
import { requireAdmin } from "@/server/actions/admin/auth";

const ProductInput = z
  .object({
    id: z.string().optional().nullable(),
    name: z.string().trim().min(2, "Название обязательно").max(200),
    slug: z.string().trim().max(120).optional().or(z.literal("")),
    sku: z.string().trim().max(64).optional().or(z.literal("")),
    model: z.string().trim().max(120).optional().or(z.literal("")),
    brandId: z.string().trim().optional().or(z.literal("")),
    categoryId: z.string().trim().min(1, "Выберите категорию"),
    kind: z.enum(["EQUIPMENT", "CONSUMABLE", "SPARE_PART"]),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    shortDesc: z.string().trim().max(2000).optional().or(z.literal("")),
    fullDesc: z.string().trim().max(20000).optional().or(z.literal("")),
    regNumber: z.string().trim().max(120).optional().or(z.literal("")),
    regDate: z.string().trim().optional().or(z.literal("")),
    regUrl: optionalSafeUrl,
    seoTitle: z.string().trim().max(200).optional().or(z.literal("")),
    seoDesc: z.string().trim().max(400).optional().or(z.literal("")),
    sort: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .refine(
    (data) => {
      // Пустой номер у ACTIVE-товара допустим: блок РУ в карточке тогда не
      // рендерится, и сайт ничего не заявляет (решение владельца — витрина
      // работает до заполнения REG_NUMBERS, см. prisma/seeds/catalog-equipment.ts).
      // Запрещены именно заглушки: «На уточнении» и т.п. раньше уезжали в
      // публичную карточку как якобы номер удостоверения.
      if (data.status === "ACTIVE" && data.regNumber?.trim()) {
        return hasRealRegNumber(data.regNumber);
      }
      return true;
    },
    {
      path: ["regNumber"],
      message:
        "Это заглушка («На уточнении» и т.п.), а не номер РУ. Впишите реальный номер регистрационного удостоверения или оставьте поле пустым — тогда блок РУ в карточке просто не показывается",
    },
  );

export type ProductSaveResult =
  | { ok: true; id: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function saveProduct(
  input: z.input<typeof ProductInput>,
): Promise<ProductSaveResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = ProductInput.safeParse(input);
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

  const regDate = data.regDate ? new Date(data.regDate) : null;
  if (regDate && Number.isNaN(regDate.getTime())) {
    return {
      ok: false,
      errors: { regDate: "Некорректная дата" },
      message: "Некорректная дата",
    };
  }

  const payload = {
    name: data.name,
    slug,
    sku: data.sku?.trim() ? data.sku.trim() : null,
    model: data.model?.trim() ? data.model.trim() : null,
    brandId: data.brandId?.trim() ? data.brandId.trim() : null,
    categoryId: data.categoryId,
    kind: data.kind,
    status: data.status,
    shortDesc: data.shortDesc?.trim() ? data.shortDesc.trim() : null,
    fullDesc: data.fullDesc?.trim() ? data.fullDesc.trim() : null,
    regNumber: data.regNumber?.trim() ? data.regNumber.trim() : null,
    regDate,
    regUrl: data.regUrl?.trim() ? data.regUrl.trim() : null,
    seoTitle: data.seoTitle?.trim() ? data.seoTitle.trim() : null,
    seoDesc: data.seoDesc?.trim() ? data.seoDesc.trim() : null,
    sort: data.sort,
  };

  try {
    let id: string;
    if (data.id) {
      const updated = await db.product.update({
        where: { id: data.id },
        data: payload,
      });
      id = updated.id;
      await logAction(admin.id, "update", "Product", id);
    } else {
      const created = await db.product.create({ data: payload });
      id = created.id;
      await logAction(admin.id, "create", "Product", id);
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/catalog");

    // IndexNow ping (no-op без INDEXNOW_KEY). Fire-and-forget.
    if (data.status === "ACTIVE") {
      try {
        const cat = await db.category.findUnique({
          where: { id: data.categoryId },
          select: { slug: true },
        });
        if (cat?.slug) {
          void pingIndexNow([
            `/catalog/${cat.slug}/${slug}`,
            `/catalog/${cat.slug}`,
          ]);
        }
      } catch (err) {
        console.error("indexnow product url resolve error", err);
      }
    }

    return { ok: true, id };
  } catch (e) {
    console.error("saveProduct error", e);
    const msg =
      typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002"
        ? "Slug или SKU уже используется"
        : "Не удалось сохранить товар";
    return { ok: false, message: msg };
  }
}

export async function deleteProduct(id: string) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false as const, message: "Unauthorized" };
  try {
    // Получаем slug перед удалением для последующего IndexNow-ping.
    const before = await db.product
      .findUnique({
        where: { id },
        select: { slug: true, category: { select: { slug: true } } },
      })
      .catch(() => null);

    await db.product.delete({ where: { id } });
    await logAction(admin.id, "delete", "Product", id);
    revalidatePath("/admin/products");

    if (before?.slug && before.category?.slug) {
      void pingIndexNow([`/catalog/${before.category.slug}`]);
    }

    return { ok: true as const };
  } catch (e) {
    console.error("deleteProduct error", e);
    return { ok: false as const, message: "Не удалось удалить товар" };
  }
}
