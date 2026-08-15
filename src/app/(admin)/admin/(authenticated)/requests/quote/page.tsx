import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  RequestStatusFilter,
  RequestsTabs,
} from "@/components/admin/requests/requests-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/utils-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Заявки КП — Эрфольг" };

const STATUS_LABEL: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Завершена",
  REJECTED: "Отклонена",
};

export default async function QuoteRequestsPage(
  props: {
    searchParams?: Promise<{ status?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const status = (searchParams?.status ?? "").trim();
  let rows: Array<{
    id: string;
    name: string;
    phone: string | null;
    organization: string | null;
    status: string;
    createdAt: Date;
  }> = [];
  let dbError = false;
  try {
    rows = await db.quoteRequest.findMany({
      where: status
        ? {
            status: status as "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED",
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        phone: true,
        organization: true,
        status: true,
        createdAt: true,
      },
    });
  } catch (e) {
    console.error("quote requests fetch error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Заявки на КП
        </h1>
        <p className="text-sm text-muted-foreground">
          Запросы коммерческих предложений
        </p>
      </div>
      <RequestsTabs current="quote" />
      <RequestStatusFilter base="/admin/requests/quote" status={status} />
      {dbError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          База данных недоступна.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          Заявок нет
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead className="w-[140px]">Статус</TableHead>
                <TableHead className="w-[160px]">Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/admin/requests/quote/${r.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatPhone(r.phone)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.organization || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "NEW" ? "default" : "outline"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.createdAt.toLocaleString("ru-RU")}
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
