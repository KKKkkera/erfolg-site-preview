import Image from "next/image";
import Link from "next/link";

import heroEquipmentDesktop from "../../../public/images/home-v2/hero-equipment-desktop.webp";
import heroEquipment from "../../../public/images/home-v2/hero-equipment.webp";
import stepIcon1 from "../../../public/images/icons/step-1.png";
import stepIcon2 from "../../../public/images/icons/step-2.png";
import stepIcon3 from "../../../public/images/icons/step-3.png";
import stepIcon4 from "../../../public/images/icons/step-4.png";
import {
  BadgeCheck,
  Search,
  Stethoscope,
  Wrench,
} from "lucide-react";

import { LeadDialog } from "@/components/public/lead-dialog";
import {
  BrandStrip,
  type BrandStripItem,
} from "@/components/public/brand-strip";
import { DeliveryCities } from "@/components/public/delivery-cities";
import { HomeFaq } from "@/components/public/home-faq";
import {
  ProductBento,
  type BentoProduct,
} from "@/components/public/product-bento";
import { PulseLine } from "@/components/public/decor";
import {
  ClientCarousel,
  type ClientCard,
} from "@/components/public/client-carousel";
import { ReviewCarousel } from "@/components/public/review-carousel";
import { PostCarousel } from "@/components/public/post-carousel";
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
import { getSetting, getSettings } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import { BRAND_CATALOG } from "@/lib/brand-catalog";
import type { CompanySettings, ContactSettings } from "@/lib/schema";

export const revalidate = 120;

export const metadata = defaultMetadata({
  title: "Сервис и поставка медицинской техники для клиник",
  description:
    "Собственный сервисный центр по лицензии Росздравнадзора (ТОМИ): плановое ТО, ремонт, поверка. Поставка медицинской техники под ТЗ и конкурсы 44/223-ФЗ.",
  path: "/",
});

const PROCESS_STEPS = [
  {
    step: "1",
    icon: stepIcon1,
    title: "Описание задачи",
    text: "ТЗ, спецификация конкурса, фото неисправного оборудования или краткое описание потребности — достаточно для старта",
  },
  {
    step: "2",
    icon: stepIcon2,
    title: "Подготовка предложения",
    text: "Подбираем оборудование, проверяем документы, готовим КП с ценой и сроком поставки. Корректируем спецификацию под требования конкурсной документации",
  },
  {
    step: "3",
    icon: stepIcon3,
    title: "Договор и поставка",
    text: "Договор по 44/223-ФЗ или коммерческий, поставка в согласованный срок, монтаж и обучение персонала на объекте",
  },
  {
    step: "4",
    icon: stepIcon4,
    title: "Сопровождение",
    text: "Плановое ТО, ремонт по заявке, регулярные поставки расходников и запчастей",
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
    text: "Сообщите модель, серийный номер и характер неисправности. Можно приложить фото идентификационной таблички — этого достаточно для первичной диагностики",
  },
  {
    icon: Wrench,
    title: "Выезд инженера и ремонт",
    text: "Диагностика на месте, оригинальные запчасти, акт выполненных работ. Гарантия на запчасти и на сам ремонт",
  },
  {
    icon: Stethoscope,
    title: "Договор сопровождения",
    text: "Плановое ТО по графику, выезд по заявке, фиксированный SLA. Оформляется отдельным договором — в т.ч. по 44/223-ФЗ",
  },
];

const SERVICE_CHECKLIST = [
  "Лицензия Росздравнадзора (ТОМИ)",
  "Только оригинальные запчасти",
  "Акт и гарантия на каждый ремонт",
  "Сервисные договоры по 44/223-ФЗ",
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

/** Товары для управляемой из админки бенто-сетки на главной. */
async function loadBentoProducts(): Promise<BentoProduct[]> {
  try {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE", showOnHome: true },
      // Без лимита: сколько позиций отмечено в админке, столько слайдов
      // (по пять на слайд) и покажет карусель.
      orderBy: [{ homeSort: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        model: true,
        isUsed: true,
        homeBadge: true,
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        images: {
          orderBy: { sort: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });

    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      model: p.model,
      isUsed: p.isUsed,
      brand: p.brand?.name ?? null,
      category: p.category.name,
      categorySlug: p.category.slug,
      imageUrl: p.images[0]?.url ?? null,
      imageAlt: p.images[0]?.alt ?? null,
      homeBadge: p.homeBadge,
    }));
  } catch {
    return [];
  }
}

/**
 * Пауза автолистания карусели «Новинки и спецпредложения», мс.
 * Настройка home.bento_autoplay_seconds задаётся в админке: пусто — 6 секунд,
 * 0 — только ручное листание, остальное зажимаем в разумные 2–60 секунд.
 */
