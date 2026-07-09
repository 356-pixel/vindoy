## What needs to change

**Firestore rules:** yes — add a block for `config/bannerAd`. Your current rules have no match for the `config` collection, so writes (and reads) are denied by default. That's why Post Ads fails.

**Storage rules:** no changes. The banner image is stored as a base64 data URL inside the Firestore document (compressed to ~40 KB), not uploaded to Firebase Storage, so the existing storage rules are irrelevant here.

## Updated Firestore rules to paste into Firebase Console

Add this block inside `match /databases/{database}/documents { ... }`, alongside the existing collections:

```text
match /config/{docId} {
  allow read: if true;
  allow write: if true;
}
```

Full file with the addition in place:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /videos/{videoId} {
      allow read, write: if true;
    }
    match /previews/{previewId} {
      allow read, write: if true;
    }
    match /articles/{articleId} {
      allow read, write: if true;
    }
    match /settings/{docId} {
      allow read, write: if true;
    }
    match /config/{docId} {
      allow read: if true;
      allow write: if true;
    }
    match /tracking_analytics/{tid} {
      allow read: if true;
      allow create: if true;
      allow update: if
        request.resource.data.totalClicks >= resource.data.totalClicks
        && request.resource.data.totalLinksGenerated >= resource.data.totalLinksGenerated
        && (request.resource.data.totalClicks - resource.data.totalClicks) <= 2
        && (request.resource.data.totalLinksGenerated - resource.data.totalLinksGenerated) <= 2;
    }
    match /tracking_analytics/{tid}/links/{slug} {
      allow read: if true;
      allow create: if true;
      allow update: if
        request.resource.data.clicks >= resource.data.clicks
        && (request.resource.data.clicks - resource.data.clicks) <= 2;
    }
    match /tracking_analytics/{tid}/days/{date} {
      allow read: if true;
      allow create: if true;
      allow update: if
        request.resource.data.clicks >= resource.data.clicks
        && request.resource.data.linksGenerated >= resource.data.linksGenerated
        && (request.resource.data.clicks - resource.data.clicks) <= 2
        && (request.resource.data.linksGenerated - resource.data.linksGenerated) <= 2;
    }
  }
}
```

## Sync the repo's `firestore.rules`

I'll also replace the placeholder `firestore.rules` I added earlier with your real ruleset (including the new `config` block) so the repo matches the live rules and future `firebase deploy --only firestore:rules` deploys don't wipe anything out.

## Steps

1. Update `firestore.rules` in the repo with the full ruleset above.
2. You paste the same rules into Firebase Console → Firestore → Rules → Publish (or run `firebase deploy --only firestore:rules`).
3. Retry Post Ads in the admin dashboard — it should succeed and preview pages should render the new banner.