import Image from "next/image";
import { Quote } from "lucide-react";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { EmptyState } from "@/components/public/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 300;

export const metadata = defaultMetadata({
  title: "Отзывы клиник о сервисе и поставке медтехники",
  description:
    "Отзывы медицинских организаций о поставке и обслуживании оборудования ООО «Эрфольг».",
  path: "/reviews",
});

type PublicReview = {
  id: string;
  authorName: string;
  position: string | null;
  city: string | null;
  organization: string | null;
  text: string;
  imageUrl: string | null;
  publishedAt: Date | null;
};

async function loadReviews(): Promise<PublicReview[]> {
  return withTimeoutFallback(
    db.review.findMany({
      where: { isPublished: true },
      orderBy: [{ sort: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        authorName: true,
        position: true,
        city: true,
        organization: true,
        text: true,
        imageUrl: true,
        publishedAt: true,
      },
    }),
    { fallback: [] as PublicReview[], label: "reviews.list", timeoutMs: 1000 },
  );
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function ReviewsPage() {
  const reviews = await loadReviews();

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Отзывы" }]}
      />

      <section className="rails border-b guide-border">
        <div className="marks container pb-12">
          <div className="max-w-3xl">
            <SectionTag>Отзывы</SectionTag>
            <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              Отзывы клиник
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Каждый отзыв — от организации, которой мы поставляли оборудование
              или обслуживали парк. Публикуем с согласия автора
            </p>
          </div>
        </div>
      </section>

      <section className="rails container pb-16">
        {reviews.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-2">
            {reviews.map((review) => {
              const meta = [
                review.position,
                review.organization,
                review.city,
                formatDate(review.publishedAt),
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={review.id}
                  className="flex flex-col rounded-lg border border-border bg-white p-6"
                >
                  {review.imageUrl ? (
                    /* Скан письма — иллюстрация к тексту: сам текст ниже
                       лежит в разметке целиком и индексируется. */
                    <a
                      href={review.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-64 overflow-hidden rounded border border-border bg-surface transition-colors hover:border-primary"
                    >
                      <Image
                        src={review.imageUrl}
                        alt={`Благодарственное письмо: ${
                          review.organization || review.authorName
                        }`}
                        fill
                        sizes="(min-width: 768px) 45vw, 100vw"
                        className="object-contain object-top p-2"
                      />
                    </a>
                  ) : (
                    <Quote
                      className="h-5 w-5 shrink-0 text-flame-ink"
                      aria-hidden="true"
                    />
                  )}
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {review.text}
                  </p>
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm font-semibold text-foreground">
                      {review.authorName}
                    </p>
                    {meta ? (
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {meta}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Quote}
            title="Отзывы пока не опубликованы"
            description="Мы публикуем отзывы клиник, которые подтвердили их письменно. Раздел скоро пополнится."
          />
        )}
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Отзывы", url: "/reviews" },
        ])}
      />
    </>
  );
}
