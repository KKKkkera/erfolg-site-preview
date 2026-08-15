import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatRu } from "@/lib/utils-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Товары — Эрфольг" };

const PAGE_SIZE = 25;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Опубликован",
  ARCHIVED: "Архив",
};

const KIND_LABEL: Record<string, string> = {
  EQUIPMENT: "Оборудование",
  CONSUMABLE: "Расходник",
  SPARE_PART: "Запчасть",
};

type SearchParams = {
  q?: string;
  status?: string;
  category?: string;
  page?: string;
};

export default async function AdminProductsPage(
  props: {
    searchParams?: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const category = (searchParams?.category ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  let total = 0;
  let products: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    status: string;
    kind: string;
    updatedAt: Date;
    category: { name: string } | null;
    brand: { name: string } | null;
    images: { url: string; alt: string | null }[];
  }> = [];
  let categories: { id: string; name: string }[] = [];
  let dbError = false;

  try {
    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (category) where.categoryId = category;

    [total, products, categories] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
          images: { take: 1, select: { url: true, alt: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: PAGE_SIZE,
        skip,
      }),
      db.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (e) {
    console.error("admin/products list error", e);
    dbError = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams();
    const merged: SearchParams = { q, status, category, page: String(page), ...overrides };
    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.category) params.set("category", merged.category);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const s = params.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Товары
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего: {total}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Создать товар
          </Link>
        </Button>
      </div>

      <form
        method="get"
        action="/admin/products"
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Поиск по названию, SKU, модели"
          className="h-9 w-full sm:w-[260px]"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Все статусы</option>
          <option value="DRAFT">Черновик</option>
          <option value="ACTIVE">Опубликован</option>
          <option value="ARCHIVED">Архив</option>
        </select>
        <select
          name="category"
          defaultValue={category}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Применить
        </Button>
        {(q || status || category) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/products">Сбросить</Link>
          </Button>
        )}
      </form>

      {dbError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          База данных недоступна — список не загружен.
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          Товары не найдены
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-[120px]">SKU</TableHead>
                <TableHead className="w-[160px]">Категория</TableHead>
                <TableHead className="w-[140px]">Бренд</TableHead>
                <TableHead className="w-[120px]">Тип</TableHead>
                <TableHead className="w-[120px]">Статус</TableHead>
                <TableHead className="w-[140px]">Обновлён</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const img = p.images[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url}
                          alt={img.alt || p.name}
                          className="h-10 w-10 rounded-sm border object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-sm border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        /{p.slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.sku || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.category?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.brand?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {KIND_LABEL[p.kind] ?? p.kind}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "ACTIVE"
                            ? "default"
                            : p.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRu(p.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildHref({ page: String(Math.max(1, page - 1)) })}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 2,
              )
              .map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href={buildHref({ page: String(p) })}
                    isActive={p === page}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
