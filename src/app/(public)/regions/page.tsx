import Link from "next/link";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import {
  FEDERAL_DISTRICTS,
  REGION_INDEX,
} from "@/components/public/russia-regions-index";
import { DELIVERY_CITIES } from "@/lib/delivery-cities";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema, itemListSchema } from "@/lib/schema";

/* Хаб географии: единственная страница, с которой краулер видит все 86
   регионов и городские лендинги.

   Раньше ссылки на регионы жили только внутри карты на главной, а карта —
   это dynamic(ssr:false) с загрузкой от 1024px (см. region-coverage.tsx).
   В HTML-ответе не было ни одной ссылки на /regions/*, и весь раздел
   существовал только для тех, кто открыл его вручную. */

export const revalidate = 3600;

export const metadata = defaultMetadata({
  title: "География поставок: регионы России",
  description:
    "Поставка медицинского оборудования и сервисное обслуживание во всех регионах России. Выберите свой субъект — условия, сроки поставки и контакты.",
  path: "/regions",
});

export default function RegionsHubPage() {
  const byDistrict = FEDERAL_DISTRICTS.map((district) => ({
    ...district,
    regions: REGION_INDEX.filter((r) => r.district === district.code),
  })).filter((d) => d.regions.length > 0);

  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "География поставок", url: "/regions" },
        ])}
      />
      <JsonLd
        data={itemListSchema({
          name: "Регионы поставки медицинского оборудования",
          url: "/regions",
          items: REGION_INDEX.map((region) => ({
            name: region.name,
            url: `/regions/${region.slug}`,
          })),
        })}
      />

      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "География поставок" }]}
      />

      <section className="rails border-b guide-border">
        <div className="marks container pb-12">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              География поставок
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Поставляем медицинское оборудование и выезжаем на сервис во все
              федеральные округа. Регион на условия и сроки в большинстве
              случаев не влияет — выберите свой субъект, чтобы посмотреть
              детали
            </p>
          </div>
        </div>
      </section>

      <section className="rails container py-12">
        <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
          Города частых поставок
        </h2>
        <p className="mt-2 max-w-[42rem] text-sm leading-6 text-muted-foreground">
          Сюда отгружаем регулярно — со сроком доставки и собственным
          сервисным выездом
        </p>
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {DELIVERY_CITIES.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/postavka/${city.slug}`}
                className="inline-flex items-center gap-2 border border-border bg-white px-3.5 py-2 text-sm leading-6 text-foreground transition-colors hover:border-flame-ink hover:text-flame-ink"
              >
                <span>{city.name}</span>
                <span className="text-xs text-muted-foreground">
                  {city.daysToDelivery}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rails container pb-16">
        <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
          Все регионы России
        </h2>
        <div className="mt-6 space-y-8">
          {byDistrict.map((district) => (
            <div key={district.code}>
              <h3 className="tech-label border-b border-border pb-2 text-muted-foreground">
                {district.name} федеральный округ
              </h3>
              <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {district.regions.map((region) => (
                  <li key={region.code}>
                    <Link
                      href={`/regions/${region.slug}`}
                      className="block py-1 text-sm leading-6 text-foreground transition-colors hover:text-flame-ink"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
