"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageBuilder } from "@/components/admin/blocks/page-builder";
import { resetRegionPage, saveRegionPage } from "@/server/actions/admin/regions";

export type RegionFormInitial = {
  slug: string;
  regionName: string;
  hasRow: boolean;
  heading?: string | null;
  intro?: string | null;
  content?: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
  isPublished?: boolean;
  defaultIntro: string;
};

export function RegionForm({
  initial,
  s3Configured,
}: {
  initial: RegionFormInitial;
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState<boolean>(
    initial.isPublished ?? true,
  );
  const [content, setContent] = useState(initial.content ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveRegionPage({
        slug: initial.slug,
        heading: String(fd.get("heading") ?? ""),
        intro: String(fd.get("intro") ?? ""),
        content,
        seoTitle: String(fd.get("seoTitle") ?? ""),
        seoDesc: String(fd.get("seoDesc") ?? ""),
        isPublished,
      });
      if (res.ok) {
        toast.success("Изменения сохранены");
        router.refresh();
      } else {
        if (res.errors) setErrors(res.errors);
        toast.error(res.message || "Не удалось сохранить");
      }
    });
  }

  function onReset() {
    if (
      !window.confirm(
        "Сбросить страницу к тексту по умолчанию? Введённый текст и блоки будут удалены.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await resetRegionPage(initial.slug);
      if (res.ok) {
        toast.success("Страница сброшена к тексту по умолчанию");
        router.push("/admin/regions");
      } else {
        toast.error(res.message || "Не удалось сбросить");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!initial.hasRow ? (
        <div className="rounded-md border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          У региона пока нет своего текста — на сайте показывается общий текст
          по умолчанию. Он появится здесь после первого сохранения.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Заголовок и вступление</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Заголовок" name="heading" error={errors.heading}>
            <Input
              id="heading"
              name="heading"
              defaultValue={initial.heading ?? ""}
              placeholder={initial.regionName}
              disabled={pending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Пусто — используется название региона: «{initial.regionName}».
            </p>
          </Field>
          <Field label="Вступительный текст" name="intro" error={errors.intro}>
            <Textarea
              id="intro"
              name="intro"
              rows={3}
              defaultValue={initial.intro ?? ""}
              placeholder={initial.defaultIntro}
              disabled={pending}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Пусто — используется общий текст по умолчанию.
            </p>
          </Field>
          <div className="flex items-center gap-2">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isPublished">
              Опубликована (иначе показывается текст по умолчанию)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Конструктор страницы</CardTitle>
        </CardHeader>
        <CardContent>
          <PageBuilder
            value={content}
            onChange={setContent}
            scope="region"
            s3Configured={s3Configured}
            leadSource={`region-${initial.slug}`}
          />
          {errors.content ? (
            <p className="mt-2 text-xs text-destructive">{errors.content}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title (SEO)" name="seoTitle" error={errors.seoTitle}>
            <Input
              id="seoTitle"
              name="seoTitle"
              defaultValue={initial.seoTitle ?? ""}
              disabled={pending}
            />
          </Field>
          <Field label="Description (SEO)" name="seoDesc" error={errors.seoDesc}>
            <Textarea
              id="seoDesc"
              name="seoDesc"
              rows={2}
              defaultValue={initial.seoDesc ?? ""}
              disabled={pending}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/regions">Отмена</Link>
        </Button>
        <Button asChild type="button" variant="ghost">
          <a
            href={`/regions/${initial.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Открыть страницу
          </a>
        </Button>
        {initial.hasRow ? (
          <div className="ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={pending}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Сбросить к умолчанию
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
