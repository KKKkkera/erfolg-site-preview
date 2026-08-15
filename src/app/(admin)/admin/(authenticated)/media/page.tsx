import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaList } from "@/components/admin/media/media-list";
import { MediaUploader } from "@/components/admin/media/media-uploader";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Медиатека — Эрфольг" };

const ORIGINS = [
  { value: "", label: "Все" },
  { value: "media", label: "Медиатека" },
  { value: "product", label: "Товары" },
  { value: "page", label: "Страницы" },
  { value: "setting", label: "Настройки" },
];

type MediaRow = {
  id: string;
  url: string;
  alt: string | null;
  mime: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  origin: string | null;
  createdAt: Date;
};

export default async function AdminMediaPage(
  props: {
    searchParams?: Promise<{ origin?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const origin = searchParams?.origin || "";
  let items: MediaRow[] = [];
  let total = 0;
  let dbError = false;
  try {
    [items, total] = await Promise.all([
      db.mediaAsset.findMany({
        where: origin ? { origin } : undefined,
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      db.mediaAsset.count({ where: origin ? { origin } : undefined }),
    ]);
  } catch (e) {
    console.error("admin/media fetch error", e);
    dbError = true;
  }

  const s3 = isS3Configured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Медиатека
        </h1>
        <p className="text-sm text-muted-foreground">
          Selectel S3 + presigned upload. Лимит 10 МБ, форматы: JPG/PNG/WebP/AVIF/SVG/GIF.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Загрузка</CardTitle>
            <CardDescription>
              {s3 ? (
                <>S3 настроен. Можно загружать файлы.</>
              ) : (
                <>S3 не настроен.</>
              )}
            </CardDescription>
          </div>
          <Badge variant={s3 ? "default" : "outline"}>
            {s3 ? "S3 OK" : "S3 OFF"}
          </Badge>
        </CardHeader>
        <CardContent>
          <MediaUploader s3Configured={s3} origin="media" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Файлы ({total})</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              {ORIGINS.map((o) => (
                <Link
                  key={o.value}
                  href={
                    o.value
                      ? `/admin/media?origin=${o.value}`
                      : "/admin/media"
                  }
                  className={
                    "rounded-full border px-3 py-1 text-xs " +
                    ((origin || "") === o.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:bg-muted")
                  }
                >
                  {o.label}
                </Link>
              ))}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbError ? (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
              База данных недоступна.
            </div>
          ) : items.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Файлов нет.
            </div>
          ) : (
            <MediaList items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
