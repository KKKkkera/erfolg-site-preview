import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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

const STATUS_LABEL: Record<string, string> = {
  PENDING: "На модерации",
  PUBLISHED: "Опубликован",
  REJECTED: "Отклонён",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PENDING: "default",
  PUBLISHED: "secondary",
  REJECTED: "outline",
};

const FILTERS = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "На модерации" },
  { value: "PUBLISHED", label: "Опубликованные" },
  { value: "REJECTED", label: "Отклонённые" },
];

export default async function AdminReviewsPage(props: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status = (searchParams?.status ?? "").trim();

  let rows: Array<{
    id: string;
    authorName: string;
    organization: string | null;
    city: string | null;
    status: string;
    createdAt: Date;
  }> = [];
  let dbError = false;

  try {
    rows = await db.review.findMany({
      where: status
        ? { status: status as "PENDING" | "PUBLISHED" | "REJECTED" }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        authorName: true,
        organization: true,
        city: true,
        status: true,
        createdAt: true,
      },
    });
  } catch (e) {
    console.error("reviews fetch error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Отзывы</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Отзыв попадает на сайт только после публикации здесь. Опубликованный
          отзыв можно снять в любой момент — например, если автор отозвал
          согласие.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value || "all"}
            href={f.value ? `/admin/reviews?status=${f.value}` : "/admin/reviews"}
            className={
              status === f.value
                ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {dbError ? (
        <p className="text-sm text-destructive">
          База данных недоступна — список не загружен.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Отзывов пока нет.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Автор</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Получен</TableHead>
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
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(r.createdAt)}
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
