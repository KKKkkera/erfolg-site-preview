import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { RegionCoverage } from "@/components/public/region-coverage";
import { DeliveryCities } from "@/components/public/delivery-cities";
import { HomeFaq } from "@/components/public/home-faq";
import { BrandStrip } from "@/components/public/brand-strip";
import { LeadDialog } from "@/components/public/lead-dialog";
import { Stat } from "@/components/public/decor";
import { ProductCard } from "@/components/public/product-card";
import { loadBrandStrip } from "@/lib/load-brand-strip";
import { loadBlockProducts, type BlockProduct } from "@/lib/load-block-products";
import { loadBlockPosts } from "@/lib/load-block-posts";
import { PostCarousel, type PostCard } from "@/components/public/post-carousel";
import { parseContentBlocks } from "@/lib/parse-content-blocks";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms";

/* Рендер контента со стандартными блоками.

   HTML-куски идут через тот же sanitizeCmsHtml и с той же типографикой prose,
   что и раньше, — вставка блоков не меняет вид уже написанного текста.
   Блок рендерится настоящим компонентом, поэтому карта, аккордеон и форма
   работают так же, как на главной. */

const PROSE_CLASS =
  "prose prose-slate max-w-none text-foreground prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:marker:text-flame-ink";

type Props = {
  content: string;
  /** Прокидывается в форму заявки, чтобы в заявке был виден источник. */
  leadSource: string;
  className?: string;
};

export async function ContentBlocks({ content, leadSource, className }: Props) {
  const segments = parseContentBlocks(content);
  if (segments.length === 0) return null;

  // Ленту брендов грузим один раз и только если блок реально вставлен.
  const needsBrands = segments.some(
    (s) => s.kind === "block" && s.type === "brands",
  );
  const brands = needsBrands ? await loadBrandStrip() : [];

  /* Товары грузим по одному запросу на каждый вставленный блок: у блоков
     разный отбор (категория/бренд/лимит), поэтому общего списка тут нет.
     Ключ — позиция сегмента, она же используется при рендере. */
  const productBlocks = segments
    .map((segment, i) => ({ segment, i }))
    .filter(({ segment }) => segment.kind === "block" && segment.type === "products");

  const postBlocks = segments
    .map((segment, i) => ({ segment, i }))
    .filter(({ segment }) => segment.kind === "block" && segment.type === "posts");

  const postsByIndex = new Map<number, PostCard[]>(
    await Promise.all(
      postBlocks.map(async ({ segment, i }) => {
        const params = segment.kind === "block" ? segment.params : {};
        return [i, await loadBlockPosts(params)] as const;
      }),
    ),
  );

  const productsByIndex = new Map<number, BlockProduct[]>(
    await Promise.all(
      productBlocks.map(async ({ segment, i }) => {
        const params = segment.kind === "block" ? segment.params : {};
        return [i, await loadBlockProducts(params)] as const;
      }),
    ),
  );

  return (
    <div className={className}>
      {segments.map((segment, i) =>
        segment.kind === "html" ? (
          <div
            key={i}
            className={PROSE_CLASS}
            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(segment.html) }}
          />
        ) : (
          <div key={i} className="not-prose my-10 first:mt-0 last:mb-0">
            <BlockView
              type={segment.type}
              params={segment.params}
              leadSource={leadSource}
              brands={brands}
              products={productsByIndex.get(i) ?? []}
              posts={postsByIndex.get(i) ?? []}
            />
          </div>
        ),
      )}
    </div>
  );
}

function BlockView({
  type,
  params,
  leadSource,
  brands,
  products,
  posts,
}: {
  type: string;
  params: Record<string, string>;
  leadSource: string;
  brands: Awaited<ReturnType<typeof loadBrandStrip>>;
  products: BlockProduct[];
  posts: PostCard[];
}) {
  switch (type) {
    case "region-coverage":
      return <RegionCoverage />;

    case "delivery-cities":
      return <DeliveryCities />;

    case "faq":
      return <HomeFaq />;

    case "brands":
      return brands.length > 0 ? <BrandStrip brands={brands} /> : null;

    case "products": {
      // Пустая выдача — не пустая секция: заголовок без карточек выглядит
      // сломанной страницей, поэтому блок исчезает целиком.
      if (products.length === 0) return null;
      const href = params.href?.trim() || "/catalog";
      return (
        <section>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-4">
            {params.title ? (
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {params.title}
              </h2>
            ) : null}
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Смотреть весь каталог
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      );
    }

    case "posts": {
      // Как и в сетке товаров: без статей блок исчезает целиком.
      if (posts.length === 0) return null;
      return (
        <section>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-4">
            {params.title ? (
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {params.title}
              </h2>
            ) : null}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Все статьи
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6">
            <PostCarousel posts={posts} />
          </div>
        </section>
      );
    }

    case "cta":
      return (
        <div className="rounded-lg border border-border bg-surface p-6 md:p-8">
          {params.title ? (
            <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {params.title}
            </h2>
          ) : null}
          {params.text ? (
            <p className="mt-3 max-w-[42rem] text-base leading-7 text-muted-foreground">
              {params.text}
            </p>
          ) : null}
          <div className="mt-6">
            <LeadDialog
              source={leadSource}
              triggerLabel={params.button || "Отправить ТЗ"}
              triggerVariant="accent"
              triggerSize="lg"
            />
          </div>
        </div>
      );

    case "stats": {
      // Пары «цифра + подпись»: показываем только заполненные.
      const items = [1, 2, 3, 4]
        .map((n) => ({
          value: params[`value${n}`]?.trim() ?? "",
          label: params[`label${n}`]?.trim() ?? "",
        }))
        .filter((item) => item.value !== "");
      if (items.length === 0) return null;
      return (
        <div className="grid gap-6 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-4">
          {items.map((item, i) => (
            <Stat key={i} value={item.value} label={item.label} />
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
