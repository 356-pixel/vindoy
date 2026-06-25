import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Article, PreviewDoc } from "./articleTypes";

export async function incrementPreviewClicks(slug: string): Promise<void> {
  try {
    await setDoc(doc(db, COL, slug), { clicks: increment(1) }, { merge: true });
  } catch (e) {
    console.warn("clicks:", e);
  }
}

const COL = "previews";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function generateSlug(len = 5): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

export async function generateUniqueSlug(len = 5, maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateSlug(len);
    const existing = await getDoc(doc(db, COL, slug));
    if (!existing.exists()) return slug;
  }
  throw new Error("Could not generate a unique slug. Please try again.");
}

export async function createPreview(p: Omit<PreviewDoc, "countries"> & { countries?: Record<string, Article> }) {
  const payload: PreviewDoc & { _ts?: unknown } = {
    ...p,
    countries: p.countries ?? {},
  };
  await setDoc(doc(db, COL, p.slug), { ...payload, _ts: serverTimestamp() });
}

export async function getPreviewDoc(slug: string): Promise<PreviewDoc | null> {
  const snap = await getDoc(doc(db, COL, slug));
  if (!snap.exists()) return null;
  return snap.data() as PreviewDoc;
}

export async function listPreviews(): Promise<PreviewDoc[]> {
  try {
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PreviewDoc);
  } catch {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map((d) => d.data() as PreviewDoc);
  }
}

export async function updatePreviewArticles(
  slug: string,
  defaultArticle: Article,
  countries: Record<string, Article>,
) {
  await updateDoc(doc(db, COL, slug), {
    default: defaultArticle,
    countries,
  });
}

export async function deletePreview(slug: string) {
  await deleteDoc(doc(db, COL, slug));
}
