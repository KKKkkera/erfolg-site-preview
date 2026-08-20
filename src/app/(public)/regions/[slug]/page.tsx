import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { LeadDialog } from "@/components/public/lead-dialog";
import { RUSSIA_REGIONS } from "@/components/public/russia-map-regions";
import { defaultMetadata } from "@/lib/seo";

/* Страницы регионов — пока заглушки: заголовок, короткий текст и форма.
   Тексты и наполнение появятся позже, поэтому страницы закрыты от индексации. */

const BY_SLUG = new Map(RUSSIA_REGIONS.map((region) => [region.slug, region]));

export function generateStaticParams() {
  return RUSSIA_REGIONS.map((region) => ({ slug: region.slug }));
}

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const region = BY_SLUG.get(slug);
  return defaultMetadata({
    title: region
      ? `Поставка медицинского оборудования — ${region.name}`
      : "Регион не найден",
    path: `/regions/${slug}`,
    noindex: true,
  });
}

export default async function RegionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const region = BY_SLUG.get(slug);
  if (!region) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { label: region.name },
        ]}
      />

      <section className="rails container py-10 md:py-14">
        <div className="max-w-3xl">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-flame-ink">
            {region.code}
          </span>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-[2.4rem]">
            {region.name}
          </h1>
          {region.includes ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Включая {region.includes.join(", ")}
            </p>
          ) : null}

          <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground">
            Поставляем медицинское оборудование и выезжаем на сервис по всему
            региону. Страница региона в работе — пришлите ТЗ или спецификацию,
            подготовим предложение со сроком и ценой
          </p>

          <div className="mt-8">
            <LeadDialog
              source={`region-${region.slug}`}
              triggerLabel="Отправить ТЗ"
              triggerVariant="accent"
              triggerSize="lg"
            />
          </div>
        </div>
      </section>
    </>
  );
}
