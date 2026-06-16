import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Article } from "./articleTypes";

// Single global article — applies to every preview page.
const COL = "articles";
export const DEFAULT_ID = "default";

type ArticleDoc = { article: Article };

/** Recursively strip undefined values — Firestore rejects them. */
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

export async function getDefaultArticle(): Promise<Article | null> {
  const snap = await getDoc(doc(db, COL, DEFAULT_ID));
  if (snap.exists()) return (snap.data() as ArticleDoc).article ?? null;
  return null;
}

export async function saveArticle(id: string, article: Article) {
  await setDoc(doc(db, COL, id), {
    article: sanitize(article),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteArticle(id: string) {
  if (id === DEFAULT_ID) return;
  await deleteDoc(doc(db, COL, id));
}
