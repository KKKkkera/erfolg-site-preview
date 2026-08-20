import Link from "next/link";
import { Plus } from "lucide-react";

import {
  BrandsSortable,
  type BrandRow,
} from "@/components/admin/brands/brands-sortable";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Бренды — Эрфольг" };

export default async function AdminBrandsPage() {
  let rows: BrandRow[] = [];
  let dbError = false;

  try {
    const brands = await db.brand.findMany({
      orderBy: [{ sort: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        website: true,
        logo: true,
        sort: true,
        _count: { select: { products: true } },
      },
    });
    rows = brands.map(({ _count, ...brand }) => ({
      ...brand,
      productsCount: _count.products,
    }));
  } catch (e) {
    console.error("admin/brands list error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Бренды
          </h1>
          <p className="text-sm text-muted-foreground">Всего: {rows.length}</p>
        </div>
        <Button asChild>
          <Link href="/admin/brands/new">
            <Plus className="mr-2 h-4 w-4" /> Создать бренд
          </Link>
        </Button>
      </div>

      {dbError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          База данных недоступна.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          Брендов пока нет.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Перетаскивайте строки за значок слева. В этом же порядке бренды
            прокручиваются на главной странице.
          </p>
          <BrandsSortable rows={rows} />
        </div>
      )}
    </div>
  );
}
