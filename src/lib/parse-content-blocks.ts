import { BLOCKS_BY_TYPE } from "@/lib/content-blocks";

/* Разбор шорткодов [[block:type key="value"]] в потоке HTML из редактора.

   Результат — плоский список сегментов в исходном порядке: куски HTML и
   распознанные блоки. HTML-куски рендерятся через sanitizeCmsHtml, блоки —
   компонентами. Неизвестный тип блока выбрасывается: иначе на странице
   останется голый текст шорткода.

   Шорткод может приехать завёрнутым в <p>…</p> — TipTap оборачивает любую
   строку в параграф. Такую обёртку снимаем, чтобы блок не оказался внутри
   параграфа (невалидный HTML: секция внутри <p>). */

export type ContentSegment =
  | { kind: "html"; html: string }
  | { kind: "block"; type: string; params: Record<string, string> };

/** [[block:type ...]], опционально внутри одного пустого параграфа. */
const SHORTCODE_RE =
  /(?:<p[^>]*>\s*)?\[\[block:([a-z0-9-]+)((?:\s+[a-zA-Z0-9_-]+="[^"]*")*)\s*\]\](?:\s*<\/p>)?/g;

const PARAM_RE = /([a-zA-Z0-9_-]+)="([^"]*)"/g;

function parseParams(raw: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!raw) return params;
  for (const m of raw.matchAll(PARAM_RE)) {
    params[m[1]] = m[2];
  }
  return params;
}

export function parseContentBlocks(content: string): ContentSegment[] {
  if (!content) return [];

  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(SHORTCODE_RE)) {
    const start = match.index ?? 0;
    const type = match[1];

    // Неизвестный блок — не сегмент и не текст: просто пропускаем разметку,
    // чтобы читатель не увидел «[[block:whatever]]».
    const known = BLOCKS_BY_TYPE.has(type);

    const before = content.slice(lastIndex, start);
    if (before.trim()) segments.push({ kind: "html", html: before });

    if (known) {
      segments.push({ kind: "block", type, params: parseParams(match[2]) });
    }
    lastIndex = start + match[0].length;
  }

  const tail = content.slice(lastIndex);
  if (tail.trim()) segments.push({ kind: "html", html: tail });

  return segments;
}

/** Есть ли в контенте хоть один шорткод (в т.ч. неизвестного типа). */
export function hasContentBlocks(content: string): boolean {
  return /\[\[block:[a-z0-9-]+/.test(content ?? "");
}

/** Собрать шорткод из типа и параметров — используется тулбаром редактора. */
export function buildShortcode(
  type: string,
  params: Record<string, string> = {},
): string {
  const attrs = Object.entries(params)
    // Кавычка внутри значения сломала бы разбор — вырезаем её на входе.
    .filter(([, v]) => v.trim() !== "")
    .map(([k, v]) => ` ${k}="${v.replace(/"/g, "")}"`)
    .join("");
  return `[[block:${type}${attrs}]]`;
}

/* ─────────────── Конструктор страниц ───────────────

   Конструктор работает со списком блоков, а хранение остаётся прежним —
   HTML с шорткодами. Эти две функции переводят одно в другое: toBuilderBlocks
   разбирает сохранённый контент в список, serializeBuilderBlocks собирает его
   обратно. Формат хранения не меняется, поэтому страницы, собранные раньше,
   открываются в конструкторе как есть. */

export type BuilderBlock = {
  /** Локальный id для drag-n-drop; в контент не сохраняется. */
  id: string;
  type: string;
  /** Только для type: "text" — HTML абзацев. */
  html: string;
  params: Record<string, string>;
};

let builderIdSeq = 0;
function nextBuilderId(): string {
  builderIdSeq += 1;
  return `b-${Date.now().toString(36)}-${builderIdSeq}`;
}

export function toBuilderBlocks(content: string): BuilderBlock[] {
  return parseContentBlocks(content).map((segment) =>
    segment.kind === "html"
      ? { id: nextBuilderId(), type: "text", html: segment.html, params: {} }
      : {
          id: nextBuilderId(),
          type: segment.type,
          html: "",
          params: segment.params,
        },
  );
}

export function serializeBuilderBlocks(blocks: BuilderBlock[]): string {
  return blocks
    .map((block) =>
      block.type === "text"
        ? block.html.trim()
        : buildShortcode(block.type, block.params),
    )
    .filter((chunk) => chunk !== "")
    .join("\n");
}

export function createBuilderBlock(
  type: string,
  params: Record<string, string> = {},
): BuilderBlock {
  return { id: nextBuilderId(), type, html: "", params };
}
