import { notFound } from "next/navigation";
import { CheckCircle2, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";

type CityInfo = {
  slug: string;
  name: string;
  prepositional: string;
  region: string;
  distanceKm: number;
  daysToDelivery: string;
  notes?: string;
};

const CITIES: Record<string, CityInfo> = {
  grozny: {
    slug: "grozny",
    name: "Грозный",
    prepositional: "Грозном",
    region: "Чеченская Республика",
    distanceKm: 0,
    daysToDelivery: "1 рабочий день",
    notes:
      "Поставляем в государственные ЛПУ и частные клиники Чеченской Республики. Отгружаем в день оплаты, монтаж — в день поставки.",
  },
  vladikavkaz: {
    slug: "vladikavkaz",
    name: "Владикавказ",
    prepositional: "Владикавказе",
    region: "Республика Северная Осетия — Алания",
    distanceKm: 110,
    daysToDelivery: "1–2 рабочих дня",
    notes:
      "Регулярные поставки в РКБ, городские поликлиники и частные центры Владикавказа. Доставка собственным транспортом или ТК.",
  },
  makhachkala: {
    slug: "makhachkala",
    name: "Махачкала",
    prepositional: "Махачкале",
    region: "Республика Дагестан",
    distanceKm: 380,
    daysToDelivery: "2–3 рабочих дня",
    notes:
      "Поставляем в государственные клиники Махачкалы и Каспийска, частные центры республики. Сервисный инженер выезжает по заявкам.",
  },
  nazran: {
    slug: "nazran",
    name: "Назрань",
    prepositional: "Назрани",
    region: "Республика Ингушетия",
    distanceKm: 80,
    daysToDelivery: "1 рабочий день",
    notes:
      "Близкий регион — отгружаем своим транспортом. Опыт работы с ингушскими ЛПУ.",
  },
  nalchik: {
    slug: "nalchik",
    name: "Нальчик",
    prepositional: "Нальчике",
    region: "Кабардино-Балкарская Республика",
    distanceKm: 230,
    daysToDelivery: "1–2 рабочих дня",
    notes:
      "Поставки в РКБ, городские поликлиники и санатории Кабардино-Балкарии.",
  },
  stavropol: {
    slug: "stavropol",
    name: "Ставрополь",
    prepositional: "Ставрополе",
    region: "Ставропольский край",
    distanceKm: 410,
    daysToDelivery: "2–3 рабочих дня",
    notes:
      "Региональный центр СКФО. Работаем с государственными ЛПУ и частными клиниками.",
  },
  cherkessk: {
    slug: "cherkessk",
    name: "Черкесск",
    prepositional: "Черкесске",
    region: "Карачаево-Черкесская Республика",
    distanceKm: 400,
    daysToDelivery: "2–3 рабочих дня",
  },
  rostov: {
    slug: "rostov",
    name: "Ростов-на-Дону",
    prepositional: "Ростове-на-Дону",
    region: "Ростовская область",
    distanceKm: 750,
    daysToDelivery: "3–4 рабочих дня",
    notes:
      "Транспортные компании уровня «Деловые Линии», «ПЭК» и «Байкал Сервис». Сервисный инженер — по согласованию.",
  },
  krasnodar: {
    slug: "krasnodar",
    name: "Краснодар",
    prepositional: "Краснодаре",
    region: "Краснодарский край",
    distanceKm: 850,
    daysToDelivery: "3–4 рабочих дня",
  },
  voronezh: {
    slug: "voronezh",
    name: "Воронеж",
    prepositional: "Воронеже",
    region: "Воронежская область",
    // ~1250 по трассе через Ростов (М-4); прежние 1450 км были завышены.
    distanceKm: 1250,
    daysToDelivery: "4–5 рабочих дней",
  },
};

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
            <QuoteRequestDialog
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
