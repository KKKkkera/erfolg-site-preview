/**
 * Снятие демонстрационных данных перед публикацией.
 *
 * Запуск: `npm run db:clear:demo`
 *
 * Зачем: демо-товары попали в базу сидером, минуя zod-валидацию формы
 * товара, поэтому у них статус ACTIVE без номера регистрационного
 * удостоверения. Сайт при этом обещает «номер РУ в карточке товара»
 * на главной, в каталоге, на /licenses и в пользовательском соглашении.
 * Если такие карточки уедут в прод, обещание будет нарушено на каждом товаре.
 *
 * Скрипт не удаляет товары, а переводит их в DRAFT: черновик не виден на
 * сайте, но остаётся в админке как образец заполнения карточки. Заодно
 * чистятся демо-заявки и демо-отзывы.
 *
 * Флаг --purge удаляет демо-товары полностью.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const purge = process.argv.includes("--purge");

async function main() {
  const activeWithoutReg = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ regNumber: null }, { regNumber: "" }],
    },
    select: { id: true, slug: true, name: true },
  });

  if (activeWithoutReg.length === 0) {
    console.log("✓ Опубликованных товаров без номера РУ нет.");
  } else {
    console.log(
      `Найдено ${activeWithoutReg.length} опубликованных товаров без номера РУ:`,
    );
    for (const p of activeWithoutReg) console.log(`  · ${p.slug} — ${p.name}`);

    const ids = activeWithoutReg.map((p) => p.id);
    if (purge) {
      await db.product.deleteMany({ where: { id: { in: ids } } });
      console.log(`✓ Удалено товаров: ${ids.length}`);
    } else {
      await db.product.updateMany({
        where: { id: { in: ids } },
        data: { status: "DRAFT" },
      });
      console.log(`✓ Переведено в DRAFT: ${ids.length}`);
    }
  }

  const demoEmail = { contains: "example.invalid" };
  const [q, s, c] = await Promise.all([
    db.quoteRequest.deleteMany({ where: { email: demoEmail } }),
    db.serviceRequest.deleteMany({ where: { email: demoEmail } }),
    db.contactRequest.deleteMany({ where: { email: demoEmail } }),
  ]);
  console.log(
    `✓ Демо-заявки удалены: КП ${q.count}, сервис ${s.count}, контакт ${c.count}`,
  );
}

main()
  .catch((err) => {
    console.error("✗ ошибка:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
