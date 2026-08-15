import Link from "next/link";
import { Plus } from "lucide-react";

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
import { formatRu } from "@/lib/utils-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Блог — Эрфольг" };

export default async function AdminBlogPage() {
  let rows: Array<{
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
    publishedAt: Date | null;
    authorName: string | null;
    updatedAt: Date;
  }> = [];
  let dbError = false;
  try {
    rows = await db.blogPost.findMany({
      orderBy: [
        { isPublished: "desc" },
        { publishedAt: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        publishedAt: true,
        authorName: true,
        updatedAt: true,
      },
    });
  } catch (e) {
    console.error("admin/blog list error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Блог
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего статей: {rows.length}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" /> Создать статью
          </Link>
        </Button>
      </div>

      {dbError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          База данных недоступна.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          Статей пока нет. Нажмите «Создать статью».
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заголовок</TableHead>
                <TableHead className="w-[120px]">Статус</TableHead>
                <TableHead className="w-[180px]">Опубликована</TableHead>
                <TableHead className="w-[160px]">Обновлена</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      /blog/{p.slug}
                      {p.authorName ? ` · ${p.authorName}` : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isPublished ? "default" : "outline"}>
                      {p.isPublished ? "Опубликована" : "Черновик"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.publishedAt ? formatRu(p.publishedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRu(p.updatedAt)}
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
