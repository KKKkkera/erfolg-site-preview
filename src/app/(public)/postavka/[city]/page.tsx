import { notFound } from "next/navigation";
import { CheckCircle2, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { LeadDialog } from "@/components/public/lead-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { DELIVERY_CITIES_BY_SLUG } from "@/lib/delivery-cities";

const CITIES = DELIVERY_CITIES_BY_SLUG;

export async function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }));
}

type Params = { city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city } = await params;
  const info = CITIES[city];
  if (!info) {
    return defaultMetadata({
      title: "Регион не найден",
      path: `/postavka/${city}`,
      noindex: true,
    });
  }
  return defaultMetadata({
    title: `Поставка медицинской техники в ${info.prepositional}`,
    description: `Поставляем медицинское оборудование в ${info.prepositional} (${info.region}). Срок доставки — ${info.daysToDelivery}. Регистрационные удостоверения, лицензия ТОМИ на сервис.`,
    path: `/postavka/${city}`,
  });
}

export default async function CityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city } = await params;
  const info = CITIES[city];
  if (!info) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { label: `Поставка в ${info.name}` },
        ]}
      />

      <section className="rails container pb-8">
        <div className="max-w-3xl">
          <SectionTag>{info.region}</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            Поставка медицинской техники в {info.prepositional}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            ООО «Эрфольг» поставляет медицинское оборудование
            в {info.prepositional} — {info.region}. Все изделия с действующими
            регистрационными удостоверениями Росздравнадзора. Сервис по лицензии
            Росздравнадзора на ТОМИ. Работаем с государственными клиниками
            по 44-ФЗ и с частными центрами по коммерческим договорам.
          </p>
          {info.notes ? (
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {info.notes}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <LeadDialog
              source={`city-${city}`}
              triggerLabel="Получить КП"
              triggerVariant="accent"
              triggerSize="lg"
            />
          </div>
        </div>
      </section>

      <section className="rails border-t guide-border bg-surface">
        <div className="marks-t container py-12">
          <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Условия поставки в {info.prepositional}
          </h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {/* Это время в пути, а не срок поставки. Раньше метрика называлась
                «Срок доставки» и противоречила FAQ на главной, где обещано
                5–14 рабочих дней со склада. */}
            <div className="bg-white p-6">
              <Truck className="h-5 w-5 text-flame-ink" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                Транспортное плечо
              </p>
              <p className="mt-1.5 font-mono text-base font-medium text-foreground">
                {info.distanceKm === 0 ? "Отгрузка со склада" : `${info.daysToDelivery} в пути`}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {info.distanceKm === 0
                  ? "наш город"
                  : `от Грозного — около ${info.distanceKm} км`}
              </p>
            </div>
            <div className="bg-white p-6">
              <CheckCircle2
                className="h-5 w-5 text-flame-ink"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                Документы
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                РУ Росздравнадзора, декларация соответствия, паспорт изделия,
                акт пусконаладочных работ.
              </p>
            </div>
            <div className="bg-white p-6">
              <CheckCircle2
                className="h-5 w-5 text-flame-ink"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                Сервис на территории
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Выезд инженера по заявке, плановое ТО по договору
                сопровождения.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Срок поставки
            </strong>{" "}
            — 5–14 рабочих дней со склада в России, от 6 недель для
            оборудования под заказ. Транспортное плечо входит в этот срок.
            Точный срок фиксируем в коммерческом предложении.
          </p>
        </div>
      </section>

      <section className="rails container py-12">
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Что поставляем в {info.prepositional}
        </h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {EQUIPMENT_TYPES.map((eq) => (
            <li
              key={eq}
              className="flex items-start gap-3 rounded-lg border border-border bg-white p-4"
            >
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-flame-ink"
                aria-hidden="true"
              />
              <span className="text-sm leading-6 text-foreground">{eq}</span>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          {
            name: `Поставка в ${info.name}`,
            url: `/postavka/${city}`,
          },
        ])}
      />
    </>
  );
}

const EQUIPMENT_TYPES = [
  "УЗИ-системы и аппараты функциональной диагностики",
  "Эндоскопические стойки (гибкая и жёсткая эндоскопия)",
  "Рентгеновское оборудование, С-дуги, флюорографы",
  "Анестезиологическое и дыхательное оборудование",
  "Лабораторные анализаторы и центрифуги",
  "Стерилизаторы, автоклавы, дезинфекционные камеры",
  "Операционные столы, светильники, мониторы пациента",
];
