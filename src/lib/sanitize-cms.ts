import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "strong", "em", "b", "i", "u", "s", "mark", "small", "sub", "sup",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td", "caption", "colgroup", "col",
  "blockquote", "code", "pre", "kbd", "samp",
  "div", "span", "figure", "figcaption",
];

const SCHEMES = ["http", "https", "mailto", "tel"];

export function sanitizeCmsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class", "id", "lang", "dir"],
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      col: ["span"],
      colgroup: ["span"],
    },
    allowedSchemes: SCHEMES,
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const isExternal = /^https?:\/\//i.test(href) && !href.startsWith("https://erfolgmt.ru");
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer nofollow" }
              : {}),
          },
        };
      },
    },
    disallowedTagsMode: "discard",
  });
}
