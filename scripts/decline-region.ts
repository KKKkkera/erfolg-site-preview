/* Склонение названий регионов: предложный ("в Амурской области") и
   винительный ("в Амурскую область") падежи.

   Нужно для шаблонных текстов страниц регионов — без склонения выходит
   «поставка в Амурская область». Список из 86 регионов закрыт и лежит в
   коде, поэтому правил + горстки исключений достаточно. */

const IRREGULAR: Record<string, { prep: string; acc: string }> = {
  "Москва и Московская область": { prep: "Москве и Московской области", acc: "Москву и Московскую область" },
  "Санкт-Петербург и Ленинградская область": { prep: "Санкт-Петербурге и Ленинградской области", acc: "Санкт-Петербург и Ленинградскую область" },
  "Республика Крым и Севастополь": { prep: "Республике Крым и Севастополе", acc: "Республику Крым и Севастополь" },
  "Кемеровская область — Кузбасс": { prep: "Кемеровской области — Кузбассе", acc: "Кемеровскую область — Кузбасс" },
  "Ханты-Мансийский автономный округ — Югра": { prep: "Ханты-Мансийском автономном округе — Югре", acc: "Ханты-Мансийский автономный округ — Югру" },
};
const INDECLINABLE_REP = new Set(["Марий Эл", "Саха (Якутия)", "Коми", "Тыва", "Алтай", "Башкортостан", "Дагестан", "Татарстан", "Северная Осетия — Алания"]);

/* Склоняем каждое слово определения, а не только последнее: у «Еврейская
   автономная область» прилагательных два, и правка хвоста давала
   «в Еврейская автономной области». */
function femAdj(phrase: string, c: "prep" | "acc"): string {
  return phrase
    .split(" ")
    .map((w) => {
      if (w.endsWith("ая")) return w.slice(0, -2) + (c === "prep" ? "ой" : "ую");
      if (w.endsWith("яя")) return w.slice(0, -2) + (c === "prep" ? "ей" : "юю");
      return w;
    })
    .join(" ");
}
// Мягкая основа только у -ний/-ский с мягким согласным? Нет: -ий после
// шипящей/к/г/х даёт -ом. Практически у всех регионов основа твёрдая: -ом.
function mascAdj(phrase: string, c: "prep" | "acc"): string {
  if (c === "acc") return phrase;
  return phrase
    .split(" ")
    .map((w) =>
      w.endsWith("ий") || w.endsWith("ый") || w.endsWith("ой")
        ? w.slice(0, -2) + "ом"
        : w,
    )
    .join(" ");
}
function femNoun(w: string, c: "prep" | "acc"): string {
  // -ия → предл. -ии (Бурятия → Бурятии), вин. -ию
  if (w.endsWith("ия")) return w.slice(0, -1) + (c === "prep" ? "и" : "ю");
  if (w.endsWith("а")) return w.slice(0, -1) + (c === "prep" ? "е" : "у");
  if (w.endsWith("я")) return w.slice(0, -1) + (c === "prep" ? "е" : "ю");
  return w;
}

export function declineRegion(name: string, c: "prep" | "acc"): string {
  const irr = IRREGULAR[name];
  if (irr) return irr[c];

  if (name.endsWith(" область")) {
    const adj = name.slice(0, -" область".length);
    return `${femAdj(adj, c)} ${c === "prep" ? "области" : "область"}`;
  }
  if (name.endsWith(" край")) {
    const adj = name.slice(0, -" край".length);
    return `${mascAdj(adj, c)} ${c === "prep" ? "крае" : "край"}`;
  }
  if (name.endsWith(" автономный округ")) {
    const adj = name.slice(0, -" автономный округ".length);
    return `${mascAdj(adj, c)} ${c === "prep" ? "автономном округе" : "автономный округ"}`;
  }
  if (name.startsWith("Республика ")) {
    const rest = name.slice("Республика ".length);
    const head = c === "prep" ? "Республике" : "Республику";
    return `${head} ${INDECLINABLE_REP.has(rest) ? rest : femNoun(rest, c)}`;
  }
  // Порядок важен: "Народная Республика" длиннее и проверяется раньше.
  if (name.endsWith(" Народная Республика")) {
    const adj = name.slice(0, -" Народная Республика".length);
    return `${femAdj(adj, c)} ${c === "prep" ? "Народной Республике" : "Народную Республику"}`;
  }
  if (name.endsWith(" Республика")) {
    const adj = name.slice(0, -" Республика".length);
    return `${femAdj(adj, c)} ${c === "prep" ? "Республике" : "Республику"}`;
  }
  return name;
}
