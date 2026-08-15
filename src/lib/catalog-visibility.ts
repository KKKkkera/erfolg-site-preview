import { db } from "@/lib/db";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

/**
 * Слаги категорий, в которых есть хотя бы один опубликованный товар —
 * свой или в дочерней категории.
 *
 * Зачем: из 33 категорий каталога наполнена меньше половины, и ссылки на
 * пустые разделы стояли в футере, в чипах первого экрана и в блоке
 * «Каталог» на главной. Каждый такой клик заканчивался пустой страницей.
 * Навигация теперь строится по факту наполнения: раздел появляется сам,
 * как только в него добавлен активный товар.
 *
 * Прямой URL пустой категории продолжает работать и отдаёт 200 с пустым
 * состоянием — уже проиндексированные адреса не должны превращаться в 404.
 */
export async function getVisibleCategorySlugs(): Promise<Set<string>> {
  const empty = new Set<string>();

  const categories = await withTimeoutFallback(
    db.category.findMany({
      select: {
        id: true,
        slug: true,
        parentId: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    }),
    {
      fallback: null,
      label: "catalog.visibleCategories",
      timeoutMs: 1000,
    },
  );

  // База недоступна — не прячем ничего: пустая навигация хуже, чем
  // навигация с парой тупиков.
  if (!categories) return ALL_VISIBLE;

  const ownCount = new Map<string, number>();
  for (const c of categories) ownCount.set(c.id, c._count.products);

  const childrenTotal = new Map<string, number>();
  for (const c of categories) {
    if (!c.parentId) continue;
    childrenTotal.set(
      c.parentId,
      (childrenTotal.get(c.parentId) ?? 0) + (ownCount.get(c.id) ?? 0),
    );
  }

  for (const c of categories) {
    const total = (ownCount.get(c.id) ?? 0) + (childrenTotal.get(c.id) ?? 0);
    if (total > 0) empty.add(c.slug);
  }

  return empty;
}

/**
 * Часовой на случай недоступной базы: `has()` всегда истинно, поэтому
 * фильтрация вырождается в «показать всё».
 */
const ALL_VISIBLE: Set<string> = new Proxy(new Set<string>(), {
  get(target, prop, receiver) {
    if (prop === "has") return () => true;
    return Reflect.get(target, prop, receiver);
  },
});
