import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

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
  const detailHref = `/catalog/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors duration-200 hover:border-primary active:border-primary-dark has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div className="relative aspect-square overflow-hidden border-b border-border/40 bg-white">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 45vw"
          className="object-contain p-4 sm:p-5"
          unoptimized={imageUrl.endsWith(".svg")}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-4">
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

        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground sm:text-[15px]">
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

        {/* -mx-4 px-4: линия идёт от края до края карточки, а не обрывается
            в поле отступа. Тон еле заметный — это разделитель, не рамка. */}
        <div className="-mx-3 mt-auto flex items-center justify-between border-t border-border/40 px-3 pt-2.5 sm:-mx-4 sm:px-4">
          {/* Ссылка не в акцентном цвете: в сетке из дюжины карточек она
              перетягивала внимание с названий товаров. */}
          <span className="text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-primary sm:text-[13px]">
            Подробнее
          </span>
          <ChevronRight
            className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
}
