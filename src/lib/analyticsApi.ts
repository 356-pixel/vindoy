import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { RETENTION_DAYS, utcDateString } from "./analytics";

/**
 * Read-side analytics helpers used by the admin dashboard.
 *
 * All reads obey the 60-day rule: a tracking record is included only when its
 * createdAt OR lastClickAt is within the last 60 days. Nothing is ever deleted
 * server-side; older docs simply drop out of the dashboard view.
 */

export type LinkBreakdown = {
  slug: string;
  shortUrl: string;
  clicks: number;
  lastClickAt?: number; // epoch ms
};

export type DayPoint = {
  date: string; // YYYY-MM-DD
  linksGenerated: number;
  clicks: number;
};

export type TrackingAnalytics = {
  trackingId: string;
  totalLinksGenerated: number;
  totalClicks: number;
  createdAt?: number; // epoch ms
  lastClickAt?: number; // epoch ms
  links: LinkBreakdown[];
  days: DayPoint[];
};

function tsToMs(v: unknown): number | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toMillis();
  // Firestore Web SDK sometimes returns plain { seconds, nanoseconds }
  if (typeof v === "object" && v !== null && "seconds" in (v as Record<string, unknown>)) {
    const s = (v as { seconds: number }).seconds;
    return s * 1000;
  }
  return undefined;
}

function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/** Fetches every tracking_analytics doc plus its links + days subcollections (one-shot, no live listeners). */
export async function fetchAllTrackingAnalytics(): Promise<TrackingAnalytics[]> {
  const rootSnap = await getDocs(collection(db, "tracking_analytics"));
  const cutoff = daysAgoMs(RETENTION_DAYS);

  const out: TrackingAnalytics[] = await Promise.all(
    rootSnap.docs.map(async (d) => {
      const data = d.data() as Record<string, unknown>;
      const trackingId = (data.trackingId as string) || d.id;
      const createdAt = tsToMs(data.createdAt);
      const lastClickAt = tsToMs(data.lastClickAt);

      const [linksSnap, daysSnap] = await Promise.all([
        getDocs(collection(db, "tracking_analytics", d.id, "links")),
        getDocs(collection(db, "tracking_analytics", d.id, "days")),
      ]);

      const links: LinkBreakdown[] = linksSnap.docs.map((ld) => {
        const v = ld.data() as Record<string, unknown>;
        return {
          slug: ld.id,
          shortUrl: (v.shortUrl as string) || "",
          clicks: Number(v.clicks || 0),
          lastClickAt: tsToMs(v.lastClickAt),
        };
      });

      const days: DayPoint[] = daysSnap.docs.map((dd) => {
        const v = dd.data() as Record<string, unknown>;
        return {
          date: (v.date as string) || dd.id,
          linksGenerated: Number(v.linksGenerated || 0),
          clicks: Number(v.clicks || 0),
        };
      });

      return {
        trackingId,
        totalLinksGenerated: Number(data.totalLinksGenerated || 0),
        totalClicks: Number(data.totalClicks || 0),
        createdAt,
        lastClickAt,
        links,
        days,
      };
    }),
  );

  // 60-day rule.
  return out.filter((t) => {
    const newest = Math.max(t.createdAt || 0, t.lastClickAt || 0);
    return newest >= cutoff;
  });
}

/** Sums links/clicks across all tracking IDs for the given UTC date window (inclusive). */
export function sumDays(
  data: TrackingAnalytics[],
  fromDate: string,
  toDate: string,
): { links: number; clicks: number } {
  let links = 0;
  let clicks = 0;
  for (const t of data) {
    for (const day of t.days) {
      if (day.date >= fromDate && day.date <= toDate) {
        links += day.linksGenerated;
        clicks += day.clicks;
      }
    }
  }
  return { links, clicks };
}

export function todayRange(): { from: string; to: string } {
  const t = utcDateString();
  return { from: t, to: t };
}

export function weekRange(): { from: string; to: string } {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 6);
  return { from: utcDateString(d), to: utcDateString() };
}

export function monthRange(): { from: string; to: string } {
  const d = new Date();
  const from = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { from, to: utcDateString() };
}

/** Filter list by date window + optional trackingId. Date window uses lastClickAt OR createdAt. */
export function filterAnalytics(
  data: TrackingAnalytics[],
  fromDate: string,
  toDate: string,
  trackingId?: string,
): TrackingAnalytics[] {
  const fromMs = Date.parse(`${fromDate}T00:00:00Z`);
  const toMs = Date.parse(`${toDate}T23:59:59Z`);
  return data.filter((t) => {
    if (trackingId && t.trackingId !== trackingId) return false;
    const newest = Math.max(t.createdAt || 0, t.lastClickAt || 0);
    if (!newest) return false;
    return newest >= fromMs && newest <= toMs;
  });
}
