import Link from "next/link";
import {
  Package,
  FolderTree,
  Tag,
  Inbox,
  AlertTriangle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export const metadata = {
  title: "Дашборд — Эрфольг",
};

type Counters = {
  productsTotal: number;
  productsActive: number;
  productsDraft: number;
  categoriesTotal: number;
  brandsTotal: number;
  quotesTotal: number;
  quotesNew: number;
  serviceTotal: number;
  serviceNew: number;
  contactTotal: number;
  contactNew: number;
  dbAvailable: boolean;
};

async function getCounters(): Promise<Counters> {
  const fallback: Counters = {
    productsTotal: 0,
    productsActive: 0,
    productsDraft: 0,
    categoriesTotal: 0,
    brandsTotal: 0,
    quotesTotal: 0,
    quotesNew: 0,
    serviceTotal: 0,
    serviceNew: 0,
    contactTotal: 0,
    contactNew: 0,
    dbAvailable: false,
  };

  try {
    const [
      productsTotal,
      productsActive,
      productsDraft,
      categoriesTotal,
      brandsTotal,
      quotesTotal,
      quotesNew,
      serviceTotal,
      serviceNew,
      contactTotal,
      contactNew,
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { status: "ACTIVE" } }),
      db.product.count({ where: { status: "DRAFT" } }),
      db.category.count(),
      db.brand.count(),
      db.quoteRequest.count(),
      db.quoteRequest.count({ where: { status: "NEW" } }),
      db.serviceRequest.count(),
      db.serviceRequest.count({ where: { status: "NEW" } }),
      db.contactRequest.count(),
      db.contactRequest.count({ where: { status: "NEW" } }),
    ]);

    return {
      productsTotal,
      productsActive,
      productsDraft,
      categoriesTotal,
      brandsTotal,
      quotesTotal,
      quotesNew,
      serviceTotal,
      serviceNew,
      contactTotal,
      contactNew,
      dbAvailable: true,
    };
  } catch (e) {
    console.error("dashboard counters error", e);
    return fallback;
  }
}

type RecentRequest = {
  id: string;
  type: "quote" | "service" | "contact";
  name: string;
  contact: string | null;
  status: string;
  createdAt: Date;
};

async function getRecentRequests(): Promise<RecentRequest[]> {
  try {
    const [quotes, services, contacts] = await Promise.all([
      db.quoteRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      }),
      db.serviceRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      }),
      db.contactRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const merged: RecentRequest[] = [
      ...quotes.map((r) => ({
        id: r.id,
        type: "quote" as const,
        name: r.name,
        contact: r.phone,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...services.map((r) => ({
        id: r.id,
        type: "service" as const,
        name: r.name,
        contact: r.phone,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...contacts.map((r) => ({
        id: r.id,
        type: "contact" as const,
        name: r.name,
        contact: r.email,
        status: r.status,
        createdAt: r.createdAt,
      })),
    ];

    return merged
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  } catch (e) {
    console.error("dashboard recent requests error", e);
    return [];
  }
}

const TYPE_LABELS: Record<RecentRequest["type"], string> = {
  quote: "КП",
  service: "Сервис",
  contact: "Контакт",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Завершена",
  REJECTED: "Отклонена",
};

export default async function AdminDashboardPage() {
  const [counters, recent] = await Promise.all([
    getCounters(),
    getRecentRequests(),
  ]);

  const cards = [
    {
      href: "/admin/products",
      label: "Товары",
      icon: Package,
      total: counters.productsTotal,
      sub: `Активных ${counters.productsActive} · Черновики ${counters.productsDraft}`,
    },
    {
      href: "/admin/categories",
      label: "Категории",
      icon: FolderTree,
      total: counters.categoriesTotal,
      sub: "Структура каталога",
    },
    {
      href: "/admin/brands",
      label: "Бренды",
      icon: Tag,
      total: counters.brandsTotal,
      sub: "Производители",
    },
    {
      href: "/admin/requests",
      label: "Заявки",
      icon: Inbox,
      total:
        counters.quotesTotal + counters.serviceTotal + counters.contactTotal,
      sub: `Новых: КП ${counters.quotesNew} · Сервис ${counters.serviceNew} · Контакт ${counters.contactNew}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Дашборд
        </h1>
        <p className="text-sm text-muted-foreground">
          Краткая сводка по содержимому сайта.
        </p>
      </div>

      {!counters.dbAvailable ? (
        <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <div className="font-medium">База данных недоступна</div>
            <div className="text-muted-foreground">
              Все счётчики показаны как 0. Проверьте подключение к PostgreSQL.
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-card-hover">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {c.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight">
                    {c.total}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние заявки</CardTitle>
          <CardDescription>5 последних обращений всех типов</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {recent.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Заявок пока нет.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Тип</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead className="w-[140px]">Статус</TableHead>
                  <TableHead className="w-[160px]">Дата</TableHead>
                  <TableHead className="w-[110px] text-right">
                    Действие
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={`${r.type}-${r.id}`}>
                    <TableCell>
                      <Badge variant="secondary">{TYPE_LABELS[r.type]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.contact}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "NEW" ? "default" : "outline"}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.createdAt.toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/requests/${r.type}/${r.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Открыть
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
