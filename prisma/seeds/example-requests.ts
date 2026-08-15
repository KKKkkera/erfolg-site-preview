import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const sampleProduct = await db.product.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  });

  await db.quoteRequest.createMany({
    data: [
      {
        productId: sampleProduct?.id,
        name: "Хасанов Ислам",
        phone: "+7 928 555 12 34",
        email: "i.khasanov@medcentr-grozny.ru",
        organization: "ГБУ «Республиканская больница №2»",
        inn: "2014123456",
        message: sampleProduct
          ? `Нужна цена и срок поставки на ${sampleProduct.name}, 2 ед. По 44-ФЗ, средства из бюджета на 2026 год. Просьба КП с НДС, гарантией и сроками монтажа.`
          : "Нужна цена и срок поставки УЗИ-аппарата экспертного класса, 2 ед. По 44-ФЗ, средства из бюджета на 2026 год.",
        consent: true,
        source: sampleProduct ? "product-page" : "home-hero",
        status: "NEW",
        ip: "95.108.213.44",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      {
        name: "Беляева Анна Сергеевна",
        phone: "+7 905 432 18 76",
        email: "belyaeva@clinic-modern.ru",
        organization: 'ООО "Современная клиника"',
        message:
          "Открываем кабинет функциональной диагностики. Нужен холтер ЭКГ + комплект расходников, желательно с обучением персонала. Бюджет до 350 тыс., готовы рассмотреть лизинг.",
        consent: true,
        source: "home-final",
        status: "IN_PROGRESS",
        ip: "176.59.92.18",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)",
      },
      {
        name: "Тагиров Руслан",
        phone: "+7 938 711 04 02",
        email: "ruslan.tagirov@mail.ru",
        organization: "ИП Тагиров Р.М.",
        inn: "201678901234",
        message:
          "Стоматологический кабинет в Махачкале. Интересует автоклав класса B на 18 литров. Срочно — открытие через 3 недели.",
        consent: true,
        source: "category-page",
        status: "NEW",
        ip: "85.140.7.221",
      },
    ],
  });

  await db.serviceRequest.createMany({
    data: [
      {
        name: "Гаджиева Заира Магомедовна",
        phone: "+7 928 100 78 45",
        email: "gadjieva@gp7-mhk.ru",
        organization: "ГБУЗ «Городская поликлиника №7»",
        equipmentName: "Аппарат УЗИ",
        manufacturer: "Mindray",
        modelName: "DC-70",
        serial: "DC70-2019-A4521",
        problem:
          "При включении не определяет конвексный датчик C5-1. Линейный работает корректно. Прошу выезд инженера на следующей неделе, плановое ТО давно не проводилось — есть смысл совместить.",
        consent: true,
        status: "NEW",
        ip: "78.155.198.30",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      {
        name: "Карпов Дмитрий",
        phone: "+7 916 220 55 91",
        email: "d.karpov@example.invalid",
        equipmentName: "Стоматологическая установка",
        manufacturer: "Anthos",
        modelName: "A6 Plus",
        problem:
          "Слышен посторонний шум в турбинном шланге, периодически пропадает подача воды на наконечник. Нужна диагностика, возможно замена шлангов.",
        consent: true,
        status: "DONE",
        ip: "188.32.45.107",
      },
    ],
  });

  await db.contactRequest.createMany({
    data: [
      {
        name: "Михеева Ольга",
        phone: "+7 962 745 33 18",
        email: "mikheeva.med@yandex.ru",
        message:
          "Здравствуйте. Подскажите, работаете ли с государственными тендерами в Воронежской области? Какие документы нужны для регистрации в качестве поставщика?",
        consent: true,
        status: "NEW",
        ip: "37.144.220.55",
      },
      {
        name: "Иванов Сергей Петрович",
        email: "ivanov@medsnab-vrn.ru",
        message:
          "Интересует возможность дилерства по линейке расходников. Готов прислать презентацию компании, обсудить условия. Спасибо.",
        consent: true,
        status: "REJECTED",
        ip: "5.166.33.144",
      },
    ],
  });

  console.log("✅ Заявки добавлены");
  console.log("  • QuoteRequest:   3 (NEW × 2, IN_PROGRESS × 1)");
  console.log("  • ServiceRequest: 2 (NEW × 1, DONE × 1)");
  console.log("  • ContactRequest: 2 (NEW × 1, REJECTED × 1)");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
