export type Preview = {
  slug: string;
  title: string;
  sourceUrl: string;
  content: string;
  image: string; // data URL
  createdAt: string;
};

const KEY = "article_previews_v1";

export function getAllPreviews(): Preview[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function getPreview(slug: string): Preview | undefined {
  return getAllPreviews().find((p) => p.slug === slug);
}

export function savePreview(p: Preview) {
  const all = getAllPreviews();
  all.unshift(p);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
}

const ALPHA = "abcdefghijklmnopqrstuvwxyz";
export function generateSlug(): string {
  const existing = new Set(getAllPreviews().map((p) => p.slug));
  for (let i = 0; i < 50; i++) {
    let s = "";
    for (let j = 0; j < 5; j++) s += ALPHA[Math.floor(Math.random() * 26)];
    if (!existing.has(s)) return s;
  }
  return Date.now().toString(36).slice(-5);
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitize(str: string): string {
  return str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<\/?(iframe|object|embed)[^>]*>/gi, "");
}

export function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}
