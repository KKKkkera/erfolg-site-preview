import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type ProductSeed = {
  slug: string;
  name: string;
  sku: string;
  model: string;
  brandSlug: string;
  brandName: string;
  brandCountry: string;
  categorySlug: string;
  shortDesc: string;
  fullDesc: string;
  imagePath: string;
  alt: string;
  specs: Array<{ key: string; value: string }>;
};

const PRODUCTS: ProductSeed[] = [
  {
    slug: "olympus-190-endoscopy-tower-bu",
    name: "Эндоскопическая стойка Olympus 190 series (Б/У)",
    sku: "OLY-190-BU",
    model: "EVIS EXERA III / 190",
    brandSlug: "olympus",
    brandName: "Olympus",
    brandCountry: "Япония",
    categorySlug: "diagnostics",
    shortDesc:
      "Б/У. Комплектная стойка гибкой эндоскопии Olympus EVIS EXERA III с видеопроцессором CV-190, источником света CLV-190 и медицинским монитором. После технического обслуживания и проверки.",
    fullDesc:
      "<p><strong>Состояние: бывшее в употреблении (Б/У).</strong> Комплект прошёл диагностику и тестирование инженерами компании.</p><p>Эндоскопическая стойка Olympus EVIS EXERA III серии 190 — рабочая станция для гибкой эндоскопии (гастро-, бронхо-, колоноскопия) в комплектной конфигурации:</p><ul><li>Видеосистемный центр Olympus CV-190</li><li>Источник холодного света Olympus CLV-190 (ксеноновая лампа)</li><li>Медицинский монитор HD на верхней полке</li><li>Мобильная медицинская стойка с интегрированной полкой и регулировкой высоты</li><li>Подсистема аспирации и подачи воды</li></ul><p>Подходит для эндоскопических кабинетов поликлиник, амбулаторий и частных медицинских центров.</p>",
    imagePath: "/images/catalog/olympus-190-endoscopy-tower-bu.png",
    alt: "Эндоскопическая стойка Olympus 190 series, Б/У",
    specs: [
      { key: "Состояние", value: "Б/У, после проверки и сервисного обслуживания" },
      { key: "Тип", value: "Стойка гибкой эндоскопии" },
      { key: "Видеопроцессор", value: "Olympus CV-190" },
      { key: "Источник света", value: "Olympus CLV-190" },
      { key: "Монитор", value: "Медицинский HD-монитор" },
      { key: "Гарантия", value: "От поставщика на оборудование и работы" },
    ],
  },
  {
    slug: "ge-oec-9900-elite-c-arm-bu",
    name: "Мобильная С-дуга GE OEC 9900 Elite (Б/У)",
    sku: "GE-OEC9900-BU",
    model: "OEC 9900 Elite",
    brandSlug: "ge-healthcare",
    brandName: "GE Healthcare",
    brandCountry: "США",
    categorySlug: "surgery",
    shortDesc:
      "Б/У. Передвижная С-дуга GE OEC 9900 Elite с высокочастотным генератором, рабочей станцией с двумя мониторами и цифровой обработкой изображений. Для операционных и гибридных хирургических кабинетов.",
    fullDesc:
      "<p><strong>Состояние: бывшее в употреблении (Б/У).</strong> Прошла техническое обслуживание; счётчик наработок и состояние трубки доступны по запросу.</p><p>Мобильная С-дуга GE OEC 9900 Elite — флюороскопическая система для интраоперационной визуализации:</p><ul><li>Генераторный блок с высокочастотным рентгеновским генератором</li><li>Цилиндрическая С-дуга с балансной базой и точной механикой позиционирования</li><li>Рабочая станция с двумя HD-мониторами для оперативной бригады</li><li>Цифровая обработка изображений: пульсовый режим, низкодозовое сканирование, кинопетля</li></ul><p>Применение: травматология, ортопедия, сосудистая хирургия, урология, гастроэнтерология, гибридные операционные.</p>",
    imagePath: "/images/catalog/ge-oec-9900-elite-c-arm-bu.png",
    alt: "Мобильная С-дуга GE OEC 9900 Elite, Б/У",
    specs: [
      { key: "Состояние", value: "Б/У, после технического обслуживания" },
      { key: "Тип", value: "Передвижная С-дуга (флюороскопия)" },
      { key: "Производитель", value: "GE OEC Medical Systems" },
      { key: "Конфигурация", value: "С-дуга + двумониторная рабочая станция" },
      { key: "Применение", value: "Травматология, ортопедия, сосудистая хирургия" },
      { key: "Гарантия", value: "От поставщика на оборудование и работы" },
    ],
  },
  {
    slug: "karl-storz-image1-rigid-endoscopy-bu",
    name: "Стойка жёсткой эндоскопии Karl Storz IMAGE1 (Б/У)",
    sku: "KS-IMAGE1-BU",
    model: "IMAGE1",
    brandSlug: "karl-storz",
    brandName: "Karl Storz",
    brandCountry: "Германия",
    categorySlug: "surgery",
    shortDesc:
      "Б/У. Стойка жёсткой эндоскопии Karl Storz с камерной системой IMAGE1, ксеноновым источником света, инсуффлятором и сенсорной панелью управления. Для лапароскопии, артроскопии и эндоурологии.",
    fullDesc:
      "<p><strong>Состояние: бывшее в употреблении (Б/У).</strong> После диагностики и проверки модулей.</p><p>Стойка жёсткой эндоскопии Karl Storz IMAGE1 — комплект для видеохирургических вмешательств:</p><ul><li>Камерная система Karl Storz IMAGE1 с камерной головкой H3-Z</li><li>Ксеноновый источник холодного света</li><li>Инсуффлятор CO₂</li><li>Главный медицинский монитор и вторичный сенсорный экран управления</li><li>Узкая мобильная медицинская стойка серии Karl Storz</li></ul><p>Применение: лапароскопия, артроскопия, эндоурология, гинекология, торакоскопия.</p>",
    imagePath: "/images/catalog/karl-storz-image1-rigid-endoscopy-bu.png",
    alt: "Стойка жёсткой эндоскопии Karl Storz IMAGE1, Б/У",
    specs: [
      { key: "Состояние", value: "Б/У, после диагностики модулей" },
      { key: "Тип", value: "Стойка жёсткой эндоскопии" },
      { key: "Камерная система", value: "Karl Storz IMAGE1" },
      { key: "Источник света", value: "Ксеноновый, холодный" },
      { key: "Дополнительно", value: "Инсуффлятор CO₂, сенсорная панель" },
      { key: "Гарантия", value: "От поставщика на оборудование и работы" },
    ],
  },
  {
    slug: "ge-voluson-ultrasound-bu",
    name: "Ультразвуковая система GE Voluson (Б/У)",
    sku: "GE-VOLUSON-BU",
    model: "Voluson",
    brandSlug: "ge-healthcare",
    brandName: "GE Healthcare",
    brandCountry: "США",
    categorySlug: "diagnostics",
    shortDesc:
      "Б/У. Ультразвуковая система GE Voluson с поддержкой 3D/4D-визуализации, сенсорной панелью и комплектом датчиков. Применяется в акушерстве, гинекологии и общей диагностике.",
    fullDesc:
      "<p><strong>Состояние: бывшее в употреблении (Б/У).</strong> После сервисной проверки и калибровки датчиков.</p><p>Ультразвуковая система класса Voluson на мобильной стойке — экспертный уровень для визуализации высокого разрешения:</p><ul><li>HD-монитор с поворотным шарниром</li><li>Сенсорная панель управления</li><li>Полноразмерная клавишная панель с трекболом</li><li>Поддержка 3D/4D, цветового допплера, импульсно-волнового допплера</li><li>Комплект датчиков (конвексный, линейный, эндополостной — конфигурация согласовывается)</li></ul><p>Применение: акушерство и гинекология, абдоминальное УЗИ, малые органы, поверхностные структуры.</p>",
    imagePath: "/images/catalog/ge-voluson-ultrasound-bu.png",
    alt: "Ультразвуковая система GE Voluson, Б/У",
    specs: [
      { key: "Состояние", value: "Б/У, после сервисной проверки и калибровки" },
      { key: "Тип", value: "УЗИ-система экспертного класса" },
      { key: "Визуализация", value: "2D / 3D / 4D / Color Doppler / PW Doppler" },
      { key: "Конфигурация датчиков", value: "Согласовывается по запросу" },
      { key: "Применение", value: "Акушерство, гинекология, общая диагностика" },
      { key: "Гарантия", value: "От поставщика на оборудование и работы" },
    ],
  },
];

