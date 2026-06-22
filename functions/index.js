/**
 * Vindoy analytics — Cloud Functions.
 *
 *  • aggregateAnalytics  — every 4 hours. Reads unprocessed click_buffer hour
 *    buckets, merges them into analytics_stats/{trackingId}/days/{date} using
 *    FieldValue.increment(), then marks each buffer doc `processed: true`.
 *    Raw docs are NOT deleted here — they stay for safety/debug.
 *
 *  • cleanupRawBuffer    — once a day. Deletes click_buffer hour buckets that
 *    are both `processed: true` AND older than 60 days.
 *
 * Data model
 *   click_buffer/{trackingId}/hours/{YYYY-MM-DD-HH}
 *     { clickCount, linksGenerated, slugs: {<slug>: {clicks, generated}},
 *       processed, date, hour, updatedAt }
 *
 *   analytics_stats/{trackingId}/days/{YYYY-MM-DD}
 *     { trackingId, date, totalClicks, totalLinksGenerated,
 *       perLinkBreakdown: {<slug>: {clicks, generated}}, updatedAt }
 *
 * Deploy:
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const BATCH_HOURS = 4;
const RETENTION_DAYS = 60;
const BUFFER_GROUP = "hours";       // collectionGroup id under click_buffer/{tid}/hours
const STATS_ROOT = "analytics_stats";

function utcDateString(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoDateStr(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return utcDateString(d);
}

// ────────────────────────────────────────────────────────────────────────────
// 4-hour aggregator
// ────────────────────────────────────────────────────────────────────────────
exports.aggregateAnalytics = onSchedule(
  {
    schedule: `every ${BATCH_HOURS} hours`,
    timeZone: "Etc/UTC",
    memory: "256MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const snap = await db
      .collectionGroup(BUFFER_GROUP)
      .where("processed", "==", false)
      .get();

    if (snap.empty) {
      console.log("aggregateAnalytics: no unprocessed buffer docs");
      return;
    }

    // Group buffer docs by (trackingId, date) so each stats doc is touched once.
    const buckets = new Map();
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (!data.trackingId || !data.date) continue;
      const key = `${data.trackingId}__${data.date}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          trackingId: data.trackingId,
          date: data.date,
          totalClicks: 0,
          totalLinksGenerated: 0,
          slugs: {}, // slug -> { clicks, generated }
          refs: [],
        };
        buckets.set(key, bucket);
      }
      bucket.totalClicks += data.clickCount || 0;
      bucket.totalLinksGenerated += data.linksGenerated || 0;
      const slugs = data.slugs || {};
      for (const [slug, v] of Object.entries(slugs)) {
        const slot = bucket.slugs[slug] || { clicks: 0, generated: 0 };
        slot.clicks += (v && v.clicks) || 0;
        slot.generated += (v && v.generated) || 0;
        bucket.slugs[slug] = slot;
      }
      bucket.refs.push(docSnap.ref);
    }

    let markedProcessed = 0;
    for (const bucket of buckets.values()) {
      const statsRef = db
        .collection(STATS_ROOT)
        .doc(bucket.trackingId)
        .collection("days")
        .doc(bucket.date);

      // Ensure identifying fields exist (first write only).
      await statsRef.set(
        { trackingId: bucket.trackingId, date: bucket.date },
        { merge: true },
      );

      const update = {
        totalClicks: FieldValue.increment(bucket.totalClicks),
        totalLinksGenerated: FieldValue.increment(bucket.totalLinksGenerated),
        updatedAt: FieldValue.serverTimestamp(),
      };
      for (const [slug, v] of Object.entries(bucket.slugs)) {
        update[`perLinkBreakdown.${slug}.clicks`] = FieldValue.increment(v.clicks);
        update[`perLinkBreakdown.${slug}.generated`] = FieldValue.increment(v.generated);
      }
      await statsRef.update(update);

      // Mark buffer docs as processed (do NOT delete).
      const refs = bucket.refs;
      for (let i = 0; i < refs.length; i += 450) {
        const batch = db.batch();
        refs.slice(i, i + 450).forEach((r) =>
          batch.update(r, {
            processed: true,
            processedAt: FieldValue.serverTimestamp(),
          }),
        );
        await batch.commit();
        markedProcessed += Math.min(450, refs.length - i);
      }
    }

    console.log(
      `aggregateAnalytics: merged ${snap.size} buffer docs into ${buckets.size} day buckets; marked ${markedProcessed} processed`,
    );
  },
);

// ────────────────────────────────────────────────────────────────────────────
// Daily cleanup — deletes processed buffer docs older than 60 days
// ────────────────────────────────────────────────────────────────────────────
exports.cleanupRawBuffer = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "Etc/UTC",
    memory: "256MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const cutoff = daysAgoDateStr(RETENTION_DAYS);

    let totalDeleted = 0;
    // Page through to stay within batch limits even with a large backlog.
    // We only ever touch docs that are BOTH processed AND older than cutoff.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const snap = await db
        .collectionGroup(BUFFER_GROUP)
        .where("processed", "==", true)
        .where("date", "<", cutoff)
        .limit(450)
        .get();
      if (snap.empty) break;

      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      totalDeleted += snap.size;
      if (snap.size < 450) break;
    }

    console.log(
      `cleanupRawBuffer: deleted ${totalDeleted} processed buffer docs older than ${cutoff}`,
    );
  },
);