async function loadBentoAutoplayMs(): Promise<number> {
  const raw = await withTimeoutFallback(
    getSetting<string>("home.bento_autoplay_seconds"),
    { fallback: undefined, label: "home.bentoAutoplay", timeoutMs: 300 },
  );

  const seconds = Number.parseFloat(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(seconds)) return 6000;
  if (seconds <= 0) return 0;
  return Math.min(60, Math.max(2, seconds)) * 1000;
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

async function loadClients(): Promise<ClientCard[]> {
  try {
    const rows = await withTimeoutFallback(
      db.work.findMany({
        where: { isPublished: true },
        orderBy: [{ sort: "asc" }, { completedAt: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: {
          id: true,
          title: true,
          organization: true,
          city: true,
          category: true,
          summary: true,
          imageUrl: true,
        },
      }),
      { fallback: [], label: "home.clients", timeoutMs: 500 },
    );

    /* В карточке клиента первым читается заказчик; название работы —
       запасной вариант для записей, где заказчика не согласовали. */
    return rows.map((row) => ({
      id: row.id,
      name: row.organization ?? row.title,
      city: row.city,
      category: row.category,
      summary: row.summary,
      imageUrl: row.imageUrl,
    }));
  } catch {
    return [];
  }
}

type HomeReview = {
  id: string;
  authorName: string;
  position: string | null;
  city: string | null;
  organization: string | null;
  text: string;
  imageUrl: string | null;
  publishedAt: Date | null;
};

async function loadLatestReviews(): Promise<HomeReview[]> {
  try {
    return await withTimeoutFallback(
      db.review.findMany({
        where: { isPublished: true },
        orderBy: [{ sort: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        take: 9,
        select: {
          id: true,
          authorName: true,
          position: true,
          city: true,
          organization: true,
          text: true,
          imageUrl: true,
          publishedAt: true,
        },
      }),
      {
        fallback: [] as HomeReview[],
        label: "home.reviews",
        timeoutMs: 500,
      },
    );
  } catch {
    return [];
  }
}

async function loadBrands(): Promise<BrandStripItem[]> {
  /* productCount: 0 — плитка остаётся некликабельной. Без базы посчитать
     наполнение нельзя, а вести из ленты в заведомо пустую выдачу нельзя тем
     более, поэтому запасной список только показывает логотипы. */
  const fallback = BRAND_CATALOG.map(({ slug, name, logo }) => ({
    slug,
    name,
    logo: logo ?? null,
    productCount: 0,
  }));

  try {
    const rows = await withTimeoutFallback(
      db.brand.findMany({
        where: { slug: { in: BRAND_CATALOG.map((brand) => brand.slug) } },
        orderBy: [{ sort: "asc" }, { name: "asc" }],
        select: {
          slug: true,
          name: true,
          logo: true,
          _count: { select: { products: { where: { status: "ACTIVE" } } } },
        },
      }),
      {
        fallback: null,
        label: "home.brands",
        timeoutMs: 500,
      },
    );

    if (!rows) return fallback;

    return rows.map((brand) => ({
      slug: brand.slug,
      name: brand.name,
      logo: brand.logo,
      productCount: brand._count.products,
    }));
  } catch {
    return fallback;
  }
}

function formatReviewDate(d: Date | null): string | null {
  if (!d) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(d);
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
  const [settings, bento, bentoAutoplayMs, blogPosts, reviews, brands, clients] =
    await Promise.all([
      loadSettingsBundle(),
      loadBentoProducts(),
      loadBentoAutoplayMs(),
      loadLatestBlogPosts(),
      loadLatestReviews(),
      loadBrands(),
      loadClients(),
    ]);

  return (
    <>
      {/* ================= HERO ================= */}
      {/* На десктопе композиция запечена в широкую hero-картинку. На мобильных
          прозрачный аппарат остаётся отдельным блоком под текстом. */}
      <section className="relative overflow-x-clip border-b guide-border">
        <div className="container relative pb-12 pt-11 md:pb-20 md:pt-20 lg:min-h-[38rem] lg:px-[var(--page-gutter)]">
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

          <div className="relative z-20 mx-auto min-w-0 max-w-[44rem] text-center lg:mx-0 lg:max-w-[46%] lg:text-left xl:max-w-[44rem]">
            <h1 className="max-w-[44rem] text-balance text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[2.2rem] lg:text-[2.6rem] xl:text-[3rem]">
              <span className="block sm:inline">Поставка и{" "}ремонт</span>{" "}
              <span className="block sm:inline">медицинской техники</span>{" "}
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

            {/* Абзац переносится сам: жёсткие переносы по фразам были
                подогнаны под 375px и на других ширинах давали рваный край. */}
            <p className="mx-auto mt-6 max-w-[36rem] text-pretty text-[15px] leading-6 text-muted-foreground md:text-base md:leading-7 lg:mx-0">
              Собственный сервисный центр, плановое техническое
              обслуживание, ремонт, проверка. Поставка оборудования по
              техническому заданию, документация по 44‑ФЗ и 223‑ФЗ
            </p>

            <div className="mx-auto mt-8 w-fit lg:mx-0">
              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <LeadDialog
                  source="hero-primary"
                  triggerLabel="Получить КП"
                  triggerVariant="accent"
                  triggerSize="lg"
                  triggerClassName="w-full px-4 text-[15px] sm:px-7 sm:text-base"
                />
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full px-4 text-[15px] sm:px-6 sm:text-base"
                >
                  <Link href="/catalog">Открыть каталог</Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Верхние метки первой секции с направляющими. Нулевой по высоте слой
          ставит центры квадратов точно на стык hero и следующего блока. */}
      <div aria-hidden="true" className="hero-boundary-marks marks-t container h-0" />

      <BrandStrip brands={brands} />

      <section className="rails border-b guide-border lg:hidden">
        <div className="marks container pb-12 pt-10">
          <div className="relative z-0 mx-auto w-full min-w-0 max-w-[42rem]">
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

      {/* ================= НОВИНКИ (бенто) ================= */}
      {bento.length > 0 ? (
        <section className="rails border-b guide-border">
          <div className="marks container py-12 md:py-14">
            <div className="reveal flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-4">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
                Новинки и{" "}спецпредложения
              </h2>
              <Link
                href="/catalog"
                className="inline-flex items-center text-sm font-medium text-foreground underline decoration-foreground/25 decoration-1 underline-offset-4 transition-colors hover:text-foreground/75 hover:decoration-foreground/60"
              >
                Посмотреть весь каталог
              </Link>
            </div>

            <div className="reveal mt-8">
              <ProductBento products={bento} autoplayMs={bentoAutoplayMs} />
            </div>
          </div>
        </section>
      ) : null}

      {/* ================= ГЕОГРАФИЯ РАБОТЫ ================= */}
      <DeliveryCities />

      {/* ============ 01 — КТО МЫ: ПРОЦЕСС, СЕРВИС, ДОКУМЕНТЫ ============ */}
      {/* Один смысловой блок: опоры компании, шаги работы, собственный
          сервисный центр и проверяемые документы. Раньше это были четыре
          отдельные секции, и связь между ними терялась. */}
      <section className="rails border-b guide-border">
        <div className="marks container py-14 md:py-20">
          {/* --- Как мы работаем --- */}
          <div className="reveal">
            <h2 className="text-center text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
              Порядок работы с нами
            </h2>
            <p className="mx-auto mt-4 max-w-[42rem] text-center text-base leading-7 text-muted-foreground">
              От первого письма до сервисного сопровождения — четыре шага,
              на каждом понятно, что происходит и в какой срок
            </p>

            <div className="mt-7 grid grid-cols-1 gap-2.5 lg:grid-cols-12">
              {PROCESS_STEPS.map((item, idx) => (
                <article
                  key={item.step}
                  className={`flex flex-col border border-border bg-white p-4 sm:p-6 lg:min-h-[10rem] ${
                    idx === 1 || idx === 2 ? "lg:col-span-7" : "lg:col-span-5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* PNG-иконка перекрашивается в фирменный цвет через mask */}
                    <span
                      aria-hidden
                      className="-mt-[2px] h-7 w-7 shrink-0 bg-flame-ink sm:h-8 sm:w-8"
                      style={{
                        maskImage: `url(${item.icon.src})`,
                        WebkitMaskImage: `url(${item.icon.src})`,
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                      }}
                    />
                    <div>
                      <h4 className="max-w-[20rem] text-[15px] font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-lg lg:text-xl">
                        {item.title}
                      </h4>
                      <p className="mt-2 max-w-[28rem] text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <LeadDialog
                source="process-steps"
                triggerLabel="Отправить ТЗ"
                triggerVariant="accent"
                triggerSize="lg"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ============ СЕРВИСНЫЙ ЦЕНТР — полоса с параллаксом ============ */}
      {/* Фон закреплён (bg-fixed), текст едет поверх — приём с референса
          medcomp.ru. На мобильных фон обычный: iOS Safari фиксированный
          background не поддерживает и рисует его рывками. */}
      <section
        className="relative border-b guide-border bg-ink bg-cover bg-no-repeat bg-scroll md:bg-fixed"
        style={{
          backgroundImage: "url('/images/home-v2/service-parallax.webp')",
          backgroundPosition: "center calc(50% + 6rem)",
        }}
      >
        {/* Вуаль под текст: слева плотная, справа отпускает — там на снимке
            инженер у аппарата. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--ink)/0.94)_0%,hsl(var(--ink)/0.82)_42%,hsl(var(--ink)/0.35)_100%)]"
        />

        <div className="container relative py-16 md:py-24">
          <div className="reveal max-w-[40rem]">
            <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[1.8rem] md:text-[2.1rem]">
              Собственный сервисный центр
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-muted md:text-base">
              Профиль обслуживания: реанимационное оборудование, диагностика
              (УЗИ, рентген, эндоскопия), хирургия, лабораторное оборудование,
              стерилизаторы. Сообщите модель — подтвердим, готовы ли взять
              оборудование на сопровождение
            </p>

            <div className="mt-10 space-y-8">
              {SERVICE_STEPS.map((item, idx) => (
                <article key={item.title} className="flex items-start gap-5">
                  <span
                    aria-hidden="true"
                    className="font-heading text-3xl font-semibold leading-none text-flame md:text-4xl"
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold tracking-tight text-white">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-ink-muted">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {SERVICE_CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-6 text-white/85"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-flame" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <LeadDialog
                source="service-home"
                triggerLabel="Запросить сервис"
                triggerVariant="accent"
                triggerSize="lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= 02 — НАШИ КЛИЕНТЫ ================= */}
      {clients.length > 0 ? (
        <section className="rails border-y guide-border bg-surface/60">
          {/* Засечки на обеих кромках: сверху — стык с блоком городов,
              снизу — с отзывами. */}
          <div className="marks marks-t container py-14 md:py-16">
            <div className="reveal flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-4">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
                Наши клиенты
              </h2>
              <Link
                href="/works"
                className="inline-flex items-center text-sm font-medium text-foreground underline decoration-foreground/25 decoration-1 underline-offset-4 transition-colors hover:text-foreground/75 hover:decoration-foreground/60"
              >
                Все работы
              </Link>
            </div>

            <div className="reveal mt-8">
              <ClientCarousel clients={clients} />
            </div>
          </div>
        </section>
      ) : null}

      {/* ================= 03 — ОТЗЫВЫ ================= */}
      {reviews.length > 0 ? (
        <section className="rails border-b guide-border">
          <div className="marks container py-14 md:py-16">
            <div className="reveal flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-4">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
                Отзывы о нашей работе
              </h2>
              <Link
                href="/reviews"
                className="inline-flex items-center text-sm font-medium text-foreground underline decoration-foreground/25 decoration-1 underline-offset-4 transition-colors hover:text-foreground/75 hover:decoration-foreground/60"
              >
                Все отзывы
              </Link>
            </div>

            <div className="reveal mt-8">
              <ReviewCarousel
                reviews={reviews.map((review) => ({
                  id: review.id,
                  authorName: review.authorName,
                  position: review.position,
                  organization: review.organization,
                  city: review.city,
                  text: review.text,
                  imageUrl: review.imageUrl,
                  publishedAt: formatReviewDate(review.publishedAt),
                }))}
              />
            </div>
          </div>
        </section>
      ) : null}

      <HomeFaq />

      {/* ================= 04 — БЛОГ ================= */}
      {blogPosts.length > 0 ? (
        <section className="rails border-b guide-border">
          <div className="marks container py-14 md:py-16">
            <div className="reveal flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-4">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
                Статьи по медтехнике
              </h2>
              <Link
                href="/blog"
                className="inline-flex items-center text-sm font-medium text-foreground underline decoration-foreground/25 decoration-1 underline-offset-4 transition-colors hover:text-foreground/75 hover:decoration-foreground/60"
              >
                Все статьи
              </Link>
            </div>

            <div className="reveal mt-8">
              <PostCarousel
                posts={blogPosts.map((post) => ({
                  slug: post.slug,
                  title: post.title,
                  excerpt: post.excerpt,
                  coverUrl: post.coverUrl,
                  publishedAt: post.publishedAt
                    ? formatBlogDate(post.publishedAt)
                    : null,
                  publishedAtIso: post.publishedAt?.toISOString() ?? null,
                }))}
              />
            </div>
          </div>
        </section>
      ) : null}


      <JsonLd data={medicalBusinessHomeSchema(settings)} />
      <JsonLd data={webSiteSchema()} />
      <JsonLd data={faqPageSchema(HOME_FAQ)} />
    </>
  );
}
