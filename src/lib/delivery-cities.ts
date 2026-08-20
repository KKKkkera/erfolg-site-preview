/**
 * Города частых поставок — единый источник для лендингов /postavka/[city]
 * и списка географии на главной.
 */
export type CityInfo = {
  slug: string;
  name: string;
  prepositional: string;
  region: string;
  distanceKm: number;
  daysToDelivery: string;
  notes?: string;
};

export const DELIVERY_CITIES: CityInfo[] = [
  {
    slug: "grozny",
    name: "Грозный",
    prepositional: "Грозном",
    region: "Чеченская Республика",
    distanceKm: 0,
    daysToDelivery: "1 рабочий день",
    notes:
      "Поставляем в государственные ЛПУ и частные клиники Чеченской Республики. Отгружаем в день оплаты, монтаж — в день поставки.",
  },
  {
    slug: "vladikavkaz",
    name: "Владикавказ",
    prepositional: "Владикавказе",
    region: "Республика Северная Осетия — Алания",
    distanceKm: 110,
    daysToDelivery: "1–2 рабочих дня",
    notes:
      "Регулярные поставки в РКБ, городские поликлиники и частные центры Владикавказа. Доставка собственным транспортом или ТК.",
  },
  {
    slug: "makhachkala",
    name: "Махачкала",
    prepositional: "Махачкале",
    region: "Республика Дагестан",
    distanceKm: 380,
    daysToDelivery: "2–3 рабочих дня",
    notes:
      "Поставляем в государственные клиники Махачкалы и Каспийска, частные центры республики. Сервисный инженер выезжает по заявкам.",
  },
  {
    slug: "nazran",
    name: "Назрань",
    prepositional: "Назрани",
    region: "Республика Ингушетия",
    distanceKm: 80,
    daysToDelivery: "1 рабочий день",
    notes:
      "Близкий регион — отгружаем своим транспортом. Опыт работы с ингушскими ЛПУ.",
  },
  {
    slug: "nalchik",
    name: "Нальчик",
    prepositional: "Нальчике",
    region: "Кабардино-Балкарская Республика",
    distanceKm: 230,
    daysToDelivery: "1–2 рабочих дня",
    notes:
      "Поставки в РКБ, городские поликлиники и санатории Кабардино-Балкарии.",
  },
  {
    slug: "stavropol",
    name: "Ставрополь",
    prepositional: "Ставрополе",
    region: "Ставропольский край",
    distanceKm: 410,
    daysToDelivery: "2–3 рабочих дня",
    notes:
      "Региональный центр СКФО. Работаем с государственными ЛПУ и частными клиниками.",
  },
  {
    slug: "cherkessk",
    name: "Черкесск",
    prepositional: "Черкесске",
    region: "Карачаево-Черкесская Республика",
    distanceKm: 400,
    daysToDelivery: "2–3 рабочих дня",
  },
  {
    slug: "rostov",
    name: "Ростов-на-Дону",
    prepositional: "Ростове-на-Дону",
    region: "Ростовская область",
    distanceKm: 750,
    daysToDelivery: "3–4 рабочих дня",
    notes:
      "Транспортные компании уровня «Деловые Линии», «ПЭК» и «Байкал Сервис». Сервисный инженер — по согласованию.",
  },
  {
    slug: "krasnodar",
    name: "Краснодар",
    prepositional: "Краснодаре",
    region: "Краснодарский край",
    distanceKm: 850,
    daysToDelivery: "3–4 рабочих дня",
  },
  {
    slug: "voronezh",
    name: "Воронеж",
    prepositional: "Воронеже",
    region: "Воронежская область",
    // ~1250 по трассе через Ростов (М-4); прежние 1450 км были завышены.
    distanceKm: 1250,
    daysToDelivery: "4–5 рабочих дней",
  },
];

export const DELIVERY_CITIES_BY_SLUG: Record<string, CityInfo> =
  Object.fromEntries(DELIVERY_CITIES.map((city) => [city.slug, city]));
