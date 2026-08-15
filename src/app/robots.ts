import type { MetadataRoute } from "next";

import { SEO_BLOCK_INDEX } from "@/lib/feature-flags";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru";

export default function robots(): MetadataRoute.Robots {
  // SEO_BLOCK_INDEX охватывает: FORMS_DISABLED (maintenance) +
  // явный NEXT_PUBLIC_SEO_BLOCK_INDEX=true (dev/staging).
  if (SEO_BLOCK_INDEX) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/search"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
