import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type BannerAd = {
  image: string; // data URL (compressed <= ~40KB)
  title: string;
  url: string;
  updatedAt?: string;
};

const BANNER_ADS_COL = "bannerAds";
const BANNER_DOC = "default";

export const DEFAULT_BANNER: BannerAd = {
  image:
    "https://firebasestorage.googleapis.com/v0/b/vindoy-45678.firebasestorage.app/o/NEWBANNE.jpeg?alt=media&token=a13d3b03-e634-4ec1-ad86-0440eeeeb23d",
  title:
    "Respond to Surveys and Earn up to $300 */Month? It's possible ! Earn money online from home",
  url: "https://appsave.online/sl/85yd1",
};

export async function getBannerAd(): Promise<BannerAd> {
  try {
    const snap = await getDoc(doc(db, BANNER_ADS_COL, BANNER_DOC));
    if (snap.exists()) {
      const data = snap.data() as Partial<BannerAd>;
      return {
        image: data.image || DEFAULT_BANNER.image,
        title: data.title ?? DEFAULT_BANNER.title,
        url: data.url || DEFAULT_BANNER.url,
        updatedAt: data.updatedAt,
      };
    }
  } catch (e) {
    console.warn("bannerAd load:", e);
  }
  return DEFAULT_BANNER;
}

export async function saveBannerAd(ad: BannerAd): Promise<void> {
  await setDoc(
    doc(db, BANNER_ADS_COL, BANNER_DOC),
    { ...ad, updatedAt: new Date().toISOString(), _ts: serverTimestamp() },
    { merge: true },
  );
}
