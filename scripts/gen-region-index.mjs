/* Пересобирает src/components/public/russia-regions-index.ts — плоский список
   регионов для мобильного выбора региона: код, название, слаг, округ.
   Запуск: npm run regions:index. Контуры карты живут отдельно, в
   russia-map-regions.ts, и в список не попадают намеренно. */
import fs from "node:fs";

const DISTRICTS = {
  CFO: ["BEL","BRY","VLA","VOR","IVA","KLU","KOS","KRS","LIP","MOS","ORL","RYA","SMO","TAM","TVE","TUL","YAR"],
  SZFO: ["ARK","VLG","KGD","KR","KO","LEN","MUR","NEN","NGR","PSK"],
  UFO: ["AD","AST","VGG","KL","KDA","CR","ROS","DON","LUG","ZP","KHE"],
  SKFO: ["DA","IN","KB","KC","SE","STA","CE"],
  PFO: ["BA","KIR","ME","MO","NIZ","ORE","PNZ","PER","SAM","SAR","TA","UD","ULY","CU"],
  URFO: ["KGN","SVE","TYU","KHM","CHE","YAN"],
  SFO: ["ALT","AL","IRK","KEM","KYA","NVS","OMS","TOM","TY","KK"],
  DFO: ["AMU","BU","YEV","ZAB","KAM","MAG","PRI","SA","SAK","KHA","CHU"],
};

const byCode = new Map();
for (const [district, codes] of Object.entries(DISTRICTS)) {
  for (const code of codes) {
    if (byCode.has(code)) throw new Error("дубль кода: " + code);
    byCode.set("RU-" + code, district);
  }
}

const src = fs.readFileSync("src/components/public/russia-map-regions.ts", "utf8");
const re = /code: "([^"]+)",\s*\n\s*name: "([^"]+)",\s*\n\s*slug: "([^"]+)",/g;
const regions = [];
let m;
while ((m = re.exec(src))) regions.push({ code: m[1], name: m[2], slug: m[3] });

const missing = regions.filter((r) => !byCode.has(r.code));
if (missing.length) throw new Error("нет округа: " + missing.map((r) => r.code).join(", "));
const extra = [...byCode.keys()].filter((c) => !regions.some((r) => r.code === c));
if (extra.length) throw new Error("лишний код: " + extra.join(", "));

const order = Object.keys(DISTRICTS);
regions.sort(
  (a, b) =>
    order.indexOf(byCode.get(a.code)) - order.indexOf(byCode.get(b.code)) ||
    a.name.localeCompare(b.name, "ru"),
);

const rows = regions
  .map(
    (r) =>
      `  { code: "${r.code}", name: "${r.name}", slug: "${r.slug}", district: "${byCode.get(r.code)}" },`,
  )
  .join("\n");

const file = `/* Плоский список регионов: код, название, слаг и федеральный округ.

   Отдельно от russia-map-regions.ts намеренно: там к каждому региону лежат
   контуры карты — это 130 КБ строк, и мобильному списку регионов они не нужны.
   Список пересобирается скриптом из того же файла, когда карта меняется.

   Округа — восемь, по перечню субъектов; Москва, Санкт-Петербург и Севастополь
   отдельными строками не идут: на карте они нарисованы вместе с соседом. */
export type FederalDistrictCode =
${order.map((code) => `  | "${code}"`).join("\n")};

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
${rows}
];
`;

fs.writeFileSync("src/components/public/russia-regions-index.ts", file);
console.log("регионов:", regions.length);
