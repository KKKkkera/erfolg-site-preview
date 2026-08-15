import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const settings = await db.setting.findMany({
    where: { key: { startsWith: "contacts." } },
    orderBy: { key: "asc" },
  });
  for (const s of settings) {
    console.log(s.key, "=", JSON.stringify(s.value));
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
