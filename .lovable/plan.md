## Why the post is failing

Almost certainly yes — this is a Firestore Security Rules issue, not a code bug. The `BannerAdManager` writes to `config/bannerAd` via `setDoc()`, but your Firestore project has no rule that allows public writes to the `config` collection. The Admin dashboard is protected only by a client-side password (`sessionStorage`), so Firebase itself sees the request as an unauthenticated write and rejects it. The other collections you already use (like `videos` / `previews`) presumably have their own permissive rules, which is why those work.

## Plan to fix

1. **Add a `firestore.rules` file** to the repo so the rules live in source control alongside the app.
2. **Allow reads for everyone** on `config/bannerAd` (preview pages need it) and **allow writes** so the admin dashboard can update it. Since there is no Firebase Auth in the project, the write rule will be open at the Firestore level — the admin password gate stays as the app-level guard (same security posture you already have for the rest of the admin actions).
3. **Wire the rules file into `firebase.json`** under a `"firestore"` block so `firebase deploy --only firestore:rules` picks it up.
4. **Preserve existing rules** for other collections (`videos`, `previews`, etc.) by including a catch-all that keeps them working exactly as they do today. If you'd rather I mirror your current live rules exactly, share them and I'll drop them in verbatim.
5. **You deploy the rules** once with `firebase deploy --only firestore:rules` (or paste them into the Firebase Console → Firestore → Rules). Lovable can't push rules to Firebase for you.

### Rules that will be written (technical detail)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Banner ad config — public read, open write (admin gated in-app by password)
    match /config/bannerAd {
      allow read: if true;
      allow write: if true;
    }

    // Keep your other collections working as they do today
    match /{document=**} {
      allow read, write: if true;  // placeholder — replace with your current rules
    }
  }
}
```

## Alternative worth considering

If you want the write to be truly protected at the database layer (not just behind a client password), the better long-term fix is to add Firebase Auth for the admin user and gate the write rule on `request.auth.uid`. Let me know if you want that instead — it's a bigger change (login flow, auth state, one admin account) but properly secure.

## Verification after deploy

- Open Admin → Banner Ads, upload an image, click **Post Ads** → toast should say "Banner ad updated on preview pages".
- Open any preview page → new banner + title + destination link render.
- If it still fails, check the browser console for the exact Firestore error (`permission-denied` confirms it's still a rules issue; anything else points elsewhere).