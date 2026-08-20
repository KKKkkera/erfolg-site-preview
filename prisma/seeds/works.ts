import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

const db = new PrismaClient();

/**
 * Заказчики ООО «Эрфольг» (ИНН 2014006736) по реестру государственных
 * закупок: количество контрактов и суммы взяты из открытых карточек
 * компании (rusprofile, list-org, июль 2026). Состав работ описан в общем
 * виде — предмет контрактов сформулирован как «поставка медицинских
 * изделий» и «ремонт и техническое обслуживание медицинской техники»,
 * детализация до конкретных аппаратов в открытых источниках отсутствует.
 *
 * Фотографии — снимки зданий соответствующих учреждений из открытых
 * публикаций СМИ; открытая лицензия на страницах источников не указана.
 * Источники и оговорка о правах — в public/images/works/CREDITS.md.
 * Заменяются в админке: /admin/works.
 */
export type WorkSeed = {
  title: string;
  organization: string;
  city: string;
  category: string;
  summary: string;
  imageUrl: string;
  sort: number;
};

export const WORKS: WorkSeed[] = [
  {
    title: "Оснащение операционных и сервис оборудования",
    organization: "ГБУ «РКБ им. А.А. Кадырова»",
    city: "Грозный",
    category: "Поставка · Сервис",
    summary:
      "Крупнейший заказчик компании: 12 контрактов по 44-ФЗ на 71,3 млн ₽. Поставка медицинских изделий для операционных и профильных отделений, монтаж и пуско-наладка на объекте, дальнейшее техническое обслуживание парка техники.",
    imageUrl: "/images/works/rkb-kadyrova-building.webp",
    sort: 10,
  },
  {
    title: "Обслуживание радиологической и диагностической техники",
    organization: "ГБУ «РКЦОИР» — Республиканский клинический центр онкологии и радиологии",
    city: "Грозный",
    category: "Сервис · Поставка",
    summary:
      "10 контрактов на 61,6 млн ₽. Поставка изделий и работы по ремонту и техническому обслуживанию медицинской радиационной, диагностической и терапевтической техники — включая оборудование лучевой терапии.",
    imageUrl: "/images/works/rkcoir-building.webp",
    sort: 20,
  },
  {
    title: "Оборудование для родильных залов и отделений новорождённых",
    organization: "ГБУ «Республиканский перинатальный центр»",
    city: "Грозный",
    category: "Поставка · Монтаж",
    summary:
      "8 контрактов на 33,5 млн ₽. Поставка медицинских изделий для родовспоможения и выхаживания новорождённых, ввод в эксплуатацию и обучение персонала правилам эксплуатации.",
    imageUrl: "/images/works/perinatal-center-building.webp",
    sort: 30,
  },
  {
    title: "Диагностика и сервисное сопровождение ведомственной медсанчасти",
    organization: "ФКУЗ «МСЧ МВД России по Чеченской Республике»",
    city: "Грозный",
    category: "Поставка · Сервис",
    summary:
      "17 контрактов на 29,3 млн ₽. Поставка диагностического оборудования и регулярное техническое обслуживание действующего парка медицинской техники медсанчасти.",
    imageUrl: "/images/works/mvd-mschast-building.webp",
    sort: 40,
  },
  {
    title: "Лабораторное и диагностическое оснащение поликлиники",
    organization: "ГБУ «Поликлиника № 2 г. Грозного»",
    city: "Грозный",
    category: "Поставка · Сервис",
    summary:
      "19 контрактов на 28,2 млн ₽ — самая длинная серия закупок. Лабораторное и диагностическое оборудование, расходные материалы, плановое ТО и ремонт по заявке.",
    imageUrl: "/images/works/poliklinika-2-building.webp",
    sort: 50,
  },
  {
    title: "Сервис тяжёлой диагностической техники стационара",
    organization: "ГБУ «РКБСМП им. У.И. Ханбиева»",
    city: "Грозный",
    category: "Сервис",
    summary:
      "Поставка медицинских изделий и обслуживание оборудования приёмного отделения и отделений интенсивной терапии: ремонт по заявке, плановое ТО, поставка запчастей и расходных материалов.",
    imageUrl: "/images/works/rkbsmp-khanbieva-building.webp",
    sort: 60,
  },
];

export async function seedWorks(client: PrismaClient = db): Promise<number> {
  let count = 0;
  for (const work of WORKS) {
    /* Ключ — заказчик: у одной организации в блоке одна карточка, повторный
       прогон сида обновляет её, а не плодит дубли. */
    const existing = await client.work.findFirst({
      where: { organization: work.organization },
      select: { id: true },
    });

    if (existing) {
      await client.work.update({
        where: { id: existing.id },
        data: { ...work, isPublished: true },
      });
    } else {
      await client.work.create({ data: { ...work, isPublished: true } });
    }
    count += 1;
  }
  return count;
}

async function main() {
  const count = await seedWorks();
  console.log(`✅ Загружено ${count} работ:`);
  for (const work of WORKS) console.log(`   • ${work.organization}`);
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .then(() => db.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await db.$disconnect();
      process.exit(1);
    });
}
