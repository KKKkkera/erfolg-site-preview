import { PrismaClient } from "@prisma/client";

import { BRAND_CATALOG } from "../../src/lib/brand-catalog";

export const BRANDS = BRAND_CATALOG;

export async function seedBrands(db: PrismaClient): Promise<number> {
  for (const brand of BRANDS) {
    await db.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        country: brand.country,
        website: brand.website ?? null,
        logo: brand.logo ?? null,
        sort: brand.sort,
      },
      create: {
        slug: brand.slug,
        name: brand.name,
        country: brand.country,
        website: brand.website ?? null,
        logo: brand.logo ?? null,
        sort: brand.sort,
      },
    });
  }
  return BRANDS.length;
}

if (require.main === module) {
  const db = new PrismaClient();
  seedBrands(db)
    .then((count) => console.log(`✓ brands seeded: ${count}`))
    .catch((error) => {
      console.error("✗ brands seed failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
