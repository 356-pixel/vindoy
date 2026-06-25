import { ALLOWED_TRACKING_IDS } from "./adminConfig";

/**
 * Lightweight helpers. Click tracking lives directly on the `previews/{slug}`
 * document via `trackingId` and `clicks` fields — there is no separate
 * tracking_analytics collection any more.
 */

export const RETENTION_DAYS = 60;

export function utcDateString(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
