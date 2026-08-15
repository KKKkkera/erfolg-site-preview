"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Заполните email и пароль");
      return;
    }

    startTransition(async () => {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error("Неверный email или пароль");
        return;
      }

      toast.success("Добро пожаловать");
      router.replace(callbackUrl);
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Вход в админку</CardTitle>
        <CardDescription>
          Эрфольг — панель управления контентом
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              placeholder="admin@erfolgmt.ru"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Вход…" : "Войти"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