async function main() {
  // 1. Brands
  const brandIdBySlug = new Map<string, string>();
  for (const p of PRODUCTS) {
    if (brandIdBySlug.has(p.brandSlug)) continue;
    const b = await db.brand.upsert({
      where: { slug: p.brandSlug },
      update: { name: p.brandName, country: p.brandCountry },
      create: { slug: p.brandSlug, name: p.brandName, country: p.brandCountry },
    });
    brandIdBySlug.set(p.brandSlug, b.id);
  }

  // 2. Categories — must exist (created by main seed)
  const categoryIdBySlug = new Map<string, string>();
  for (const p of PRODUCTS) {
    if (categoryIdBySlug.has(p.categorySlug)) continue;
    const c = await db.category.findUnique({ where: { slug: p.categorySlug } });
    if (!c) {
      throw new Error(
        `Категория "${p.categorySlug}" не найдена. Запусти сначала: npm run db:seed`,
      );
    }
    categoryIdBySlug.set(p.categorySlug, c.id);
  }

  // 3. Products + images + specs
  let sortCounter = 0;
  for (const p of PRODUCTS) {
    sortCounter += 10;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        sku: p.sku,
        model: p.model,
        brandId: brandIdBySlug.get(p.brandSlug),
        categoryId: categoryIdBySlug.get(p.categorySlug)!,
        shortDesc: p.shortDesc,
        fullDesc: p.fullDesc,
        kind: "EQUIPMENT",
        status: "ACTIVE",
        priceOnRequest: true,
        isUsed: true,
        regNumber: "На уточнении",
        seoTitle: `${p.name} — поставка по России`, // без «| Erfolg»: суффикс добавляет шаблон title в root layout
        seoDesc: p.shortDesc.slice(0, 160),
        sort: sortCounter,
      },
      create: {
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        model: p.model,
        brandId: brandIdBySlug.get(p.brandSlug),
        categoryId: categoryIdBySlug.get(p.categorySlug)!,
        shortDesc: p.shortDesc,
        fullDesc: p.fullDesc,
        kind: "EQUIPMENT",
        status: "ACTIVE",
        priceOnRequest: true,
        isUsed: true,
        regNumber: "На уточнении",
        seoTitle: `${p.name} — поставка по России`, // без «| Erfolg»: суффикс добавляет шаблон title в root layout
        seoDesc: p.shortDesc.slice(0, 160),
        sort: sortCounter,
      },
    });

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.create({
      data: {
        productId: product.id,
        url: p.imagePath,
        alt: p.alt,
        sort: 0,
      },
    });

    await db.productSpec.deleteMany({ where: { productId: product.id } });
    let specSort = 0;
    for (const spec of p.specs) {
      specSort += 1;
      await db.productSpec.create({
        data: {
          productId: product.id,
          key: spec.key,
          value: spec.value,
          sort: specSort,
        },
      });
    }
  }

  console.log(`✅ Загружено ${PRODUCTS.length} товаров (все Б/У):`);
  for (const p of PRODUCTS) console.log(`   • ${p.name}`);
  console.log("\nПомни: regNumber — заглушка. Перед публикацией каталога");
  console.log("замени на реальный РУ через /admin/products.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
