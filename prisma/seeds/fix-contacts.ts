import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const REAL_EMAIL = "info@erfolgmt.ru";
const REAL_PHONE = "+7 928 895 70 70";

async function main() {
  await db.setting.upsert({
    where: { key: "contacts.email" },
    update: { value: REAL_EMAIL },
    create: { key: "contacts.email", value: REAL_EMAIL },
  });

  await db.setting.upsert({
    where: { key: "contacts.phone" },
    update: { value: REAL_PHONE },
    create: { key: "contacts.phone", value: REAL_PHONE },
  });

  await db.setting.upsert({
    where: { key: "email.notify_to" },
    update: { value: REAL_EMAIL },
    create: { key: "email.notify_to", value: REAL_EMAIL },
  });

  const offices = [
    {
      address: "364031, г. Грозный, ул. Мичурина, 98",
      city: "Грозный",
      phone: REAL_PHONE,
      email: REAL_EMAIL,
      hours: "Пн–Пт 09:00–18:00",
      lat: 43.3168,
      lng: 45.6981,
    },
  ];
  await db.setting.upsert({
    where: { key: "contacts.offices" },
    update: { value: offices },
    create: { key: "contacts.offices", value: offices },
  });

  console.log("✅ Контакты в БД обновлены на реальные:");
  console.log("  • contacts.email   = " + REAL_EMAIL);
  console.log("  • contacts.phone   = " + REAL_PHONE);
  console.log("  • email.notify_to  = " + REAL_EMAIL);
  console.log("  • contacts.offices = 1 офис (Грозный, Мичурина 98)");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
