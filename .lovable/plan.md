## Admin Dashboard updates (UI/display only — no tracking-write changes)

### 1. Configurable minimum-clicks filter
- Add `export const MIN_CLICKS_DISPLAY = 25;` to `src/lib/adminConfig.ts` (single source of truth, easy to change later).
- In `src/pages/Admin.tsx`, import it and apply `totalClicks >= MIN_CLICKS_DISPLAY` to:
  - **Main table rows** — filter `rows` before render.
  - **Expandable per-link list** — filter `sortedLinks` by `l.clicks >= MIN_CLICKS_DISPLAY`.
  - **Tracking ID dropdown** — `trackingOptions` only lists IDs whose `totalClicks >= MIN_CLICKS_DISPLAY`.
- **Not applied** to the Today / Week / Month summary cards (they keep using the full dataset via `sumDays`).
- Empty-state copy updated to mention the threshold ("No tracking IDs with ≥ N clicks in this range").

### 2. Tracking-ID dropdown always offers `PML`
- After computing the filtered `trackingOptions`, union with every entry from `ALLOWED_TRACKING_IDS` (currently `["PML"]`) so admin-issued IDs always appear even when they have 0 clicks or no docs yet.

### 3. Make the countdown timer actually tick down
- Current bug: when `cacheTs === 0` (first load before fetch finishes), `target` is computed as `now + REFRESH_MS` every tick, so the displayed time never decreases.
- Fix in `RefreshCountdown`: if `cacheTs` is 0, render `--:--:--` (or hide) until a real `cacheTs` arrives; only compute `target = cacheTs + REFRESH_MS` when `cacheTs > 0`.
- Also ensure `refresh()` sets `cacheTs` from the cache's stored timestamp (already done) and that `setCacheTs(Date.now())` is called after a forced refresh (already done) — verify no race resets it to 0.

### 4. Review of your new Firestore rules
The `tracking_analytics/{tid}` root-doc rule is sensible for the per-click increment guard, **but it has gaps that will break the current client analytics code**:

1. **Subcollections are not covered.** Our code writes to:
   - `tracking_analytics/{tid}/links/{slug}`
   - `tracking_analytics/{tid}/days/{YYYY-MM-DD}`
   
   With rules v2, subcollections do **not** inherit the parent's `allow`. Without an explicit match they default to deny, so every `recordClick` / `recordLinkGenerated` call will fail on the link + day writes (the root-doc write may succeed, leaving counters out of sync with per-link and daily aggregates — the expandable table and the Today/Week/Month cards will stop updating).
   
   Add:
   ```
   match /tracking_analytics/{tid}/links/{slug} {
     allow read: if true;
     allow create: if true;
     allow update: if request.resource.data.clicks >= resource.data.clicks
                   && (request.resource.data.clicks - resource.data.clicks) <= 2;
   }
   match /tracking_analytics/{tid}/days/{date} {
     allow read: if true;
     allow create: if true;
     allow update: if request.resource.data.clicks >= resource.data.clicks
                   && request.resource.data.linksGenerated >= resource.data.linksGenerated
                   && (request.resource.data.clicks - resource.data.clicks) <= 2;
   }
   ```

2. **`recordLinkGenerated` updates the root doc** with `totalLinksGenerated: increment(1)` but no `totalClicks`. Because the rule requires `request.resource.data.totalClicks >= resource.data.totalClicks`, this is fine on updates (merge keeps the existing value, so they're equal), but it will **fail the first time a tracking ID generates a link before any click** if you treat that write as an update — currently it's a create (allowed), so OK. Just be aware.

3. **`<= 2` delta cap** is fine for one click per page load, but if a user double-clicks the "Get Video Link" button or React StrictMode replays in dev, you may occasionally exceed it. Consider `<= 5` for headroom.

4. Listing all docs in `tracking_analytics` requires `list` permission — `allow read` covers `get` and `list` in v2, so the admin dashboard's `getDocs(collection(...))` will work.

I'll wait for your go-ahead before changing the rules; the code changes above (items 1–3) are safe to ship now.

### Files touched (code side)
- `src/lib/adminConfig.ts` — add `MIN_CLICKS_DISPLAY`.
- `src/pages/Admin.tsx` — apply filter, union dropdown with allow-list, fix countdown initial state.

No changes to write paths, auth, routing, shortener, or any non-admin code.