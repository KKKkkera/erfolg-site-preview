import Image from "next/image";
import { Hammer } from "lucide-react";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { EmptyState } from "@/components/public/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 300;

export const metadata = defaultMetadata({
  title: "Наши работы: поставки и сервис медицинского оборудования",
  description:
    "Выполненные проекты ООО «Эрфольг»: поставка медицинской техники, монтаж, пуско-наладка и сервисное обслуживание оборудования клиник.",
  path: "/works",
});

type PublicWork = {
  id: string;
  title: string;
  organization: string | null;
  city: string | null;
  category: string | null;
  summary: string;
  imageUrl: string | null;
  completedAt: Date | null;
};

async function loadWorks(): Promise<PublicWork[]> {
  return withTimeoutFallback(
    db.work.findMany({
      where: { isPublished: true },
      orderBy: [{ sort: "asc" }, { completedAt: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        title: true,
        organization: true,
        city: true,
        category: true,
        summary: true,
        imageUrl: true,
        completedAt: true,
      },
    }),
    { fallback: [] as PublicWork[], label: "works.list", timeoutMs: 1000 },
  );
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function WorksPage() {
  const works = await loadWorks();

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Наши работы" }]}
      />

      <section className="rails border-b guide-border">
        <div className="marks container pb-12">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              Наши работы
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Поставки оборудования, монтаж и пуско-наладка, сервисное
              сопровождение парка техники. Каждый проект — с указанием
              заказчика, города и объёма работ
            </p>
          </div>
        </div>
      </section>

      <section className="rails container pb-16">
        {works.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {works.map((work) => {
              const meta = [work.city, formatDate(work.completedAt)]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={work.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-border bg-white"
                >
                  {work.imageUrl ? (
                    <div className="relative aspect-[16/10] border-b border-border bg-surface">
                      <Image
                        src={work.imageUrl}
                        alt={work.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                      {work.title}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {work.summary}
                    </p>
                    {work.organization || meta ? (
                      <div className="mt-auto border-t border-border pt-4">
                        {work.organization ? (
                          <p className="pt-1 text-sm font-semibold text-foreground">
                            {work.organization}
                          </p>
                        ) : null}
                        {meta ? (
                          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                            {meta}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Hammer}
            title="Работы пока не опубликованы"
            description="Раздел наполняется: проекты добавляются по мере согласования с заказчиками."
          />
        )}
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Наши работы", url: "/works" },
        ])}
      />
    </>
  );
}
