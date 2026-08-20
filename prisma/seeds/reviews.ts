import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

const db = new PrismaClient();

/**
 * ЗАГЛУШКИ. Это сканы чужих благодарственных писем — они адресованы другой
 * организации и стоят здесь только чтобы наполнить блок отзывов на превью.
 * Перед запуском заменить на письма, полученные компанией: тексты и сканы
 * заводятся в админке (/admin/reviews).
 */
export type ReviewSeed = {
  authorName: string;
  position: string | null;
  organization: string;
  city: string | null;
  text: string;
  imageUrl: string;
  publishedAt: Date;
  sort: number;
};

export const REVIEWS: ReviewSeed[] = [
  {
    authorName: "Сашко В. Н.",
    position: "директор",
    organization: "ООО Фирма «АЛЕНА»",
    city: "Москва",
    text: `ООО Фирма «АЛЕНА», в лице Директора Сашко Валерия Николаевича, выражает признательность и искреннюю благодарность за оказанные услуги, индивидуальный подход и высокое качество работы, профессионализм каждого сотрудника. Весь наш коллектив ценит Вашу помощь и содействие. Желаем Вам процветания, осуществления всех планов и высоких профессиональных достижений.

Сеть наших стоматологических клиник ООО Фирма «АЛЕНА» трудится в сфере медицинских услуг более 30 лет, и мы умеем оценивать уровень профессионализма наших партнёров.`,
    imageUrl: "/images/reviews/alena-2023.png",
    publishedAt: new Date("2023-06-19"),
    sort: 10,
  },
  {
    authorName: "Роженко Т. В.",
    position: "генеральный директор",
    organization: "ООО «ЛОТОС», клиника BIORISE",
    city: "Владивосток",
    text: `От имени коллектива выражаю Вам искреннюю благодарность за плодотворное сотрудничество, за предоставленную возможность качественно и в срок получать значимые знания и навыки через использование широкого спектра современных технологий без отрыва от профессиональной деятельности.`,
    imageUrl: "/images/reviews/biorise-lotos-2023.png",
    publishedAt: new Date("2023-06-16"),
    sort: 20,
  },
  {
    authorName: "Кожемякин М. Д.",
    position: "руководитель",
    organization: "ООО «Нова Дент»",
    city: "Рыбинск",
    text: `ООО «Нова Дент» благодарит за содействие и помощь в организации работы с нашими сотрудниками. Выражаем слова искренней признательности за профессионализм, оперативность и доброжелательность.`,
    imageUrl: "/images/reviews/nova-dent-2023.png",
    publishedAt: new Date("2023-06-19"),
    sort: 30,
  },
];

export async function seedReviews(): Promise<number> {
  let count = 0;
  for (const review of REVIEWS) {
    const existing = await db.review.findFirst({
      where: { imageUrl: review.imageUrl },
      select: { id: true },
    });

    if (existing) {
      await db.review.update({
        where: { id: existing.id },
        data: { ...review, isPublished: true },
      });
    } else {
      await db.review.create({ data: { ...review, isPublished: true } });
    }
    count += 1;
  }
  return count;
}

async function main() {
  const count = await seedReviews();
  console.log(`✅ Загружено ${count} отзывов-заглушек:`);
  for (const review of REVIEWS) console.log(`   • ${review.organization}`);
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
