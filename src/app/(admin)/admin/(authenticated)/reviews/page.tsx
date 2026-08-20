import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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

export const metadata = { title: "Отзывы — Эрфольг" };

export default async function AdminReviewsPage() {
  let rows: Array<{
    id: string;
    authorName: string;
    organization: string | null;
    city: string | null;
    isPublished: boolean;
    sort: number;
    publishedAt: Date | null;
  }> = [];
  let dbError = false;

  try {
    rows = await db.review.findMany({
      orderBy: [{ sort: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        authorName: true,
        organization: true,
        city: true,
        isPublished: true,
        sort: true,
        publishedAt: true,
      },
    });
  } catch (e) {
    console.error("reviews fetch error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Отзывы</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Отзывы заводятся здесь: с сайта их оставить нельзя. Порядок задаётся
            полем «Порядок» — меньше значение, выше карточка.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/reviews/new">Добавить отзыв</Link>
        </Button>
      </div>

      {dbError ? (
        <p className="text-sm text-destructive">
          База данных недоступна — список не загружен.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Отзывов пока нет — нажмите «Добавить отзыв».
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Автор</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Порядок</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/admin/reviews/${r.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.authorName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.organization || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.city || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isPublished ? "secondary" : "outline"}>
                      {r.isPublished ? "На сайте" : "Скрыт"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.publishedAt
                      ? new Intl.DateTimeFormat("ru-RU", {
                          dateStyle: "short",
                        }).format(r.publishedAt)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.sort}
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
