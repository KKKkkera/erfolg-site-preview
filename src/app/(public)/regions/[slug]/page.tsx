import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ContentBlocks } from "@/components/public/content-blocks";
import { LeadDialog } from "@/components/public/lead-dialog";
import { RUSSIA_REGIONS } from "@/components/public/russia-map-regions";
import {
  defaultRegionIntro,
  getRegionContent,
  REGIONS_BY_SLUG,
} from "@/lib/region-pages";
import { defaultMetadata } from "@/lib/seo";

/* Страницы регионов: заголовок, вступление и произвольный контент со
   стандартными блоками — всё правится в /admin/regions.

   Регион без записи в БД показывает текст по умолчанию, поэтому 86 страниц
   не нужно заполнять руками. Страницы с собственным текстом открыты для
   индексации, страницы на дефолтном тексте остаются noindex: 86 копий одного
   абзаца — это дубли, за которые поисковики наказывают. */

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
  const region = REGIONS_BY_SLUG.get(slug);
  if (!region) {
    return defaultMetadata({
      title: "Регион не найден",
      path: `/regions/${slug}`,
      noindex: true,
    });
  }

  const custom = await getRegionContent(slug);
  const hasOwnText = Boolean(custom?.content?.trim() || custom?.intro?.trim());

  return defaultMetadata({
    title:
      custom?.seoTitle?.trim() ||
      `Поставка медицинского оборудования — ${region.name}`,
    description: custom?.seoDesc?.trim() || undefined,
    path: `/regions/${slug}`,
    noindex: !hasOwnText,
  });
}

export default async function RegionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const region = REGIONS_BY_SLUG.get(slug);
  if (!region) notFound();

  const custom = await getRegionContent(slug);
  const heading = custom?.heading?.trim() || region.name;
  const intro = custom?.intro?.trim() || defaultRegionIntro();
  const content = custom?.content?.trim() ?? "";

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
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-[2.4rem]">
            {heading}
          </h1>
          {region.includes ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Включая {region.includes.join(", ")}
            </p>
          ) : null}

          <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground">
            {intro}
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

      {content ? (
        <section className="rails container pb-14">
          <ContentBlocks
            content={content}
            leadSource={`region-${region.slug}`}
          />
        </section>
      ) : null}
    </>
  );
}
