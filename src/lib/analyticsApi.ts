import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { RETENTION_DAYS, utcDateString } from "./analytics";

/**
 * Aggregated analytics doc, stored at:
 *   analytics_stats/{trackingId}/days/{YYYY-MM-DD}
 *
 * Per-link breakdown lives in `perLinkBreakdown` as a map keyed by slug.
 */
export type AnalyticsStatDoc = {
  trackingId: string;
  date: string; // YYYY-MM-DD
  totalClicks: number;
  totalLinksGenerated: number;
  perLinkBreakdown?: Record<string, { clicks?: number; generated?: number }>;
  updatedAt?: unknown;
};

export type DailyTrackingRow = {
  date: string;
  trackingId: string;
  linksGenerated: number;
  totalClicks: number;
  links: { slug: string; clicks: number }[];
};

function daysAgoDateStr(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return utcDateString(d);
}

/** Reads aggregated stats. Filters out anything older than RETENTION_DAYS. */
export async function fetchAnalytics(opts: {
  fromDate?: string; // YYYY-MM-DD inclusive (UTC)
  toDate?: string; // YYYY-MM-DD inclusive (UTC)
  trackingId?: string;
}): Promise<AnalyticsStatDoc[]> {
  const retentionFloor = daysAgoDateStr(RETENTION_DAYS);
  const from = opts.fromDate && opts.fromDate > retentionFloor ? opts.fromDate : retentionFloor;
  const to = opts.toDate ?? utcDateString();

  // When filtering by a single tracking id, query its `days` subcollection directly
  // — cheaper than a collectionGroup scan.
  const q = opts.trackingId
    ? query(
        collection(db, "analytics_stats", opts.trackingId, "days"),
        where("date", ">=", from),
        where("date", "<=", to),
      )
    : query(
        collectionGroup(db, "days"),
        where("date", ">=", from),
        where("date", "<=", to),
      );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AnalyticsStatDoc);
}

/** Shapes per-day docs into the rows the dashboard already renders. */
export function rollupByDateTracking(docs: AnalyticsStatDoc[]): DailyTrackingRow[] {
  const rows: DailyTrackingRow[] = docs.map((d) => {
    const links = Object.entries(d.perLinkBreakdown || {}).map(([slug, v]) => ({
      slug,
      clicks: v.clicks || 0,
    }));
    links.sort((a, b) => b.clicks - a.clicks);
    return {
      date: d.date,
      trackingId: d.trackingId,
      linksGenerated: d.totalLinksGenerated || 0,
      totalClicks: d.totalClicks || 0,
      links,
    };
  });
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return rows;
}

export function summariseTotals(docs: AnalyticsStatDoc[]) {
  let clicks = 0;
  let links = 0;
  for (const d of docs) {
    clicks += d.totalClicks || 0;
    links += d.totalLinksGenerated || 0;
  }
  return { clicks, links };
}
