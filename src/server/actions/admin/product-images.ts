"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { revalidateCatalog } from "@/lib/catalog-revalidation";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

const AddInput = z.object({
  productId: z.string().trim().min(1),
  url: z.string().trim().min(1).max(2000),
  alt: z.string().trim().max(500).optional().nullable(),
});

export async function addProductImage(
  input: z.input<typeof AddInput>,
): Promise<
  | { ok: true; id: string; url: string; alt: string | null; sort: number }
  | { ok: false; message: string }
> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const parsed = AddInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Некорректные данные" };
  const data = parsed.data;
  try {
    const max = await db.productImage.findFirst({
      where: { productId: data.productId },
      orderBy: { sort: "desc" },
      select: { sort: true },
    });
    const created = await db.productImage.create({
      data: {
        productId: data.productId,
        url: data.url,
        alt: data.alt?.trim() ? data.alt.trim() : null,
        sort: (max?.sort ?? -1) + 1,
      },
    });
    await logAction(admin.id, "create", "ProductImage", created.id, {
      productId: data.productId,
    });
    revalidatePath(`/admin/products/${data.productId}`);
    revalidateCatalog();
    revalidatePath("/");
    return {
      ok: true,
      id: created.id,
      url: created.url,
      alt: created.alt,
      sort: created.sort,
    };
  } catch (e) {
    console.error("addProductImage error", e);
    return { ok: false, message: "Не удалось добавить изображение" };
  }
}

export async function removeProductImage(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  try {
    const img = await db.productImage.findUnique({ where: { id } });
    if (!img) return { ok: false, message: "Изображение не найдено" };
    await db.productImage.delete({ where: { id } });
    await logAction(admin.id, "delete", "ProductImage", id, {
      productId: img.productId,
    });
    revalidatePath(`/admin/products/${img.productId}`);
    revalidateCatalog();
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("removeProductImage error", e);
    return { ok: false, message: "Не удалось удалить" };
  }
}

const ReorderInput = z.object({
  productId: z.string().trim().min(1),
  ids: z.array(z.string().trim().min(1)).min(1).max(200),
});

export async function reorderProductImages(
  input: z.input<typeof ReorderInput>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };
  const parsed = ReorderInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Некорректные данные" };
  const data = parsed.data;
  try {
    await db.$transaction(
      data.ids.map((id, idx) =>
        db.productImage.update({
          where: { id },
          data: { sort: idx },
        }),
      ),
    );
    await logAction(admin.id, "update", "ProductImage", null, {
      productId: data.productId,
      action: "reorder",
      count: data.ids.length,
    });
    revalidatePath(`/admin/products/${data.productId}`);
    revalidateCatalog();
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("reorderProductImages error", e);
    return { ok: false, message: "Не удалось сохранить порядок" };
  }
}
