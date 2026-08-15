import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema, serviceSchema } from "@/lib/schema";

export const metadata = defaultMetadata({
  title: "Поставка медтехники по 44-ФЗ",
  description:
    "Участвуем в электронных аукционах по 44-ФЗ: документация под спецификацию конкурса, медтехника с регистрационными удостоверениями. Опыт с 2012 года.",
  path: "/44-fz",
});

export default function Page44Fz() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: "Поставка медтехники по 44-ФЗ",
          description:
            "Подготовка КП для обоснования НМЦК, участие в электронных аукционах, поставка медицинских изделий с регистрационными удостоверениями Росздравнадзора.",
          url: "/44-fz",
          serviceType: "Государственные закупки медтехники по 44-ФЗ",
        })}
      />
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "44-ФЗ" }]}
      />

      <section className="rails container pb-8">
        <div className="max-w-3xl">
          <SectionTag>Госзакупки</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            Поставка медтехники по 44-ФЗ
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            Работаем с государственными клиниками, поликлиниками и больницами в
            рамках Федерального закона № 44-ФЗ «О контрактной системе». Готовим
            коммерческие предложения для обоснования НМЦК, участвуем в электронных
            аукционах, поставляем оборудование с полным пакетом документов.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <QuoteRequestDialog
              source="44-fz-page"
              triggerLabel="Получить КП"
              triggerVariant="accent"
              triggerSize="lg"
            />
            <a
              href="mailto:info@erfolgmt.ru?subject=Запрос%20КП%20для%2044-ФЗ&body=ИНН%20заказчика%3A%20%0AНомер%20извещения%20(если%20есть)%3A%20%0AОКПД2%2FКТРУ%3A%20%0AКоличество%2C%20единица%3A%20%0AТребования%20к%20РУ%20Росздравнадзора%3A%20%0AЖелаемый%20срок%20поставки%3A%20%0AКонтакт%20для%20связи%3A%20"
              className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-white px-6 text-[15px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Шаблон КП по e-mail
            </a>
            <a
              href="tel:+79288957070"
              className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-white px-6 font-mono text-[15px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              +7 928 895 70 70
            </a>
          </div>
        </div>
      </section>

      <section className="rails border-t guide-border bg-surface">
        <div className="marks-t container py-12">
          <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Этапы работы по 44-ФЗ
          </h2>
          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.title} className="bg-white p-6">
                <div className="font-heading text-2xl font-semibold leading-none text-flame-ink">
                  {step.num}
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rails container py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Что получает заказчик
            </h2>
            <ul className="mt-5 space-y-3">
              {DELIVERABLES.map((d) => (
                <li key={d} className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-flame-ink"
                    aria-hidden="true"
                  />
                  <span className="text-base text-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-white p-6">
              <ShieldCheck
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                Регистрационные удостоверения
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Каждая поставленная единица сопровождается копией РУ
                Росздравнадзора. Номер указывается в товарной накладной и
                паспорте изделия — проверяется в открытом Государственном
                реестре медицинских изделий.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <FileCheck2
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                Документация под закупку
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Подберём оборудование под вашу спецификацию, поможем
                сформулировать ТЗ без отсылки к одной торговой марке (ст. 33
                закона), подадим встречное КП на этапе обоснования НМЦК.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rails border-t guide-border bg-surface">
        <div className="marks-t container py-12">
          <div className="relative overflow-hidden rounded-lg bg-ink p-8 text-ink-muted md:p-10">
            <div className="relative">
              <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                Готовим КП для НМЦК или участвуем в готовом аукционе
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7">
                Отправьте техническое задание или ссылку на закупку в ЕИС —
                подготовим расчёт в рабочий день. Подбираем из брендов
                Olympus, Karl Storz, GE Healthcare, Mindray, Philips и других.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <QuoteRequestDialog
                  source="44-fz-final"
                  triggerLabel="Отправить ТЗ"
                  triggerVariant="accent"
                  triggerSize="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Поставка по 44-ФЗ", url: "/44-fz" },
        ])}
      />
    </>
  );
}

const STEPS = [
  {
    num: "01",
    title: "Запрос на КП",
    text: "Заказчик присылает ТЗ или ссылку на план-график в ЕИС. Подбираем оборудование под спецификацию, готовим встречное предложение.",
  },
  {
    num: "02",
    title: "Обоснование НМЦК",
    text: "Подаём официальное КП с подробной калькуляцией для расчёта начальной максимальной цены контракта.",
  },
  {
    num: "03",
    title: "Электронный аукцион",
    text: "Подаём заявку на ЭТП, конкурируем за минимальную цену. Имеем все необходимые лицензии и сертификаты.",
  },
  {
    num: "04",
    title: "Поставка и приёмка",
    text: "Заключаем контракт, поставляем в согласованный срок, выполняем монтаж, обучаем персонал, передаём пакет документов.",
  },
];

const DELIVERABLES = [
  "Товарная накладная и счёт-фактура",
  "Копия регистрационного удостоверения Росздравнадзора",
  "Декларация / сертификат соответствия",
  "Паспорт изделия и руководство по эксплуатации (на русском языке)",
  "Акт пусконаладочных работ и протокол обучения персонала",
  "Гарантийный талон с указанием срока и условий гарантии",
  "Программа технического обслуживания на гарантийный период",
];
