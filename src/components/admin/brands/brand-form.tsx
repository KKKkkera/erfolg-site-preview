"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { deleteBrand, saveBrand } from "@/server/actions/admin/brands";
import { slugify } from "@/lib/slugify";

export type BrandFormInitial = {
  id?: string;
  name?: string;
  slug?: string;
  country?: string | null;
  website?: string | null;
  logo?: string | null;
  sort?: number;
};

export function BrandForm({
  mode,
  initial,
  s3Configured,
}: {
  mode: "create" | "edit";
  initial?: BrandFormInitial;
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [logo, setLogo] = useState(initial?.logo ?? "");

  function onNameChange(value: string) {
    setName(value);
    if (mode === "create" && !slugTouched) {
      setSlug(slugify(value));
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? ""),
      country: String(fd.get("country") ?? ""),
      website: String(fd.get("website") ?? ""),
      logo,
      sort: Number(fd.get("sort") ?? 0),
    };
    startTransition(async () => {
      const res = await saveBrand(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Бренд создан" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/brands/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        if (res.errors) setErrors(res.errors);
        toast.error(res.message || "Не удалось сохранить");
      }
    });
  }

  async function handleDelete(id: string) {
    const res = await deleteBrand(id);
    if (res.ok) router.push("/admin/brands");
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Бренд</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Название" name="name" required error={errors.name}>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field label="Slug" name="slug" error={errors.slug}>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              disabled={pending}
              placeholder="auto"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Страна" name="country" error={errors.country}>
              <Input
                id="country"
                name="country"
                defaultValue={initial?.country ?? ""}
                disabled={pending}
              />
            </Field>
            <Field label="Сайт" name="website" error={errors.website}>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={initial?.website ?? ""}
                disabled={pending}
                placeholder="https://"
              />
            </Field>
          </div>
          <Field label="Порядок в карусели" name="sort" error={errors.sort}>
            <Input
              id="sort"
              name="sort"
              type="number"
              min={0}
              step={1}
              defaultValue={initial?.sort ?? 0}
              disabled={pending}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Логотип в карусели</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logo ? (
            <div className="relative flex h-28 max-w-sm items-center justify-center rounded-md border bg-white p-5">
              <Image
                src={logo}
                alt={name || "Логотип бренда"}
                width={280}
                height={72}
                className="max-h-16 w-auto max-w-full object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setLogo("")}
                disabled={pending}
                className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive"
                aria-label="Убрать логотип"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Логотип не выбран — в карусели название будет показано как текстовый логотип.
            </p>
          )}
          <MediaPickerDialog
            triggerLabel={logo ? "Заменить логотип" : "Выбрать или загрузить логотип"}
            triggerVariant="outline"
            onSelect={(item) => setLogo(item.url)}
            s3Configured={s3Configured}
            origin="brands"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Создать" : "Сохранить"}
        </Button>
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/brands">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Бренд будет удалён. Если связаны товары — удаление отменится."
              onDelete={handleDelete}
            />
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
