import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Download } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Журнал аудита — Эрфольг" };

const ACTIONS = ["all", "create", "update", "delete", "login"] as const;
const ENTITIES = [
  "all",
  "Product",
  "Category",
  "Brand",
  "Page",
  "Setting",
  "AdminUser",
  "MediaAsset",
  "ProductImage",
  "QuoteRequest",
  "ServiceRequest",
  "ContactRequest",
] as const;

const PAGE_SIZE = 50;

function buildHref(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "" || v === "all") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

export default async function AdminAuditPage(
  props: {
    searchParams?: Promise<{ action?: string; entity?: string; adminId?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/admin/login");
  if (session.user.role !== "OWNER") {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/10 p-6 text-sm">
        Раздел доступен только владельцу (OWNER).
      </div>
    );
  }

  const action = (searchParams?.action || "all").toLowerCase();
  const entity = searchParams?.entity || "all";
  const adminId = searchParams?.adminId || "";
  const page = Math.max(1, Number(searchParams?.page || 1));
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.AdminAuditLogWhereInput = {};
  if (ACTIONS.includes(action as (typeof ACTIONS)[number]) && action !== "all") {
    where.action = action;
  }
  if (
    ENTITIES.includes(entity as (typeof ENTITIES)[number]) &&
    entity !== "all"
  ) {
    where.entity = entity;
  }
  if (adminId) where.adminId = adminId;

  let logs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: Date;
    admin: { email: string; name: string } | null;
  }> = [];
  let total = 0;
  let admins: Array<{ id: string; email: string; name: string }> = [];
  let dbError = false;
  try {
    [logs, total, admins] = await Promise.all([
      db.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip,
        include: { admin: { select: { email: true, name: true } } },
      }),
      db.adminAuditLog.count({ where }),
      db.adminUser.findMany({
        select: { id: true, email: true, name: true },
        orderBy: { email: "asc" },
      }),
    ]);
  } catch (e) {
    console.error("audit log fetch error", e);
    dbError = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const csvHref = buildHref({
    action: action !== "all" ? action : undefined,
    entity: entity !== "all" ? entity : undefined,
    adminId: adminId || undefined,
  }).replace("/admin/audit", "/api/admin/audit/export");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Журнал действий
          </h1>
          <p className="text-sm text-muted-foreground">
            Записей: {total}. Страница {page} из {totalPages}.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={csvHref}>
            <Download className="mr-2 h-4 w-4" /> Экспорт CSV
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры</CardTitle>
          <CardDescription>OWNER-only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-4" method="GET">
            <div>
              <label className="text-xs text-muted-foreground">Действие</label>
              <select
                name="action"
                defaultValue={action}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a === "all" ? "Все" : a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Сущность</label>
              <select
                name="entity"
                defaultValue={entity}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ENTITIES.map((e) => (
                  <option key={e} value={e}>
                    {e === "all" ? "Все" : e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Админ</label>
              <select
                name="adminId"
                defaultValue={adminId}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Все</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Применить</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/admin/audit">Сбросить</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Записи</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {dbError ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              База данных недоступна.
            </div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Записей нет.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Дата</TableHead>
                  <TableHead className="w-[180px]">Кто</TableHead>
                  <TableHead className="w-[120px]">Действие</TableHead>
                  <TableHead className="w-[160px]">Сущность</TableHead>
                  <TableHead>ID объекта</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.createdAt.toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.admin?.email || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{l.action}</TableCell>
                    <TableCell className="text-sm">{l.entity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.entityId || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
          >
            <Link
              href={buildHref({
                action: action !== "all" ? action : undefined,
                entity: entity !== "all" ? entity : undefined,
                adminId: adminId || undefined,
                page: page - 1,
              })}
            >
              ← Назад
            </Link>
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
          >
            <Link
              href={buildHref({
                action: action !== "all" ? action : undefined,
                entity: entity !== "all" ? entity : undefined,
                adminId: adminId || undefined,
                page: page + 1,
              })}
            >
              Вперёд →
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
