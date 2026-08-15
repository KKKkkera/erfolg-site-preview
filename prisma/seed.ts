import { PrismaClient, AdminRole, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getStaticCmsPage } from "../src/lib/static-cms-pages";
import { seedBlogPosts } from "./seeds/blog-posts";
import { seedBrands } from "./seeds/brands";

const db = new PrismaClient();

// ─────────────────────── 1. Admin user ───────────────────────

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@erfolgmt.ru";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Администратор";
  // Дефолтного пароля нет намеренно: прежний ("ChangeMeStrong#2026") был
  // закоммичен в .env.example, то есть общеизвестен — просидированная с ним
  // база получала админа с паролем из публичного репозитория.
  if (!password || password.length < 8 || password === "ChangeMeStrong#2026") {
    throw new Error(
      "SEED_ADMIN_PASSWORD не задан или оставлен примерным. " +
        "Впишите собственный пароль (минимум 8 символов) в .env и повторите сидирование.",
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);

  await db.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name,
      role: AdminRole.OWNER,
    },
  });
  console.log(`✓ admin: ${email}`);
}

// ─────────────────────── 2. Categories ───────────────────────

type CategoryNode = {
  slug: string;
  name: string;
  sort: number;
  description?: string;
  children?: CategoryNode[];
};

const categories: CategoryNode[] = [
  {
    slug: "reanimation",
    name: "Реанимация и интенсивная терапия",
    sort: 10,
    description:
      "Аппараты ИВЛ, мониторы пациента, дефибрилляторы, инфузионные системы, реанимационное оборудование.",
    children: [
      { slug: "ventilators", name: "Аппараты ИВЛ", sort: 10, description: "Аппараты искусственной вентиляции лёгких — стационарные, транспортные, неонатальные." },
      { slug: "patient-monitors", name: "Мониторы пациента", sort: 20, description: "Прикроватные мониторы пациента, центральные станции, телеметрия." },
      { slug: "defibrillators", name: "Дефибрилляторы", sort: 30, description: "Бифазные дефибрилляторы-мониторы и автоматические наружные дефибрилляторы (АНД)." },
      { slug: "infusion-pumps", name: "Инфузионные насосы и шприцевые дозаторы", sort: 40, description: "Волюметрические и шприцевые насосы для инфузионной терапии." },
      { slug: "resuscitation-tables", name: "Реанимационные столы и кювезы", sort: 50, description: "Столы для реанимации новорождённых, инкубаторы, кювезы." },
    ],
  },
  {
    slug: "diagnostics",
    name: "Диагностика",
    sort: 20,
    description:
      "УЗИ-сканеры, рентген-аппараты, ЭКГ, эндоскопия, диагностическое оборудование.",
    children: [
      { slug: "ultrasound", name: "УЗИ-сканеры", sort: 10, description: "Ультразвуковые сканеры экспертного, среднего и базового класса." },
      { slug: "x-ray", name: "Рентген-системы", sort: 20, description: "Стационарные и палатные рентген-аппараты, флюорографы, маммографы, С-дуги." },
      { slug: "ct-mri", name: "КТ и МРТ", sort: 30, description: "Компьютерные и магнитно-резонансные томографы." },
      { slug: "ecg-eeg", name: "ЭКГ и ЭЭГ", sort: 40, description: "Электрокардиографы, холтеры, системы суточного мониторирования, электроэнцефалографы." },
      { slug: "endoscopy", name: "Эндоскопия", sort: 50, description: "Гибкие и жёсткие эндоскопы, видеостойки, мониторы, моечные машины." },
    ],
  },
  {
    slug: "surgery",
    name: "Хирургия и операционная",
    sort: 30,
    description:
      "Операционные столы, светильники, электрохирургические аппараты, наркозно-дыхательное оборудование.",
    children: [
      { slug: "operating-tables", name: "Операционные столы", sort: 10, description: "Универсальные и специализированные операционные столы." },
      { slug: "surgical-lights", name: "Операционные светильники", sort: 20, description: "Бестеневые потолочные и передвижные светильники." },
      { slug: "anesthesia", name: "Наркозно-дыхательная аппаратура", sort: 30, description: "Наркозные станции, аппараты ингаляционного наркоза." },
      { slug: "electrosurgery", name: "Электрохирургия", sort: 40, description: "Электрохирургические аппараты, аргоноплазменные коагуляторы, биполярные блоки." },
      { slug: "sterilization", name: "Стерилизация и дезинфекция", sort: 50, description: "Автоклавы, паровые и плазменные стерилизаторы, моечно-дезинфекционные машины." },
    ],
  },
  {
    slug: "ophthalmology-ent",
    name: "Офтальмология и ЛОР",
    sort: 40,
    description: "Офтальмологическое оборудование, ЛОР-комбайны, диагностические инструменты.",
    children: [
      { slug: "ophthalmology", name: "Офтальмологическое оборудование", sort: 10, description: "Щелевые лампы, авторефкератометры, тонометры, фундус-камеры, ОКТ." },
      { slug: "ent-units", name: "ЛОР-комбайны и инструменты", sort: 20, description: "ЛОР-комбайны, аудиометры, отоскопы, риноскопы." },
    ],
  },
  {
    slug: "laboratory",
    name: "Лабораторное оборудование",
    sort: 50,
    description: "Анализаторы, центрифуги, микроскопы, лабораторные системы.",
    children: [
      { slug: "hematology-analyzers", name: "Гематологические анализаторы", sort: 10 },
      { slug: "biochemistry-analyzers", name: "Биохимические анализаторы", sort: 20 },
      { slug: "microscopes", name: "Микроскопы", sort: 30, description: "Лабораторные, операционные и стереоскопические микроскопы." },
      { slug: "centrifuges", name: "Центрифуги", sort: 40 },
      { slug: "lab-misc", name: "Прочее лабораторное оборудование", sort: 90, description: "Дозаторы, термостаты, шейкеры, дистилляторы." },
    ],
  },
  {
    slug: "consumables",
    name: "Расходники",
    sort: 60,
    description: "Расходные материалы для диагностического и лечебного оборудования.",
    children: [
      { slug: "consumables-ultrasound", name: "Расходники для УЗИ", sort: 10, description: "Гели, чехлы датчиков, термобумага." },
      { slug: "consumables-endoscopy", name: "Расходники для эндоскопии", sort: 20, description: "Биопсийные щипцы, петли, инъекторы, моечные средства." },
      { slug: "consumables-lab", name: "Расходники для лаборатории", sort: 30, description: "Реагенты, пробирки, наконечники, фильтры." },
      { slug: "consumables-surgery", name: "Расходники для хирургии", sort: 40, description: "Шовный материал, стерильные халаты и простыни, перчатки." },
    ],
  },
  {
    slug: "spare-parts",
    name: "Запчасти",
    sort: 70,
    description: "Запасные части и комплектующие для медицинского оборудования.",
  },
];

