/* Заливка шаблонных страниц по всем регионам.

   Структура повторяет вручную собранную страницу Амурской области: цифры →
   товары → бренды → доставка → монтаж и сервис → FAQ → CTA. Меняется только
   название региона (в нужном падеже) — города и прочая конкретика в шаблон
   не идут, их дописывают руками в /admin/regions.

   Уже заполненные страницы скрипт не трогает: --force перезаписывает всё,
   --only=slug,slug ограничивает список.

   Запуск: npx tsx scripts/seed-region-pages.ts [--force] [--only=a,b]        */

import { PrismaClient } from "@prisma/client";

import { RUSSIA_REGIONS } from "../src/components/public/russia-map-regions";
import { declineRegion } from "./decline-region";

const db = new PrismaClient();

function buildPage(name: string) {
  const prep = declineRegion(name, "prep");
  const acc = declineRegion(name, "acc");

  const heading = `Медицинское оборудование в ${prep} — поставка, монтаж и сервис`;

  const intro =
    `Поставляем оборудование для реанимации, диагностики и операционных в ` +
    `больницы и клиники в ${prep}. Работаем по 44-ФЗ и 223-ФЗ, всё ` +
    `оборудование с регистрационными удостоверениями. Пришлите спецификацию — ` +
    `подготовим предложение со сроком и ценой.`;

  const content = [
    `[[block:stats value1="5–14 дней" label1="срок поставки в регион" value2="12" label2="лет на рынке" value3="ТОМИ" label3="лицензия на сервис" value4="44-ФЗ" label4="работаем по госзакупкам"]]`,

    `<h2>Что поставляем в ${acc}</h2>
<p>Реанимация и интенсивная терапия, диагностика, хирургия и операционная, лабораторное оборудование. Подбираем позиции под техническое задание заказчика и готовим спецификацию с обоснованием НМЦК.</p>`,

    `[[block:products title="Популярные позиции" limit="6" href="/catalog"]]`,

    `<h2>Бренды, которые поставляем</h2>
<p>Работаем напрямую с производителями и их официальными дистрибьюторами — это подтверждённая гарантия и доступность запчастей на весь срок службы.</p>`,

    `[[block:brands]]`,

    `<h2>Сроки и доставка</h2>
<p>Крупные поставки в ${acc} везём транспортными компаниями, срочные позиции отправляем ускоренной доставкой. Способ и срок фиксируем в договоре.</p>`,

    `<h2>Монтаж и сервисное обслуживание</h2>
<p>Инженер выезжает в ${acc} для пусконаладки, обучения персонала и планового технического обслуживания. У компании есть лицензия на техническое обслуживание медицинских изделий, поэтому сервис не нужно заказывать у третьих лиц.</p>
<ul>
<li>Пусконаладка и ввод в эксплуатацию на площадке заказчика</li>
<li>Обучение персонала работе с оборудованием</li>
<li>Гарантийный и постгарантийный ремонт</li>
<li>Плановое ТО по графику и поставка расходных материалов</li>
</ul>`,

    `[[block:faq]]`,

    `[[block:posts title="Статьи по медтехнике" limit="3"]]`,

    `[[block:cta title="Нужно КП для вашего учреждения?" text="Пришлите спецификацию или техническое задание — подготовим предложение со сроком поставки и ценой" button="Отправить ТЗ"]]`,
  ].join("\n");

  return {
    heading,
    intro,
    content,
    seoTitle: `Медицинское оборудование в ${prep} — поставка и сервис | Эрфольг`,
    seoDesc:
      `Поставка медицинского оборудования в ${acc}: реанимация, диагностика, ` +
      `хирургия, лаборатория. Работа по 44-ФЗ и 223-ФЗ, монтаж, обучение ` +
      `персонала и сервисное обслуживание.`,
    isPublished: true,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg
    ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()))
    : null;

  const existing = new Set(
    (await db.regionPage.findMany({ select: { slug: true } })).map((r) => r.slug),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const region of RUSSIA_REGIONS) {
    if (only && !only.has(region.slug)) continue;

    if (existing.has(region.slug) && !force) {
      skipped += 1;
      continue;
    }

    const payload = buildPage(region.name);
    if (existing.has(region.slug)) {
      await db.regionPage.update({ where: { slug: region.slug }, data: payload });
      updated += 1;
    } else {
      await db.regionPage.create({ data: { slug: region.slug, ...payload } });
      created += 1;
    }
  }

  console.log(
    `regions: ${RUSSIA_REGIONS.length}, created ${created}, updated ${updated}, skipped ${skipped}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
