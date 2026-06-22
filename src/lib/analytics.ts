import { db } from "./firebase";
import { doc, setDoc, serverTimestamp, increment } from "firebase/firestore";

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

/** Validates a tracking id (admin-issued). Loose format: alnum+dash+underscore, 2-64 chars. */
export function isValidTrackingId(id: string | undefined | null): id is string {
  if (!id) return false;
  const t = String(id).trim();
  return /^[A-Za-z0-9_-]{2,64}$/.test(t);
}

/**
 * Raw counter doc id: trackingId__date__hourBatch__slug
 * Stores incremental clicks & link generation marker until the Cloud Function aggregates it.
 * Only docs for valid trackingIds are ever written.
 */
function rawDocId(trackingId: string, date: string, batch: number, slug: string) {
  return `${trackingId}__${date}__${batch}__${slug}`;
}

export async function recordLinkGenerated(trackingId: string, slug: string): Promise<void> {
  if (!isValidTrackingId(trackingId)) return;
  const now = new Date();
  const date = utcDateString(now);
  const batch = currentHourBatch(now);
  const id = rawDocId(trackingId, date, batch, slug);
  await setDoc(
    doc(db, "raw_counters", id),
    {
      trackingId,
      slug,
      date,
      hourBatch: batch,
      linksGenerated: increment(1),
      processed: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function recordClick(trackingId: string, slug: string): Promise<void> {
  if (!isValidTrackingId(trackingId)) return;
  const now = new Date();
  const date = utcDateString(now);
  const batch = currentHourBatch(now);
  const id = rawDocId(trackingId, date, batch, slug);
  await setDoc(
    doc(db, "raw_counters", id),
    {
      trackingId,
      slug,
      date,
      hourBatch: batch,
      clicks: increment(1),
      processed: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