async function seedCategories() {
  let total = 0;
  for (const c of categories) {
    const parent = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sort: c.sort, description: c.description },
      create: { slug: c.slug, name: c.name, sort: c.sort, description: c.description },
    });
    total++;
    for (const child of c.children ?? []) {
      await db.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          sort: child.sort,
          description: child.description,
          parentId: parent.id,
        },
        create: {
          slug: child.slug,
          name: child.name,
          sort: child.sort,
          description: child.description,
          parentId: parent.id,
        },
      });
      total++;
    }
  }
  console.log(`✓ categories: ${total} (${categories.length} top-level + subcategories)`);
}

// ─────────────────────── 3. Static pages ───────────────────────

const pages: Array<{
  slug: string;
  title: string;
  content: string;
  seoTitle?: string;
  seoDesc?: string;
}> = [
  {
    slug: "about",
    title: "О компании",
    content: getStaticCmsPage("about")!.content,
    seoTitle: getStaticCmsPage("about")!.seoTitle ?? undefined,
    seoDesc: getStaticCmsPage("about")!.seoDesc ?? undefined,
  },
  {
    slug: "delivery",
    title: "Доставка",
    content:
      "<p>Доставляем оборудование, расходные материалы и запчасти по всей России. Способ доставки выбираем по характеристикам груза: габариты, масса, требования к температурному режиму, срок поставки. Стоимость доставки фиксируется в КП по каждому заказу.</p><p>Транспорт: собственный автопарк, ПЭК, СДЭК, «Деловые Линии». Для крупногабаритного и стационарного оборудования — выезд инженеров на объект для монтажа и пуско-наладки.</p><p>Для Сибири, Дальнего Востока и районов Крайнего Севера логистика рассчитывается индивидуально по факту груза. Точная стоимость и срок поставки фиксируются в коммерческом предложении.</p>",
    seoTitle: "Доставка медицинской техники по России — Erfolg",
    seoDesc:
      "Доставка медицинской техники по всей России: собственный транспорт, ПЭК, СДЭК, «Деловые Линии». Монтаж и пуско-наладка крупногабаритного оборудования. Удалённые регионы — индивидуальный расчёт.",
  },
  {
    slug: "warranty",
    title: "Гарантия",
    content:
      "<p>На поставляемое оборудование распространяется гарантия производителя. Конкретные условия и сроки указываются в товаросопроводительных документах и коммерческом предложении по каждому изделию.</p><p>Сервисная поддержка в гарантийный период осуществляется силами ООО «Эрфольг» на основании лицензии Росздравнадзора на техническое обслуживание медицинских изделий (ТОМИ). Заявка — через раздел «Сервис».</p>",
    seoTitle: "Гарантия — Erfolg",
    seoDesc:
      "Гарантия производителя на поставляемое медицинское оборудование. Сервисная поддержка в гарантийный период — по лицензии Росздравнадзора (ТОМИ). Условия в товаросопроводительных документах и КП.",
  },
  {
    slug: "licenses",
    title: "Лицензии",
    content: getStaticCmsPage("licenses")!.content,
    seoTitle: getStaticCmsPage("licenses")!.seoTitle ?? undefined,
    seoDesc: getStaticCmsPage("licenses")!.seoDesc ?? undefined,
  },
  {
    slug: "privacy",
    title: "Политика конфиденциальности",
    content: getStaticCmsPage("privacy")!.content,
    seoTitle: getStaticCmsPage("privacy")!.seoTitle ?? undefined,
    seoDesc: getStaticCmsPage("privacy")!.seoDesc ?? undefined,
  },
  {
    slug: "personal-data-policy",
    title: "Политика обработки персональных данных",
    content: getStaticCmsPage("personal-data-policy")!.content,
    seoTitle: getStaticCmsPage("personal-data-policy")!.seoTitle ?? undefined,
    seoDesc: getStaticCmsPage("personal-data-policy")!.seoDesc ?? undefined,
  },
  {
    slug: "cookie-policy",
    title: "Политика использования cookie",
    content: getStaticCmsPage("cookie-policy")!.content,
    seoTitle: getStaticCmsPage("cookie-policy")!.seoTitle ?? undefined,
    seoDesc: getStaticCmsPage("cookie-policy")!.seoDesc ?? undefined,
  },
  {
    slug: "consent",
    title: "Согласие на обработку персональных данных",
    content: getStaticCmsPage("consent")!.content,
    seoTitle: getStaticCmsPage("consent")!.seoTitle ?? undefined,
    seoDesc: getStaticCmsPage("consent")!.seoDesc ?? undefined,
  },
];

