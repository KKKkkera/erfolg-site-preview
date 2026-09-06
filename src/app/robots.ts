import type { MetadataRoute } from "next";

import { SEO_BLOCK_INDEX } from "@/lib/feature-flags";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru";

export default function robots(): MetadataRoute.Robots {
  // Crawling must remain possible so bots can read the noindex metadata.
  if (SEO_BLOCK_INDEX) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
