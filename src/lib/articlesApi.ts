import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Article } from "./articleTypes";

// Global articles collection — keyed by country code (e.g. "IN", "US")
// or the literal id "default" for the rest of the world fallback.
const COL = "articles";
export const DEFAULT_ID = "default";

type ArticleDoc = { article: Article };

export async function listAllArticles(): Promise<Record<string, Article>> {
  const snap = await getDocs(collection(db, COL));
  const out: Record<string, Article> = {};
  snap.docs.forEach((d) => {
    const data = d.data() as ArticleDoc;
    if (data?.article) out[d.id] = data.article;
  });
  return out;
}

export async function getArticleForCountry(
  countryCode: string,
): Promise<Article | null> {
  if (countryCode) {
    const snap = await getDoc(doc(db, COL, countryCode));
    if (snap.exists()) {
      const data = snap.data() as ArticleDoc;
      if (data?.article) return data.article;
    }
  }
  const def = await getDoc(doc(db, COL, DEFAULT_ID));
  if (def.exists()) return (def.data() as ArticleDoc).article ?? null;
  return null;
}

export async function saveArticle(id: string, article: Article) {
  await setDoc(doc(db, COL, id), {
    article,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteArticle(id: string) {
  if (id === DEFAULT_ID) return; // never delete the global default
  await deleteDoc(doc(db, COL, id));
}
