import Image from "next/image";
import Link from "next/link";

import heroEquipmentDesktop from "../../../public/images/home-v2/hero-equipment-desktop.png";
import heroEquipment from "../../../public/images/home-v2/hero-equipment.png";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  FileCheck2,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  Truck,
  Wrench,
} from "lucide-react";

import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { ServiceRequestDialog } from "@/components/public/service-request-dialog";
import { HeroActionRow } from "@/components/public/hero-action-row";
import { BrandStrip } from "@/components/public/brand-strip";
import { HomeFaq } from "@/components/public/home-faq";
import {
  HeroProductShowcase,
  type ShowcaseProduct,
} from "@/components/public/hero-product-showcase";
import {
  CornerBrackets,
  PulseLine,
  SectionTag,
  Stat,
} from "@/components/public/decor";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/lib/db";
import { defaultMetadata } from "@/lib/seo";
import {
  faqPageSchema,
  medicalBusinessHomeSchema,
  webSiteSchema,
} from "@/lib/schema";
import { HOME_FAQ } from "@/components/public/home-faq-data";
import { getSettings } from "@/lib/settings";
import { getVisibleCategorySlugs } from "@/lib/catalog-visibility";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import type { CompanySettings, ContactSettings } from "@/lib/schema";

export const revalidate = 120;

export const metadata = defaultMetadata({
  title: "Сервис и поставка медицинской техники для клиник",
  description:
    "Собственный сервисный центр по лицензии Росздравнадзора (ТОМИ): плановое ТО, ремонт, поверка. Поставка медицинской техники под ТЗ и конкурсы 44/223-ФЗ.",
  path: "/",
});

/* Порядок опор повторяет порядок в позиционировании: сервис — основной
   вид деятельности компании по ЕГРЮЛ (ОКВЭД 33.13), поставка — второй. */
const HERO_FEATURES = [
  {
    icon: Wrench,
    title: "Собственный сервисный центр",
    text: "лицензия ТОМИ, акт и гарантия на каждый ремонт",
  },
  {
    icon: ShieldCheck,
    title: "Документы в порядке",
    text: "регистрационные удостоверения, договор по 44/223-ФЗ",
  },
  {
    icon: Stethoscope,
    title: "Прозрачные сроки",
    text: "ответ в рабочий день, КП за 24 часа",
  },
];

const HERO_ACTIONS = [
  {
    title: "Ремонт и обслуживание",
    text: "Выезд инженера, лицензия ТОМИ, акт и гарантия на запчасти и работы.",
    href: "/service",
    kind: "link" as const,
  },
  {
    title: "Подбор по ТЗ",
    text: "Подготовим спецификацию по техническому заданию или конкурсной документации.",
    href: "/catalog",
    kind: "link" as const,
  },
  {
    title: "Запрос КП",
    text: "Опишите задачу — подготовим расчёт со сроком поставки и ценой.",
    kind: "dialog" as const,
  },
];

/* slugs — разделы, которые чип обещает. Чип скрывается, если ни в одном из
   них нет опубликованных товаров: «Расходники и запчасти» вели в пустой
   раздел и упирались в тупик прямо с первого экрана. */
const HERO_CHIPS: { label: string; href: string; slugs: string[] }[] = [
  { label: "Реанимация и ИВЛ", href: "/catalog/reanimation", slugs: ["reanimation"] },
  { label: "Диагностика и УЗИ", href: "/catalog/diagnostics", slugs: ["diagnostics"] },
  { label: "Операционные", href: "/catalog/surgery", slugs: ["surgery"] },
  { label: "Лабораторная диагностика", href: "/catalog/laboratory", slugs: ["laboratory"] },
  {
    label: "Расходники и запчасти",
    href: "/catalog/consumables",
    slugs: ["consumables", "spare-parts"],
  },
];

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    title: "Лицензия Росздравнадзора № Л016-00110-77/00563653",
    text: "Техническое обслуживание медицинских изделий с 21.08.2013, изделия классов 2а, 2б и 3 потенциального риска (УЗИ, МРТ, КТ, рентген, наркозно-дыхательная техника, хирургия и др.). Проверяется в Едином реестре лицензий по ИНН 2014006736.",
  },
  {
    icon: FileCheck2,
    title: "Регистрационное удостоверение на каждое изделие",
    text: "Поставляем только изделия с действующим РУ Росздравнадзора. Номер подтверждаем в коммерческом предложении и указываем в карточке товара; проверить его можно в Государственном реестре медицинских изделий (ГРМИ).",
  },
  {
    icon: BadgeCheck,
    title: "С 2012 года, реквизиты открыты",
    text: "ООО «Эрфольг», ОГРН 1122031001762, ИНН 2014006736. Юридическое лицо, проверяется в ЕГРЮЛ. Работаем по 44-ФЗ и 223-ФЗ, документация — без расхождений с конкурсными требованиями.",
  },
];

