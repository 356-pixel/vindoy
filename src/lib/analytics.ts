import { db } from "./firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { ALLOWED_TRACKING_IDS, SHAREABLE_DOMAIN } from "./adminConfig";

/**
 * Direct-to-Firestore analytics (no Cloud Functions, no batching, no aggregation jobs).
 *
 * Schema:
 *   tracking_analytics/{trackingId}
 *     { trackingId, totalLinksGenerated, totalClicks, createdAt, lastClickAt }
 *
 *   tracking_analytics/{trackingId}/links/{slug}
 *     { shortUrl, clicks, createdAt, lastClickAt }
 *
 *   tracking_analytics/{trackingId}/days/{YYYY-MM-DD}
 *     { date, linksGenerated, clicks }
 *     (powers the Today / This week / This month summary cards)
 *
 * Only writes for links that carry a valid (admin-issued) trackingId. Untracked
 * links are completely ignored.
 *
 * 60-day rule: nothing is deleted. The admin dashboard filters records whose
 * createdAt and lastClickAt are both older than 60 days.
 */

export const RETENTION_DAYS = 60;
export const REFRESH_HOURS = 3;
export const REFRESH_MS = REFRESH_HOURS * 60 * 60 * 1000;

export function utcDateString(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalise inputs (always uppercase). Returns canonical id from the allow-list, or null. */
export function canonicalTrackingId(id: string | undefined | null): string | null {
  if (!id) return null;
  const t = String(id).trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,64}$/.test(t)) return null;
  const hit = (ALLOWED_TRACKING_IDS as readonly string[]).find(
    (a) => a.toUpperCase() === t,
  );
  return hit ? hit.toUpperCase() : null;
}

export function isValidTrackingId(id: string | undefined | null): id is string {
  return canonicalTrackingId(id) !== null;
}

function rootRef(trackingId: string) {
  return doc(db, "tracking_analytics", trackingId);
}
function linkRef(trackingId: string, slug: string) {
  return doc(db, "tracking_analytics", trackingId, "links", slug);
}
function dayRef(trackingId: string, date: string) {
  return doc(db, "tracking_analytics", trackingId, "days", date);
}

export async function recordLinkGenerated(trackingId: string, slug: string): Promise<void> {
  const tid = canonicalTrackingId(trackingId);
  if (!tid) return;
  const now = Timestamp.now();
  const today = utcDateString();
  const shortUrl = `${SHAREABLE_DOMAIN}/${slug}`;

  await Promise.all([
    setDoc(
      rootRef(tid),
      {
        trackingId: tid,
        totalLinksGenerated: increment(1),
        createdAt: now, // overwritten on first write only via merge — keep most recent activity instead
        lastClickAt: null,
      },
      { merge: true },
    ),
    setDoc(
      linkRef(tid, slug),
      {
        shortUrl,
        clicks: increment(0),
        createdAt: now,
      },
      { merge: true },
    ),
    setDoc(
      dayRef(tid, today),
      {
        date: today,
        linksGenerated: increment(1),
      },
      { merge: true },
    ),
  ]);
}

export async function recordClick(trackingId: string, slug: string): Promise<void> {
  const tid = canonicalTrackingId(trackingId);
  if (!tid) return;
  const now = serverTimestamp();
  const today = utcDateString();
  const shortUrl = `${SHAREABLE_DOMAIN}/${slug}`;

  await Promise.all([
    setDoc(
      rootRef(tid),
      {
        trackingId: tid,
        totalClicks: increment(1),
        lastClickAt: now,
      },
      { merge: true },
    ),
    setDoc(
      linkRef(tid, slug),
      {
        shortUrl,
        clicks: increment(1),
        lastClickAt: now,
      },
      { merge: true },
    ),
    setDoc(
      dayRef(tid, today),
      {
        date: today,
        clicks: increment(1),
      },
      { merge: true },
    ),
  ]);
}
