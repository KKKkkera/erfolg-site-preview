/**
 * Генераторы schema.org JSON-LD для проекта Erfolg.
 * Все функции возвращают plain object, который рендерится через <JsonLd />.
 * Устойчивы к null/undefined в полях.
 */
import { hasRealRegNumber } from "@/lib/reg-number";
import { siteConfig } from "@/lib/site-config";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url ?? "https://erfolgmt.ru";

function abs(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export type CompanySettings = {
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  legal_address?: string;
  fullName?: string;
  full_name?: string;
  legal_name?: string;
  shortName?: string;
  foundingDate?: string;
  founding_date?: string;
  director?: string;
};

export type ContactSettings = {
  phone?: string;
  email?: string;
  addressShort?: string;
  socials?: { vk?: string; tg?: string; ok?: string };
};

export type Office = {
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  lat?: number;
  lng?: number;
};

type ProductLike = {
  name: string;
  slug: string;
  shortDesc?: string | null;
  fullDesc?: string | null;
  model?: string | null;
  sku?: string | null;
  regNumber?: string | null;
  brand?: { name: string; slug?: string; website?: string | null } | null;
  category?: { name: string; slug: string } | null;
  images?: { url: string; alt?: string | null }[];
};

type SettingsBundle = {
  company?: CompanySettings;
  contacts?: ContactSettings;
};

function nonEmpty<T>(v: T | null | undefined | ""): v is T {
  return v !== null && v !== undefined && v !== "";
}

function buildSameAs(socials?: ContactSettings["socials"]): string[] {
  if (!socials) return [];
  const arr = [socials.vk, socials.tg, socials.ok].filter(nonEmpty) as string[];
  return arr;
}

/**
 * Organization + MedicalBusiness — для главной и futter.
 */
export function organizationSchema(settings?: SettingsBundle): object {
  const company = settings?.company ?? {};
  const contacts = settings?.contacts ?? {};
  const name =
    company.fullName ??
    company.full_name ??
    company.legal_name ??
    siteConfig.fullName;
  const phone = contacts.phone ?? siteConfig.contacts.phonePrimary;
  const email = contacts.email ?? siteConfig.contacts.email;
  const founded = company.foundingDate ?? company.founding_date ?? "2012-06-13";
  const sameAs = buildSameAs(contacts.socials);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Organization", "MedicalBusiness"],
    name,
    url: SITE_URL,
    logo: abs("/logo.svg"),
    description: siteConfig.description,
    foundingDate: founded,
    taxID: company.inn ?? siteConfig.legal.inn,
    vatID: company.inn ?? siteConfig.legal.inn,
  };

  const contactPoint: Record<string, unknown> = {
    "@type": "ContactPoint",
    contactType: "sales",
    availableLanguage: ["ru"],
    areaServed: "RU",
  };
  if (phone) contactPoint.telephone = phone;
  if (email) contactPoint.email = email;
  data.contactPoint = contactPoint;

  data.address = {
    "@type": "PostalAddress",
    addressCountry: "RU",
  };

  if (sameAs.length > 0) data.sameAs = sameAs;

  return data;
}

/**
 * Расширение Organization для главной с медицинской спецификой.
 */
export function medicalBusinessHomeSchema(settings?: SettingsBundle): object {
  const base = organizationSchema(settings) as Record<string, unknown>;
  return {
    ...base,
    medicalSpecialty: "MedicalEquipment",
  };
}

/**
 * LocalBusiness для отдельного офиса.
 */
export function localBusinessSchema(
  office: Office,
  settings?: SettingsBundle,
): object {
  const company = settings?.company ?? {};
  const name = company.fullName ?? siteConfig.fullName;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: office.city ? `${name} — ${office.city}` : name,
    url: SITE_URL,
  };

  if (office.address || office.city) {
    const addr: Record<string, unknown> = {
      "@type": "PostalAddress",
      addressCountry: "RU",
    };
    if (office.address) addr.streetAddress = office.address;
    if (office.city) addr.addressLocality = office.city;
    if (office.region) addr.addressRegion = office.region;
    data.address = addr;
  }

  if (office.phone) data.telephone = office.phone;
  if (office.email) data.email = office.email;

  if (office.lat != null && office.lng != null) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: office.lat,
      longitude: office.lng,
    };
  }

  if (office.hours) data.openingHours = office.hours;

  return data;
}

/**
 * Product — карточка товара.
 */