async function seedPages() {
  // create-only: повторный запуск сидера не должен перетирать контент,
  // отредактированный в админке (раньше update возвращал тексты к дефолтам).
  for (const p of pages) {
    await db.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`✓ pages: ${pages.length} (существующие не перезаписываются)`);
}

// ─────────────────────── 4. Blog posts ───────────────────────

async function seedBlog() {
  const count = await seedBlogPosts(db);
  console.log(`✓ blog posts: ${count}`);
}

// ─────────────────────── 4.5 Brands ───────────────────────

async function seedBrandsStep() {
  const count = await seedBrands(db);
  console.log(`✓ brands: ${count}`);
}

// ─────────────────────── 5. Settings (defaults) ───────────────────────

const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  // company
  { key: "company.legal_name", value: "ООО «Эрфольг»" },
  { key: "company.inn", value: "2014006736" },
  { key: "company.kpp", value: "201401001" },
  { key: "company.ogrn", value: "1122031001762" },
  { key: "company.okpo", value: "91764252" },
  { key: "company.legal_address", value: "364031, Чеченская Республика, г. Грозный, ул. Мичурина (Ахматовский р-н), двлд. 98" },
  { key: "company.director", value: "Хаджиев Тимур Рамзанович" },
  { key: "company.director_basis", value: "Устав" },
  { key: "company.founding_date", value: "2012-06-13" },
  { key: "company.bank_name", value: "Чеченский РФ АО «Россельхозбанк», г. Грозный" },
  { key: "company.bank_account", value: "40702810734000003523" },
  { key: "company.bank_corr_account", value: "30101810600000000719" },
  { key: "company.bik", value: "049690719" },
  // contacts
  { key: "contacts.phone", value: "+7 928 895 70 70" },
  { key: "contacts.email", value: "info@erfolgmt.ru" },
  {
    key: "contacts.offices",
    value: [
      {
        city: "Грозный",
        address: "364031, ул. Мичурина, 98",
        phone: "+7 928 895 70 70",
        email: "info@erfolgmt.ru",
        hours: "Пн–Пт 09:00–18:00",
        lat: 43.3168,
        lng: 45.6981,
      },
    ],
  },
  // license
  { key: "license.tomi_number", value: "Л016-00110-77/00563653" },
  { key: "license.tomi_date", value: "21.08.2013" },
  {
    key: "license.tomi_authority",
    value:
      "Федеральная служба по надзору в сфере здравоохранения (Росздравнадзор)",
  },
  { key: "license.tomi_scan_url", value: "" },
  // seo
  { key: "seo.metrika_id", value: "" },
  { key: "seo.yandex_verification", value: "" },
  { key: "seo.google_verification", value: "" },
  // email
  { key: "email.notify_to", value: "info@erfolgmt.ru" },
  // 152-ФЗ — уведомление в Роскомнадзор (заполняет заказчик)
  { key: "compliance.rkn_notification_date", value: "" },
  { key: "compliance.rkn_notification_number", value: "" },
  // brand assets
  { key: "branding.logo_url", value: "" },
];

async function seedSettings() {
  // create-only: сидер задаёт значения только для отсутствующих ключей.
  // Раньше update перезаписывал и то, что владелец поменял через админку
  // (включая license.tomi_number → плейсхолдер) — это ловушка на проде.
  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`✓ settings: ${settings.length} (существующие не перезаписываются)`);
}

// ─────────────────────── Entry point ───────────────────────

async function main() {
  console.log("→ seeding database...");
  await seedAdmin();
  await seedCategories();
  await seedBrandsStep();
  await seedPages();
  await seedBlog();
  await seedSettings();
  console.log("✓ done.");
}

main()
  .catch((err) => {
    console.error("✗ seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
