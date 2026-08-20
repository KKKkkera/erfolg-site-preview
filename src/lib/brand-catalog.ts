export type BrandCatalogItem = {
  slug: string;
  name: string;
  country: string;
  website?: string;
  logo?: string;
  sort: number;
};

/**
 * Канонический порядок брендов. База остаётся источником данных для сайта,
 * а этот список задаёт стартовые значения для seed и fallback при недоступной БД.
 */
export const BRAND_CATALOG: BrandCatalogItem[] = [
  { slug: "b-braun", name: "B. Braun", country: "Германия", website: "https://www.bbraun.com", logo: "/images/brands/b-braun.svg", sort: 10 },
  { slug: "bpl-medical", name: "BPL Medical Technologies", country: "Индия", website: "https://www.bplmedicaltechnologies.com", logo: "/images/brands/bpl-medical.png", sort: 20 },
  { slug: "canon-medical", name: "Canon Medical Systems", country: "Япония", website: "https://global.medical.canon", logo: "/images/brands/canon-medical.svg", sort: 30 },
  { slug: "contec", name: "CONTEC Medical Systems", country: "Китай", website: "https://www.contecmed.com", logo: "/images/brands/contec.jpg", sort: 40 },
  { slug: "draeger", name: "Dräger", country: "Германия", website: "https://www.draeger.com", logo: "/images/brands/draeger.webp", sort: 50 },
  { slug: "edan", name: "Edan Instruments", country: "Китай", website: "https://www.edan.com", logo: "/images/brands/edan.png", sort: 60 },
  { slug: "erbe", name: "Erbe Elektromedizin", country: "Германия", website: "https://www.erbe-med.com", logo: "/images/brands/erbe.png", sort: 70 },
  { slug: "fresenius", name: "Fresenius Medical Care", country: "Германия", website: "https://www.freseniusmedicalcare.com", logo: "/images/brands/fresenius.svg", sort: 80 },
  { slug: "fukuda-denshi", name: "Fukuda Denshi", country: "Япония", website: "https://www.fukuda.co.jp", logo: "/images/brands/fukuda-denshi.svg", sort: 90 },
  { slug: "ge-healthcare", name: "GE Healthcare", country: "США", website: "https://www.gehealthcare.com", logo: "/images/brands/ge-healthcare.svg", sort: 100 },
  { slug: "getinge", name: "Getinge / Maquet", country: "Швеция", website: "https://www.getinge.com", logo: "/images/brands/getinge.svg", sort: 110 },
  { slug: "hamilton-medical", name: "Hamilton Medical", country: "Швейцария", website: "https://www.hamilton-medical.com", logo: "/images/brands/hamilton-medical.svg", sort: 120 },
  { slug: "hitachi", name: "Hitachi Medical", country: "Япония", logo: "/images/brands/hitachi.png", sort: 130 },
  { slug: "karl-storz", name: "Karl Storz", country: "Германия", website: "https://www.karlstorz.com", logo: "/images/brands/karl-storz.webp", sort: 140 },
  { slug: "medtronic", name: "Medtronic", country: "Ирландия / США", website: "https://www.medtronic.com", logo: "/images/brands/medtronic.svg", sort: 150 },
  { slug: "mindray", name: "Mindray", country: "Китай", website: "https://www.mindray.com", logo: "/images/brands/mindray.png", sort: 160 },
  { slug: "nihon-kohden", name: "Nihon Kohden", country: "Япония", website: "https://www.nihonkohden.com", logo: "/images/brands/nihon-kohden.png", sort: 170 },
  { slug: "olympus", name: "Olympus", country: "Япония", website: "https://www.olympus-global.com", logo: "/images/brands/olympus.svg", sort: 180 },
  { slug: "philips", name: "Philips Healthcare", country: "Нидерланды", website: "https://www.philips.com/healthcare", logo: "/images/brands/philips.svg", sort: 190 },
  { slug: "riester", name: "Riester", country: "Германия", website: "https://www.riester.de", logo: "/images/brands/riester.png", sort: 200 },
  { slug: "roche-diagnostics", name: "Roche Diagnostics", country: "Швейцария", website: "https://diagnostics.roche.com", logo: "/images/brands/roche-diagnostics.png", sort: 210 },
  { slug: "samsung-medison", name: "Samsung Medison", country: "Республика Корея", website: "https://www.samsunghealthcare.com", logo: "/images/brands/samsung-medison.png", sort: 220 },
  { slug: "schiller", name: "Schiller AG", country: "Швейцария", website: "https://www.schiller.ch", logo: "/images/brands/schiller.svg", sort: 230 },
  { slug: "siemens-healthineers", name: "Siemens Healthineers", country: "Германия", website: "https://www.siemens-healthineers.com", logo: "/images/brands/siemens-healthineers.svg", sort: 240 },
  { slug: "smiths-medical", name: "Smiths Medical", country: "Великобритания", website: "https://www.smiths-medical.com", logo: "/images/brands/smiths-medical.png", sort: 250 },
  { slug: "spacelabs", name: "Spacelabs Healthcare", country: "США", website: "https://www.spacelabshealthcare.com", logo: "/images/brands/spacelabs.png", sort: 260 },
  { slug: "stryker", name: "Stryker", country: "США", website: "https://www.stryker.com", logo: "/images/brands/stryker.svg", sort: 270 },
  { slug: "sysmex", name: "Sysmex", country: "Япония", website: "https://www.sysmex.com", logo: "/images/brands/sysmex.svg", sort: 280 },
  { slug: "welch-allyn", name: "Welch Allyn (Hillrom)", country: "США", website: "https://www.hillrom.com", logo: "/images/brands/welch-allyn.svg", sort: 290 },
  { slug: "altonika", name: "Альтоника", country: "Россия", logo: "/images/brands/altonika.jpg", sort: 300 },
  { slug: "elatma", name: "Еламед / Елатомский приборный завод", country: "Россия", logo: "/images/brands/elatma.svg", sort: 310 },
  { slug: "kazmedpribor", name: "Казанский медико-инструментальный завод", country: "Россия", logo: "/images/brands/kazmedpribor.jpg", sort: 320 },
  { slug: "ramenskoe-pribor", name: "Раменский приборостроительный завод (РПЗ)", country: "Россия", logo: "/images/brands/ramenskoe-pribor.webp", sort: 330 },
  { slug: "triton-electronics", name: "Тритон-ЭлектроникС", country: "Россия", logo: "/images/brands/triton-electronics.png", sort: 340 },
  { slug: "uomz", name: "Уральский оптико-механический завод (УОМЗ)", country: "Россия", logo: "/images/brands/uomz.png", sort: 350 },
];