const CLIENT_SEGMENTS = [
  {
    title: "Открываете отделение или новый кабинет",
    text: "Конкурс объявлен, сроки сжатые. Подготовим спецификацию по техническому заданию и требованиям закупки, поставим оборудование, выполним монтаж и обучим персонал.",
    bullets: [
      "подбор состава оборудования под ваше ТЗ",
      "подготовка КП и спецификации для конкурсной документации",
      "доставка, монтаж и ввод в эксплуатацию",
    ],
    href: "/catalog",
    cta: "Открыть каталог",
  },
  {
    title: "Поддерживаете действующую клинику",
    text: "Сопровождение существующего парка: разовые ремонты, плановое обслуживание, регулярные поставки расходников и запчастей.",
    bullets: [
      "подбор аналога, если позиция снята с производства",
      "плановое ТО и ремонт по договору сервиса",
      "регулярные поставки расходников и запчастей",
    ],
    href: "/service",
    cta: "Перейти в сервис",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Описание задачи",
    text: "ТЗ, спецификация конкурса, фото неисправного оборудования или краткое описание потребности — достаточно для старта.",
  },
  {
    step: "02",
    title: "Подготовка предложения",
    text: "Подбираем оборудование, проверяем документы, готовим КП с ценой и сроком поставки. Корректируем спецификацию под требования конкурсной документации.",
  },
  {
    step: "03",
    title: "Договор и поставка",
    text: "Договор по 44/223-ФЗ или коммерческий, поставка в согласованный срок, монтаж и обучение персонала на объекте.",
  },
  {
    step: "04",
    title: "Сопровождение",
    text: "Плановое ТО, ремонт по заявке, регулярные поставки расходников и запчастей.",
  },
];

/* Заголовки и буллеты обязаны совпадать с реальными разделами каталога:
   раньше карточка «Лучевая диагностика» вела в «Диагностику», а буллеты
   называли категории, которых в базе нет. Пустые подкатегории отсеиваются
   на рендере — см. visibleCategorySlugs. */
const CATALOG_CARDS = [
  {
    title: "Диагностика",
    bullets: [
      { label: "УЗИ-сканеры", slug: "ultrasound" },
      { label: "Рентген-системы", slug: "x-ray" },
      { label: "Эндоскопия", slug: "endoscopy" },
      { label: "ЭКГ и ЭЭГ", slug: "ecg-eeg" },
    ],
    image: "/images/home-v2/catalog-mri.png",
    href: "/catalog/diagnostics",
    slug: "diagnostics",
  },
  {
    title: "Лабораторное оборудование",
    bullets: [
      { label: "Гематологические анализаторы", slug: "hematology-analyzers" },
      { label: "Биохимические анализаторы", slug: "biochemistry-analyzers" },
      { label: "Центрифуги", slug: "centrifuges" },
      { label: "Микроскопы", slug: "microscopes" },
    ],
    image: "/images/home-v2/catalog-lab.png",
    href: "/catalog/laboratory",
    slug: "laboratory",
  },
  {
    title: "Реанимация и интенсивная терапия",
    bullets: [
      { label: "Аппараты ИВЛ", slug: "ventilators" },
      { label: "Мониторы пациента", slug: "patient-monitors" },
      { label: "Дефибрилляторы", slug: "defibrillators" },
      { label: "Инфузионные насосы", slug: "infusion-pumps" },
    ],
    image: "/images/home-v2/catalog-or.png",
    href: "/catalog/reanimation",
    slug: "reanimation",
  },
];

type BlogPreviewPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: Date | null;
};

const SERVICE_STEPS = [
  {
    icon: Search,
    title: "Описание неисправности",
    text: "Сообщите модель, серийный номер и характер неисправности. Можно приложить фото идентификационной таблички — этого достаточно для первичной диагностики.",
  },
  {
    icon: Wrench,
    title: "Выезд инженера и ремонт",
    text: "Диагностика на месте, оригинальные запчасти, акт выполненных работ. Гарантия на запчасти и на сам ремонт.",
  },
  {
    icon: Stethoscope,
    title: "Договор сопровождения",
    text: "Плановое ТО по графику, выезд по заявке, фиксированный SLA. Оформляется отдельным договором — в т.ч. по 44/223-ФЗ.",
  },
];

const SERVICE_CHECKLIST = [
  "Лицензия Росздравнадзора (ТОМИ)",
  "Только оригинальные запчасти",
  "Акт и гарантия на каждый ремонт",
  "Сервисные договоры по 44/223-ФЗ",
];

const COVERAGE_BULLETS = [
  "Доставка по всей России — собственный транспорт, ПЭК, СДЭК, «Деловые Линии». Способ доставки выбираем по габаритам, массе и сроку поставки.",
  "В Сибирь, на Дальний Восток и районы Крайнего Севера — индивидуальный расчёт логистики по факту груза, со сроком и стоимостью в КП.",
  "Для крупногабаритного и стационарного оборудования — монтаж и пуско-наладка силами наших инженеров на объекте.",
];

async function loadSettingsBundle() {
  const [company, contacts] = await Promise.all([
    withTimeoutFallback(
      getSettings<CompanySettings & Record<string, unknown>>("company"),
      {
        fallback: {} as CompanySettings & Record<string, unknown>,
        label: "home.companySettings",
        timeoutMs: 300,
      },
    ),
    withTimeoutFallback(
      getSettings<ContactSettings & Record<string, unknown>>("contacts"),
      {
        fallback: {} as ContactSettings & Record<string, unknown>,
        label: "home.contactSettings",
        timeoutMs: 300,
      },
    ),
  ]);

  return { company, contacts };
}

async function loadShowcaseProducts(): Promise<ShowcaseProduct[]> {
  try {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE" },
      take: 8,
      orderBy: { sort: "asc" },
      select: {
        slug: true,
        name: true,
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        images: {
          orderBy: { sort: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    });
    return rows.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand?.name ?? null,
      category: p.category.name,
      categorySlug: p.category.slug,
      imageUrl: p.images[0]?.url ?? null,
    }));
  } catch {
    return [];
  }
}

async function loadLatestBlogPosts(): Promise<BlogPreviewPost[]> {
  try {
    return await withTimeoutFallback(
      db.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          coverUrl: true,
          publishedAt: true,
        },
      }),
      {
        fallback: [] as BlogPreviewPost[],
        label: "home.blogPosts",
        timeoutMs: 500,
      },
    );
  } catch {
    return [];
  }
}

function formatBlogDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function HomePage() {
  const [settings, showcase, blogPosts, visibleCategories] = await Promise.all([
    loadSettingsBundle(),
    loadShowcaseProducts(),
    loadLatestBlogPosts(),
    getVisibleCategorySlugs(),
  ]);

  // Ссылки на ненаполненные разделы не показываем: клик по ним заканчивался
  // пустой страницей. Раздел вернётся сам, как только в нём появится товар.
  const heroChips = HERO_CHIPS.filter((chip) =>
    chip.slugs.some((slug) => visibleCategories.has(slug)),
  );
  const catalogCards = CATALOG_CARDS.filter((card) =>
    visibleCategories.has(card.slug),
  ).map((card) => ({
    ...card,
    bullets: card.bullets.filter((b) => visibleCategories.has(b.slug)),
  }));

  return (
    <>
      {/* ================= HERO ================= */}
      {/* На десктопе композиция запечена в широкую hero-картинку. На мобильных
          прозрачный аппарат остаётся отдельным блоком под текстом. */}
      <section className="relative overflow-x-clip border-b guide-border">
        <div className="container relative pb-14 pt-14 md:pb-20 md:pt-20 lg:min-h-[38rem]">
          <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block">
            <Image
              src={heroEquipmentDesktop}
              alt=""
              fill
              priority
              quality={90}
              sizes="(min-width: 1536px) 1400px, 100vw"
              className="object-cover object-right-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-[40%] z-10 w-[11%] bg-gradient-to-r from-background via-background/75 to-transparent"
            />
          </div>

          <div className="relative z-20 min-w-0 max-w-[44rem] lg:max-w-[46%] xl:max-w-[44rem]">
            <h1 className="max-w-[44rem] text-balance text-[1.75rem] font-semibold leading-[1.25] tracking-tight text-foreground sm:text-[2.2rem] lg:text-[2.6rem] xl:text-[3rem]">
              Поставка и{" "}ремонт медицинской техники{" "}
              {/* Акцент — не заливка текста и не жирная черта, а тонкая
                  ЭКГ-линия из логотипа под фразой. */}
              <span className="relative inline-block whitespace-nowrap">
                по{" "}всей России
                <PulseLine
                  className="absolute inset-x-0 -bottom-2.5 h-3.5 text-flame"
                  strokeWidth={4.5}
                />
              </span>
            </h1>

            <p className="mt-7 max-w-[36rem] text-pretty text-[15px] leading-7 text-muted-foreground md:text-base md:leading-8">
              Собственный сервисный центр, плановое техническое обслуживание,
              ремонт, проверка. Поставка оборудования по техническому заданию,
              {" "}
              <span className="whitespace-nowrap">
                документация по{" "}44‑ФЗ и{" "}223‑ФЗ
              </span>
            </p>

            <div className="mt-10 w-full sm:w-fit">
              <div className="grid w-full grid-cols-1 gap-2 sm:w-fit sm:grid-cols-2">
                <QuoteRequestDialog
                  source="hero-primary"
                  triggerVariant="accent"
                  triggerSize="lg"
                  triggerClassName="w-full px-7 text-base"
                />
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full px-6 text-base"
                >
                  <Link href="/catalog">Открыть каталог</Link>
                </Button>
              </div>
              <p className="mt-4 w-full -translate-y-px text-center text-[10px] font-normal uppercase tracking-[0.08em] text-muted-foreground/60 sm:w-[calc((100%_-_0.5rem)/2)]">
                Предоставим за 24 часа
              </p>
            </div>
          </div>

          <div className="relative z-0 mx-auto mt-10 w-full min-w-0 max-w-[42rem] lg:hidden">
            <Image
              src={heroEquipment}
              alt="Ангиографическая C-дуга с операционным столом и монитором"
              quality={90}
              sizes="92vw"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* Верхние метки первой секции с направляющими. Нулевой по высоте слой
          ставит центры квадратов точно на стык hero и следующего блока. */}
      <div aria-hidden="true" className="hero-boundary-marks marks-t container h-0" />

      {/* Лента каталога жила в правой колонке героя; та колонка ушла под фото */}
      {showcase.length > 0 ? (
        <section className="rails border-b guide-border">
          <div className="marks container py-10 md:py-12">
            <HeroProductShowcase products={showcase} />
          </div>
        </section>
      ) : null}

      <BrandStrip />

      {/* ============ НАПРАВЛЕНИЯ И ОПОРЫ (вынесено из героя) ============ */}
      <section className="rails border-b guide-border">
        <div className="marks container py-14 md:py-20">
          <h2 className="mx-auto max-w-4xl text-center text-[2rem] font-semibold leading-[1.12] tracking-[-0.035em] text-foreground sm:text-[2.2rem] md:text-[2.5rem]">
            Мы работаем, чтобы вы помогали людям
          </h2>

          <div className="mt-8 flex flex-wrap justify-center gap-2 md:mt-10">
            {heroChips.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="inline-flex items-center rounded-md border border-border bg-white px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {chip.label}
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-x-8 gap-y-6 border-t guide-border pt-10 sm:grid-cols-3">
            {HERO_FEATURES.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-white text-flame-ink">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-5 text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-3 border-t guide-border pt-10 sm:grid-cols-2">
            <a
              href="https://roszdravnadzor.gov.ru/services/licenses"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-lg border border-border bg-white p-4 transition-colors hover:border-primary/50"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  Проверить лицензию
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Реестр Росздравнадзора · по{" "}ИНН{" "}
                  <span className="font-mono">2014006736</span>
                </span>
              </span>
              <ArrowUpRight
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
            <Link
              href="/contacts"
              className="group flex items-start gap-3 rounded-lg border border-border bg-white p-4 transition-colors hover:border-primary/50"
            >
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  Реквизиты для договора
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  ИНН, ОГРН — на странице «Контакты»
                </span>
              </span>
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 01 — СЦЕНАРИИ ================= */}
      <section className="rails border-b guide-border">
        <div className="marks container py-12 md:py-14">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag index="01">Сценарии</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                С чего начать
              </h2>
            </div>
            <p className="max-w-[24rem] text-sm leading-6 text-muted-foreground">
              Три типовые задачи, с которыми к нам приходят. Выберите свою —
              или сразу опишите её в заявке.
            </p>
          </div>

          <div className="reveal mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border">
            {HERO_ACTIONS.map((item, i) => (
              <HeroActionRow key={item.title} index={i} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= 02 — ДОКУМЕНТЫ ================= */}
      <section className="rails border-b guide-border">
        <div className="marks container py-14 md:py-16">
          <div className="reveal max-w-[46rem]">
            <SectionTag index="02">Документы и регуляторика</SectionTag>
            <h2 className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-[1.9rem]">
              Документы открыты — историю компании можно проверить за минуту
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Конкретные документы и реестры, проверяемые по ИНН: ЕГРЮЛ,
              реестр лицензий Росздравнадзора и Государственный реестр
              медицинских изделий.
            </p>
          </div>

          <div className="reveal mt-9 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Лицензия — главная карточка */}
            <article className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-ink text-ink-muted">
              <div className="relative flex flex-1 flex-col p-7 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <ShieldCheck className="h-6 w-6 text-flame" aria-hidden="true" />
                  <span aria-hidden="true" className="font-mono text-[11px] font-medium tracking-[0.14em] text-flame">
                    01 / 03
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold leading-snug text-white md:text-xl">
                  {TRUST_SIGNALS[0].title}
                </h3>
                <p className="mt-3 max-w-[34rem] text-sm leading-7">
                  {TRUST_SIGNALS[0].text}
                </p>
                <div className="mt-auto pt-6">
                  <a
                    href="https://roszdravnadzor.gov.ru/services/licenses"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-flame transition-colors hover:text-white"
                  >
                    Проверить в реестре Росздравнадзора
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <div className="relative border-t border-ink-border/70">
                <PulseLine className="h-6 w-full text-flame/70" />
              </div>
            </article>

            <div className="grid gap-5">
              {TRUST_SIGNALS.slice(1).map((item, idx) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-border bg-white p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span aria-hidden="true" className="font-mono text-[11px] font-medium tracking-[0.14em] text-flame-ink">
                      {String(idx + 2).padStart(2, "0")} / 03
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold leading-snug text-foreground md:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 03 — КОМУ ПОМОГАЕМ ================= */}
      <section className="rails border-b guide-border bg-surface/60">
        <div className="marks container py-14 md:py-16">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag index="03">Кому мы помогаем</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                Две типовые ситуации наших клиентов
              </h2>
            </div>
            <p className="max-w-[22rem] text-sm leading-6 text-muted-foreground">
              Каждая ситуация — отдельный сценарий. Ниже — шаги, по которым работаем.
            </p>
          </div>

          <div className="reveal mt-8 grid gap-5 lg:grid-cols-2">
            {CLIENT_SEGMENTS.map((item, idx) => (
              <article
                key={item.title}
                className="flex flex-col rounded-lg border border-border bg-white p-7 md:p-8"
              >
                <span aria-hidden="true" className="font-mono text-[11px] font-medium tracking-[0.14em] text-flame-ink">
                  {idx === 0 ? "CASE A" : "CASE B"}
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-[32rem] text-sm leading-7 text-muted-foreground">
                  {item.text}
                </p>
                <ul className="mt-6 space-y-3">
                  {item.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-sm leading-6 text-foreground/85"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-[0.15rem] h-4 w-4 shrink-0 text-flame-ink"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={item.href}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 04 — ПРОЦЕСС ================= */}
      <section className="rails border-b guide-border">
        <div className="marks container py-14 md:py-16">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag index="04">Как мы работаем</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                Четыре шага от заявки до поставки
              </h2>
            </div>
            <p className="max-w-[26rem] text-sm leading-6 text-muted-foreground">
              Первое предложение направляем по электронной почте — без
              обязательного предварительного созвона.
            </p>
          </div>

          <div className="reveal mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
            {PROCESS_STEPS.map((item) => (
              <article key={item.step} className="bg-white p-6 md:p-7">
                <div className="font-heading text-2xl font-semibold leading-none text-flame-ink">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 05 — СЕРВИСНЫЙ ЦЕНТР ================= */}
      <section className="rails border-b guide-border bg-surface/60">
        <div className="marks container py-14 md:py-16">
          <div className="reveal grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:gap-14">
            <div>
              <SectionTag index="05">Сервисный центр</SectionTag>
              <h2 className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-[1.9rem]">
                Собственный сервисный центр — лицензия Росздравнадзора (ТОМИ)
              </h2>
              <p className="mt-4 max-w-[34rem] text-sm leading-7 text-muted-foreground">
                Профиль обслуживания: реанимационное оборудование, диагностика
                (УЗИ, рентген, эндоскопия), хирургия, лабораторное оборудование,
                стерилизаторы. Сообщите модель — подтвердим, готовы ли взять
                оборудование на сопровождение.
              </p>

              <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-white">
                {SERVICE_STEPS.map((item, idx) => (
                  <article key={item.title} className="flex items-start gap-4 p-5 md:p-6">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span aria-hidden="true" className="font-mono text-[11px] font-medium text-flame-ink">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-base font-semibold tracking-tight text-foreground">
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="relative overflow-hidden rounded-lg border border-border bg-white">
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/images/home-v2/service-engineer.png"
                    alt="Инженер сервисной службы обслуживает медицинское оборудование"
                    fill
                    sizes="(max-width: 1280px) 100vw, 40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-3">
                    <CornerBrackets className="text-white/80" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-white p-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {SERVICE_CHECKLIST.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-6 text-foreground/85"
                    >
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <ServiceRequestDialog
                    triggerLabel="Запросить сервис"
                    triggerVariant="accent"
                    triggerClassName="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 06 — КАТАЛОГ ================= */}
      <section className="rails border-b guide-border">
        <div className="marks container py-14 md:py-16">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag index="06">Каталог</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                Каталог оборудования
              </h2>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
            >
              Весь каталог
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="reveal mt-8 grid gap-5 md:grid-cols-3">
            {catalogCards.map((card) => (
              <article
                key={card.title}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-primary/50"
              >
                <Link href={card.href} className="flex h-full flex-col">
                  <div className="relative h-44 border-b border-border bg-surface">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                      {card.title}
                    </h3>
                    <ul className="mt-3 space-y-1 text-sm leading-6 text-muted-foreground">
                      {card.bullets.map((bullet) => (
                        <li key={bullet.slug} className="flex items-center gap-2.5">
                          <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-flame-ink" />
                          {bullet.label}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-primary">
                      Перейти в раздел
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 07 — БЛОГ ================= */}
      {blogPosts.length > 0 ? (
        <section className="rails border-b guide-border">
          <div className="marks container py-14 md:py-16">
            <div className="reveal flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionTag index="07">Блог</SectionTag>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                  Свежие статьи по медтехнике
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                Все статьи
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="reveal mt-8 grid gap-5 md:grid-cols-3">
              {blogPosts.map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-primary/50"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface">
                      {post.coverUrl ? (
                        <Image
                          src={post.coverUrl}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    {post.publishedAt ? (
                      <time
                        dateTime={post.publishedAt.toISOString()}
                        className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {formatBlogDate(post.publishedAt)}
                      </time>
                    ) : null}
                    <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-foreground">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="transition-colors hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    {post.excerpt ? (
                      <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ================= 08 — ГЕОГРАФИЯ ================= */}
      <section className="rails border-b guide-border">
        <div className="marks container py-14 md:py-16">
          <div className="reveal grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <SectionTag index="08">География</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[1.9rem]">
                Доставка по{" "}всей России
              </h2>
              <p className="mt-4 max-w-[30rem] text-base leading-7 text-muted-foreground">
                Регион поставки на условия и сроки в большинстве случаев не влияет.
                Для удалённых направлений — Сибирь, Дальний Восток, районы Крайнего
                Севера — рассчитываем логистику индивидуально по факту груза.
              </p>
              <Link
                href="/delivery"
                className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                Условия доставки
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <ul className="divide-y divide-border rounded-lg border border-border bg-white">
              {COVERAGE_BULLETS.map((item, idx) => (
                <li key={item} className="flex items-start gap-4 p-5 md:p-6">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                    <Truck className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span aria-hidden="true" className="font-mono text-[11px] font-medium text-flame-ink">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-1 text-sm leading-7 text-foreground/85">{item}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <HomeFaq />

      {/* ================= CTA ================= */}
      <section className="rails">
        <div className="container pb-16 pt-2 md:pb-20">
          <div className="reveal relative overflow-hidden rounded-lg bg-ink text-ink-muted">
            <div className="relative">
              <PulseLine className="h-7 w-full text-flame/70" />
            </div>
            <div className="relative grid items-center gap-8 p-7 pt-4 md:p-10 md:pt-6 xl:grid-cols-[1fr_minmax(20rem,24rem)]">
              <div>
                <h2 className="max-w-[30rem] text-balance text-2xl font-semibold leading-snug tracking-tight text-white md:text-[2rem]">
                  Опишите задачу — подготовим расчёт и{" "}КП
                </h2>
                <p className="mt-4 max-w-[32rem] text-sm leading-7 md:text-base">
                  Подойдёт техническое задание, спецификация конкурса, фото
                  идентификационной таблички или краткое описание потребности.
                  Ответ в рабочий день, КП — за 1–2 дня.
                </p>
                <div className="mt-8 grid max-w-[30rem] grid-cols-2 gap-6 sm:grid-cols-3">
                  <Stat dark value="2012" label="Год основания" />
                  <Stat dark value="44/223" label="ФЗ — закупки" />
                  <Stat dark value="ТОМИ" label="Лицензия РЗН" />
                </div>
              </div>

              <div className="grid gap-3">
                <QuoteRequestDialog
                  source="home-cta"
                  triggerLabel="Получить КП"
                  triggerVariant="accent"
                  triggerSize="lg"
                />
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-transparent text-white hover:border-flame hover:bg-white/[.06] hover:text-white"
                >
                  <Link href="/service">Запросить сервис</Link>
                </Button>
                <a
                  href="tel:+79288957070"
                  className="flex items-center gap-3 rounded-md border border-ink-border bg-white/[.04] px-4 py-3 transition-colors hover:border-flame/70"
                >
                  <Phone className="h-4 w-4 shrink-0 text-flame" aria-hidden="true" />
                  <span>
                    <span className="block font-mono text-base font-medium text-white">
                      +7 928 895 70 70
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      Пн–Пт 09:00–18:00
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={medicalBusinessHomeSchema(settings)} />
      <JsonLd data={webSiteSchema()} />
      <JsonLd data={faqPageSchema(HOME_FAQ)} />
    </>
  );
}
