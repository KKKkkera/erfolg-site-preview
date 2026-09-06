export const siteConfig = {
  name: "Erfolg",
  fullName: "ООО «Эрфольг»",
  tagline: "Медицинская техника",
  description:
    "ООО «Эрфольг» — ремонт и техническое обслуживание медицинской техники по лицензии Росздравнадзора (ТОМИ). Выезд инженера по всей России, оригинальные запчасти, гарантия. Поставка оборудования по 44 и 223-ФЗ.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru",
  contacts: {
    phonePrimary: "+7 (920) 444 - 22 - 22",
    email: "info@erfolgmt.ru",
    addressShort: "Сервис и поставка по всей России",
  },
  /* Соцсети в верхней строке шапки. href пустой — рисуется неактивная
     заглушка; как только придут ссылки, иконки станут кликабельными. */
  socials: [
    { key: "telegram", label: "Telegram", href: "" },
    { key: "whatsapp", label: "WhatsApp", href: "" },
    { key: "vk", label: "ВКонтакте", href: "" },
  ] as { key: string; label: string; href: string }[],
  legal: {
    inn: "2014006736",
    kpp: "201401001",
    ogrn: "1122031001762",
    okpo: "91764252",
    legalAddress: "364031, Чеченская Республика, г. Грозный, ул. Мичурина (Ахматовский р-н), двлд. 98",
    director: "Хаджиев Тимур Рамзанович",
    directorBasis: "Устав",
    // «АО», не «ОАО»: Россельхозбанк сменил организационную форму в 2015 году.
    // Счёт и БИК сверить с бухгалтерией перед выставлением реквизитов в договорах.
    bankName: "Чеченский РФ АО «Россельхозбанк», г. Грозный",
    bankAccount: "40702810734000003523",
    bankCorrAccount: "30101810600000000719",
    bik: "049690719",
    // Лицензия Росздравнадзора (ТОМИ)
    licenseTomi: "Лицензия Росздравнадзора № Л016-00110-77/00563653 от 21.08.2013",
    tomiNumber: "Л016-00110-77/00563653",
    tomiDate: "21.08.2013",
    tomiAuthority: "Федеральная служба по надзору в сфере здравоохранения",
    // Последняя редакция реестровой записи
    tomiLastOrder: "№ 9174 от 14.12.2023",
    // Ссылка на проверку лицензии в открытом реестре Росздравнадзора
    tomiRegistryUrl: "https://roszdravnadzor.gov.ru/services/licenses",
    // Регистрация в реестре операторов персональных данных Роскомнадзора
    rknRegistryNumber: "20-25-004617",
    rknRegistryDate: "2025-06-01",
    rknRegistryOrder: "№ 47 от 05.06.2025",
  },
  nav: {
    primary: [
      { href: "/catalog", label: "Каталог" },
      { href: "/service", label: "Сервис" },
      { href: "/reviews", label: "Отзывы" },
      { href: "/licenses", label: "Документы" },
      { href: "/about", label: "О компании" },
      { href: "/contacts", label: "Контакты" },
    ],
    /* Отдельных страниц категорий нет: раздел — это каталог с выставленным
       фильтром. Slug после ?category= должен совпадать со slug в базе. */
    catalog: [
      { href: "/catalog?category=reanimation", label: "Реанимация и интенсивная терапия" },
      { href: "/catalog?category=diagnostics", label: "Диагностика" },
      { href: "/catalog?category=surgery", label: "Хирургия и операционная" },
      { href: "/catalog?category=ophthalmology-ent", label: "Офтальмология и ЛОР" },
      { href: "/catalog?category=laboratory", label: "Лабораторное оборудование" },
      { href: "/catalog?category=consumables", label: "Расходники" },
      { href: "/catalog?category=spare-parts", label: "Запчасти" },
    ],
    info: [
      { href: "/about", label: "О компании" },
      { href: "/blog", label: "Блог" },
      { href: "/reviews", label: "Отзывы" },
      { href: "/faq", label: "Частые вопросы" },
      { href: "/delivery", label: "Доставка" },
      { href: "/warranty", label: "Гарантия" },
      { href: "/license", label: "Лицензия" },
      { href: "/licenses", label: "Документы" },
    ],
    legal: [
      { href: "/privacy", label: "Политика конфиденциальности" },
      { href: "/personal-data-policy", label: "Политика обработки персональных данных" },
      { href: "/consent", label: "Согласие на обработку персональных данных" },
      { href: "/cookie-policy", label: "Согласие на обработку файлов cookies" },
    ],
  },
};

export type SiteConfig = typeof siteConfig;
