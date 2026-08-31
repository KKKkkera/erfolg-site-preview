/* Реестр стандартных блоков, которые редактор вставляет в контент шорткодом.

   Шорткод — это маркер вида [[block:region-coverage]] или
   [[block:cta title="Нужно КП?" button="Отправить ТЗ"]] в HTML из TipTap.
   При рендере страница разбивает контент на HTML-куски и блоки, HTML отдаётся
   через sanitizeCmsHtml, а блок — настоящим React-компонентом.

   Почему шорткод, а не отдельная таблица блоков: контент остаётся одним полем
   (Page.content, Product.fullDesc, RegionPage.content), редактор и превью не
   расходятся, а порядок блоков задаётся тем же местом в тексте, где они стоят.

   Санитайзер вырезает неизвестные ему теги, поэтому шорткод намеренно сделан
   текстом: он переживает sanitizeCmsHtml без экранирования. */

export type BlockIconName =
  | "text"
  | "map"
  | "truck"
  | "help"
  | "award"
  | "send"
  | "chart"
  | "grid"
  | "news";

export type BlockParamDef = {
  key: string;
  label: string;
  placeholder?: string;
  /** Значение, которое подставится в шорткод при вставке из тулбара. */
  defaultValue?: string;
};

export type BlockDef = {
  type: string;
  label: string;
  description: string;
  /** Имя иконки lucide — конструктор рисует её на карточке блока. */
  icon: BlockIconName;
  /** Где блок разрешён. Пустой список = везде. */
  scopes: Array<"region" | "product" | "page">;
  params: BlockParamDef[];
};

/** Единственный источник правды: и конструктор админки, и рендер читают отсюда. */
export const CONTENT_BLOCKS: BlockDef[] = [
  {
    /* Текст — тоже блок конструктора, но особенный: он не шорткод, а обычный
       HTML между шорткодами. Редактируется маленьким TipTap прямо в карточке,
       поэтому params пуст — у него своё поле. */
    type: "text",
    icon: "text",
    label: "Текст",
    description: "Абзацы, заголовки, списки и ссылки — обычный редактор текста.",
    scopes: ["region", "product", "page"],
    params: [],
  },
  {
    type: "region-coverage",
    icon: "map",
    label: "География работы",
    description:
      "Карта России с подсветкой регионов (на телефоне — выбор региона списком).",
    scopes: ["region", "product", "page"],
    params: [],
  },
  {
    type: "delivery-cities",
    icon: "truck",
    label: "Города и сроки доставки",
    description: "Плитка городов с транспортным плечом от склада в Грозном.",
    scopes: ["region", "product", "page"],
    params: [],
  },
  {
    type: "faq",
    icon: "help",
    label: "Частые вопросы",
    description: "Аккордеон с типовыми вопросами о поставке, сервисе и оплате.",
    scopes: ["region", "product", "page"],
    params: [],
  },
  {
    type: "brands",
    icon: "award",
    label: "Бренды-производители",
    description: "Лента логотипов брендов, у которых есть товары в каталоге.",
    scopes: ["region", "product", "page"],
    params: [],
  },
  {
    type: "products",
    icon: "grid",
    label: "Товары из каталога",
    description:
      "Сетка карточек товаров: по категории, по бренду или витрина главной.",
    scopes: ["region", "product", "page"],
    params: [
      {
        key: "title",
        label: "Заголовок над сеткой",
        placeholder: "Что поставляем",
        defaultValue: "Что поставляем",
      },
      {
        key: "category",
        label: "Слаг категории",
        placeholder: "ventilators — пусто = витрина главной",
      },
      {
        key: "brand",
        label: "Слаг бренда",
        placeholder: "учитывается, если категория не задана",
      },
      { key: "limit", label: "Сколько карточек", placeholder: "6", defaultValue: "6" },
      {
        key: "href",
        label: "Ссылка «Смотреть все»",
        placeholder: "/catalog",
        defaultValue: "/catalog",
      },
    ],
  },
  {
    type: "posts",
    icon: "news",
    label: "Статьи из блога",
    description: "Лента свежих статей блога — карусель на телефоне, три в ряд на десктопе.",
    scopes: ["region", "product", "page"],
    params: [
      {
        key: "title",
        label: "Заголовок над лентой",
        placeholder: "Статьи по медтехнике",
        defaultValue: "Статьи по медтехнике",
      },
      { key: "limit", label: "Сколько статей", placeholder: "3", defaultValue: "3" },
    ],
  },
  {
    type: "cta",
    icon: "send",
    label: "Форма заявки (CTA)",
    description: "Заголовок, текст и кнопка, открывающая форму заявки.",
    scopes: ["region", "product", "page"],
    params: [
      {
        key: "title",
        label: "Заголовок",
        placeholder: "Нужно коммерческое предложение?",
        defaultValue: "Нужно коммерческое предложение?",
      },
      {
        key: "text",
        label: "Текст под заголовком",
        placeholder: "Пришлите спецификацию — подготовим КП со сроком и ценой",
        defaultValue:
          "Пришлите спецификацию — подготовим предложение со сроком и ценой",
      },
      {
        key: "button",
        label: "Надпись на кнопке",
        placeholder: "Отправить ТЗ",
        defaultValue: "Отправить ТЗ",
      },
    ],
  },
  {
    type: "stats",
    icon: "chart",
    label: "Преимущества и цифры",
    description:
      "До четырёх показателей: крупная цифра и подпись под ней. Пустые пары не выводятся.",
    scopes: ["region", "product", "page"],
    params: [
      { key: "value1", label: "Цифра 1", placeholder: "5–14 дней", defaultValue: "5–14 дней" },
      { key: "label1", label: "Подпись 1", placeholder: "срок поставки", defaultValue: "срок поставки" },
      { key: "value2", label: "Цифра 2", placeholder: "86", defaultValue: "86" },
      { key: "label2", label: "Подпись 2", placeholder: "регионов России", defaultValue: "регионов России" },
      { key: "value3", label: "Цифра 3", placeholder: "ТОМИ", defaultValue: "ТОМИ" },
      { key: "label3", label: "Подпись 3", placeholder: "лицензия на сервис", defaultValue: "лицензия на сервис" },
      { key: "value4", label: "Цифра 4", placeholder: "" },
      { key: "label4", label: "Подпись 4", placeholder: "" },
    ],
  },
];

export const BLOCKS_BY_TYPE = new Map(CONTENT_BLOCKS.map((b) => [b.type, b]));

export function blocksForScope(scope: "region" | "product" | "page"): BlockDef[] {
  return CONTENT_BLOCKS.filter((b) => b.scopes.includes(scope));
}
