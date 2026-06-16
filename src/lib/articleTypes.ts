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

export function placeholderDefaultArticle(_sourceUrl: string): Article {
  return {
    title: "",
    blocks: [],
  };
}
