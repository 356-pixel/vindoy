import { db } from "./firebase";
import { doc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { ALLOWED_TRACKING_IDS } from "./adminConfig";

// Each batch is a 4-hour window. UTC-based to match Cloud Scheduler.
export const BATCH_HOURS = 4;
export const BATCHES_PER_DAY = 24 / BATCH_HOURS; // 6
export const RETENTION_DAYS = 60;

export function utcDateString(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentHourBatch(d: Date = new Date()): number {
  return Math.floor(d.getUTCHours() / BATCH_HOURS);
}

/** Bucket id used inside the per-tracking-id click_buffer subcollection: YYYY-MM-DD-HH (UTC hour). */
export function currentDateHour(d: Date = new Date()): string {
  return `${utcDateString(d)}-${String(d.getUTCHours()).padStart(2, "0")}`;
}

export function nextBatchBoundary(d: Date = new Date()): Date {
  const next = new Date(d);
  next.setUTCMinutes(0, 0, 0);
  const nextBatch = (currentHourBatch(d) + 1) * BATCH_HOURS;
  if (nextBatch >= 24) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0);
  } else {
    next.setUTCHours(nextBatch);
  }
  return next;
}

/** Returns canonical (admin-issued) tracking id if input matches the allow-list, else null. */
export function canonicalTrackingId(id: string | undefined | null): string | null {
  if (!id) return null;
  const t = String(id).trim();
  if (!/^[A-Za-z0-9_-]{2,64}$/.test(t)) return null;
  const hit = (ALLOWED_TRACKING_IDS as readonly string[]).find(
    (a) => a.toLowerCase() === t.toLowerCase(),
  );
  return hit ?? null;
}

/** Validates a tracking id against the admin allow-list. */
export function isValidTrackingId(id: string | undefined | null): id is string {
  return canonicalTrackingId(id) !== null;
}

/**
 * Raw click buffer path:
 *   click_buffer/{trackingId}/hours/{YYYY-MM-DD-HH}
 *
 * Fields:
 *   clickCount        — incremented per click
 *   linksGenerated    — incremented per generated link
 *   slugs.<slug>.clicks    — per-link click counter
 *   slugs.<slug>.generated — per-link generation counter
 *   processed         — set to true by the 4-hour aggregator (never deleted here)
 *   updatedAt         — serverTimestamp
 *
 * Only docs for valid trackingIds are ever written. This collapses what used to be
 * one-doc-per-slug-per-batch into a single bucket per tracking-id per UTC hour.
 */
function bufferRef(trackingId: string, dateHour: string) {
  return doc(db, "click_buffer", trackingId, "hours", dateHour);
}

export async function recordLinkGenerated(trackingId: string, slug: string): Promise<void> {
  if (!isValidTrackingId(trackingId)) return;
  const now = new Date();
  await setDoc(
    bufferRef(trackingId, currentDateHour(now)),
    {
      trackingId,
      date: utcDateString(now),
      hour: now.getUTCHours(),
      linksGenerated: increment(1),
      [`slugs.${slug}.generated`]: increment(1),
      processed: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function recordClick(trackingId: string, slug: string): Promise<void> {
  if (!isValidTrackingId(trackingId)) return;
  const now = new Date();
  await setDoc(
    bufferRef(trackingId, currentDateHour(now)),
    {
      trackingId,
      date: utcDateString(now),
      hour: now.getUTCHours(),
      clickCount: increment(1),
      [`slugs.${slug}.clicks`]: increment(1),
      processed: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