export function productSchema(product: ProductLike): object {
  const url = abs(`/catalog/${product.slug}`);
  const description =
    product.shortDesc ??
    product.fullDesc?.replace(/<[^>]+>/g, "").slice(0, 300) ??
    `${product.name} — поставка медицинского оборудования по России с регистрационным удостоверением Росздравнадзора.`;

  const images = (product.images ?? [])
    .map((i) => abs(i.url))
    .filter(nonEmpty);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    url,
  };

  if (images.length > 0) data.image = images;
  if (product.brand?.name) {
    data.brand = {
      "@type": "Brand",
      name: product.brand.name,
      ...(product.brand.website ? { url: product.brand.website } : {}),
    };
    data.manufacturer = {
      "@type": "Organization",
      name: product.brand.name,
    };
  }
  if (product.model) {
    data.model = product.model;
    data.mpn = product.model;
  }
  if (product.sku) data.sku = product.sku;
  if (product.category?.name) data.category = product.category.name;

  // Аудитория — медицинские специалисты
  data.audience = {
    "@type": "MedicalAudience",
    audienceType: "Medical professionals",
  };

  // Дополнительный тип — MedicalDevice (Google показывает медицинские иконки)
  data.additionalType = "https://schema.org/MedicalDevice";

  // Регистрационное удостоверение Росздравнадзора как additionalProperty
  if (hasRealRegNumber(product.regNumber)) {
    data.additionalProperty = [
      {
        "@type": "PropertyValue",
        name: "Регистрационное удостоверение Росздравнадзора",
        value: product.regNumber,
        propertyID: "RU-RZN",
      },
    ];
  }

  // Offer сознательно НЕ добавляем. Цена — «по запросу», а Offer без price
  // Google помечает ошибкой «Missing price» в Search Console; прежний вариант
  // вдобавок заявлял availability: InStock для позиций, поставляемых под заказ.
  // Product без offers валиден — просто не претендует на merchant-сниппет.

  return data;
}

/**
 * BreadcrumbList — массив { name, url }.
 */
export function breadcrumbListSchema(
  items: { name: string; url: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}

/**
 * BlogPosting — статья блога. Используется на /blog/[slug].
 */
export function articleSchema(input: {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  datePublished?: Date | string | null;
  dateModified?: Date | string | null;
  authorName?: string | null;
}): object {
  const iso = (d: Date | string | null | undefined) =>
    d ? new Date(d).toISOString() : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ? abs(input.imageUrl) : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(input.url) },
    url: abs(input.url),
    datePublished: iso(input.datePublished),
    dateModified: iso(input.dateModified ?? input.datePublished),
    author: {
      "@type": "Organization",
      name: input.authorName ?? siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.fullName,
      logo: {
        "@type": "ImageObject",
        url: abs("/opengraph-image"),
      },
    },
    inLanguage: "ru-RU",
  };
}

/**
 * FAQPage — для /faq и для блока FAQ внутри статьи/категории.
 * Google показывает это как rich-snippet с раскрывающимися вопросами.
 */
export function faqPageSchema(items: Array<{ q: string; a: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/**
 * ItemList / CollectionPage — для каталога и категорий.
 */
export function itemListSchema(input: {
  name: string;
  url: string;
  items: Array<{ name: string; url: string; image?: string | null }>;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: abs(input.url),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: abs(item.url),
        name: item.name,
        ...(item.image ? { image: abs(item.image) } : {}),
      })),
    },
  };
}

/**
 * Service — для /service, /delivery.
 */
export function serviceSchema(input: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  areaServed?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: abs(input.url),
    serviceType: input.serviceType,
    areaServed: input.areaServed ?? "RU",
    provider: {
      "@type": ["Organization", "MedicalBusiness"],
      name: siteConfig.fullName,
      url: SITE_URL,
      taxID: siteConfig.legal.inn,
    },
  };
}

/**
 * Organization c hasCredential для страницы /about и /licenses —
 * выводит публично номер лицензии Росздравнадзора.
 */
export function organizationWithCredentialSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "MedicalBusiness"],
    name: siteConfig.fullName,
    url: SITE_URL,
    foundingDate: "2012-06-13",
    taxID: siteConfig.legal.inn,
    address: {
      "@type": "PostalAddress",
      addressCountry: "RU",
      addressRegion: "Чеченская Республика",
      addressLocality: "Грозный",
      streetAddress: "ул. Мичурина, д. 98",
      postalCode: "364031",
    },
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "license",
        name: "Лицензия Росздравнадзора (ТОМИ)",
        identifier: siteConfig.legal.tomiNumber,
        recognizedBy: {
          "@type": "Organization",
          name: siteConfig.legal.tomiAuthority,
        },
        validFrom: "2013-08-21",
      },
    ],
  };
}

/**
 * WebSite — для главной, с SearchAction на фильтрацию каталога.
 */
export function webSiteSchema(siteUrl: string = SITE_URL): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.fullName,
    url: siteUrl,
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
