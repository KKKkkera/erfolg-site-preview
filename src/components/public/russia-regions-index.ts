/* Плоский список регионов: код, название, слаг и федеральный округ.

   Отдельно от russia-map-regions.ts намеренно: там к каждому региону лежат
   контуры карты — это 130 КБ строк, и мобильному списку регионов они не нужны.
   Список пересобирается скриптом из того же файла, когда карта меняется.

   Округа — восемь, по перечню субъектов; Москва, Санкт-Петербург и Севастополь
   отдельными строками не идут: на карте они нарисованы вместе с соседом. */
export type FederalDistrictCode =
  | "CFO"
  | "SZFO"
  | "UFO"
  | "SKFO"
  | "PFO"
  | "URFO"
  | "SFO"
  | "DFO";

export type RegionIndexItem = {
  code: string;
  name: string;
  slug: string;
  district: FederalDistrictCode;
};

export const FEDERAL_DISTRICTS: { code: FederalDistrictCode; name: string }[] = [
  { code: "CFO", name: "Центральный" },
  { code: "SZFO", name: "Северо-Западный" },
  { code: "UFO", name: "Южный" },
  { code: "SKFO", name: "Северо-Кавказский" },
  { code: "PFO", name: "Приволжский" },
  { code: "URFO", name: "Уральский" },
  { code: "SFO", name: "Сибирский" },
  { code: "DFO", name: "Дальневосточный" },
];

