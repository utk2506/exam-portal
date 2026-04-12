import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p",
  "div",
  "span",
  "strong",
  "em",
  "u",
  "s",
  "br",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img"
];

export function sanitizeRichHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      "*": ["class", "style"],
      img: ["src", "alt", "width", "height"]
    },
    allowedSchemes: ["http", "https", "data"],
    parseStyleAttributes: true
  });
}
