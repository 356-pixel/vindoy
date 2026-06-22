/**
 * Vindoy analytics aggregation.
 *
 * Runs every 4 hours via Cloud Scheduler. Reads unprocessed docs from
 * `raw_counters`, aggregates per (trackingId, date, hourBatch) into
 * `analytics_stats`, then deletes the processed raw docs (resetting their
 * counters). Only data within the last 60 days is touched; anything older
 * is purged unprocessed.
 *
 * Deploy:
 *   cd functions && npm install
 *   firebase deploy --only functions
 *
 * The schedule uses Cloud Scheduler automatically via onSchedule().
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const BATCH_HOURS = 4;
const RETENTION_DAYS = 60;
const RAW = "raw_counters";
const STATS = "analytics_stats";

function utcDateString(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return utcDateString(d);
}

exports.aggregateAnalytics = onSchedule(
  {
    schedule: `every ${BATCH_HOURS} hours`,
    timeZone: "Etc/UTC",
    memory: "256MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const retentionFloor = daysAgo(RETENTION_DAYS);

    // 1. Purge anything older than retention without aggregating it.
    const stale = await db
      .collection(RAW)
      .where("date", "<", retentionFloor)
      .limit(500)
      .get();
    if (!stale.empty) {
      const purge = db.batch();
      stale.docs.forEach((d) => purge.delete(d.ref));
      await purge.commit();
      console.log(`Purged ${stale.size} stale raw counters`);
    }

    // 2. Pull unprocessed docs within retention.
    const snap = await db
      .collection(RAW)
      .where("processed", "==", false)
      .where("date", ">=", retentionFloor)
      .get();

    if (snap.empty) {
      console.log("No raw counters to aggregate");
      return;
    }

    // Aggregate per (trackingId, date, hourBatch).
    const buckets = new Map();
    for (const doc of snap.docs) {
      const data = doc.data();
      const key = `${data.trackingId}__${data.date}__${data.hourBatch}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          trackingId: data.trackingId,
          date: data.date,
          hourBatch: data.hourBatch,
          totalClicks: 0,
          totalLinksGenerated: 0,
          links: {},
          processedRefs: [],
        };
        buckets.set(key, bucket);
      }
      const clicks = data.clicks || 0;
      const links = data.linksGenerated || 0;
      bucket.totalClicks += clicks;
      bucket.totalLinksGenerated += links;
      const slug = data.slug || "_unknown";
      const slot = bucket.links[slug] || { clicks: 0, generated: 0 };
      slot.clicks += clicks;
      slot.generated += links;
      bucket.links[slug] = slot;
      bucket.processedRefs.push(doc.ref);
    }

    let totalDeleted = 0;
    for (const bucket of buckets.values()) {
      const statsId = `${bucket.trackingId}__${bucket.date}__${bucket.hourBatch}`;
      const statsRef = db.collection(STATS).doc(statsId);

      // Build merge payload using FieldValue.increment so re-runs accumulate safely.
      const linksUpdate = {};
      for (const [slug, v] of Object.entries(bucket.links)) {
        linksUpdate[`links.${slug}.clicks`] = FieldValue.increment(v.clicks);
        linksUpdate[`links.${slug}.generated`] = FieldValue.increment(v.generated);
      }

      await statsRef.set(
        {
          trackingId: bucket.trackingId,
          date: bucket.date,
          hourBatch: bucket.hourBatch,
        },
        { merge: true },
      );
      await statsRef.update({
        totalClicks: FieldValue.increment(bucket.totalClicks),
        totalLinksGenerated: FieldValue.increment(bucket.totalLinksGenerated),
        updatedAt: FieldValue.serverTimestamp(),
        ...linksUpdate,
      });

      // Delete the processed raw docs (resets counters). Firestore batch caps at 500.
      const refs = bucket.processedRefs;
      for (let i = 0; i < refs.length; i += 450) {
        const batch = db.batch();
        refs.slice(i, i + 450).forEach((r) => batch.delete(r));
        await batch.commit();
      }
      totalDeleted += refs.length;
    }

    console.log(
      `Aggregated ${snap.size} raw counters into ${buckets.size} stat buckets; deleted ${totalDeleted}`,
    );
  },
);