/** Регионы в порядке округов, внутри округа — по алфавиту. */
export const REGION_INDEX: RegionIndexItem[] = [
  { code: "RU-BEL", name: "Белгородская область", slug: "belgorodskaya-oblast", district: "CFO" },
  { code: "RU-BRY", name: "Брянская область", slug: "bryanskaya-oblast", district: "CFO" },
  { code: "RU-VLA", name: "Владимирская область", slug: "vladimirskaya-oblast", district: "CFO" },
  { code: "RU-VOR", name: "Воронежская область", slug: "voronezhskaya-oblast", district: "CFO" },
  { code: "RU-IVA", name: "Ивановская область", slug: "ivanovskaya-oblast", district: "CFO" },
  { code: "RU-KLU", name: "Калужская область", slug: "kaluzhskaya-oblast", district: "CFO" },
  { code: "RU-KOS", name: "Костромская область", slug: "kostromskaya-oblast", district: "CFO" },
  { code: "RU-KRS", name: "Курская область", slug: "kurskaya-oblast", district: "CFO" },
  { code: "RU-LIP", name: "Липецкая область", slug: "lipeckaya-oblast", district: "CFO" },
  { code: "RU-MOS", name: "Москва и Московская область", slug: "moskovskaya-oblast", district: "CFO" },
  { code: "RU-ORL", name: "Орловская область", slug: "orlovskaya-oblast", district: "CFO" },
  { code: "RU-RYA", name: "Рязанская область", slug: "ryazanskaya-oblast", district: "CFO" },
  { code: "RU-SMO", name: "Смоленская область", slug: "smolenskaya-oblast", district: "CFO" },
  { code: "RU-TAM", name: "Тамбовская область", slug: "tambovskaya-oblast", district: "CFO" },
  { code: "RU-TVE", name: "Тверская область", slug: "tverskaya-oblast", district: "CFO" },
  { code: "RU-TUL", name: "Тульская область", slug: "tulskaya-oblast", district: "CFO" },
  { code: "RU-YAR", name: "Ярославская область", slug: "yaroslavskaya-oblast", district: "CFO" },
  { code: "RU-ARK", name: "Архангельская область", slug: "arhangelskaya-oblast", district: "SZFO" },
  { code: "RU-VLG", name: "Вологодская область", slug: "vologodskaya-oblast", district: "SZFO" },
  { code: "RU-KGD", name: "Калининградская область", slug: "kaliningradskaya-oblast", district: "SZFO" },
  { code: "RU-MUR", name: "Мурманская область", slug: "murmanskaya-oblast", district: "SZFO" },
  { code: "RU-NEN", name: "Ненецкий автономный округ", slug: "neneckiy-ao", district: "SZFO" },
  { code: "RU-NGR", name: "Новгородская область", slug: "novgorodskaya-oblast", district: "SZFO" },
  { code: "RU-PSK", name: "Псковская область", slug: "pskovskaya-oblast", district: "SZFO" },
  { code: "RU-KR", name: "Республика Карелия", slug: "kareliya", district: "SZFO" },
  { code: "RU-KO", name: "Республика Коми", slug: "komi", district: "SZFO" },
  { code: "RU-LEN", name: "Санкт-Петербург и Ленинградская область", slug: "leningradskaya-oblast", district: "SZFO" },
  { code: "RU-AST", name: "Астраханская область", slug: "astrahanskaya-oblast", district: "UFO" },
  { code: "RU-VGG", name: "Волгоградская область", slug: "volgogradskaya-oblast", district: "UFO" },
  { code: "RU-DON", name: "Донецкая Народная Республика", slug: "dnr", district: "UFO" },
  { code: "RU-ZP", name: "Запорожская область", slug: "zaporozhskaya-oblast", district: "UFO" },
  { code: "RU-KDA", name: "Краснодарский край", slug: "krasnodarskiy-kray", district: "UFO" },
  { code: "RU-LUG", name: "Луганская Народная Республика", slug: "lnr", district: "UFO" },
  { code: "RU-AD", name: "Республика Адыгея", slug: "adygeya", district: "UFO" },
  { code: "RU-KL", name: "Республика Калмыкия", slug: "kalmykiya", district: "UFO" },
  { code: "RU-CR", name: "Республика Крым и Севастополь", slug: "krym", district: "UFO" },
  { code: "RU-ROS", name: "Ростовская область", slug: "rostovskaya-oblast", district: "UFO" },
  { code: "RU-KHE", name: "Херсонская область", slug: "hersonskaya-oblast", district: "UFO" },
  { code: "RU-KB", name: "Кабардино-Балкарская Республика", slug: "kabardino-balkariya", district: "SKFO" },
  { code: "RU-KC", name: "Карачаево-Черкесская Республика", slug: "karachaevo-cherkesiya", district: "SKFO" },
  { code: "RU-DA", name: "Республика Дагестан", slug: "dagestan", district: "SKFO" },
  { code: "RU-IN", name: "Республика Ингушетия", slug: "ingushetiya", district: "SKFO" },
  { code: "RU-SE", name: "Республика Северная Осетия — Алания", slug: "severnaya-osetiya", district: "SKFO" },
  { code: "RU-STA", name: "Ставропольский край", slug: "stavropolskiy-kray", district: "SKFO" },
  { code: "RU-CE", name: "Чеченская Республика", slug: "chechenskaya-respublika", district: "SKFO" },
  { code: "RU-KIR", name: "Кировская область", slug: "kirovskaya-oblast", district: "PFO" },
  { code: "RU-NIZ", name: "Нижегородская область", slug: "nizhegorodskaya-oblast", district: "PFO" },
  { code: "RU-ORE", name: "Оренбургская область", slug: "orenburgskaya-oblast", district: "PFO" },
  { code: "RU-PNZ", name: "Пензенская область", slug: "penzenskaya-oblast", district: "PFO" },
  { code: "RU-PER", name: "Пермский край", slug: "permskiy-kray", district: "PFO" },
  { code: "RU-BA", name: "Республика Башкортостан", slug: "bashkortostan", district: "PFO" },
  { code: "RU-ME", name: "Республика Марий Эл", slug: "mariy-el", district: "PFO" },
  { code: "RU-MO", name: "Республика Мордовия", slug: "mordoviya", district: "PFO" },
  { code: "RU-TA", name: "Республика Татарстан", slug: "tatarstan", district: "PFO" },
  { code: "RU-SAM", name: "Самарская область", slug: "samarskaya-oblast", district: "PFO" },
  { code: "RU-SAR", name: "Саратовская область", slug: "saratovskaya-oblast", district: "PFO" },
  { code: "RU-UD", name: "Удмуртская Республика", slug: "udmurtiya", district: "PFO" },
  { code: "RU-ULY", name: "Ульяновская область", slug: "ulyanovskaya-oblast", district: "PFO" },
  { code: "RU-CU", name: "Чувашская Республика", slug: "chuvashiya", district: "PFO" },
  { code: "RU-KGN", name: "Курганская область", slug: "kurganskaya-oblast", district: "URFO" },
  { code: "RU-SVE", name: "Свердловская область", slug: "sverdlovskaya-oblast", district: "URFO" },
  { code: "RU-TYU", name: "Тюменская область", slug: "tyumenskaya-oblast", district: "URFO" },
  { code: "RU-KHM", name: "Ханты-Мансийский автономный округ — Югра", slug: "hanty-mansiyskiy-ao", district: "URFO" },
  { code: "RU-CHE", name: "Челябинская область", slug: "chelyabinskaya-oblast", district: "URFO" },
  { code: "RU-YAN", name: "Ямало-Ненецкий автономный округ", slug: "yamalo-neneckiy-ao", district: "URFO" },
  { code: "RU-ALT", name: "Алтайский край", slug: "altayskiy-kray", district: "SFO" },
  { code: "RU-IRK", name: "Иркутская область", slug: "irkutskaya-oblast", district: "SFO" },
  { code: "RU-KEM", name: "Кемеровская область — Кузбасс", slug: "kemerovskaya-oblast", district: "SFO" },
  { code: "RU-KYA", name: "Красноярский край", slug: "krasnoyarskiy-kray", district: "SFO" },
  { code: "RU-NVS", name: "Новосибирская область", slug: "novosibirskaya-oblast", district: "SFO" },
  { code: "RU-OMS", name: "Омская область", slug: "omskaya-oblast", district: "SFO" },
  { code: "RU-AL", name: "Республика Алтай", slug: "respublika-altay", district: "SFO" },
  { code: "RU-TY", name: "Республика Тыва", slug: "tyva", district: "SFO" },
  { code: "RU-KK", name: "Республика Хакасия", slug: "hakasiya", district: "SFO" },
  { code: "RU-TOM", name: "Томская область", slug: "tomskaya-oblast", district: "SFO" },
  { code: "RU-AMU", name: "Амурская область", slug: "amurskaya-oblast", district: "DFO" },
  { code: "RU-YEV", name: "Еврейская автономная область", slug: "evreyskaya-ao", district: "DFO" },
  { code: "RU-ZAB", name: "Забайкальский край", slug: "zabaykalskiy-kray", district: "DFO" },
  { code: "RU-KAM", name: "Камчатский край", slug: "kamchatskiy-kray", district: "DFO" },
  { code: "RU-MAG", name: "Магаданская область", slug: "magadanskaya-oblast", district: "DFO" },
  { code: "RU-PRI", name: "Приморский край", slug: "primorskiy-kray", district: "DFO" },
  { code: "RU-BU", name: "Республика Бурятия", slug: "buryatiya", district: "DFO" },
  { code: "RU-SA", name: "Республика Саха (Якутия)", slug: "saha-yakutiya", district: "DFO" },
  { code: "RU-SAK", name: "Сахалинская область", slug: "sahalinskaya-oblast", district: "DFO" },
  { code: "RU-KHA", name: "Хабаровский край", slug: "habarovskiy-kray", district: "DFO" },
  { code: "RU-CHU", name: "Чукотский автономный округ", slug: "chukotskiy-ao", district: "DFO" },
];
