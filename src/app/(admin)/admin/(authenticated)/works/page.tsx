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

export const metadata = { title: "Наши работы — Эрфольг" };

export default async function AdminWorksPage() {
  let rows: Array<{
    id: string;
    title: string;
    organization: string | null;
    city: string | null;
    isPublished: boolean;
    sort: number;
    completedAt: Date | null;
  }> = [];
  let dbError = false;

  try {
    rows = await db.work.findMany({
      orderBy: [{ sort: "asc" }, { completedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        title: true,
        organization: true,
        city: true,
        isPublished: true,
        sort: true,
        completedAt: true,
      },
    });
  } catch (e) {
    console.error("works fetch error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Наши работы</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Выполненные поставки и сервисные проекты. Выводятся на странице
            «Наши работы» и в блоке клиентов на главной.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/works/new">Добавить работу</Link>
        </Button>
      </div>

      {dbError ? (
        <p className="text-sm text-destructive">
          База данных недоступна — список не загружен.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Работ пока нет — нажмите «Добавить работу».
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Заказчик</TableHead>
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
                      href={`/admin/works/${r.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.title}
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
                      {r.isPublished ? "На сайте" : "Скрыта"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.completedAt
                      ? new Intl.DateTimeFormat("ru-RU", {
                          dateStyle: "short",
                        }).format(r.completedAt)
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
