import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Article } from "./articleTypes";

const COL = "articles";
const SETTINGS_DOC = "settings/active_article";

export const DEFAULT_ID = "default"; // kept for backwards compat

export type ArticleMeta = {
  id: string;
  article: Article;
  createdAt: number; // ms
  updatedAt: number; // ms
};

/** Recursively strip undefined — Firestore rejects them. */
function sanitize<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sanitize) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = sanitize(v);
    }
    return out as T;
  }
  return value;
}

function tsToMs(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  return Date.now();
}

export function newArticleId(): string {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function listArticles(): Promise<ArticleMeta[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const items: ArticleMeta[] = [];
  snap.forEach((d) => {
    const data = d.data() as { article?: Article; createdAt?: unknown; updatedAt?: unknown };
    if (!data.article) return;
    items.push({
      id: d.id,
      article: data.article,
      createdAt: tsToMs(data.createdAt),
      updatedAt: tsToMs(data.updatedAt),
    });
  });
  return items;
}

export async function getArticle(id: string): Promise<Article | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return ((snap.data() as { article?: Article }).article) ?? null;
}

export async function getActiveArticleId(): Promise<string | null> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) return null;
  return ((snap.data() as { activeId?: string }).activeId) ?? null;
}

export async function setActiveArticleId(id: string) {
  await setDoc(doc(db, SETTINGS_DOC), { activeId: id, updatedAt: serverTimestamp() });
}

/** Fetch the article shown on preview pages. Falls back to most recent. */
export async function getActiveArticle(): Promise<Article | null> {
  const activeId = await getActiveArticleId();
  if (activeId) {
    const a = await getArticle(activeId);
    if (a) return a;
  }
  // Fallback: legacy "default" doc
  const legacy = await getArticle(DEFAULT_ID);
  if (legacy) return legacy;
  // Fallback: most recent in list
  const list = await listArticles();
  return list[0]?.article ?? null;
}

/** Back-compat: same name used by Admin earlier. */
export const getDefaultArticle = getActiveArticle;

export async function saveArticle(id: string, article: Article, isNew = false) {
  const ref = doc(db, COL, id);
  const payload: Record<string, unknown> = {
    article: sanitize(article),
    updatedAt: serverTimestamp(),
  };
  if (isNew) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: !isNew });
}

export async function deleteArticle(id: string) {
  await deleteDoc(doc(db, COL, id));
}
