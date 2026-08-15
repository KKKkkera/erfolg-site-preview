import {
  CalendarCheck,
  Wrench,
  Gauge,
  Hammer,
  GraduationCap,
  FileSignature,
  ShieldCheck,
} from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { ServiceRequestForm } from "@/components/public/service-request-form";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getPublicLicenseSummaryFromSettings,
  type PublicLicenseSettings,
} from "@/lib/static-cms-pages";
import { defaultMetadata } from "@/lib/seo";
import {
  breadcrumbListSchema,
  serviceSchema,
} from "@/lib/schema";
import { getSettings } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const metadata = defaultMetadata({
  title: "Ремонт и ТО медицинской техники",
  description:
    "Сервис медтехники по лицензии Росздравнадзора (ТОМИ). Плановое ТО, ремонт по заявке, поверка, монтаж, обучение. Акт и гарантия на каждый ремонт.",
  path: "/service",
});

const services = [
  {
    icon: CalendarCheck,
    title: "Плановое ТО по графику",
    text:
      "Регулярное обслуживание раз в квартал или раз в полгода — по графику производителя. Контроль состояния, профилактика, замена расходных компонентов.",
  },
  {
    icon: Wrench,
    title: "Ремонт по заявке",
    text:
      "Выезд инженера, диагностика, ремонт с использованием оригинальных запчастей. Акт выполненных работ, гарантия на запчасти и на сам ремонт.",
  },
  {
    icon: Gauge,
    title: "Поверка измерительной техники",
    text:
      "Поверка и калибровка средств измерений со свидетельством установленного образца, в соответствии с 102-ФЗ «Об обеспечении единства измерений».",
  },
  {
    icon: Hammer,
    title: "Монтаж и пуско-наладка",
    text:
      "Монтаж нового оборудования и ввод в эксплуатацию. При перемещении между корпусами — демонтаж, транспортировка и повторная установка с настройкой.",
  },
  {
    icon: GraduationCap,
    title: "Обучение персонала",
    text:
      "Инструктаж медицинского персонала: корректная эксплуатация, повседневная обработка и пользовательское обслуживание оборудования. Очно или удалённо.",
  },
  {
    icon: FileSignature,
    title: "Договор сопровождения",
    text:
      "Договор сервисного сопровождения: фиксированный SLA, плановое ТО по графику, выезд по заявке. Оформляем по 44/223-ФЗ или коммерческим договором.",
  },
];

export default async function ServicePage() {
  const license = await withTimeoutFallback(getSettings<PublicLicenseSettings>("license"), {
    fallback: {} as PublicLicenseSettings,
    label: "service.license",
    timeoutMs: 1000,
  });

  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: "Сервис и техническое обслуживание медицинской техники",
          description:
            "Плановое ТО, ремонт по заявке, монтаж и пуско-наладка, обучение персонала. Работы выполняются по лицензии Росздравнадзора (ТОМИ).",
          url: "/service",
          serviceType: "Техническое обслуживание медицинских изделий",
        })}
      />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Сервис", url: "/service" },
        ])}
      />
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Сервис" }]}
      />

      <section className="rails border-b guide-border">
        <div className="marks container pb-12">
          <div className="max-w-3xl">
            <SectionTag>Сервисный центр</SectionTag>
            <h1 className="mt-5 text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              Сервисный центр медицинской техники — лицензия Росздравнадзора
            </h1>
            <div className="mt-5 space-y-4 text-base leading-7 text-muted-foreground">
              <p>
                Берём на обслуживание оборудование, по которому имеем
                компетенции и доступ к оригинальным запчастям. Сообщите модель —
                подтвердим, готовы ли взять на сервисное сопровождение.
              </p>
              <p>
                Профиль обслуживания: реанимационное оборудование, диагностика
                (УЗИ, рентген, эндоскопия), хирургия, лабораторное оборудование,
                стерилизаторы. Если по конкретной модели не работаем —
                сообщим сразу.
              </p>
              <p>
                Все работы выполняются на основании лицензии Росздравнадзора
                на техническое обслуживание медицинских изделий (ТОМИ). На
                каждый выезд оформляем акт, используем оригинальные запчасти,
                предоставляем гарантию на запчасти и работы. Договор сервисного
                сопровождения по 44/223-ФЗ — по запросу.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rails container pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Виды сервисных работ
          </h2>
          <span className="tech-label text-muted-foreground">6 направлений</span>
        </div>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="group bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface text-primary transition-colors group-hover:border-primary/50">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span aria-hidden="true" className="font-mono text-[11px] font-medium text-flame-ink">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {s.text}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rails border-t guide-border bg-surface/60">
        <div className="marks-t container py-14 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
            <div>
              <SectionTag>Заявка</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                Заявка на сервис
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Для первичной диагностики достаточно модели, серийного номера
                и краткого описания неисправности. Инженер уточнит детали
                по телефону, согласует выезд и подготовит расчёт.
              </p>
              <div className="mt-6 rounded-lg border border-primary/25 bg-primary/[.05] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="text-sm text-foreground">
                    <p className="font-mono text-[13px] font-medium leading-6">
                      {getPublicLicenseSummaryFromSettings(license)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Лицензия Росздравнадзора на техническое обслуживание
                      медицинских изделий (ТОМИ).
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-white p-5 text-sm">
                <p className="font-semibold text-foreground">
                  Удобнее по электронной почте?
                </p>
                <p className="mt-1 leading-6 text-muted-foreground">
                  Откроется письмо с готовым шаблоном — модель, серийный номер,
                  описание, контакт. Заполните поля и отправьте.
                </p>
                <a
                  href="mailto:info@erfolgmt.ru?subject=Сервисный%20запрос%20-%20%5Bмодель%5D&body=Модель%3A%20%0AСерийный%20номер%3A%20%0AХарактер%20неисправности%3A%20%0AГород%2C%20адрес%20клиники%3A%20%0AКонтакт%20для%20связи%20%28телефон%2Femail%29%3A%20%0AЖелаемый%20срок%20выезда%3A%20"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
                >
                  Написать инженеру по шаблону
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="border-b border-border bg-white px-6 py-3.5">
                <span className="tech-label text-muted-foreground">
                  Форма · ответ в рабочий день
                </span>
              </div>
              <div className="p-6">
                <ServiceRequestForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
