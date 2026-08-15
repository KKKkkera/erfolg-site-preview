import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestAttachments } from "@/components/admin/request-attachments";
import { ReviewModeration } from "@/components/admin/reviews/review-moderation";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/utils-format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Отзыв — Эрфольг" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "На модерации",
  PUBLISHED: "Опубликован",
  REJECTED: "Отклонён",
};

export default async function AdminReviewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const review = await db.review
    .findUnique({ where: { id } })
    .catch((e: unknown) => {
      console.error("review fetch error", e);
      return null;
    });

  if (!review) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/reviews"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Все отзывы
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Отзыв от {review.authorName}
          </h1>
        </div>
        <span className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">
          {STATUS_LABEL[review.status] ?? review.status}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Отзыв</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap leading-7 text-foreground">
              {review.text}
            </p>
            <div className="border-t border-border pt-3">
              <RequestAttachments value={review.attachments} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Автор и согласие</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Имя / псевдоним" value={review.authorName} />
            <Row label="Город" value={review.city || "—"} />
            <Row label="Организация" value={review.organization || "—"} />
            <Row
              label="Публиковать организацию"
              value={review.showOrganization ? "Да" : "Нет"}
            />
            <Row label="Email для связи" value={review.contactEmail || "—"} />
            <Row
              label="Телефон для связи"
              value={formatPhone(review.contactPhone)}
            />
            <Row
              label="Согласие на публикацию"
              value={review.consent ? "Да" : "Нет"}
            />
            <Row
              label="Получен"
              value={new Intl.DateTimeFormat("ru-RU", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(review.createdAt)}
            />
            <Row
              label="Опубликован"
              value={
                review.publishedAt
                  ? new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "long",
                    }).format(review.publishedAt)
                  : "—"
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Модерация</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewModeration
            id={review.id}
            status={review.status}
            moderatorNote={review.moderatorNote}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-foreground">{value}</span>
    </div>
  );
}
