import { db } from "@/lib/db";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

/* Загрузка товаров для блока [[block:products]].

   Блок повторяет сетку каталога внутри произвольной страницы: на странице
   региона это «что именно мы поставляем», ради чего посетитель и пришёл.
   Отбор — по категории (slug) либо по бренду, лимитом. Пустой отбор берёт
   товары, отмеченные для главной: это осмысленная витрина, а не случайные
   позиции.

   Запрос идёт через withTimeoutFallback, как и остальные витрины: страница
   региона рендерится статически и не должна падать из-за медленной базы. */

export type BlockProduct = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  regNumber: string | null;
  isUsed: boolean;
  brand: { name: string } | null;
  category: { slug: string; name: string } | null;
  images: { url: string; alt: string | null }[];
};

const MAX_LIMIT = 12;

export async function loadBlockProducts(params: {
  category?: string;
  brand?: string;
  limit?: string;
}): Promise<BlockProduct[]> {
  const category = params.category?.trim() || "";
  const brand = params.brand?.trim() || "";

  const parsedLimit = Number.parseInt(params.limit?.trim() || "", 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : 6;

  // Ни категории, ни бренда — витрина главной: осмысленный набор вместо
  // произвольных позиций из базы.
  const where = category
    ? { status: "ACTIVE" as const, category: { slug: category } }
    : brand
      ? { status: "ACTIVE" as const, brand: { slug: brand } }
      : { status: "ACTIVE" as const, showOnHome: true };

  try {
    const rows = await withTimeoutFallback(
      db.product.findMany({
        where,
        orderBy: [{ homeSort: "asc" }, { name: "asc" }],
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          model: true,
          regNumber: true,
          isUsed: true,
          brand: { select: { name: true } },
          category: { select: { slug: true, name: true } },
          images: {
            orderBy: { sort: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      }),
      { fallback: null, label: "block.products", timeoutMs: 800 },
    );

    return rows ?? [];
  } catch (e) {
    console.error("loadBlockProducts error", e);
    return [];
  }
}
