import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Badge } from "@/components/ui/badge";
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
import { CreateUserDialog } from "@/components/admin/users/create-user-dialog";
import { UserRowActions } from "@/components/admin/users/user-row-actions";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRu } from "@/lib/utils-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Пользователи — Эрфольг" };

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/admin/login");
  if (session.user.role !== "OWNER") {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/10 p-6 text-sm">
        Раздел доступен только владельцу (OWNER).
      </div>
    );
  }

  let users: Array<{
    id: string;
    email: string;
    name: string;
    role: "OWNER" | "EDITOR";
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }> = [];
  let dbError = false;
  try {
    users = (await db.adminUser.findMany({
      orderBy: { createdAt: "asc" },
    })) as typeof users;
  } catch (e) {
    console.error("admin/users fetch error", e);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Пользователи админки
          </h1>
          <p className="text-sm text-muted-foreground">
            Создание/редактирование/смена пароля. Удаление — мягкое (деактивация).
          </p>
        </div>
        <CreateUserDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Список</CardTitle>
          <CardDescription>
            OWNER может всё. EDITOR — без раздела пользователей и аудита.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {dbError ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              База данных недоступна.
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Пользователей нет.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead className="w-[120px]">Роль</TableHead>
                  <TableHead className="w-[120px]">Активен</TableHead>
                  <TableHead className="w-[160px]">Последний вход</TableHead>
                  <TableHead className="w-[140px]">Создан</TableHead>
                  <TableHead className="w-[280px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === "OWNER" ? "default" : "secondary"}
                      >
                        {u.role === "OWNER" ? "Владелец" : "Редактор"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "default" : "outline"}>
                        {u.isActive ? "Да" : "Нет"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastLoginAt
                        ? u.lastLoginAt.toLocaleString("ru-RU")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRu(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <UserRowActions
                        user={{
                          id: u.id,
                          email: u.email,
                          name: u.name,
                          role: u.role,
                          isActive: u.isActive,
                        }}
                      />
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
