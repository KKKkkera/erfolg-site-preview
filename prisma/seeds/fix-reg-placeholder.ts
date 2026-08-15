import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const result = await db.product.updateMany({
    where: { regNumber: "РУ Росздравнадзора уточняется при оформлении КП" },
    data: { regNumber: "На уточнении" },
  });
  console.log(`✅ Обновлено товаров: ${result.count}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
