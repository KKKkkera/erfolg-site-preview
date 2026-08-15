import { CheckCircle2, FileCheck2, Handshake } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema, serviceSchema } from "@/lib/schema";

export const metadata = defaultMetadata({
  title: "Поставка медтехники по 223-ФЗ",
  description:
    "Работаем по 223-ФЗ с частными клиниками, ФГУП, ОАО с госучастием. Гибкие сроки, индивидуальные условия, сопровождение закупочной процедуры.",
  path: "/223-fz",
});

export default function Page223Fz() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: "Поставка медтехники по 223-ФЗ",
          description:
            "Поставка медицинской техники для частных клиник, ФГУП и ОАО с госучастием по 223-ФЗ — индивидуальные условия, гибкие сроки, сопровождение закупочной процедуры.",
          url: "/223-fz",
          serviceType: "Закупки медтехники по 223-ФЗ",
        })}
      />
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "223-ФЗ" }]}
      />

      <section className="rails container pb-8">
        <div className="max-w-3xl">
          <SectionTag>Закупки отдельных юр. лиц</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            Поставка медтехники по 223-ФЗ
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            Работаем по Федеральному закону № 223-ФЗ «О закупках товаров, работ,
            услуг отдельными видами юридических лиц». Это закон для частных
            клиник, ФГУП, ОАО с государственным участием — с более гибкими
            процедурами, чем 44-ФЗ.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <QuoteRequestDialog
              source="223-fz-page"
              triggerLabel="Получить КП"
              triggerVariant="accent"
              triggerSize="lg"
            />
            <a
              href="mailto:info@erfolgmt.ru?subject=Запрос%20КП%20по%20223-ФЗ&body=ИНН%20заказчика%3A%20%0AНомер%20извещения%20(если%20есть)%3A%20%0AСпецификация%20или%20модели%3A%20%0AКоличество%2C%20единица%3A%20%0AТребования%20к%20РУ%20Росздравнадзора%3A%20%0AЖелаемый%20срок%20поставки%3A%20%0AКонтакт%20для%20связи%3A%20"
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
            Чем 223-ФЗ отличается от 44-ФЗ
          </h2>
          {/* Таблица шире 375px — прокручивается в собственном контейнере */}
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-b border-border bg-surface/70 text-foreground">
                <tr>
                  <th className="p-4 text-left font-semibold">Параметр</th>
                  <th className="p-4 text-left font-semibold">44-ФЗ</th>
                  <th className="p-4 text-left font-semibold">223-ФЗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DIFFS.map((d) => (
                  <tr key={d.param}>
                    <td className="p-4 font-medium text-foreground">
                      {d.param}
                    </td>
                    <td className="p-4 text-muted-foreground">{d.fz44}</td>
                    <td className="p-4 text-muted-foreground">{d.fz223}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rails container py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Кому подходит 223-ФЗ
            </h2>
            <ul className="mt-5 space-y-3">
              {APPLIES_TO.map((d) => (
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
              <Handshake
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                Гибкие условия
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                По 223-ФЗ заказчик сам утверждает положение о закупках. Можно
                согласовать индивидуальный график оплаты, условия поставки,
                сроки гарантийного обслуживания.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-white p-6">
              <FileCheck2
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                Договор и документация
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                По итогам закупки заключаем договор с подробным указанием
                спецификации, регистрационных удостоверений, гарантий и условий
                сервиса.
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
                Запросите КП с условиями для 223-ФЗ
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7">
                Опишите задачу или пришлите спецификацию — подготовим
                предложение с учётом особенностей вашего положения о закупках.
              </p>
              <div className="mt-6">
                <QuoteRequestDialog
                  source="223-fz-final"
                  triggerLabel="Получить КП"
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
          { name: "Поставка по 223-ФЗ", url: "/223-fz" },
        ])}
      />
    </>
  );
}

const DIFFS = [
  {
    param: "Кто заказчик",
    fz44: "Государственные и муниципальные учреждения",
    fz223: "Частные клиники, ФГУП, ОАО с госучастием, естественные монополии",
  },
  {
    param: "Регулирование",
    fz44: "Жёстко по закону",
    fz223: "Положение о закупках утверждает сам заказчик",
  },
  {
    param: "Способы закупки",
    fz44: "Аукцион, конкурс, котировки",
    fz223: "Любые, прописанные в положении (включая «у единственного поставщика»)",
  },
  {
    param: "Сроки",
    fz44: "Жёстко регламентированы",
    fz223: "Заказчик задаёт самостоятельно",
  },
  {
    param: "Изменение цены договора",
    fz44: "Запрещено (за редкими исключениями)",
    fz223: "Возможно по соглашению сторон",
  },
];

const APPLIES_TO = [
  "Частным медицинским клиникам и центрам",
  "ФГУП и ГУП в сфере здравоохранения",
  "ОАО с государственным участием более 50%",
  "Государственным корпорациям и компаниям",
  "Естественным монополиям и регулируемым организациям",
];
