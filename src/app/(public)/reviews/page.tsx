import { Quote } from "lucide-react";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { EmptyState } from "@/components/public/empty-state";
import { ReviewForm } from "@/components/public/review-form";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 300;

export const metadata = defaultMetadata({
  title: "Отзывы клиник о сервисе и поставке медтехники",
  description:
    "Отзывы медицинских организаций о поставке и обслуживании оборудования ООО «Эрфольг». Публикуем только после подтверждения автором.",
  path: "/reviews",
});

type PublicReview = {
  id: string;
  authorName: string;
  city: string | null;
  organization: string | null;
  showOrganization: boolean;
  text: string;
  publishedAt: Date | null;
};

async function loadReviews(): Promise<PublicReview[]> {
  return withTimeoutFallback(
    db.review.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        authorName: true,
        city: true,
        organization: true,
        showOrganization: true,
        text: true,
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
              Отзывы публикуем после согласования с автором. Каждый — от
              организации, которой мы поставляли оборудование или обслуживали
              парк.
            </p>
          </div>
        </div>
      </section>

      <section className="rails container pb-16">
        {reviews.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-2">
            {reviews.map((review) => {
              const org = review.showOrganization ? review.organization : null;
              const meta = [org, review.city, formatDate(review.publishedAt)]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={review.id}
                  className="flex flex-col rounded-lg border border-border bg-white p-6"
                >
                  <Quote
                    className="h-5 w-5 shrink-0 text-flame-ink"
                    aria-hidden="true"
                  />
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
            description="Мы публикуем только отзывы, которые клиника подтвердила письменно. Если вы работали с нами — оставьте отзыв, он появится после проверки."
          />
        )}
      </section>

      <section className="rails border-t guide-border bg-surface">
        <div className="marks-t container py-14">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Оставить отзыв
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Отзыв проходит проверку перед публикацией: сверяем, что поставка
                или обслуживание действительно были. Название организации
                публикуем только с вашего согласия.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <ReviewForm />
            </div>
          </div>
        </div>
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
