import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { RegBadge } from "@/components/public/reg-badge";
import { hasRealRegNumber } from "@/lib/reg-number";

type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  model?: string | null;
  sku?: string | null;
  regNumber?: string | null;
  isUsed?: boolean;
  brand?: { name: string } | null;
  category?: { slug: string; name: string } | null;
  images?: { url: string; alt?: string | null }[];
};

/**
 * Карточка товара для сетки каталога — «строка спецификации»:
 * hairline-рамка, mono-метаданные, РУ-бейдж, стрелка-CTA.
 * Кликабельна целиком: ссылка-заголовок растянута на всю карточку
 * (::after поверх article) — одна ссылка на карточку, без дублей для SR.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images?.[0];
  const imageUrl = image?.url || "/placeholder-product.svg";
  const imageAlt =
    image?.alt ||
    `${product.name}${product.model ? ` — ${product.model}` : ""}`;
  const detailHref = product.category
    ? `/catalog/${product.category.slug}/${product.slug}`
    : `/catalog/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-primary/60 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring">
      <div className="relative aspect-square overflow-hidden border-b border-border bg-white">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain p-5"
          unoptimized={imageUrl.endsWith(".svg")}
        />
        {product.isUsed ? (
          <span className="absolute left-3 top-3 rounded-sm bg-warning px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-warning-foreground">
            Б/У
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {product.brand?.name || product.model ? (
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {product.brand?.name ? <span>{product.brand.name}</span> : null}
            {product.model ? (
              <span className="normal-case tracking-normal text-foreground/60">
                {product.model}
              </span>
            ) : null}
          </div>
        ) : null}

        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          <Link
            href={detailHref}
            className="transition-colors after:absolute after:inset-0 after:z-[1] after:content-[''] hover:text-primary focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>

        {hasRealRegNumber(product.regNumber) ? (
          <div>
            <RegBadge product={{ regNumber: product.regNumber }} compact />
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-medium text-primary">Подробнее</span>
          <ArrowRight
            className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
}
