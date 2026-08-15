"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app/error boundary", error);
  }, [error]);

  const isProd = process.env.NODE_ENV === "production";

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-md border border-warning/40 bg-warning/10">
          <AlertTriangle
            className="h-8 w-8 text-warning"
            aria-hidden="true"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Что-то пошло не так
        </h1>
        <p className="mt-4 text-muted-foreground">
          Произошла техническая ошибка при загрузке страницы. Попробуйте
          обновить — если ошибка повторяется, перейдите на главную или
          свяжитесь с нами.
        </p>

        {!isProd && error?.message ? (
          <pre className="mt-6 max-w-full overflow-x-auto rounded-md border border-border bg-surface p-3 text-left text-xs text-muted-foreground">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        ) : null}

        {/* Digest показываем и в проде: это безопасный идентификатор для
            поиска ошибки в серверных логах, когда пользователь обращается
            в поддержку. Текст самой ошибки в прод не выводим. */}
        {isProd && error?.digest ? (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Код ошибки: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => reset()} size="lg">
            <RotateCw className="mr-2 h-4 w-4" />
            Попробовать снова
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
