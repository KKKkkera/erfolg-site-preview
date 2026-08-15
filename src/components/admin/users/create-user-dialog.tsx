"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { createAdminUser } from "@/server/actions/admin/users";

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "EDITOR">("EDITOR");

  function reset() {
    setEmail("");
    setName("");
    setPassword("");
    setRole("EDITOR");
    setErrors({});
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const res = await createAdminUser({ email, name, password, role });
      if (res.ok) {
        toast.success("Пользователь создан");
        setOpen(false);
        reset();
        router.refresh();
      } else {
        if (res.errors) setErrors(res.errors);
        toast.error(res.message || "Не удалось создать");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Создать пользователя
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый пользователь админки</DialogTitle>
          <DialogDescription>
            Email, имя, пароль и роль. Пароль можно будет сменить позже.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field label="Имя" error={errors.name}>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field label="Пароль" error={errors.password}>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field label="Роль" error={errors.role}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "OWNER" | "EDITOR")}
              disabled={pending}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="EDITOR">Редактор</option>
              <option value="OWNER">Владелец</option>
            </select>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
