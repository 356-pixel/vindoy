/**
 * Cloud Functions intentionally removed.
 *
 * Analytics is now written directly to Firestore from the client using
 * increment() (see src/lib/analytics.ts). There is no aggregation pipeline,
 * no scheduled cleanup, and no raw counter buffer. The admin dashboard
 * caches reads in localStorage and refreshes at most once every 3 hours.
 */

module.exports = {};
