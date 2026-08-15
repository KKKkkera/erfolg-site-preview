import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Бренды — Эрфольг" };

export default async function AdminBrandsPage() {
  let rows: Array<{
    id: string;
    name: string;
    slug: string;
    country: string | null;
    website: string | null;
    _count: { products: number };
  }> = [];
  let dbError = false;
  try {
    rows = await db.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
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
        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="w-[160px]">Страна</TableHead>
                <TableHead className="w-[200px]">Сайт</TableHead>
                <TableHead className="w-[110px] text-center">Товаров</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link
                      href={`/admin/brands/${b.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{b.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.country || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {b.website ? (
                      <a
                        href={b.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {b.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {b._count.products}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
