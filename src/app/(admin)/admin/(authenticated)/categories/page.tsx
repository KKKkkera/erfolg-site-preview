import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CategoriesSortable,
  type CategoryRow,
} from "@/components/admin/categories/categories-sortable";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Категории — Эрфольг" };

export default async function AdminCategoriesPage() {
  let rows: CategoryRow[] = [];
  let total = 0;
  let dbError = false;
  try {
    const list = await db.category.findMany({
      orderBy: [{ sort: "asc" }, { name: "asc" }],
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true, children: true } },
      },
    });
    total = list.length;
    rows = list.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      sort: c.sort,
      parentName: c.parent?.name ?? null,
      productsCount: c._count.products,
      childrenCount: c._count.children,
    }));
  } catch (e) {
    console.error("admin/categories list error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Категории
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего: {total}. Перетаскивайте элементы для сортировки.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" /> Создать категорию
          </Link>
        </Button>
      </div>

      {dbError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          База данных недоступна.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          Категорий пока нет. Создайте первую.
        </div>
      ) : (
        <CategoriesSortable rows={rows} />
      )}
    </div>
  );
}
