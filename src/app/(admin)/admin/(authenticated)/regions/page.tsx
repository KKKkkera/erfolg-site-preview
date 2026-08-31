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
import { listRegionsWithStatus } from "@/lib/region-pages";
import { formatRu } from "@/lib/utils-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Регионы — Эрфольг" };

export default async function AdminRegionsPage() {
  const regions = await listRegionsWithStatus();
  const filled = regions.filter((r) => r.id !== null).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Регионы
        </h1>
        <p className="text-sm text-muted-foreground">
          Всего: {regions.length} · заполнено: {filled}
        </p>
      </div>

      <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
        Список регионов задан кодом карты и не редактируется. Здесь меняется
        текст страницы региона: без своей записи регион показывает общий текст
        по умолчанию.
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Регион</TableHead>
              <TableHead className="w-[110px]">Код</TableHead>
              <TableHead className="w-[150px]">Статус</TableHead>
              <TableHead className="w-[160px]">Обновлена</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((region) => (
              <TableRow key={region.slug}>
                <TableCell>
                  <Link
                    href={`/admin/regions/${region.slug}`}
                    className="font-medium hover:underline"
                  >
                    {region.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {region.code}
                </TableCell>
                <TableCell>
                  {region.id === null ? (
                    <Badge variant="outline">По умолчанию</Badge>
                  ) : region.isPublished ? (
                    <Badge>Заполнен</Badge>
                  ) : (
                    <Badge variant="secondary">Черновик</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {region.updatedAt ? formatRu(region.updatedAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
