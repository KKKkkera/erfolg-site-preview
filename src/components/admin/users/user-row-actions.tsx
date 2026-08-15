"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  setAdminPassword,
  toggleAdminActive,
  updateAdminUser,
} from "@/server/actions/admin/users";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "EDITOR";
  isActive: boolean;
};

export function UserRowActions({ user }: { user: UserItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<"OWNER" | "EDITOR">(user.role);
  const [editErr, setEditErr] = useState<Record<string, string>>({});

  const [pwOpen, setPwOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pwErr, setPwErr] = useState<Record<string, string>>({});

  function onEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditErr({});
    startTransition(async () => {
      const res = await updateAdminUser({ id: user.id, name, role });
      if (res.ok) {
        toast.success("Сохранено");
        setEditOpen(false);
        router.refresh();
      } else {
        if (res.errors) setEditErr(res.errors);
        toast.error(res.message || "Ошибка");
      }
    });
  }

  function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwErr({});
    startTransition(async () => {
      const res = await setAdminPassword({ id: user.id, password });
      if (res.ok) {
        toast.success("Пароль обновлён");
        setPwOpen(false);
        setPassword("");
        router.refresh();
      } else {
        if ("errors" in res && res.errors) setPwErr(res.errors);
        toast.error(("message" in res ? res.message : null) || "Ошибка");
      }
    });
  }

  function onToggle() {
    startTransition(async () => {
      const res = await toggleAdminActive(user.id, !user.isActive);
      if (res.ok) {
        toast.success(user.isActive ? "Деактивирован" : "Активирован");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setEditOpen(true)}
        title="Редактировать"
        disabled={pending}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Изменить</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setPwOpen(true)}
        title="Сменить пароль"
        disabled={pending}
      >
        <KeyRound className="h-4 w-4" />
        <span className="sr-only">Сменить пароль</span>
      </Button>
      <Button
        type="button"
        variant={user.isActive ? "outline" : "default"}
        size="sm"
        onClick={onToggle}
        disabled={pending}
        title={user.isActive ? "Деактивировать" : "Активировать"}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : user.isActive ? (
          "Деактивировать"
        ) : (
          "Активировать"
        )}
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование: {user.email}</DialogTitle>
            <DialogDescription>
              Имя и роль. Email менять нельзя.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Имя</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                required
              />
              {editErr.name ? (
                <p className="text-xs text-destructive">{editErr.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "OWNER" | "EDITOR")}
                disabled={pending}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="EDITOR">Редактор</option>
                <option value="OWNER">Владелец</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={pending}>
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый пароль для {user.email}</DialogTitle>
            <DialogDescription>Минимум 8 символов.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onPassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
                required
                minLength={8}
              />
              {pwErr.password ? (
                <p className="text-xs text-destructive">{pwErr.password}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPwOpen(false)}
                disabled={pending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={pending}>
                Сменить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
