export type TextBlock = { id: string; type: "text"; html: string };
export type ImageBlock = { id: string; type: "image"; src: string; alt?: string };
export type CtaBlock = { id: string; type: "cta"; label: string; url: string };
export type Block = TextBlock | ImageBlock | CtaBlock;

export type Article = {
  title: string;
  blocks: Block[];
};

export type PreviewDoc = {
  slug: string;
  sourceUrl: string;
  image: string; // data URL, ~40KB jpeg
  createdAt: string;
  default: Article;
  countries: Record<string, Article>; // ISO2 -> override
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyArticle(title = ""): Article {
  return {
    title,
    blocks: [{ id: newId(), type: "text", html: "" }],
  };
}

export function placeholderDefaultArticle(sourceUrl: string): Article {
  let host = "the source";
  try {
    host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    // ignore
  }
  return {
    title: `A quick preview from ${host}`,
    blocks: [
      {
        id: newId(),
        type: "text",
        html:
          `Here's a short preview of an article published on ${host}. ` +
          `It gives you the gist before you head over to read the full piece — ` +
          `useful when you want to decide quickly whether something is worth your time.\n\n` +
          `Tap the "View Here" button above to read the complete article on the original website.`,
      },
      {
        id: newId(),
        type: "cta",
        label: "Read the full article",
        url: sourceUrl,
      },
    ],
  };
}
