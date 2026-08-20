import type { Metadata } from "next";

import { SEO_BLOCK_INDEX } from "@/lib/feature-flags";
import { hasRealRegNumber } from "@/lib/reg-number";
import { siteConfig } from "@/lib/site-config";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url ?? "https://erfolgmt.ru";

export type DefaultMetadataInput = {
  title: string;
  description?: string;
  /** Path относительно корня, начинается с / */
  path?: string;
  /** Абсолютный URL картинки или путь от корня */
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

function abs(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const DEFAULT_DESCRIPTION = siteConfig.description;
const DEFAULT_OG_IMAGE = "/opengraph-image";

/**
 * Снимает бренд в конце заголовка: суффикс « | Erfolg» добавляет шаблон
 * title в root layout, и если он уже вписан в SEO-поле руками, в выдачу
 * уходит «… | Erfolg | Erfolg» — плюс лишние символы в и без того
 * обрезаемом заголовке. Ждать дисциплины от контент-менеджера тут нельзя:
 * поле называется «SEO-заголовок», дописать бренд — естественный порыв.
 */
const BRAND_SUFFIX = /\s*[|–—-]\s*(erfolg|эрфольг)\s*$/i;

export function stripBrandSuffix(title: string): string {
  let out = title.trim();
  // while, а не if: встречается и двойной суффикс.
  while (BRAND_SUFFIX.test(out)) {
    out = out.replace(BRAND_SUFFIX, "").trim();
  }
  return out || title.trim();
}

export function defaultMetadata(input: DefaultMetadataInput): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    image = DEFAULT_OG_IMAGE,
    type = "website",
    noindex = false,
  } = input;

  const ogImage = abs(image);
  const cleanTitle = stripBrandSuffix(title);

  return {
    title: cleanTitle,
    description,
    alternates: {
      canonical: path,
      languages: { "ru-RU": path },
    },
    // SEO_BLOCK_INDEX здесь обязателен: метаданные страницы перекрывают
    // root layout, поэтому безусловный index:true раньше затирал noindex,
    // выставленный в layout, и «тихий режим» разрешал индексацию.
    robots:
      noindex || SEO_BLOCK_INDEX
        ? { index: false, follow: false, nocache: true }
        : { index: true, follow: true },
    // В og/twitter бренд тоже снят: он уже передан отдельным полем siteName,
    // дублировать его в заголовке карточки незачем.
    openGraph: {
      type,
      title: cleanTitle,
      description,
      url: abs(path),
      siteName: siteConfig.name,
      locale: "ru_RU",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description,
      images: [ogImage],
    },
  };
}

type ProductLike = {
  slug: string;
  name: string;
  shortDesc?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  regNumber?: string | null;
  brand?: { name: string } | null;
  category?: { slug: string; name: string } | null;
  images?: { url: string; alt?: string | null }[];
};

export function productMetadata(product: ProductLike): Metadata {
  const fallbackTitle = product.name;
  // Про РУ в описании — только если номер реально заполнен: фолбэк раньше
  // обещал «регистрационное удостоверение, гарантия производителя» и для
  // позиций без номера.
  const regClause = hasRealRegNumber(product.regNumber)
    ? ` Регистрационное удостоверение Росздравнадзора № ${product.regNumber}.`
    : "";
  const fallbackDesc =
    product.shortDesc ??
    `${product.name}${product.brand?.name ? ` (${product.brand.name})` : ""} — поставка по России.${regClause} Цена по запросу, КП в течение рабочего дня.`;
  const path = `/catalog/${product.slug}`;
  const firstImage = product.images?.[0]?.url;
  // SVG в og:image не понимают Telegram/WhatsApp/VK — для схематичных
  // иллюстраций каталога отдаём дефолтную OG-картинку.
  const ogImage =
    firstImage && !firstImage.toLowerCase().endsWith(".svg")
      ? firstImage
      : undefined;
  return defaultMetadata({
    title: product.seoTitle ?? fallbackTitle,
    description: product.seoDesc ?? fallbackDesc,
    path,
    image: ogImage,
  });
}
