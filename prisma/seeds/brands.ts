import { PrismaClient } from "@prisma/client";

/**
 * Список основных производителей медицинской техники, представленных
 * на российском рынке. Слаги — латинизированные, без диакритики.
 * Используется как стартовый набор брендов в каталоге; заказчик может
 * редактировать/удалять/добавлять через `/admin/brands`.
 *
 * Запуск:
 *   - вручную: `npm run db:seed:brands`
 *   - либо в составе общего сидера (см. prisma/seed.ts).
 *
 * Upsert по slug — повторный запуск не создаёт дубликатов.
 */

export const BRANDS: Array<{
  slug: string;
  name: string;
  country: string;
  website?: string;
}> = [
  // ── Топ-импорт (Европа/США/Япония) ──
  { slug: "philips", name: "Philips Healthcare", country: "Нидерланды", website: "https://www.philips.com/healthcare" },
  { slug: "ge-healthcare", name: "GE HealthCare", country: "США", website: "https://www.gehealthcare.com" },
  { slug: "siemens-healthineers", name: "Siemens Healthineers", country: "Германия", website: "https://www.siemens-healthineers.com" },
  { slug: "draeger", name: "Dräger", country: "Германия", website: "https://www.draeger.com" },
  { slug: "olympus", name: "Olympus", country: "Япония", website: "https://www.olympus-global.com" },
  { slug: "karl-storz", name: "Karl Storz", country: "Германия", website: "https://www.karlstorz.com" },
  { slug: "stryker", name: "Stryker", country: "США", website: "https://www.stryker.com" },
  { slug: "canon-medical", name: "Canon Medical Systems", country: "Япония", website: "https://global.medical.canon" },
  { slug: "hitachi", name: "Hitachi Medical", country: "Япония" },
  { slug: "samsung-medison", name: "Samsung Medison", country: "Республика Корея", website: "https://www.samsunghealthcare.com" },
  { slug: "fukuda-denshi", name: "Fukuda Denshi", country: "Япония", website: "https://www.fukuda.co.jp" },
  { slug: "getinge", name: "Getinge / Maquet", country: "Швеция", website: "https://www.getinge.com" },
  { slug: "nihon-kohden", name: "Nihon Kohden", country: "Япония", website: "https://www.nihonkohden.com" },
  { slug: "schiller", name: "Schiller AG", country: "Швейцария", website: "https://www.schiller.ch" },
  { slug: "hamilton-medical", name: "Hamilton Medical", country: "Швейцария", website: "https://www.hamilton-medical.com" },
  { slug: "erbe", name: "Erbe Elektromedizin", country: "Германия", website: "https://www.erbe-med.com" },
  { slug: "b-braun", name: "B. Braun", country: "Германия", website: "https://www.bbraun.com" },
  { slug: "fresenius", name: "Fresenius Medical Care", country: "Германия", website: "https://www.freseniusmedicalcare.com" },
  { slug: "medtronic", name: "Medtronic", country: "Ирландия / США", website: "https://www.medtronic.com" },
  { slug: "welch-allyn", name: "Welch Allyn (Hillrom)", country: "США", website: "https://www.hillrom.com" },
  { slug: "riester", name: "Riester", country: "Германия", website: "https://www.riester.de" },
  { slug: "smiths-medical", name: "Smiths Medical", country: "Великобритания", website: "https://www.smiths-medical.com" },
  { slug: "spacelabs", name: "Spacelabs Healthcare", country: "США", website: "https://www.spacelabshealthcare.com" },
  { slug: "roche-diagnostics", name: "Roche Diagnostics", country: "Швейцария", website: "https://diagnostics.roche.com" },
  { slug: "sysmex", name: "Sysmex", country: "Япония", website: "https://www.sysmex.com" },

  // ── Доступный сегмент (Китай/Индия) ──
  { slug: "mindray", name: "Mindray", country: "Китай", website: "https://www.mindray.com" },
  { slug: "edan", name: "Edan Instruments", country: "Китай", website: "https://www.edan.com" },
  { slug: "bpl-medical", name: "BPL Medical Technologies", country: "Индия", website: "https://www.bplmedicaltechnologies.com" },
  { slug: "contec", name: "CONTEC Medical Systems", country: "Китай", website: "https://www.contecmed.com" },

  // ── Российские производители ──
  { slug: "uomz", name: "Уральский оптико-механический завод (УОМЗ)", country: "Россия" },
  { slug: "altonika", name: "Альтоника", country: "Россия" },
  { slug: "triton-electronics", name: "Тритон-ЭлектроникС", country: "Россия" },
  { slug: "ramenskoe-pribor", name: "Раменский приборостроительный завод (РПЗ)", country: "Россия" },
  { slug: "elatma", name: "Еламед / Елатомский приборный завод", country: "Россия" },
  { slug: "kazmedpribor", name: "Казанский медико-инструментальный завод", country: "Россия" },
];

export async function seedBrands(db: PrismaClient): Promise<number> {
  for (const b of BRANDS) {
    await db.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, country: b.country, website: b.website ?? null },
      create: { slug: b.slug, name: b.name, country: b.country, website: b.website ?? null },
    });
  }
  return BRANDS.length;
}

// CLI-режим: `tsx prisma/seeds/brands.ts`
if (require.main === module) {
  const db = new PrismaClient();
  seedBrands(db)
    .then((n) => {
      console.log(`✓ brands seeded: ${n}`);
    })
    .catch((err) => {
      console.error("✗ brands seed failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
