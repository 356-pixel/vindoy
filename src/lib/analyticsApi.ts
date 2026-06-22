import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { RETENTION_DAYS, utcDateString } from "./analytics";

export type AnalyticsStatDoc = {
  trackingId: string;
  date: string; // YYYY-MM-DD
  hourBatch: number; // 0..5
  totalClicks: number;
  totalLinksGenerated: number;
  links?: Record<string, { clicks?: number; generated?: number }>;
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

  const constraints = [where("date", ">=", from), where("date", "<=", to)];
  if (opts.trackingId) constraints.push(where("trackingId", "==", opts.trackingId));

  const q = query(collection(db, "analytics_stats"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AnalyticsStatDoc);
}

/** Aggregates docs (across hourBatches) into (date, trackingId) rows. */
export function rollupByDateTracking(docs: AnalyticsStatDoc[]): DailyTrackingRow[] {
  const map = new Map<string, DailyTrackingRow>();
  for (const d of docs) {
    const key = `${d.date}__${d.trackingId}`;
    let row = map.get(key);
    if (!row) {
      row = {
        date: d.date,
        trackingId: d.trackingId,
        linksGenerated: 0,
        totalClicks: 0,
        links: [],
      };
      map.set(key, row);
    }
    row.linksGenerated += d.totalLinksGenerated || 0;
    row.totalClicks += d.totalClicks || 0;
    if (d.links) {
      const bySlug = new Map(row.links.map((l) => [l.slug, l]));
      for (const [slug, v] of Object.entries(d.links)) {
        const existing = bySlug.get(slug);
        if (existing) existing.clicks += v.clicks || 0;
        else {
          const link = { slug, clicks: v.clicks || 0 };
          bySlug.set(slug, link);
          row.links.push(link);
        }
      }
    }
  }
  const rows = Array.from(map.values());
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  for (const r of rows) r.links.sort((a, b) => b.clicks - a.clicks);
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
